const express = require('express')
const validators = require('../middlewares/validator.middleware')
const authController = require('../controller/auth.controller')
const authMiddleware = require('../middlewares/auth.middleware')
const router = express.Router()
const multer = require('multer')
const upload = multer({ storage: multer.memoryStorage() })

// Middleware to parse FormData bracket notation (e.g., fullname[firstname] -> fullname.firstname)
const parseBracketNotation = (req, res, next) => {
    const parsed = {}
    for (const key of Object.keys(req.body)) {
        const match = key.match(/^(\w+)\[(\w+)\]$/)
        if (match) {
            const [, parent, child] = match
            if (!parsed[parent]) parsed[parent] = {}
            parsed[parent][child] = req.body[key]
        } else {
            parsed[key] = req.body[key]
        }
    }
    req.body = parsed
    next()
}

// Post /auth/register
router.post('/register', validators.registerUserValidations, authController.registerUser)

// Post /auth/registerorphan - register orphan admin + orphanage
router.post('/registerorphan', validators.registerUserValidations, validators.orphanageValidations, authController.registerOrphan)

// Post /auth/login
router.post('/login', validators.loginUserValidations, authController.loginUser)

// Post /auth/forgot-password
router.post('/forgot-password', validators.forgotPasswordValidations, authController.forgotPassword)

// Post /auth/reset-password
router.post('/reset-password', validators.resetPasswordValidations, authController.resetPassword)

// get /auth/me
router.get('/me', authMiddleware.authMiddleware, authController.getCurrentUser)

//get /auth/logout
router.get('/logout', authController.logoutUser)

// put /auth/users/me - update user details (profile upload allowed)
router.put('/users/me', authMiddleware.authMiddleware, upload.single('profile'), parseBracketNotation, validators.updateUserValidations, authController.updateUser)

// get /auth/orphanages - list orphanages (filters: state, city). Public browsing allowed
router.get('/orphanages', authMiddleware.optionalAuthMiddleware, validators.orphanageListValidations, authController.listOrphanages)

// put /auth/orphanage  - update orphanage details (only by orphanAdmin who owns it)
router.put('/orphanage', validators.orphanageUpdateValidations, authMiddleware.authMiddleware, authController.updateOrphanage)

// get /auth/orphanage - fetch orphanage details for logged-in orphanAdmin
router.get('/orphanage', authMiddleware.authMiddleware, authController.getOrphanage)

// upload document for orphanage (multipart/form-data) - field name 'document'
router.post('/orphanage/document', authMiddleware.authMiddleware, upload.single('document'), authController.uploadOrphanageDocument)
// Public document upload for pending orphanages during registration (no auth required)
router.post('/orphanage/:orphanageId/document', upload.single('document'), authController.uploadOrphanageDocumentPublic)
// delete document for orphanage - expects JSON body { field, fileId }
router.delete('/orphanage/document', authMiddleware.authMiddleware, authController.deleteOrphanageDocument)

// Inter-service routes (for microservice communication)
// Get user by ID
router.get('/user/:userId', authMiddleware.authMiddleware, authController.getUserById)
// Get orphanage by ID (requires login)
router.get('/orphanage/:orphanageId', authMiddleware.authMiddleware, authController.getOrphanageById)

module.exports = router

