const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const Message = require('../models/message.model');
const Conversation = require('../models/conversation.model');
const { validateChatPermission } = require('../middlewares/auth.middleware');

let io;
const onlineUsers = new Map(); // Map<userId, socketId>
const userSockets = new Map(); // Map<socketId, userId>

/**
 * Initialize Socket.io server
 */
function initializeSocket(server) {
    io = new Server(server, {
        cors: {
            origin: process.env.FRONTEND_URL || 'http://localhost:3000',
            methods: ['GET', 'POST'],
            credentials: true
        },
        pingTimeout: 60000,
        pingInterval: 25000
    });

    // Socket authentication middleware
    io.use((socket, next) => {
        try {
            const token = socket.handshake.auth?.token ||
                socket.handshake.headers?.cookie?.split('token=')[1]?.split(';')[0];

            if (!token) {
                return next(new Error('Authentication required'));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.user = decoded;
            next();
        } catch (err) {
            next(new Error('Invalid token'));
        }
    });

    // Connection handler
    io.on('connection', (socket) => {
        const userId = socket.user.id;
        const userRole = socket.user.role;

        console.log(`User connected: ${userId} (${userRole}) - Socket: ${socket.id}`);

        // Store user's socket connection
        onlineUsers.set(userId, socket.id);
        userSockets.set(socket.id, userId);

        // Notify others that user is online
        socket.broadcast.emit('userOnline', {
            userId,
            role: userRole
        });

        // Send pending messages that were sent while user was offline
        deliverPendingMessages(userId, socket);

        /**
         * Event: sendMessage
         * Handles real-time message sending
         */
        socket.on('sendMessage', async (data, callback) => {
            try {
                const { receiverId, receiverRole, content, messageType = 'text' } = data;

                // Validate required fields
                if (!receiverId || !content) {
                    return callback?.({
                        success: false,
                        error: 'Receiver ID and content are required'
                    });
                }

                // Validate chat permission
                if (!validateChatPermission(userRole, receiverRole)) {
                    return callback?.({
                        success: false,
                        error: 'You are not allowed to chat with this user'
                    });
                }

                // Create participant objects
                const senderParticipant = {
                    participantId: userId,
                    participantModel: 'User',
                    role: userRole
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

                // Create message
                const message = await Message.create({
                    conversationId: conversation._id,
                    sender: {
                        senderId: userId,
                        senderModel: 'User',
                        role: userRole
                    },
                    receiver: {
                        receiverId,
                        receiverModel: 'User',
                        role: receiverRole
                    },
                    content,
                    messageType,
                    status: 'sent',
                    sentAt: new Date()
                });

                // Update conversation
                conversation.lastMessage = message._id;
                await conversation.incrementUnread(receiverId);

                // Check if receiver is online
                const receiverSocketId = onlineUsers.get(receiverId);

                const messageData = {
                    _id: message._id,
                    conversationId: conversation._id,
                    sender: message.sender,
                    receiver: message.receiver,
                    content: message.content,
                    messageType: message.messageType,
                    status: message.status,
                    sentAt: message.sentAt,
                    createdAt: message.createdAt
                };

                if (receiverSocketId) {
                    // Receiver is online - deliver immediately
                    message.status = 'delivered';
                    message.deliveredAt = new Date();
                    await message.save();

                    messageData.status = 'delivered';
                    messageData.deliveredAt = message.deliveredAt;

                    io.to(receiverSocketId).emit('receiveMessage', { message: messageData });
                }

                // Confirm to sender
                callback?.({
                    success: true,
                    message: messageData
                });

            } catch (error) {
                console.error('Socket sendMessage error:', error);
                callback?.({
                    success: false,
                    error: error.message
                });
            }
        });

        /**
         * Event: typing
         * Handles typing indicator
         */
        socket.on('typing', (data) => {
            const { conversationId, receiverId } = data;
            const receiverSocketId = onlineUsers.get(receiverId);

            if (receiverSocketId) {
                io.to(receiverSocketId).emit('userTyping', {
                    conversationId,
                    userId,
                    isTyping: true
                });
            }
        });

        /**
         * Event: stopTyping
         * Handles stop typing indicator
         */
        socket.on('stopTyping', (data) => {
            const { conversationId, receiverId } = data;
            const receiverSocketId = onlineUsers.get(receiverId);

            if (receiverSocketId) {
                io.to(receiverSocketId).emit('userTyping', {
                    conversationId,
                    userId,
                    isTyping: false
                });
            }
        });

        /**
         * Event: markAsRead
         * Handles read receipts
         */
        socket.on('markAsRead', async (data, callback) => {
            try {
                const { conversationId } = data;

                const conversation = await Conversation.findById(conversationId);

                if (!conversation || !conversation.isParticipant(userId)) {
                    return callback?.({
                        success: false,
                        error: 'Conversation not found or access denied'
                    });
                }

                // Mark all messages as read
                await Message.markAllAsRead(userId, conversationId);
                await conversation.resetUnread(userId);

                // Notify other participant
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

                callback?.({ success: true });

            } catch (error) {
                console.error('Socket markAsRead error:', error);
                callback?.({
                    success: false,
                    error: error.message
                });
            }
        });

        /**
         * Event: joinConversation
         * Join a conversation room for real-time updates
         */
        socket.on('joinConversation', async (data, callback) => {
            try {
                const { conversationId } = data;

                const conversation = await Conversation.findById(conversationId);

                if (!conversation || !conversation.isParticipant(userId)) {
                    return callback?.({
                        success: false,
                        error: 'Conversation not found or access denied'
                    });
                }

                socket.join(`conversation:${conversationId}`);
                callback?.({ success: true });

            } catch (error) {
                callback?.({
                    success: false,
                    error: error.message
                });
            }
        });

        /**
         * Event: leaveConversation
         * Leave a conversation room
         */
        socket.on('leaveConversation', (data) => {
            const { conversationId } = data;
            socket.leave(`conversation:${conversationId}`);
        });

        /**
         * Event: getOnlineStatus
         * Check if specific users are online
         */
        socket.on('getOnlineStatus', (data, callback) => {
            const { userIds } = data;
            const onlineStatus = {};

            userIds.forEach(id => {
                onlineStatus[id] = onlineUsers.has(id);
            });

            callback?.({ success: true, onlineStatus });
        });

        /**
         * Event: disconnect
         * Handle user disconnection
         */
        socket.on('disconnect', (reason) => {
            console.log(`User disconnected: ${userId} - Reason: ${reason}`);

            // Remove from online users
            onlineUsers.delete(userId);
            userSockets.delete(socket.id);

            // Notify others that user is offline
            socket.broadcast.emit('userOffline', {
                userId,
                role: userRole,
                lastSeen: new Date()
            });
        });

        /**
         * Event: error
         * Handle socket errors
         */
        socket.on('error', (error) => {
            console.error(`Socket error for user ${userId}:`, error);
        });
    });

    console.log('Socket.io initialized');
    return io;
}

/**
 * Deliver pending messages to user who just came online
 */
async function deliverPendingMessages(userId, socket) {
    try {
        // Find all undelivered messages for this user
        const pendingMessages = await Message.find({
            'receiver.receiverId': userId,
            status: 'sent'
        }).populate('conversationId');

        if (pendingMessages.length > 0) {
            // Update status to delivered
            const messageIds = pendingMessages.map(m => m._id);
            await Message.updateMany(
                { _id: { $in: messageIds } },
                {
                    $set: {
                        status: 'delivered',
                        deliveredAt: new Date()
                    }
                }
            );

            // Emit pending messages to user
            pendingMessages.forEach(message => {
                socket.emit('receiveMessage', {
                    message: {
                        _id: message._id,
                        conversationId: message.conversationId._id,
                        sender: message.sender,
                        content: message.content,
                        messageType: message.messageType,
                        status: 'delivered',
                        sentAt: message.sentAt,
                        deliveredAt: new Date(),
                        createdAt: message.createdAt
                    },
                    isPending: true
                });

                // Notify sender about delivery
                const senderSocketId = onlineUsers.get(message.sender.senderId.toString());
                if (senderSocketId) {
                    io.to(senderSocketId).emit('messageDelivered', {
                        messageId: message._id,
                        conversationId: message.conversationId._id,
                        deliveredAt: new Date()
                    });
                }
            });

            console.log(`Delivered ${pendingMessages.length} pending messages to ${userId}`);
        }
    } catch (error) {
        console.error('Error delivering pending messages:', error);
    }
}

/**
 * Get Socket.io instance
 */
function getIO() {
    if (!io) {
        throw new Error('Socket.io not initialized');
    }
    return io;
}

/**
 * Get online users map
 */
function getOnlineUsers() {
    return onlineUsers;
}

/**
 * Check if user is online
 */
function isUserOnline(userId) {
    return onlineUsers.has(userId);
}

/**
 * Send message to specific user
 */
function sendToUser(userId, event, data) {
    const socketId = onlineUsers.get(userId);
    if (socketId) {
        io.to(socketId).emit(event, data);
        return true;
    }
    return false;
}

module.exports = {
    initializeSocket,
    getIO,
    getOnlineUsers,
    isUserOnline,
    sendToUser
};
