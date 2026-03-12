import { useState, useEffect, useCallback } from 'react'
import { FaSearch, FaBuilding, FaTrash, FaEye, FaFileAlt, FaImage, FaVideo } from 'react-icons/fa'
import { superAdminAPI, postAPI, eventAPI } from '../../../services/api'

const SAContentModeration = () => {
  const [orphanages, setOrphanages] = useState([])
  const [selectedOrphanage, setSelectedOrphanage] = useState(null)
  const [posts, setPosts] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [contentLoading, setContentLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('posts')

  const fetchOrphanages = useCallback(async () => {
    try {
      setLoading(true)
      const params = { status: 'approved', limit: 100 }
      if (search) params.search = search
      const res = await superAdminAPI.getOrphanages(params)
      setOrphanages(res.data.orphanages || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => { fetchOrphanages() }, [fetchOrphanages])

  const fetchContent = async (orphanageId) => {
    try {
      setContentLoading(true)
      const [postsRes, eventsRes] = await Promise.all([
        postAPI.getByOrphanage(orphanageId, { limit: 50 }).catch(() => ({ data: { posts: [] } })),
        eventAPI.getAll({ orphanageId }).catch(() => ({ data: { events: [] } })),
      ])
      setPosts(postsRes.data.posts || postsRes.data || [])
      setEvents(eventsRes.data.events || eventsRes.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setContentLoading(false)
    }
  }

  const handleSelectOrphanage = (org) => {
    setSelectedOrphanage(org)
    fetchContent(org._id)
  }

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Delete this post? This action cannot be undone.')) return
    try {
      await postAPI.delete(postId)
      setPosts(prev => prev.filter(p => p._id !== postId))
    } catch (err) {
      console.error(err)
    }
  }

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Delete this event? This action cannot be undone.')) return
    try {
      await eventAPI.delete(eventId)
      setEvents(prev => prev.filter(e => e._id !== eventId))
    } catch (err) {
      console.error(err)
    }
  }

  if (selectedOrphanage) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => { setSelectedOrphanage(null); setPosts([]); setEvents([]) }}
            className="text-sm text-teal-600 dark:text-cream-300 hover:text-coral-500 transition"
          >
            &larr; Back
          </button>
          <div>
            <h3 className="font-semibold text-teal-900 dark:text-cream-50">{selectedOrphanage.name}</h3>
            <p className="text-xs text-teal-500 dark:text-cream-400">Content from this orphanage</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-cream-200 dark:border-dark-700 pb-2">
          {['posts', 'events'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-t-lg text-sm font-medium transition ${
                activeTab === tab
                  ? 'bg-white dark:bg-dark-800 text-coral-500 border border-b-0 border-cream-200 dark:border-dark-700'
                  : 'text-teal-600 dark:text-cream-400 hover:text-coral-500'
              }`}
            >
              {tab === 'posts' ? `Posts (${posts.length})` : `Events (${events.length})`}
            </button>
          ))}
        </div>

        {contentLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-coral-500" />
          </div>
        ) : activeTab === 'posts' ? (
          posts.length === 0 ? (
            <div className="text-center py-16">
              <FaFileAlt className="text-5xl text-teal-300 dark:text-dark-600 mx-auto mb-4" />
              <p className="text-teal-600 dark:text-cream-400">No posts from this orphanage</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {posts.map((post) => {
                const imgUrl = post.media?.[0]?.url || post.imageUrl
                const isVideo = post.media?.[0]?.type === 'video'
                return (
                  <div key={post._id} className="rounded-xl border border-cream-200 dark:border-dark-700 bg-white dark:bg-dark-800 overflow-hidden flex flex-col">
                    {imgUrl && (
                      <div className="aspect-video bg-cream-100 dark:bg-dark-700 overflow-hidden">
                        {isVideo ? (
                          <video src={imgUrl} className="w-full h-full object-cover" muted />
                        ) : (
                          <img src={imgUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
                        )}
                      </div>
                    )}
                    <div className="p-4 space-y-2 flex-1 flex flex-col">
                      <p className="text-sm text-teal-900 dark:text-cream-50 line-clamp-3 flex-1">{post.content || post.caption}</p>
                      {post.media?.length > 1 && (
                        <p className="text-[10px] text-teal-400 dark:text-cream-400/60">+{post.media.length - 1} more media</p>
                      )}
                      <div className="flex items-center justify-between pt-2 border-t border-cream-100 dark:border-dark-700">
                        <p className="text-xs text-teal-500 dark:text-cream-400">
                          {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : ''}
                        </p>
                        <button
                          onClick={() => handleDeletePost(post._id)}
                          className="flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-600 transition"
                        >
                          <FaTrash /> Remove
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        ) : (
          events.length === 0 ? (
            <div className="text-center py-16">
              <FaFileAlt className="text-5xl text-teal-300 dark:text-dark-600 mx-auto mb-4" />
              <p className="text-teal-600 dark:text-cream-400">No events from this orphanage</p>
            </div>
          ) : (
            <div className="space-y-3">
              {events.map((event) => (
                <div key={event._id} className="rounded-xl border border-cream-200 dark:border-dark-700 bg-white dark:bg-dark-800 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-teal-900 dark:text-cream-50">{event.title}</h4>
                      <p className="text-xs text-teal-500 dark:text-cream-400 mt-1 line-clamp-2">{event.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-teal-400 dark:text-cream-400/70">
                        <span>{event.category}</span>
                        <span>{new Date(event.eventDate).toLocaleDateString()}</span>
                        <span className="capitalize">{event.status}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteEvent(event._id)}
                      className="flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-600 transition shrink-0"
                    >
                      <FaTrash /> Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-teal-900 dark:text-cream-50 font-playfair">Content Moderation</h2>
        <p className="text-sm text-teal-600 dark:text-cream-400">Monitor and moderate content from orphanages</p>
      </div>

      <div className="relative">
        <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-teal-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search orphanages..."
          className="input-field pl-11"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-coral-500" />
        </div>
      ) : orphanages.length === 0 ? (
        <div className="text-center py-16">
          <FaBuilding className="text-5xl text-teal-300 dark:text-dark-600 mx-auto mb-4" />
          <p className="text-teal-600 dark:text-cream-400">No orphanages found</p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {orphanages.map((org) => (
            <button
              key={org._id}
              onClick={() => handleSelectOrphanage(org)}
              className="text-left rounded-xl border border-cream-200 dark:border-dark-700 bg-white dark:bg-dark-800 p-4 hover:shadow-md hover:border-coral-300 dark:hover:border-coral-500/40 transition-all duration-200"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-500/10">
                  <FaBuilding className="text-teal-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-teal-900 dark:text-cream-50 truncate">{org.name}</p>
                  <p className="text-xs text-teal-500 dark:text-cream-400">{org.address?.city}, {org.address?.state}</p>
                </div>
                <FaEye className="text-teal-400" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default SAContentModeration
