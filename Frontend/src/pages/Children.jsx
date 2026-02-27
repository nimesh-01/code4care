import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaHeart, FaSearch, FaMapMarkerAlt, FaGraduationCap, FaHeartbeat, FaChild, FaFilter } from 'react-icons/fa'
import Navbar from '../components/Navbar'
import { useTheme } from '../context/ThemeContext'
import { childrenAPI } from '../services/api'

const Children = () => {
  const navigate = useNavigate()
  const { isDarkMode } = useTheme()
  const [children, setChildren] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    state: '',
    city: '',
    gender: '',
  })
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchChildren()
  }, [])

  const fetchChildren = async () => {
    try {
      setLoading(true)
      setError(null)
      const params = {}
      if (filters.state) params.state = filters.state
      if (filters.city) params.city = filters.city
      
      const response = await childrenAPI.getAll(params)
      setChildren(response.data)
    } catch (err) {
      console.error('Error fetching children:', err)
      setError('Failed to load children profiles. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const applyFilters = () => {
    fetchChildren()
    setShowFilters(false)
  }

  const clearFilters = () => {
    setFilters({ state: '', city: '', gender: '' })
    setSearchTerm('')
  }

  const filteredChildren = children.filter(child => {
    const matchesSearch = child.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         child.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         child.state?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesGender = !filters.gender || child.gender === filters.gender
    return matchesSearch && matchesGender
  })

  return (
    <div className="min-h-screen bg-cream-50 dark:bg-dark-900 transition-colors duration-300">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-coral-500 to-teal-600 dark:from-dark-800 dark:to-dark-950">
        <div className="container mx-auto px-6 text-center">
          <FaChild className="text-6xl text-white/80 mx-auto mb-4" />
          <h1 className="text-4xl md:text-5xl font-playfair font-bold text-white mb-4">
            Meet Our Children
          </h1>
          <p className="text-xl text-cream-100/80 max-w-2xl mx-auto">
            Every child has a unique story. Browse profiles and find ways to support their journey.
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
              {(filters.state || filters.city || filters.gender || searchTerm) && (
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
              <div className="grid md:grid-cols-3 gap-4">
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
                <div>
                  <label className="block text-sm font-medium text-teal-700 dark:text-cream-200 mb-2">
                    Gender
                  </label>
                  <select
                    value={filters.gender}
                    onChange={(e) => handleFilterChange('gender', e.target.value)}
                    className="w-full px-4 py-2 bg-white dark:bg-dark-600 border border-cream-200 dark:border-dark-500 rounded-lg text-teal-900 dark:text-cream-50"
                  >
                    <option value="">All</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
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

      {/* Children Grid */}
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
                onClick={fetchChildren}
                className="px-6 py-3 bg-coral-500 text-white rounded-lg hover:bg-coral-600 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : filteredChildren.length === 0 ? (
            <div className="text-center py-20">
              <FaChild className="text-6xl text-teal-300 dark:text-dark-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-teal-700 dark:text-cream-200 mb-2">
                No children found
              </h3>
              <p className="text-teal-500 dark:text-cream-400">
                {searchTerm || filters.state || filters.city || filters.gender
                  ? 'Try adjusting your filters or search term.'
                  : 'No children profiles are available at the moment.'}
              </p>
            </div>
          ) : (
            <>
              <div className="mb-6 text-teal-600 dark:text-cream-300">
                Showing {filteredChildren.length} {filteredChildren.length === 1 ? 'child' : 'children'}
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredChildren.map((child) => (
                  <ChildCard key={child._id} child={child} onClick={() => navigate(`/children/${child._id}`)} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-teal-700 to-teal-800 dark:from-dark-800 dark:to-dark-950">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-playfair font-bold text-white mb-4">
            Want to Make a Difference?
          </h2>
          <p className="text-cream-100/80 mb-8 max-w-2xl mx-auto">
            Your support can change a child's life forever. Donate, volunteer, or sponsor a child today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/donate"
              className="px-8 py-4 bg-coral-500 text-white font-semibold rounded-full hover:bg-coral-600 transition shadow-lg"
            >
              Donate Now
            </a>
            <a
              href="/register"
              className="px-8 py-4 bg-transparent border-2 border-white text-white font-semibold rounded-full hover:bg-white/10 transition"
            >
              Become a Volunteer
            </a>
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
    </div>
  )
}

const ChildCard = ({ child, onClick }) => {
  return (
    <div onClick={onClick} className="cursor-pointer bg-white dark:bg-dark-800 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group">
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        {child.profileUrl ? (
          <img
            src={child.profileUrl}
            alt={child.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-cream-100 to-cream-200 dark:from-dark-700 dark:to-dark-600 group-hover:scale-105 transition-transform duration-300">
            <FaChild className="text-5xl text-teal-300 dark:text-teal-600 mb-1" />
            <span className="text-xs text-teal-400 dark:text-teal-500 font-medium">No photo</span>
          </div>
        )}
        <div className="absolute top-3 right-3">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            child.status === 'active'
              ? 'bg-teal-500 text-white'
              : 'bg-cream-300 text-teal-700'
          }`}>
            {child.status || 'Active'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="text-lg font-bold text-teal-900 dark:text-cream-50 mb-2">
          {child.name}
        </h3>
        
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-teal-600 dark:text-cream-300">
            <FaChild className="text-coral-400" />
            <span>{child.age} years old • {child.gender}</span>
          </div>
          
          <div className="flex items-center gap-2 text-teal-600 dark:text-cream-300">
            <FaMapMarkerAlt className="text-teal-400" />
            <span>{child.city}, {child.state}</span>
          </div>

          {child.educationStatus && child.educationStatus !== 'Not specified' && (
            <div className="flex items-center gap-2 text-teal-600 dark:text-cream-300">
              <FaGraduationCap className="text-coral-400" />
              <span className="truncate">{child.educationStatus}</span>
            </div>
          )}

          {child.healthStatus && child.healthStatus !== 'Not specified' && (
            <div className="flex items-center gap-2 text-teal-600 dark:text-cream-300">
              <FaHeartbeat className="text-teal-400" />
              <span className="truncate">{child.healthStatus}</span>
            </div>
          )}
        </div>

        {child.background && (
          <p className="mt-3 text-sm text-teal-500 dark:text-cream-400 line-clamp-2">
            {child.background}
          </p>
        )}

        <button
          onClick={onClick}
          className="w-full mt-4 py-2 bg-coral-50 dark:bg-coral-900/20 text-coral-600 dark:text-coral-400 rounded-lg font-medium hover:bg-coral-100 dark:hover:bg-coral-900/40 transition-colors"
        >
          View Profile
        </button>
      </div>
    </div>
  )
}

export default Children
