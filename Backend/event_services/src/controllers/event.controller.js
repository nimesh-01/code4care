const { validationResult } = require('express-validator');
const Event = require('../models/event.model');
const axios = require('axios');
const { uploadBuffer, deleteFile } = require('../services/imagekit.service');
const { publishToQueue } = require('../broker/broker');

// Resolve orphanage ID from auth service
const resolveOrphanageId = async (req) => {
    try {
        const authUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:3000/auth/orphanage';
        const headers = {};
        if (req.headers && req.headers.cookie) headers['Cookie'] = req.headers.cookie;
        if (req.headers && req.headers.authorization) headers['Authorization'] = req.headers.authorization;
        const resp = await axios.get(authUrl, { headers, withCredentials: true });
        if (resp?.data?.orphanage?._id) return resp.data.orphanage._id;
    } catch (e) {
        console.warn('Could not fetch orphanage from auth service:', e.message);
    }
    return null;
};

/**
 * Create Event
 * POST /event/create
 * Access: Orphanage Admin
 */
const createEvent = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
        const orphanageId = await resolveOrphanageId(req);
        if (!orphanageId) {
            return res.status(400).json({ error: 'Could not determine orphanage for this admin' });
        }

        const {
            title, description, category, eventDate, eventTime,
            eventLocation, requiredVolunteers, maxParticipants
        } = req.body;

        const eventData = {
            orphanageId,
            createdBy: req.user.id || req.user._id,
            title,
            description,
            category,
            eventDate,
            eventTime: eventTime || '',
            eventLocation,
            requiredVolunteers: parseInt(requiredVolunteers, 10) || 0,
            maxParticipants: parseInt(maxParticipants, 10) || 0,
        };

        const event = await Event.create(eventData);

        // Upload image if provided
        if (req.file) {
            const folder = `events/${event._id}`;
            const result = await uploadBuffer(req.file.buffer, req.file.originalname, folder, req.file.mimetype);
            event.imageUrl = result.url;
            event.imageFileId = result.fileId || result.file_id;
            await event.save();
        }

        // Notify: event created
        publishToQueue('EVENT_NOTIFICATION.CREATED', {
            organizerId: req.user.id || req.user._id,
            organizerRole: req.user.role || 'orphanAdmin',
            title: event.title,
            eventId: event._id.toString(),
        }).catch(err => console.error('Failed to publish event created notification:', err.message));

        res.status(201).json({ message: 'Event created successfully', event });
    } catch (err) {
        console.error('createEvent error:', err);
        res.status(500).json({ error: 'Failed to create event', details: err.message });
    }
};

/**
 * Get All Events
 * GET /event/all
 * Access: Public (with optional auth for role-based filtering)
 */
const getAllEvents = async (req, res) => {
    try {
        const { status, category, orphanageId, sort = 'eventDate', order = 'asc' } = req.query;
        const filter = {};

        if (status) filter.status = status;
        if (category) filter.category = category;
        if (orphanageId) filter.orphanageId = orphanageId;

        // If orphanAdmin, show only their events
        if (req.user?.role === 'orphanAdmin') {
            const resolvedId = await resolveOrphanageId(req);
            if (resolvedId) filter.orphanageId = resolvedId;
        }

        const perPage = Math.min(parseInt(req.query.limit, 10) || 6, 500);
        const currentPage = Math.max(parseInt(req.query.page, 10) || 1, 1);
        const skip = (currentPage - 1) * perPage;

        const [events, totalCount] = await Promise.all([
            Event.find(filter)
                .sort({ [sort]: order === 'asc' ? 1 : -1 })
                .skip(skip)
                .limit(perPage),
            Event.countDocuments(filter)
        ]);
        const totalPages = Math.ceil(totalCount / perPage);

        res.json({
            events,
            pagination: { currentPage, totalPages, totalCount, hasMore: currentPage < totalPages }
        });
    } catch (err) {
        console.error('getAllEvents error:', err);
        res.status(500).json({ error: 'Failed to fetch events' });
    }
};

