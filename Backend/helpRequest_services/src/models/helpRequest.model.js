const mongoose = require('mongoose');

const HelpRequestSchema = new mongoose.Schema({
    orphanageId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
        // Reference to Orphanage in auth service
    },
    childId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
        // Reference to Child in children_services
    },
    requestType: {
        type: String,
        enum: ['Teaching', 'Medical', 'Exam', 'Other'],
        required: true
    },
    description: {
        type: String,
        required: true
    },
    requiredSkills: {
        type: [String],
        default: []
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'completed'],
        default: 'pending'
    },
    assignedVolunteerId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
        // Reference to User (volunteer) in auth service
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
        // Reference to User (admin) in auth service
    },
    completedAt: {
        type: Date,
        default: null
    },
    messages: {
        type: [
            {
                senderId: {
                    type: mongoose.Schema.Types.ObjectId,
                    required: true
                },
                senderRole: {
                    type: String,
                    enum: ['volunteer', 'orphanAdmin', 'superAdmin'],
                    required: true
                },
                content: {
                    type: String,
                    required: true,
                    trim: true,
                    maxlength: 1000
                },
                createdAt: {
                    type: Date,
                    default: Date.now
                }
            }
        ],
        default: []
    }
}, { timestamps: true });

const HelpRequest = mongoose.model('HelpRequest', HelpRequestSchema);

module.exports = HelpRequest;
