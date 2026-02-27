const Donation = require('../models/donation.model');
const razorpayService = require('../services/razorpay.service');
const asyncHandler = require('../utils/asyncHandler');
const validators = require('../utils/validators');
const receiptGenerator = require('../utils/receiptGenerator');
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');
const { Parser } = require('json2csv');

const assertOrphanageAccess = (user, orphanageId) => {
    if (user.role === 'orphanAdmin') {
        return Boolean(user.orphanageId && user.orphanageId.toString() === orphanageId);
    }

    return user.role === 'superAdmin';
};

const ensureReceiptForDonation = async (donation) => {
    if (donation.status !== 'success') return null;

    const donationId = donation._id.toString();
    let shouldSave = false;

    if (!donation.receiptNumber) {
        donation.receiptNumber = receiptGenerator.generateReceiptNumber(donationId);
        shouldSave = true;
    }

    if (!donation.receiptUrl) {
        donation.receiptUrl = `/donation/${donationId}/receipt`;
        shouldSave = true;
    }

    if (!receiptGenerator.receiptExists(donationId)) {
        await receiptGenerator.generateReceipt({
            donationId,
            receiptNumber: donation.receiptNumber,
            donorName: donation.donorDetails?.name || 'Anonymous Supporter',
            donorEmail: donation.donorDetails?.email || 'Not provided',
            orphanageName: donation.orphanageName || donation.orphanageId.toString(),
            amount: donation.amount,
            purpose: donation.purpose,
            transactionId: donation.payment?.paymentId || donation.payment?.orderId || 'N/A',
            donationDate: donation.createdAt
        });
    }

    if (shouldSave) {
        await donation.save();
    }

    return {
        path: receiptGenerator.getReceiptPath(donationId),
        name: `${donation.receiptNumber || donationId}.pdf`
    };
};

/**
 * @desc    Initialize a donation and create Razorpay order
 * @route   POST /donation/init
 * @access  Protected (User)
 */
const initDonation = asyncHandler(async (req, res) => {
    const { amount, purpose, orphanageId, childId, notes } = req.body;

    // Validate request body
    const validation = validators.validateDonationInit(req.body);
    if (!validation.isValid) {
        res.status(400);
        throw new Error(validation.errors.join(', '));
    }

    // Create donation record with PENDING status
    const donation = new Donation({
        donorId: req.user.id,
        orphanageId,
        childId: childId || null,
        amount,
        purpose,
        gateway: 'razorpay',
        status: 'pending',
        donorDetails: {
            name: req.user.name,
            email: req.user.email
        },
        notes: notes || null
    });

    await donation.save();

    // Create Razorpay order
    const order = await razorpayService.createOrder(amount, donation._id.toString());

    // Save order ID to donation
    donation.payment.orderId = order.id;
    await donation.save();

    res.status(201).json({
        success: true,
        message: 'Donation initiated successfully',
        data: {
            donationId: donation._id,
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            keyId: process.env.RAZORPAY_KEY_ID
        }
    });
});

/**
 * @desc    Verify payment and update donation status
 * @route   POST /donation/verify
 * @access  Protected (User)
 */
