const { validationResult } = require('express-validator');
const Appointment = require('../models/appointment.model');
const axios = require('axios');
const { publishToQueue } = require('../broker/broker');

const sendNotification = ({ to, subject, message }) => {
    console.log('Notify', to, subject, message);
};

// Helper function to get user details from auth service
const getUserDetails = async (userId, req) => {
    try {
        const authUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:3000';
        const headers = {};
        if (req.headers && req.headers.cookie) headers['Cookie'] = req.headers.cookie;
        const resp = await axios.get(`${authUrl}/auth/user/${userId}`, { headers, withCredentials: true });
        return resp?.data?.user || null;
    } catch (e) {
        console.warn('Could not fetch user details:', e.message);
        return null;
    }
};

// Helper function to get orphanage details from auth service
const getOrphanageDetails = async (orphanageId, req) => {
    try {
        const authUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:3000';
        const headers = {};
        if (req.headers && req.headers.cookie) headers['Cookie'] = req.headers.cookie;
        const resp = await axios.get(`${authUrl}/auth/orphanage/${orphanageId}`, { headers, withCredentials: true });
        return resp?.data?.orphanage || null;
    } catch (e) {
        console.warn('Could not fetch orphanage details:', e.message);
        return null;
    }
};

const resolveOrphanageId = async (req) => {
    try {
        const authUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:3000/auth/orphanage';
        const headers = {};
        if (req.headers && req.headers.cookie) headers['Cookie'] = req.headers.cookie;
        const resp = await axios.get(authUrl, { headers, withCredentials: true });
        if (resp?.data?.orphanage?._id) return resp.data.orphanage._id;
    } catch (e) {
        console.warn('Could not fetch orphanage from auth service:', e.message);
    }
    return null;
};

const requestAppointment = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { requestedAt, purpose, orphanageId } = req.body;
    const { id, role } = req.user;
    try {
        let response = await Appointment.findOne({
            requesterId: id,
            orphanageId: orphanageId,
            status: { $ne: "cancelled" }
        });

        if (response) return res.status(400).json({ msg: "Request is already made" });

    }
    catch (err) {
        res.status(500).json({ error: 'Failed to fetch appointment', err });

    }

    try {
        const appt = await Appointment.create({
            requesterId: id,
            requesterType: role === 'volunteer' ? 'volunteer' : 'user',
            orphanageId,
            requestedAt: new Date(requestedAt),
            purpose,
            status: 'pending',
        });

        // Get user and orphanage details for notification
        const [requesterDetails, orphanageDetails] = await Promise.all([
            getUserDetails(id, req),
            getOrphanageDetails(orphanageId, req)
        ]);

        // Notify orphanage about new appointment request
        if (orphanageDetails?.orphanage_mail) {
            await publishToQueue('APPOINTMENT_NOTIFICATION.NEW_REQUEST', {
                orphanageEmail: orphanageDetails.orphanage_mail,
                orphanageName: orphanageDetails.name,
                requesterName: requesterDetails ? `${requesterDetails.fullname?.firstname || ''} ${requesterDetails.fullname?.lastname || ''}`.trim() : 'A visitor',
                requesterType: role === 'volunteer' ? 'Volunteer' : 'User',
                requestedAt: appt.requestedAt,
                purpose: appt.purpose
            });
        }

        sendNotification({ to: `orphanage:${orphanageId}`, subject: 'New appointment request', message: `${id} requested an appointment.` });

        res.status(201).json({ message: 'Appointment request submitted successfully', appointment: appt });
    } catch (err) {
        res.status(500).json({ error: 'Failed to create appointment', err });
    }
};

const getAllAppointments = async (req, res) => {
    const { role, id: userId, orphanageId } = req.user || {};
    const { status, sort = 'requestedAt', order = 'asc' } = req.query;

    const filter = {};
    if (status) filter.status = status;

    if (role === 'User' || role === 'Volunteer') {
        filter.requesterId = userId;
    } else if (role === 'OrphanageAdmin') {
        filter.orphanageId = orphanageId;
    }

    try {
        const appts = await Appointment.find(filter).sort({ [sort]: order === 'asc' ? 1 : -1 });
        res.json({ appointments: appts });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch appointments' });
    }
};

