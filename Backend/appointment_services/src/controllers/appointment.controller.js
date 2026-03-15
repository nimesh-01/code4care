const { validationResult } = require('express-validator');
const Appointment = require('../models/appointment.model');
const axios = require('axios');
const { publishToQueue } = require('../broker/broker');

const sendNotification = ({ to, subject, message }) => {
    console.log('Notify', to, subject, message);
};

const normalizeRole = (role) => (role || '').toLowerCase();

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
    const role = normalizeRole(req.user?.role)
    if (role !== 'orphanadmin') {
        return null
    }

    if (req.user?.orphanageId) {
        return req.user.orphanageId
    }

    try {
        const authBase = process.env.AUTH_SERVICE_URL || 'http://localhost:3000'
        const headers = {}
        if (req.headers?.cookie) headers['Cookie'] = req.headers.cookie
        if (req.headers?.authorization) headers['Authorization'] = req.headers.authorization
        const resp = await axios.get(`${authBase}/auth/orphanage`, { headers, withCredentials: true })
        if (resp?.data?.orphanage?._id) return resp.data.orphanage._id
    } catch (e) {
        console.warn('Could not fetch orphanage from auth service:', e.message)
    }
    return null
}

const requestAppointment = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { requestedAt, purpose, orphanageId, childId } = req.body;
    const { id, role } = req.user;
    try {
        const baseFilter = {
            requesterId: id,
            orphanageId: orphanageId,
        };

        if (childId) {
            baseFilter.childId = childId;
        }

        const blockedExists = await Appointment.findOne({
            ...baseFilter,
            status: 'blocked'
        });

        if (blockedExists) {
            return res.status(403).json({ msg: 'You are currently blocked from scheduling appointments with this orphanage.' });
        }

        // Auto-complete any past approved/needsConfirmation appointments
        await Appointment.updateMany(
            {
                ...baseFilter,
                status: { $in: ['approved', 'needsConfirmation'] },
                requestedAt: { $lt: new Date() }
            },
            { $set: { status: 'completed' } }
        );

        const activeRequest = await Appointment.findOne({
            ...baseFilter,
            status: { $in: ['pending', 'approved', 'needsConfirmation'] },
            requestedAt: { $gte: new Date() }
        });

        if (activeRequest) {
            return res.status(400).json({ msg: 'You already have an active appointment request for this orphanage.' });
        }

    }
    catch (err) {
        return res.status(500).json({ error: 'Failed to validate appointment request', details: err.message });

    }

    try {
        const appointmentPayload = {
            requesterId: id,
            requesterType: role === 'volunteer' ? 'volunteer' : 'user',
            orphanageId,
            requestedAt: new Date(requestedAt),
            purpose,
            status: 'pending',
        };

        if (childId) {
            appointmentPayload.childId = childId;
        }

        const appt = await Appointment.create(appointmentPayload);

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
                purpose: appt.purpose,
                appointmentId: appt._id.toString(),
                requesterId: id,
                orphanageAdminId: orphanageDetails.adminId || null,
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

    const normalizedRole = normalizeRole(role);

    if (['user', 'volunteer'].includes(normalizedRole)) {
        filter.requesterId = userId;
    } else if (normalizedRole === 'orphanadmin' && orphanageId) {
        filter.orphanageId = orphanageId;
    }

    try {
        // Auto-complete past approved/needsConfirmation appointments
        await Appointment.updateMany(
            {
                ...(filter.requesterId ? { requesterId: filter.requesterId } : {}),
                ...(filter.orphanageId ? { orphanageId: filter.orphanageId } : {}),
                status: { $in: ['approved', 'needsConfirmation'] },
                requestedAt: { $lt: new Date() }
            },
            { $set: { status: 'completed' } }
        );

        const appts = await Appointment.find(filter).sort({ [sort]: order === 'asc' ? 1 : -1 });
        res.json({ appointments: appts });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch appointments' });
    }
};

