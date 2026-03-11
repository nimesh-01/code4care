const express = require('express')
const router = express.Router()
const { authMiddleware } = require('../middlewares/auth.middleware')
const {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearReadNotifications,
    sendNotification,
    sendBulkNotifications,
} = require('../controllers/notification.controller')

// All routes require auth
router.use(authMiddleware)

// Get notifications (paginated, with optional filter)
router.get('/', getNotifications)

// Get unread count
router.get('/unread-count', getUnreadCount)

// Mark all as read
router.put('/read-all', markAllAsRead)

// Clear all read notifications
router.delete('/clear', clearReadNotifications)

// Mark single as read
router.put('/:id/read', markAsRead)

// Delete single notification
router.delete('/:id', deleteNotification)

// Send notification (for internal / admin use)
router.post('/send', sendNotification)

// Send bulk notifications (admin - multiple recipients)
router.post('/send-bulk', sendBulkNotifications)

module.exports = router
