import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  FaBuilding, FaMapMarkerAlt, FaPhone, FaEnvelope, FaHeart,
  FaArrowLeft, FaCheckCircle, FaClock, FaChild, FaFileAlt,
  FaHandHoldingHeart, FaIdCard, FaGlobe, FaExclamationTriangle
} from 'react-icons/fa'
import Navbar from '../components/Navbar'
import { useTheme } from '../context/ThemeContext'
import { orphanagesAPI, childrenAPI } from '../services/api'

const OrphanageProfile = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isDarkMode } = useTheme()
  const [orphanage, setOrphanage] = useState(null)
  const [children, setChildren] = useState([])
  const [loading, setLoading] = useState(true)
  const [childrenLoading, setChildrenLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchOrphanage()
  }, [id])

  const fetchOrphanage = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await orphanagesAPI.getById(id)
      setOrphanage(response.data.orphanage)
      // Also fetch children for this orphanage
      fetchChildren(id)
    } catch (err) {
      console.error('Error fetching orphanage:', err)
      if (err.response?.status === 404) {
        setError('Orphanage not found.')
      } else {
        setError('Failed to load orphanage details. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchChildren = async (orphanageId) => {
    try {
      setChildrenLoading(true)
      const response = await childrenAPI.getByOrphanage(orphanageId)
      setChildren(response.data || [])
    } catch (err) {
      console.error('Error fetching children:', err)
      setChildren([])
    } finally {
      setChildrenLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-teal-400/20 text-teal-100 border border-teal-300/30 rounded-full text-sm font-semibold">
            <FaCheckCircle />
            Verified
          </span>
        )
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-amber-400/20 text-amber-100 border border-amber-300/30 rounded-full text-sm font-semibold">
            <FaClock />
            Pending Verification
          </span>
        )
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-red-400/20 text-red-100 border border-red-300/30 rounded-full text-sm font-semibold">
            <FaExclamationTriangle />
            Rejected
          </span>
        )
      default:
        return null
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
          <FaBuilding className="text-6xl text-teal-300 dark:text-dark-600 mb-4" />
          <h2 className="text-2xl font-bold text-teal-800 dark:text-cream-100 mb-2">Oops!</h2>
          <p className="text-teal-600 dark:text-cream-300 mb-6 text-center">{error}</p>
          <div className="flex gap-4">
            <button
              onClick={() => navigate('/orphanages')}
              className="px-6 py-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors font-medium"
            >
              Back to Orphanages
            </button>
            <button
              onClick={fetchOrphanage}
              className="px-6 py-3 bg-coral-500 text-white rounded-xl hover:bg-coral-600 transition-colors font-medium"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Orphanage Profile Content */}
      {!loading && !error && orphanage && (
        <>
          {/* Hero Banner */}
          <section className="pt-24 pb-0 bg-gradient-to-br from-teal-700 via-teal-600 to-teal-800 dark:from-dark-800 dark:via-dark-850 dark:to-dark-950 relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-10 left-10 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 right-10 w-56 h-56 bg-white/5 rounded-full blur-3xl"></div>
            <div className="absolute top-20 right-1/4 w-24 h-24 bg-coral-500/10 rounded-full blur-2xl"></div>

            <div className="container mx-auto px-6 pt-8 pb-32 relative z-10">
              {/* Back Button */}
              <button
                onClick={() => navigate('/orphanages')}
                className="inline-flex items-center gap-2 text-white/80 hover:text-white transition mb-8 group"
              >
                <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" />
                <span className="font-medium">Back to Orphanages</span>
              </button>

              <div className="flex flex-col md:flex-row items-start md:items-center gap-5">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <FaBuilding className="text-3xl md:text-4xl text-white" />
                </div>
                <div className="flex-1">
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-playfair font-bold text-white mb-2">
                    {orphanage.name}
                  </h1>
                  <div className="flex flex-wrap items-center gap-3">
                    {getStatusBadge(orphanage.status)}
                    <span className="text-cream-100/60 text-sm">
                      Reg No: {orphanage.registrationNumber}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Main Content */}
          <section className="relative -mt-20 pb-16">
            <div className="container mx-auto px-6">
              <div className="grid lg:grid-cols-3 gap-8">

                {/* Left Column - Contact & Quick Info */}
                <div className="lg:col-span-1 space-y-6">
                  {/* Contact Card */}
                  <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-xl p-6 transition-colors duration-300">
                    <h3 className="text-lg font-bold text-teal-900 dark:text-cream-50 mb-5">Contact Information</h3>

                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center flex-shrink-0">
                          <FaMapMarkerAlt className="text-teal-500" />
                        </div>
                        <div>
                          <p className="text-xs text-teal-500 dark:text-cream-400 uppercase tracking-wide mb-0.5">Address</p>
                          <p className="font-medium text-teal-900 dark:text-cream-50 text-sm leading-relaxed">
                            {orphanage.address?.street && `${orphanage.address.street}, `}
                            {orphanage.address?.city && `${orphanage.address.city}, `}
                            {orphanage.address?.state}
                            {orphanage.address?.pincode && ` - ${orphanage.address.pincode}`}
                            {orphanage.address?.country && `, ${orphanage.address.country}`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-coral-50 dark:bg-coral-900/20 flex items-center justify-center flex-shrink-0">
                          <FaPhone className="text-coral-500" />
                        </div>
                        <div>
                          <p className="text-xs text-teal-500 dark:text-cream-400 uppercase tracking-wide mb-0.5">Phone</p>
                          <a href={`tel:${orphanage.orphanage_phone}`} className="font-medium text-teal-900 dark:text-cream-50 text-sm hover:text-coral-500 transition-colors">
                            {orphanage.orphanage_phone}
                          </a>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center flex-shrink-0">
                          <FaEnvelope className="text-teal-500" />
                        </div>
                        <div>
                          <p className="text-xs text-teal-500 dark:text-cream-400 uppercase tracking-wide mb-0.5">Email</p>
                          <a href={`mailto:${orphanage.orphanage_mail}`} className="font-medium text-teal-900 dark:text-cream-50 text-sm hover:text-coral-500 transition-colors break-all">
                            {orphanage.orphanage_mail}
                          </a>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-coral-50 dark:bg-coral-900/20 flex items-center justify-center flex-shrink-0">
                          <FaIdCard className="text-coral-500" />
                        </div>
                        <div>
                          <p className="text-xs text-teal-500 dark:text-cream-400 uppercase tracking-wide mb-0.5">Registration No.</p>
                          <p className="font-medium text-teal-900 dark:text-cream-50 text-sm">
                            {orphanage.registrationNumber}
                          </p>
                        </div>
                      </div>

                      {orphanage.createdAt && (
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center flex-shrink-0">
                            <FaClock className="text-teal-500" />
                          </div>
                          <div>
                            <p className="text-xs text-teal-500 dark:text-cream-400 uppercase tracking-wide mb-0.5">Registered On</p>
                            <p className="font-medium text-teal-900 dark:text-cream-50 text-sm">
                              {formatDate(orphanage.createdAt)}
                            </p>
                          </div>
                        </div>
                      )}

                      {orphanage.approvedAt && (
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center flex-shrink-0">
                            <FaCheckCircle className="text-teal-500" />
                          </div>
                          <div>
                            <p className="text-xs text-teal-500 dark:text-cream-400 uppercase tracking-wide mb-0.5">Approved On</p>
                            <p className="font-medium text-teal-900 dark:text-cream-50 text-sm">
                              {formatDate(orphanage.approvedAt)}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Donate CTA Card */}
                  <div className="bg-gradient-to-br from-coral-500 to-coral-600 dark:from-coral-700 dark:to-coral-800 rounded-2xl p-6 text-white shadow-lg">
                    <FaHandHoldingHeart className="text-3xl mb-3 text-white/80" />
                    <h3 className="text-lg font-bold mb-2">Support This Orphanage</h3>
                    <p className="text-sm text-white/80 mb-4">
                      Help provide food, education, healthcare and shelter for the children at {orphanage.name}.
                    </p>
                    <Link
                      to="/donate"
                      className="inline-block w-full text-center py-3 bg-white text-coral-600 font-semibold rounded-xl hover:bg-cream-50 transition-colors shadow"
                    >
                      Donate Now
                    </Link>
                  </div>
                </div>

                {/* Right Column - Details & Children */}
                <div className="lg:col-span-2 space-y-6">

                  {/* Stats Row */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-dark-800 rounded-2xl p-5 shadow-sm text-center hover:shadow-md transition-all duration-300">
                      <FaChild className="text-2xl text-coral-500 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-teal-900 dark:text-cream-50">{children.length}</p>
                      <p className="text-xs text-teal-500 dark:text-cream-400 uppercase tracking-wide mt-1">Children</p>
                    </div>
                    <div className="bg-white dark:bg-dark-800 rounded-2xl p-5 shadow-sm text-center hover:shadow-md transition-all duration-300">
                      <FaCheckCircle className="text-2xl text-teal-500 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-teal-900 dark:text-cream-50 capitalize">{orphanage.status}</p>
                      <p className="text-xs text-teal-500 dark:text-cream-400 uppercase tracking-wide mt-1">Status</p>
                    </div>
                    <div className="bg-white dark:bg-dark-800 rounded-2xl p-5 shadow-sm text-center hover:shadow-md transition-all duration-300 col-span-2 sm:col-span-1">
                      <FaGlobe className="text-2xl text-coral-500 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-teal-900 dark:text-cream-50">{orphanage.address?.state || 'N/A'}</p>
                      <p className="text-xs text-teal-500 dark:text-cream-400 uppercase tracking-wide mt-1">State</p>
                    </div>
                  </div>

                  {/* Children Section */}
                  <div className="bg-white dark:bg-dark-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-coral-50 dark:bg-coral-900/20 flex items-center justify-center">
                          <FaChild className="text-xl text-coral-500" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-teal-900 dark:text-cream-50">Children at {orphanage.name}</h3>
                          <p className="text-sm text-teal-500 dark:text-cream-400">{children.length} {children.length === 1 ? 'child' : 'children'} registered</p>
                        </div>
                      </div>
                    </div>

                    {childrenLoading ? (
                      <div className="flex justify-center py-10">
                        <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 border-coral-500"></div>
                      </div>
                    ) : children.length === 0 ? (
                      <div className="text-center py-10">
                        <FaChild className="text-4xl text-teal-200 dark:text-dark-600 mx-auto mb-3" />
                        <p className="text-teal-500 dark:text-cream-400">No children profiles available yet.</p>
                      </div>
                    ) : (
                      <>
                        <div className="grid sm:grid-cols-2 gap-4">
                          {children.slice(0, 3).map((child) => (
                            <Link
                              key={child._id}
                              to={`/children/${child._id}`}
                              className="flex items-center gap-4 p-4 bg-cream-50 dark:bg-dark-700 rounded-xl hover:bg-cream-100 dark:hover:bg-dark-600 transition-colors group"
                            >
                              <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-cream-200 dark:bg-dark-600">
                                {child.profileUrl ? (
                                  <img src={child.profileUrl} alt={child.name} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <FaChild className="text-xl text-teal-300 dark:text-teal-600" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-teal-900 dark:text-cream-50 group-hover:text-coral-500 dark:group-hover:text-coral-400 transition-colors truncate">
                                  {child.name}
                                </h4>
                                <p className="text-sm text-teal-500 dark:text-cream-400">
                                  {child.age} years • {child.gender}
                                </p>
                              </div>
                              <FaArrowLeft className="text-teal-300 dark:text-dark-500 rotate-180 group-hover:text-coral-500 transition-colors flex-shrink-0" />
                            </Link>
                          ))}
                        </div>
                        {children.length > 3 && (
                          <div className="mt-5 text-center">
                            <Link
                              to={`/orphanages/${id}/children`}
                              className="inline-flex items-center gap-2 px-6 py-3 bg-coral-500 text-white font-semibold rounded-xl hover:bg-coral-600 transition-colors shadow-md hover:shadow-lg"
                            >
                              View All {children.length} Children
                              <FaArrowLeft className="rotate-180" />
                            </Link>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Documents Section */}
                  {orphanage.documents && (
                    <div className="bg-white dark:bg-dark-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300">
                      <div className="flex items-center gap-3 mb-5">
                        <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center">
                          <FaFileAlt className="text-xl text-teal-500" />
                        </div>
                        <h3 className="text-lg font-bold text-teal-900 dark:text-cream-50">Documents</h3>
                      </div>

                      <div className="space-y-3">
                        {orphanage.documents.registrationCertificate?.url && (
                          <a
                            href={orphanage.documents.registrationCertificate.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-3 bg-cream-50 dark:bg-dark-700 rounded-xl hover:bg-cream-100 dark:hover:bg-dark-600 transition-colors group"
                          >
                            <FaFileAlt className="text-teal-400 group-hover:text-coral-500 transition-colors flex-shrink-0" />
                            <span className="text-sm text-teal-700 dark:text-cream-200 font-medium">Registration Certificate</span>
                          </a>
                        )}

                        {orphanage.documents.governmentLicense?.url && (
                          <a
                            href={orphanage.documents.governmentLicense.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-3 bg-cream-50 dark:bg-dark-700 rounded-xl hover:bg-cream-100 dark:hover:bg-dark-600 transition-colors group"
                          >
                            <FaFileAlt className="text-teal-400 group-hover:text-coral-500 transition-colors flex-shrink-0" />
                            <span className="text-sm text-teal-700 dark:text-cream-200 font-medium">Government License</span>
                          </a>
                        )}

                        {orphanage.documents.otherDocuments?.length > 0 && orphanage.documents.otherDocuments.map((doc, index) => (
                          doc.url && (
                            <a
                              key={doc.fileId || index}
                              href={doc.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-3 p-3 bg-cream-50 dark:bg-dark-700 rounded-xl hover:bg-cream-100 dark:hover:bg-dark-600 transition-colors group"
                            >
                              <FaFileAlt className="text-teal-400 group-hover:text-coral-500 transition-colors flex-shrink-0" />
                              <span className="text-sm text-teal-700 dark:text-cream-200 font-medium truncate">
                                {doc.name || `Document ${index + 1}`}
                              </span>
                            </a>
                          )
                        ))}

                        {!orphanage.documents.registrationCertificate?.url &&
                         !orphanage.documents.governmentLicense?.url &&
                         (!orphanage.documents.otherDocuments || orphanage.documents.otherDocuments.length === 0) && (
                          <p className="text-teal-500 dark:text-cream-400 text-sm text-center py-4">No documents uploaded yet.</p>
                        )}
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>
          </section>

          {/* Bottom CTA */}
          <section className="py-16 bg-gradient-to-r from-teal-700 to-teal-800 dark:from-dark-800 dark:to-dark-950">
            <div className="container mx-auto px-6 text-center">
              <h2 className="text-3xl font-playfair font-bold text-white mb-4">
                Make a Difference Today
              </h2>
              <p className="text-cream-100/80 mb-8 max-w-2xl mx-auto">
                Support {orphanage.name} and the children in their care. Every contribution matters.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/donate"
                  className="px-8 py-4 bg-coral-500 text-white font-semibold rounded-full hover:bg-coral-600 transition shadow-lg"
                >
                  Donate Now
                </Link>
                <Link
                  to="/orphanages"
                  className="px-8 py-4 bg-transparent border-2 border-white text-white font-semibold rounded-full hover:bg-white/10 transition"
                >
                  Browse More Orphanages
                </Link>
              </div>
            </div>
          </section>

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

export default OrphanageProfile
