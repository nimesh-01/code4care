import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FaHeart, FaBars, FaTimes } from 'react-icons/fa'
import { useAuth } from '../context/AuthContext'

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const getDashboardLink = () => {
    if (!user) return '/login'
    const dashboardRoutes = {
      user: '/dashboard/user',
      volunteer: '/dashboard/volunteer',
      admin: '/dashboard/admin',
      superadmin: '/dashboard/superadmin'
    }
    return dashboardRoutes[user.role] || '/dashboard/user'
  }

  return (
    <nav className="glass-effect fixed w-full z-50 shadow-sm">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 text-2xl font-bold text-soul-purple">
            <FaHeart className="text-soul-pink" />
            SoulConnect
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <NavLink to="/">Home</NavLink>
            <NavLink to="/about">About</NavLink>
            <NavLink to="/orphanages">Orphanages</NavLink>
            <NavLink to="/donate">Donate</NavLink>
            
            {user ? (
              <div className="flex items-center gap-4">
                <Link to={getDashboardLink()} className="text-soul-purple hover:text-soul-pink transition font-medium">
                  Dashboard
                </Link>
                <button 
                  onClick={handleLogout}
                  className="btn-secondary !py-2 !px-4 text-sm"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Link to="/login" className="text-soul-purple hover:text-soul-pink transition font-medium">
                  Login
                </Link>
                <Link to="/register" className="btn-primary !py-2 !px-4 text-sm">
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-soul-purple text-2xl"
          >
            {isOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-gray-200 pt-4">
            <div className="flex flex-col gap-4">
              <MobileNavLink to="/" onClick={() => setIsOpen(false)}>Home</MobileNavLink>
              <MobileNavLink to="/about" onClick={() => setIsOpen(false)}>About</MobileNavLink>
              <MobileNavLink to="/orphanages" onClick={() => setIsOpen(false)}>Orphanages</MobileNavLink>
              <MobileNavLink to="/donate" onClick={() => setIsOpen(false)}>Donate</MobileNavLink>
              
              {user ? (
                <>
                  <MobileNavLink to={getDashboardLink()} onClick={() => setIsOpen(false)}>Dashboard</MobileNavLink>
                  <button 
                    onClick={() => { handleLogout(); setIsOpen(false); }}
                    className="text-left text-red-500 font-medium"
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
    className="text-gray-700 hover:text-soul-purple transition font-medium"
  >
    {children}
  </Link>
)

const MobileNavLink = ({ to, children, onClick }) => (
  <Link 
    to={to} 
    onClick={onClick}
    className="text-gray-700 hover:text-soul-purple transition font-medium"
  >
    {children}
  </Link>
)

export default Navbar
