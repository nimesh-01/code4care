const mongoose = require('mongoose')

const childSchema = new mongoose.Schema({
    orphanageId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Orphanage',
        required: true
    },

    name: {
        type: String,
        required: true,
        trim: true
    },

    age: {
        type: Number,
        required: true,
        min: 0
    },

    gender: {
        type: String,
        enum: ['Male', 'Female', 'Other'],
        required: true
    },

    healthStatus: {
        type: String,
        default: 'Not specified'
    },

    educationStatus: {
        type: String,
        default: 'Not specified'
    },

    background: {
        type: String
    },

    profileUrl: {
        type: String // Cloudinary / ImageKit URL
    },

    profileFileId: {
        type: String
    },

    city: {
        type: String,
        required: true
    },

    state: {
        type: String,
        required: true
    },

    status: {
        type: String,
        enum: ['active', 'archived'],
        default: 'active'
    },

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // orphanAdmin
        required: true
    },

    createdAt: {
        type: Date,
        default: Date.now
    },

    updatedAt: {
        type: Date,
        default: Date.now
    }
})

/* Documents array: store uploaded documents (imagekit) */
childSchema.add({
    documents: [{
        url: { type: String },
        fileId: { type: String },
        name: { type: String },
        uploadedAt: { type: Date, default: Date.now }
    }]
})

/* Auto-update updatedAt */
childSchema.pre('save', function (next) {
    this.updatedAt = Date.now()
})

const Child = mongoose.model('Child', childSchema)
module.exports = Child
