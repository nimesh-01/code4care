const express = require('express')
const validators = require('../middlewares/validator.middleware')
const authController = require('../controller/auth.controller')
const authMiddleware = require('../middlewares/auth.middleware')
const router = express.Router()
const multer = require('multer')
const upload = multer({ storage: multer.memoryStorage() })
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
router.put('/users/me', authMiddleware.authMiddleware, upload.single('profile'), validators.updateUserValidations, authController.updateUser)

// get /auth/orphanages - list orphanages (filters: state, city). orphanAdmin cannot use this route
router.get('/orphanages', authMiddleware.authMiddleware, validators.orphanageListValidations, authController.listOrphanages)

// put /auth/orphanage  - update orphanage details (only by orphanAdmin who owns it)
router.put('/orphanage', validators.orphanageUpdateValidations, authMiddleware.authMiddleware, authController.updateOrphanage)

// get /auth/orphanage - fetch orphanage details for logged-in orphanAdmin
router.get('/orphanage', authMiddleware.authMiddleware, authController.getOrphanage)

// upload document for orphanage (multipart/form-data) - field name 'document'
router.post('/orphanage/document', authMiddleware.authMiddleware, upload.single('document'), authController.uploadOrphanageDocument)
// delete document for orphanage - expects JSON body { field, fileId }
router.delete('/orphanage/document', authMiddleware.authMiddleware, authController.deleteOrphanageDocument)

// Inter-service routes (for microservice communication)
// Get user by ID
router.get('/user/:userId', authMiddleware.authMiddleware, authController.getUserById)
// Get orphanage by ID  
router.get('/orphanage/:orphanageId', authMiddleware.authMiddleware, authController.getOrphanageById)

module.exports = router

