import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaHeart, FaSearch, FaMapMarkerAlt, FaPhone, FaEnvelope, FaBuilding, FaFilter, FaChild, FaCheckCircle, FaClock } from 'react-icons/fa'
import Navbar from '../components/Navbar'
import { useTheme } from '../context/ThemeContext'
import { orphanagesAPI } from '../services/api'

const Orphanages = () => {
  const navigate = useNavigate()
  const { isDarkMode } = useTheme()
  const [orphanages, setOrphanages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    state: '',
    city: '',
  })
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchOrphanages()
  }, [])

  const fetchOrphanages = async () => {
    try {
      setLoading(true)
      setError(null)
      const params = {}
      if (filters.state) params.state = filters.state
      if (filters.city) params.city = filters.city
      
      const response = await orphanagesAPI.getAll(params)
      setOrphanages(response.data.orphanages || [])
    } catch (err) {
      console.error('Error fetching orphanages:', err)
      setError('Failed to load orphanages. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const applyFilters = () => {
    fetchOrphanages()
    setShowFilters(false)
  }

  const clearFilters = () => {
    setFilters({ state: '', city: '' })
    setSearchTerm('')
  }

  const filteredOrphanages = orphanages.filter(orphanage => {
    const matchesSearch = orphanage.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         orphanage.address?.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         orphanage.address?.state?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  return (
    <div className="min-h-screen bg-cream-50 dark:bg-dark-900 transition-colors duration-300">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-teal-700 to-teal-900 dark:from-dark-800 dark:to-dark-950">
        <div className="container mx-auto px-6 text-center">
          <FaBuilding className="text-6xl text-white/80 mx-auto mb-4" />
          <h1 className="text-4xl md:text-5xl font-playfair font-bold text-white mb-4">
            Our Partner Orphanages
          </h1>
          <p className="text-xl text-cream-100/80 max-w-2xl mx-auto">
            Discover verified orphanages across India. Each one is committed to providing love and care to children in need.
          </p>
        </div>
      </section>

      {/* Search & Filter Section */}
      <section className="py-8 bg-white dark:bg-dark-800 shadow-sm transition-colors duration-300">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search Bar */}
            <div className="relative w-full md:w-96">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-teal-400" />
              <input
                type="text"
                placeholder="Search by name, city, or state..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-cream-50 dark:bg-dark-700 border border-cream-200 dark:border-dark-600 rounded-xl text-teal-900 dark:text-cream-50 placeholder-teal-400 dark:placeholder-cream-300/50 focus:outline-none focus:ring-2 focus:ring-coral-500 transition-colors"
              />
            </div>

            {/* Filter Controls */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-3 bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 rounded-xl hover:bg-teal-100 dark:hover:bg-teal-900/50 transition-colors"
              >
                <FaFilter />
                <span>Filters</span>
              </button>
              {(filters.state || filters.city || searchTerm) && (
                <button
                  onClick={clearFilters}
                  className="text-coral-500 hover:text-coral-600 font-medium"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="mt-6 p-6 bg-cream-50 dark:bg-dark-700 rounded-2xl transition-colors duration-300">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-teal-700 dark:text-cream-200 mb-2">
                    State
                  </label>
                  <input
                    type="text"
                    placeholder="Enter state"
                    value={filters.state}
                    onChange={(e) => handleFilterChange('state', e.target.value)}
                    className="w-full px-4 py-2 bg-white dark:bg-dark-600 border border-cream-200 dark:border-dark-500 rounded-lg text-teal-900 dark:text-cream-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-teal-700 dark:text-cream-200 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    placeholder="Enter city"
                    value={filters.city}
                    onChange={(e) => handleFilterChange('city', e.target.value)}
                    className="w-full px-4 py-2 bg-white dark:bg-dark-600 border border-cream-200 dark:border-dark-500 rounded-lg text-teal-900 dark:text-cream-50"
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={applyFilters}
                  className="px-6 py-2 bg-coral-500 text-white rounded-lg hover:bg-coral-600 transition-colors"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Orphanages Grid */}
      <section className="py-12">
        <div className="container mx-auto px-6">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-coral-500"></div>
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <p className="text-coral-500 text-lg mb-4">{error}</p>
              <button
                onClick={fetchOrphanages}
                className="px-6 py-3 bg-coral-500 text-white rounded-lg hover:bg-coral-600 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : filteredOrphanages.length === 0 ? (
            <div className="text-center py-20">
              <FaBuilding className="text-6xl text-teal-300 dark:text-dark-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-teal-700 dark:text-cream-200 mb-2">
                No orphanages found
              </h3>
              <p className="text-teal-500 dark:text-cream-400">
                {searchTerm || filters.state || filters.city
                  ? 'Try adjusting your filters or search term.'
                  : 'No orphanages are available at the moment.'}
              </p>
            </div>
          ) : (
            <>
              <div className="mb-6 text-teal-600 dark:text-cream-300">
                Showing {filteredOrphanages.length} {filteredOrphanages.length === 1 ? 'orphanage' : 'orphanages'}
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredOrphanages.map((orphanage) => (
                  <OrphanageCard key={orphanage._id} orphanage={orphanage} onClick={() => navigate(`/orphanages/${orphanage._id}`)} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-coral-500 to-coral-600 dark:from-dark-800 dark:to-dark-950">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-playfair font-bold text-white mb-4">
            Run an Orphanage?
          </h2>
          <p className="text-cream-100/80 mb-8 max-w-2xl mx-auto">
            Join our platform to connect with donors and volunteers. Get verified and start receiving support for the children in your care.
          </p>
          <a
            href="/register"
            className="inline-block px-8 py-4 bg-white text-coral-600 font-semibold rounded-full hover:bg-cream-100 transition shadow-lg"
          >
            Register Your Orphanage
          </a>
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
    </div>
  )
}

const OrphanageCard = ({ orphanage, onClick }) => {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 rounded-full text-xs font-medium">
            <FaCheckCircle />
            Verified
          </span>
        )
      case 'pending':
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-coral-100 dark:bg-coral-900/30 text-coral-600 dark:text-coral-400 rounded-full text-xs font-medium">
            <FaClock />
            Pending
          </span>
        )
      default:
        return null
    }
  }

  return (
    <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-teal-700 dark:from-teal-800 dark:to-teal-900 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <FaBuilding className="text-white text-xl" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{orphanage.name}</h3>
              <p className="text-cream-100/70 text-sm">Reg: {orphanage.registrationNumber}</p>
            </div>
          </div>
          {getStatusBadge(orphanage.status)}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-3 text-teal-600 dark:text-cream-300">
            <FaMapMarkerAlt className="text-teal-400 mt-1 flex-shrink-0" />
            <span>
              {orphanage.address?.street && `${orphanage.address.street}, `}
              {orphanage.address?.city}, {orphanage.address?.state}
              {orphanage.address?.pincode && ` - ${orphanage.address.pincode}`}
            </span>
          </div>

          <div className="flex items-center gap-3 text-teal-600 dark:text-cream-300">
            <FaPhone className="text-coral-400 flex-shrink-0" />
            <span>{orphanage.orphanage_phone}</span>
          </div>

          <div className="flex items-center gap-3 text-teal-600 dark:text-cream-300">
            <FaEnvelope className="text-teal-400 flex-shrink-0" />
            <span className="truncate">{orphanage.orphanage_mail}</span>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button onClick={(e) => { e.stopPropagation(); window.location.href = '/donate'; }} className="flex-1 py-2 bg-coral-500 text-white rounded-lg font-medium hover:bg-coral-600 transition-colors">
            Donate
          </button>
          <button onClick={onClick} className="flex-1 py-2 bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 rounded-lg font-medium hover:bg-teal-100 dark:hover:bg-teal-900/40 transition-colors">
            View Details
          </button>
        </div>
      </div>
    </div>
  )
}

export default Orphanages
