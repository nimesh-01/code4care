const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Ensure receipts directory exists
const receiptsDir = path.join(__dirname, '../../receipts');
if (!fs.existsSync(receiptsDir)) {
    fs.mkdirSync(receiptsDir, { recursive: true });
}

/**
 * Generate a unique receipt number
 * Format: SC-YYYYMMDD-XXXXX (e.g., SC-20260209-12345)
 * @param {string} donationId - Donation MongoDB ObjectId
 * @returns {string} Receipt number
 */
const generateReceiptNumber = (donationId) => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const shortId = donationId.toString().slice(-5).toUpperCase();
    return `SC-${year}${month}${day}-${shortId}`;
};

/**
 * Format currency amount in INR
 * @param {number} amount - Amount in smallest unit
 * @returns {string} Formatted amount
 */
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2
    }).format(amount);
};

/**
 * Format date to readable string
 * @param {Date} date - Date object
 * @returns {string} Formatted date
 */
const formatDate = (date) => {
    return new Intl.DateTimeFormat('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(new Date(date));
};

/**
 * Generate PDF receipt for a donation
 * @param {Object} donationData - Donation details
 * @param {string} donationData.donationId - Donation ID
 * @param {string} donationData.receiptNumber - Receipt number
 * @param {string} donationData.donorName - Donor's name
 * @param {string} donationData.donorEmail - Donor's email
 * @param {string} donationData.orphanageName - Orphanage name
 * @param {number} donationData.amount - Donation amount
 * @param {string} donationData.purpose - Donation purpose
 * @param {string} donationData.transactionId - Payment transaction ID
 * @param {Date} donationData.donationDate - Date of donation
 * @returns {Promise<string>} Path to generated PDF
 */
const generateReceipt = (donationData) => {
    return new Promise((resolve, reject) => {
        const {
            donationId,
            receiptNumber,
            donorName,
            donorEmail,
            orphanageName,
            amount,
            purpose,
            transactionId,
            donationDate
        } = donationData;

        const fileName = `receipt_${donationId}.pdf`;
        const filePath = path.join(receiptsDir, fileName);

        const doc = new PDFDocument({
            size: 'A4',
            margin: 50
        });

        const writeStream = fs.createWriteStream(filePath);
        doc.pipe(writeStream);

        // Header
        doc
            .fontSize(24)
            .font('Helvetica-Bold')
            .fillColor('#2C3E50')
            .text('SoulConnect', { align: 'center' });

        doc
            .fontSize(12)
            .font('Helvetica')
            .fillColor('#7F8C8D')
            .text('Donation Receipt', { align: 'center' });

        doc.moveDown(0.5);

        // Horizontal line
        doc
            .strokeColor('#3498DB')
            .lineWidth(2)
            .moveTo(50, doc.y)
            .lineTo(545, doc.y)
            .stroke();

        doc.moveDown(1.5);

        // Receipt Info Box
        doc
            .rect(50, doc.y, 495, 60)
            .fillAndStroke('#F8F9FA', '#E9ECEF');

        const boxY = doc.y + 15;
        doc
            .fontSize(10)
            .fillColor('#6C757D')
            .text('Receipt Number:', 70, boxY);
        
        doc
            .fontSize(12)
            .font('Helvetica-Bold')
            .fillColor('#2C3E50')
            .text(receiptNumber, 170, boxY);

        doc
            .fontSize(10)
            .font('Helvetica')
            .fillColor('#6C757D')
            .text('Date:', 350, boxY);
        
        doc
            .fontSize(12)
            .font('Helvetica-Bold')
            .fillColor('#2C3E50')
            .text(formatDate(donationDate), 390, boxY);

        doc.y = boxY + 50;
        doc.moveDown(1);

        // Donor Details Section
        doc
            .fontSize(14)
            .font('Helvetica-Bold')
            .fillColor('#3498DB')
            .text('Donor Details');

        doc.moveDown(0.5);

        const addDetailRow = (label, value, indent = 50) => {
            doc
                .fontSize(10)
                .font('Helvetica')
                .fillColor('#6C757D')
                .text(label, indent, doc.y, { continued: true, width: 150 });
            doc
                .font('Helvetica-Bold')
                .fillColor('#2C3E50')
                .text(value || 'N/A');
            doc.moveDown(0.3);
        };

        addDetailRow('Name:', donorName);
        addDetailRow('Email:', donorEmail);

        doc.moveDown(1);

        // Donation Details Section
        doc
            .fontSize(14)
            .font('Helvetica-Bold')
            .fillColor('#3498DB')
            .text('Donation Details');

        doc.moveDown(0.5);

        addDetailRow('Donation ID:', donationId);
        addDetailRow('Orphanage:', orphanageName);
        addDetailRow('Purpose:', purpose);
        addDetailRow('Transaction ID:', transactionId);

        doc.moveDown(1);

        // Amount Box
        doc
            .rect(50, doc.y, 495, 70)
            .fillAndStroke('#E8F6F3', '#1ABC9C');

        const amountBoxY = doc.y + 20;
        doc
            .fontSize(14)
            .font('Helvetica')
            .fillColor('#27AE60')
            .text('Donation Amount', 0, amountBoxY, { align: 'center' });

        doc
            .fontSize(28)
            .font('Helvetica-Bold')
            .fillColor('#27AE60')
            .text(formatCurrency(amount), 0, amountBoxY + 25, { align: 'center' });

        doc.y = amountBoxY + 70;
        doc.moveDown(2);

        // Tax Benefit Disclaimer
        doc
            .rect(50, doc.y, 495, 80)
            .fillAndStroke('#FDF2E9', '#E67E22');

        const disclaimerY = doc.y + 12;
        doc
            .fontSize(10)
            .font('Helvetica-Bold')
            .fillColor('#D35400')
            .text('Tax Benefit Information', 70, disclaimerY);

        doc
            .fontSize(9)
            .font('Helvetica')
            .fillColor('#7F8C8D')
            .text(
                'This donation may be eligible for tax deduction under Section 80G of the Income Tax Act, 1961 (subject to applicable limits and conditions). Please consult your tax advisor for specific tax benefits applicable to your donation. SoulConnect is a registered charitable organization.',
                70,
                disclaimerY + 18,
                { width: 455, align: 'justify' }
            );

        doc.y = disclaimerY + 85;
        doc.moveDown(2);

        // Footer
        doc
            .fontSize(10)
            .font('Helvetica')
            .fillColor('#7F8C8D')
            .text('Thank you for your generous donation!', { align: 'center' });

        doc.moveDown(0.5);

        doc
            .fontSize(8)
            .fillColor('#BDC3C7')
            .text('This is a computer-generated receipt and does not require a signature.', { align: 'center' });

        doc.moveDown(1);

        // Bottom line
        doc
            .strokeColor('#3498DB')
            .lineWidth(1)
            .moveTo(50, doc.y)
            .lineTo(545, doc.y)
            .stroke();

        doc.moveDown(0.5);

        doc
            .fontSize(8)
            .fillColor('#BDC3C7')
            .text('SoulConnect | Connecting Hearts, Changing Lives', { align: 'center' })
            .text('support@soulconnect.org | www.soulconnect.org', { align: 'center' });

        // Finalize PDF
        doc.end();

        writeStream.on('finish', () => {
            resolve(filePath);
        });

        writeStream.on('error', (err) => {
            reject(err);
        });
    });
};

/**
 * Get the file path for a receipt
 * @param {string} donationId - Donation ID
 * @returns {string} Receipt file path
 */
const getReceiptPath = (donationId) => {
    return path.join(receiptsDir, `receipt_${donationId}.pdf`);
};

/**
 * Check if receipt exists
 * @param {string} donationId - Donation ID
 * @returns {boolean} True if receipt exists
 */
const receiptExists = (donationId) => {
    const filePath = getReceiptPath(donationId);
    return fs.existsSync(filePath);
};

/**
 * Delete a receipt file
 * @param {string} donationId - Donation ID
 * @returns {boolean} True if deleted successfully
 */
const deleteReceipt = (donationId) => {
    const filePath = getReceiptPath(donationId);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
    }
    return false;
};

module.exports = {
    generateReceipt,
    generateReceiptNumber,
    getReceiptPath,
    receiptExists,
    deleteReceipt,
    formatCurrency,
    formatDate
};
