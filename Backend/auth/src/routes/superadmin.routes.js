const express = require('express')
const router = express.Router()
const authMiddleware = require('../middlewares/auth.middleware')
const superadminController = require('../controller/superadmin.controller')

// All routes require authentication + superAdmin role
router.use(authMiddleware.authMiddleware, superadminController.requireSuperAdmin)

// Dashboard statistics
router.get('/dashboard-stats', superadminController.getDashboardStats)

// Orphanage management
router.get('/orphanages', superadminController.listAllOrphanages)
router.get('/orphanages/:id', superadminController.getOrphanageDetails)
router.put('/orphanages/:id/verify', superadminController.verifyOrphanage)
router.delete('/orphanages/:id', superadminController.deleteOrphanage)

// User management
router.get('/users', superadminController.listUsers)
router.put('/users/:id/status', superadminController.updateUserStatus)

module.exports = router
