const Notification = require('../models/notification.model')

// GET /api/notifications - Get user's notifications (paginated)
const getNotifications = async (req, res) => {
    try {
        const userId = req.user._id || req.user.id
        const page = parseInt(req.query.page) || 1
        const limit = Math.min(parseInt(req.query.limit) || 20, 50)
        const skip = (page - 1) * limit
        const filter = req.query.filter // 'unread', 'read', or undefined for all

        const query = { recipient: userId }
        if (filter === 'unread') query.read = false
        if (filter === 'read') query.read = true

        const [notifications, total] = await Promise.all([
            Notification.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Notification.countDocuments(query),
        ])

        res.status(200).json({
            notifications,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalNotifications: total,
                hasMore: skip + notifications.length < total,
            },
        })
    } catch (err) {
        console.error('Error fetching notifications:', err)
        res.status(500).json({ message: 'Failed to fetch notifications' })
    }
}

// GET /api/notifications/unread-count
const getUnreadCount = async (req, res) => {
    try {
        const userId = req.user._id || req.user.id
        const count = await Notification.countDocuments({ recipient: userId, read: false })
        res.status(200).json({ count })
    } catch (err) {
        console.error('Error fetching unread count:', err)
        res.status(500).json({ message: 'Failed to fetch unread count' })
    }
}

// PUT /api/notifications/:id/read - Mark single notification as read
const markAsRead = async (req, res) => {
    try {
        const userId = req.user._id || req.user.id
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, recipient: userId },
            { read: true, readAt: new Date() },
            { new: true }
        )
        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' })
        }
        res.status(200).json({ notification })
    } catch (err) {
        console.error('Error marking notification as read:', err)
        res.status(500).json({ message: 'Failed to update notification' })
    }
}

// PUT /api/notifications/read-all - Mark all notifications as read
const markAllAsRead = async (req, res) => {
    try {
        const userId = req.user._id || req.user.id
        await Notification.updateMany(
            { recipient: userId, read: false },
            { read: true, readAt: new Date() }
        )
        res.status(200).json({ message: 'All notifications marked as read' })
    } catch (err) {
        console.error('Error marking all as read:', err)
        res.status(500).json({ message: 'Failed to update notifications' })
    }
}

// DELETE /api/notifications/:id - Delete a notification
const deleteNotification = async (req, res) => {
    try {
        const userId = req.user._id || req.user.id
        const notification = await Notification.findOneAndDelete({
            _id: req.params.id,
            recipient: userId,
        })
        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' })
        }
        res.status(200).json({ message: 'Notification deleted' })
    } catch (err) {
        console.error('Error deleting notification:', err)
        res.status(500).json({ message: 'Failed to delete notification' })
    }
}

// DELETE /api/notifications/clear - Clear all read notifications
const clearReadNotifications = async (req, res) => {
    try {
        const userId = req.user._id || req.user.id
        await Notification.deleteMany({ recipient: userId, read: true })
        res.status(200).json({ message: 'Read notifications cleared' })
    } catch (err) {
        console.error('Error clearing notifications:', err)
        res.status(500).json({ message: 'Failed to clear notifications' })
    }
}

// POST /api/notifications/send - Send a notification (internal use / admin)
const sendNotification = async (req, res) => {
    try {
        const { recipientId, recipientRole, type, title, message, data } = req.body

        if (!recipientId || !title || !message) {
            return res.status(400).json({ message: 'recipientId, title, and message are required' })
        }

        const notification = await Notification.create({
            recipient: recipientId,
            recipientRole: recipientRole || 'user',
            type: type || 'general',
            title,
            message,
            data: data || {},
        })

        res.status(201).json({ notification })
    } catch (err) {
        console.error('Error sending notification:', err)
        res.status(500).json({ message: 'Failed to send notification' })
    }
}

// POST /api/notifications/send-bulk - Send notification to multiple recipients (admin)
const sendBulkNotifications = async (req, res) => {
    try {
        const { recipientIds, recipientRole, type, title, message, data } = req.body

        if (!recipientIds || !Array.isArray(recipientIds) || recipientIds.length === 0) {
            return res.status(400).json({ message: 'recipientIds array is required' })
        }
        if (!title || !message) {
            return res.status(400).json({ message: 'title and message are required' })
        }

        const docs = recipientIds.map(id => ({
            recipient: id,
            recipientRole: recipientRole || 'user',
            type: type || 'general',
            title,
            message,
            data: data || {},
        }))

        const notifications = await Notification.insertMany(docs)
        res.status(201).json({ count: notifications.length, message: `Sent to ${notifications.length} recipients` })
    } catch (err) {
        console.error('Error sending bulk notifications:', err)
        res.status(500).json({ message: 'Failed to send bulk notifications' })
    }
}

module.exports = {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearReadNotifications,
    sendNotification,
    sendBulkNotifications,
}
