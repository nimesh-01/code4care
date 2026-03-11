const { validationResult } = require('express-validator');
const HelpRequest = require('../models/helpRequest.model');
const axios = require('axios');
const { publishToQueue } = require('../broker/broker');

const sanitizeMessageContent = (value) => {
    if (typeof value !== 'string') return '';
    return value.trim();
};

const appendMessage = (helpRequest, senderId, senderRole, content) => {
    if (!content) return;
    helpRequest.messages = helpRequest.messages || [];
    helpRequest.messages.push({
        senderId,
        senderRole,
        content,
        createdAt: new Date()
    });
};

// Resolve orphanage ID from auth service for orphanage admins
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

/**
 * 1️⃣ Create Help Request
 * POST /help/add
 * Access: Orphanage Admin
 */
const createHelpRequest = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { requestType, description, requiredSkills, childId } = req.body;
    const { id: userId } = req.user;

    try {
        const orphanageId = await resolveOrphanageId(req);
        if (!orphanageId) {
            return res.status(400).json({ error: 'Could not determine orphanage for this admin' });
        }

        const helpRequest = await HelpRequest.create({
            orphanageId,
            childId: childId || null,
            requestType,
            description,
            requiredSkills: requiredSkills || [],
            status: 'pending',
            createdBy: userId
        });

        // Notify orphanage admin via RabbitMQ
        publishToQueue('HELP_REQUEST_NOTIFICATION.CREATED', {
            orphanageAdminId: userId,
            title: requestType,
            helpRequestId: helpRequest._id.toString(),
        }).catch(err => console.error('Failed to publish help request created notification:', err.message));

        res.status(201).json({
            message: 'Help request created successfully',
            helpRequest
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create help request', details: err.message });
    }
};

/**
 * 2️⃣ Get All Help Requests
 * GET /help/all
 * Access: Volunteer (sees all Pending), Orphanage Admin (sees own orphanage's requests), Super Admin (sees all)
 */
const getAllHelpRequests = async (req, res) => {
    const { role } = req.user;
    const { status, requestType, sort = 'createdAt', order = 'desc' } = req.query;

    const filter = {};

    // Apply status filter if provided
    if (status) filter.status = status;

    // Apply request type filter if provided
    if (requestType) filter.requestType = requestType;

    try {
        if (role === 'volunteer') {
            // Volunteer sees all Pending help requests
            filter.status = status || 'pending';
        } else if (role === 'orphanAdmin') {
            // Orphanage Admin sees only their orphanage's requests
            const orphanageId = await resolveOrphanageId(req);
            if (!orphanageId) {
                return res.status(400).json({ error: 'Could not determine orphanage for this admin' });
            }
            filter.orphanageId = orphanageId;
        } else if (role === 'superAdmin') {
            // Super Admin sees all requests (no additional filter)
        } else {
            return res.status(403).json({ error: 'Access denied' });
        }

        const helpRequests = await HelpRequest.find(filter)
            .sort({ [sort]: order === 'asc' ? 1 : -1 });

        res.json({ helpRequests });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch help requests' });
    }
};

/**
 * 3️⃣ Accept Help Request
 * PUT /help/:id/accept
 * Access: Volunteer
 * Condition: Request status must be Pending
 */
const acceptHelpRequest = async (req, res) => {
    const { id } = req.params;
    const { id: volunteerId, role } = req.user;
    const rawMessage = req.body?.message;
    const note = sanitizeMessageContent(rawMessage);

    if (rawMessage && note.length < 3) {
        return res.status(400).json({ error: 'Message must be at least 3 characters' });
    }
    if (note.length > 1000) {
        return res.status(400).json({ error: 'Message must be under 1000 characters' });
    }

    try {
        const helpRequest = await HelpRequest.findById(id);

        if (!helpRequest) {
            return res.status(404).json({ error: 'Help request not found' });
        }
        if (helpRequest.status !== 'pending') {
            return res.status(400).json({ error: 'Help request is not available for acceptance' });
        }

        helpRequest.status = 'accepted';
        helpRequest.assignedVolunteerId = volunteerId;
        if (note) {
            appendMessage(helpRequest, volunteerId, role, note);
        }
        await helpRequest.save();

        // Notify orphanage admin and volunteer via RabbitMQ
        publishToQueue('HELP_REQUEST_NOTIFICATION.ACCEPTED', {
            orphanageAdminId: helpRequest.createdBy ? helpRequest.createdBy.toString() : null,
            volunteerId: volunteerId,
            volunteerName: req.user.username || 'A volunteer',
            title: helpRequest.requestType,
            helpRequestId: helpRequest._id.toString(),
            orphanageName: helpRequest.orphanageId ? helpRequest.orphanageId.toString() : '',
        }).catch(err => console.error('Failed to publish help request accepted notification:', err.message));

        res.json({
            message: 'Help request accepted successfully',
            helpRequest
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to accept help request' });
    }
};

/**
 * 4️⃣ Complete Help Request
 * PUT /help/:id/complete
 * Access: Volunteer (assigned volunteer only)
 */
const completeHelpRequest = async (req, res) => {
    const { id } = req.params;
    const { id: volunteerId } = req.user;

    try {
        const helpRequest = await HelpRequest.findById(id);
        if (!helpRequest) {
            return res.status(404).json({ error: 'Help request not found' });
        }

        if (helpRequest.status !== 'accepted') {
            return res.status(400).json({ error: 'Help request must be in Accepted status to complete' });
        }

        // Verify that the volunteer is the assigned volunteer
        if (String(helpRequest.assignedVolunteerId) !== String(volunteerId)) {
            return res.status(403).json({ error: 'Only the assigned volunteer can complete this request' });
        }

        helpRequest.status = 'completed';
        helpRequest.completedAt = new Date();
        await helpRequest.save();

        // Notify orphanage admin and volunteer via RabbitMQ
        publishToQueue('HELP_REQUEST_NOTIFICATION.COMPLETED', {
            orphanageAdminId: helpRequest.createdBy ? helpRequest.createdBy.toString() : null,
            volunteerId: volunteerId,
            title: helpRequest.requestType,
            helpRequestId: helpRequest._id.toString(),
        }).catch(err => console.error('Failed to publish help request completed notification:', err.message));

        res.json({
            message: 'Help request completed successfully',
            helpRequest
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to complete help request' });
    }
};

/**
 * 5️⃣ Get Volunteer-Specific Help Requests
 * GET /help/volunteer/:id
 * Access: Volunteer
 * Returns: Accepted and Completed requests for the volunteer
 */
const getVolunteerHelpRequests = async (req, res) => {
    const { id: userId, role } = req.user;

    const { status, sort = 'createdAt', order = 'desc' } = req.query;

    try {
        const filter = {
            assignedVolunteerId: userId,
            status: { $in: ['accepted', 'completed'] }
        };

        // Apply status filter if provided
        if (status && ['accepted', 'completed'].includes(status)) {
            filter.status = status;
        }

        const helpRequests = await HelpRequest.find(filter)
            .sort({ [sort]: order === 'asc' ? 1 : -1 });

        res.json({ helpRequests });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch volunteer help requests' });
    }
};

/**
 * Get single help request by ID
 * GET /help/:id
 * Access: Volunteer, Orphanage Admin, Super Admin
 */
const getHelpRequestById = async (req, res) => {
    const { id } = req.params;
    const { role } = req.user;

    try {
        const helpRequest = await HelpRequest.findById(id);

        if (!helpRequest) {
            return res.status(404).json({ error: 'Help request not found' });
        }

        // Orphanage admin can only view their own orphanage's requests
        if (role === 'orphanAdmin') {
            const orphanageId = await resolveOrphanageId(req);
            if (String(helpRequest.orphanageId._id || helpRequest.orphanageId) !== String(orphanageId)) {
                return res.status(403).json({ error: 'Access denied' });
            }
        }

        res.json({ helpRequest });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch help request' });
    }
};

const addMessage = async (req, res) => {
    const { id } = req.params;
    const { id: userId, role } = req.user;
    const rawMessage = req.body?.content || req.body?.message;
    const note = sanitizeMessageContent(rawMessage);

    if (!note) {
        return res.status(400).json({ error: 'Message content is required' });
    }
    if (note.length < 3) {
        return res.status(400).json({ error: 'Message must be at least 3 characters' });
    }
    if (note.length > 1000) {
        return res.status(400).json({ error: 'Message must be under 1000 characters' });
    }

    try {
        const helpRequest = await HelpRequest.findById(id);
        if (!helpRequest) {
            return res.status(404).json({ error: 'Help request not found' });
        }

        let allowed = false;

        if (role === 'superAdmin') {
            allowed = true;
        } else if (role === 'volunteer') {
            if (helpRequest.assignedVolunteerId && String(helpRequest.assignedVolunteerId) === String(userId)) {
                allowed = true;
            }
        } else if (role === 'orphanAdmin') {
            const orphanageId = await resolveOrphanageId(req);
            if (orphanageId && String(orphanageId) === String(helpRequest.orphanageId)) {
                allowed = true;
            }
        }

        if (!allowed) {
            return res.status(403).json({ error: 'Access denied' });
        }

        appendMessage(helpRequest, userId, role, note);
        await helpRequest.save();

        res.json({
            message: 'Message added successfully',
            helpRequest
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to add message' });
    }
};

module.exports = {
    createHelpRequest,
    getAllHelpRequests,
    acceptHelpRequest,
    completeHelpRequest,
    getVolunteerHelpRequests,
    getHelpRequestById,
    addMessage
};
