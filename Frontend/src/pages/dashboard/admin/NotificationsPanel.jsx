import { useEffect, useState, useCallback } from 'react'
import { FaBell, FaCheck, FaCheckDouble, FaTrash, FaFilter, FaChevronDown, FaPaperPlane, FaTimes } from 'react-icons/fa'
import { toast } from 'react-toastify'
import { useNotifications } from '../../../context/NotificationContext'
import { notificationAPI, eventAPI } from '../../../services/api'
import { annotateEventStatus } from '../../../utils/eventStatus'
import { ScrollReveal } from '../../../hooks/useScrollReveal'

const typeAccent = {
  appointment_request: 'bg-indigo-500/20 text-indigo-200',
  appointment_approved: 'bg-emerald-500/20 text-emerald-200',
  appointment_rejected: 'bg-red-500/20 text-red-200',
  appointment_cancelled: 'bg-amber-500/20 text-amber-200',
  donation_received: 'bg-emerald-500/20 text-emerald-200',
  donation_completed: 'bg-emerald-500/20 text-emerald-200',
  help_request: 'bg-purple-500/20 text-purple-200',
  help_request_accepted: 'bg-teal-500/20 text-teal-200',
  help_request_completed: 'bg-emerald-500/20 text-emerald-200',
  event_created: 'bg-blue-500/20 text-blue-200',
  event_reminder: 'bg-orange-500/20 text-orange-200',
  volunteer_joined: 'bg-purple-500/20 text-purple-200',
  welcome: 'bg-coral-500/20 text-coral-200',
  system: 'bg-slate-500/20 text-slate-200',
  general: 'bg-teal-500/20 text-teal-200',
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

const NotificationsPanel = () => {
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

  const [filter, setFilter] = useState(undefined)
  const [showFilterMenu, setShowFilterMenu] = useState(false)
  const [showCompose, setShowCompose] = useState(false)
  const [events, setEvents] = useState([])
  const [composeForm, setComposeForm] = useState({ title: '', message: '', targetEvent: '' })
  const [sending, setSending] = useState(false)

  useEffect(() => {
    fetchNotifications(1, filter)
  }, [fetchNotifications, filter])

  // Fetch events for "Send to event participants" feature
  useEffect(() => {
    if (showCompose && events.length === 0) {
      eventAPI.getAll().then(res => {
        const list = res.data?.events || res.data || []
        setEvents(list.map((event) => annotateEventStatus(event)).filter(e => e.participants?.length > 0))
      }).catch(() => {})
    }
  }, [showCompose])

  const handleComposeSend = async (e) => {
    e.preventDefault()
    if (!composeForm.title.trim() || !composeForm.message.trim()) {
      toast.error('Title and message are required')
      return
    }

    setSending(true)
    try {
      if (composeForm.targetEvent) {
        // Send via event reminder endpoint (goes through RabbitMQ to notification service)
        await eventAPI.sendReminder(composeForm.targetEvent, { message: `${composeForm.title}: ${composeForm.message}` })
        const ev = events.find(e => e._id === composeForm.targetEvent)
        toast.success(`Notification sent to ${ev?.participants?.length || 0} event participants`)
      } else {
        toast.error('Please select an event to send the notification to')
        setSending(false)
        return
      }
      setComposeForm({ title: '', message: '', targetEvent: '' })
      setShowCompose(false)
      // Refresh notifications after a brief delay
      setTimeout(() => fetchNotifications(1, filter), 1000)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send notification')
    } finally {
      setSending(false)
    }
  }

  const loadMore = useCallback(() => {
    if (pagination.hasMore && !loading) {
      fetchNotifications(pagination.currentPage + 1, filter)
    }
  }, [pagination, loading, fetchNotifications, filter])

  return (
    <div className="space-y-8">
      <ScrollReveal animation="fade-up">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-teal-500 dark:text-cream-300">Notifications</p>
          <h2 className="text-3xl font-semibold text-teal-900 dark:text-cream-50 font-playfair">Mission control feed</h2>
          <p className="text-sm text-teal-600 dark:text-cream-400">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'} &middot; All confirmations, escalations, and updates.
          </p>
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
                    onClick={() => { setFilter(opt.value); setShowFilterMenu(false) }}
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

          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="inline-flex items-center gap-2 rounded-xl border border-cream-300 dark:border-dark-600 px-4 py-2 text-sm font-medium text-teal-700 dark:text-cream-200 hover:border-teal-400 transition bg-white dark:bg-dark-800"
            >
              <FaCheckDouble className="text-xs" /> Mark all read
            </button>
          )}

          {notifications.some(n => n.read) && (
            <button
              onClick={clearReadNotifications}
              className="inline-flex items-center gap-2 rounded-xl border border-cream-300 dark:border-dark-600 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:border-red-400 transition bg-white dark:bg-dark-800"
            >
              <FaTrash className="text-xs" /> Clear read
            </button>
          )}

          <button
            onClick={() => setShowCompose(!showCompose)}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-coral-500 to-teal-500 px-4 py-2 text-sm font-semibold text-white shadow-lg hover:shadow-xl transition"
          >
            <FaPaperPlane className="text-xs" /> Send Notification
          </button>
        </div>
      </header>
      </ScrollReveal>

      {/* Compose Notification */}
      {showCompose && (
        <div className="rounded-3xl border border-coral-200 dark:border-coral-500/20 bg-white dark:bg-dark-800/80 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <FaPaperPlane className="text-xl text-coral-400" />
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-teal-500 dark:text-cream-300">Compose</p>
                <h3 className="text-lg font-semibold text-teal-900 dark:text-cream-50">Send notification to participants</h3>
              </div>
            </div>
            <button onClick={() => setShowCompose(false)} className="text-teal-500 hover:text-coral-500 transition">
              <FaTimes />
            </button>
          </div>

          <form onSubmit={handleComposeSend} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-teal-700 dark:text-cream-200 mb-1">Select Event *</label>
              <select
                value={composeForm.targetEvent}
                onChange={e => setComposeForm(prev => ({ ...prev, targetEvent: e.target.value }))}
                required
                className="w-full rounded-xl border border-cream-200 bg-cream-50 px-4 py-3 text-teal-900 focus:border-coral-400 focus:outline-none dark:border-dark-600 dark:bg-dark-800 dark:text-cream-50"
              >
                <option value="">Select an event with participants...</option>
                {events.map(ev => (
                  <option key={ev._id} value={ev._id}>
                    {ev.title} ({ev.participants?.length || 0} participants)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-teal-700 dark:text-cream-200 mb-1">Title *</label>
              <input
                value={composeForm.title}
                onChange={e => setComposeForm(prev => ({ ...prev, title: e.target.value }))}
                required
                maxLength={200}
                className="w-full rounded-xl border border-cream-200 bg-cream-50 px-4 py-3 text-teal-900 focus:border-coral-400 focus:outline-none dark:border-dark-600 dark:bg-dark-800 dark:text-cream-50"
                placeholder="Reminder title..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-teal-700 dark:text-cream-200 mb-1">Message *</label>
              <textarea
                value={composeForm.message}
                onChange={e => setComposeForm(prev => ({ ...prev, message: e.target.value }))}
                required
                rows={3}
                maxLength={1000}
                className="w-full rounded-xl border border-cream-200 bg-cream-50 px-4 py-3 text-teal-900 focus:border-coral-400 focus:outline-none dark:border-dark-600 dark:bg-dark-800 dark:text-cream-50"
                placeholder="Write your notification message..."
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowCompose(false)}
                className="rounded-full border border-cream-200 px-6 py-2 text-sm font-medium text-teal-700 hover:bg-cream-50 dark:border-dark-600 dark:text-cream-200 dark:hover:bg-dark-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={sending}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-coral-500 to-teal-500 px-6 py-2 text-sm font-medium text-white disabled:opacity-70 transition"
              >
                <FaPaperPlane className="text-xs" /> {sending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </form>
        </div>
      )}

      <ScrollReveal animation="fade-up" delay={200}>
      <div className="rounded-3xl border border-cream-200 dark:border-dark-700 bg-white/80 dark:bg-dark-800/60 p-6">
        <div className="flex items-center gap-3 mb-6">
          <FaBell className="text-3xl text-coral-400" />
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-teal-500 dark:text-cream-300">Live updates</p>
            <h3 className="text-2xl font-semibold text-teal-900 dark:text-cream-50">Activity timeline</h3>
          </div>
        </div>

        <ol className="space-y-4">
          {notifications.map((notification) => (
            <li key={notification._id} className={`group flex items-start gap-4 rounded-2xl border p-4 transition-all ${
              notification.read
                ? 'border-cream-200 dark:border-dark-700 bg-cream-50/50 dark:bg-dark-900/40'
                : 'border-coral-200 dark:border-coral-500/20 bg-white dark:bg-dark-800/80 shadow-sm'
            }`}>
              {/* Unread dot */}
              <div className="mt-1.5 flex-shrink-0">
                {!notification.read && <div className="w-2.5 h-2.5 rounded-full bg-coral-500 shadow-sm shadow-coral-500/30" />}
                {notification.read && <div className="w-2.5 h-2.5" />}
              </div>

              <span className={`flex-shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${typeAccent[notification.type] || typeAccent.general}`}>
                {notification.type?.replace(/_/g, ' ') || 'update'}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-teal-900 dark:text-cream-50">{notification.title}</p>
                <p className="text-sm text-teal-600 dark:text-cream-300">{notification.message}</p>
                <p className="text-xs text-teal-400 dark:text-cream-400 mt-1">{formatTimeAgo(notification.createdAt)}</p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {!notification.read && (
                  <button onClick={() => markAsRead(notification._id)} className="p-2 rounded-lg text-teal-500 hover:bg-teal-50 dark:hover:bg-teal-500/10 transition" title="Mark as read">
                    <FaCheck className="text-xs" />
                  </button>
                )}
                <button onClick={() => deleteNotification(notification._id)} className="p-2 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition" title="Delete">
                  <FaTrash className="text-xs" />
                </button>
              </div>
            </li>
          ))}
        </ol>

        {!loading && notifications.length === 0 && (
          <p className="py-10 text-center text-sm text-teal-500 dark:text-cream-400">No notifications available.</p>
        )}

        {loading && (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-coral-500"></div>
          </div>
        )}

        {pagination.hasMore && !loading && (
          <div className="text-center pt-4">
            <button onClick={loadMore} className="inline-flex items-center gap-2 rounded-xl border border-cream-300 dark:border-dark-600 px-6 py-2.5 text-sm font-medium text-teal-700 dark:text-cream-200 hover:border-coral-400 transition bg-white dark:bg-dark-800">
              Load more
            </button>
          </div>
        )}
      </div>
      </ScrollReveal>
    </div>
  )
}

export default NotificationsPanel
