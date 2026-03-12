const userModel = require('../models/user.model')
const Orphanage = require('../models/orphanage.model')
const { publishToQueue } = require('../broker/broker')

// Middleware: ensure the caller is a superAdmin
function requireSuperAdmin(req, res, next) {
    if (!req.user || req.user.role !== 'superAdmin') {
        return res.status(403).json({ message: 'Forbidden: Super Admin access required' })
    }
    next()
}

// GET /superadmin/dashboard-stats
async function getDashboardStats(req, res) {
    try {
        const [
            totalOrphanages,
            pendingOrphanages,
            approvedOrphanages,
            rejectedOrphanages,
            blockedOrphanages,
            totalUsers,
            totalVolunteers,
            totalAdmins,
            blockedUsers,
        ] = await Promise.all([
            Orphanage.countDocuments(),
            Orphanage.countDocuments({ status: 'pending' }),
            Orphanage.countDocuments({ status: 'approved' }),
            Orphanage.countDocuments({ status: 'rejected' }),
            Orphanage.countDocuments({ status: 'blocked' }),
            userModel.countDocuments({ role: 'user' }),
            userModel.countDocuments({ role: 'volunteer' }),
            userModel.countDocuments({ role: 'orphanAdmin' }),
            userModel.countDocuments({ status: 'blocked' }),
        ])

        return res.status(200).json({
            totalOrphanages,
            pendingOrphanages,
            approvedOrphanages,
            rejectedOrphanages,
            blockedOrphanages,
            totalUsers,
            totalVolunteers,
            totalAdmins,
            blockedUsers,
        })
    } catch (err) {
        console.error('Error in getDashboardStats:', err)
        return res.status(500).json({ message: 'Internal Server Error' })
    }
}

// GET /superadmin/orphanages?status=pending&page=1&limit=20
async function listAllOrphanages(req, res) {
    try {
        const { status, page = 1, limit = 20, search } = req.query
        const filter = {}
        if (status) filter.status = status
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { registrationNumber: { $regex: search, $options: 'i' } },
                { 'address.city': { $regex: search, $options: 'i' } },
                { 'address.state': { $regex: search, $options: 'i' } },
            ]
        }

        const skip = (parseInt(page) - 1) * parseInt(limit)
        const [orphanages, total] = await Promise.all([
            Orphanage.find(filter)
                .populate('orphanAdmin', 'fullname email phone username adminProfile profileUrl')
                .populate('verifiedBy', 'fullname email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Orphanage.countDocuments(filter),
        ])

        return res.status(200).json({
            orphanages,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
        })
    } catch (err) {
        console.error('Error in listAllOrphanages:', err)
        return res.status(500).json({ message: 'Internal Server Error' })
    }
}

// GET /superadmin/orphanages/:id
async function getOrphanageDetails(req, res) {
    try {
        const orphanage = await Orphanage.findById(req.params.id)
            .populate('orphanAdmin', 'fullname email phone username adminProfile profileUrl status createdAt')
            .populate('verifiedBy', 'fullname email')

        if (!orphanage) {
            return res.status(404).json({ message: 'Orphanage not found' })
        }

        return res.status(200).json({ orphanage })
    } catch (err) {
        console.error('Error in getOrphanageDetails:', err)
        return res.status(500).json({ message: 'Internal Server Error' })
    }
}

// PUT /superadmin/orphanages/:id/verify
async function verifyOrphanage(req, res) {
    try {
        const { status, verificationNote } = req.body
        const allowedStatuses = ['approved', 'rejected', 'blocked']
        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status. Allowed: approved, rejected, blocked' })
        }

        const orphanage = await Orphanage.findById(req.params.id)
        if (!orphanage) {
            return res.status(404).json({ message: 'Orphanage not found' })
        }

        orphanage.status = status
        orphanage.verifiedBy = req.user.id
        orphanage.verificationNote = verificationNote || ''
        if (status === 'approved') {
            orphanage.approvedAt = new Date()
        }
        await orphanage.save()

        // Update the orphan admin's user status
        if (orphanage.orphanAdmin) {
            const adminStatus = status === 'approved' ? 'active' : 'pending'
            await userModel.findByIdAndUpdate(orphanage.orphanAdmin, { status: adminStatus })
        }

        // Notify the orphanage admin
        try {
            await publishToQueue('SUPERADMIN_NOTIFICATION.ORPHANAGE_VERIFIED', {
                orphanageId: orphanage._id,
                orphanageName: orphanage.name,
                status,
                verificationNote: verificationNote || '',
                adminUserId: orphanage.orphanAdmin,
                verifiedBy: req.user.id,
            })
        } catch (e) {
            console.error('Failed to publish verification notification:', e)
        }

        return res.status(200).json({
            message: `Orphanage ${status} successfully`,
            orphanage,
        })
    } catch (err) {
        console.error('Error in verifyOrphanage:', err)
        return res.status(500).json({ message: 'Internal Server Error' })
    }
}

// DELETE /superadmin/orphanages/:id
async function deleteOrphanage(req, res) {
    try {
        const orphanage = await Orphanage.findById(req.params.id)
        if (!orphanage) {
            return res.status(404).json({ message: 'Orphanage not found' })
        }

        // Block the admin user
        if (orphanage.orphanAdmin) {
            await userModel.findByIdAndUpdate(orphanage.orphanAdmin, { status: 'blocked' })
        }

        await Orphanage.findByIdAndDelete(req.params.id)

        return res.status(200).json({ message: 'Orphanage deleted successfully' })
    } catch (err) {
        console.error('Error in deleteOrphanage:', err)
        return res.status(500).json({ message: 'Internal Server Error' })
    }
}

// GET /superadmin/users?role=user&status=active&page=1&limit=20
async function listUsers(req, res) {
    try {
        const { role, status, page = 1, limit = 20, search } = req.query
        const filter = {}
        if (role) filter.role = role
        if (status) filter.status = status
        if (search) {
            filter.$or = [
                { username: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { 'fullname.firstname': { $regex: search, $options: 'i' } },
                { 'fullname.lastname': { $regex: search, $options: 'i' } },
            ]
        }

        // Exclude superAdmin from listing
        filter.role = filter.role ? filter.role : { $ne: 'superAdmin' }

        const skip = (parseInt(page) - 1) * parseInt(limit)
        const [users, total] = await Promise.all([
            userModel.find(filter)
                .select('-password')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            userModel.countDocuments(filter),
        ])

        return res.status(200).json({
            users,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
        })
    } catch (err) {
        console.error('Error in listUsers:', err)
        return res.status(500).json({ message: 'Internal Server Error' })
    }
}

// PUT /superadmin/users/:id/status
async function updateUserStatus(req, res) {
    try {
        const { status } = req.body
        if (!['active', 'blocked'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status. Allowed: active, blocked' })
        }

        const user = await userModel.findById(req.params.id)
        if (!user) {
            return res.status(404).json({ message: 'User not found' })
        }

        if (user.role === 'superAdmin') {
            return res.status(403).json({ message: 'Cannot modify Super Admin status' })
        }

        user.status = status
        await user.save()

        return res.status(200).json({ message: `User ${status} successfully`, user })
    } catch (err) {
        console.error('Error in updateUserStatus:', err)
        return res.status(500).json({ message: 'Internal Server Error' })
    }
}

module.exports = {
    requireSuperAdmin,
    getDashboardStats,
    listAllOrphanages,
    getOrphanageDetails,
    verifyOrphanage,
    deleteOrphanage,
    listUsers,
    updateUserStatus,
}
