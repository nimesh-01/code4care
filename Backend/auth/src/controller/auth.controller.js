const { validationResult } = require('express-validator')
const userModel = require('../models/user.model')
const Orphanage = require('../models/orphanage.model')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const redis = require('../db/redis')
const { publishToQueue } = require('../broker/broker')
const crypto = require('crypto')

const { uploadBuffer, deleteFile } = require('../services/imagekit.service')

const ADMIN_ID_UPLOAD_ALLOWED_STATUSES = ['pending', 'rejected', 'blocked']

async function registerUser(req, res) {
    try {
        const { username, email, password, fullname: { firstname, lastname }, role } = req.body
        // If caller intends to register an orphanage admin, delegate
        if (role && String(role).toLowerCase() === 'orphanadmin') {
            return registerOrphan(req, res)
        }
        console.log("in regsiter : ")
        const isUserAlreadyExists = await userModel.findOne({
            $or: [
                { username },
                { email }
            ]
        })

        if (isUserAlreadyExists) {
            return res.status(409).json({ message: "Username or email already exists" })
        }

        const hash = await bcrypt.hash(password, 10)

        const user = await userModel.create({
            username,
            email,
            password: hash,
            fullname: { firstname, lastname },
            role: role || 'user'
        })
        await Promise.all([
            publishToQueue('AUTH_NOTIFICATION.USER_CREATED', {
                id: user._id,
                userId: user._id,
                username: user.username,
                email: user.email,
                fullname: user.fullname.firstname,
                role: user.role || 'user',
            }),
            publishToQueue("AUTH_SELLER_DASHBOARD.USER_CREATED", user)
        ])
        const token = jwt.sign({
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role
        }, process.env.JWT_SECRET, { expiresIn: '1d' })
        res.cookie("token", token, {
            httpOnly: true,
            secure: true, // required for sameSite: 'none'
            sameSite: 'none', // required for cross-site cookies
            maxAge: 24 * 60 * 60 * 1000
        })

        res.status(201).json({
            message: "User registered successfully",
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                fullname: user.fullname.firstname,
                role: user.role,
                address: user.address
            }
        })
    } catch (err) {
        console.error("Error in Register User: ", err)
        return res.status(500).json({ message: "Internal Server Error" })
    }
}
async function loginUser(req, res) {
    try {
        const { username, email, password, role } = req.body;

        const query = {};
        if (email) query.email = email;
        if (username) query.username = username;

        const User = await userModel.findOne(query).select("+password +orphanageId");
        if (!User) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const isMatch = await bcrypt.compare(password, User.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid password" });
        }

        if (User.status === 'blocked') {
            return res.status(403).json({
                message: User.blockReason || "Your account has been blocked by the Super Admin team.",
                status: 'blocked',
                blockedBy: 'superAdmin',
                userId: User._id,
                role: User.role,
                reason: User.blockReason || null,
            });
        }

        // For orphanAdmin users, check orphanage status before allowing login
        if (User.role === 'orphanAdmin') {
            // Check if orphanageId exists
            if (!User.orphanageId) {
                return res.status(403).json({
                    message: "No orphanage linked to this account. Please contact support.",
                    status: 'error'
                });
            }
            
            const orphanage = await Orphanage.findById(User.orphanageId);
            if (!orphanage) {
                return res.status(404).json({ message: "Orphanage not found" });
            }

            // Check orphanage status
            if (orphanage.status === 'pending') {
                return res.status(403).json({
                    message: "Your orphanage registration is still under review. Please wait for admin approval.",
                    status: 'pending',
                    orphanageName: orphanage.name
                });
            }

            if (orphanage.status === 'rejected') {
                return res.status(403).json({
                    message: orphanage.verificationNote || "Your orphanage registration has been rejected.",
                    status: 'rejected',
                    orphanageName: orphanage.name,
                    verificationNote: orphanage.verificationNote
                });
            }

            if (orphanage.status === 'blocked') {
                return res.status(403).json({
                    message: orphanage.verificationNote || "Your orphanage has been blocked.",
                    status: 'blocked',
                    orphanageName: orphanage.name,
                    verificationNote: orphanage.verificationNote
                });
            }

            // Only allow login if status is approved/active
            if (!['approved', 'active'].includes(orphanage.status)) {
                return res.status(403).json({
                    message: "Your orphanage is not approved for login.",
                    status: orphanage.status
                });
            }
        }

        // Build token payload
        const tokenPayload = {
            id: User._id,
            username: User.username,
            email: User.email,
            role: User.role || 'user',
        };

        // Include orphanageId for orphanAdmin users
        if (User.role === 'orphanAdmin' && User.orphanageId) {
            tokenPayload.orphanageId = User.orphanageId;
        }

        const token = jwt.sign(
            tokenPayload,
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.cookie("token", token, {
            httpOnly: true,
            secure: true,
            maxAge: 24 * 60 * 60 * 1000,
            sameSite: "None",
        });

        return res.status(200).json({
            message: "User logged in successfully",
            token,
            status: User.status,
            user: {
                id: User._id,
                username: User.username,
                email: User.email,
                fullname: User.fullname.firstname + User.fullname.lastname,
                role: User.role,
                address: User.address,
                status: User.status,
                blockReason: User.blockReason || null,
            },
        });
    } catch (err) {
        console.error("Error in loginUser:", err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}
async function getCurrentUser(req, res) {
    try {
        const userId = req.user.id
        
        // Fetch full user data from database
        const user = await userModel.findById(userId).select('-password')
        if (!user) {
            return res.status(404).json({ message: 'User not found' })
        }
        
        return res.status(200).json({
            message: "Current user fetched successfully",
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                fullname: user.fullname,
                role: user.role,
                phone: user.phone,
                address: user.address,
                profileUrl: user.profileUrl,
                status: user.status,
                blockReason: user.blockReason,
                blockAppeals: user.blockAppeals,
                orphanageId: user.orphanageId,
                adminProfile: user.adminProfile,
                createdAt: user.createdAt
            }
        })
    } catch (err) {
        console.error('Error in getCurrentUser:', err)
        return res.status(500).json({ message: 'Internal Server Error' })
    }
}
async function updateUser(req, res) {
    try {
        const userId = req.user.id

        // fetch current user (include profileFileId)
        const existing = await userModel.findById(userId).select('+profileFileId adminProfile')
        if (!existing) return res.status(404).json({ message: 'User not found' })

        // uniqueness checks for username
        if (req.body.username) {
            const u = await userModel.findOne({ username: req.body.username, _id: { $ne: userId } })
            if (u) return res.status(409).json({ message: 'Username already in use' })
        }
        const update = {}
        const allowed = ['username', 'phone', 'fullname', 'address']
        for (const key of allowed) {
            if (req.body[key] !== undefined) update[key] = req.body[key]
        }

        // handle profile upload if provided
        if (req.file && req.file.buffer) {
            const originalname = req.file.originalname || 'profile'
            const folder = `/users/${userId}`
            const resp = await uploadBuffer(req.file.buffer, `${Date.now()}-${originalname}`, folder, req.file.mimetype)
            const { url, fileId } = resp

            // attempt to delete previous file if present
            try {
                if (existing.profileFileId) await deleteFile(existing.profileFileId)
            } catch (err) {
                console.error('Failed to delete previous profile file:', err)
            }

            update.profileUrl = url
            update.profileFileId = fileId
        }

        const adminProfileInput = req.body.adminProfile
        if (adminProfileInput && typeof adminProfileInput === 'object') {
            const adminProfileUpdate = {}
            const sanitizeString = (value) => {
                if (typeof value !== 'string') return undefined
                const trimmed = value.trim()
                return trimmed.length ? trimmed : undefined
            }

            if (adminProfileInput.designation !== undefined) {
                adminProfileUpdate.designation = sanitizeString(adminProfileInput.designation)
            }
            if (adminProfileInput.gender !== undefined) {
                const genderValue = sanitizeString(adminProfileInput.gender)
                adminProfileUpdate.gender = genderValue ? genderValue.toLowerCase() : undefined
            }
            if (adminProfileInput.alternatePhone !== undefined) {
                adminProfileUpdate.alternatePhone = sanitizeString(adminProfileInput.alternatePhone)
            }
            if (adminProfileInput.alternateEmail !== undefined) {
                const emailValue = sanitizeString(adminProfileInput.alternateEmail)
                adminProfileUpdate.alternateEmail = emailValue ? emailValue.toLowerCase() : undefined
            }
            if (adminProfileInput.governmentIdType !== undefined) {
                const typeValue = sanitizeString(adminProfileInput.governmentIdType)
                adminProfileUpdate.governmentIdType = typeValue ? typeValue.toLowerCase() : undefined
            }
            if (adminProfileInput.dateOfBirth !== undefined) {
                if (adminProfileInput.dateOfBirth) {
                    const dob = new Date(adminProfileInput.dateOfBirth)
                    if (Number.isNaN(dob.getTime())) {
                        return res.status(400).json({ message: 'Invalid date of birth provided' })
                    }
                    adminProfileUpdate.dateOfBirth = dob
                } else {
                    adminProfileUpdate.dateOfBirth = null
                }
            }
            if (adminProfileInput.governmentIdNumber !== undefined) {
                const normalizedGovId = sanitizeString(adminProfileInput.governmentIdNumber)
                if (normalizedGovId) {
                    const upperGovId = normalizedGovId.toUpperCase()
                    const currentGovId = existing.adminProfile?.governmentIdNumber
                    if (!currentGovId || currentGovId !== upperGovId) {
                        const duplicate = await userModel.findOne({
                            _id: { $ne: userId },
                            'adminProfile.governmentIdNumber': upperGovId
                        })
                        if (duplicate) {
                            return res.status(409).json({ message: 'Government ID already registered with another admin' })
                        }
                    }
                    adminProfileUpdate.governmentIdNumber = upperGovId
                } else {
                    adminProfileUpdate.governmentIdNumber = undefined
                }
            }

            if (adminProfileInput.emergencyContact && typeof adminProfileInput.emergencyContact === 'object') {
                const contactUpdate = {}
                if (adminProfileInput.emergencyContact.name !== undefined) {
                    contactUpdate.name = sanitizeString(adminProfileInput.emergencyContact.name)
                }
                if (adminProfileInput.emergencyContact.phone !== undefined) {
                    contactUpdate.phone = sanitizeString(adminProfileInput.emergencyContact.phone)
                }
                if (adminProfileInput.emergencyContact.relation !== undefined) {
                    contactUpdate.relation = sanitizeString(adminProfileInput.emergencyContact.relation)
                }
                const filteredContact = Object.fromEntries(
                    Object.entries(contactUpdate).filter(([, value]) => value !== undefined)
                )
                if (Object.keys(filteredContact).length) {
                    let existingContact = {}
                    if (existing.adminProfile && existing.adminProfile.emergencyContact) {
                        existingContact = typeof existing.adminProfile.emergencyContact.toObject === 'function'
                            ? existing.adminProfile.emergencyContact.toObject()
                            : existing.adminProfile.emergencyContact
                    }
                    adminProfileUpdate.emergencyContact = { ...existingContact, ...filteredContact }
                }
            }

            const filteredProfileUpdate = Object.fromEntries(
                Object.entries(adminProfileUpdate).filter(([, value]) => value !== undefined)
            )
            if (Object.keys(filteredProfileUpdate).length) {
                const baseProfile = existing.adminProfile && typeof existing.adminProfile.toObject === 'function'
                    ? existing.adminProfile.toObject()
                    : existing.adminProfile || {}
                update.adminProfile = { ...baseProfile, ...filteredProfileUpdate }
            }
        }

        if (Object.keys(update).length === 0) {
            return res.status(400).json({ message: 'No fields provided for update' })
        }

        const updated = await userModel.findByIdAndUpdate(userId, { $set: update }, { new: true })

        return res.status(200).json({ message: 'User updated successfully', user: updated })
    } catch (err) {
        console.error('Error in updateUser:', err)
        return res.status(500).json({ message: 'Internal Server Error' })
    }
}
async function logoutUser(req, res) {
    const token = req.cookies.token

    if (token) {
        await redis.set(`Blacklist:${token}`, 'true', 'EX', 24 * 60 * 60)
    }
    res.clearCookie('token', {
        httpOnly: true,
        secure: true,
        sameSite: 'none'
    })
    return res.status(200).json({ message: "Logged out successfully" })
}
async function forgotPassword(req, res) {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User with given email not found' });
        }

        const token = crypto.randomBytes(20).toString('hex');
        // store token in redis with 1 hour expiry
        await redis.set(`PasswordReset:${token}`, user._id.toString(), 'EX', 60 * 60);

        // publish event for sending email (worker handles actual send)
        await publishToQueue('AUTH_NOTIFICATION.PASSWORD_RESET', {
            id: user._id,
            email: user.email,
            token
        });

        return res.status(200).json({ message: 'Password reset initiated. Check your email for instructions.' });
    } catch (err) {
        console.error('Error in forgotPassword:', err);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}
async function resetPassword(req, res) {
    try {
        const { token, newPassword } = req.body;
        if (!token || !newPassword) {
            return res.status(400).json({ message: 'Token and newPassword are required' });
        }

        const key = `PasswordReset:${token}`;
        const userId = await redis.get(key);
        if (!userId) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        const hash = await bcrypt.hash(newPassword, 10);

        const user = await userModel.findByIdAndUpdate(userId, { password: hash }, { new: true }).select('+password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // remove token from redis
        await redis.del(key);

        // optionally publish event
        await publishToQueue('AUTH_NOTIFICATION.PASSWORD_RESET_COMPLETED', { id: user._id, email: user.email });

        return res.status(200).json({ message: 'Password has been reset successfully' });
    } catch (err) {
        console.error('Error in resetPassword:', err);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}
async function registerOrphan(req, res) {
    try {
        const {
            username,
            email,
            password,
            fullname = {},
            phone,
            adminProfile: adminProfileInput = {}
        } = req.body
        const { firstname, lastname = '' } = fullname
        const orphanageData = req.body.orphanage || req.body // allow nested or top-level

        if (!firstname) {
            return res.status(400).json({ message: 'Firstname is required' })
        }

        // check existing user
        const isUserAlreadyExists = await userModel.findOne({ $or: [{ username }, { email }] })
        if (isUserAlreadyExists) {
            return res.status(409).json({ message: 'Username or email already exists' })
        }

        // ensure admin profile exists
        if (typeof adminProfileInput !== 'object') {
            return res.status(400).json({ message: 'Admin profile information is required' })
        }

        const requiredAdminFields = ['designation', 'governmentIdType', 'governmentIdNumber']
        for (const field of requiredAdminFields) {
            if (!adminProfileInput[field]) {
                return res.status(400).json({ message: `${field} is required for orphanage admins` })
            }
        }

        if (!adminProfileInput.emergencyContact || !adminProfileInput.emergencyContact.name || !adminProfileInput.emergencyContact.phone) {
            return res.status(400).json({ message: 'Emergency contact name and phone are required' })
        }

        let parsedDob = null
        if (adminProfileInput.dateOfBirth) {
            const dob = new Date(adminProfileInput.dateOfBirth)
            if (Number.isNaN(dob.getTime())) {
                return res.status(400).json({ message: 'Invalid date of birth provided' })
            }
            parsedDob = dob
        }

        const normalizedGovernmentId = adminProfileInput.governmentIdNumber?.toUpperCase()
        const normalizedGovernmentIdType = adminProfileInput.governmentIdType?.toLowerCase()
        if (normalizedGovernmentId) {
            const existingGovId = await userModel.findOne({ 'adminProfile.governmentIdNumber': normalizedGovernmentId })
            if (existingGovId) {
                return res.status(409).json({ message: 'Government ID already registered with another admin' })
            }
        }

        // check orphanage registration number uniqueness if provided
        if (orphanageData.registrationNumber) {
            const existingOrphanage = await Orphanage.findOne({ registrationNumber: orphanageData.registrationNumber })
            if (existingOrphanage) {
                return res.status(409).json({ message: 'Orphanage with this registration number already exists' })
            }
        }

        const hash = await bcrypt.hash(password, 10)

        const adminProfilePayload = {
            designation: adminProfileInput.designation?.trim(),
            gender: adminProfileInput.gender || undefined,
            dateOfBirth: parsedDob || undefined,
            alternateEmail: adminProfileInput.alternateEmail?.trim().toLowerCase() || undefined,
            alternatePhone: adminProfileInput.alternatePhone || undefined,
            governmentIdType: normalizedGovernmentIdType,
            governmentIdNumber: normalizedGovernmentId,
            emergencyContact: {
                name: adminProfileInput.emergencyContact.name?.trim(),
                relation: adminProfileInput.emergencyContact.relation?.trim() || 'Primary Contact',
                phone: adminProfileInput.emergencyContact.phone?.trim()
            }
        }

        Object.keys(adminProfilePayload).forEach((key) => {
            if (adminProfilePayload[key] === undefined || adminProfilePayload[key] === null) {
                delete adminProfilePayload[key]
            }
        })
        if (adminProfilePayload.emergencyContact) {
            const contact = adminProfilePayload.emergencyContact
            Object.keys(contact).forEach((key) => {
                if (contact[key] === undefined || contact[key] === null) {
                    delete contact[key]
                }
            })
        }

        const user = await userModel.create({
            username,
            email,
            password: hash,
            fullname: { firstname, lastname },
            role: 'orphanAdmin',
            phone,
            adminProfile: adminProfilePayload
        })

        // Build orphanage payload
        const orphanagePayload = {
            name: orphanageData.name,
            registrationNumber: orphanageData.registrationNumber,
            orphanage_mail: orphanageData.orphanage_mail,
            orphanage_phone: orphanageData.orphanage_phone,
            address: orphanageData.address || {},
            documents: orphanageData.documents || {},
            orphanAdmin: user._id,
            description: orphanageData.description,
            website: orphanageData.website,
            establishedYear: orphanageData.establishedYear,
            totalChildren: orphanageData.totalChildren
        }

        const orphanage = await Orphanage.create(orphanagePayload)

        // link orphanage to user
        user.orphanageId = orphanage._id
        await user.save()

        // publish events
        await Promise.all([
            publishToQueue('AUTH_NOTIFICATION.ORPHANAGE_ADMIN_CREATED', {
                id: user._id,
                userId: user._id,
                email: user.email,
                username: user.username,
                fullname: `${firstname} ${lastname || ''}`.trim(),
                orphanageName: orphanage.name,
                role: 'orphanAdmin',
            }),
            publishToQueue('ORPHANAGE.CREATED', orphanage)
        ])

        return res.status(201).json({
            message: 'Registration successful! Your orphanage is under review. You will be able to login once our team verifies your documents and approves your registration.',
            status: 'pending',
            user: { id: user._id, username: user.username, email: user.email, role: user.role, adminProfile: user.adminProfile },
            orphanage: { id: orphanage._id, name: orphanage.name, status: orphanage.status }
        })
    } catch (err) {
        console.error('Error in registerOrphan:', err)
        return res.status(500).json({ message: 'Internal Server Error' })
    }
}
async function updateOrphanage(req, res) {
    try {
        const userId = req.user.id

        // fetch fresh user to check role and orphanage linkage
        const user = await userModel.findById(userId).select('role orphanageId')
        if (!user) return res.status(404).json({ message: 'User not found' })
        if (user.role !== 'orphanAdmin') return res.status(403).json({ message: 'Forbidden: only orphanAdmin can update orphanage' })

        // find orphanage owned by this admin
        const orphanage = await Orphanage.findOne({ _id: user.orphanageId, orphanAdmin: user._id })
        if (!orphanage) return res.status(404).json({ message: 'Orphanage not found for this admin' })

        // Build update payload only with allowed fields
        const allowed = ['name', 'orphanage_mail', 'orphanage_phone', 'address', 'documents']
        const update = {}
        for (const key of allowed) {
            if (req.body[key] !== undefined) update[key] = req.body[key]
        }

        if (Object.keys(update).length === 0) {
            return res.status(400).json({ message: 'No valid fields provided for update' })
        }

        const updated = await Orphanage.findByIdAndUpdate(orphanage._id, { $set: update }, { new: true })

        return res.status(200).json({ message: 'Orphanage updated successfully', orphanage: updated })
    } catch (err) {
        console.error('Error in updateOrphanage:', err)
        return res.status(500).json({ message: 'Internal Server Error' })
    }
}
async function getOrphanage(req, res) {
    try {
        const userId = req.user.id

        const user = await userModel.findById(userId).select('role orphanageId')
        if (!user) return res.status(404).json({ message: 'User not found' })
        if (user.role !== 'orphanAdmin') return res.status(403).json({ message: 'Forbidden: only orphanAdmin can view orphanage' })

        const orphanage = await Orphanage.findOne({ _id: user.orphanageId, orphanAdmin: user._id })
        if (!orphanage) return res.status(404).json({ message: 'Orphanage not found for this admin' })

        return res.status(200).json({ message: 'Orphanage fetched successfully', orphanage })
    } catch (err) {
        console.error('Error in getOrphanage:', err)
        return res.status(500).json({ message: 'Internal Server Error' })
    }
}

async function listOrphanages(req, res) {
    try {
        const role = req.user?.role || req.user?.type
        if (role === 'orphanAdmin') return res.status(403).json({ message: 'Forbidden: orphanAdmin cannot use this route' })

        const { state, city, limit = 100, page = 1 } = req.query
        const query = {}
        if (state) query['address.state'] = { $regex: `^${state}$`, $options: 'i' }
        if (city) query['address.city'] = { $regex: `^${city}$`, $options: 'i' }

        const perPage = Math.min(parseInt(limit, 10) || 6, 500)
        const currentPage = Math.max(parseInt(page, 10) || 1, 1)
        const skip = (currentPage - 1) * perPage

        const [orphanages, totalCount] = await Promise.all([
            Orphanage.find(query).skip(skip).limit(perPage),
            Orphanage.countDocuments(query)
        ])
        const totalPages = Math.ceil(totalCount / perPage)
        return res.status(200).json({
            orphanages,
            pagination: { currentPage, totalPages, totalCount, hasMore: currentPage < totalPages }
        })
    } catch (err) {
        console.error('Error in listOrphanages:', err)
        return res.status(500).json({ message: 'Internal Server Error' })
    }
}

async function uploadAdminIdDocumentPublic(req, res) {
    try {
        const { userId } = req.params
        const admin = await userModel.findById(userId).select('role status adminProfile')
        if (!admin) return res.status(404).json({ message: 'Admin user not found' })
        if (admin.role !== 'orphanAdmin') {
            return res.status(403).json({ message: 'Only orphanage admins can upload ID documents' })
        }

        if (!ADMIN_ID_UPLOAD_ALLOWED_STATUSES.includes(admin.status)) {
            return res.status(403).json({
                message: 'Public ID upload is allowed only while verification is pending or under review'
            })
        }

        if (!req.file || !req.file.buffer) {
            return res.status(400).json({ message: 'No document uploaded' })
        }

        const { originalname } = req.file
        const folder = `/orphanAdmins/${admin._id}/identity`
        const resp = await uploadBuffer(
            req.file.buffer,
            `${Date.now()}-${originalname}`,
            folder,
            req.file.mimetype
        )

        admin.adminProfile = admin.adminProfile || {}
        const previousFileId = admin.adminProfile.governmentIdDocument?.fileId
        if (previousFileId) {
            try {
                await deleteFile(previousFileId)
            } catch (err) {
                console.error('Failed to delete previous admin ID document:', err)
            }
        }
        admin.adminProfile.governmentIdDocument = {
            url: resp.url,
            fileId: resp.fileId
        }
        await admin.save()

        return res.status(200).json({
            message: 'Government ID document uploaded successfully',
            document: admin.adminProfile.governmentIdDocument
        })
    } catch (err) {
        console.error('Error in uploadAdminIdDocumentPublic:', err)
        return res.status(500).json({ message: 'Internal Server Error' })
    }
}

async function uploadOrphanageDocument(req, res) {
    try {
        console.log('we are in uploadOrphanageDocument ')
        const userId = req.user.id
        const user = await userModel.findById(userId).select('role orphanageId')
        if (!user) return res.status(404).json({ message: 'User not found' })
        if (user.role !== 'orphanAdmin') return res.status(403).json({ message: 'Forbidden: only orphanAdmin can upload documents' })
        const orphanage = await Orphanage.findOne({ _id: user.orphanageId, orphanAdmin: user._id })
        if (!orphanage) return res.status(404).json({ message: 'Orphanage not found for this admin' })

        if (!req.file || !req.file.buffer) return res.status(400).json({ message: 'No file uploaded' })
        console.log(req.file)

        const { originalname } = req.file
        const field = req.body.field || 'otherDocuments' // expected: registrationCertificate | governmentLicense | otherDocuments
        console.log(field)
        const folder = `/orphanages/${orphanage._id}`
        // Ensure ImageKit is configured before attempting upload

        const resp = await uploadBuffer(
            req.file.buffer,
            `${Date.now()}-${originalname}`,
            folder,
            req.file.mimetype
        );

        const { url, fileId } = resp;
        console.log(resp);
        if (field === 'registrationCertificate' || field === 'governmentLicense') {
            const key = `documents.${field}`;
            const updated = await Orphanage.findByIdAndUpdate(
                orphanage._id,
                { $set: { [key]: { url, fileId } } },
                { new: true }
            );
            return res.status(200).json({ message: 'Document uploaded', url, fileId, orphanage: updated });
        }

        // push into otherDocuments (store document name + url + fileId)
        const docName = req.body.name || originalname
        const updated = await Orphanage.findByIdAndUpdate(
            orphanage._id,
            { $push: { 'documents.otherDocuments': { name: docName, url, fileId } } },
            { new: true }
        );
        return res.status(200).json({ message: 'Document uploaded', name: docName, url, fileId, orphanage: updated });
    } catch (err) {
        console.error('Error in uploadOrphanageDocument:', err)
        return res.status(500).json({ message: 'Internal Server Error' })
    }
}

async function deleteOrphanageDocument(req, res) {
    try {
        const userId = req.user.id
        const user = await userModel.findById(userId).select('role orphanageId')
        if (!user) return res.status(404).json({ message: 'User not found' })
        if (user.role !== 'orphanAdmin') return res.status(403).json({ message: 'Forbidden: only orphanAdmin can delete documents' })
        const orphanage = await Orphanage.findOne({ _id: user.orphanageId, orphanAdmin: user._id })
        if (!orphanage) return res.status(404).json({ message: 'Orphanage not found for this admin' })

        const { field, fileId } = req.body
        if (!field || !fileId) return res.status(400).json({ message: 'Both field and fileId are required' })

        // attempt to delete from ImageKit; if deletion fails, still attempt DB cleanup depending on error.
        try {
            await deleteFile(fileId)
        } catch (err) {
            console.error('ImageKit delete failed:', err)
            // continue to attempt DB cleanup
        }

        let updated
        if (field === 'registrationCertificate' || field === 'governmentLicense') {
            const key = `documents.${field}`
            updated = await Orphanage.findByIdAndUpdate(orphanage._id, { $set: { [key]: { url: null, fileId: null } } }, { new: true })
            return res.status(200).json({ message: 'Document deleted', fileId, orphanage: updated })
        }

        // otherDocuments: remove matching fileId
        updated = await Orphanage.findByIdAndUpdate(orphanage._id, { $pull: { 'documents.otherDocuments': { fileId } } }, { new: true })
        return res.status(200).json({ message: 'Document deleted', fileId, orphanage: updated })
    } catch (err) {
        console.error('Error in deleteOrphanageDocument:', err)
        return res.status(500).json({ message: 'Internal Server Error' })
    }
}

// Get user by ID (for inter-service communication)
async function getUserById(req, res) {
    try {
        const { userId } = req.params
        const userDoc = await userModel
            .findById(userId)
            .select('-password')
            .populate({
                path: 'orphanageId',
                select: 'name registrationNumber orphanage_mail orphanage_phone address status verificationNote description gallery totalChildren createdAt approvedAt coverImage website orphanAdmin',
                populate: {
                    path: 'orphanAdmin',
                    select: 'fullname email phone username profileUrl status',
                },
            })

        if (!userDoc) return res.status(404).json({ message: 'User not found' })

        const user = userDoc.toObject({ virtuals: true })
        if (user.orphanageId && typeof user.orphanageId === 'object') {
            const orphanage = { ...user.orphanageId }
            if (orphanage._id) {
                orphanage._id = orphanage._id.toString()
            }
            user.orphanage = orphanage
            user.orphanageId = orphanage._id || null
        } else if (user.orphanageId) {
            user.orphanageId = user.orphanageId.toString()
        }

        return res.status(200).json({ user })
    } catch (err) {
        console.error('Error in getUserById:', err)
        return res.status(500).json({ message: 'Internal Server Error' })
    }
}

// Get multiple users by IDs (batch lookup)
async function getUsersBatch(req, res) {
    try {
        const { ids } = req.body
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: 'ids array is required' })
        }
        // Limit to 100 IDs per request
        const limitedIds = ids.slice(0, 100)
        const users = await userModel.find({ _id: { $in: limitedIds } })
            .select('username fullname profileUrl role')
            .lean()
        return res.status(200).json({ users })
    } catch (err) {
        console.error('Error in getUsersBatch:', err)
        return res.status(500).json({ message: 'Internal Server Error' })
    }
}

