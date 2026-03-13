const axios = require('axios')
const Notification = require('../models/notification.model')

const authBaseEnv = process.env.AUTH_SERVICE_BASE_URL || process.env.AUTH_SERVICE_URL || 'http://localhost:3000'
const AUTH_SERVICE_URL = authBaseEnv.replace(/\/$/, '')
const DEFAULT_BROADCAST_ROLES = ['user', 'volunteer', 'orphanAdmin']
const ROLE_PAGE_LIMIT = 200
const USER_BATCH_LIMIT = 100
const BROADCAST_MIN_INTERVAL_MS = Math.max(parseInt(process.env.BROADCAST_MIN_INTERVAL_MS || '60000', 10) || 0, 0)

let lastBroadcastAt = 0

const chunkArray = (items, chunkSize) => {
    if (!Array.isArray(items) || items.length === 0) return []
    if (!chunkSize || chunkSize <= 0) return [items]
    const chunks = []
    for (let i = 0; i < items.length; i += chunkSize) {
        chunks.push(items.slice(i, i + chunkSize))
    }
    return chunks
}

const forwardAuthHeaders = (req) => {
    const headers = {}
    const authHeader = req.headers.authorization || req.headers.Authorization
    if (authHeader) {
        headers.Authorization = authHeader
    }
    if (req.headers.cookie) {
        headers.Cookie = req.headers.cookie
    }
    return headers
}

const fetchUsersByRoles = async ({ roles, status }, req) => {
    const headers = forwardAuthHeaders(req)
    if (!headers.Authorization && !headers.Cookie) {
        const err = new Error('Authentication headers are required to resolve broadcast audience')
        err.statusCode = 401
        throw err
    }

    const recipients = new Map()

    for (const rawRole of roles) {
        const role = rawRole && rawRole.trim()
        if (!role) continue
        let page = 1
        let totalPages = 1
        do {
            try {
                const response = await axios.get(`${AUTH_SERVICE_URL}/superadmin/users`, {
                    params: {
                        role,
                        ...(status && status !== 'all' ? { status } : {}),
                        page,
                        limit: ROLE_PAGE_LIMIT,
                    },
                    headers,
                    withCredentials: true,
                })

                const { users = [], totalPages: responseTotalPages = 1 } = response.data || {}
                users.forEach((user) => {
                    if (user?._id) {
                        recipients.set(user._id.toString(), user.role || role || 'user')
                    }
                })
                totalPages = responseTotalPages || 1
                page += 1
            } catch (err) {
                console.error('Failed to fetch users for broadcast audience:', err.message)
                const fetchError = new Error('Unable to fetch broadcast audience from auth service')
                fetchError.statusCode = err.response?.status === 401 ? 401 : 502
                throw fetchError
            }
        } while (page <= totalPages)
    }

    return recipients
}

const fetchUsersByIds = async (ids, req) => {
    const headers = forwardAuthHeaders(req)
    if (!headers.Authorization && !headers.Cookie) {
        const err = new Error('Authentication headers are required to resolve broadcast audience')
        err.statusCode = 401
        throw err
    }

    const recipients = new Map()
    for (const chunk of chunkArray(ids, USER_BATCH_LIMIT)) {
        if (!chunk.length) continue
        try {
            const response = await axios.post(`${AUTH_SERVICE_URL}/auth/users/batch`, { ids: chunk }, {
                headers,
                withCredentials: true,
            })
            const { users = [] } = response.data || {}
            users.forEach((user) => {
                if (user?._id) {
                    recipients.set(user._id.toString(), user.role || 'user')
                }
            })
        } catch (err) {
            console.error('Failed to fetch users by ids for broadcast:', err.message)
            const fetchError = new Error('Unable to resolve provided recipients')
            fetchError.statusCode = err.response?.status === 401 ? 401 : 502
            throw fetchError
        }
    }
    return recipients
}

const resolveRecipientsFromAudience = async (audience = {}, req) => {
    const type = (audience.type || 'all').toLowerCase()

    if (type === 'custom') {
        if (!Array.isArray(audience.recipientIds) || audience.recipientIds.length === 0) {
            const err = new Error('recipientIds array is required for custom broadcasts')
            err.statusCode = 400
            throw err
        }
        return fetchUsersByIds(audience.recipientIds, req)
    }

    const targetRoles = (type === 'all' ? DEFAULT_BROADCAST_ROLES : audience.roles || [])
        .map((role) => role === 'superAdmin' ? null : role)
        .filter(Boolean)

    if (!targetRoles.length) {
        const err = new Error('At least one role must be specified for role-based broadcasts')
        err.statusCode = 400
        throw err
    }

    const status = audience.status || 'active'
    return fetchUsersByRoles({ roles: targetRoles, status }, req)
}

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

// POST /api/notifications/broadcast - create notifications for wide audiences
const broadcastNotification = async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'superAdmin') {
            return res.status(403).json({ message: 'Only super admins can broadcast notifications' })
        }

        const { title, message, type = 'system', data = {}, audience = {} } = req.body
        const sanitizedTitle = typeof title === 'string' ? title.trim() : ''
        const sanitizedMessage = typeof message === 'string' ? message.trim() : ''

        if (!sanitizedTitle || !sanitizedMessage) {
            return res.status(400).json({ message: 'title and message are required' })
        }

        const now = Date.now()
        if (BROADCAST_MIN_INTERVAL_MS > 0 && now - lastBroadcastAt < BROADCAST_MIN_INTERVAL_MS) {
            const retryInMs = BROADCAST_MIN_INTERVAL_MS - (now - lastBroadcastAt)
            return res.status(429).json({
                message: `Broadcast cooldown active. Try again in ${Math.ceil(retryInMs / 1000)} seconds`,
            })
        }

        const payloadData = data && typeof data === 'object' ? data : {}
        const recipientsMap = await resolveRecipientsFromAudience(audience, req)

        if (!recipientsMap.size) {
            return res.status(404).json({ message: 'No recipients found for the selected audience' })
        }

        const docs = Array.from(recipientsMap.entries()).map(([recipientId, role]) => ({
            recipient: recipientId,
            recipientRole: role,
            type,
            title: sanitizedTitle,
            message: sanitizedMessage,
            data: payloadData,
        }))

        let createdCount = 0
        for (const chunk of chunkArray(docs, 500)) {
            if (!chunk.length) continue
            const inserted = await Notification.insertMany(chunk, { ordered: false })
            createdCount += inserted.length
        }

        lastBroadcastAt = now

        return res.status(201).json({
            message: 'Broadcast notifications created successfully',
            recipients: recipientsMap.size,
            created: createdCount,
        })
    } catch (err) {
        console.error('Error broadcasting notifications:', err.message)
        const status = err.statusCode || 500
        return res.status(status).json({
            message: status >= 500 ? 'Failed to broadcast notifications' : err.message,
        })
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
    broadcastNotification,
}
