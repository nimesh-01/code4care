const express = require('express')
const router = express.Router()
const upload = require('../middleware/uploadMiddleware')
const { authMiddleware, optionalAuthMiddleware, orphanAdminOnly } = require('../middleware/auth.middleware')
const {
  createPost,
  getOrphanagePosts,
  toggleLike,
  addComment,
  deletePost,
  editPost,
  generateAICaption,
  getPostEngagement
} = require('../controllers/postController')

// AI caption generation (orphanAdmin only)
router.post('/generate-caption', authMiddleware, orphanAdminOnly, generateAICaption)

// Create post (orphanAdmin only, with multiple media upload — max 10 files)
router.post('/create', authMiddleware, orphanAdminOnly, upload.array('media', 10), createPost)

// Get all posts for an orphanage (public — optional auth for like status)
router.get('/orphanage/:orphanageId', optionalAuthMiddleware, getOrphanagePosts)

// Like/unlike a post (authenticated users)
router.put('/:id/like', authMiddleware, toggleLike)

// Add comment (authenticated users)
router.post('/:id/comment', authMiddleware, addComment)

// Edit post caption (orphanAdmin only)
router.put('/:id/edit', authMiddleware, orphanAdminOnly, editPost)

// Delete post (orphanAdmin only)
router.delete('/:id/delete', authMiddleware, orphanAdminOnly, deletePost)

// Get post engagement details - who liked and commented (post admin only)
router.get('/:id/engagement', authMiddleware, orphanAdminOnly, getPostEngagement)

module.exports = router
