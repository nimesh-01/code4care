import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  FaHeart, FaEnvelope, FaLock, FaUser, FaUserTie, FaUserShield, 
  FaEye, FaEyeSlash, FaPhone, FaMapMarkerAlt, FaBuilding, FaIdCard
} from 'react-icons/fa'
import { toast } from 'react-toastify'
import { useAuth } from '../../context/AuthContext'

const Register = () => {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    role: 'user',
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    // Volunteer specific
    skills: '',
    availability: '',
    // Admin specific (orphanage)
    orphanageName: '',
    orphanageAddress: '',
    registrationNumber: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const roles = [
    { 
      id: 'user', 
      label: 'User', 
      icon: <FaUser className="text-3xl" />, 
      color: 'from-blue-500 to-blue-600',
      description: 'Donate, sponsor children, and support orphanages'
    },
    { 
      id: 'volunteer', 
      label: 'Volunteer', 
      icon: <FaUserTie className="text-3xl" />, 
      color: 'from-green-500 to-green-600',
      description: 'Volunteer your time and skills to help orphanages'
    },
    { 
      id: 'admin', 
      label: 'Orphanage Admin', 
      icon: <FaUserShield className="text-3xl" />, 
      color: 'from-soul-purple to-soul-pink',
      description: 'Register and manage your orphanage on the platform'
    },
  ]

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleRoleSelect = (role) => {
    setFormData({ ...formData, role })
    setStep(2)
  }

  const validateStep2 = () => {
    if (!formData.name || !formData.email || !formData.phone) {
      toast.error('Please fill in all required fields')
      return false
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error('Please enter a valid email address')
      return false
    }
    if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
      toast.error('Please enter a valid 10-digit phone number')
      return false
    }
    return true
  }

  const validateStep3 = () => {
    if (!formData.password || !formData.confirmPassword) {
      toast.error('Please fill in all password fields')
      return false
    }
    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters long')
      return false
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      return false
    }
    return true
  }

  const validateRoleSpecificFields = () => {
    if (formData.role === 'volunteer') {
      if (!formData.skills || !formData.availability) {
        toast.error('Please fill in your skills and availability')
        return false
      }
    }
    if (formData.role === 'admin') {
      if (!formData.orphanageName || !formData.orphanageAddress || !formData.registrationNumber) {
        toast.error('Please fill in all orphanage details')
        return false
      }
    }
    return true
  }

  const nextStep = () => {
    if (step === 2 && !validateStep2()) return
    if (step === 3 && !validateStep3()) return
    setStep(step + 1)
  }

  const prevStep = () => {
    setStep(step - 1)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateRoleSpecificFields()) return

    setLoading(true)
    try {
      const userData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        role: formData.role,
      }

      if (formData.role === 'volunteer') {
        userData.skills = formData.skills
        userData.availability = formData.availability
      }

      if (formData.role === 'admin') {
        userData.orphanage = {
          name: formData.orphanageName,
          address: formData.orphanageAddress,
          registrationNumber: formData.registrationNumber,
        }
      }

      const user = await register(userData)
      toast.success('Registration successful! Welcome to SoulConnect!')
      
      const dashboardRoutes = {
        user: '/dashboard/user',
        volunteer: '/dashboard/volunteer',
        admin: '/dashboard/admin',
      }
      navigate(dashboardRoutes[user.role] || '/dashboard/user')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getTotalSteps = () => {
    if (formData.role === 'user') return 3
    return 4 // volunteer and admin have extra step
  }

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-3xl font-bold text-white">
            <FaHeart className="text-white" />
            SoulConnect
          </Link>
          <p className="text-white/80 mt-2">Join our community and make a difference!</p>
        </div>

        {/* Registration Card */}
        <div className="card">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Step {step} of {getTotalSteps()}</span>
              <span className="text-sm text-soul-purple font-medium">
                {step === 1 && 'Choose Role'}
                {step === 2 && 'Basic Info'}
                {step === 3 && 'Set Password'}
                {step === 4 && 'Additional Details'}
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-soul-purple to-soul-pink transition-all duration-300"
                style={{ width: `${(step / getTotalSteps()) * 100}%` }}
              />
            </div>
          </div>

          {/* Step 1: Role Selection */}
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                How would you like to join?
              </h2>
              <div className="space-y-4">
                {roles.map((role) => (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => handleRoleSelect(role.id)}
                    className={`w-full flex items-center gap-4 p-5 rounded-xl border-2 transition-all duration-200 hover:shadow-lg ${
                      formData.role === role.id
                        ? `bg-gradient-to-r ${role.color} text-white border-transparent`
                        : 'border-gray-200 text-gray-700 hover:border-soul-purple'
                    }`}
                  >
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                      formData.role === role.id ? 'bg-white/20' : 'bg-gray-100'
                    }`}>
                      <span className={formData.role === role.id ? 'text-white' : 'text-gray-500'}>
                        {role.icon}
                      </span>
                    </div>
                    <div className="text-left">
                      <h3 className="font-bold text-lg">{role.label}</h3>
                      <p className={`text-sm ${formData.role === role.id ? 'text-white/80' : 'text-gray-500'}`}>
                        {role.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Basic Information */}
          {step === 2 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                Tell us about yourself
              </h2>
              <form className="space-y-5">
                {/* Name Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter your full name"
                      className="input-field pl-11"
                    />
                  </div>
                </div>

                {/* Email Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      className="input-field pl-11"
                    />
                  </div>
                </div>

                {/* Phone Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FaPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="Enter your phone number"
                      className="input-field pl-11"
                    />
                  </div>
                </div>

                {/* Navigation Buttons */}
                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="flex-1 btn-secondary"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={nextStep}
                    className="flex-1 btn-primary"
                  >
                    Continue
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Step 3: Password */}
          {step === 3 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                Create your password
              </h2>
              <form className="space-y-5">
                {/* Password Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Create a strong password"
                      className="input-field pl-11 pr-11"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Minimum 8 characters</p>
                </div>

                {/* Confirm Password Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm your password"
                      className="input-field pl-11 pr-11"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>

                {/* Navigation Buttons */}
                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="flex-1 btn-secondary"
                  >
                    Back
                  </button>
                  {formData.role === 'user' ? (
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={loading}
                      className="flex-1 btn-primary disabled:opacity-50"
                    >
                      {loading ? 'Creating Account...' : 'Create Account'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={nextStep}
                      className="flex-1 btn-primary"
                    >
                      Continue
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}

          {/* Step 4: Role Specific Fields */}
          {step === 4 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                {formData.role === 'volunteer' ? 'Volunteer Details' : 'Orphanage Details'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-5">
                {formData.role === 'volunteer' && (
                  <>
                    {/* Skills Field */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Skills & Expertise <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        name="skills"
                        value={formData.skills}
                        onChange={handleChange}
                        placeholder="E.g., Teaching, Medical Care, Sports Coaching, Music, Art..."
                        rows="3"
                        className="input-field resize-none"
                      />
                    </div>

                    {/* Availability Field */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Availability <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="availability"
                        value={formData.availability}
                        onChange={handleChange}
                        className="input-field"
                      >
                        <option value="">Select your availability</option>
                        <option value="weekdays">Weekdays Only</option>
                        <option value="weekends">Weekends Only</option>
                        <option value="both">Both Weekdays & Weekends</option>
                        <option value="flexible">Flexible</option>
                      </select>
                    </div>
                  </>
                )}

                {formData.role === 'admin' && (
                  <>
                    {/* Orphanage Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Orphanage Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <FaBuilding className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          name="orphanageName"
                          value={formData.orphanageName}
                          onChange={handleChange}
                          placeholder="Enter orphanage name"
                          className="input-field pl-11"
                        />
                      </div>
                    </div>

                    {/* Orphanage Address */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Address <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <FaMapMarkerAlt className="absolute left-4 top-4 text-gray-400" />
                        <textarea
                          name="orphanageAddress"
                          value={formData.orphanageAddress}
                          onChange={handleChange}
                          placeholder="Enter full address"
                          rows="2"
                          className="input-field pl-11 resize-none"
                        />
                      </div>
                    </div>

                    {/* Registration Number */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Registration Number <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <FaIdCard className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          name="registrationNumber"
                          value={formData.registrationNumber}
                          onChange={handleChange}
                          placeholder="Enter registration/license number"
                          className="input-field pl-11"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Navigation Buttons */}
                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="flex-1 btn-secondary"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Creating Account...
                      </span>
                    ) : (
                      'Create Account'
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Login Link */}
          <p className="mt-6 text-center text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-soul-purple hover:text-soul-pink font-medium transition">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Register
