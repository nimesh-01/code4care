import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { notificationAPI } from '../services/api'
import { useAuth } from './AuthContext'

const NotificationContext = createContext(null)

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

  const fetchUnreadCount = useCallback(async () => {
    if (!user) return
    try {
      const res = await notificationAPI.getUnreadCount()
      setUnreadCount(res.data.count)
    } catch (err) {
      // Silent fail for polling
    }
  }, [user])

  const fetchNotifications = useCallback(async (page = 1, filter) => {
    if (!user) return
    try {
      setLoading(true)
      const params = { page, limit: 20 }
      if (filter) params.filter = filter
      const res = await notificationAPI.getAll(params)
      if (page === 1) {
        setNotifications(res.data.notifications)
      } else {
        setNotifications(prev => [...prev, ...res.data.notifications])
      }
      setPagination(res.data.pagination)
    } catch (err) {
      console.error('Failed to fetch notifications:', err)
    } finally {
      setLoading(false)
    }
  }, [user])

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
      return
    }

    fetchUnreadCount()
    intervalRef.current = setInterval(fetchUnreadCount, POLL_INTERVAL)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [user, fetchUnreadCount])

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
