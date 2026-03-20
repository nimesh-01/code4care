import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { FaHeart, FaLock, FaEye, FaEyeSlash, FaMagic } from 'react-icons/fa'
import { toast } from 'react-toastify'
import { useAuth } from '../../context/AuthContext'
import { ScrollReveal } from '../../hooks/useScrollReveal'

const ResetPassword = () => {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const navigate = useNavigate()
  const { resetPassword } = useAuth()
  
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!token) {
      toast.error('Invalid password reset link')
      navigate('/forgot-password')
    }
  }, [token, navigate])

  const generatePassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+'
    let password = ''
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setNewPassword(password)
    setConfirmPassword(password)
    setShowPassword(true)
    toast.info('Strong password generated! Please save it safely.')
  }

  const validatePassword = (password) => {
    const minLength = 8
    const hasUpperCase = /[A-Z]/.test(password)
    const hasLowerCase = /[a-z]/.test(password)
    const hasNumbers = /\d/.test(password)
    const hasSpecialChar = /[!@#$%^&*()_+]/.test(password)
    return password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!newPassword || !confirmPassword) {
      toast.error('Please fill in all fields')
      return
    }

    if (!validatePassword(newPassword)) {
      toast.error('Password must contain at least 8 characters, including uppercase, lowercase, numbers and special characters')
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      await resetPassword(token, newPassword)
      setSuccess(true)
      toast.success('Password reset successfully! Redirecting to login...')
      setTimeout(() => {
        navigate('/login')
      }, 3000)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reset password. Link may be expired.')
    } finally {
      setLoading(false)
    }
  }

  const generateStrongPassword = () => {
    const length = 12
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+"
    let retVal = ""
    for (let i = 0, n = charset.length; i < length; ++i) {
        retVal += charset.charAt(Math.floor(Math.random() * n))
    }
    setNewPassword(retVal)
    setConfirmPassword(retVal)
    // Make visible briefly so user can copy it
    setNewPassword(retVal)
    setConfirmPassword(retVal)
    setShowPassword(true) // Show the password
    
    // Copy to clipboard
    navigator.clipboard.writeText(retVal)
      .then(() => toast.success("Strong password generated and copied to clipboard!"))
      .catch(() => toast.success("Strong password generated!"))
  }

  if (success) {
      return (
        <div className="min-h-screen gradient-bg flex items-center justify-center px-4 py-12">
        <ScrollReveal animation="fade-up">
        <div className="card w-full max-w-md text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Password Reset!</h2>
            <p className="text-gray-600 mb-6">
            Your password has been successfully reset. You can now login with your new password.
            </p>
            <Link to="/login" className="btn-primary inline-block w-full">
            Go to Login
            </Link>
        </div>
        </ScrollReveal>
        </div>
      )
  }

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <ScrollReveal animation="fade-down">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-3xl font-bold text-white">
            <FaHeart className="text-white" />
            SoulConnect
          </Link>
        </div>
        </ScrollReveal>

        {/* Card */}
        <ScrollReveal animation="fade-up" delay={200}>
        <div className="card">
          <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">
            Reset Password
          </h2>
          <p className="text-gray-600 text-center mb-6">
            Enter your new password below.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input-field pl-11 pr-11"
                  placeholder="At least 6 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              <button
                type="button"
                onClick={generateStrongPassword}
                className="text-xs text-blue-600 hover:text-blue-800 mt-1 flex items-center gap-1"
              >
                <FaMagic /> Generate Strong Password
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-field pl-11 pr-11"
                  placeholder="Confirm new password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Resetting...
                </span>
              ) : (
                'Reset Password'
              )}
            </button>
          </form>
        </div>
        </ScrollReveal>
      </div>
    </div>
  )
}

export default ResetPassword