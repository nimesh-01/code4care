import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  FaChild, FaMapMarkerAlt, FaGraduationCap, FaHeartbeat, FaHeart,
  FaArrowLeft, FaBuilding, FaCalendarAlt, FaVenusMars, FaFileAlt,
  FaHandHoldingHeart, FaUserFriends
} from 'react-icons/fa'
import Navbar from '../components/Navbar'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { childrenAPI } from '../services/api'

const ChildProfile = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isDarkMode } = useTheme()
  const { user } = useAuth()
  const [child, setChild] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [imageLoaded, setImageLoaded] = useState(false)

  useEffect(() => {
    fetchChild()
  }, [id])

  const fetchChild = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await childrenAPI.getById(id)
      setChild(response.data)
    } catch (err) {
      console.error('Error fetching child profile:', err)
      if (err.response?.status === 404) {
        setError('Child profile not found.')
      } else {
        setError('Failed to load child profile. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A'
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-cream-50 dark:bg-dark-900 transition-colors duration-300">
      <Navbar />

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-coral-500"></div>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="flex flex-col items-center justify-center min-h-screen px-6">
          <FaChild className="text-6xl text-teal-300 dark:text-dark-600 mb-4" />
          <h2 className="text-2xl font-bold text-teal-800 dark:text-cream-100 mb-2">Oops!</h2>
          <p className="text-teal-600 dark:text-cream-300 mb-6 text-center">{error}</p>
          <div className="flex gap-4">
            <button
              onClick={() => navigate('/children')}
              className="px-6 py-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors font-medium"
            >
              Back to Children
            </button>
            <button
              onClick={fetchChild}
              className="px-6 py-3 bg-coral-500 text-white rounded-xl hover:bg-coral-600 transition-colors font-medium"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Child Profile Content */}
      {!loading && !error && child && (
        <>
          {/* Hero Banner */}
          <section className="pt-24 pb-0 bg-gradient-to-br from-coral-500 via-coral-400 to-teal-600 dark:from-dark-800 dark:via-dark-850 dark:to-dark-950 relative overflow-hidden">
            {/* Decorative circles */}
            <div className="absolute top-10 left-10 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
            <div className="absolute bottom-10 right-10 w-48 h-48 bg-white/5 rounded-full blur-3xl"></div>

            <div className="container mx-auto px-6 pt-8 pb-32 relative z-10">
              {/* Back Button - Hidden for orphanage admins */}
              {user?.role !== 'orphanAdmin' && (
                <button
                  onClick={() => navigate('/children')}
                  className="inline-flex items-center gap-2 text-white/80 hover:text-white transition mb-8 group"
                >
                  <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" />
                  <span className="font-medium">Back to Children</span>
                </button>
              )}

              <div className="flex flex-col md:flex-row items-center md:items-end gap-6">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-playfair font-bold text-white text-center md:text-left">
                  {child.name}
                </h1>
                <span className={`px-4 py-1.5 rounded-full text-sm font-semibold ${
                  child.status === 'active'
                    ? 'bg-teal-400/20 text-teal-100 border border-teal-300/30'
                    : 'bg-cream-300/20 text-cream-100 border border-cream-300/30'
                }`}>
                  {child.status === 'active' ? '● Active' : '● Archived'}
                </span>
              </div>
            </div>
          </section>

          {/* Main Content */}
          <section className="relative -mt-20 pb-16">
            <div className="container mx-auto px-6">
              <div className="grid lg:grid-cols-3 gap-8">

                {/* Left Column - Photo & Quick Info */}
                <div className="lg:col-span-1">
                  {/* Profile Image Card */}
                  <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-xl overflow-hidden transition-colors duration-300">
                    <div className="relative aspect-square overflow-hidden bg-cream-100 dark:bg-dark-700">
                      {child.profileUrl ? (
                        <>
                          {!imageLoaded && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="animate-pulse w-full h-full bg-cream-200 dark:bg-dark-600"></div>
                            </div>
                          )}
                          <img
                            src={child.profileUrl}
                            alt={child.name}
                            className={`w-full h-full object-cover transition-opacity duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                            onLoad={() => setImageLoaded(true)}
                            onError={() => setImageLoaded(true)}
                          />
                        </>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-cream-100 to-cream-200 dark:from-dark-700 dark:to-dark-600">
                          <FaChild className="text-7xl text-teal-300 dark:text-teal-600 mb-2" />
                          <span className="text-sm text-teal-400 dark:text-teal-500 font-medium">No photo available</span>
                        </div>
                      )}
                    </div>

                    {/* Quick Stats */}
                    <div className="p-6 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-coral-50 dark:bg-coral-900/20 flex items-center justify-center">
                          <FaChild className="text-coral-500" />
                        </div>
                        <div>
                          <p className="text-xs text-teal-500 dark:text-cream-400 uppercase tracking-wide">Age</p>
                          <p className="font-semibold text-teal-900 dark:text-cream-50">{child.age} years old</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center">
                          <FaVenusMars className="text-teal-500" />
                        </div>
                        <div>
                          <p className="text-xs text-teal-500 dark:text-cream-400 uppercase tracking-wide">Gender</p>
                          <p className="font-semibold text-teal-900 dark:text-cream-50">{child.gender}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-coral-50 dark:bg-coral-900/20 flex items-center justify-center">
                          <FaMapMarkerAlt className="text-coral-500" />
                        </div>
                        <div>
                          <p className="text-xs text-teal-500 dark:text-cream-400 uppercase tracking-wide">Location</p>
                          <p className="font-semibold text-teal-900 dark:text-cream-50">{child.city}, {child.state}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center">
                          <FaCalendarAlt className="text-teal-500" />
                        </div>
                        <div>
                          <p className="text-xs text-teal-500 dark:text-cream-400 uppercase tracking-wide">Registered</p>
                          <p className="font-semibold text-teal-900 dark:text-cream-50">{formatDate(child.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sponsor CTA Card - Hidden for orphanage admins */}
                  {user?.role !== 'orphanAdmin' && (
                    <div className="mt-6 bg-gradient-to-br from-coral-500 to-coral-600 dark:from-coral-700 dark:to-coral-800 rounded-2xl p-6 text-white shadow-lg">
                      <FaHandHoldingHeart className="text-3xl mb-3 text-white/80" />
                      <h3 className="text-lg font-bold mb-2">Support {child.name}</h3>
                      <p className="text-sm text-white/80 mb-4">
                        Your contribution can help provide education, healthcare, and a brighter future.
                      </p>
                      <Link
                        to="/donate"
                        className="inline-block w-full text-center py-3 bg-white text-coral-600 font-semibold rounded-xl hover:bg-cream-50 transition-colors shadow"
                      >
                        Donate Now
                      </Link>
                    </div>
                  )}
                </div>

                {/* Right Column - Details */}
                <div className="lg:col-span-2 space-y-6">

                  {/* Education & Health Cards */}
                  <div className="grid sm:grid-cols-2 gap-6">
                    {/* Education */}
                    <div className="bg-white dark:bg-dark-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-coral-50 dark:bg-coral-900/20 flex items-center justify-center">
                          <FaGraduationCap className="text-xl text-coral-500" />
                        </div>
                        <h3 className="text-lg font-bold text-teal-900 dark:text-cream-50">Education</h3>
                      </div>
                      <p className="text-teal-700 dark:text-cream-200 leading-relaxed">
                        {child.educationStatus && child.educationStatus !== 'Not specified'
                          ? child.educationStatus
                          : 'Education details not available yet.'}
                      </p>
                    </div>

                    {/* Health */}
                    <div className="bg-white dark:bg-dark-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center">
                          <FaHeartbeat className="text-xl text-teal-500" />
                        </div>
                        <h3 className="text-lg font-bold text-teal-900 dark:text-cream-50">Health Status</h3>
                      </div>
                      <p className="text-teal-700 dark:text-cream-200 leading-relaxed">
                        {child.healthStatus && child.healthStatus !== 'Not specified'
                          ? child.healthStatus
                          : 'Health details not available yet.'}
                      </p>
                    </div>
                  </div>

                  {/* Background Story */}
                  <div className="bg-white dark:bg-dark-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-coral-50 dark:bg-coral-900/20 flex items-center justify-center">
                        <FaUserFriends className="text-xl text-coral-500" />
                      </div>
                      <h3 className="text-lg font-bold text-teal-900 dark:text-cream-50">Background Story</h3>
                    </div>
                    <p className="text-teal-700 dark:text-cream-200 leading-relaxed whitespace-pre-line">
                      {child.background
                        ? child.background
                        : 'Background details are not available at this time. Please check back later or contact the orphanage for more information.'}
                    </p>
                  </div>

                  {/* Documents */}
                  {child.documents && child.documents.length > 0 && (
                    <div className="bg-white dark:bg-dark-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center">
                          <FaFileAlt className="text-xl text-teal-500" />
                        </div>
                        <h3 className="text-lg font-bold text-teal-900 dark:text-cream-50">Documents</h3>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-3">
                        {child.documents.map((doc, index) => (
                          <a
                            key={doc.fileId || index}
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-3 bg-cream-50 dark:bg-dark-700 rounded-xl hover:bg-cream-100 dark:hover:bg-dark-600 transition-colors group"
                          >
                            <FaFileAlt className="text-teal-400 group-hover:text-coral-500 transition-colors flex-shrink-0" />
                            <span className="text-sm text-teal-700 dark:text-cream-200 truncate font-medium">
                              {doc.name || `Document ${index + 1}`}
                            </span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Orphanage Info - Hidden for orphanage admins */}
                  {child.orphanageId && user?.role !== 'orphanAdmin' && (
                    <div className="bg-white dark:bg-dark-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-coral-50 dark:bg-coral-900/20 flex items-center justify-center">
                          <FaBuilding className="text-xl text-coral-500" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-teal-900 dark:text-cream-50">Orphanage</h3>
                          <p className="text-sm text-teal-500 dark:text-cream-400">Where {child.name} lives</p>
                        </div>
                      </div>
                      <Link
                        to={`/orphanages/${child.orphanageId}`}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 rounded-xl font-medium hover:bg-teal-100 dark:hover:bg-teal-900/40 transition-colors"
                      >
                        <FaBuilding className="text-sm" />
                        View Orphanage Details
                      </Link>
                    </div>
                  )}

                </div>
              </div>
            </div>
          </section>

          {/* Bottom CTA - Hidden for orphanage admins */}
          {user?.role !== 'orphanAdmin' && (
            <section className="py-16 bg-gradient-to-r from-teal-700 to-teal-800 dark:from-dark-800 dark:to-dark-950">
              <div className="container mx-auto px-6 text-center">
                <h2 className="text-3xl font-playfair font-bold text-white mb-4">
                  Every Child Deserves Love & Care
                </h2>
                <p className="text-cream-100/80 mb-8 max-w-2xl mx-auto">
                  Your support can transform {child.name}'s life. Consider donating, volunteering, or spreading the word.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    to="/donate"
                    className="px-8 py-4 bg-coral-500 text-white font-semibold rounded-full hover:bg-coral-600 transition shadow-lg"
                  >
                    Donate Now
                  </Link>
                  <Link
                    to="/children"
                    className="px-8 py-4 bg-transparent border-2 border-white text-white font-semibold rounded-full hover:bg-white/10 transition"
                  >
                    Browse More Children
                  </Link>
                </div>
              </div>
            </section>
          )}

          {/* Footer */}
          <footer className="bg-teal-900 dark:bg-dark-950 text-cream-100 py-12 transition-colors duration-300">
            <div className="container mx-auto px-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <FaHeart className="text-coral-400" />
                <span className="text-xl font-playfair font-bold">SoulConnect</span>
              </div>
              <p className="text-cream-200/60 text-sm">
                © 2026 SoulConnect. All rights reserved. Made with love for children in need.
              </p>
            </div>
          </footer>
        </>
      )}
    </div>
  )
}

export default ChildProfile