const verifyDonation = asyncHandler(async (req, res) => {
    const { donationId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // Validate request body
    const validation = validators.validateDonationVerify(req.body);
    if (!validation.isValid) {
        res.status(400);
        throw new Error(validation.errors.join(', '));
    }

    // Find donation
    const donation = await Donation.findById(donationId);
    if (!donation) {
        res.status(404);
        throw new Error('Donation not found');
    }

    // Check if donation belongs to user
    if (donation.donorId.toString() !== req.user.id) {
        res.status(403);
        throw new Error('Not authorized to verify this donation');
    }

    // Check if donation is already processed
    if (donation.status !== 'pending') {
        res.status(400);
        throw new Error(`Donation already processed with status: ${donation.status}`);
    }

    // Verify Razorpay signature
    const isValid = razorpayService.verifySignature(
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
    );

    if (isValid) {
        // Update donation with success status
        donation.status = 'success';
        donation.payment.paymentId = razorpay_payment_id;
        donation.payment.signature = razorpay_signature;
        await donation.save();

        // Auto-generate receipt for successful donation
        let receiptUrl = null;
        try {
            const receiptNumber = receiptGenerator.generateReceiptNumber(donation._id.toString());
            const receiptPath = await receiptGenerator.generateReceipt({
                donationId: donation._id.toString(),
                receiptNumber,
                donorName: req.user.name,
                donorEmail: req.user.email,
                orphanageName: donation.orphanageId.toString(), // Will be populated if needed
                amount: donation.amount,
                purpose: donation.purpose,
                transactionId: razorpay_payment_id,
                donationDate: donation.createdAt
            });
            
            receiptUrl = `/donation/${donation._id}/receipt`;
            donation.receiptUrl = receiptUrl;
            donation.receiptNumber = receiptNumber;
            await donation.save();
        } catch (receiptError) {
            console.error('Receipt generation failed:', receiptError.message);
            // Don't fail the verification, just log the error
        }

        res.status(200).json({
            success: true,
            message: 'Payment verified successfully. Thank you for your donation!',
            data: {
                donationId: donation._id,
                amount: donation.amount,
                status: donation.status,
                purpose: donation.purpose,
                receiptUrl
            }
        });
    } else {
        // Update donation with failed status
        donation.status = 'failed';
        await donation.save();

        res.status(400).json({
            success: false,
            message: 'Payment verification failed. Invalid signature.',
            data: {
                donationId: donation._id,
                status: donation.status
            }
        });
    }
});

/**
 * @desc    Get donation history for a user
 * @route   GET /donation/user/:userId
 * @access  Protected (Same User or SuperAdmin)
 */
const getUserDonations = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { status, purpose, startDate, endDate, page = 1, limit = 10 } = req.query;

    // Validate userId
    if (!validators.isValidObjectId(userId)) {
        res.status(400);
        throw new Error('Invalid User ID format');
    }

    // Check authorization
    if (req.user.role !== 'user' && req.user.role !== 'volunteer' && req.user.role !== 'superAdmin') {
        res.status(403);
        throw new Error('Not authorized to view these donations');
    }

    // Build query
    const query = { donorId: userId };

    if (status) {
        query.status = status;
    }

    if (purpose) {
        query.purpose = purpose;
    }

    if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const donations = await Donation.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

    const total = await Donation.countDocuments(query);

    // Calculate total donated amount (only successful donations)
    const mongoose = require('mongoose');
    const totalDonated = await Donation.aggregate([
        { $match: { donorId: new mongoose.Types.ObjectId(userId), status: 'success' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    res.status(200).json({
        success: true,
        message: 'Donation history retrieved successfully',
        data: {
            donations,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / parseInt(limit)),
                totalDonations: total,
                hasMore: skip + donations.length < total
            },
            summary: {
                totalDonated: totalDonated[0]?.total || 0
            }
        }
    });
});

/**
 * @desc    Get donations for an orphanage
 * @route   GET /donation/orphanage/:orphanageId
 * @access  Protected (OrphanAdmin of that orphanage or SuperAdmin)
 */
const getOrphanageDonations = asyncHandler(async (req, res) => {
    const { orphanageId } = req.params;
    const { status, purpose, startDate, endDate, page = 1, limit = 10 } = req.query;

    // Validate orphanageId
    if (!validators.isValidObjectId(orphanageId)) {
        res.status(400);
        throw new Error('Invalid Orphanage ID format');
    }

    // Check authorization
    if (req.user.role === 'orphanAdmin') {
        if (!req.user.orphanageId || req.user.orphanageId.toString() !== orphanageId) {
            res.status(403);
            throw new Error('Not authorized to view donations for this orphanage');
        }
    } else if (req.user.role !== 'superAdmin') {
        res.status(403);
        throw new Error('Not authorized to view these donations');
    }

    // Build query
    const query = { orphanageId };

    if (status) {
        query.status = status;
    }

    if (purpose) {
        query.purpose = purpose;
    }

    if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const donations = await Donation.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

    const total = await Donation.countDocuments(query);

    // Calculate stats
    const mongoose = require('mongoose');
    const stats = await Donation.aggregate([
        { $match: { orphanageId: new mongoose.Types.ObjectId(orphanageId), status: 'success' } },
        {
            $group: {
                _id: null,
                totalAmount: { $sum: '$amount' },
                totalDonations: { $sum: 1 }
            }
        }
    ]);

    // Purpose-wise breakdown
    const purposeBreakdown = await Donation.aggregate([
        { $match: { orphanageId: new mongoose.Types.ObjectId(orphanageId), status: 'success' } },
        {
            $group: {
                _id: '$purpose',
                amount: { $sum: '$amount' },
                count: { $sum: 1 }
            }
        }
    ]);

    res.status(200).json({
        success: true,
        message: 'Orphanage donations retrieved successfully',
        data: {
            donations,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / parseInt(limit)),
                totalDonations: total,
                hasMore: skip + donations.length < total
            },
            stats: {
                totalAmount: stats[0]?.totalAmount || 0,
                totalDonations: stats[0]?.totalDonations || 0,
                purposeBreakdown
            }
        }
    });
});

