const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
    requesterId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    requesterType: {
        type: String,
        enum: ['user', 'volunteer'],
        required: true
    },
    orphanageId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    childId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Child'
    },
    requestedAt: {
        type: Date,
        required: true
    },
    purpose: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'cancelled', 'blocked', 'needsConfirmation', 'completed'],
        default: 'pending'
    },
    adminResponse: {
        type: String
    },
    needsUserConfirmation: {
        type: Boolean,
        default: false
    },
    userConfirmedAt: {
        type: Date
    },
    userConfirmationNote: {
        type: String
    }
}, { timestamps: true });

const Appointment = mongoose.model('Appointment', AppointmentSchema);

module.exports = Appointment;
