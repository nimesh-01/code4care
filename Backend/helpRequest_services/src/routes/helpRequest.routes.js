const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { authMiddleware } = require('../middlewares/auth.middleware');
const { permit } = require('../middlewares/roles.middleware');
const controller = require('../controllers/helpRequest.controller');

/**
 * 1️⃣ Create Help Request
 * POST /help/add
 * Access: Orphanage Admin
 */
router.post('/add',
    authMiddleware,
    permit('orphanAdmin'),
    body('requestType')
        .isIn(['Teaching', 'Medical', 'Exam', 'Other'])
        .withMessage('Request type must be one of: Teaching, Medical, Exam, Other'),
    body('description')
        .isLength({ min: 10 })
        .withMessage('Description must be at least 10 characters'),
    body('requiredSkills')
        .optional()
        .isArray()
        .withMessage('Required skills must be an array'),
    body('childId')
        .optional()
        .isMongoId()
        .withMessage('Invalid child ID'),
    controller.createHelpRequest
);

/**
 * 2️⃣ Get All Help Requests
 * GET /help/all
 * Access: Volunteer (sees Pending), Orphanage Admin (sees own), Super Admin (sees all)
 */
router.get('/all',
    authMiddleware,
    permit('volunteer', 'orphanAdmin', 'superAdmin'),
    controller.getAllHelpRequests
);

/**
 * 3️⃣ Accept Help Request
 * PUT /help/:id/accept
 * Access: Volunteer
 */
router.put('/:id/accept',
    authMiddleware,
    permit('volunteer'),
    controller.acceptHelpRequest
);

/**
 * 4️⃣ Complete Help Request
 * PUT /help/:id/complete
 * Access: Volunteer (assigned volunteer only)
 */
router.put('/:id/complete',
    authMiddleware,
    permit('volunteer'),
    controller.completeHelpRequest
);
/**
 * 5️⃣ Get Volunteer-Specific Help Requests
 * GET /help/volunteer/:id
 * Access: Volunteer
 */
router.get('/volunteer',
    authMiddleware,
    permit('volunteer', 'superAdmin'),
    controller.getVolunteerHelpRequests
);

/**
 * Get single help request by ID
 * GET /help/:id
 * Access: Volunteer, Orphanage Admin, Super Admin
 */
router.get('/:id',
    authMiddleware,
    permit('volunteer', 'orphanAdmin', 'superAdmin'),
    controller.getHelpRequestById
);


module.exports = router;
