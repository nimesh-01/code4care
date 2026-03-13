import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { toast } from 'react-toastify'
import { notificationAPI } from '../services/api'
import { useAuth } from './AuthContext'

const NotificationContext = createContext(null)
const severityToToast = {
  danger: toast.error,
  error: toast.error,
  warning: toast.warn,
  success: toast.success,
  info: toast.info,
}

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

const POLL_INTERVAL = 30000 // 30 seconds

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalNotifications: 0, hasMore: false })
  const intervalRef = useRef(null)
  const seenNotificationIds = useRef(new Set())
  const hasBootstrapped = useRef(false)
  const previousUnreadCount = useRef(0)

  const showSystemToast = useCallback((notification) => {
    if (!notification) return
    const severity = (notification.data?.severity || 'info').toLowerCase()
    const toastFn = severityToToast[severity] || toast.info
    toastFn(
      <div className="space-y-1">
        <p className="font-semibold text-sm">{notification.title}</p>
        <p className="text-xs opacity-80">{notification.message}</p>
      </div>,
      { toastId: `system-${notification._id}` }
    )
  }, [])

  const registerNotifications = useCallback((items, allowToast) => {
    if (!Array.isArray(items) || !items.length) return
    items.forEach((item) => {
      const id = item?._id
      if (!id || seenNotificationIds.current.has(id)) return
      seenNotificationIds.current.add(id)
      if (allowToast && item.type === 'system') {
        showSystemToast(item)
      }
    })
  }, [showSystemToast])

  const fetchNotifications = useCallback(async (page = 1, filter, options = {}) => {
    if (!user) return
    try {
      setLoading(true)
      const params = { page, limit: 20 }
      if (filter) params.filter = filter
      const res = await notificationAPI.getAll(params)
      const allowToast = Boolean(options.allowToast && hasBootstrapped.current)
      if (page === 1) {
        setNotifications(res.data.notifications)
        registerNotifications(res.data.notifications, allowToast)
        if (!hasBootstrapped.current) {
          hasBootstrapped.current = true
        }
      } else {
        setNotifications(prev => [...prev, ...res.data.notifications])
        registerNotifications(res.data.notifications, allowToast)
      }
      setPagination(res.data.pagination)
    } catch (err) {
      console.error('Failed to fetch notifications:', err)
    } finally {
      setLoading(false)
    }
  }, [user, registerNotifications])

  const fetchUnreadCount = useCallback(async () => {
    if (!user) return
    try {
      const res = await notificationAPI.getUnreadCount()
      const count = res.data.count
      if (count > previousUnreadCount.current) {
        await fetchNotifications(1, undefined, { allowToast: true })
      }
      previousUnreadCount.current = count
      setUnreadCount(count)
    } catch (err) {
      // Silent fail for polling
    }
  }, [user, fetchNotifications])

  const markAsRead = useCallback(async (id) => {
    try {
      await notificationAPI.markAsRead(id)
      setNotifications(prev =>
        prev.map(n => n._id === id ? { ...n, read: true, readAt: new Date().toISOString() } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (err) {
      console.error('Failed to mark notification as read:', err)
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationAPI.markAllAsRead()
      setNotifications(prev => prev.map(n => ({ ...n, read: true, readAt: new Date().toISOString() })))
      setUnreadCount(0)
    } catch (err) {
      console.error('Failed to mark all as read:', err)
    }
  }, [])

  const deleteNotification = useCallback(async (id) => {
    try {
      const notification = notifications.find(n => n._id === id)
      await notificationAPI.delete(id)
      setNotifications(prev => prev.filter(n => n._id !== id))
      if (notification && !notification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (err) {
      console.error('Failed to delete notification:', err)
    }
  }, [notifications])

  const clearReadNotifications = useCallback(async () => {
    try {
      await notificationAPI.clearRead()
      setNotifications(prev => prev.filter(n => !n.read))
    } catch (err) {
      console.error('Failed to clear notifications:', err)
    }
  }, [])

  // Poll for unread count
  useEffect(() => {
    if (!user) {
      setNotifications([])
      setUnreadCount(0)
      setPagination({ currentPage: 1, totalPages: 1, totalNotifications: 0, hasMore: false })
      seenNotificationIds.current.clear()
      hasBootstrapped.current = false
      previousUnreadCount.current = 0
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }

    fetchNotifications(1, undefined, { allowToast: false })
    fetchUnreadCount()
    intervalRef.current = setInterval(fetchUnreadCount, POLL_INTERVAL)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [user, fetchUnreadCount, fetchNotifications])

  const value = {
    notifications,
    unreadCount,
    loading,
    pagination,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearReadNotifications,
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}
