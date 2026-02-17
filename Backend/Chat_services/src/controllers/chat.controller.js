const Message = require('../models/message.model');
const Conversation = require('../models/conversation.model');
const { validateChatPermission } = require('../middlewares/auth.middleware');
const { getIO, getOnlineUsers } = require('../socket/socket');

/**
 * Send a new message
 * POST /chat/message
 */
async function sendMessage(req, res) {
    try {
        const { receiverId, receiverRole, content, messageType = 'text' } = req.body;
        const sender = req.user;

        // Validate required fields
        if (!receiverId || !content) {
            return res.status(400).json({
                success: false,
                message: 'Receiver ID and message content are required'
            });
        }

        // Validate content length
        if (content.length > 5000) {
            return res.status(400).json({
                success: false,
                message: 'Message content exceeds maximum length of 5000 characters'
            });
        }

        // Validate chat permission between roles
        if (!validateChatPermission(sender.role, receiverRole)) {
            return res.status(403).json({
                success: false,
                message: 'You are not allowed to chat with this user'
            });
        }

        // Create sender and receiver participant objects
        const senderParticipant = {
            participantId: sender.id,
            participantModel: 'User',
            role: sender.role
        };

        const receiverParticipant = {
            participantId: receiverId,
            participantModel: 'User',
            role: receiverRole
        };

        // Find or create conversation
        const conversation = await Conversation.findOrCreateConversation(
            senderParticipant,
            receiverParticipant
        );

        // Create the message
        const message = await Message.create({
            conversationId: conversation._id,
            sender: {
                senderId: sender.id,
                senderModel: 'User',
                role: sender.role
            },
            receiver: {
                receiverId: receiverId,
                receiverModel: 'User',
                role: receiverRole
            },
            content,
            messageType,
            status: 'sent',
            sentAt: new Date()
        });

        // Update conversation with last message
        conversation.lastMessage = message._id;
        conversation.updatedAt = new Date();
        await conversation.incrementUnread(receiverId);

        // Emit message via Socket.io
        const io = getIO();
        const onlineUsers = getOnlineUsers();
        const receiverSocketId = onlineUsers.get(receiverId);

        if (receiverSocketId) {
            // Receiver is online - emit message and mark as delivered
            io.to(receiverSocketId).emit('receiveMessage', {
                message: {
                    _id: message._id,
                    conversationId: conversation._id,
                    sender: message.sender,
                    content: message.content,
                    messageType: message.messageType,
                    status: 'delivered',
                    sentAt: message.sentAt,
                    createdAt: message.createdAt
                }
            });

            // Update status to delivered
            message.status = 'delivered';
            message.deliveredAt = new Date();
            await message.save();
        }

        // Emit to sender for confirmation
        const senderSocketId = onlineUsers.get(sender.id);
        if (senderSocketId) {
            io.to(senderSocketId).emit('messageSent', {
                message: {
                    _id: message._id,
                    conversationId: conversation._id,
                    status: message.status,
                    sentAt: message.sentAt,
                    deliveredAt: message.deliveredAt
                }
            });
        }

        res.status(201).json({
            success: true,
            message: 'Message sent successfully',
            data: {
                messageId: message._id,
                conversationId: conversation._id,
                status: message.status,
                sentAt: message.sentAt
            }
        });

    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send message',
            error: error.message
        });
    }
}

/**
 * Get chat history for a conversation
 * GET /chat/history/:conversationId
 */
async function getChatHistory(req, res) {
    try {
        const { conversationId } = req.params;
        const userId = req.user.id;
        const { page = 1, limit = 50 } = req.query;

        // Find conversation
        const conversation = await Conversation.findById(conversationId);

        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: 'Conversation not found'
            });
        }

        // Verify user is a participant
        if (!conversation.isParticipant(userId)) {
            return res.status(403).json({
                success: false,
                message: 'You are not a participant in this conversation'
            });
        }

        // Get messages with pagination (newest first)
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const messages = await Message.find({
            conversationId,
            deletedFor: { $ne: userId }
        })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        // Get total count for pagination
        const totalMessages = await Message.countDocuments({
            conversationId,
            deletedFor: { $ne: userId }
        });

        // Mark messages as read
        await Message.markAllAsRead(userId, conversationId);
        await conversation.resetUnread(userId);

        // Notify sender about read receipts
        const io = getIO();
        const onlineUsers = getOnlineUsers();

        // Get unique senders from fetched messages
        const senderIds = [...new Set(
            messages
                .filter(m => m.sender.senderId.toString() !== userId)
                .map(m => m.sender.senderId.toString())
        )];

        senderIds.forEach(senderId => {
            const senderSocketId = onlineUsers.get(senderId);
            if (senderSocketId) {
                io.to(senderSocketId).emit('messagesRead', {
                    conversationId,
                    readBy: userId,
                    readAt: new Date()
                });
            }
        });

        res.status(200).json({
            success: true,
            data: {
                messages: messages.reverse(), // Return in chronological order
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalMessages / parseInt(limit)),
                    totalMessages,
                    hasMore: skip + messages.length < totalMessages
                }
            }
        });

    } catch (error) {
        console.error('Get chat history error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get chat history',
            error: error.message
        });
    }
}

/**
 * Get all conversations for a user
 * GET /chat/conversations
 */
