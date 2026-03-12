import { useState, useEffect, useCallback } from 'react'
import {
  FaBell, FaCheckCircle, FaTrash, FaBuilding, FaUser,
  FaDonate, FaExclamationTriangle, FaCheck, FaEnvelope,
} from 'react-icons/fa'
import { notificationAPI } from '../../../services/api'

const typeIcons = {
  orphanage_registered: FaBuilding,
  orphanage_verified: FaCheckCircle,
  donation: FaDonate,
  user_registered: FaUser,
  alert: FaExclamationTriangle,
  default: FaBell,
}

const typeColors = {
  orphanage_registered: 'bg-teal-50 dark:bg-teal-500/10 text-teal-500',
  orphanage_verified: 'bg-green-50 dark:bg-green-500/10 text-green-500',
  donation: 'bg-coral-50 dark:bg-coral-500/10 text-coral-500',
  user_registered: 'bg-blue-50 dark:bg-blue-500/10 text-blue-500',
  alert: 'bg-yellow-50 dark:bg-yellow-500/10 text-yellow-500',
  default: 'bg-cream-50 dark:bg-dark-700 text-teal-500',
}

const SANotifications = () => {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true)
      const res = await notificationAPI.getAll({ page, limit: 20 })
      setNotifications(res.data.notifications || res.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => { fetchNotifications() }, [fetchNotifications])

  const markAllRead = async () => {
    try {
      await notificationAPI.markAllAsRead()
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    } catch (err) {
      console.error(err)
    }
  }

  const markRead = async (id) => {
    try {
      await notificationAPI.markAsRead(id)
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n))
    } catch (err) {
      console.error(err)
    }
  }

  const deleteNotification = async (id) => {
    try {
      await notificationAPI.delete(id)
      setNotifications(prev => prev.filter(n => n._id !== id))
    } catch (err) {
      console.error(err)
    }
  }

  const clearRead = async () => {
    try {
      await notificationAPI.clearRead()
      setNotifications(prev => prev.filter(n => !n.read))
    } catch (err) {
      console.error(err)
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-teal-900 dark:text-cream-50 font-playfair">Notifications</h2>
          <p className="text-sm text-teal-600 dark:text-cream-400">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up'}
          </p>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-2 rounded-xl border border-cream-300 dark:border-dark-600 px-4 py-2 text-sm font-medium text-teal-700 dark:text-cream-200 hover:bg-cream-50 dark:hover:bg-dark-700 transition"
            >
              <FaCheck className="text-xs" /> Mark all read
            </button>
          )}
          <button
            onClick={clearRead}
            className="flex items-center gap-2 rounded-xl border border-cream-300 dark:border-dark-600 px-4 py-2 text-sm font-medium text-teal-700 dark:text-cream-200 hover:bg-cream-50 dark:hover:bg-dark-700 transition"
          >
            <FaTrash className="text-xs" /> Clear read
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-coral-500" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16">
          <FaBell className="text-5xl text-teal-300 dark:text-dark-600 mx-auto mb-4" />
          <p className="text-teal-600 dark:text-cream-400">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const Icon = typeIcons[n.type] || typeIcons.default
            const color = typeColors[n.type] || typeColors.default
            return (
              <div
                key={n._id}
                className={`rounded-xl border bg-white dark:bg-dark-800 p-4 flex items-start gap-4 transition-all duration-200 ${
                  n.read
                    ? 'border-cream-200 dark:border-dark-700 opacity-70'
                    : 'border-coral-200 dark:border-coral-500/30 shadow-sm'
                }`}
              >
                <div className={`p-2 rounded-lg shrink-0 ${color}`}>
                  <Icon className="text-sm" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${n.read ? 'text-teal-700 dark:text-cream-200' : 'font-medium text-teal-900 dark:text-cream-50'}`}>
                    {n.title || n.message}
                  </p>
                  {n.body && (
                    <p className="text-xs text-teal-500 dark:text-cream-400 mt-0.5">{n.body}</p>
                  )}
                  <p className="text-xs text-teal-400 dark:text-cream-400/60 mt-1">
                    {new Date(n.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {!n.read && (
                    <button
                      onClick={() => markRead(n._id)}
                      className="p-1.5 rounded-lg text-teal-400 hover:text-teal-600 hover:bg-cream-50 dark:hover:bg-dark-700 transition"
                      title="Mark as read"
                    >
                      <FaCheck className="text-xs" />
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(n._id)}
                    className="p-1.5 rounded-lg text-teal-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition"
                    title="Delete"
                  >
                    <FaTrash className="text-xs" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default SANotifications