const getAppointmentsByOrphanage = async (req, res) => {
    const { orphanageId } = req.params;
    const { role, orphanageId: userOrphanageId } = req.user || {};
    const { status, sort = 'requestedAt', order = 'asc' } = req.query;

    if (!orphanageId) {
        return res.status(400).json({ error: 'orphanageId is required' });
    }

    const normalizedRole = normalizeRole(role);
    if (normalizedRole === 'orphanadmin' && userOrphanageId && String(userOrphanageId) !== String(orphanageId)) {
        return res.status(403).json({ error: 'Not allowed for this orphanage' });
    }

    const filter = { orphanageId };
    if (status) filter.status = status;

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

    const previousRequestedAt = appt.requestedAt ? new Date(appt.requestedAt) : null;
    let newRequestedAt = previousRequestedAt;
    let timeChanged = false;

    if (req.body.requestedAt) {
        const candidate = new Date(req.body.requestedAt);
        if (!isNaN(candidate)) {
            newRequestedAt = candidate;
            if (!previousRequestedAt || previousRequestedAt.getTime() !== candidate.getTime()) {
                timeChanged = true;
            }
        }
    }

    if (newRequestedAt) {
        appt.requestedAt = newRequestedAt;
    }

    if (req.body.adminResponse) appt.adminResponse = req.body.adminResponse;

    if (timeChanged) {
        appt.status = 'needsConfirmation';
        appt.needsUserConfirmation = true;
        appt.userConfirmedAt = null;
        appt.userConfirmationNote = null;
    } else {
        appt.status = 'approved';
        appt.needsUserConfirmation = false;
        appt.userConfirmedAt = new Date();
    }

    await appt.save();

    // Get user and orphanage details for email notification
    const [requesterDetails, orphanageDetails] = await Promise.all([
        getUserDetails(appt.requesterId, req),
        getOrphanageDetails(appt.orphanageId, req)
    ]);

    if (requesterDetails?.email) {
        if (timeChanged) {
            await publishToQueue('APPOINTMENT_NOTIFICATION.NEEDS_CONFIRMATION', {
                requesterEmail: requesterDetails.email,
                requesterName: `${requesterDetails.fullname?.firstname || ''} ${requesterDetails.fullname?.lastname || ''}`.trim(),
                orphanageName: orphanageDetails?.name || 'the orphanage',
                requestedAt: appt.requestedAt,
                purpose: appt.purpose,
                adminResponse: appt.adminResponse,
                appointmentId: appt._id.toString(),
                requesterId: appt.requesterId.toString(),
                requesterRole: requesterDetails.role || 'user',
            });
        } else {
            await publishToQueue('APPOINTMENT_NOTIFICATION.APPROVED', {
                requesterEmail: requesterDetails.email,
                requesterName: `${requesterDetails.fullname?.firstname || ''} ${requesterDetails.fullname?.lastname || ''}`.trim(),
                orphanageName: orphanageDetails?.name || 'the orphanage',
                requestedAt: appt.requestedAt,
                purpose: appt.purpose,
                adminResponse: appt.adminResponse,
                appointmentId: appt._id.toString(),
                requesterId: appt.requesterId.toString(),
                requesterRole: requesterDetails.role || 'user',
            });
        }
    }

    const notificationMessage = timeChanged
        ? 'Appointment updated. Please confirm the new schedule.'
        : 'Your appointment has been approved.';

    sendNotification({ to: `user:${appt.requesterId}`, subject: timeChanged ? 'Appointment needs confirmation' : 'Appointment approved', message: notificationMessage });

    res.json({
        message: timeChanged ? 'Appointment updated and awaiting user confirmation' : 'Appointment approved',
        appointment: appt
    });
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
                adminResponse: appt.adminResponse,
                appointmentId: appt._id.toString(),
                requesterId: appt.requesterId.toString(),
                requesterRole: requesterDetails.role || 'user',
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
        const status = (appt.status || '').toLowerCase();
        if (status === 'approved') {
            return res.status(400).json({ error: 'Approved appointments can only be cancelled by the orphanage.' });
        }
        if (status === 'needsconfirmation') {
            return res.status(400).json({ error: 'Please respond to the pending confirmation instead of cancelling here.' });
        }
        if (status !== 'pending') {
            return res.status(400).json({ error: 'Only pending requests can be cancelled.' });
        }
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
                purpose: appt.purpose,
                appointmentId: appt._id.toString(),
                orphanageAdminId: orphanageDetails.adminId || null,
            });
        }

        sendNotification({ to: `orphanage:${appt.orphanageId}`, subject: 'Appointment cancelled', message: `${userId} cancelled an appointment.` });

        res.json({ message: 'Appointment cancelled', appointment: appt });
    } catch (err) {
        res.status(500).json({ error: 'Failed to cancel appointment' });
    }
};

