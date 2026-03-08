const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema({
    participantId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    role: {
        type: String,
        enum: ['user', 'volunteer'],
        required: true
    },
    joinedAt: {
        type: Date,
        default: Date.now
    }
}, { _id: false });

const eventSchema = new mongoose.Schema({
    orphanageId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    description: {
        type: String,
        required: true,
        trim: true,
        maxlength: 5000
    },
    category: {
        type: String,
        enum: ['Education', 'Health', 'Fundraising', 'Cultural', 'Other'],
        required: true
    },
    eventDate: {
        type: Date,
        required: true
    },
    eventTime: {
        type: String,
        trim: true
    },
    eventLocation: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500
    },
    requiredVolunteers: {
        type: Number,
        default: 0,
        min: 0
    },
    maxParticipants: {
        type: Number,
        default: 0,
        min: 0
    },
    imageUrl: {
        type: String,
        default: null
    },
    imageFileId: {
        type: String,
        default: null
    },
    participants: {
        type: [participantSchema],
        default: []
    },
    status: {
        type: String,
        enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
        default: 'upcoming'
    }
}, { timestamps: true });

eventSchema.index({ orphanageId: 1 });
eventSchema.index({ eventDate: 1 });
eventSchema.index({ status: 1 });
eventSchema.index({ category: 1 });

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;
