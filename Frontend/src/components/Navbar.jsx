import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { FaHeart, FaBars, FaTimes, FaSun, FaMoon, FaUserCircle, FaComments, FaBell } from 'react-icons/fa'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useNotifications } from '../context/NotificationContext'

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false)
  const progressRef = useRef(null)
  const rafRef = useRef(null)
  const { user, logout } = useAuth()
  const { isDarkMode, toggleTheme } = useTheme()
  const { unreadCount } = useNotifications()
  const navigate = useNavigate()
  const location = useLocation()
  const normalizedRole = (user?.role || '').toLowerCase()
  const canViewAppointments = ['user', 'volunteer'].includes(normalizedRole)

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

  const handleLogout = () => {
    logout()
    navigate('/')
  }

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
          <div className="hidden md:flex items-center gap-8">
            <NavLink to="/">Home</NavLink>
            {user?.role !== 'orphanAdmin' && (
              <>
                <NavLink to="/children">Children</NavLink>
                <NavLink to="/orphanages">Orphanages</NavLink>
                {canViewAppointments && <NavLink to="/appointments">Appointments</NavLink>}
                <NavLink to="/events">Events</NavLink>
                <NavLink to="/donate">Donate</NavLink>
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
                {user.role !== 'orphanAdmin' && (
                  <Link to="/profile" className="flex items-center gap-2 text-teal-700 dark:text-teal-400 hover:text-coral-500 dark:hover:text-coral-400 transition font-medium">
                    <FaUserCircle className="text-xl" />
                    <span>Profile</span>
                  </Link>
                )}
                <Link to="/chat" className="flex items-center gap-1 text-teal-700 dark:text-teal-400 hover:text-coral-500 dark:hover:text-coral-400 transition font-medium">
                  <FaComments className="text-sm" />
                  <span>Chat</span>
                </Link>
                <Link to="/notifications" className="relative flex items-center text-teal-700 dark:text-teal-400 hover:text-coral-500 dark:hover:text-coral-400 transition">
                  <FaBell className="text-lg" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-coral-500 text-white text-[10px] font-bold leading-none px-1">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Link>
                {normalizedRole === 'volunteer' && (
                  <Link to="/dashboard/volunteer" className="text-teal-700 dark:text-teal-400 hover:text-coral-500 dark:hover:text-coral-400 transition font-medium">
                    Volunteer Desk
                  </Link>
                )}
                {user.role === 'orphanAdmin' && (
                  <Link to="/dashboard/admin" className="text-teal-700 dark:text-teal-400 hover:text-coral-500 dark:hover:text-coral-400 transition font-medium">
                    Dashboard
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

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-4">
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
          <div className="md:hidden mt-4 pb-4 border-t border-cream-200 dark:border-dark-700 pt-4">
            <div className="flex flex-col gap-4">
              <MobileNavLink to="/" onClick={() => setIsOpen(false)}>Home</MobileNavLink>
              {user?.role !== 'orphanAdmin' && (
                <>
                  <MobileNavLink to="/children" onClick={() => setIsOpen(false)}>Children</MobileNavLink>
                  <MobileNavLink to="/orphanages" onClick={() => setIsOpen(false)}>Orphanages</MobileNavLink>
                  {canViewAppointments && (
                    <MobileNavLink to="/appointments" onClick={() => setIsOpen(false)}>Appointments</MobileNavLink>
                  )}
                  <MobileNavLink to="/events" onClick={() => setIsOpen(false)}>Events</MobileNavLink>
                  <MobileNavLink to="/donate" onClick={() => setIsOpen(false)}>Donate</MobileNavLink>
                </>
              )}
              
              {user ? (
                <>
                  {user.role !== 'orphanAdmin' && (
                    <MobileNavLink to="/profile" onClick={() => setIsOpen(false)}>Profile</MobileNavLink>
                  )}
                  <MobileNavLink to="/chat" onClick={() => setIsOpen(false)}>Chat</MobileNavLink>
                  <Link
                    to="/notifications"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-2 text-teal-800 dark:text-cream-100 hover:text-coral-500 dark:hover:text-coral-400 transition font-medium"
                  >
                    <FaBell className="text-sm" />
                    Notifications{unreadCount > 0 && ` (${unreadCount})`}
                  </Link>
                  {normalizedRole === 'volunteer' && (
                    <MobileNavLink to="/dashboard/volunteer" onClick={() => setIsOpen(false)}>Volunteer Desk</MobileNavLink>
                  )}
                  {user.role === 'orphanAdmin' && (
                    <MobileNavLink to="/dashboard/admin" onClick={() => setIsOpen(false)}>Dashboard</MobileNavLink>
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

export default Navbar