const blockAppointment = async (req, res) => {
    const { id } = req.params;

    try {
        const orphanageId = await resolveOrphanageId(req);
        const appt = await Appointment.findById(id);
        if (!appt) return res.status(404).json({ error: 'Appointment not found' });
        if (String(appt.orphanageId) !== String(orphanageId)) return res.status(403).json({ error: 'Not allowed for this orphanage' });

        appt.status = 'blocked';
        if (req.body.adminResponse) appt.adminResponse = req.body.adminResponse;
        await appt.save();

        // Get user and orphanage details for email notification
        const [requesterDetails, orphanageDetails] = await Promise.all([
            getUserDetails(appt.requesterId, req),
            getOrphanageDetails(appt.orphanageId, req)
        ]);

        // Send email notification to the requester
        if (requesterDetails?.email) {
            await publishToQueue('APPOINTMENT_NOTIFICATION.BLOCKED', {
                requesterEmail: requesterDetails.email,
                requesterName: `${requesterDetails.fullname?.firstname || ''} ${requesterDetails.fullname?.lastname || ''}`.trim(),
                orphanageName: orphanageDetails?.name || 'the orphanage',
                requestedAt: appt.requestedAt,
                purpose: appt.purpose,
                adminResponse: appt.adminResponse,
                appointmentId: appt._id.toString(),
                requesterId: appt.requesterId.toString(),
                requesterRole: requesterDetails.role || 'user',
            });
        }

        sendNotification({ to: `user:${appt.requesterId}`, subject: 'Appointment blocked', message: `Your appointment was blocked: ${appt.adminResponse || 'No reason provided'}` });

        res.json({ message: 'Appointment blocked', appointment: appt });
    } catch (err) {
        res.status(500).json({ error: 'Failed to block appointment' });
    }
};

const cancelAppointmentByAdmin = async (req, res) => {
    const { id } = req.params;
    try {
        const orphanageId = await resolveOrphanageId(req);
        if (!orphanageId) {
            return res.status(403).json({ error: 'Unable to resolve orphanage context.' });
        }

        const appt = await Appointment.findById(id);
        if (!appt) return res.status(404).json({ error: 'Appointment not found' });
        if (String(appt.orphanageId) !== String(orphanageId)) {
            return res.status(403).json({ error: 'Not allowed for this orphanage' });
        }

        const status = (appt.status || '').toLowerCase();
        if (status === 'cancelled') {
            return res.status(400).json({ error: 'Appointment is already cancelled.' });
        }
        if (status === 'blocked') {
            return res.status(400).json({ error: 'Blocked appointments cannot be cancelled.' });
        }

        appt.status = 'cancelled';
        appt.needsUserConfirmation = false;
        appt.userConfirmedAt = null;
        if (req.body?.adminResponse) {
            appt.adminResponse = req.body.adminResponse;
        }

        await appt.save();

        const [requesterDetails, orphanageDetails] = await Promise.all([
            getUserDetails(appt.requesterId, req),
            getOrphanageDetails(appt.orphanageId, req)
        ]);

        if (requesterDetails?.email) {
            await publishToQueue('APPOINTMENT_NOTIFICATION.CANCELLED_BY_ADMIN', {
                requesterEmail: requesterDetails.email,
                requesterName: `${requesterDetails.fullname?.firstname || ''} ${requesterDetails.fullname?.lastname || ''}`.trim(),
                orphanageName: orphanageDetails?.name || 'the orphanage',
                requestedAt: appt.requestedAt,
                purpose: appt.purpose,
                adminResponse: appt.adminResponse,
                appointmentId: appt._id.toString(),
                requesterId: appt.requesterId.toString(),
                requesterRole: requesterDetails.role || 'user',
            });
        }

        sendNotification({ to: `user:${appt.requesterId}`, subject: 'Appointment cancelled', message: 'The orphanage cancelled this appointment.' });

        return res.json({ message: 'Appointment cancelled for the requester', appointment: appt });
    } catch (err) {
        return res.status(500).json({ error: 'Failed to cancel appointment', details: err.message });
    }
}

