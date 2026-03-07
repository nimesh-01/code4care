const mongoose = require('mongoose');

const buildParticipantsKey = (participant1Id, participant2Id) => {
    const ids = [participant1Id, participant2Id]
        .map((id) => id?.toString())
        .filter(Boolean)
        .sort();
    return ids.join(':');
};

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
    },

    participantsKey: {
        type: String,
        required: true,
        unique: true
    }
}, {
    timestamps: true
});

// Index for faster queries
conversationSchema.index({ 'participants.participantId': 1 });
conversationSchema.index({ updatedAt: -1 });
conversationSchema.index({ participantsKey: 1 }, { unique: true });

// Static method to find conversation between two users
conversationSchema.statics.findConversation = async function(participant1Id, participant2Id) {
    const key = buildParticipantsKey(participant1Id, participant2Id);
    if (!key) return null;

    let conversation = await this.findOne({ participantsKey: key });
    if (conversation) return conversation;

    // Fallback for legacy documents without participantsKey populated yet
    conversation = await this.findOne({
        $and: [
            { 'participants.participantId': participant1Id },
            { 'participants.participantId': participant2Id }
        ]
    });

    if (conversation && !conversation.participantsKey) {
        conversation.participantsKey = key;
        await conversation.save();
    }

    return conversation;
};

// Static method to find or create conversation
conversationSchema.statics.findOrCreateConversation = async function(participant1, participant2) {
    const key = buildParticipantsKey(participant1.participantId, participant2.participantId);

    let conversation = await this.findConversation(
        participant1.participantId,
        participant2.participantId
    );

    if (conversation) return conversation;

    const unreadTemplate = {
        [participant1.participantId.toString()]: 0,
        [participant2.participantId.toString()]: 0
    };

    conversation = await this.findOneAndUpdate(
        { participantsKey: key },
        {
            $setOnInsert: {
                participants: [participant1, participant2],
                participantsKey: key,
                unreadCount: unreadTemplate
            }
        },
        {
            new: true,
            upsert: true,
            setDefaultsOnInsert: true
        }
    );

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

conversationSchema.pre('validate', function(next) {
    if (this.participants?.length >= 2) {
        const [participant1, participant2] = this.participants;
        this.participantsKey = buildParticipantsKey(participant1.participantId, participant2.participantId);
    }
    next();
});

const Conversation = mongoose.model('Conversation', conversationSchema);

module.exports = Conversation;
