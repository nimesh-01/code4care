import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  FaHeart, FaSearch, FaMapMarkerAlt, FaGraduationCap, FaHeartbeat,
  FaChild, FaFilter, FaArrowLeft, FaBuilding, FaVenusMars
} from 'react-icons/fa'
import Navbar from '../components/Navbar'
import { useTheme } from '../context/ThemeContext'
import { childrenAPI, orphanagesAPI } from '../services/api'

const OrphanageChildren = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isDarkMode } = useTheme()
  const [orphanage, setOrphanage] = useState(null)
  const [children, setChildren] = useState([])
  const [loading, setLoading] = useState(true)
  const [orphanageLoading, setOrphanageLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [genderFilter, setGenderFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchOrphanage()
    fetchChildren()
  }, [id])

  const fetchOrphanage = async () => {
    try {
      setOrphanageLoading(true)
      const response = await orphanagesAPI.getById(id)
      setOrphanage(response.data.orphanage)
    } catch (err) {
      console.error('Error fetching orphanage:', err)
    } finally {
      setOrphanageLoading(false)
    }
  }

  const fetchChildren = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await childrenAPI.getByOrphanage(id)
      setChildren(response.data || [])
    } catch (err) {
      console.error('Error fetching children:', err)
      setError('Failed to load children. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const clearFilters = () => {
    setSearchTerm('')
    setGenderFilter('')
  }

  const filteredChildren = children.filter(child => {
    const matchesSearch = !searchTerm ||
      child.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      child.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      child.state?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      child.educationStatus?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesGender = !genderFilter || child.gender === genderFilter
    return matchesSearch && matchesGender
  })

  const genderCounts = {
    Male: children.filter(c => c.gender === 'Male').length,
    Female: children.filter(c => c.gender === 'Female').length,
    Other: children.filter(c => c.gender === 'Other').length,
  }

  return (
    <div className="min-h-screen bg-cream-50 dark:bg-dark-900 transition-colors duration-300">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-coral-500 to-teal-600 dark:from-dark-800 dark:to-dark-950 relative overflow-hidden">
        <div className="absolute top-10 right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-10 w-48 h-48 bg-white/5 rounded-full blur-3xl"></div>

        <div className="container mx-auto px-6 relative z-10">
          {/* Back Button */}
          <button
            onClick={() => navigate(`/orphanages/${id}`)}
            className="inline-flex items-center gap-2 text-white/80 hover:text-white transition mb-6 group"
          >
            <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back to Orphanage</span>
          </button>

          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <FaChild className="text-5xl md:text-6xl text-white/80" />
            <div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-playfair font-bold text-white mb-2">
                Children
              </h1>
              {orphanage && (
                <p className="text-lg text-cream-100/80 flex items-center gap-2">
                  <FaBuilding className="text-sm" />
                  at {orphanage.name}
                </p>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex flex-wrap gap-3 mt-6">
            <span className="px-4 py-2 bg-white/10 backdrop-blur-sm text-white rounded-full text-sm font-medium border border-white/10">
              {children.length} Total
            </span>
            {genderCounts.Male > 0 && (
              <span className="px-4 py-2 bg-white/10 backdrop-blur-sm text-white rounded-full text-sm font-medium border border-white/10">
                {genderCounts.Male} Boys
              </span>
            )}
            {genderCounts.Female > 0 && (
              <span className="px-4 py-2 bg-white/10 backdrop-blur-sm text-white rounded-full text-sm font-medium border border-white/10">
                {genderCounts.Female} Girls
              </span>
            )}
            {genderCounts.Other > 0 && (
              <span className="px-4 py-2 bg-white/10 backdrop-blur-sm text-white rounded-full text-sm font-medium border border-white/10">
                {genderCounts.Other} Other
              </span>
            )}
          </div>
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
                placeholder="Search by name, city, education..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-cream-50 dark:bg-dark-700 border border-cream-200 dark:border-dark-600 rounded-xl text-teal-900 dark:text-cream-50 placeholder-teal-400 dark:placeholder-cream-300/50 focus:outline-none focus:ring-2 focus:ring-coral-500 transition-colors"
              />
            </div>

            {/* Filter Controls */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Gender Quick Filters */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setGenderFilter('')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    genderFilter === ''
                      ? 'bg-coral-500 text-white shadow-md'
                      : 'bg-cream-100 dark:bg-dark-700 text-teal-600 dark:text-cream-300 hover:bg-cream-200 dark:hover:bg-dark-600'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setGenderFilter('Male')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    genderFilter === 'Male'
                      ? 'bg-coral-500 text-white shadow-md'
                      : 'bg-cream-100 dark:bg-dark-700 text-teal-600 dark:text-cream-300 hover:bg-cream-200 dark:hover:bg-dark-600'
                  }`}
                >
                  Boys
                </button>
                <button
                  onClick={() => setGenderFilter('Female')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    genderFilter === 'Female'
                      ? 'bg-coral-500 text-white shadow-md'
                      : 'bg-cream-100 dark:bg-dark-700 text-teal-600 dark:text-cream-300 hover:bg-cream-200 dark:hover:bg-dark-600'
                  }`}
                >
                  Girls
                </button>
                <button
                  onClick={() => setGenderFilter('Other')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    genderFilter === 'Other'
                      ? 'bg-coral-500 text-white shadow-md'
                      : 'bg-cream-100 dark:bg-dark-700 text-teal-600 dark:text-cream-300 hover:bg-cream-200 dark:hover:bg-dark-600'
                  }`}
                >
                  Other
                </button>
              </div>

              {(searchTerm || genderFilter) && (
                <button
                  onClick={clearFilters}
                  className="text-coral-500 hover:text-coral-600 font-medium text-sm"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>
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
                {searchTerm || genderFilter
                  ? 'Try adjusting your search or filter.'
                  : 'No children profiles are available for this orphanage.'}
              </p>
            </div>
          ) : (
            <>
              <div className="mb-6 text-teal-600 dark:text-cream-300">
                Showing {filteredChildren.length} of {children.length} {children.length === 1 ? 'child' : 'children'}
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredChildren.map((child) => (
                  <ChildCard key={child._id} child={child} />
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
            Your support can change these children's lives forever. Donate or volunteer today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/donate"
              className="px-8 py-4 bg-coral-500 text-white font-semibold rounded-full hover:bg-coral-600 transition shadow-lg"
            >
              Donate Now
            </Link>
            <Link
              to={`/orphanages/${id}`}
              className="px-8 py-4 bg-transparent border-2 border-white text-white font-semibold rounded-full hover:bg-white/10 transition"
            >
              Back to Orphanage
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
    </div>
  )
}

const ChildCard = ({ child }) => {
  const navigate = useNavigate()

  return (
    <div
      onClick={() => navigate(`/children/${child._id}`)}
      className="cursor-pointer bg-white dark:bg-dark-800 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group"
    >
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
            child.gender === 'Male'
              ? 'bg-blue-500/90 text-white'
              : child.gender === 'Female'
              ? 'bg-pink-500/90 text-white'
              : 'bg-teal-500/90 text-white'
          }`}>
            {child.gender}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="text-lg font-bold text-teal-900 dark:text-cream-50 mb-2 group-hover:text-coral-500 dark:group-hover:text-coral-400 transition-colors">
          {child.name}
        </h3>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-teal-600 dark:text-cream-300">
            <FaChild className="text-coral-400 flex-shrink-0" />
            <span>{child.age} years old</span>
          </div>

          <div className="flex items-center gap-2 text-teal-600 dark:text-cream-300">
            <FaMapMarkerAlt className="text-teal-400 flex-shrink-0" />
            <span>{child.city}, {child.state}</span>
          </div>

          {child.educationStatus && child.educationStatus !== 'Not specified' && (
            <div className="flex items-center gap-2 text-teal-600 dark:text-cream-300">
              <FaGraduationCap className="text-coral-400 flex-shrink-0" />
              <span className="truncate">{child.educationStatus}</span>
            </div>
          )}

          {child.healthStatus && child.healthStatus !== 'Not specified' && (
            <div className="flex items-center gap-2 text-teal-600 dark:text-cream-300">
              <FaHeartbeat className="text-teal-400 flex-shrink-0" />
              <span className="truncate">{child.healthStatus}</span>
            </div>
          )}
        </div>

        {child.background && (
          <p className="mt-3 text-sm text-teal-500 dark:text-cream-400 line-clamp-2">
            {child.background}
          </p>
        )}

        <button className="w-full mt-4 py-2 bg-coral-50 dark:bg-coral-900/20 text-coral-600 dark:text-coral-400 rounded-lg font-medium hover:bg-coral-100 dark:hover:bg-coral-900/40 transition-colors">
          View Profile
        </button>
      </div>
    </div>
  )
}

export default OrphanageChildren