const sendReminders = async (req, res) => {
    try {
        const orphanageId = await resolveOrphanageId(req);
        if (!orphanageId) return res.status(400).json({ error: 'Could not resolve orphanage' });

        // Find all approved appointments in the future (upcoming)
        const now = new Date();
        const upcomingApproved = await Appointment.find({
            orphanageId,
            status: 'approved',
            requestedAt: { $gte: now },
        });

        if (!upcomingApproved.length) {
            return res.json({ message: 'No upcoming approved appointments to remind.', sent: 0 });
        }

        const orphanageDetails = await getOrphanageDetails(orphanageId, req);
        let sentCount = 0;

        for (const appt of upcomingApproved) {
            const requesterDetails = await getUserDetails(appt.requesterId, req);
            if (requesterDetails?.email) {
                await publishToQueue('APPOINTMENT_NOTIFICATION.REMINDER', {
                    requesterEmail: requesterDetails.email,
                    requesterName: `${requesterDetails.fullname?.firstname || ''} ${requesterDetails.fullname?.lastname || ''}`.trim(),
                    orphanageName: orphanageDetails?.name || 'the orphanage',
                    requestedAt: appt.requestedAt,
                    purpose: appt.purpose,
                    appointmentId: appt._id.toString(),
                    requesterId: appt.requesterId.toString(),
                    requesterRole: requesterDetails.role || 'user',
                });
                sentCount++;
            }
        }

        res.json({ message: `Reminders sent for ${sentCount} upcoming appointment(s).`, sent: sentCount });
    } catch (err) {
        res.status(500).json({ error: 'Failed to send reminders' });
    }
};

const confirmAppointment = async (req, res) => {
    const { id } = req.params;
    const { action, note } = req.body || {};
    const userId = req.user?.id;

    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const appt = await Appointment.findById(id);
    if (!appt) return res.status(404).json({ error: 'Appointment not found' });
    if (String(appt.requesterId) !== String(userId)) return res.status(403).json({ error: 'Not your appointment' });
    if (appt.status !== 'needsConfirmation') {
        return res.status(400).json({ error: 'This appointment does not require confirmation' });
    }

    const normalizedAction = (action || '').toLowerCase();

    if (normalizedAction === 'accept') {
        appt.status = 'approved';
        appt.needsUserConfirmation = false;
        appt.userConfirmedAt = new Date();
        if (note) {
            appt.userConfirmationNote = note;
        }
        await appt.save();
        return res.json({ message: 'Appointment confirmed', appointment: appt });
    }

    if (normalizedAction === 'cancel' || normalizedAction === 'decline') {
        appt.status = 'cancelled';
        appt.needsUserConfirmation = false;
        appt.userConfirmedAt = null;
        if (note) {
            appt.userConfirmationNote = note;
        }
        await appt.save();
        return res.json({ message: 'Appointment cancelled', appointment: appt });
    }

    return res.status(400).json({ error: 'Invalid action. Use accept or cancel.' });
}

module.exports = {
    requestAppointment,
    getAllAppointments,
    getAppointmentsByOrphanage,
    approveAppointment,
    rejectAppointment,
    blockAppointment,
    sendReminders,
    cancelAppointment,
    cancelAppointmentByAdmin,
    confirmAppointment,
};
