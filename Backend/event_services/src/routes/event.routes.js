const express = require('express');
const { body } = require('express-validator');
const multer = require('multer');
const router = express.Router();
const { authMiddleware, optionalAuthMiddleware } = require('../middlewares/auth.middleware');
const { permit } = require('../middlewares/roles.middleware');
const controller = require('../controllers/event.controller');

const upload = multer({ storage: multer.memoryStorage() });

/**
 * Create Event
 * POST /event/create
 * Access: Orphanage Admin
 */
router.post('/create',
    authMiddleware,
    permit('orphanAdmin'),
    upload.single('image'),
    body('title').isLength({ min: 3 }).withMessage('Title must be at least 3 characters'),
    body('description').isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
    body('category').isIn(['Education', 'Health', 'Fundraising', 'Cultural', 'Other']).withMessage('Invalid category'),
    body('eventDate').isISO8601().withMessage('Valid event date is required'),
    body('eventLocation').isLength({ min: 3 }).withMessage('Location must be at least 3 characters'),
    controller.createEvent
);

/**
 * Get All Events
 * GET /event/all
 * Access: Public (optional auth for admin filtering)
 */
router.get('/all', optionalAuthMiddleware, controller.getAllEvents);

/**
 * Get Event by ID
 * GET /event/:id
 * Access: Public
 */
router.get('/:id', optionalAuthMiddleware, controller.getEventById);

/**
 * Join Event
 * POST /event/:id/join
 * Access: User, Volunteer
 */
router.post('/:id/join',
    authMiddleware,
    permit('user', 'volunteer'),
    controller.joinEvent
);

/**
 * Leave Event
 * DELETE /event/:id/leave
 * Access: User, Volunteer
 */
router.delete('/:id/leave',
    authMiddleware,
    permit('user', 'volunteer'),
    controller.leaveEvent
);

/**
 * Update Event
 * PUT /event/:id/update
 * Access: Orphanage Admin
 */
router.put('/:id/update',
    authMiddleware,
    permit('orphanAdmin'),
    upload.single('image'),
    body('title').optional().isLength({ min: 3 }).withMessage('Title must be at least 3 characters'),
    body('description').optional().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
    body('category').optional().isIn(['Education', 'Health', 'Fundraising', 'Cultural', 'Other']).withMessage('Invalid category'),
    body('eventDate').optional().isISO8601().withMessage('Valid event date is required'),
    body('eventLocation').optional().isLength({ min: 3 }).withMessage('Location must be at least 3 characters'),
    controller.updateEvent
);

/**
 * Delete Event
 * DELETE /event/:id/delete
 * Access: Orphanage Admin
 */
router.delete('/:id/delete',
    authMiddleware,
    permit('orphanAdmin'),
    controller.deleteEvent
);

/**
 * Get Event Participants
 * GET /event/:id/participants
 * Access: Orphanage Admin
 */
router.get('/:id/participants',
    authMiddleware,
    permit('orphanAdmin'),
    controller.getEventParticipants
);

/**
 * Send Reminder to Event Participants
 * POST /event/:id/send-reminder
 * Access: Orphanage Admin
 */
router.post('/:id/send-reminder',
    authMiddleware,
    permit('orphanAdmin'),
    controller.sendEventReminder
);

module.exports = router;