/**
 * @desc    Download ZIP containing all receipts for an orphanage
 * @route   GET /donation/orphanage/:orphanageId/receipts
 * @access  Protected (OrphanAdmin of that orphanage or SuperAdmin)
 */
const downloadOrphanageReceipts = asyncHandler(async (req, res) => {
    const { orphanageId } = req.params;
    const { startDate, endDate } = req.query;

    if (!validators.isValidObjectId(orphanageId)) {
        res.status(400);
        throw new Error('Invalid Orphanage ID format');
    }

    if (!assertOrphanageAccess(req.user, orphanageId)) {
        res.status(403);
        throw new Error('Not authorized to download receipts for this orphanage');
    }

    const query = { orphanageId, status: 'success' };
    if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const donations = await Donation.find(query).sort({ createdAt: -1 });

    if (!donations.length) {
        res.status(404);
        throw new Error('No successful donations found for this orphanage');
    }

    const receiptEntries = [];
    for (const donation of donations) {
        const receiptInfo = await ensureReceiptForDonation(donation);
        if (receiptInfo) receiptEntries.push({ ...receiptInfo, donation });
    }

    if (!receiptEntries.length) {
        res.status(400);
        throw new Error('No receipts available to download for the selected criteria');
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="soulconnect-receipts-${timestamp}.zip"`);

    const archive = archiver('zip', { zlib: { level: 9 } });

    await new Promise((resolve, reject) => {
        archive.on('error', reject);
        res.on('finish', resolve);
        archive.pipe(res);
        receiptEntries.forEach((entry) => {
            archive.file(entry.path, { name: `${entry.name}` });
        });
        archive.finalize().catch(reject);
    });
});

/**
 * @desc    Export orphanage donations as CSV report
 * @route   GET /donation/orphanage/:orphanageId/export
 * @access  Protected (OrphanAdmin of that orphanage or SuperAdmin)
 */
const exportOrphanageDonations = asyncHandler(async (req, res) => {
    const { orphanageId } = req.params;
    const { status, purpose, startDate, endDate } = req.query;

    if (!validators.isValidObjectId(orphanageId)) {
        res.status(400);
        throw new Error('Invalid Orphanage ID format');
    }

    if (!assertOrphanageAccess(req.user, orphanageId)) {
        res.status(403);
        throw new Error('Not authorized to export donations for this orphanage');
    }

    const query = { orphanageId };
    if (status && status !== 'all') query.status = status;
    if (purpose && purpose !== 'all') query.purpose = purpose;
    if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const donations = await Donation.find(query).sort({ createdAt: -1 });

    const rows = donations.map((donation) => ({
        receiptNumber: donation.receiptNumber || '',
        donorName: donation.donorDetails?.name || 'Anonymous Supporter',
        donorEmail: donation.donorDetails?.email || '',
        amount: donation.amount,
        purpose: donation.purpose,
        status: donation.status,
        childId: donation.childId ? donation.childId.toString() : '',
        gateway: donation.gateway,
        transactionId: donation.payment?.paymentId || donation.payment?.orderId || '',
        orphanageId: donation.orphanageId?.toString() || orphanageId,
        createdAt: donation.createdAt ? donation.createdAt.toISOString() : '',
        updatedAt: donation.updatedAt ? donation.updatedAt.toISOString() : ''
    }));

    const fields = [
        { label: 'Receipt Number', value: 'receiptNumber' },
        { label: 'Donor Name', value: 'donorName' },
        { label: 'Donor Email', value: 'donorEmail' },
        { label: 'Amount (INR)', value: 'amount' },
        { label: 'Purpose', value: 'purpose' },
        { label: 'Status', value: 'status' },
        { label: 'Child ID', value: 'childId' },
        { label: 'Gateway', value: 'gateway' },
        { label: 'Transaction ID', value: 'transactionId' },
        { label: 'Orphanage ID', value: 'orphanageId' },
        { label: 'Created At', value: 'createdAt' },
        { label: 'Updated At', value: 'updatedAt' }
    ];

    const parser = new Parser({ fields });
    const csv = parser.parse(rows);

    const timestamp = new Date().toISOString().split('T')[0];
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="soulconnect-donations-${timestamp}.csv"`);
    res.status(200).send(csv);
});

