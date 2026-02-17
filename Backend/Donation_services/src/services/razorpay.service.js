const razorpay = require('../config/razorpay.config');
const crypto = require('crypto');
require('dotenv').config();

/**
 * Razorpay Service
 * Handles all Razorpay payment operations
 */
const razorpayService = {
    /**
     * Create a Razorpay Order
     * @param {number} amount - Amount in INR (will be converted to paise)
     * @param {string} receiptId - Unique receipt ID (donation ID)
     * @param {string} currency - Currency code (default: INR)
     * @returns {Promise<Object>} - Razorpay order object
     */
    createOrder: async (amount, receiptId, currency = 'INR') => {
        try {
            const options = {
                amount: amount * 100, // Convert to paise
                currency: currency,
                receipt: receiptId,
                notes: {
                    purpose: 'SoulConnect Donation',
                    receiptId: receiptId
                }
            };

            const order = await razorpay.orders.create(options);
            return order;
        } catch (error) {
            console.error('Razorpay createOrder error:', error);
            throw new Error(`Failed to create Razorpay order: ${error.message}`);
        }
    },

    /**
     * Verify Razorpay Payment Signature
     * @param {string} orderId - Razorpay Order ID
     * @param {string} paymentId - Razorpay Payment ID
     * @param {string} signature - Razorpay Signature
     * @returns {boolean} - True if signature is valid
     */
    verifySignature: (orderId, paymentId, signature) => {
        try {
            const body = orderId + '|' + paymentId;
            const expectedSignature = crypto
                .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
                .update(body.toString())
                .digest('hex');

            return expectedSignature === signature;
        } catch (error) {
            console.error('Razorpay verifySignature error:', error);
            return false;
        }
    },

    /**
     * Fetch Payment Details
     * @param {string} paymentId - Razorpay Payment ID
     * @returns {Promise<Object>} - Payment details
     */
    fetchPayment: async (paymentId) => {
        try {
            const payment = await razorpay.payments.fetch(paymentId);
            return payment;
        } catch (error) {
            console.error('Razorpay fetchPayment error:', error);
            throw new Error(`Failed to fetch payment: ${error.message}`);
        }
    },

    /**
     * Refund a Payment
     * @param {string} paymentId - Razorpay Payment ID
     * @param {number} amount - Amount to refund in INR (optional - full refund if not provided)
     * @returns {Promise<Object>} - Refund details
     */
    refundPayment: async (paymentId, amount = null) => {
        try {
            const options = {};
            
            if (amount) {
                options.amount = amount * 100; // Convert to paise
            }

            const refund = await razorpay.payments.refund(paymentId, options);
            return refund;
        } catch (error) {
            console.error('Razorpay refundPayment error:', error);
            throw new Error(`Failed to refund payment: ${error.message}`);
        }
    },

    /**
     * Fetch Order Details
     * @param {string} orderId - Razorpay Order ID
     * @returns {Promise<Object>} - Order details
     */
    fetchOrder: async (orderId) => {
        try {
            const order = await razorpay.orders.fetch(orderId);
            return order;
        } catch (error) {
            console.error('Razorpay fetchOrder error:', error);
            throw new Error(`Failed to fetch order: ${error.message}`);
        }
    }
};

module.exports = razorpayService;
