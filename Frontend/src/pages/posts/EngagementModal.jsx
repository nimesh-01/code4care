import { useState, useEffect } from 'react'
import { FaTimes, FaHeart, FaComment, FaUserCircle, FaSpinner } from 'react-icons/fa'
import { authAPI, postAPI } from '../../services/api'

const EngagementModal = ({ postId, onClose }) => {
  const [tab, setTab] = useState('likes')
  const [likers, setLikers] = useState([])
  const [commenters, setCommenters] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchEngagement = async () => {
      try {
        setLoading(true)
        // Fetch engagement data (likes userIds + comments)
        const engRes = await postAPI.getEngagement(postId)
        const { likes, comments } = engRes.data

        // Collect all unique user IDs
        const allIds = [...new Set([
          ...likes,
          ...comments.map(c => c.userId)
        ])]

        // Batch fetch user details
        let usersMap = {}
        if (allIds.length > 0) {
          const usersRes = await authAPI.getUsersBatch(allIds)
          usersRes.data.users.forEach(u => {
            usersMap[u._id] = u
          })
        }

        // Map likers
        setLikers(likes.map(id => usersMap[id] || { _id: id, username: 'Unknown User' }))

        // Map commenters with their comment text and timestamp
        setCommenters(comments.map(c => ({
          ...c,
          user: usersMap[c.userId] || { _id: c.userId, username: 'Unknown User' }
        })))
      } catch (err) {
        console.error('Failed to fetch engagement:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchEngagement()
  }, [postId])

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

  const getUserDisplayName = (user) => {
    if (user.fullname) {
      const first = user.fullname.firstname || ''
      const last = user.fullname.lastname || ''
      return `${first} ${last}`.trim() || user.username
    }
    return user.username || 'Unknown User'
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-dark-800 rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-cream-200 dark:border-dark-600">
          <h3 className="text-lg font-semibold text-teal-800 dark:text-cream-50">Post Engagement</h3>
          <button
            onClick={onClose}
            className="p-1 text-teal-500 dark:text-cream-400 hover:text-teal-700 dark:hover:text-cream-200 transition"
          >
            <FaTimes size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-cream-200 dark:border-dark-600">
          <button
            onClick={() => setTab('likes')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition ${
              tab === 'likes'
                ? 'text-red-500 border-b-2 border-red-500'
                : 'text-teal-500 dark:text-cream-400 hover:text-teal-700 dark:hover:text-cream-200'
            }`}
          >
            <FaHeart /> Likes ({likers.length})
          </button>
          <button
            onClick={() => setTab('comments')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition ${
              tab === 'comments'
                ? 'text-teal-700 dark:text-cream-100 border-b-2 border-teal-700 dark:border-cream-100'
                : 'text-teal-500 dark:text-cream-400 hover:text-teal-700 dark:hover:text-cream-200'
            }`}
          >
            <FaComment /> Comments ({commenters.length})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <FaSpinner className="animate-spin text-teal-600 dark:text-cream-300 text-2xl" />
            </div>
          ) : tab === 'likes' ? (
            likers.length === 0 ? (
              <p className="text-center text-sm text-teal-400 dark:text-cream-400 py-6">No likes yet</p>
            ) : (
              <ul className="space-y-3">
                {likers.map(user => (
                  <li key={user._id} className="flex items-center gap-3">
                    {user.profileUrl ? (
                      <img
                        src={user.profileUrl}
                        alt={getUserDisplayName(user)}
                        className="w-9 h-9 rounded-full object-cover"
                      />
                    ) : (
                      <FaUserCircle className="text-teal-400 dark:text-cream-400 text-3xl flex-shrink-0" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-teal-800 dark:text-cream-100">
                        {getUserDisplayName(user)}
                      </p>
                      <p className="text-xs text-teal-500 dark:text-cream-400">@{user.username}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )
          ) : (
            commenters.length === 0 ? (
              <p className="text-center text-sm text-teal-400 dark:text-cream-400 py-6">No comments yet</p>
            ) : (
              <ul className="space-y-4">
                {commenters.map((c, i) => (
                  <li key={c._id || i} className="flex gap-3">
                    {c.user.profileUrl ? (
                      <img
                        src={c.user.profileUrl}
                        alt={getUserDisplayName(c.user)}
                        className="w-9 h-9 rounded-full object-cover flex-shrink-0 mt-0.5"
                      />
                    ) : (
                      <FaUserCircle className="text-teal-400 dark:text-cream-400 text-3xl flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-medium text-teal-800 dark:text-cream-100">
                          {getUserDisplayName(c.user)}
                        </span>
                        <span className="text-xs text-teal-400 dark:text-cream-500">
                          {formatDate(c.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-teal-700 dark:text-cream-200 mt-0.5">{c.commentText}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )
          )}
        </div>
      </div>
    </div>
  )
}

export default EngagementModal
