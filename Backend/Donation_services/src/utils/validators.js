const mongoose = require('mongoose');

/**
 * Validation Utility Functions
 */
const validators = {
    /**
     * Check if string is valid MongoDB ObjectId
     * @param {string} id - ID to validate
     * @returns {boolean}
     */
    isValidObjectId: (id) => {
        return mongoose.Types.ObjectId.isValid(id);
    },

    /**
     * Validate donation init request body
     * @param {Object} body - Request body
     * @returns {Object} - { isValid, errors }
     */
    validateDonationInit: (body) => {
        const errors = [];

        // Amount validation
        if (!body.amount) {
            errors.push('Amount is required');
        } else if ( body.amount < 1) {
            errors.push('Amount must be a positive number (minimum 1)');
        }

        // Purpose validation
        const validPurposes = ['Education', 'Food', 'Healthcare', 'Clothing', 'Shelter', 'Emergency Help','other'];
        if (!body.purpose) {
            errors.push('Purpose is required');
        } else if (!validPurposes.includes(body.purpose)) {
            errors.push(`Purpose must be one of: ${validPurposes.join(', ')}`);
        }

        // OrphanageId validation
        if (!body.orphanageId) {
            errors.push('Orphanage ID is required');
        } else if (!mongoose.Types.ObjectId.isValid(body.orphanageId)) {
            errors.push('Invalid Orphanage ID format');
        }

        // ChildId validation (optional)
        if (body.childId && !mongoose.Types.ObjectId.isValid(body.childId)) {
            errors.push('Invalid Child ID format');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    },

    /**
     * Validate donation verify request body
     * @param {Object} body - Request body
     * @returns {Object} - { isValid, errors }
     */
    validateDonationVerify: (body) => {
        const errors = [];

        if (!body.donationId) {
            errors.push('Donation ID is required');
        } else if (!mongoose.Types.ObjectId.isValid(body.donationId)) {
            errors.push('Invalid Donation ID format');
        }

        if (!body.razorpay_order_id) {
            errors.push('Razorpay Order ID is required');
        }

        if (!body.razorpay_payment_id) {
            errors.push('Razorpay Payment ID is required');
        }

        if (!body.razorpay_signature) {
            errors.push('Razorpay Signature is required');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
};

module.exports = validators;