// Get orphanage by ID (for inter-service communication)
async function getOrphanageById(req, res) {
    try {
        const { orphanageId } = req.params
        const orphanage = await Orphanage.findById(orphanageId)
        if (!orphanage) return res.status(404).json({ message: 'Orphanage not found' })
        return res.status(200).json({ orphanage })
    } catch (err) {
        console.error('Error in getOrphanageById:', err)
        return res.status(500).json({ message: 'Internal Server Error' })
    }
}

// Public document upload for pending orphanages during registration (no auth required)
async function uploadOrphanageDocumentPublic(req, res) {
    try {
        const { orphanageId } = req.params
        const orphanage = await Orphanage.findById(orphanageId)
        if (!orphanage) {
            return res.status(404).json({ message: 'Orphanage not found' })
        }
        
        // Only allow public upload for pending orphanages
        if (orphanage.status !== 'pending') {
            return res.status(403).json({ 
                message: 'Public document upload only allowed for pending orphanages. Please login to update documents.'
            })
        }
        
        if (!req.file || !req.file.buffer) {
            return res.status(400).json({ message: 'No file uploaded' })
        }
        
        const { originalname } = req.file
        const field = req.body.field || 'otherDocuments'
        const folder = `/orphanages/${orphanage._id}`
        
        const resp = await uploadBuffer(
            req.file.buffer,
            `${Date.now()}-${originalname}`,
            folder,
            req.file.mimetype
        )
        
        const { url, fileId } = resp
        
        if (field === 'registrationCertificate' || field === 'governmentLicense') {
            const key = `documents.${field}`
            const updated = await Orphanage.findByIdAndUpdate(
                orphanage._id,
                { $set: { [key]: { url, fileId } } },
                { new: true }
            )
            return res.status(200).json({ message: 'Document uploaded', url, fileId, orphanage: updated })
        }
        
        // Push into otherDocuments
        const docName = req.body.name || originalname
        const updated = await Orphanage.findByIdAndUpdate(
            orphanage._id,
            { $push: { 'documents.otherDocuments': { name: docName, url, fileId } } },
            { new: true }
        )
        return res.status(200).json({ message: 'Document uploaded', name: docName, url, fileId, orphanage: updated })
    } catch (err) {
        console.error('Error in uploadOrphanageDocumentPublic:', err)
        return res.status(500).json({ message: 'Internal Server Error' })
    }
}

