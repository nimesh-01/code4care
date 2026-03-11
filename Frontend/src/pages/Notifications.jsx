import { useEffect, useState, useCallback } from 'react'
import { FaBell, FaCheck, FaCheckDouble, FaTrash, FaFilter, FaChevronDown } from 'react-icons/fa'
import { useNotifications } from '../context/NotificationContext'
import Navbar from '../components/Navbar'

const typeConfig = {
  appointment_request: { label: 'Appointment', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300' },
  appointment_approved: { label: 'Approved', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300' },
  appointment_rejected: { label: 'Declined', color: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300' },
  appointment_cancelled: { label: 'Cancelled', color: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300' },
  donation_received: { label: 'Donation', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300' },
  donation_completed: { label: 'Donation', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300' },
  help_request: { label: 'Help Request', color: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300' },
  help_request_accepted: { label: 'Help Accepted', color: 'bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-300' },
  help_request_completed: { label: 'Completed', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300' },
  event_created: { label: 'Event', color: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300' },
  event_reminder: { label: 'Reminder', color: 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300' },
  volunteer_joined: { label: 'Volunteer', color: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300' },
  child_update: { label: 'Child Update', color: 'bg-pink-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-300' },
  welcome: { label: 'Welcome', color: 'bg-coral-100 text-coral-700 dark:bg-coral-500/20 dark:text-coral-300' },
  system: { label: 'System', color: 'bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-300' },
  general: { label: 'Update', color: 'bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-300' },
}

const formatTimeAgo = (dateStr) => {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

const Notifications = () => {
  const {
    notifications,
    unreadCount,
    loading,
    pagination,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearReadNotifications,
  } = useNotifications()

  const [filter, setFilter] = useState(undefined) // undefined = all, 'unread', 'read'
  const [showFilterMenu, setShowFilterMenu] = useState(false)

  useEffect(() => {
    fetchNotifications(1, filter)
  }, [fetchNotifications, filter])

  const loadMore = useCallback(() => {
    if (pagination.hasMore && !loading) {
      fetchNotifications(pagination.currentPage + 1, filter)
    }
  }, [pagination, loading, fetchNotifications, filter])

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter)
    setShowFilterMenu(false)
  }

  return (
    <div className="min-h-screen bg-cream-50 dark:bg-dark-900 transition-colors duration-300">
      <Navbar />
      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
            <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-coral-400 to-teal-400 text-white shadow-lg">
                <FaBell className="text-2xl" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-teal-900 dark:text-cream-50 font-playfair">Notifications</h1>
                <p className="text-sm text-teal-600 dark:text-cream-400">
                  {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Filter Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowFilterMenu(!showFilterMenu)}
                  className="inline-flex items-center gap-2 rounded-xl border border-cream-300 dark:border-dark-600 px-4 py-2 text-sm font-medium text-teal-700 dark:text-cream-200 hover:border-coral-400 dark:hover:border-coral-400 transition bg-white dark:bg-dark-800"
                >
                  <FaFilter className="text-xs" />
                  {filter === 'unread' ? 'Unread' : filter === 'read' ? 'Read' : 'All'}
                  <FaChevronDown className="text-xs" />
                </button>
                {showFilterMenu && (
                  <div className="absolute right-0 mt-2 w-36 rounded-xl border border-cream-200 dark:border-dark-600 bg-white dark:bg-dark-800 shadow-xl z-20 overflow-hidden">
                    {[
                      { value: undefined, label: 'All' },
                      { value: 'unread', label: 'Unread' },
                      { value: 'read', label: 'Read' },
                    ].map(opt => (
                      <button
                        key={opt.label}
                        onClick={() => handleFilterChange(opt.value)}
                        className={`w-full text-left px-4 py-2.5 text-sm transition ${
                          filter === opt.value
                            ? 'bg-coral-50 dark:bg-coral-500/10 text-coral-600 dark:text-coral-400 font-medium'
                            : 'text-teal-700 dark:text-cream-200 hover:bg-cream-50 dark:hover:bg-dark-700'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Mark All Read */}
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="inline-flex items-center gap-2 rounded-xl border border-cream-300 dark:border-dark-600 px-4 py-2 text-sm font-medium text-teal-700 dark:text-cream-200 hover:border-teal-400 dark:hover:border-teal-400 transition bg-white dark:bg-dark-800"
                >
                  <FaCheckDouble className="text-xs" />
                  Mark all read
                </button>
              )}

              {/* Clear Read */}
              {notifications.some(n => n.read) && (
                <button
                  onClick={clearReadNotifications}
                  className="inline-flex items-center gap-2 rounded-xl border border-cream-300 dark:border-dark-600 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:border-red-400 dark:hover:border-red-400 transition bg-white dark:bg-dark-800"
                >
                  <FaTrash className="text-xs" />
                  Clear read
                </button>
              )}
            </div>
            </div>

          {/* Notification List */}
            <div className="space-y-3">
            {notifications.map(notification => {
              const config = typeConfig[notification.type] || typeConfig.general
              return (
                <div
                  key={notification._id}
                  className={`group relative rounded-2xl border p-4 transition-all duration-200 ${
                    notification.read
                      ? 'border-cream-200 dark:border-dark-700 bg-white/60 dark:bg-dark-800/40'
                      : 'border-coral-200 dark:border-coral-500/30 bg-white dark:bg-dark-800 shadow-sm'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Unread Indicator */}
                    <div className="mt-1.5 flex-shrink-0">
                      {!notification.read && (
                        <div className="w-2.5 h-2.5 rounded-full bg-coral-500 shadow-sm shadow-coral-500/30" />
                      )}
                      {notification.read && <div className="w-2.5 h-2.5" />}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${config.color}`}>
                          {config.label}
                        </span>
                        <span className="text-xs text-teal-500 dark:text-cream-400">
                          {formatTimeAgo(notification.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-teal-900 dark:text-cream-50">{notification.title}</p>
                      <p className="text-sm text-teal-600 dark:text-cream-300 mt-0.5 line-clamp-2">{notification.message}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification._id)}
                          className="p-2 rounded-lg text-teal-500 hover:bg-teal-50 dark:hover:bg-teal-500/10 transition"
                          title="Mark as read"
                        >
                          <FaCheck className="text-xs" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notification._id)}
                        className="p-2 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition"
                        title="Delete"
                      >
                        <FaTrash className="text-xs" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Empty State */}
            {!loading && notifications.length === 0 && (
              <div className="text-center py-16">
                <FaBell className="mx-auto text-4xl text-cream-300 dark:text-dark-600 mb-4" />
                <h3 className="text-lg font-semibold text-teal-700 dark:text-cream-200">
                  {filter === 'unread' ? 'No unread notifications' : filter === 'read' ? 'No read notifications' : 'No notifications yet'}
                </h3>
                <p className="text-sm text-teal-500 dark:text-cream-400 mt-1">
                  {filter === 'unread' ? "You're all caught up!" : 'Notifications will appear here when there is activity.'}
                </p>
              </div>
            )}

            {/* Loading */}
            {loading && (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-coral-500"></div>
              </div>
            )}

            {/* Load More */}
            {pagination.hasMore && !loading && (
              <div className="text-center pt-4">
                <button
                  onClick={loadMore}
                  className="inline-flex items-center gap-2 rounded-xl border border-cream-300 dark:border-dark-600 px-6 py-2.5 text-sm font-medium text-teal-700 dark:text-cream-200 hover:border-coral-400 dark:hover:border-coral-400 transition bg-white dark:bg-dark-800"
                >
                  Load more
                </button>
              </div>
            )}
            </div>
        </div>
      </div>
    </div>
  )
}

export default Notifications
