import { useState } from 'react'
import { FaHeart, FaRegHeart, FaComment, FaClock, FaTrash, FaEdit, FaCheck, FaTimes, FaChartBar } from 'react-icons/fa'
import { toast } from 'react-toastify'
import { useAuth } from '../../context/AuthContext'
import { postAPI } from '../../services/api'
import CommentSection from './CommentSection'
import EngagementModal from './EngagementModal'
import MediaCarousel from './MediaCarousel'

const PostCard = ({ post, onUpdate, onDelete }) => {
  const { user } = useAuth()
  const [liked, setLiked] = useState(user ? post.likes?.includes(user.id) : false)
  const [likesCount, setLikesCount] = useState(post.likes?.length || 0)
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState(post.comments || [])
  const [editing, setEditing] = useState(false)
  const [editCaption, setEditCaption] = useState(post.caption || '')
  const [likeLoading, setLikeLoading] = useState(false)
  const [showEngagement, setShowEngagement] = useState(false)

  const isAdmin = user && user.id === post.adminId

  const handleLike = async () => {
    if (!user) {
      toast.info('Please login to like posts')
      return
    }
    if (likeLoading) return
    try {
      setLikeLoading(true)
      const res = await postAPI.like(post._id)
      setLiked(res.data.liked)
      setLikesCount(res.data.likesCount)
    } catch (err) {
      toast.error('Failed to like post')
    } finally {
      setLikeLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) return
    try {
      await postAPI.delete(post._id)
      toast.success('Post deleted')
      onDelete?.(post._id)
    } catch (err) {
      toast.error('Failed to delete post')
    }
  }

  const handleEdit = async () => {
    try {
      const res = await postAPI.edit(post._id, { caption: editCaption })
      setEditing(false)
      onUpdate?.(res.data.post)
      toast.success('Post updated')
    } catch (err) {
      toast.error('Failed to update post')
    }
  }

  const handleCommentAdded = (newComment) => {
    setComments(prev => [...prev, newComment])
  }

  const formatDate = (date) => {
    const d = new Date(date)
    const now = new Date()
    const diffMs = now - d
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays < 7) return `${diffDays}d ago`
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-md overflow-hidden transition-colors duration-300">
      {/* Post Media Carousel */}
      <MediaCarousel media={post.media} imageUrl={post.imageUrl} />

      {/* Post Content */}
      <div className="p-5 space-y-3">
        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleLike}
              disabled={likeLoading}
              className="flex items-center gap-1 text-lg hover:scale-110 transition-transform"
            >
              {liked ? (
                <FaHeart className="text-red-500" />
              ) : (
                <FaRegHeart className="text-teal-600 dark:text-cream-300" />
              )}
              <span className="text-sm font-medium text-teal-700 dark:text-cream-200">{likesCount}</span>
            </button>

            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center gap-1 text-lg hover:scale-110 transition-transform"
            >
              <FaComment className="text-teal-600 dark:text-cream-300" />
              <span className="text-sm font-medium text-teal-700 dark:text-cream-200">{comments.length}</span>
            </button>
          </div>

          {/* Admin actions */}
          {isAdmin && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowEngagement(true)}
                className="p-2 text-teal-600 dark:text-cream-300 hover:bg-cream-100 dark:hover:bg-dark-700 rounded-lg transition"
                title="View engagement"
              >
                <FaChartBar />
              </button>
              <button
                onClick={() => setEditing(!editing)}
                className="p-2 text-teal-600 dark:text-cream-300 hover:bg-cream-100 dark:hover:bg-dark-700 rounded-lg transition"
                title="Edit caption"
              >
                <FaEdit />
              </button>
              <button
                onClick={handleDelete}
                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-dark-700 rounded-lg transition"
                title="Delete post"
              >
                <FaTrash />
              </button>
            </div>
          )}
        </div>

        {/* Caption */}
        {editing ? (
          <div className="space-y-2">
            <textarea
              value={editCaption}
              onChange={(e) => setEditCaption(e.target.value)}
              rows={3}
              maxLength={2000}
              className="w-full px-3 py-2 bg-cream-50 dark:bg-dark-700 border border-cream-200 dark:border-dark-600 rounded-lg text-teal-900 dark:text-cream-50 focus:outline-none focus:ring-2 focus:ring-coral-500 resize-none text-sm transition"
            />
            <div className="flex gap-2">
              <button
                onClick={handleEdit}
                className="flex items-center gap-1 px-3 py-1 bg-teal-700 text-white text-sm rounded-lg hover:bg-teal-800 transition"
              >
                <FaCheck /> Save
              </button>
              <button
                onClick={() => { setEditing(false); setEditCaption(post.caption || '') }}
                className="flex items-center gap-1 px-3 py-1 bg-gray-200 dark:bg-dark-600 text-teal-800 dark:text-cream-200 text-sm rounded-lg hover:bg-gray-300 dark:hover:bg-dark-500 transition"
              >
                <FaTimes /> Cancel
              </button>
            </div>
          </div>
        ) : (
          post.caption && (
            <p className="text-teal-800 dark:text-cream-100 text-sm leading-relaxed">{post.caption}</p>
          )
        )}

        {/* Timestamp */}
        <div className="flex items-center gap-1 text-xs text-teal-500 dark:text-cream-400">
          <FaClock />
          <span>{formatDate(post.createdAt)}</span>
        </div>

        {/* Comments Section */}
        {showComments && (
          <CommentSection
            postId={post._id}
            comments={comments}
            onCommentAdded={handleCommentAdded}
          />
        )}
      </div>

      {/* Engagement Modal (admin only) */}
      {showEngagement && (
        <EngagementModal
          postId={post._id}
          onClose={() => setShowEngagement(false)}
        />
      )}
    </div>
  )
}

export default PostCard
