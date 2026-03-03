const mongoose = require('mongoose')

/* Address Schema (Embedded) */
const addressSchema = new mongoose.Schema({
    street: { type: String },
    city: { type: String },
    state: { type: String },
    pincode: { type: String },
    country: { type: String, default: 'India' }
}, { _id: false })

/* Admin Profile Schema (Embedded for orphan admins) */
const adminProfileSchema = new mongoose.Schema({
    designation: { type: String, trim: true },
    gender: {
        type: String,
        enum: ['male', 'female', 'nonBinary', 'preferNotToSay', 'other'],
        default: null
    },
    dateOfBirth: { type: Date },
    alternateEmail: { type: String, lowercase: true, trim: true },
    alternatePhone: { type: String, trim: true },
    governmentIdType: {
        type: String,
        enum: ['aadhaar', 'pan', 'passport', 'voterId', 'drivingLicense', 'other'],
        trim: true
    },
    governmentIdNumber: {
        type: String,
        trim: true,
        uppercase: true
    },
    governmentIdDocument: {
        url: { type: String },
        fileId: { type: String }
    },
    emergencyContact: {
        name: { type: String, trim: true },
        relation: { type: String, trim: true },
        phone: { type: String, trim: true }
    }
}, { _id: false })

/* User Schema */
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },

    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },

    password: {
        type: String,
        required: true,
        select: false
    },

    fullname: {
        firstname: {
            type: String,
            required: true,
            trim: true
        },
        lastname: {
            type: String,
            trim: true
        }
    },

    role: {
        type: String,
        enum: ['superAdmin', 'orphanAdmin', 'volunteer', 'user'],
        default: 'user'
    },

    orphanageId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Orphanage',
        default: null
    },

    status: {
        type: String,
        enum: ['pending', 'active', 'blocked'],
        default: function() {
            return (this.role === 'user' || this.role === 'volunteer') ? 'active' : 'pending'
        }
    },

    phone: {
        type: String
    },

    address: addressSchema,

    profileUrl: {
        type: String,
        default: null
    },

    profileFileId: {
        type: String,
        default: null
    },

    adminProfile: {
        type: adminProfileSchema,
        default: null
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
})

userSchema.index({ 'adminProfile.governmentIdNumber': 1 }, { unique: true, sparse: true })

const User = mongoose.model('User', userSchema)
module.exports = User
