const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { authMiddleware } = require('../middlewares/auth.middleware');
const { permit } = require('../middlewares/roles.middleware');
const controller = require('../controllers/appointment.controller');

//Post /apointment/request
router.post('/request',
    authMiddleware,
    permit('user', 'volunteer'),
    body('requestedAt').isISO8601().withMessage('Invalid date'),
    body('purpose').isLength({ min: 3 }).withMessage('Purpose is required'),
    body('orphanageId').notEmpty().withMessage('orphanageId is required'),
    controller.requestAppointment
);

//GET /appointment/all
router.get('/all', authMiddleware, permit('user', 'volunteer', 'orphanAdmin', 'superAdmin'), controller.getAllAppointments);

//GET /appointment/orphanage/:orphanageId
router.get('/orphanage/:orphanageId', authMiddleware, permit('orphanAdmin', 'superAdmin'), controller.getAppointmentsByOrphanage);

//PUT /appointment/:id/approve
router.put('/:id/approve', authMiddleware, permit('orphanAdmin'), controller.approveAppointment);

//PUT /appointment/:id/reject
router.put('/:id/reject', authMiddleware, permit('orphanAdmin'), controller.rejectAppointment);

//PUT /appointment/:id/block
router.put('/:id/block', authMiddleware, permit('orphanAdmin'), controller.blockAppointment);

//POST /appointment/send-reminders
router.post('/send-reminders', authMiddleware, permit('orphanAdmin'), controller.sendReminders);

//delete /appointment/:id/cancel
router.delete('/:id/cancel', authMiddleware, permit('user', 'volunteer'), controller.cancelAppointment);
    
module.exports = router;
