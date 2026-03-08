const Post = require('../models/postModel')
const { uploadBuffer, deleteFile } = require('../services/imagekit.service')
const { generateCaption } = require('../services/geminiCaptionService')

// Helper: extract user ID from JWT (token stores 'id', not '_id')
const getUserId = (user) => user._id || user.id

// POST /post/create — orphanAdmin creates a post with multiple media
const createPost = async (req, res) => {
  try {
    const { caption } = req.body
    const files = req.files

    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one image or video is required' })
    }

    if (files.length > 10) {
      return res.status(400).json({ success: false, message: 'Maximum 10 files per post' })
    }

    // Upload all files to ImageKit in parallel
    const uploadPromises = files.map(file =>
      uploadBuffer(
        file.buffer,
        file.originalname,
        `posts/${req.user.orphanageId}`,
        file.mimetype
      ).then(result => ({
        url: result.url,
        fileId: result.fileId,
        type: file.mimetype.startsWith('video/') ? 'video' : 'image'
      }))
    )

    const media = await Promise.all(uploadPromises)

    const post = await Post.create({
      orphanageId: req.user.orphanageId,
      adminId: getUserId(req.user),
      imageUrl: media[0].url,
      imageFileId: media[0].fileId,
      media,
      caption: caption || '',
      likes: [],
      comments: []
    })

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      post
    })
  } catch (err) {
    console.error('Create post error:', err)
    res.status(500).json({ success: false, message: 'Failed to create post' })
  }
}

// GET /post/orphanage/:orphanageId — fetch all posts of an orphanage
const getOrphanagePosts = async (req, res) => {
  try {
    const { orphanageId } = req.params
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit

    const [posts, total] = await Promise.all([
      Post.find({ orphanageId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Post.countDocuments({ orphanageId })
    ])

    res.status(200).json({
      success: true,
      posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (err) {
    console.error('Get orphanage posts error:', err)
    res.status(500).json({ success: false, message: 'Failed to fetch posts' })
  }
}

// PUT /post/:id/like — toggle like on a post
const toggleLike = async (req, res) => {
  try {
    const { id } = req.params
    const userId = getUserId(req.user)

    const post = await Post.findById(id)
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' })
    }

    const likeIndex = post.likes.indexOf(userId)
    if (likeIndex === -1) {
      post.likes.push(userId)
    } else {
      post.likes.splice(likeIndex, 1)
    }

    await post.save()

    res.status(200).json({
      success: true,
      message: likeIndex === -1 ? 'Post liked' : 'Post unliked',
      likesCount: post.likes.length,
      liked: likeIndex === -1
    })
  } catch (err) {
    console.error('Toggle like error:', err)
    res.status(500).json({ success: false, message: 'Failed to toggle like' })
  }
}

// POST /post/:id/comment — add a comment to a post
const addComment = async (req, res) => {
  try {
    const { id } = req.params
    const { commentText } = req.body

    if (!commentText || !commentText.trim()) {
      return res.status(400).json({ success: false, message: 'Comment text is required' })
    }

    const post = await Post.findById(id)
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' })
    }

    const comment = {
      userId: getUserId(req.user),
      commentText: commentText.trim(),
      createdAt: new Date()
    }

    post.comments.push(comment)
    await post.save()

    // Return the newly added comment (last one in array)
    const newComment = post.comments[post.comments.length - 1]

    res.status(201).json({
      success: true,
      message: 'Comment added',
      comment: newComment
    })
  } catch (err) {
    console.error('Add comment error:', err)
    res.status(500).json({ success: false, message: 'Failed to add comment' })
  }
}

// DELETE /post/:id/delete — orphanAdmin deletes own post
const deletePost = async (req, res) => {
  try {
    const { id } = req.params

    const post = await Post.findById(id)
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' })
    }

    // Only the admin who created the post can delete it
    if (post.adminId.toString() !== getUserId(req.user).toString()) {
      return res.status(403).json({ success: false, message: 'You can only delete your own posts' })
    }

    // Delete all media files from ImageKit
    const fileIds = post.media && post.media.length > 0
      ? post.media.filter(m => m.fileId).map(m => m.fileId)
      : (post.imageFileId ? [post.imageFileId] : [])

    for (const fileId of fileIds) {
      try {
        await deleteFile(fileId)
      } catch (imgErr) {
        console.warn('Failed to delete file from storage:', imgErr.message)
      }
    }

    await Post.findByIdAndDelete(id)

    res.status(200).json({ success: true, message: 'Post deleted successfully' })
  } catch (err) {
    console.error('Delete post error:', err)
    res.status(500).json({ success: false, message: 'Failed to delete post' })
  }
}

// PUT /post/:id/edit — orphanAdmin edits caption
const editPost = async (req, res) => {
  try {
    const { id } = req.params
    const { caption } = req.body

    const post = await Post.findById(id)
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' })
    }

    // Only the admin who created the post can edit it
    if (post.adminId.toString() !== getUserId(req.user).toString()) {
      return res.status(403).json({ success: false, message: 'You can only edit your own posts' })
    }

    post.caption = caption !== undefined ? caption : post.caption
    await post.save()

    res.status(200).json({
      success: true,
      message: 'Post updated successfully',
      post
    })
  } catch (err) {
    console.error('Edit post error:', err)
    res.status(500).json({ success: false, message: 'Failed to update post' })
  }
}

// POST /post/generate-caption — AI caption generation via Gemini
const generateAICaption = async (req, res) => {
  try {
    const { imageDescription } = req.body

    if (!imageDescription || !imageDescription.trim()) {
      return res.status(400).json({ success: false, message: 'imageDescription is required' })
    }

    const caption = await generateCaption(imageDescription.trim())

    res.status(200).json({
      success: true,
      caption
    })
  } catch (err) {
    console.error('Generate caption error:', err)
    const message = err.message?.includes('quota') || err.message?.includes('429')
      ? 'AI quota exceeded — please try again later or write your caption manually.'
      : 'Failed to generate caption'
    res.status(err.message?.includes('quota') ? 429 : 500).json({ success: false, message })
  }
}

// GET /post/:id/engagement — admin sees who liked and commented
const getPostEngagement = async (req, res) => {
  try {
    const { id } = req.params
    const userId = getUserId(req.user)

    const post = await Post.findById(id).lean()
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' })
    }

    // Only the admin who created the post can view engagement
    if (post.adminId.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'Only the post creator can view engagement details' })
    }

    res.status(200).json({
      success: true,
      likes: post.likes,
      comments: post.comments
    })
  } catch (err) {
    console.error('Get post engagement error:', err)
    res.status(500).json({ success: false, message: 'Failed to fetch engagement details' })
  }
}

module.exports = {
  createPost,
  getOrphanagePosts,
  toggleLike,
  addComment,
  deletePost,
  editPost,
  generateAICaption,
  getPostEngagement
}
