const mongoose = require('mongoose')

const orphanageSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },

    registrationNumber: {
        type: String,
        required: true,
        unique: true
    },

    orphanage_mail: {
        type: String,
        required: true,
        lowercase: true
        
    },

    orphanage_phone: {
        type: String,
        required: true
    },

    address: {
        street: { type: String },
        city: { type: String },
        state: { type: String },
        pincode: { type: String },
        country: { type: String, default: 'India' }
    },

    documents: {
        registrationCertificate: {
            url: { type: String },
            fileId: { type: String }
        },
        governmentLicense: {
            url: { type: String },
            fileId: { type: String }
        },
        otherDocuments: [{
            name: { type: String },
            url: { type: String },
            fileId: { type: String }
        }]
    },

    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'blocked'],
        default: 'pending'
    },

    verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // superAdmin
        default: null
    },

    orphanAdmin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // orphanAdmin
        required: true
    },

    verificationNote: {
        type: String // reason if rejected or blocked
    },

    createdAt: {
        type: Date,
        default: Date.now
    },

    approvedAt: {
        type: Date
    }
})

const Orphanage = mongoose.model('Orphanage', orphanageSchema)
module.exports = Orphanage
