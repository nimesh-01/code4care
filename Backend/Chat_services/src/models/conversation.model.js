const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
    participants: [{
        participantId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            refPath: 'participants.participantModel'
        },
        participantModel: {
            type: String,
            required: true,
            enum: ['User', 'Orphanage']
        },
        role: {
            type: String,
            required: true,
            enum: ['superAdmin', 'orphanAdmin', 'volunteer', 'user']
        }
    }],

    // Last message reference for quick access
    lastMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message',
        default: null
    },

    // Unread count per participant
    unreadCount: {
        type: Map,
        of: Number,
        default: {}
    },

    // Conversation status
    status: {
        type: String,
        enum: ['active', 'archived', 'blocked'],
        default: 'active'
    },

    createdAt: {
        type: Date,
        default: Date.now
    },

    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for faster queries
conversationSchema.index({ 'participants.participantId': 1 });
conversationSchema.index({ updatedAt: -1 });

// Static method to find conversation between two users
conversationSchema.statics.findConversation = async function(participant1Id, participant2Id) {
    return this.findOne({
        $and: [
            { 'participants.participantId': participant1Id },
            { 'participants.participantId': participant2Id }
        ]
    });
};

// Static method to find or create conversation
conversationSchema.statics.findOrCreateConversation = async function(participant1, participant2) {
    let conversation = await this.findConversation(
        participant1.participantId,
        participant2.participantId
    );

    if (!conversation) {
        conversation = await this.create({
            participants: [participant1, participant2],
            unreadCount: {
                [participant1.participantId.toString()]: 0,
                [participant2.participantId.toString()]: 0
            }
        });
    }

    return conversation;
};

// Method to check if user is participant
conversationSchema.methods.isParticipant = function(userId) {
    return this.participants.some(
        p => p.participantId.toString() === userId.toString()
    );
};

// Method to increment unread count
conversationSchema.methods.incrementUnread = async function(userId) {
    const key = userId.toString();
    const currentCount = this.unreadCount.get(key) || 0;
    this.unreadCount.set(key, currentCount + 1);
    return this.save();
};

// Method to reset unread count
conversationSchema.methods.resetUnread = async function(userId) {
    this.unreadCount.set(userId.toString(), 0);
    return this.save();
};

const Conversation = mongoose.model('Conversation', conversationSchema);

module.exports = Conversation;
