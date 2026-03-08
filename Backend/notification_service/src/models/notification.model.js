const mongoose = require('mongoose')

const notificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        index: true,
    },
    recipientRole: {
        type: String,
        enum: ['user', 'volunteer', 'orphanAdmin', 'superAdmin'],
        required: true,
    },
    type: {
        type: String,
        enum: [
            'appointment_request',
            'appointment_approved',
            'appointment_rejected',
            'appointment_cancelled',
            'donation_received',
            'donation_completed',
            'help_request',
            'help_request_accepted',
            'help_request_completed',
            'event_created',
            'event_reminder',
            'volunteer_joined',
            'child_update',
            'welcome',
            'system',
            'general',
        ],
        default: 'general',
    },
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200,
    },
    message: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000,
    },
    data: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
    },
    read: {
        type: Boolean,
        default: false,
        index: true,
    },
    readAt: {
        type: Date,
        default: null,
    },
}, {
    timestamps: true,
})

notificationSchema.index({ recipient: 1, createdAt: -1 })
notificationSchema.index({ recipient: 1, read: 1 })

module.exports = mongoose.model('Notification', notificationSchema)
