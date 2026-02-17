const { validationResult } = require('express-validator')
const userModel = require('../models/user.model')
const Orphanage = require('../models/orphanage.model')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const redis = require('../db/redis')
const { publishToQueue } = require('../broker/broker')
const crypto = require('crypto')

const { uploadBuffer, deleteFile } = require('../services/imagekit.service')

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
                username: user.username,
                email: user.email,
                fullname: user.fullname.firstname,
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
            secure: true,
            maxage: 24 * 60 * 60 * 1000
        })

        res.status(201).json({
            message: "User registered successfully",
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

        const User = await userModel.findOne(query).select("+password orphanageId");
        if (!User) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const isMatch = await bcrypt.compare(password, User.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid password" });
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
            user: {
                id: User._id,
                username: User.username,
                email: User.email,
                fullname: User.fullname.firstname + User.fullname.lastname,
                role: User.role,
                address: User.address,
            },
        });
    } catch (err) {
        console.error("Error in loginUser:", err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}
async function getCurrentUser(req, res) {
    return res.status(200).json({
        message: "Current user fetched successfully",
        user: req.user
    })
}
async function updateUser(req, res) {
    try {
        const userId = req.user.id

        // fetch current user (include profileFileId)
        const existing = await userModel.findById(userId).select('+profileFileId')
        if (!existing) return res.status(404).json({ message: 'User not found' })

        // uniqueness checks for username/email
        if (req.body.username) {
            const u = await userModel.findOne({ username: req.body.username, _id: { $ne: userId } })
            if (u) return res.status(409).json({ message: 'Username already in use' })
        }
        const update = {}
        const allowed = ['username',  'phone', 'fullname', 'address']
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
        secure: true
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
        // Expect user fields + orphanage fields in req.body
        const { username, email, password, fullname: { firstname, lastname }, phone } = req.body
        const orphanageData = req.body.orphanage || req.body; // allow nested or top-level

        // check existing user
        const isUserAlreadyExists = await userModel.findOne({ $or: [{ username }, { email }] })
        if (isUserAlreadyExists) {
            return res.status(409).json({ message: 'Username or email already exists' })
        }

        // check orphanage registration number uniqueness if provided
        if (orphanageData.registrationNumber) {
            const existingOrphanage = await Orphanage.findOne({ registrationNumber: orphanageData.registrationNumber })
            if (existingOrphanage) {
                return res.status(409).json({ message: 'Orphanage with this registration number already exists' })
            }
        }

        const hash = await bcrypt.hash(password, 10)

        const user = await userModel.create({
            username,
            email,
            password: hash,
            fullname: { firstname, lastname },
            role: 'orphanAdmin',
            phone
        })

        // Build orphanage payload
        const orphanagePayload = {
            name: orphanageData.name,
            registrationNumber: orphanageData.registrationNumber,
            orphanage_mail: orphanageData.orphanage_mail,
            orphanage_phone: orphanageData.orphanage_phone,
            address: orphanageData.address || {},
            documents: orphanageData.documents || {},
            orphanAdmin: user._id
        }

        const orphanage = await Orphanage.create(orphanagePayload)

        // link orphanage to user
        user.orphanageId = orphanage._id
        await user.save()

        // publish events
        await Promise.all([
            publishToQueue('AUTH_NOTIFICATION.ORPHANAGE_ADMIN_CREATED', { 
                id: user._id, 
                email: user.email,
                username: user.username,
                fullname: `${firstname} ${lastname || ''}`.trim(),
                orphanageName: orphanage.name
            }),
            publishToQueue('ORPHANAGE.CREATED', orphanage)
        ])

        const token = jwt.sign({ id: user._id, username: user.username, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' })
        res.cookie('token', token, { httpOnly: true, secure: true, maxage: 24 * 60 * 60 * 1000 })

        return res.status(201).json({
            message: 'Orphan admin and orphanage registered successfully',
            user: { id: user._id, username: user.username, email: user.email, role: user.role },
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

        const perPage = Math.min(parseInt(limit, 10) || 100, 500)
        const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * perPage

        const orphanages = await Orphanage.find(query).skip(skip).limit(perPage)
        return res.status(200).json({ orphanages })
    } catch (err) {
        console.error('Error in listOrphanages:', err)
        return res.status(500).json({ message: 'Internal Server Error' })
    }
}

async function uploadOrphanageDocument(req, res) {
    try {
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
        const user = await userModel.findById(userId).select('-password')
        if (!user) return res.status(404).json({ message: 'User not found' })
        return res.status(200).json({ user })
    } catch (err) {
        console.error('Error in getUserById:', err)
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

module.exports = { registerUser, registerOrphan, loginUser, getCurrentUser, updateUser, logoutUser, forgotPassword, resetPassword, updateOrphanage, uploadOrphanageDocument, deleteOrphanageDocument, getOrphanage, listOrphanages, getUserById, getOrphanageById }