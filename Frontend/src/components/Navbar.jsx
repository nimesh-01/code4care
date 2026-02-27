import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FaHeart, FaBars, FaTimes, FaSun, FaMoon, FaUserCircle } from 'react-icons/fa'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false)
  const { user, logout } = useAuth()
  const { isDarkMode, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <nav className="fixed w-full z-50 bg-cream-50/95 dark:bg-dark-900/95 backdrop-blur-md shadow-sm border-b border-cream-200 dark:border-dark-700 transition-colors duration-300">
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
            <NavLink to="/about">About</NavLink>
            {user?.role !== 'orphanAdmin' && (
              <>
                <NavLink to="/children">Children</NavLink>
                <NavLink to="/orphanages">Orphanages</NavLink>
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
                <Link to="/profile" className="flex items-center gap-2 text-teal-700 dark:text-teal-400 hover:text-coral-500 dark:hover:text-coral-400 transition font-medium">
                  <FaUserCircle className="text-xl" />
                  <span>Profile</span>
                </Link>
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
              <MobileNavLink to="/about" onClick={() => setIsOpen(false)}>About</MobileNavLink>
              {user?.role !== 'orphanAdmin' && (
                <>
                  <MobileNavLink to="/children" onClick={() => setIsOpen(false)}>Children</MobileNavLink>
                  <MobileNavLink to="/orphanages" onClick={() => setIsOpen(false)}>Orphanages</MobileNavLink>
                  <MobileNavLink to="/donate" onClick={() => setIsOpen(false)}>Donate</MobileNavLink>
                </>
              )}
              
              {user ? (
                <>
                  <MobileNavLink to="/profile" onClick={() => setIsOpen(false)}>Profile</MobileNavLink>
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
