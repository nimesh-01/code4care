const express = require('express');
const router = express.Router();

const {
    initDonation,
    verifyDonation,
    getUserDonations,
    getOrphanageDonations,
    getDonationById,
    refundDonation,
    getAllDonations,
    generateReceipt,
    downloadReceipt
} = require('../controllers/donation.controller');

const { authMiddleware } = require('../middlewares/auth.middleware');
const { permit } = require('../middlewares/roles.middleware');

/**
 * @route   POST /donation/init
 * @desc    Initialize a donation and create payment order
 * @access  Protected (Any authenticated user)
 */
router.post('/init', authMiddleware, initDonation);

/**
 * @route   POST /donation/verify
 * @desc    Verify payment and confirm donation
 * @access  Protected (Any authenticated user)
 */
router.post('/verify', authMiddleware, verifyDonation);

/**
 * @route   GET /donation/all
 * @desc    Get all donations (Admin dashboard)
 * @access  Protected (SuperAdmin only)
 */
router.get('/all', authMiddleware, permit('superAdmin'), getAllDonations);

/**
 * @route   GET /donation/user/:userId
 * @desc    Get donation history for a specific user
 * @access  Protected (Same user or SuperAdmin)
 */
router.get('/user/:userId', authMiddleware, getUserDonations);

/**
 * @route   GET /donation/orphanage/:orphanageId
 * @desc    Get donations for a specific orphanage
 * @access  Protected (OrphanAdmin of that orphanage or SuperAdmin)
 */
router.get('/orphanage/:orphanageId', authMiddleware, permit('orphanAdmin', 'superAdmin'), getOrphanageDonations);

/**
 * @route   GET /donation/:id
 * @desc    Get single donation details
 * @access  Protected (Donor, OrphanAdmin, or SuperAdmin)
 */
router.get('/:id', authMiddleware, getDonationById);

/**
 * @route   POST /donation/:id/refund
 * @desc    Refund a donation
 * @access  Protected (SuperAdmin only)
 */
router.post('/:id/refund', authMiddleware, permit('superAdmin'), refundDonation);

/**
 * @route   POST /donation/:id/receipt
 * @desc    Generate receipt for a successful donation
 * @access  Protected (Donor only)
 */
router.post('/:id/receipt', authMiddleware, generateReceipt);

/**
 * @route   GET /donation/:id/receipt
 * @desc    Download receipt for a donation
 * @access  Protected (Donor only)
 */
router.get('/:id/receipt', authMiddleware, downloadReceipt);

module.exports = router;
