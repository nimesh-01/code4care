const express = require('express');
const router = express.Router();
const controller = require('../controllers/children.controller');
const multer = require('multer');
const { authMiddleware, optionalAuthMiddleware } = require('../middlewares/auth.middleware');
const { childCreateValidations } = require('../middlewares/validator.middleware')
// auth middleware from main auth package

const upload = multer({ storage: multer.memoryStorage() });

// POST /api/children
router.post('/children', authMiddleware, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'documents', maxCount: 10 }]), childCreateValidations, controller.createChild);

//  GET /api/children
router.get('/children', optionalAuthMiddleware, controller.getChildren);

//GET /api/children/:id (requires login)
router.get('/children/:id', authMiddleware, controller.getChildById);

//DELETE /api/children/:id
router.delete('/children/:id', authMiddleware, controller.deleteChild);

// DELETE a specific uploaded file (profile image or document) by fileId
router.delete('/children/:id/files/:fileId', authMiddleware, controller.deleteChildFile);

//PUT /api/children/:id
router.put('/children/:id', authMiddleware, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'documents', maxCount: 10 }]), controller.updateChild);

// GET /api/orphanage/:orphanageId list children by orphanage (requires login)
router.get('/orphanage/:orphanageId', authMiddleware, controller.getChildrenByOrphanage);

module.exports = router;
