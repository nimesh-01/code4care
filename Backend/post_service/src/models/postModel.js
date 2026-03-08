const mongoose = require('mongoose')

const commentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  commentText: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

const mediaSchema = new mongoose.Schema({
  url: { type: String, required: true },
  fileId: { type: String, default: null },
  type: { type: String, enum: ['image', 'video'], required: true }
}, { _id: false })

const postSchema = new mongoose.Schema({
  orphanageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Orphanage',
    required: true
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Legacy single-image fields (kept for backward compatibility)
  imageUrl: {
    type: String,
    default: null
  },
  imageFileId: {
    type: String,
    default: null
  },
  // New multi-media array
  media: {
    type: [mediaSchema],
    default: []
  },
  caption: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [commentSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
})

// Index for efficient orphanage feed queries
postSchema.index({ orphanageId: 1, createdAt: -1 })

const Post = mongoose.model('Post', postSchema)
module.exports = Post
