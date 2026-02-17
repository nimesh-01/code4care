const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
    donorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Donor ID is required']
    },
    orphanageId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Orphanage',
        required: [true, 'Orphanage ID is required']
    },
    childId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Child',
        default: null
    },
    amount: {
        type: Number,
        required: [true, 'Donation amount is required'],
        min: [1, 'Minimum donation amount is 1']
    },
    purpose: {
        type: String,
        enum: {
            values: ['Education', 'Food', 'Healthcare', 'Clothing', 'Shelter', 'Emergency Help', 'other'],
            message: '{VALUE} is not a valid donation purpose'
        },
        required: [true, 'Donation purpose is required']
    },
    gateway: {
        type: String,
        enum: {
            values: ['razorpay', 'stripe'],
            message: '{VALUE} is not a valid payment gateway'
        },
        default: 'razorpay'
    },
    status: {
        type: String,
        enum: {
            values: ['pending', 'success', 'failed', 'refunded'],
            message: '{VALUE} is not a valid donation status'
        },
        default: 'pending'
    },
    payment: {
        orderId: {
            type: String,
            default: null
        },
        paymentId: {
            type: String,
            default: null
        },
        signature: {
            type: String,
            default: null
        },
        refundId: {
            type: String,
            default: null
        }
    },
    donorDetails: {
        name: String,
        email: String,
        phone: String
    },
    notes: {
        type: String,
        default: null
    },
    receiptUrl: {
        type: String,
        default: null
    },
    receiptNumber: {
        type: String,
        default: null
    }
}, {
    timestamps: true
});

// Indexes for faster queries
donationSchema.index({ donorId: 1, createdAt: -1 });
donationSchema.index({ orphanageId: 1, createdAt: -1 });
donationSchema.index({ childId: 1, createdAt: -1 });
donationSchema.index({ status: 1 });
donationSchema.index({ 'payment.orderId': 1 });

const Donation = mongoose.model('Donation', donationSchema);

module.exports = Donation;
