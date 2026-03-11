import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { FaArrowLeft, FaSpinner, FaPlus, FaNewspaper } from 'react-icons/fa'
import Navbar from '../../components/Navbar'
import { ScrollReveal } from '../../hooks/useScrollReveal'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import { postAPI, orphanagesAPI } from '../../services/api'
import PostCard from './PostCard'

const OrphanagePosts = () => {
  const { orphanageId } = useParams()
  const { isDarkMode } = useTheme()
  const { user } = useAuth()
  const [posts, setPosts] = useState([])
  const [orphanage, setOrphanage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState(null)

  const isOrphanageAdmin = user?.role === 'orphanAdmin' && user?.orphanageId === orphanageId

  useEffect(() => {
    fetchData()
  }, [orphanageId, page])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [postsRes, orphanageRes] = await Promise.all([
        postAPI.getByOrphanage(orphanageId, { page, limit: 10 }),
        orphanagesAPI.getById(orphanageId).catch(() => null)
      ])
      setPosts(postsRes.data.posts || [])
      setPagination(postsRes.data.pagination)
      if (orphanageRes?.data?.orphanage) {
        setOrphanage(orphanageRes.data.orphanage)
      }
    } catch (err) {
      console.error('Failed to load posts:', err)
    } finally {
      setLoading(false)
    }
  }

  const handlePostUpdate = (updatedPost) => {
    setPosts(prev => prev.map(p => p._id === updatedPost._id ? updatedPost : p))
  }

  const handlePostDelete = (deletedId) => {
    setPosts(prev => prev.filter(p => p._id !== deletedId))
  }

  return (
    <div className="min-h-screen bg-cream-50 dark:bg-dark-900 transition-colors duration-300">
      <Navbar />

      {/* Header */}
      <section className="pt-32 pb-12 bg-gradient-to-br from-teal-700 to-teal-900 dark:from-dark-800 dark:to-dark-950">
        <ScrollReveal animation="fade-up">
          <div className="container mx-auto px-6">
            <Link
              to={`/orphanages/${orphanageId}`}
              className="inline-flex items-center gap-2 text-cream-100/80 hover:text-white mb-4 transition"
            >
              <FaArrowLeft /> Back to Orphanage
            </Link>
            <div className="flex items-center justify-between">
              <div>
                <FaNewspaper className="text-4xl text-white/80 mb-2" />
                <h1 className="text-3xl md:text-4xl font-playfair font-bold text-white">
                  {orphanage?.name ? `${orphanage.name} — Posts` : 'Orphanage Posts'}
                </h1>
                <p className="text-cream-100/70 mt-1">Updates, stories, and moments from the orphanage</p>
              </div>
              {isOrphanageAdmin && (
                <Link
                  to="/posts/create"
                  className="flex items-center gap-2 px-5 py-3 bg-coral-500 text-white font-semibold rounded-xl hover:bg-coral-600 transition shadow-lg"
                >
                  <FaPlus /> New Post
                </Link>
              )}
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* Posts Grid */}
      <section className="py-12">
        <div className="container mx-auto px-6">
          {loading ? (
            <div className="flex justify-center py-20">
              <FaSpinner className="text-4xl text-teal-600 animate-spin" />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-20">
              <FaNewspaper className="text-6xl text-teal-300 dark:text-dark-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-teal-700 dark:text-cream-200">No posts yet</h3>
              <p className="text-teal-500 dark:text-cream-400 mt-1">
                {isOrphanageAdmin
                  ? 'Share your first update with the community!'
                  : 'This orphanage hasn\'t posted any updates yet.'}
              </p>
              {isOrphanageAdmin && (
                <Link
                  to="/posts/create"
                  className="inline-flex items-center gap-2 mt-4 px-5 py-2 bg-coral-500 text-white rounded-xl hover:bg-coral-600 transition"
                >
                  <FaPlus /> Create First Post
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {posts.map(post => (
                <PostCard
                  key={post._id}
                  post={post}
                  onUpdate={handlePostUpdate}
                  onDelete={handlePostDelete}
                />
              ))}

              {/* Pagination */}
              {pagination && pagination.pages > 1 && (
                <div className="flex justify-center gap-2 pt-4">
                  {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                        p === page
                          ? 'bg-teal-700 text-white'
                          : 'bg-white dark:bg-dark-700 text-teal-700 dark:text-cream-200 hover:bg-teal-50 dark:hover:bg-dark-600'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export default OrphanagePosts
