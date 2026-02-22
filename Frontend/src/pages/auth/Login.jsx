import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FaHeart, FaEnvelope, FaLock, FaEye, FaEyeSlash, FaSun, FaMoon, FaClock, FaBan, FaTimesCircle } from 'react-icons/fa'
import { toast } from 'react-toastify'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'

const Login = () => {
  const [formData, setFormData] = useState({
    emailOrUsername: '',
    password: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [statusInfo, setStatusInfo] = useState(null)
  const { login } = useAuth()
  const { isDarkMode, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    if (statusInfo) setStatusInfo(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatusInfo(null)
    
    if (!formData.emailOrUsername || !formData.password) {
      toast.error('Please fill in all fields')
      return
    }

    setLoading(true)
    try {
      // Determine if input is email or username
      const isEmail = formData.emailOrUsername.includes('@')
      const credentials = isEmail 
        ? { email: formData.emailOrUsername, password: formData.password }
        : { username: formData.emailOrUsername, password: formData.password }

      const user = await login(credentials)
      toast.success(`Welcome back, ${user.fullname || user.username || 'User'}!`)
      
      // Redirect based on role from backend
      const dashboardRoutes = {
        user: '/dashboard/user',
        volunteer: '/dashboard/volunteer',
        orphanAdmin: '/dashboard/admin',
        superAdmin: '/dashboard/superadmin'
      }
      navigate(dashboardRoutes[user.role] || '/dashboard/user')
    } catch (error) {
      const errorData = error.response?.data
      
      // Handle orphanage status-specific errors
      if (errorData?.status && ['pending', 'rejected', 'blocked'].includes(errorData.status)) {
        setStatusInfo({
          status: errorData.status,
          message: errorData.message,
          orphanageName: errorData.orphanageName,
          verificationNote: errorData.verificationNote
        })
      } else {
        toast.error(errorData?.message || 'Login failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = () => {
    switch (statusInfo?.status) {
      case 'pending': return <FaClock className="text-4xl text-amber-500" />
      case 'rejected': return <FaTimesCircle className="text-4xl text-red-500" />
      case 'blocked': return <FaBan className="text-4xl text-red-600" />
      default: return null
    }
  }

  const getStatusColor = () => {
    switch (statusInfo?.status) {
      case 'pending': return 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
      case 'rejected': return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
      case 'blocked': return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
      default: return ''
    }
  }

  const getStatusTitle = () => {
    switch (statusInfo?.status) {
      case 'pending': return 'Registration Under Review'
      case 'rejected': return 'Registration Rejected'
      case 'blocked': return 'Account Blocked'
      default: return ''
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-coral-400 via-coral-500 to-teal-500 dark:from-dark-900 dark:via-dark-800 dark:to-dark-900 flex items-center justify-center px-4 py-12 transition-colors duration-300">
      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="fixed top-6 right-6 p-3 rounded-full bg-white/20 dark:bg-dark-700/50 text-white hover:bg-white/30 dark:hover:bg-dark-600/50 transition-all duration-300 backdrop-blur-sm"
        aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {isDarkMode ? <FaSun className="w-5 h-5" /> : <FaMoon className="w-5 h-5" />}
      </button>

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-3xl font-playfair font-bold text-white">
            <FaHeart className="text-white" />
            SoulConnect
          </Link>
          <p className="text-white/80 mt-2">Welcome back! Please login to continue.</p>
        </div>

        {/* Login Card */}
        <div className="bg-white dark:bg-dark-800 rounded-2xl p-8 shadow-2xl transition-colors duration-300">
          <h2 className="text-2xl font-playfair font-bold text-teal-900 dark:text-cream-50 mb-6 text-center">Login</h2>

          {/* Status Info Display */}
          {statusInfo && (
            <div className={`mb-6 p-4 rounded-xl border-2 ${getStatusColor()}`}>
              <div className="flex flex-col items-center text-center gap-3">
                {getStatusIcon()}
                <h3 className="font-bold text-lg text-teal-900 dark:text-cream-50">
                  {getStatusTitle()}
                </h3>
                {statusInfo.orphanageName && (
                  <p className="text-sm text-teal-600 dark:text-cream-300">
                    Orphanage: <strong>{statusInfo.orphanageName}</strong>
                  </p>
                )}
                <p className="text-sm text-teal-700 dark:text-cream-200">
                  {statusInfo.message}
                </p>
                {statusInfo.verificationNote && statusInfo.status !== 'pending' && (
                  <div className="mt-2 p-3 bg-white/50 dark:bg-dark-700/50 rounded-lg w-full">
                    <p className="text-xs text-teal-600 dark:text-cream-400 font-medium mb-1">Reason:</p>
                    <p className="text-sm text-teal-800 dark:text-cream-100">{statusInfo.verificationNote}</p>
                  </div>
                )}
                {statusInfo.status === 'pending' && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                    Our team is reviewing your documents. You will receive an email once approved.
                  </p>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email/Username Field */}
            <div>
              <label className="block text-sm font-medium text-teal-800 dark:text-cream-100 mb-2">
                Email or Username
              </label>
              <div className="relative">
                <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-coral-400 dark:text-coral-500" />
                <input
                  type="text"
                  name="emailOrUsername"
                  value={formData.emailOrUsername}
                  onChange={handleChange}
                  placeholder="you@example.com or username"
                  className="w-full pl-11 pr-4 py-3 bg-cream-50 dark:bg-dark-700 border border-cream-200 dark:border-dark-600 rounded-xl text-teal-900 dark:text-cream-50 placeholder-teal-400 dark:placeholder-cream-300/50 focus:outline-none focus:ring-2 focus:ring-coral-400 dark:focus:ring-coral-500 focus:border-transparent transition-all duration-300"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-teal-800 dark:text-cream-100 mb-2">
                Password
              </label>
              <div className="relative">
                <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-coral-400 dark:text-coral-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className="w-full pl-11 pr-11 py-3 bg-cream-50 dark:bg-dark-700 border border-cream-200 dark:border-dark-600 rounded-xl text-teal-900 dark:text-cream-50 placeholder-teal-400 dark:placeholder-cream-300/50 focus:outline-none focus:ring-2 focus:ring-coral-400 dark:focus:ring-coral-500 focus:border-transparent transition-all duration-300"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-teal-400 dark:text-cream-300 hover:text-coral-500 dark:hover:text-coral-400 transition"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            {/* Remember & Forgot */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded text-coral-500 focus:ring-coral-400 border-cream-300 dark:border-dark-600" />
                <span className="text-teal-700 dark:text-cream-200">Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-coral-500 dark:text-coral-400 hover:text-coral-600 dark:hover:text-coral-300 transition">
                Forgot Password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-coral-500 hover:bg-coral-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Logging in...
                </span>
              ) : (
                'Login'
              )}
            </button>
          </form>

          {/* Register Link */}
          <p className="mt-6 text-center text-teal-700 dark:text-cream-200">
            Don't have an account?{' '}
            <Link to="/register" className="text-coral-500 dark:text-coral-400 hover:text-coral-600 dark:hover:text-coral-300 font-medium transition">
              Register Now
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
