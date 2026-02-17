const express = require('express');
const router = express.Router();
const {
    sendMessage,
    getChatHistory,
    getConversations,
    markAsRead,
    getOrCreateConversation,
    deleteMessage,
    getUnreadCount
} = require('../controllers/chat.controller');
const { authMiddleware, chatAccessMiddleware } = require('../middlewares/auth.middleware');

// All routes require authentication and chat access
router.use(authMiddleware);
router.use(chatAccessMiddleware);

/**
 * @route   POST /chat/message
 * @desc    Send a new message
 * @access  Admin, User, Volunteer
 */
router.post('/message', sendMessage);

/**
 * @route   GET /chat/history/:conversationId
 * @desc    Get chat history for a conversation
 * @access  Only participants of the conversation
 */
router.get('/history/:conversationId', getChatHistory);

/**
 * @route   GET /chat/conversations
 * @desc    Get all conversations for the authenticated user
 * @access  Admin, User, Volunteer
 */
router.get('/conversations', getConversations);

/**
 * @route   POST /chat/conversation
 * @desc    Get or create a conversation with a user
 * @access  Admin, User, Volunteer
 */
router.post('/conversation', getOrCreateConversation);

/**
 * @route   PATCH /chat/read/:conversationId
 * @desc    Mark all messages in a conversation as read
 * @access  Only participants of the conversation
 */
router.patch('/read/:conversationId', markAsRead);

/**
 * @route   DELETE /chat/message/:messageId
 * @desc    Delete a message (soft delete)
 * @access  Only message sender
 */
router.delete('/message/:messageId', deleteMessage);

/**
 * @route   GET /chat/unread
 * @desc    Get unread messages count
 * @access  Admin, User, Volunteer
 */
router.get('/unread', getUnreadCount);

module.exports = router;
