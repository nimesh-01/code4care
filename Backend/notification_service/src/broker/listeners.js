const { subscribeToQueue } = require('./broker')
const sendEmail = require('../email')

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000'

module.exports = async () => {
  // ================== AUTH NOTIFICATIONS ==================

  // User Registration Welcome Email
  subscribeToQueue("AUTH_NOTIFICATION.USER_CREATED", async (data) => {
    const emailHTMLTemplate = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #4A90A4;">Welcome to SoulConnect! 🎉</h1>
      <p>Dear ${data.fullname || data.username || "User"},</p>
      <p>Thank you for registering with SoulConnect. We're excited to have you on board!</p>
      <p>You can now:</p>
      <ul>
        <li>Browse orphanages and learn about their needs</li>
        <li>Schedule appointments to visit orphanages</li>
        <li>Connect with children and make a difference</li>
      </ul>
      <p>Best regards,<br><strong>The SoulConnect Team</strong></p>
    </div>
  `;

    await sendEmail(
      data.email,
      "Welcome to SoulConnect 🎉",
      "Thank you for registering with SoulConnect!",
      emailHTMLTemplate
    );
  });

  // Orphanage Admin Registration Email
  subscribeToQueue("AUTH_NOTIFICATION.ORPHANAGE_ADMIN_CREATED", async (data) => {
    const emailHTMLTemplate = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #4A90A4;">Welcome to SoulConnect - Orphanage Admin 🏠</h1>
      <p>Dear ${data.fullname || data.username || "Admin"},</p>
      <p>Thank you for registering <strong>${data.orphanageName || "your orphanage"}</strong> with SoulConnect.</p>
      <p>Your registration is currently <strong>pending verification</strong>. Our team will review your documents and approve your account shortly.</p>
      <p>Once approved, you'll be able to:</p>
      <ul>
        <li>Manage your orphanage profile</li>
        <li>Add and manage children profiles</li>
        <li>Handle appointment requests from volunteers and visitors</li>
        <li>Post help requests for donations and support</li>
      </ul>
      <p>We'll notify you once your account has been verified.</p>
      <p>Best regards,<br><strong>The SoulConnect Team</strong></p>
    </div>
  `;

    await sendEmail(
      data.email,
      "Welcome to SoulConnect - Orphanage Registration Received 🏠",
      "Your orphanage registration has been received and is pending verification.",
      emailHTMLTemplate
    );
  });

  // Password Reset Request Email
  subscribeToQueue("AUTH_NOTIFICATION.PASSWORD_RESET", async (data) => {
    const resetLink = `${FRONTEND_URL}/reset-password?token=${data.token}`;
    const emailHTMLTemplate = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #4A90A4;">Password Reset Request 🔐</h1>
      <p>Dear User,</p>
      <p>We received a request to reset your password for your SoulConnect account.</p>
      <p>Click the button below to reset your password:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetLink}" style="background-color: #4A90A4; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
      </div>
      <p>Or copy and paste this link in your browser:</p>
      <p style="word-break: break-all; color: #666;">${resetLink}</p>
      <p><strong>This link will expire in 1 hour.</strong></p>
      <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
      <p>Best regards,<br><strong>The SoulConnect Team</strong></p>
    </div>
  `;

    await sendEmail(
      data.email,
      "Password Reset Request - SoulConnect 🔐",
      `Reset your password using this link: ${resetLink}`,
      emailHTMLTemplate
    );
  });

  // Password Reset Completed Email
  subscribeToQueue("AUTH_NOTIFICATION.PASSWORD_RESET_COMPLETED", async (data) => {
    const emailHTMLTemplate = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #4A90A4;">Password Reset Successful ✅</h1>
      <p>Dear User,</p>
      <p>Your password has been successfully reset.</p>
      <p>If you did not make this change, please contact our support team immediately.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${FRONTEND_URL}/login" style="background-color: #4A90A4; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Login Now</a>
      </div>
      <p>Best regards,<br><strong>The SoulConnect Team</strong></p>
    </div>
  `;

    await sendEmail(
      data.email,
      "Password Reset Successful - SoulConnect ✅",
      "Your password has been successfully reset.",
      emailHTMLTemplate
    );
  });

  // ================== APPOINTMENT NOTIFICATIONS ==================

  // Appointment Approved Email
  subscribeToQueue("APPOINTMENT_NOTIFICATION.APPROVED", async (data) => {
    const appointmentDate = data.requestedAt ? new Date(data.requestedAt).toLocaleString() : 'To be confirmed';
    const emailHTMLTemplate = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #28a745;">Appointment Approved! ✅</h1>
      <p>Dear ${data.requesterName || "User"},</p>
      <p>Great news! Your appointment request has been <strong style="color: #28a745;">approved</strong>.</p>
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Appointment Details:</h3>
        <p><strong>Orphanage:</strong> ${data.orphanageName || 'N/A'}</p>
        <p><strong>Date & Time:</strong> ${appointmentDate}</p>
        <p><strong>Purpose:</strong> ${data.purpose || 'N/A'}</p>
        ${data.adminResponse ? `<p><strong>Message from Orphanage:</strong> ${data.adminResponse}</p>` : ''}
      </div>
      <p>Please arrive on time and bring a valid ID for verification.</p>
      <p>If you need to cancel or reschedule, please do so at least 24 hours in advance.</p>
      <p>Best regards,<br><strong>The SoulConnect Team</strong></p>
    </div>
  `;

    await sendEmail(
      data.requesterEmail,
      "Appointment Approved - SoulConnect ✅",
      `Your appointment at ${data.orphanageName || 'the orphanage'} has been approved for ${appointmentDate}.`,
      emailHTMLTemplate
    );
  });

  // Appointment Rejected Email
  subscribeToQueue("APPOINTMENT_NOTIFICATION.REJECTED", async (data) => {
    const emailHTMLTemplate = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #dc3545;">Appointment Request Update ❌</h1>
      <p>Dear ${data.requesterName || "User"},</p>
      <p>We regret to inform you that your appointment request has been <strong style="color: #dc3545;">declined</strong>.</p>
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Request Details:</h3>
        <p><strong>Orphanage:</strong> ${data.orphanageName || 'N/A'}</p>
        <p><strong>Requested Date:</strong> ${data.requestedAt ? new Date(data.requestedAt).toLocaleString() : 'N/A'}</p>
        <p><strong>Purpose:</strong> ${data.purpose || 'N/A'}</p>
        ${data.adminResponse ? `<p><strong>Reason:</strong> ${data.adminResponse}</p>` : '<p><strong>Reason:</strong> No specific reason provided.</p>'}
      </div>
      <p>You may try requesting a different date or contact the orphanage for more information.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${FRONTEND_URL}/appointments/new" style="background-color: #4A90A4; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Request New Appointment</a>
      </div>
      <p>Best regards,<br><strong>The SoulConnect Team</strong></p>
    </div>
  `;

    await sendEmail(
      data.requesterEmail,
      "Appointment Request Declined - SoulConnect",
      `Your appointment request at ${data.orphanageName || 'the orphanage'} has been declined.`,
      emailHTMLTemplate
    );
  });

  // Appointment Cancelled Email (to Orphanage)
  subscribeToQueue("APPOINTMENT_NOTIFICATION.CANCELLED", async (data) => {
    const emailHTMLTemplate = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #ffc107;">Appointment Cancelled ⚠️</h1>
      <p>Dear Admin,</p>
      <p>An appointment has been <strong>cancelled</strong> by the visitor.</p>
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Cancelled Appointment Details:</h3>
        <p><strong>Visitor:</strong> ${data.requesterName || 'N/A'}</p>
        <p><strong>Scheduled Date:</strong> ${data.requestedAt ? new Date(data.requestedAt).toLocaleString() : 'N/A'}</p>
        <p><strong>Purpose:</strong> ${data.purpose || 'N/A'}</p>
      </div>
      <p>Best regards,<br><strong>The SoulConnect Team</strong></p>
    </div>
  `;

    await sendEmail(
      data.orphanageEmail,
      "Appointment Cancelled - SoulConnect ⚠️",
      `An appointment scheduled for ${data.requestedAt ? new Date(data.requestedAt).toLocaleString() : 'N/A'} has been cancelled.`,
      emailHTMLTemplate
    );
  });

  // New Appointment Request Email (to Orphanage)
  subscribeToQueue("APPOINTMENT_NOTIFICATION.NEW_REQUEST", async (data) => {
    const emailHTMLTemplate = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #4A90A4;">New Appointment Request 📅</h1>
      <p>Dear Admin,</p>
      <p>You have received a new appointment request.</p>
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Request Details:</h3>
        <p><strong>From:</strong> ${data.requesterName || 'N/A'} (${data.requesterType || 'User'})</p>
        <p><strong>Requested Date:</strong> ${data.requestedAt ? new Date(data.requestedAt).toLocaleString() : 'N/A'}</p>
        <p><strong>Purpose:</strong> ${data.purpose || 'N/A'}</p>
      </div>
      <p>Please review and respond to this request at your earliest convenience.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${FRONTEND_URL}/dashboard/appointments" style="background-color: #4A90A4; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Appointments</a>
      </div>
      <p>Best regards,<br><strong>The SoulConnect Team</strong></p>
    </div>
  `;

    await sendEmail(
      data.orphanageEmail,
      "New Appointment Request - SoulConnect 📅",
      `New appointment request from ${data.requesterName || 'a visitor'} for ${data.requestedAt ? new Date(data.requestedAt).toLocaleString() : 'N/A'}.`,
      emailHTMLTemplate
    );
  });

  // ================== PAYMENT NOTIFICATIONS ==================

  subscribeToQueue("PAYMENT_NOTIFICATION.PAYMENT_INITIATED", async (data) => {
    const emailHTMLTemplate = `
   <h1>Payment Initiated ✅</h1>
   <p>Dear ${data.username},</p>
   <p>Your payment for the orderId : ${data.orderId} has been initiated.</p>
   <p>We will notify you once the payment is completed.</p>
   <p>Best regards,<br>The SoulConnect Team</p>
 `;

    await sendEmail(
      data.email,
      "Payment Initiated",
      `Your payment for the orderId : ${data.orderId} has initiated ✅`,
      emailHTMLTemplate
    );
  });

  subscribeToQueue("PAYMENT_NOTIFICATION.PAYMENT_COMPLETED", async (data) => {
    const emailHTMLTemplate = `
    <h1>Payment Successful! ✅</h1>
    <p>Dear ${data.username},</p>
    <p>We have received your payment of ${data.currency} ${data.amount} for the order successfully.</p>
    <p>Thank you for your purchase! 🎉</p>
    <p>Best regards,<br>The SoulConnect Team</p>
  `;

    await sendEmail(
      data.email,
      "Payment Successful ✅",
      `We have received your payment of ${data.currency} ${data.amount}.`,
      emailHTMLTemplate
    );
  });

  subscribeToQueue("PAYMENT_NOTIFICATION.PAYMENT_FAILED", async (data) => {
    const emailHTMLTemplate = `
    <h1>Payment Failed ❌</h1>
    <p>Dear ${data.username},</p>
    <p>Unfortunately, your payment for the orderId : ${data.orderId} has failed</p>
    <p>Please try again later or contact support if the issue persists.</p>
    <p>Best regards,<br>The SoulConnect Team</p>
  `;

    await sendEmail(
      data.email,
      "Payment Failed ❌",
      `Your payment for the orderId : ${data.orderId} has failed. Please try again.`,
      emailHTMLTemplate
    );
  });

  subscribeToQueue("PRODUCT_NOTIFICATION.PRODUCT_CREATED", async (data) => {
    const emailHTMLTemplate = `
      <h1>New Product Available!</h1>
      <p>Dear ${data.username},</p>
      <p>Check it out and enjoy exclusive launch offers!</p>
      <p>Best regards,<br>The SoulConnect Team</p>
    `;

    await sendEmail(
      data.email,
      "New Product Launched 🚀",
      "Check out our newly launched product!",
      emailHTMLTemplate
    );
  });

  console.log("✅ All notification listeners set up successfully");
}