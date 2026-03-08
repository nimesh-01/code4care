import { useState } from 'react'
import { FaPaperPlane, FaSpinner, FaUserCircle } from 'react-icons/fa'
import { toast } from 'react-toastify'
import { useAuth } from '../../context/AuthContext'
import { postAPI } from '../../services/api'

const CommentSection = ({ postId, comments, onCommentAdded }) => {
  const { user } = useAuth()
  const [commentText, setCommentText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!user) {
      toast.info('Please login to comment')
      return
    }
    if (!commentText.trim()) return

    try {
      setSubmitting(true)
      const res = await postAPI.comment(postId, { commentText: commentText.trim() })
      onCommentAdded(res.data.comment)
      setCommentText('')
    } catch (err) {
      toast.error('Failed to add comment')
    } finally {
      setSubmitting(false)
    }
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
    <div className="border-t border-cream-200 dark:border-dark-600 pt-3 space-y-3">
      {/* Comment List */}
      <div className="max-h-60 overflow-y-auto space-y-2">
        {comments.length === 0 ? (
          <p className="text-sm text-teal-400 dark:text-cream-400 text-center py-2">No comments yet. Be the first!</p>
        ) : (
          comments.map((c, i) => (
            <div key={c._id || i} className="flex gap-2">
              <FaUserCircle className="text-teal-400 dark:text-cream-400 text-lg mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-teal-800 dark:text-cream-100">{c.commentText}</p>
                <span className="text-xs text-teal-400 dark:text-cream-500">{formatDate(c.createdAt)}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Comment Form */}
      {user && (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Add a comment..."
            maxLength={1000}
            className="flex-1 px-3 py-2 bg-cream-50 dark:bg-dark-700 border border-cream-200 dark:border-dark-600 rounded-lg text-sm text-teal-900 dark:text-cream-50 placeholder-teal-400 dark:placeholder-cream-400 focus:outline-none focus:ring-2 focus:ring-coral-500 transition"
          />
          <button
            type="submit"
            disabled={submitting || !commentText.trim()}
            className="px-3 py-2 bg-teal-700 text-white rounded-lg hover:bg-teal-800 disabled:opacity-50 transition"
          >
            {submitting ? <FaSpinner className="animate-spin" /> : <FaPaperPlane />}
          </button>
        </form>
      )}
    </div>
  )
}

export default CommentSection
