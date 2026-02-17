const mongoose = require('mongoose')

/* Address Schema (Embedded) */
const addressSchema = new mongoose.Schema({
    street: { type: String },
    city: { type: String },
    state: { type: String },
    pincode: { type: String },
    country: { type: String, default: 'India' }
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

    createdAt: {
        type: Date,
        default: Date.now
    }
})

const User = mongoose.model('User', userSchema)
module.exports = User