const approveAppointment = async (req, res) => {
    const { id } = req.params;

    const orphanageId = await resolveOrphanageId(req);

    const appt = await Appointment.findById(id);
    if (!appt) return res.status(404).json({ error: 'Appointment not found' });
    if (String(appt.orphanageId) !== String(orphanageId)) return res.status(403).json({ error: 'Not allowed for this orphanage' });

    appt.status = 'approved';
    if (req.body.requestedAt) appt.requestedAt = new Date(req.body.requestedAt);
    if (req.body.adminResponse) appt.adminResponse = req.body.adminResponse;
    await appt.save();

    // Get user and orphanage details for email notification
    const [requesterDetails, orphanageDetails] = await Promise.all([
        getUserDetails(appt.requesterId, req),
        getOrphanageDetails(appt.orphanageId, req)
    ]);

    // Send email notification to the requester
    if (requesterDetails?.email) {
        await publishToQueue('APPOINTMENT_NOTIFICATION.APPROVED', {
            requesterEmail: requesterDetails.email,
            requesterName: `${requesterDetails.fullname?.firstname || ''} ${requesterDetails.fullname?.lastname || ''}`.trim(),
            orphanageName: orphanageDetails?.name || 'the orphanage',
            requestedAt: appt.requestedAt,
            purpose: appt.purpose,
            adminResponse: appt.adminResponse
        });
    }

    sendNotification({ to: `user:${appt.requesterId}`, subject: 'Appointment approved', message: `Your appointment has been approved.` });

    res.json({ message: 'Appointment approved', appointment: appt });
}

const rejectAppointment = async (req, res) => {
    const { id } = req.params;

    try {
        const orphanageId = await resolveOrphanageId(req);
        console.log(orphanageId)
        const appt = await Appointment.findById(id);
        console.log(appt)
        if (!appt) return res.status(404).json({ error: 'Appointment not found' });
        if (String(appt.orphanageId) !== String(orphanageId)) return res.status(403).json({ error: 'Not allowed for this orphanage' });

        appt.status = 'rejected';
        if (req.body.adminResponse) appt.adminResponse = req.body.adminResponse;
        await appt.save();

        // Get user and orphanage details for email notification
        const [requesterDetails, orphanageDetails] = await Promise.all([
            getUserDetails(appt.requesterId, req),
            getOrphanageDetails(appt.orphanageId, req)
        ]);

        // Send email notification to the requester
        if (requesterDetails?.email) {
            await publishToQueue('APPOINTMENT_NOTIFICATION.REJECTED', {
                requesterEmail: requesterDetails.email,
                requesterName: `${requesterDetails.fullname?.firstname || ''} ${requesterDetails.fullname?.lastname || ''}`.trim(),
                orphanageName: orphanageDetails?.name || 'the orphanage',
                requestedAt: appt.requestedAt,
                purpose: appt.purpose,
                adminResponse: appt.adminResponse
            });
        }

        sendNotification({ to: `user:${appt.requesterId}`, subject: 'Appointment rejected', message: `Your appointment was rejected: ${appt.adminResponse || 'No reason provided'}` });

        res.json({ message: 'Appointment rejected', appointment: appt });
    } catch (err) {
        res.status(500).json({ error: 'Failed to reject appointment' });
    }
};

const cancelAppointment = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id
    const role = req.user.role
    try {
        const appt = await Appointment.findById(id);
        if (!appt) return res.status(404).json({ error: 'Appointment not found' });
        if (String(appt.requesterId) !== String(userId)) return res.status(403).json({ error: 'Not your appointment' });
        appt.status = 'cancelled';
        await appt.save();

        // Get user and orphanage details for email notification
        const [requesterDetails, orphanageDetails] = await Promise.all([
            getUserDetails(userId, req),
            getOrphanageDetails(appt.orphanageId, req)
        ]);

        // Notify orphanage about cancellation
        if (orphanageDetails?.orphanage_mail) {
            await publishToQueue('APPOINTMENT_NOTIFICATION.CANCELLED', {
                orphanageEmail: orphanageDetails.orphanage_mail,
                orphanageName: orphanageDetails.name,
                requesterName: requesterDetails ? `${requesterDetails.fullname?.firstname || ''} ${requesterDetails.fullname?.lastname || ''}`.trim() : 'A visitor',
                requestedAt: appt.requestedAt,
                purpose: appt.purpose
            });
        }

        sendNotification({ to: `orphanage:${appt.orphanageId}`, subject: 'Appointment cancelled', message: `${userId} cancelled an appointment.` });

        res.json({ message: 'Appointment cancelled', appointment: appt });
    } catch (err) {
        res.status(500).json({ error: 'Failed to cancel appointment' });
    }
};

module.exports = {
    requestAppointment,
    getAllAppointments,
    approveAppointment,
    rejectAppointment,
    cancelAppointment,
};