/**
 * @desc    Get single donation by ID
 * @route   GET /donation/:id
 * @access  Protected (Donor, OrphanAdmin, or SuperAdmin)
 */
const getDonationById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Validate donation ID
    if (!validators.isValidObjectId(id)) {
        res.status(400);
        throw new Error('Invalid Donation ID format');
    }

    const donation = await Donation.findById(id);

    if (!donation) {
        res.status(404);
        throw new Error('Donation not found');
    }

    // Check authorization
    const isOwner = donation.donorId.toString() === req.user.id;
    const isOrphanAdmin = req.user.role === 'orphanAdmin' &&
        req.user.orphanageId &&
        donation.orphanageId.toString() === req.user.orphanageId.toString();
    const isSuperAdmin = req.user.role === 'superAdmin';

    if (!isOwner && !isOrphanAdmin && !isSuperAdmin) {
        res.status(403);
        throw new Error('Not authorized to view this donation');
    }

    res.status(200).json({
        success: true,
        message: 'Donation retrieved successfully',
        data: donation
    });
});

/**
 * @desc    Refund a donation
 * @route   POST /donation/:id/refund
 * @access  Protected (SuperAdmin only)
 */
const refundDonation = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;

    // Validate donation ID
    if (!validators.isValidObjectId(id)) {
        res.status(400);
        throw new Error('Invalid Donation ID format');
    }

    const donation = await Donation.findById(id);

    if (!donation) {
        res.status(404);
        throw new Error('Donation not found');
    }

    // Check if donation can be refunded
    if (donation.status !== 'success') {
        res.status(400);
        throw new Error(`Cannot refund donation with status: ${donation.status}. Only SUCCESS donations can be refunded.`);
    }

    if (!donation.payment.paymentId) {
        res.status(400);
        throw new Error('No payment ID found for this donation');
    }

    // Process refund via Razorpay
    const refund = await razorpayService.refundPayment(donation.payment.paymentId);

    // Update donation status
    donation.status = 'refunded';
    donation.payment.refundId = refund.id;
    donation.notes = donation.notes
        ? `${donation.notes} | Refund reason: ${reason || 'Not specified'}`
        : `Refund reason: ${reason || 'Not specified'}`;
    await donation.save();

    res.status(200).json({
        success: true,
        message: 'Donation refunded successfully',
        data: {
            donationId: donation._id,
            refundId: refund.id,
            amount: donation.amount,
            status: donation.status
        }
    });
});

/**
 * @desc    Get all donations (Admin view)
 * @route   GET /donation/all
 * @access  Protected (SuperAdmin only)
 */
const getAllDonations = asyncHandler(async (req, res) => {
    const { status, purpose, gateway, startDate, endDate, page = 1, limit = 20 } = req.query;

    // Build query
    const query = {};

    if (status) query.status = status;
    if (purpose) query.purpose = purpose;
    if (gateway) query.gateway = gateway;

    if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const donations = await Donation.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

    const total = await Donation.countDocuments(query);

    // Overall stats
    const overallStats = await Donation.aggregate([
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                amount: { $sum: '$amount' }
            }
        }
    ]);

    res.status(200).json({
        success: true,
        message: 'All donations retrieved successfully',
        data: {
            donations,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / parseInt(limit)),
                totalDonations: total,
                hasMore: skip + donations.length < total
            },
            stats: overallStats
        }
    });
});