async function getConversations(req, res) {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 20 } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const conversations = await Conversation.find({
            'participants.participantId': userId,
            status: 'active'
        })
            .populate('lastMessage')
            .sort({ updatedAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        // Get total count
        const totalConversations = await Conversation.countDocuments({
            'participants.participantId': userId,
            status: 'active'
        });

        // Format response with other participant info and unread count
        const formattedConversations = conversations.map(conv => {
            const otherParticipant = conv.participants.find(
                p => p.participantId.toString() !== userId
            );

            return {
                _id: conv._id,
                otherParticipant,
                lastMessage: conv.lastMessage,
                unreadCount: conv.unreadCount?.get?.(userId) || conv.unreadCount?.[userId] || 0,
                updatedAt: conv.updatedAt
            };
        });

        res.status(200).json({
            success: true,
            data: {
                conversations: formattedConversations,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalConversations / parseInt(limit)),
                    totalConversations,
                    hasMore: skip + conversations.length < totalConversations
                }
            }
        });

    } catch (error) {
        console.error('Get conversations error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get conversations',
            error: error.message
        });
    }
}

/**
 * Mark messages as read
 * PATCH /chat/read/:conversationId
 */
async function markAsRead(req, res) {
    try {
        const { conversationId } = req.params;
        const userId = req.user.id;

        const conversation = await Conversation.findById(conversationId);

        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: 'Conversation not found'
            });
        }

        if (!conversation.isParticipant(userId)) {
            return res.status(403).json({
                success: false,
                message: 'You are not a participant in this conversation'
            });
        }

        // Mark all messages as read
        const result = await Message.markAllAsRead(userId, conversationId);
        console.log(result)
        await conversation.resetUnread(userId);

        // Notify senders about read receipts
        const io = getIO();
        const onlineUsers = getOnlineUsers();

        const otherParticipant = conversation.participants.find(
            p => p.participantId.toString() !== userId
        );

        if (otherParticipant) {
            const otherSocketId = onlineUsers.get(otherParticipant.participantId.toString());
            if (otherSocketId) {
                io.to(otherSocketId).emit('messagesRead', {
                    conversationId,
                    readBy: userId,
                    readAt: new Date()
                });
            }
        }

        res.status(200).json({
            success: true,
            message: 'Messages marked as read',
            data: {
                modifiedCount: result.modifiedCount
            }
        });

    } catch (error) {
        console.error('Mark as read error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark messages as read',
            error: error.message
        });
    }
}

/**
 * Get or create conversation with a user
 * POST /chat/conversation
 */
async function getOrCreateConversation(req, res) {
    try {
        const { receiverId, receiverRole } = req.body;
        const sender = req.user;

        if (!receiverId || !receiverRole) {
            return res.status(400).json({
                success: false,
                message: 'Receiver ID and role are required'
            });
        }

        // Validate chat permission
        if (!validateChatPermission(sender.role, receiverRole)) {
            return res.status(403).json({
                success: false,
                message: 'You are not allowed to chat with this user'
            });
        }

        const senderParticipant = {
            participantId: sender.id,
            participantModel: 'User',
            role: sender.role
        };

        const receiverParticipant = {
            participantId: receiverId,
            participantModel: 'User',
            role: receiverRole
        };

        const conversation = await Conversation.findOrCreateConversation(
            senderParticipant,
            receiverParticipant
        );

        res.status(200).json({
            success: true,
            data: {
                conversationId: conversation._id,
                participants: conversation.participants,
                createdAt: conversation.createdAt
            }
        });

    } catch (error) {
        console.error('Get/Create conversation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get or create conversation',
            error: error.message
        });
    }
}

/**
 * Delete a message
 * DELETE /chat/message/:messageId
 * - Sender deletes: Hard delete (permanently removed)
 * - Receiver deletes: Soft delete (hidden only for receiver)
 */
async function deleteMessage(req, res) {
    try {
        const { messageId } = req.params;
        const userId = req.user.id;

        const message = await Message.findById(messageId);

        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Message not found'
            });
        }

        const isSender = message.sender.senderId.toString() === userId;
        const isReceiver = message.receiver.receiverId.toString() === userId;

        // Check if user is part of this message
        if (!isSender && !isReceiver) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to delete this message'
            });
        }

        if (isSender) {
            // Hard delete - permanently remove from database
            await Message.findByIdAndDelete(messageId);

            // Notify receiver about message deletion via Socket.io
            const io = getIO();
            const onlineUsers = getOnlineUsers();
            const receiverSocketId = onlineUsers.get(message.receiver.receiverId.toString());

            if (receiverSocketId) {
                io.to(receiverSocketId).emit('messageDeleted', {
                    messageId,
                    conversationId: message.conversationId,
                    deletedBy: userId
                });
            }

            res.status(200).json({
                success: true,
                message: 'Message deleted permanently'
            });
        } else {
            // Soft delete - hide only for receiver
            if (!message.deletedFor.includes(userId)) {
                message.deletedFor.push(userId);
                await message.save();
            }

            res.status(200).json({
                success: true,
                message: 'Message hidden from your chat'
            });
        }

    } catch (error) {
        console.error('Delete message error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete message',
            error: error.message
        });
    }
}

/**
 * Get unread messages count
 * GET /chat/unread
 */
async function getUnreadCount(req, res) {
    try {
        const userId = req.user.id;

        const conversations = await Conversation.find({
            'participants.participantId': userId,
            status: 'active'
        }).lean();

        let totalUnread = 0;
        const unreadByConversation = {};

        conversations.forEach(conv => {
            const count = conv.unreadCount?.get?.(userId) || conv.unreadCount?.[userId] || 0;
            unreadByConversation[conv._id] = count;
            totalUnread += count;
        });

        res.status(200).json({
            success: true,
            data: {
                totalUnread,
                unreadByConversation
            }
        });

    } catch (error) {
        console.error('Get unread count error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get unread count',
            error: error.message
        });
    }
}

module.exports = {
    sendMessage,
    getChatHistory,
    getConversations,
    markAsRead,
    getOrCreateConversation,
    deleteMessage,
    getUnreadCount
};