/**
 * Get Event by ID
 * GET /event/:id
 * Access: Public
 */
const getEventById = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ error: 'Event not found' });
        res.json({ event });
    } catch (err) {
        console.error('getEventById error:', err);
        res.status(500).json({ error: 'Failed to fetch event' });
    }
};

/**
 * Join Event
 * POST /event/:id/join
 * Access: User, Volunteer
 */
const joinEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ error: 'Event not found' });

        if (event.status === 'cancelled') {
            return res.status(400).json({ error: 'Cannot join a cancelled event' });
        }
        if (event.status === 'completed') {
            return res.status(400).json({ error: 'Cannot join a completed event' });
        }

        const userId = (req.user.id || req.user._id).toString();
        const alreadyJoined = event.participants.some(
            p => p.participantId.toString() === userId
        );
        if (alreadyJoined) {
            return res.status(400).json({ error: 'You have already joined this event' });
        }

        if (event.maxParticipants > 0 && event.participants.length >= event.maxParticipants) {
            return res.status(400).json({ error: 'Event has reached maximum participants' });
        }

        event.participants.push({
            participantId: userId,
            role: req.user.role === 'volunteer' ? 'volunteer' : 'user',
        });

        await event.save();

        // Notify: volunteer/user joined event
        publishToQueue('EVENT_NOTIFICATION.VOLUNTEER_JOINED', {
            organizerId: event.createdBy ? event.createdBy.toString() : null,
            volunteerId: userId,
            volunteerName: req.user.username || 'A participant',
            volunteerRole: req.user.role || 'user',
            eventTitle: event.title,
            eventId: event._id.toString(),
        }).catch(err => console.error('Failed to publish event joined notification:', err.message));

        res.json({ message: 'Successfully joined the event', event });
    } catch (err) {
        console.error('joinEvent error:', err);
        res.status(500).json({ error: 'Failed to join event' });
    }
};

/**
 * Leave Event
 * DELETE /event/:id/leave
 * Access: User, Volunteer
 */
const leaveEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ error: 'Event not found' });

        const userId = (req.user.id || req.user._id).toString();
        const index = event.participants.findIndex(
            p => p.participantId.toString() === userId
        );

        if (index === -1) {
            return res.status(400).json({ error: 'You are not a participant of this event' });
        }

        event.participants.splice(index, 1);
        await event.save();

        res.json({ message: 'Successfully left the event', event });
    } catch (err) {
        console.error('leaveEvent error:', err);
        res.status(500).json({ error: 'Failed to leave event' });
    }
};

/**
 * Update Event
 * PUT /event/:id/update
 * Access: Orphanage Admin (owner only)
 */
const updateEvent = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ error: 'Event not found' });

        const orphanageId = await resolveOrphanageId(req);
        if (!orphanageId || String(event.orphanageId) !== String(orphanageId)) {
            return res.status(403).json({ error: 'Forbidden - orphanage mismatch' });
        }

        const allowedFields = [
            'title', 'description', 'category', 'eventDate', 'eventTime',
            'eventLocation', 'requiredVolunteers', 'maxParticipants', 'status'
        ];

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                if (field === 'requiredVolunteers' || field === 'maxParticipants') {
                    event[field] = parseInt(req.body[field], 10) || 0;
                } else {
                    event[field] = req.body[field];
                }
            }
        }

        // Handle image update
        if (req.file) {
            const oldImageFileId = event.imageFileId;
            const folder = `events/${event._id}`;
            const result = await uploadBuffer(req.file.buffer, req.file.originalname, folder, req.file.mimetype);
            event.imageUrl = result.url;
            event.imageFileId = result.fileId || result.file_id;

            if (oldImageFileId) {
                try { await deleteFile(oldImageFileId); } catch (e) {
                    console.warn('Failed to delete old event image:', e.message);
                }
            }
        }

        await event.save();

        // Notify participants about event update
        if (event.participants?.length > 0) {
            for (const p of event.participants) {
                publishToQueue('EVENT_NOTIFICATION.REMINDER', {
                    participantId: p.participantId.toString(),
                    participantRole: p.role || 'user',
                    eventTitle: event.title,
                    eventDate: event.eventDate ? new Date(event.eventDate).toLocaleDateString() : '',
                    eventId: event._id.toString(),
                }).catch(err => console.error('Failed to publish event update notification:', err.message));
            }
        }

        res.json({ message: 'Event updated successfully', event });
    } catch (err) {
        console.error('updateEvent error:', err);
        res.status(500).json({ error: 'Failed to update event' });
    }
};