/**
 * @desc    Generate receipt for a successful donation
 * @route   POST /donation/:id/receipt
 * @access  Protected (Donor only)
 */
const generateReceipt = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Validate donation ID
    if (!validators.isValidObjectId(id)) {
        res.status(400);
        throw new Error('Invalid Donation ID format');
    }

    const donation = await Donation.findById(id);

    if (!donation) {
        res.status(404);
        throw new Error('Donation not found');
    }

    // Check authorization - only donor can generate their receipt
    if (donation.donorId.toString() !== req.user.id) {
        res.status(403);
        throw new Error('Not authorized to generate receipt for this donation');
    }

    // Check if donation is successful
    if (donation.status !== 'success') {
        res.status(400);
        throw new Error(`Cannot generate receipt for donation with status: ${donation.status}. Only successful donations have receipts.`);
    }

    // Check if receipt already exists
    if (donation.receiptUrl && receiptGenerator.receiptExists(id)) {
        res.status(200).json({
            success: true,
            message: 'Receipt already exists',
            data: {
                donationId: donation._id,
                receiptNumber: donation.receiptNumber,
                receiptUrl: donation.receiptUrl
            }
        });
        return;
    }

    // Generate receipt
    const receiptNumber = donation.receiptNumber || receiptGenerator.generateReceiptNumber(id);
    
    await receiptGenerator.generateReceipt({
        donationId: id,
        receiptNumber,
        donorName: req.user.name,
        donorEmail: req.user.email,
        orphanageName: donation.orphanageId.toString(),
        amount: donation.amount,
        purpose: donation.purpose,
        transactionId: donation.payment.paymentId,
        donationDate: donation.createdAt
    });

    // Update donation with receipt info
    donation.receiptUrl = `/donation/${id}/receipt`;
    donation.receiptNumber = receiptNumber;
    await donation.save();

    res.status(201).json({
        success: true,
        message: 'Receipt generated successfully',
        data: {
            donationId: donation._id,
            receiptNumber: donation.receiptNumber,
            receiptUrl: donation.receiptUrl
        }
    });
});

/**
 * @desc    Download receipt for a donation
 * @route   GET /donation/:id/receipt
 * @access  Protected (Donor only)
 */
const downloadReceipt = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Validate donation ID
    if (!validators.isValidObjectId(id)) {
        res.status(400);
        throw new Error('Invalid Donation ID format');
    }

    const donation = await Donation.findById(id);

    if (!donation) {
        res.status(404);
        throw new Error('Donation not found');
    }

    const isOwner = donation.donorId.toString() === req.user.id;
    const isOrphanAdmin = req.user.role === 'orphanAdmin' &&
        req.user.orphanageId &&
        donation.orphanageId.toString() === req.user.orphanageId.toString();
    const isSuperAdmin = req.user.role === 'superAdmin';

    if (!isOwner && !isOrphanAdmin && !isSuperAdmin) {
        res.status(403);
        throw new Error('Not authorized to download this receipt');
    }

    // Check if donation is successful
    if (donation.status !== 'success') {
        res.status(400);
        throw new Error(`No receipt available for donation with status: ${donation.status}`);
    }

    const receiptInfo = await ensureReceiptForDonation(donation);
    const receiptPath = receiptInfo?.path || receiptGenerator.getReceiptPath(id);

    // Set response headers for PDF download
    const fileName = `SoulConnect_Receipt_${donation.receiptNumber || id}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    
    // Stream the file
    const fileStream = fs.createReadStream(receiptPath);
    fileStream.pipe(res);
});

module.exports = {
    initDonation,
    verifyDonation,
    getUserDonations,
    getOrphanageDonations,
    downloadOrphanageReceipts,
    exportOrphanageDonations,
    getDonationById,
    refundDonation,
    getAllDonations,
    generateReceipt,
    downloadReceipt
};
