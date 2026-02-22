import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaEdit, FaSave, 
  FaTimes, FaCamera, FaHeart, FaUserShield, FaUserTie, FaBuilding,
  FaSun, FaMoon, FaArrowLeft
} from 'react-icons/fa'
import { toast } from 'react-toastify'
import { authAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import Navbar from '../components/Navbar'

const Profile = () => {
  const { user, checkAuth } = useAuth()
  const { isDarkMode, toggleTheme } = useTheme()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [profileData, setProfileData] = useState(null)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    firstname: '',
    lastname: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India'
  })
  const [profileImage, setProfileImage] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)

  useEffect(() => {
    fetchUserProfile()
  }, [])

  const fetchUserProfile = async () => {
    try {
      setLoading(true)
      const response = await authAPI.getCurrentUser()
      const userData = response.data.user
      setProfileData(userData)
      setFormData({
        username: userData.username || '',
        email: userData.email || '',
        firstname: userData.fullname?.firstname || '',
        lastname: userData.fullname?.lastname || '',
        phone: userData.phone || '',
        street: userData.address?.street || '',
        city: userData.address?.city || '',
        state: userData.address?.state || '',
        pincode: userData.address?.pincode || '',
        country: userData.address?.country || 'India'
      })
    } catch (error) {
      toast.error('Failed to load profile data')
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB')
        return
      }
      setProfileImage(file)
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    
    try {
      const updateData = new FormData()
      
      // Add text fields (username and email are read-only)
      if (formData.firstname !== profileData.fullname?.firstname) {
        updateData.append('fullname[firstname]', formData.firstname)
      }
      if (formData.lastname !== profileData.fullname?.lastname) {
        updateData.append('fullname[lastname]', formData.lastname)
      }
      if (formData.phone !== profileData.phone) {
        updateData.append('phone', formData.phone)
      }
      
      // Address fields
      updateData.append('address[street]', formData.street)
      updateData.append('address[city]', formData.city)
      updateData.append('address[state]', formData.state)
      updateData.append('address[pincode]', formData.pincode)
      updateData.append('address[country]', formData.country)
      
      // Profile image
      if (profileImage) {
        updateData.append('profile', profileImage)
      }
      
      await authAPI.updateProfile(updateData)
      toast.success('Profile updated successfully!')
      setIsEditing(false)
      setProfileImage(null)
      setPreviewUrl(null)
      
      // Refresh profile data
      await fetchUserProfile()
      await checkAuth()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const cancelEdit = () => {
    setIsEditing(false)
    setProfileImage(null)
    setPreviewUrl(null)
    // Reset form data
    setFormData({
      username: profileData.username || '',
      email: profileData.email || '',
      firstname: profileData.fullname?.firstname || '',
      lastname: profileData.fullname?.lastname || '',
      phone: profileData.phone || '',
      street: profileData.address?.street || '',
      city: profileData.address?.city || '',
      state: profileData.address?.state || '',
      pincode: profileData.address?.pincode || '',
      country: profileData.address?.country || 'India'
    })
  }

  const getRoleIcon = () => {
    switch (profileData?.role) {
      case 'orphanAdmin': return <FaBuilding className="text-coral-500" />
      case 'volunteer': return <FaUserTie className="text-teal-500" />
      case 'superAdmin': return <FaUserShield className="text-purple-500" />
      default: return <FaUser className="text-coral-500" />
    }
  }

  const getRoleBadge = () => {
    const roleStyles = {
      user: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
      volunteer: 'bg-coral-100 text-coral-700 dark:bg-coral-900/30 dark:text-coral-400',
      orphanAdmin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      superAdmin: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
    }
    const roleLabels = {
      user: 'User',
      volunteer: 'Volunteer',
      orphanAdmin: 'Orphanage Admin',
      superAdmin: 'Super Admin'
    }
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${roleStyles[profileData?.role] || roleStyles.user}`}>
        {roleLabels[profileData?.role] || 'User'}
      </span>
    )
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen pt-24 bg-cream-50 dark:bg-dark-900 flex items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-coral-500"></div>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen pt-24 pb-12 bg-cream-50 dark:bg-dark-900 transition-colors duration-300">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Back Button */}
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-teal-600 dark:text-teal-400 hover:text-coral-500 dark:hover:text-coral-400 mb-6 transition"
          >
            <FaArrowLeft />
            <span>Back to Home</span>
          </Link>

          {/* Profile Header Card */}
          <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-xl overflow-hidden mb-8">
            {/* Cover */}
            <div className="h-32 bg-gradient-to-r from-coral-400 via-coral-500 to-teal-500"></div>
            
            {/* Profile Info */}
            <div className="px-8 pb-8">
              <div className="flex flex-col md:flex-row md:items-end gap-6 -mt-16">
                {/* Avatar */}
                <div className="relative">
                  <div className="w-32 h-32 rounded-full border-4 border-white dark:border-dark-800 bg-cream-100 dark:bg-dark-700 overflow-hidden shadow-lg">
                    {previewUrl || profileData?.profileUrl ? (
                      <img 
                        src={previewUrl || profileData?.profileUrl} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FaUser className="text-4xl text-coral-400" />
                      </div>
                    )}
                  </div>
                  {isEditing && (
                    <label className="absolute bottom-0 right-0 w-10 h-10 bg-coral-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-coral-600 transition shadow-md">
                      <FaCamera className="text-white" />
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleImageChange}
                        className="hidden" 
                      />
                    </label>
                  )}
                </div>
                
                {/* Name & Role */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl font-bold text-teal-900 dark:text-cream-50">
                      {profileData?.fullname?.firstname} {profileData?.fullname?.lastname}
                    </h1>
                    {getRoleBadge()}
                  </div>
                  <p className="text-teal-600 dark:text-cream-300">@{profileData?.username}</p>
                </div>
                
                {/* Edit Button */}
                <div>
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2 px-5 py-2.5 bg-coral-500 text-white rounded-xl hover:bg-coral-600 transition shadow-md"
                    >
                      <FaEdit />
                      <span>Edit Profile</span>
                    </button>
                  ) : (
                    <div className="flex gap-3">
                      <button
                        onClick={cancelEdit}
                        className="flex items-center gap-2 px-4 py-2.5 border-2 border-teal-600 dark:border-teal-400 text-teal-600 dark:text-teal-400 rounded-xl hover:bg-teal-600 hover:text-white dark:hover:bg-teal-400 dark:hover:text-dark-900 transition"
                      >
                        <FaTimes />
                        <span>Cancel</span>
                      </button>
                      <button
                        onClick={handleSubmit}
                        disabled={saving}
                        className="flex items-center gap-2 px-5 py-2.5 bg-coral-500 text-white rounded-xl hover:bg-coral-600 transition shadow-md disabled:opacity-50"
                      >
                        {saving ? (
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                        ) : (
                          <FaSave />
                        )}
                        <span>{saving ? 'Saving...' : 'Save'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Personal Information */}
            <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-lg p-6">
              <h2 className="text-lg font-bold text-teal-900 dark:text-cream-50 mb-6 flex items-center gap-2">
                <FaUser className="text-coral-500" />
                Personal Information
              </h2>
              
              <div className="space-y-5">
                {/* Username (Read-only) */}
                <div>
                  <label className="block text-sm font-medium text-teal-700 dark:text-cream-200 mb-2">
                    Username
                  </label>
                  <div className="flex items-center gap-2">
                    <FaUser className="text-coral-400" />
                    <p className="text-teal-900 dark:text-cream-50">@{profileData?.username}</p>
                  </div>
                </div>

                {/* First Name */}
                <div>
                  <label className="block text-sm font-medium text-teal-700 dark:text-cream-200 mb-2">
                    First Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="firstname"
                      value={formData.firstname}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-cream-50 dark:bg-dark-700 border border-cream-200 dark:border-dark-600 rounded-xl text-teal-900 dark:text-cream-50 focus:outline-none focus:ring-2 focus:ring-coral-400"
                    />
                  ) : (
                    <p className="text-teal-900 dark:text-cream-50">{profileData?.fullname?.firstname || '-'}</p>
                  )}
                </div>

                {/* Last Name */}
                <div>
                  <label className="block text-sm font-medium text-teal-700 dark:text-cream-200 mb-2">
                    Last Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="lastname"
                      value={formData.lastname}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-cream-50 dark:bg-dark-700 border border-cream-200 dark:border-dark-600 rounded-xl text-teal-900 dark:text-cream-50 focus:outline-none focus:ring-2 focus:ring-coral-400"
                    />
                  ) : (
                    <p className="text-teal-900 dark:text-cream-50">{profileData?.fullname?.lastname || '-'}</p>
                  )}
                </div>

                {/* Email (Read-only) */}
                <div>
                  <label className="block text-sm font-medium text-teal-700 dark:text-cream-200 mb-2">
                    Email
                  </label>
                  <div className="flex items-center gap-2">
                    <FaEnvelope className="text-coral-400" />
                    <p className="text-teal-900 dark:text-cream-50">{profileData?.email}</p>
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-teal-700 dark:text-cream-200 mb-2">
                    Phone
                  </label>
                  {isEditing ? (
                    <div className="relative">
                      <FaPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-coral-400" />
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="Enter phone number"
                        className="w-full pl-11 pr-4 py-3 bg-cream-50 dark:bg-dark-700 border border-cream-200 dark:border-dark-600 rounded-xl text-teal-900 dark:text-cream-50 focus:outline-none focus:ring-2 focus:ring-coral-400"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <FaPhone className="text-coral-400" />
                      <p className="text-teal-900 dark:text-cream-50">{profileData?.phone || 'Not provided'}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-lg p-6">
              <h2 className="text-lg font-bold text-teal-900 dark:text-cream-50 mb-6 flex items-center gap-2">
                <FaMapMarkerAlt className="text-coral-500" />
                Address Information
              </h2>
              
              <div className="space-y-5">
                {/* Street */}
                <div>
                  <label className="block text-sm font-medium text-teal-700 dark:text-cream-200 mb-2">
                    Street Address
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="street"
                      value={formData.street}
                      onChange={handleChange}
                      placeholder="Enter street address"
                      className="w-full px-4 py-3 bg-cream-50 dark:bg-dark-700 border border-cream-200 dark:border-dark-600 rounded-xl text-teal-900 dark:text-cream-50 focus:outline-none focus:ring-2 focus:ring-coral-400"
                    />
                  ) : (
                    <p className="text-teal-900 dark:text-cream-50">{profileData?.address?.street || 'Not provided'}</p>
                  )}
                </div>

                {/* City & State */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-teal-700 dark:text-cream-200 mb-2">
                      City
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        placeholder="City"
                        className="w-full px-4 py-3 bg-cream-50 dark:bg-dark-700 border border-cream-200 dark:border-dark-600 rounded-xl text-teal-900 dark:text-cream-50 focus:outline-none focus:ring-2 focus:ring-coral-400"
                      />
                    ) : (
                      <p className="text-teal-900 dark:text-cream-50">{profileData?.address?.city || '-'}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-teal-700 dark:text-cream-200 mb-2">
                      State
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        placeholder="State"
                        className="w-full px-4 py-3 bg-cream-50 dark:bg-dark-700 border border-cream-200 dark:border-dark-600 rounded-xl text-teal-900 dark:text-cream-50 focus:outline-none focus:ring-2 focus:ring-coral-400"
                      />
                    ) : (
                      <p className="text-teal-900 dark:text-cream-50">{profileData?.address?.state || '-'}</p>
                    )}
                  </div>
                </div>

                {/* Pincode & Country */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-teal-700 dark:text-cream-200 mb-2">
                      Pincode
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="pincode"
                        value={formData.pincode}
                        onChange={handleChange}
                        placeholder="Pincode"
                        className="w-full px-4 py-3 bg-cream-50 dark:bg-dark-700 border border-cream-200 dark:border-dark-600 rounded-xl text-teal-900 dark:text-cream-50 focus:outline-none focus:ring-2 focus:ring-coral-400"
                      />
                    ) : (
                      <p className="text-teal-900 dark:text-cream-50">{profileData?.address?.pincode || '-'}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-teal-700 dark:text-cream-200 mb-2">
                      Country
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="country"
                        value={formData.country}
                        onChange={handleChange}
                        placeholder="Country"
                        className="w-full px-4 py-3 bg-cream-50 dark:bg-dark-700 border border-cream-200 dark:border-dark-600 rounded-xl text-teal-900 dark:text-cream-50 focus:outline-none focus:ring-2 focus:ring-coral-400"
                      />
                    ) : (
                      <p className="text-teal-900 dark:text-cream-50">{profileData?.address?.country || 'India'}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Account Info */}
          <div className="mt-8 bg-white dark:bg-dark-800 rounded-2xl shadow-lg p-6">
            <h2 className="text-lg font-bold text-teal-900 dark:text-cream-50 mb-4">
              Account Information
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-teal-600 dark:text-cream-400 mb-1">Account Type</p>
                <div className="flex items-center gap-2">
                  {getRoleIcon()}
                  <span className="text-teal-900 dark:text-cream-50 font-medium capitalize">{profileData?.role}</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-teal-600 dark:text-cream-400 mb-1">Account Status</p>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                  profileData?.status === 'active' 
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : profileData?.status === 'pending'
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                }`}>
                  {profileData?.status || 'Active'}
                </span>
              </div>
              <div>
                <p className="text-sm text-teal-600 dark:text-cream-400 mb-1">Member Since</p>
                <p className="text-teal-900 dark:text-cream-50">
                  {profileData?.createdAt 
                    ? new Date(profileData.createdAt).toLocaleDateString('en-IN', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })
                    : '-'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Profile
