const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation',
        required: true,
        index: true
    },

    sender: {
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },
        senderModel: {
            type: String,
            required: true,
            enum: ['User', 'Orphanage']
        },
        role: {
            type: String,
            required: true,
            enum: ['superAdmin', 'orphanAdmin', 'volunteer', 'user']
        }
    },

    receiver: {
        receiverId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },
        receiverModel: {
            type: String,
            required: true,
            enum: ['User', 'Orphanage']
        },
        role: {
            type: String,
            required: true,
            enum: ['superAdmin', 'orphanAdmin', 'volunteer', 'user']
        }
    },

    content: {
        type: String,
        required: true,
        trim: true,
        maxlength: 5000
    },

    messageType: {
        type: String,
        enum: ['text', 'image', 'file', 'system'],
        default: 'text'
    },

    status: {
        type: String,
        enum: ['sent', 'delivered', 'read'],
        default: 'sent'
    },

    // Timestamps for status changes
    sentAt: {
        type: Date,
        default: Date.now
    },

    deliveredAt: {
        type: Date,
        default: null
    },

    readAt: {
        type: Date,
        default: null
    },

    // Soft delete
    deletedFor: [{
        type: mongoose.Schema.Types.ObjectId
    }],

    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Compound index for efficient queries
messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ 'sender.senderId': 1 });
messageSchema.index({ 'receiver.receiverId': 1 });
messageSchema.index({ status: 1 });

// Method to mark as delivered
messageSchema.methods.markAsDelivered = async function() {
    if (this.status === 'sent') {
        this.status = 'delivered';
        this.deliveredAt = new Date();
        return this.save();
    }
    return this;
};

// Method to mark as read
messageSchema.methods.markAsRead = async function() {
    if (this.status !== 'read') {
        this.status = 'read';
        this.readAt = new Date();
        return this.save();
    }
    return this;
};

// Static method to get unread messages count for a user
messageSchema.statics.getUnreadCount = async function(userId, conversationId) {
    return this.countDocuments({
        conversationId,
        'receiver.receiverId': userId,
        status: { $in: ['sent', 'delivered'] }
    });
};

// Static method to mark all messages as read in a conversation
messageSchema.statics.markAllAsRead = async function(userId, conversationId) {
    return this.updateMany(
        {
            conversationId,
            'receiver.receiverId': userId,
            status: { $in: ['sent', 'delivered'] }
        },
        {
            $set: {
                status: 'read',
                readAt: new Date()
            }
        }
    );
};

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