// Public platform stats (no auth required)
async function getPlatformStats(req, res) {
    try {
        const activeStatuses = ['pending', 'approved']
        const [totalOrphanages, totalVolunteers, totalUsers, citiesAgg] = await Promise.all([
            Orphanage.countDocuments({ status: { $in: activeStatuses } }),
            userModel.countDocuments({ role: 'volunteer', status: 'active' }),
            userModel.countDocuments({ role: { $in: ['user', 'volunteer'] }, status: 'active' }),
            Orphanage.aggregate([
                { $match: { status: { $in: activeStatuses }, 'address.city': { $exists: true, $ne: '' } } },
                { $group: { _id: { $toLower: '$address.city' } } },
                { $count: 'count' }
            ])
        ])

        return res.status(200).json({
            totalOrphanages,
            totalVolunteers,
            totalUsers,
            citiesCovered: citiesAgg[0]?.count || 0
        })
    } catch (err) {
        console.error('Error in getPlatformStats:', err)
        return res.status(500).json({ message: 'Internal Server Error' })
    }
}

async function submitBlockAppeal(req, res) {
    try {
        const { message, identifier, userId, role } = req.body
        if (!message || !message.trim()) {
            return res.status(400).json({ message: 'Appeal message is required' })
        }

        let user = null
        if (userId) {
            user = await userModel.findById(userId)
        }
        if (!user && identifier) {
            user = await userModel.findOne({
                $or: [
                    { email: identifier },
                    { username: identifier }
                ]
            })
        }

        if (!user) {
            return res.status(404).json({ message: 'User not found' })
        }

        const appealEntry = {
            message: message.trim(),
            createdAt: new Date(),
            status: 'pending'
        }

        user.blockAppeals = user.blockAppeals || []
        user.blockAppeals.push(appealEntry)
        await user.save()

        try {
            await publishToQueue('SUPERADMIN_NOTIFICATION.BLOCK_APPEAL', {
                userId: user._id,
                username: user.username,
                role: user.role,
                providedRole: role,
                message: appealEntry.message,
            })
        } catch (err) {
            console.error('Failed to publish block appeal notification:', err)
        }

        return res.status(200).json({ message: 'Appeal submitted successfully', appeal: appealEntry })
    } catch (err) {
        console.error('Error in submitBlockAppeal:', err)
        return res.status(500).json({ message: 'Internal Server Error' })
    }
}

module.exports = { registerUser, registerOrphan, loginUser, getCurrentUser, updateUser, logoutUser, forgotPassword, resetPassword, updateOrphanage, uploadOrphanageDocument, uploadOrphanageDocumentPublic, deleteOrphanageDocument, getOrphanage, listOrphanages, getUserById, getUsersBatch, getOrphanageById, uploadAdminIdDocumentPublic, getPlatformStats, submitBlockAppeal }