/**
 * Delete Event
 * DELETE /event/:id/delete
 * Access: Orphanage Admin (owner only)
 */
const deleteEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ error: 'Event not found' });

        const orphanageId = await resolveOrphanageId(req);
        if (!orphanageId || String(event.orphanageId) !== String(orphanageId)) {
            return res.status(403).json({ error: 'Forbidden - orphanage mismatch' });
        }

        // Clean up image
        if (event.imageFileId) {
            try { await deleteFile(event.imageFileId); } catch (e) {
                console.warn('Failed to delete event image:', e.message);
            }
        }

        // Notify participants about event cancellation
        if (event.participants?.length > 0) {
            for (const p of event.participants) {
                publishToQueue('EVENT_NOTIFICATION.REMINDER', {
                    participantId: p.participantId.toString(),
                    participantRole: p.role || 'user',
                    eventTitle: event.title,
                    eventDate: event.eventDate ? new Date(event.eventDate).toLocaleDateString() : '',
                    eventId: event._id.toString(),
                }).catch(err => console.error('Failed to publish event cancellation notification:', err.message));
            }
        }

        await Event.findByIdAndDelete(req.params.id);
        res.json({ message: 'Event deleted successfully' });
    } catch (err) {
        console.error('deleteEvent error:', err);
        res.status(500).json({ error: 'Failed to delete event' });
    }
};

/**
 * Get participants for an event
 * GET /event/:id/participants
 * Access: Orphanage Admin (owner only)
 */
const getEventParticipants = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ error: 'Event not found' });

        const orphanageId = await resolveOrphanageId(req);
        if (!orphanageId || String(event.orphanageId) !== String(orphanageId)) {
            return res.status(403).json({ error: 'Forbidden - orphanage mismatch' });
        }

        res.json({ participants: event.participants, total: event.participants.length });
    } catch (err) {
        console.error('getEventParticipants error:', err);
        res.status(500).json({ error: 'Failed to fetch participants' });
    }
};

module.exports = {
    createEvent,
    getAllEvents,
    getEventById,
    joinEvent,
    leaveEvent,
    updateEvent,
    deleteEvent,
    getEventParticipants,
    sendEventReminder,
};

/**
 * Send Reminder to Event Participants
 * POST /event/:id/send-reminder
 * Access: Orphanage Admin (owner only)
 */
async function sendEventReminder(req, res) {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ error: 'Event not found' });

        const orphanageId = await resolveOrphanageId(req);
        if (!orphanageId || String(event.orphanageId) !== String(orphanageId)) {
            return res.status(403).json({ error: 'Forbidden - orphanage mismatch' });
        }

        if (!event.participants || event.participants.length === 0) {
            return res.status(400).json({ error: 'No participants to notify' });
        }

        const { message } = req.body;
        const eventDate = event.eventDate ? new Date(event.eventDate).toLocaleDateString() : '';

        for (const p of event.participants) {
            publishToQueue('EVENT_NOTIFICATION.REMINDER', {
                participantId: p.participantId.toString(),
                participantRole: p.role || 'user',
                eventTitle: event.title,
                eventDate,
                eventId: event._id.toString(),
                customMessage: message || '',
            }).catch(err => console.error('Failed to publish event reminder:', err.message));
        }

        res.json({ message: `Reminder sent to ${event.participants.length} participants` });
    } catch (err) {
        console.error('sendEventReminder error:', err);
        res.status(500).json({ error: 'Failed to send reminders' });
    }
}
