import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  FaHeart, FaEnvelope, FaLock, FaUser, FaUserTie, FaUserShield, 
  FaEye, FaEyeSlash, FaPhone, FaMapMarkerAlt, FaBuilding, FaIdCard, FaSun, FaMoon,
  FaFileAlt, FaUpload, FaTimesCircle, FaGlobe, FaPlus
} from 'react-icons/fa'
import { toast } from 'react-toastify'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import api from '../../services/api'

const Register = () => {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    role: 'user',
    username: '',
    firstname: '',
    lastname: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    // Admin specific (orphanage)
    orphanageName: '',
    orphanageEmail: '',
    orphanagePhone: '',
    orphanageWebsite: '',
    orphanageDescription: '',
    orphanageAddress: '',
    orphanageCity: '',
    orphanageState: '',
    orphanagePincode: '',
    orphanageCountry: 'India',
    registrationNumber: '',
    totalChildren: '',
    establishedYear: '',
  })
  const [documents, setDocuments] = useState({
    registrationCertificate: null,
    governmentLicense: null,
    otherDocuments: [],
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const { isDarkMode, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const roles = [
    { 
      id: 'user', 
      label: 'User', 
      icon: <FaUser className="text-3xl" />, 
      color: 'from-teal-500 to-teal-600',
      description: 'Donate, sponsor children, and support orphanages'
    },
    { 
      id: 'volunteer', 
      label: 'Volunteer', 
      icon: <FaUserTie className="text-3xl" />, 
      color: 'from-coral-400 to-coral-500',
      description: 'Volunteer your time and skills to help orphanages'
    },
    { 
      id: 'orphanAdmin', 
      label: 'Orphanage Admin', 
      icon: <FaUserShield className="text-3xl" />, 
      color: 'from-coral-500 to-teal-500',
      description: 'Register and manage your orphanage on the platform'
    },
  ]

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleFileChange = (e, fieldName) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('File size must be less than 5MB')
        return
      }
      setDocuments({ ...documents, [fieldName]: file })
    }
  }

  const handleOtherDocumentChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('File size must be less than 5MB')
        return
      }
      if (documents.otherDocuments.length >= 5) {
        toast.error('Maximum 5 additional documents allowed')
        return
      }
      setDocuments({ 
        ...documents, 
        otherDocuments: [...documents.otherDocuments, { file, name: file.name }] 
      })
    }
  }

  const removeFile = (fieldName) => {
    setDocuments({ ...documents, [fieldName]: null })
  }

  const removeOtherDocument = (index) => {
    setDocuments({ 
      ...documents, 
      otherDocuments: documents.otherDocuments.filter((_, i) => i !== index) 
    })
  }

  const handleRoleSelect = (role) => {
    setFormData({ ...formData, role })
    setStep(2)
  }

  const validateStep2 = () => {
    if (!formData.username || !formData.firstname || !formData.email) {
      toast.error('Please fill in all required fields')
      return false
    }
    if (formData.username.length < 3) {
      toast.error('Username must be at least 3 characters')
      return false
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error('Please enter a valid email address')
      return false
    }
    if (formData.role === 'orphanAdmin' && !formData.phone) {
      toast.error('Phone number is required for orphanage admins')
      return false
    }
    return true
  }

  const validateStep3 = () => {
    if (!formData.password || !formData.confirmPassword) {
      toast.error('Please fill in all password fields')
      return false
    }
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters long')
      return false
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      return false
    }
    return true
  }

  const validateRoleSpecificFields = () => {
    if (formData.role === 'orphanAdmin') {
      if (!formData.orphanageName || !formData.orphanageAddress || !formData.registrationNumber) {
        toast.error('Please fill in all required orphanage details')
        return false
      }
      if (!formData.orphanageEmail) {
        toast.error('Orphanage email is required')
        return false
      }
      if (!formData.orphanagePhone) {
        toast.error('Orphanage phone number is required')
        return false
      }
      if (!formData.orphanageCity || !formData.orphanageState) {
        toast.error('City and State are required')
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
      // Format data for backend API
      const userData = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        fullname: {
          firstname: formData.firstname,
          lastname: formData.lastname || ''
        },
        role: formData.role,
      }

      // Add phone for volunteer and admin
      if (formData.phone) {
        userData.phone = formData.phone
      }

      // Add orphanage data for orphanAdmin
      if (formData.role === 'orphanAdmin') {
        userData.orphanage = {
          name: formData.orphanageName,
          registrationNumber: formData.registrationNumber,
          orphanage_mail: formData.orphanageEmail,
          orphanage_phone: formData.orphanagePhone,
          address: {
            street: formData.orphanageAddress,
            city: formData.orphanageCity,
            state: formData.orphanageState,
            pincode: formData.orphanagePincode,
            country: formData.orphanageCountry,
          }
        }
      }

      const result = await register(userData)
      const user = result.user
      const orphanage = result.orphanage
      
      // Upload documents if orphanAdmin and documents are selected
      if (formData.role === 'orphanAdmin' && orphanage?.id) {
        const orphanageId = orphanage.id
        const uploadPromises = []
        
        // Upload registration certificate using public endpoint
        if (documents.registrationCertificate) {
          uploadPromises.push(
            api.post(`/auth/orphanage/${orphanageId}/document`, (() => {
              const fd = new FormData()
              fd.append('document', documents.registrationCertificate)
              fd.append('field', 'registrationCertificate')
              return fd
            })(), {
              headers: { 'Content-Type': 'multipart/form-data' }
            }).catch(err => console.error('Failed to upload registration certificate:', err))
          )
        }
        
        // Upload government license using public endpoint
        if (documents.governmentLicense) {
          uploadPromises.push(
            api.post(`/auth/orphanage/${orphanageId}/document`, (() => {
              const fd = new FormData()
              fd.append('document', documents.governmentLicense)
              fd.append('field', 'governmentLicense')
              return fd
            })(), {
              headers: { 'Content-Type': 'multipart/form-data' }
            }).catch(err => console.error('Failed to upload government license:', err))
          )
        }
        
        // Upload other documents using public endpoint
        for (const doc of documents.otherDocuments) {
          uploadPromises.push(
            api.post(`/auth/orphanage/${orphanageId}/document`, (() => {
              const fd = new FormData()
              fd.append('document', doc.file)
              fd.append('field', 'otherDocuments')
              fd.append('name', doc.name)
              return fd
            })(), {
              headers: { 'Content-Type': 'multipart/form-data' }
            }).catch(err => console.error('Failed to upload document:', err))
          )
        }
        
        // Wait for all uploads to complete (don't block registration success)
        if (uploadPromises.length > 0) {
          await Promise.allSettled(uploadPromises)
        }
      }
      
      // Handle different registration outcomes
      if (result.isPending) {
        // OrphanAdmin registration - show pending message and redirect to login
        toast.success(result.message || 'Registration successful! Your orphanage is under review.')
        navigate('/login')
      } else {
        // Regular user/volunteer registration - redirect based on role
        toast.success('Registration successful! Welcome to SoulConnect!')
        const destination = newUser.role === 'orphanAdmin' ? '/dashboard/admin' : '/'
        navigate(destination)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getTotalSteps = () => {
    if (formData.role === 'user' || formData.role === 'volunteer') return 3
    return 5 // admin has extra steps for orphanage details and documents
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-coral-400 via-coral-500 to-teal-500 dark:from-dark-900 dark:via-dark-800 dark:to-dark-900 flex items-center justify-center px-4 py-12 transition-colors duration-300">
      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="fixed top-6 right-6 p-3 rounded-full bg-white/20 dark:bg-dark-700/50 text-white hover:bg-white/30 dark:hover:bg-dark-600/50 transition-all duration-300 backdrop-blur-sm z-50"
        aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {isDarkMode ? <FaSun className="w-5 h-5" /> : <FaMoon className="w-5 h-5" />}
      </button>

      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-3xl font-playfair font-bold text-white">
            <FaHeart className="text-white" />
            SoulConnect
          </Link>
          <p className="text-white/80 mt-2">Join our community and make a difference!</p>
        </div>

        {/* Registration Card */}
        <div className="bg-white dark:bg-dark-800 rounded-2xl p-8 shadow-2xl transition-colors duration-300">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-teal-700 dark:text-cream-200">Step {step} of {getTotalSteps()}</span>
              <span className="text-sm text-coral-500 dark:text-coral-400 font-medium">
                {step === 1 && 'Choose Role'}
                {step === 2 && 'Basic Info'}
                {step === 3 && 'Set Password'}
                {step === 4 && 'Orphanage Info'}
                {step === 5 && 'Documents'}
              </span>
            </div>
            <div className="h-2 bg-cream-100 dark:bg-dark-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-coral-400 to-coral-600 dark:from-coral-500 dark:to-coral-400 transition-all duration-300"
                style={{ width: `${(step / getTotalSteps()) * 100}%` }}
              />
            </div>
          </div>

          {/* Step 1: Role Selection */}
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-playfair font-bold text-teal-900 dark:text-cream-50 mb-6 text-center">
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
                        : 'border-cream-200 dark:border-dark-600 text-teal-800 dark:text-cream-100 hover:border-coral-400 dark:hover:border-coral-500'
                    }`}
                  >
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                      formData.role === role.id ? 'bg-white/20' : 'bg-cream-100 dark:bg-dark-700'
                    }`}>
                      <span className={formData.role === role.id ? 'text-white' : 'text-coral-500 dark:text-coral-400'}>
                        {role.icon}
                      </span>
                    </div>
                    <div className="text-left">
                      <h3 className="font-bold text-lg">{role.label}</h3>
                      <p className={`text-sm ${formData.role === role.id ? 'text-white/80' : 'text-teal-600 dark:text-cream-200'}`}>
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
              <h2 className="text-2xl font-playfair font-bold text-teal-900 dark:text-cream-50 mb-6 text-center">
                Tell us about yourself
              </h2>
              <form className="space-y-5">
                {/* Username Field */}
                <div>
                  <label className="block text-sm font-medium text-teal-800 dark:text-cream-100 mb-2">
                    Username <span className="text-coral-500">*</span>
                  </label>
                  <div className="relative">
                    <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-coral-400 dark:text-coral-500" />
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      placeholder="Choose a unique username"
                      className="w-full pl-11 pr-4 py-3 bg-cream-50 dark:bg-dark-700 border border-cream-200 dark:border-dark-600 rounded-xl text-teal-900 dark:text-cream-50 placeholder-teal-400 dark:placeholder-cream-300/50 focus:outline-none focus:ring-2 focus:ring-coral-400 dark:focus:ring-coral-500 focus:border-transparent transition-all duration-300"
                    />
                  </div>
                </div>

                {/* Name Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-teal-800 dark:text-cream-100 mb-2">
                      First Name <span className="text-coral-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="firstname"
                      value={formData.firstname}
                      onChange={handleChange}
                      placeholder="First name"
                      className="w-full px-4 py-3 bg-cream-50 dark:bg-dark-700 border border-cream-200 dark:border-dark-600 rounded-xl text-teal-900 dark:text-cream-50 placeholder-teal-400 dark:placeholder-cream-300/50 focus:outline-none focus:ring-2 focus:ring-coral-400 dark:focus:ring-coral-500 focus:border-transparent transition-all duration-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-teal-800 dark:text-cream-100 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="lastname"
                      value={formData.lastname}
                      onChange={handleChange}
                      placeholder="Last name"
                      className="w-full px-4 py-3 bg-cream-50 dark:bg-dark-700 border border-cream-200 dark:border-dark-600 rounded-xl text-teal-900 dark:text-cream-50 placeholder-teal-400 dark:placeholder-cream-300/50 focus:outline-none focus:ring-2 focus:ring-coral-400 dark:focus:ring-coral-500 focus:border-transparent transition-all duration-300"
                    />
                  </div>
                </div>

                {/* Email Field */}
                <div>
                  <label className="block text-sm font-medium text-teal-800 dark:text-cream-100 mb-2">
                    Email Address <span className="text-coral-500">*</span>
                  </label>
                  <div className="relative">
                    <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-coral-400 dark:text-coral-500" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      className="w-full pl-11 pr-4 py-3 bg-cream-50 dark:bg-dark-700 border border-cream-200 dark:border-dark-600 rounded-xl text-teal-900 dark:text-cream-50 placeholder-teal-400 dark:placeholder-cream-300/50 focus:outline-none focus:ring-2 focus:ring-coral-400 dark:focus:ring-coral-500 focus:border-transparent transition-all duration-300"
                    />
                  </div>
                </div>

                {/* Phone Field */}
                <div>
                  <label className="block text-sm font-medium text-teal-800 dark:text-cream-100 mb-2">
                    Phone Number {formData.role === 'orphanAdmin' && <span className="text-coral-500">*</span>}
                  </label>
                  <div className="relative">
                    <FaPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-coral-400 dark:text-coral-500" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="Enter your phone number"
                      className="w-full pl-11 pr-4 py-3 bg-cream-50 dark:bg-dark-700 border border-cream-200 dark:border-dark-600 rounded-xl text-teal-900 dark:text-cream-50 placeholder-teal-400 dark:placeholder-cream-300/50 focus:outline-none focus:ring-2 focus:ring-coral-400 dark:focus:ring-coral-500 focus:border-transparent transition-all duration-300"
                    />
                  </div>
                </div>

                {/* Navigation Buttons */}
                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="flex-1 py-3 border-2 border-teal-600 dark:border-teal-400 text-teal-600 dark:text-teal-400 font-semibold rounded-xl hover:bg-teal-600 hover:text-white dark:hover:bg-teal-400 dark:hover:text-dark-900 transition-all duration-300"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={nextStep}
                    className="flex-1 py-3 bg-coral-500 hover:bg-coral-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
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
              <h2 className="text-2xl font-playfair font-bold text-teal-900 dark:text-cream-50 mb-6 text-center">
                Create your password
              </h2>
              <form className="space-y-5">
                {/* Password Field */}
                <div>
                  <label className="block text-sm font-medium text-teal-800 dark:text-cream-100 mb-2">
                    Password <span className="text-coral-500">*</span>
                  </label>
                  <div className="relative">
                    <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-coral-400 dark:text-coral-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Create a strong password"
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
                  <p className="text-xs text-teal-600 dark:text-cream-300 mt-1">Minimum 6 characters</p>
                </div>

                {/* Confirm Password Field */}
                <div>
                  <label className="block text-sm font-medium text-teal-800 dark:text-cream-100 mb-2">
                    Confirm Password <span className="text-coral-500">*</span>
                  </label>
                  <div className="relative">
                    <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-coral-400 dark:text-coral-500" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm your password"
                      className="w-full pl-11 pr-11 py-3 bg-cream-50 dark:bg-dark-700 border border-cream-200 dark:border-dark-600 rounded-xl text-teal-900 dark:text-cream-50 placeholder-teal-400 dark:placeholder-cream-300/50 focus:outline-none focus:ring-2 focus:ring-coral-400 dark:focus:ring-coral-500 focus:border-transparent transition-all duration-300"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-teal-400 dark:text-cream-300 hover:text-coral-500 dark:hover:text-coral-400 transition"
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
                    className="flex-1 py-3 border-2 border-teal-600 dark:border-teal-400 text-teal-600 dark:text-teal-400 font-semibold rounded-xl hover:bg-teal-600 hover:text-white dark:hover:bg-teal-400 dark:hover:text-dark-900 transition-all duration-300"
                  >
                    Back
                  </button>
                  {formData.role === 'orphanAdmin' ? (
                    <button
                      type="button"
                      onClick={nextStep}
                      className="flex-1 py-3 bg-coral-500 hover:bg-coral-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      Continue
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={loading}
                      className="flex-1 py-3 bg-coral-500 hover:bg-coral-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
                    >
                      {loading ? 'Creating Account...' : 'Create Account'}
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}

          {/* Step 4: Orphanage Details (for orphanAdmin only) */}
          {step === 4 && formData.role === 'orphanAdmin' && (
            <div className="max-h-[60vh] overflow-y-auto pr-2">
              <h2 className="text-2xl font-playfair font-bold text-teal-900 dark:text-cream-50 mb-6 text-center">
                Orphanage Information
              </h2>
              <form className="space-y-5">
                {/* Orphanage Name */}
                <div>
                  <label className="block text-sm font-medium text-teal-800 dark:text-cream-100 mb-2">
                    Orphanage Name <span className="text-coral-500">*</span>
                  </label>
                  <div className="relative">
                    <FaBuilding className="absolute left-4 top-1/2 -translate-y-1/2 text-coral-400 dark:text-coral-500" />
                    <input
                      type="text"
                      name="orphanageName"
                      value={formData.orphanageName}
                      onChange={handleChange}
                      placeholder="Enter orphanage name"
                      className="w-full pl-11 pr-4 py-3 bg-cream-50 dark:bg-dark-700 border border-cream-200 dark:border-dark-600 rounded-xl text-teal-900 dark:text-cream-50 placeholder-teal-400 dark:placeholder-cream-300/50 focus:outline-none focus:ring-2 focus:ring-coral-400 dark:focus:ring-coral-500 focus:border-transparent transition-all duration-300"
                    />
                  </div>
                </div>

                {/* Registration Number */}
                <div>
                  <label className="block text-sm font-medium text-teal-800 dark:text-cream-100 mb-2">
                    Registration Number <span className="text-coral-500">*</span>
                  </label>
                  <div className="relative">
                    <FaIdCard className="absolute left-4 top-1/2 -translate-y-1/2 text-coral-400 dark:text-coral-500" />
                    <input
                      type="text"
                      name="registrationNumber"
                      value={formData.registrationNumber}
                      onChange={handleChange}
                      placeholder="Enter registration/license number"
                      className="w-full pl-11 pr-4 py-3 bg-cream-50 dark:bg-dark-700 border border-cream-200 dark:border-dark-600 rounded-xl text-teal-900 dark:text-cream-50 placeholder-teal-400 dark:placeholder-cream-300/50 focus:outline-none focus:ring-2 focus:ring-coral-400 dark:focus:ring-coral-500 focus:border-transparent transition-all duration-300"
                    />
                  </div>
                </div>

                {/* Orphanage Email and Phone */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-teal-800 dark:text-cream-100 mb-2">
                      Orphanage Email <span className="text-coral-500">*</span>
                    </label>
                    <div className="relative">
                      <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-coral-400 dark:text-coral-500" />
                      <input
                        type="email"
                        name="orphanageEmail"
                        value={formData.orphanageEmail}
                        onChange={handleChange}
                        placeholder="orphanage@email.com"
                        className="w-full pl-11 pr-4 py-3 bg-cream-50 dark:bg-dark-700 border border-cream-200 dark:border-dark-600 rounded-xl text-teal-900 dark:text-cream-50 placeholder-teal-400 dark:placeholder-cream-300/50 focus:outline-none focus:ring-2 focus:ring-coral-400 dark:focus:ring-coral-500 focus:border-transparent transition-all duration-300"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-teal-800 dark:text-cream-100 mb-2">
                      Orphanage Phone <span className="text-coral-500">*</span>
                    </label>
                    <div className="relative">
                      <FaPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-coral-400 dark:text-coral-500" />
                      <input
                        type="tel"
                        name="orphanagePhone"
                        value={formData.orphanagePhone}
                        onChange={handleChange}
                        placeholder="+91 XXXXX XXXXX"
                        className="w-full pl-11 pr-4 py-3 bg-cream-50 dark:bg-dark-700 border border-cream-200 dark:border-dark-600 rounded-xl text-teal-900 dark:text-cream-50 placeholder-teal-400 dark:placeholder-cream-300/50 focus:outline-none focus:ring-2 focus:ring-coral-400 dark:focus:ring-coral-500 focus:border-transparent transition-all duration-300"
                      />
                    </div>
                  </div>
                </div>

                {/* Website (optional) */}
                <div>
                  <label className="block text-sm font-medium text-teal-800 dark:text-cream-100 mb-2">
                    Website (Optional)
                  </label>
                  <div className="relative">
                    <FaGlobe className="absolute left-4 top-1/2 -translate-y-1/2 text-coral-400 dark:text-coral-500" />
                    <input
                      type="url"
                      name="orphanageWebsite"
                      value={formData.orphanageWebsite}
                      onChange={handleChange}
                      placeholder="https://www.example.com"
                      className="w-full pl-11 pr-4 py-3 bg-cream-50 dark:bg-dark-700 border border-cream-200 dark:border-dark-600 rounded-xl text-teal-900 dark:text-cream-50 placeholder-teal-400 dark:placeholder-cream-300/50 focus:outline-none focus:ring-2 focus:ring-coral-400 dark:focus:ring-coral-500 focus:border-transparent transition-all duration-300"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-teal-800 dark:text-cream-100 mb-2">
                    About Orphanage
                  </label>
                  <textarea
                    name="orphanageDescription"
                    value={formData.orphanageDescription}
                    onChange={handleChange}
                    placeholder="Briefly describe your orphanage, its mission, and the children you support..."
                    rows="3"
                    className="w-full px-4 py-3 bg-cream-50 dark:bg-dark-700 border border-cream-200 dark:border-dark-600 rounded-xl text-teal-900 dark:text-cream-50 placeholder-teal-400 dark:placeholder-cream-300/50 focus:outline-none focus:ring-2 focus:ring-coral-400 dark:focus:ring-coral-500 focus:border-transparent transition-all duration-300 resize-none"
                  />
                </div>

                {/* Established Year and Total Children */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-teal-800 dark:text-cream-100 mb-2">
                      Established Year
                    </label>
                    <input
                      type="number"
                      name="establishedYear"
                      value={formData.establishedYear}
                      onChange={handleChange}
                      placeholder="e.g., 2010"
                      min="1900"
                      max={new Date().getFullYear()}
                      className="w-full px-4 py-3 bg-cream-50 dark:bg-dark-700 border border-cream-200 dark:border-dark-600 rounded-xl text-teal-900 dark:text-cream-50 placeholder-teal-400 dark:placeholder-cream-300/50 focus:outline-none focus:ring-2 focus:ring-coral-400 dark:focus:ring-coral-500 focus:border-transparent transition-all duration-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-teal-800 dark:text-cream-100 mb-2">
                      Total Children
                    </label>
                    <input
                      type="number"
                      name="totalChildren"
                      value={formData.totalChildren}
                      onChange={handleChange}
                      placeholder="e.g., 50"
                      min="0"
                      className="w-full px-4 py-3 bg-cream-50 dark:bg-dark-700 border border-cream-200 dark:border-dark-600 rounded-xl text-teal-900 dark:text-cream-50 placeholder-teal-400 dark:placeholder-cream-300/50 focus:outline-none focus:ring-2 focus:ring-coral-400 dark:focus:ring-coral-500 focus:border-transparent transition-all duration-300"
                    />
                  </div>
                </div>

                {/* Orphanage Address */}
                <div>
                  <label className="block text-sm font-medium text-teal-800 dark:text-cream-100 mb-2">
                    Street Address <span className="text-coral-500">*</span>
                  </label>
                  <div className="relative">
                    <FaMapMarkerAlt className="absolute left-4 top-4 text-coral-400 dark:text-coral-500" />
                    <textarea
                      name="orphanageAddress"
                      value={formData.orphanageAddress}
                      onChange={handleChange}
                      placeholder="Enter street address"
                      rows="2"
                      className="w-full pl-11 pr-4 py-3 bg-cream-50 dark:bg-dark-700 border border-cream-200 dark:border-dark-600 rounded-xl text-teal-900 dark:text-cream-50 placeholder-teal-400 dark:placeholder-cream-300/50 focus:outline-none focus:ring-2 focus:ring-coral-400 dark:focus:ring-coral-500 focus:border-transparent transition-all duration-300 resize-none"
                    />
                  </div>
                </div>

                {/* City and State */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-teal-800 dark:text-cream-100 mb-2">
                      City <span className="text-coral-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="orphanageCity"
                      value={formData.orphanageCity}
                      onChange={handleChange}
                      placeholder="City"
                      className="w-full px-4 py-3 bg-cream-50 dark:bg-dark-700 border border-cream-200 dark:border-dark-600 rounded-xl text-teal-900 dark:text-cream-50 placeholder-teal-400 dark:placeholder-cream-300/50 focus:outline-none focus:ring-2 focus:ring-coral-400 dark:focus:ring-coral-500 focus:border-transparent transition-all duration-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-teal-800 dark:text-cream-100 mb-2">
                      State <span className="text-coral-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="orphanageState"
                      value={formData.orphanageState}
                      onChange={handleChange}
                      placeholder="State"
                      className="w-full px-4 py-3 bg-cream-50 dark:bg-dark-700 border border-cream-200 dark:border-dark-600 rounded-xl text-teal-900 dark:text-cream-50 placeholder-teal-400 dark:placeholder-cream-300/50 focus:outline-none focus:ring-2 focus:ring-coral-400 dark:focus:ring-coral-500 focus:border-transparent transition-all duration-300"
                    />
                  </div>
                </div>

                {/* Pincode and Country */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-teal-800 dark:text-cream-100 mb-2">
                      Pincode
                    </label>
                    <input
                      type="text"
                      name="orphanagePincode"
                      value={formData.orphanagePincode}
                      onChange={handleChange}
                      placeholder="Pincode"
                      className="w-full px-4 py-3 bg-cream-50 dark:bg-dark-700 border border-cream-200 dark:border-dark-600 rounded-xl text-teal-900 dark:text-cream-50 placeholder-teal-400 dark:placeholder-cream-300/50 focus:outline-none focus:ring-2 focus:ring-coral-400 dark:focus:ring-coral-500 focus:border-transparent transition-all duration-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-teal-800 dark:text-cream-100 mb-2">
                      Country
                    </label>
                    <input
                      type="text"
                      name="orphanageCountry"
                      value={formData.orphanageCountry}
                      onChange={handleChange}
                      placeholder="Country"
                      className="w-full px-4 py-3 bg-cream-50 dark:bg-dark-700 border border-cream-200 dark:border-dark-600 rounded-xl text-teal-900 dark:text-cream-50 placeholder-teal-400 dark:placeholder-cream-300/50 focus:outline-none focus:ring-2 focus:ring-coral-400 dark:focus:ring-coral-500 focus:border-transparent transition-all duration-300"
                    />
                  </div>
                </div>

                {/* Navigation Buttons */}
                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="flex-1 py-3 border-2 border-teal-600 dark:border-teal-400 text-teal-600 dark:text-teal-400 font-semibold rounded-xl hover:bg-teal-600 hover:text-white dark:hover:bg-teal-400 dark:hover:text-dark-900 transition-all duration-300"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={nextStep}
                    className="flex-1 py-3 bg-coral-500 hover:bg-coral-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    Continue
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Step 5: Document Uploads (for orphanAdmin only) */}
          {step === 5 && formData.role === 'orphanAdmin' && (
            <div>
              <h2 className="text-2xl font-playfair font-bold text-teal-900 dark:text-cream-50 mb-6 text-center">
                Upload Documents
              </h2>
              <p className="text-sm text-teal-600 dark:text-cream-300 mb-6 text-center">
                Upload verification documents. You can also upload these later from your dashboard.
              </p>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Registration Certificate */}
                <div>
                  <label className="block text-sm font-medium text-teal-800 dark:text-cream-100 mb-2">
                    Registration Certificate
                  </label>
                  <div className="border-2 border-dashed border-cream-300 dark:border-dark-600 rounded-xl p-6 text-center hover:border-coral-400 dark:hover:border-coral-500 transition-colors">
                    {documents.registrationCertificate ? (
                      <div className="flex items-center justify-between bg-cream-50 dark:bg-dark-700 rounded-lg p-3">
                        <div className="flex items-center gap-3">
                          <FaFileAlt className="text-coral-500 text-xl" />
                          <span className="text-sm text-teal-800 dark:text-cream-100 truncate max-w-[180px]">
                            {documents.registrationCertificate.name}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile('registrationCertificate')}
                          className="text-coral-500 hover:text-coral-600"
                        >
                          <FaTimesCircle />
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => handleFileChange(e, 'registrationCertificate')}
                          className="hidden"
                        />
                        <div className="flex flex-col items-center gap-2">
                          <FaUpload className="text-3xl text-teal-400 dark:text-cream-400" />
                          <span className="text-sm text-teal-600 dark:text-cream-300">
                            Click to upload or drag and drop
                          </span>
                          <span className="text-xs text-teal-400 dark:text-cream-400">
                            PDF, JPG, PNG (max 5MB)
                          </span>
                        </div>
                      </label>
                    )}
                  </div>
                </div>

                {/* Government License */}
                <div>
                  <label className="block text-sm font-medium text-teal-800 dark:text-cream-100 mb-2">
                    Government License / NGO Certificate
                  </label>
                  <div className="border-2 border-dashed border-cream-300 dark:border-dark-600 rounded-xl p-6 text-center hover:border-coral-400 dark:hover:border-coral-500 transition-colors">
                    {documents.governmentLicense ? (
                      <div className="flex items-center justify-between bg-cream-50 dark:bg-dark-700 rounded-lg p-3">
                        <div className="flex items-center gap-3">
                          <FaFileAlt className="text-coral-500 text-xl" />
                          <span className="text-sm text-teal-800 dark:text-cream-100 truncate max-w-[180px]">
                            {documents.governmentLicense.name}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile('governmentLicense')}
                          className="text-coral-500 hover:text-coral-600"
                        >
                          <FaTimesCircle />
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => handleFileChange(e, 'governmentLicense')}
                          className="hidden"
                        />
                        <div className="flex flex-col items-center gap-2">
                          <FaUpload className="text-3xl text-teal-400 dark:text-cream-400" />
                          <span className="text-sm text-teal-600 dark:text-cream-300">
                            Click to upload or drag and drop
                          </span>
                          <span className="text-xs text-teal-400 dark:text-cream-400">
                            PDF, JPG, PNG (max 5MB)
                          </span>
                        </div>
                      </label>
                    )}
                  </div>
                </div>

                {/* Other Documents */}
                <div>
                  <label className="block text-sm font-medium text-teal-800 dark:text-cream-100 mb-2">
                    Other Supporting Documents (Optional)
                  </label>
                  <p className="text-xs text-teal-500 dark:text-cream-400 mb-3">
                    Upload up to 5 additional documents (e.g., tax exemption certificates, audit reports, etc.)
                  </p>
                  
                  {/* List of uploaded other documents */}
                  {documents.otherDocuments.length > 0 && (
                    <div className="space-y-2 mb-3">
                      {documents.otherDocuments.map((doc, index) => (
                        <div key={index} className="flex items-center justify-between bg-cream-50 dark:bg-dark-700 rounded-lg p-3">
                          <div className="flex items-center gap-3">
                            <FaFileAlt className="text-coral-500 text-xl" />
                            <span className="text-sm text-teal-800 dark:text-cream-100 truncate max-w-[180px]">
                              {doc.name}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeOtherDocument(index)}
                            className="text-coral-500 hover:text-coral-600"
                          >
                            <FaTimesCircle />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Add more documents button */}
                  {documents.otherDocuments.length < 5 && (
                    <div className="border-2 border-dashed border-cream-300 dark:border-dark-600 rounded-xl p-4 text-center hover:border-coral-400 dark:hover:border-coral-500 transition-colors">
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={handleOtherDocumentChange}
                          className="hidden"
                        />
                        <div className="flex items-center justify-center gap-2">
                          <FaPlus className="text-teal-400 dark:text-cream-400" />
                          <span className="text-sm text-teal-600 dark:text-cream-300">
                            Add Document
                          </span>
                        </div>
                      </label>
                    </div>
                  )}
                </div>

                {/* Info Note */}
                <div className="bg-teal-50 dark:bg-teal-900/20 rounded-xl p-4">
                  <p className="text-sm text-teal-700 dark:text-teal-400">
                    <strong>Note:</strong> Your orphanage will be in "pending" status until our team verifies your documents. 
                    You can still access your dashboard and add children profiles while verification is in progress.
                  </p>
                </div>

                {/* Navigation Buttons */}
                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="flex-1 py-3 border-2 border-teal-600 dark:border-teal-400 text-teal-600 dark:text-teal-400 font-semibold rounded-xl hover:bg-teal-600 hover:text-white dark:hover:bg-teal-400 dark:hover:text-dark-900 transition-all duration-300"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3 bg-coral-500 hover:bg-coral-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
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
          <p className="mt-6 text-center text-teal-700 dark:text-cream-200">
            Already have an account?{' '}
            <Link to="/login" className="text-coral-500 dark:text-coral-400 hover:text-coral-600 dark:hover:text-coral-300 font-medium transition">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Register
