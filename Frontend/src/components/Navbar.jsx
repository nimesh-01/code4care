import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { FaHeart, FaBars, FaTimes, FaSun, FaMoon, FaUserCircle, FaComments, FaBell } from 'react-icons/fa'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useNotifications } from '../context/NotificationContext'

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const progressRef = useRef(null)
  const rafRef = useRef(null)
  const notificationPanelRef = useRef(null)
  const { user, logout } = useAuth()
  const { isDarkMode, toggleTheme } = useTheme()
  const {
    notifications,
    unreadCount,
    loading: notificationsLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotifications()
  const navigate = useNavigate()
  const location = useLocation()
  const normalizedRole = (user?.role || '').toLowerCase()
  const canViewAppointments = ['user', 'volunteer'].includes(normalizedRole)
  const recentNotifications = notifications.slice(0, 6)
  const showGeneralLinks = !user || (user.role !== 'orphanAdmin' && user.role !== 'superAdmin')

  const isPathActive = useCallback((path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname === path || location.pathname.startsWith(`${path}/`)
  }, [location.pathname])

  const updateProgress = useCallback(() => {
    if (!progressRef.current) return
    const docHeight = document.documentElement.scrollHeight - window.innerHeight
    const progress = docHeight > 0 ? Math.min(window.scrollY / docHeight, 1) : 0
    progressRef.current.style.transform = `scaleX(${progress})`
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(updateProgress)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    updateProgress()
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [location.pathname, updateProgress])

  useEffect(() => {
    setShowNotifications(false)
  }, [location.pathname])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationPanelRef.current && !notificationPanelRef.current.contains(event.target)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const toggleNotificationPanel = () => {
    setShowNotifications((prev) => {
      const next = !prev
      if (!prev) {
        fetchNotifications(1)
      }
      return next
    })
  }

  const handleNotificationAction = (notification) => {
    if (notification && !notification.read) {
      markAsRead(notification._id)
    }
    navigate('/notifications')
    setShowNotifications(false)
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const desktopMenuClass = user ? 'hidden xl:flex items-center gap-8' : 'hidden lg:flex items-center gap-8'
  const compactMenuWrapper = user ? 'xl:hidden flex items-center gap-4' : 'lg:hidden flex items-center gap-4'
  const compactMenuContainer = user ? 'xl:hidden mt-4 pb-4 border-t border-cream-200 dark:border-dark-700 pt-4' : 'lg:hidden mt-4 pb-4 border-t border-cream-200 dark:border-dark-700 pt-4'

  return (
    <nav className="fixed w-full z-50 bg-cream-50/95 dark:bg-dark-900/95 backdrop-blur-md shadow-sm transition-colors duration-300">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 text-2xl font-bold text-coral-600 dark:text-coral-400">
            <FaHeart className="text-coral-500 dark:text-coral-400" />
            <span className="font-playfair">SoulConnect</span>
          </Link>

          {/* Desktop Menu */}
          <div className={desktopMenuClass}>
            {!isPathActive('/') && <NavLink to="/">Home</NavLink>}
            {showGeneralLinks && (
              <>
                {!isPathActive('/children') && <NavLink to="/children">Children</NavLink>}
                {!isPathActive('/orphanages') && <NavLink to="/orphanages">Orphanages</NavLink>}
                {canViewAppointments && !isPathActive('/appointments') && <NavLink to="/appointments">Appointments</NavLink>}
                {user && !isPathActive('/events') && <NavLink to="/events">Events</NavLink>}
                {user && !isPathActive('/donate') && <NavLink to="/donate">Donate</NavLink>}
              </>
            )}
            
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full bg-cream-100 dark:bg-dark-700 text-coral-500 dark:text-coral-400 hover:bg-cream-200 dark:hover:bg-dark-600 transition-all duration-300"
              aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDarkMode ? <FaSun className="w-5 h-5" /> : <FaMoon className="w-5 h-5" />}
            </button>
            
            {user ? (
              <div className="flex items-center gap-4">
                {user.role !== 'orphanAdmin' && user.role !== 'superAdmin' && !isPathActive('/profile') && (
                  <Link to="/profile" className="flex items-center gap-2 text-teal-700 dark:text-teal-400 hover:text-coral-500 dark:hover:text-coral-400 transition font-medium">
                    <FaUserCircle className="text-xl" />
                    <span>Profile</span>
                  </Link>
                )}
                {normalizedRole !== 'superadmin' && !isPathActive('/chat') && (
                  <Link to="/chat" className="flex items-center gap-1 text-teal-700 dark:text-teal-400 hover:text-coral-500 dark:hover:text-coral-400 transition font-medium">
                    <FaComments className="text-sm" />
                    <span>Chat</span>
                  </Link>
                )}
                <div className="relative" ref={notificationPanelRef}>
                  <button
                    type="button"
                    onClick={toggleNotificationPanel}
                    className="relative flex items-center text-teal-700 dark:text-teal-400 hover:text-coral-500 dark:hover:text-coral-400 transition"
                    aria-label="Notifications"
                    aria-expanded={showNotifications}
                  >
                    <FaBell className="text-lg" />
                    {unreadCount > 0 && (
                      <>
                        <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-coral-500 text-white text-[10px] font-bold leading-none px-1">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                        <span className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full bg-coral-400 animate-ping opacity-60" aria-hidden="true" />
                      </>
                    )}
                  </button>
                  {showNotifications && (
                    <NotificationDropdownPanel
                      notifications={recentNotifications}
                      unreadCount={unreadCount}
                      loading={notificationsLoading}
                      onMarkAllRead={() => markAllAsRead()}
                      onNavigateAll={() => {
                        setShowNotifications(false)
                        navigate('/notifications')
                      }}
                      onItemClick={handleNotificationAction}
                    />
                  )}
                </div>
                {normalizedRole === 'volunteer' && !isPathActive('/dashboard/volunteer') && (
                  <Link to="/dashboard/volunteer" className="text-teal-700 dark:text-teal-400 hover:text-coral-500 dark:hover:text-coral-400 transition font-medium">
                    Volunteer Desk
                  </Link>
                )}
                {user.role === 'orphanAdmin' && !isPathActive('/dashboard/admin') && (
                  <Link to="/dashboard/admin" className="text-teal-700 dark:text-teal-400 hover:text-coral-500 dark:hover:text-coral-400 transition font-medium">
                    Dashboard
                  </Link>
                )}
                {user.role === 'superAdmin' && !isPathActive('/dashboard/superadmin') && (
                  <Link to="/dashboard/superadmin" className="text-teal-700 dark:text-teal-400 hover:text-coral-500 dark:hover:text-coral-400 transition font-medium">
                    Admin Panel
                  </Link>
                )}
                <button 
                  onClick={handleLogout}
                  className="py-2 px-4 bg-cream-100 dark:bg-dark-700 text-teal-700 dark:text-teal-400 rounded-full hover:bg-cream-200 dark:hover:bg-dark-600 transition font-medium text-sm"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Link to="/login" className="text-teal-700 dark:text-teal-400 hover:text-coral-500 dark:hover:text-coral-400 transition font-medium">
                  Login
                </Link>
                <Link to="/register" className="py-2 px-4 bg-coral-500 text-white rounded-full hover:bg-coral-600 transition font-medium text-sm shadow-md hover:shadow-lg">
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile / Compact Menu Button */}
          <div className={compactMenuWrapper}>
            {/* Mobile Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full bg-cream-100 dark:bg-dark-700 text-coral-500 dark:text-coral-400 hover:bg-cream-200 dark:hover:bg-dark-600 transition-all duration-300"
              aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDarkMode ? <FaSun className="w-5 h-5" /> : <FaMoon className="w-5 h-5" />}
            </button>
            
            <button 
              onClick={() => setIsOpen(!isOpen)}
              className="text-teal-700 dark:text-teal-400 text-2xl"
            >
              {isOpen ? <FaTimes /> : <FaBars />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className={compactMenuContainer}>
            <div className="flex flex-col gap-4">
              {!isPathActive('/') && <MobileNavLink to="/" onClick={() => setIsOpen(false)}>Home</MobileNavLink>}
              {showGeneralLinks && (
                <>
                  {!isPathActive('/children') && <MobileNavLink to="/children" onClick={() => setIsOpen(false)}>Children</MobileNavLink>}
                  {!isPathActive('/orphanages') && <MobileNavLink to="/orphanages" onClick={() => setIsOpen(false)}>Orphanages</MobileNavLink>}
                  {canViewAppointments && !isPathActive('/appointments') && (
                    <MobileNavLink to="/appointments" onClick={() => setIsOpen(false)}>Appointments</MobileNavLink>
                  )}
                  {user && !isPathActive('/events') && <MobileNavLink to="/events" onClick={() => setIsOpen(false)}>Events</MobileNavLink>}
                  {user && !isPathActive('/donate') && <MobileNavLink to="/donate" onClick={() => setIsOpen(false)}>Donate</MobileNavLink>}
                </>
              )}
              
              {user ? (
                <>
                  {user.role !== 'orphanAdmin' && user.role !== 'superAdmin' && !isPathActive('/profile') && (
                    <MobileNavLink to="/profile" onClick={() => setIsOpen(false)}>Profile</MobileNavLink>
                  )}
                  {normalizedRole !== 'superadmin' && !isPathActive('/chat') && (
                    <MobileNavLink to="/chat" onClick={() => setIsOpen(false)}>Chat</MobileNavLink>
                  )}
                  <Link
                    to="/notifications"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-2 text-teal-800 dark:text-cream-100 hover:text-coral-500 dark:hover:text-coral-400 transition font-medium"
                  >
                    <FaBell className="text-sm" />
                    Notifications{unreadCount > 0 && ` (${unreadCount})`}
                  </Link>
                  {normalizedRole === 'volunteer' && !isPathActive('/dashboard/volunteer') && (
                    <MobileNavLink to="/dashboard/volunteer" onClick={() => setIsOpen(false)}>Volunteer Desk</MobileNavLink>
                  )}
                  {user.role === 'orphanAdmin' && !isPathActive('/dashboard/admin') && (
                    <MobileNavLink to="/dashboard/admin" onClick={() => setIsOpen(false)}>Dashboard</MobileNavLink>
                  )}
                  {user.role === 'superAdmin' && !isPathActive('/dashboard/superadmin') && (
                    <MobileNavLink to="/dashboard/superadmin" onClick={() => setIsOpen(false)}>Admin Panel</MobileNavLink>
                  )}
                  <button 
                    onClick={() => { handleLogout(); setIsOpen(false); }}
                    className="text-left text-coral-500 dark:text-coral-400 font-medium"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <MobileNavLink to="/login" onClick={() => setIsOpen(false)}>Login</MobileNavLink>
                  <MobileNavLink to="/register" onClick={() => setIsOpen(false)}>Register</MobileNavLink>
                </>
              )}
            </div>
          </div>
        )}
      </div>
      {/* Scroll progress bar */}
      <div className="absolute bottom-0 left-0 w-full h-[2px] bg-cream-200 dark:bg-dark-700">
        <div
          ref={progressRef}
          className="h-full w-full origin-left will-change-transform bg-gradient-to-r from-coral-500 via-teal-400 to-coral-500"
          style={{ transform: 'scaleX(0)' }}
        />
      </div>
    </nav>
  )
}

const NavLink = ({ to, children }) => (
  <Link 
    to={to} 
    className="text-teal-800 dark:text-cream-100 hover:text-coral-500 dark:hover:text-coral-400 transition font-medium"
  >
    {children}
  </Link>
)

const MobileNavLink = ({ to, children, onClick }) => (
  <Link 
    to={to} 
    onClick={onClick}
    className="text-teal-800 dark:text-cream-100 hover:text-coral-500 dark:hover:text-coral-400 transition font-medium"
  >
    {children}
  </Link>
)

const NotificationDropdownPanel = ({ notifications, unreadCount, loading, onMarkAllRead, onNavigateAll, onItemClick }) => {
  const canMarkAll = unreadCount > 0
  return (
    <div className="absolute right-0 mt-3 w-80 max-w-xs rounded-2xl border border-cream-200 bg-white shadow-2xl dark:border-dark-600 dark:bg-dark-800 overflow-hidden z-50">
      <div className="flex items-center justify-between px-4 py-3 border-b border-cream-100 dark:border-dark-700">
        <div>
          <p className="text-sm font-semibold text-teal-900 dark:text-cream-100">Notifications</p>
          <p className="text-xs text-teal-700/70 dark:text-cream-200/60">{unreadCount} unread</p>
        </div>
        <button
          type="button"
          onClick={onMarkAllRead}
          disabled={!canMarkAll}
          className={`text-xs font-medium px-3 py-1 rounded-full transition ${canMarkAll ? 'bg-teal-50 text-teal-700 hover:bg-teal-100 dark:bg-dark-700 dark:text-cream-100 dark:hover:bg-dark-600' : 'text-cream-400 cursor-not-allowed'}`}
        >
          Mark all read
        </button>
      </div>
      <div className="max-h-96 divide-y divide-cream-100 dark:divide-dark-700">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <span className="h-5 w-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : notifications.length > 0 ? (
          notifications.map((notification) => (
            <NotificationListItem key={notification._id} notification={notification} onClick={() => onItemClick(notification)} />
          ))
        ) : (
          <div className="px-4 py-8 text-center text-sm text-teal-700/70 dark:text-cream-200/70">
            You're all caught up!
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={onNavigateAll}
        className="w-full px-4 py-3 text-center text-sm font-semibold text-coral-600 hover:text-coral-500 bg-cream-50 dark:bg-dark-700 dark:text-coral-300"
      >
        View all notifications
      </button>
    </div>
  )
}

const NotificationListItem = ({ notification, onClick }) => {
  const isUnread = !notification.read
  const isSystem = notification.type === 'system'
  const severity = (notification.data?.severity || '').toLowerCase()
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full px-4 py-3 text-left flex flex-col gap-1 transition ${isUnread ? 'bg-cream-50 dark:bg-dark-700/60' : 'bg-white dark:bg-dark-800'} hover:bg-cream-100 dark:hover:bg-dark-700`}
    >
      <div className="flex items-center gap-2">
        <p className="text-sm font-semibold text-teal-900 dark:text-cream-100 truncate">{notification.title}</p>
        {isSystem && <span className="text-[10px] uppercase font-semibold tracking-wide text-coral-500">System</span>}
        {severity && <SeverityPill severity={severity} />}
      </div>
      <p className="text-xs text-teal-700/80 dark:text-cream-200/70 overflow-hidden text-ellipsis">
        {notification.message}
      </p>
      <div className="flex items-center justify-between text-[11px] text-teal-700/60 dark:text-cream-200/50">
        <span>{formatRelativeTime(notification.createdAt)}</span>
        {isUnread && <span className="w-2 h-2 rounded-full bg-coral-500" aria-hidden="true" />}
      </div>
    </button>
  )
}

const SeverityPill = ({ severity }) => {
  const classes = {
    danger: 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-200',
    error: 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-200',
    warning: 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-200',
    success: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-200',
    info: 'bg-teal-100 text-teal-600 dark:bg-teal-500/20 dark:text-teal-200',
  }
  const label = severity.charAt(0).toUpperCase() + severity.slice(1)
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${classes[severity] || classes.info}`}>
      {label}
    </span>
  )
}

const formatRelativeTime = (timestamp) => {
  if (!timestamp) return ''
  const value = new Date(timestamp).getTime()
  if (Number.isNaN(value)) return ''
  const diff = Date.now() - value
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  const weeks = Math.floor(days / 7)
  if (weeks < 4) return `${weeks}w ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  const years = Math.floor(days / 365)
  return `${years}y ago`
}

export default Navbar
