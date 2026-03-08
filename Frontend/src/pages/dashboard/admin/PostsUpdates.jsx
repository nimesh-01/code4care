import { useState, useEffect, useRef } from 'react'
import {
  FaImage, FaPenFancy, FaHeart, FaComment, FaTrash, FaEdit,
  FaCheck, FaTimes, FaSpinner, FaMagic, FaPlus, FaNewspaper, FaChartBar, FaVideo
} from 'react-icons/fa'
import { toast } from 'react-toastify'
import { useAuth } from '../../../context/AuthContext'
import { postAPI } from '../../../services/api'
import EngagementModal from '../../posts/EngagementModal'
import MediaCarousel from '../../posts/MediaCarousel'

const PostsUpdates = () => {
  const { user } = useAuth()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState(null)

  // Create post state
  const [showCreate, setShowCreate] = useState(false)
  const [mediaFiles, setMediaFiles] = useState([])
  const [mediaPreviews, setMediaPreviews] = useState([])
  const [caption, setCaption] = useState('')
  const [imageDescription, setImageDescription] = useState('')
  const [creating, setCreating] = useState(false)
  const [generatingCaption, setGeneratingCaption] = useState(false)
  const fileInputRef = useRef(null)

  // Edit state
  const [editingId, setEditingId] = useState(null)
  const [editCaption, setEditCaption] = useState('')

  // Engagement modal state
  const [engagementPostId, setEngagementPostId] = useState(null)

  useEffect(() => {
    if (user?.orphanageId) fetchPosts()
  }, [user?.orphanageId, page])

  const fetchPosts = async () => {
    try {
      setLoading(true)
      const res = await postAPI.getByOrphanage(user.orphanageId, { page, limit: 9 })
      setPosts(res.data.posts || [])
      setPagination(res.data.pagination)
    } catch (err) {
      console.error('Failed to load posts:', err)
      toast.error('Failed to load posts')
    } finally {
      setLoading(false)
    }
  }

  // --- Create post ---
  const handleMediaChange = (e) => {
    const selected = Array.from(e.target.files)
    if (!selected.length) return

    const total = mediaFiles.length + selected.length
    if (total > 10) { toast.error('Maximum 10 files per post'); return }

    const valid = []
    for (const file of selected) {
      const isImage = file.type.startsWith('image/')
      const isVideo = file.type.startsWith('video/')
      if (!isImage && !isVideo) { toast.error(`${file.name}: Only image and video files allowed`); continue }
      if (isImage && file.size > 5 * 1024 * 1024) { toast.error(`${file.name}: Images must be under 5MB`); continue }
      if (isVideo && file.size > 50 * 1024 * 1024) { toast.error(`${file.name}: Videos must be under 50MB`); continue }
      valid.push(file)
    }

    if (valid.length === 0) return

    const newPreviews = valid.map(file => ({
      url: URL.createObjectURL(file),
      type: file.type.startsWith('video/') ? 'video' : 'image',
      name: file.name
    }))

    setMediaFiles(prev => [...prev, ...valid])
    setMediaPreviews(prev => [...prev, ...newPreviews])
    // Reset input so same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removeMedia = (index) => {
    URL.revokeObjectURL(mediaPreviews[index].url)
    setMediaFiles(prev => prev.filter((_, i) => i !== index))
    setMediaPreviews(prev => prev.filter((_, i) => i !== index))
  }

  const handleGenerateCaption = async () => {
    if (!imageDescription.trim()) { toast.warn('Describe the image first'); return }
    try {
      setGeneratingCaption(true)
      const res = await postAPI.generateCaption(imageDescription.trim())
      setCaption(res.data.caption)
      toast.success('Caption generated!')
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to generate caption') }
    finally { setGeneratingCaption(false) }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (mediaFiles.length === 0) { toast.warn('Select at least one image or video'); return }
    try {
      setCreating(true)
      const formData = new FormData()
      mediaFiles.forEach(file => formData.append('media', file))
      formData.append('caption', caption)
      await postAPI.create(formData)
      toast.success('Post published!')
      resetCreateForm()
      fetchPosts()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create post')
    } finally { setCreating(false) }
  }

  const resetCreateForm = () => {
    setShowCreate(false)
    mediaPreviews.forEach(p => URL.revokeObjectURL(p.url))
    setMediaFiles([])
    setMediaPreviews([])
    setCaption('')
    setImageDescription('')
  }

  // --- Edit ---
  const startEdit = (post) => { setEditingId(post._id); setEditCaption(post.caption || '') }
  const cancelEdit = () => { setEditingId(null); setEditCaption('') }

  const saveEdit = async (id) => {
    try {
      await postAPI.edit(id, { caption: editCaption })
      toast.success('Post updated')
      setPosts(prev => prev.map(p => p._id === id ? { ...p, caption: editCaption } : p))
      cancelEdit()
    } catch { toast.error('Failed to update post') }
  }

  // --- Delete ---
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this post permanently?')) return
    try {
      await postAPI.delete(id)
      toast.success('Post deleted')
      setPosts(prev => prev.filter(p => p._id !== id))
    } catch { toast.error('Failed to delete post') }
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-teal-500 dark:text-cream-300">Updates</p>
          <h2 className="text-3xl font-semibold text-teal-900 dark:text-cream-50">Stories & impact posts</h2>
          <p className="text-sm text-teal-600 dark:text-cream-400">Share verified updates with donors, volunteers, and the SoulConnect community.</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-coral-500 to-coral-600 px-5 py-3 text-sm font-semibold text-white shadow-lg hover:from-coral-600 hover:to-coral-700 transition"
        >
          {showCreate ? <><FaTimes /> Cancel</> : <><FaPlus /> New Post</>}
        </button>
      </header>

      {/* Create Post Form */}
      {showCreate && (
        <form onSubmit={handleCreate} className="rounded-2xl border border-cream-200 dark:border-dark-700 bg-white dark:bg-dark-800 p-6 space-y-5 shadow-sm">
          {/* Media upload area */}
          {mediaPreviews.length > 0 ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {mediaPreviews.map((preview, idx) => (
                  <div key={idx} className="relative group rounded-xl overflow-hidden aspect-square bg-black">
                    {preview.type === 'video' ? (
                      <video src={preview.url} muted className="w-full h-full object-cover" />
                    ) : (
                      <img src={preview.url} alt={preview.name} className="w-full h-full object-cover" />
                    )}
                    {preview.type === 'video' && (
                      <div className="absolute top-2 left-2 bg-black/60 text-white px-1.5 py-0.5 rounded text-xs flex items-center gap-1">
                        <FaVideo size={10} /> Video
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => removeMedia(idx)}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-600 transition"
                    >
                      <FaTimes size={10} />
                    </button>
                  </div>
                ))}
                {/* Add more button */}
                {mediaPreviews.length < 10 && (
                  <label className="flex flex-col items-center justify-center aspect-square border-2 border-dashed border-teal-300 dark:border-dark-600 rounded-xl cursor-pointer hover:bg-cream-50 dark:hover:bg-dark-700 transition">
                    <FaPlus className="text-xl text-teal-400 mb-1" />
                    <span className="text-xs text-teal-500 dark:text-cream-400">Add more</span>
                    <input type="file" accept="image/*,video/*" multiple onChange={handleMediaChange} className="hidden" />
                  </label>
                )}
              </div>
              <p className="text-xs text-teal-500 dark:text-cream-400">{mediaPreviews.length}/10 files • Images: max 5MB • Videos: max 50MB</p>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-teal-300 dark:border-dark-600 rounded-xl cursor-pointer hover:bg-cream-50 dark:hover:bg-dark-700 transition">
              <div className="flex items-center gap-3 mb-2">
                <FaImage className="text-3xl text-teal-400" />
                <FaVideo className="text-3xl text-teal-400" />
              </div>
              <span className="text-sm text-teal-600 dark:text-cream-300">Click to upload photos & videos</span>
              <span className="text-xs text-teal-400 dark:text-cream-400 mt-1">Up to 10 files • Images: 5MB • Videos: 50MB</span>
              <input ref={fileInputRef} type="file" accept="image/*,video/*" multiple onChange={handleMediaChange} className="hidden" />
            </label>
          )}

          {/* AI caption helper */}
          <div className="bg-cream-50 dark:bg-dark-700 rounded-xl p-4 space-y-3">
            <label className="block text-sm font-semibold text-teal-800 dark:text-cream-100">
              <FaMagic className="inline mr-2 text-coral-500" />AI Caption Generator
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Describe the image..."
                value={imageDescription}
                onChange={(e) => setImageDescription(e.target.value)}
                className="flex-1 px-3 py-2 bg-white dark:bg-dark-600 border border-cream-200 dark:border-dark-500 rounded-lg text-sm text-teal-900 dark:text-cream-50 placeholder-teal-400 dark:placeholder-cream-400 focus:outline-none focus:ring-2 focus:ring-coral-500 transition"
              />
              <button
                type="button"
                onClick={handleGenerateCaption}
                disabled={generatingCaption}
                className="inline-flex items-center gap-2 px-4 py-2 bg-coral-500 text-white text-sm rounded-lg hover:bg-coral-600 disabled:opacity-50 transition"
              >
                {generatingCaption ? <FaSpinner className="animate-spin" /> : <FaMagic />}
                Generate
              </button>
            </div>
          </div>

          {/* Caption field */}
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Write a caption..."
            rows={3}
            maxLength={2000}
            className="w-full px-4 py-3 bg-cream-50 dark:bg-dark-700 border border-cream-200 dark:border-dark-600 rounded-xl text-teal-900 dark:text-cream-50 placeholder-teal-400 dark:placeholder-cream-400 focus:outline-none focus:ring-2 focus:ring-coral-500 resize-none transition text-sm"
          />

          <button
            type="submit"
            disabled={creating || mediaFiles.length === 0}
            className="inline-flex items-center gap-2 px-6 py-3 bg-teal-700 text-white font-semibold rounded-xl hover:bg-teal-800 disabled:opacity-50 transition"
          >
            {creating ? <FaSpinner className="animate-spin" /> : <FaPenFancy />}
            {creating ? 'Publishing...' : 'Publish Post'}
          </button>
        </form>
      )}

      {/* Posts Grid */}
      {loading ? (
        <div className="flex justify-center py-16">
          <FaSpinner className="text-3xl text-teal-600 dark:text-coral-400 animate-spin" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16">
          <FaNewspaper className="text-5xl text-teal-300 dark:text-dark-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-teal-700 dark:text-cream-200">No posts yet</h3>
          <p className="text-teal-500 dark:text-cream-400 mt-1">Click "New Post" to share your first update!</p>
        </div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {posts.map((post) => (
              <article key={post._id} className="rounded-2xl border border-cream-200 dark:border-dark-700 bg-white dark:bg-dark-800 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
                {/* Media */}
                <div className="overflow-hidden bg-black">
                  <MediaCarousel media={post.media} imageUrl={post.imageUrl} />
                </div>

                <div className="p-5 space-y-3">
                  {/* Caption / Edit */}
                  {editingId === post._id ? (
                    <div className="space-y-2">
                      <textarea
                        value={editCaption}
                        onChange={(e) => setEditCaption(e.target.value)}
                        rows={3}
                        maxLength={2000}
                        className="w-full px-3 py-2 bg-cream-50 dark:bg-dark-700 border border-cream-200 dark:border-dark-600 rounded-lg text-sm text-teal-900 dark:text-cream-50 focus:outline-none focus:ring-2 focus:ring-coral-500 resize-none transition"
                      />
                      <div className="flex gap-2">
                        <button onClick={() => saveEdit(post._id)} className="inline-flex items-center gap-1 px-3 py-1 bg-teal-700 text-white text-xs rounded-lg hover:bg-teal-800 transition">
                          <FaCheck /> Save
                        </button>
                        <button onClick={cancelEdit} className="inline-flex items-center gap-1 px-3 py-1 bg-cream-200 dark:bg-dark-600 text-teal-800 dark:text-cream-200 text-xs rounded-lg hover:bg-cream-300 dark:hover:bg-dark-500 transition">
                          <FaTimes /> Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-teal-800 dark:text-cream-100 line-clamp-3">{post.caption || <span className="italic text-teal-400 dark:text-cream-400">No caption</span>}</p>
                  )}

                  {/* Date */}
                  <p className="text-xs text-teal-500 dark:text-cream-400">{formatDate(post.createdAt)}</p>

                  {/* Stats — clickable to view engagement */}
                  <div className="flex items-center gap-4 text-xs text-teal-600 dark:text-cream-300">
                    <button onClick={() => setEngagementPostId(post._id)} className="inline-flex items-center gap-1 hover:text-red-500 transition" title="View who liked">
                      <FaHeart className="text-red-400" /> {post.likes?.length || 0}
                    </button>
                    <button onClick={() => setEngagementPostId(post._id)} className="inline-flex items-center gap-1 hover:text-teal-700 dark:hover:text-cream-100 transition" title="View who commented">
                      <FaComment className="text-teal-400" /> {post.comments?.length || 0}
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t border-cream-100 dark:border-dark-700">
                    <button
                      onClick={() => setEngagementPostId(post._id)}
                      className="inline-flex items-center gap-1 rounded-lg border border-teal-200 dark:border-teal-900/40 px-3 py-1.5 text-xs text-teal-600 dark:text-cream-300 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition"
                      title="View engagement"
                    >
                      <FaChartBar /> Engagement
                    </button>
                    <button
                      onClick={() => startEdit(post)}
                      className="inline-flex items-center gap-1 rounded-lg border border-cream-200 dark:border-dark-600 px-3 py-1.5 text-xs text-teal-700 dark:text-cream-200 hover:bg-cream-50 dark:hover:bg-dark-700 transition"
                    >
                      <FaEdit /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(post._id)}
                      className="inline-flex items-center gap-1 rounded-lg border border-red-200 dark:border-red-900/40 px-3 py-1.5 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                    >
                      <FaTrash /> Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>

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
                      : 'bg-white dark:bg-dark-700 text-teal-700 dark:text-cream-200 border border-cream-200 dark:border-dark-600 hover:bg-cream-50 dark:hover:bg-dark-600'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* Engagement Modal */}
      {engagementPostId && (
        <EngagementModal
          postId={engagementPostId}
          onClose={() => setEngagementPostId(null)}
        />
      )}

      {/* Tips section */}
      <section className="rounded-2xl border border-cream-200 dark:border-dark-700 bg-white dark:bg-dark-800 p-6">
        <h3 className="text-xl font-semibold text-teal-900 dark:text-cream-50">Content tips</h3>
        <ul className="mt-4 list-disc space-y-2 pl-6 text-sm text-teal-600 dark:text-cream-300">
          <li>Always pair posts with photos, receipts, or progress updates.</li>
          <li>Use the AI caption generator for quick, heartfelt captions.</li>
          <li>Post regularly to keep donors and volunteers engaged.</li>
        </ul>
      </section>
    </div>
  )
}

export default PostsUpdates
