import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaImage, FaMagic, FaTimes, FaSpinner, FaPlus, FaVideo } from 'react-icons/fa'
import { toast } from 'react-toastify'
import Navbar from '../../components/Navbar'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import { postAPI } from '../../services/api'

const CreatePost = () => {
  const navigate = useNavigate()
  const { isDarkMode } = useTheme()
  const { user } = useAuth()
  const [caption, setCaption] = useState('')
  const [mediaFiles, setMediaFiles] = useState([])
  const [mediaPreviews, setMediaPreviews] = useState([])
  const [imageDescription, setImageDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [generatingCaption, setGeneratingCaption] = useState(false)

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
  }

  const removeMedia = (index) => {
    URL.revokeObjectURL(mediaPreviews[index].url)
    setMediaFiles(prev => prev.filter((_, i) => i !== index))
    setMediaPreviews(prev => prev.filter((_, i) => i !== index))
  }

  const handleGenerateCaption = async () => {
    if (!imageDescription.trim()) {
      toast.warn('Please describe the image first')
      return
    }
    try {
      setGeneratingCaption(true)
      const res = await postAPI.generateCaption(imageDescription.trim())
      setCaption(res.data.caption)
      toast.success('Caption generated!')
    } catch (err) {
      console.error('Caption generation error:', err)
      toast.error(err.response?.data?.message || 'Failed to generate caption')
    } finally {
      setGeneratingCaption(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (mediaFiles.length === 0) {
      toast.warn('Please select at least one image or video')
      return
    }
    try {
      setLoading(true)
      const formData = new FormData()
      mediaFiles.forEach(file => formData.append('media', file))
      formData.append('caption', caption)
      await postAPI.create(formData)
      toast.success('Post created successfully!')
      navigate(`/orphanage/${user.orphanageId}`)
    } catch (err) {
      console.error('Create post error:', err)
      toast.error(err.response?.data?.message || 'Failed to create post')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream-50 dark:bg-dark-900 transition-colors duration-300">
      <Navbar />

      <section className="pt-32 pb-16 bg-gradient-to-br from-teal-700 to-teal-900 dark:from-dark-800 dark:to-dark-950">
        <div className="container mx-auto px-6 text-center">
          <FaImage className="text-5xl text-white/80 mx-auto mb-4" />
          <h1 className="text-4xl font-playfair font-bold text-white mb-2">Create Post</h1>
          <p className="text-lg text-cream-100/80">Share updates and stories from your orphanage</p>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-6 max-w-2xl">
          <form onSubmit={handleSubmit} className="bg-white dark:bg-dark-800 rounded-2xl shadow-lg p-8 space-y-6">

            {/* Media Upload */}
            <div>
              <label className="block text-sm font-semibold text-teal-800 dark:text-cream-100 mb-2">
                Photos & Videos *
              </label>
              {mediaPreviews.length > 0 ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
                    {mediaPreviews.length < 10 && (
                      <label className="flex flex-col items-center justify-center aspect-square border-2 border-dashed border-teal-300 dark:border-dark-600 rounded-xl cursor-pointer hover:bg-cream-100 dark:hover:bg-dark-700 transition">
                        <FaPlus className="text-xl text-teal-400 mb-1" />
                        <span className="text-xs text-teal-500 dark:text-cream-400">Add more</span>
                        <input type="file" accept="image/*,video/*" multiple onChange={handleMediaChange} className="hidden" />
                      </label>
                    )}
                  </div>
                  <p className="text-xs text-teal-400 dark:text-cream-400">{mediaPreviews.length}/10 files • Images: max 5MB • Videos: max 50MB</p>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-teal-300 dark:border-dark-600 rounded-xl cursor-pointer hover:bg-cream-100 dark:hover:bg-dark-700 transition">
                  <div className="flex items-center gap-3 mb-2">
                    <FaImage className="text-4xl text-teal-400" />
                    <FaVideo className="text-4xl text-teal-400" />
                  </div>
                  <span className="text-teal-600 dark:text-cream-300">Click to upload photos & videos</span>
                  <span className="text-xs text-teal-400 dark:text-cream-400 mt-1">Up to 10 files • Images: 5MB • Videos: 50MB</span>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    onChange={handleMediaChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* AI Caption Generator */}
            <div className="bg-cream-50 dark:bg-dark-700 rounded-xl p-4 space-y-3">
              <label className="block text-sm font-semibold text-teal-800 dark:text-cream-100">
                <FaMagic className="inline mr-2 text-coral-500" />
                AI Caption Generator
              </label>
              <input
                type="text"
                placeholder="Describe the image (e.g., children playing football)"
                value={imageDescription}
                onChange={(e) => setImageDescription(e.target.value)}
                className="w-full px-4 py-2 bg-white dark:bg-dark-600 border border-cream-200 dark:border-dark-500 rounded-lg text-teal-900 dark:text-cream-50 placeholder-teal-400 dark:placeholder-cream-400 focus:outline-none focus:ring-2 focus:ring-coral-500 transition"
              />
              <button
                type="button"
                onClick={handleGenerateCaption}
                disabled={generatingCaption}
                className="flex items-center gap-2 px-4 py-2 bg-coral-500 text-white rounded-lg hover:bg-coral-600 disabled:opacity-50 transition"
              >
                {generatingCaption ? <FaSpinner className="animate-spin" /> : <FaMagic />}
                {generatingCaption ? 'Generating...' : 'Generate Caption'}
              </button>
            </div>

            {/* Caption */}
            <div>
              <label className="block text-sm font-semibold text-teal-800 dark:text-cream-100 mb-2">Caption</label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Write a caption for your post..."
                rows={4}
                maxLength={2000}
                className="w-full px-4 py-3 bg-cream-50 dark:bg-dark-700 border border-cream-200 dark:border-dark-600 rounded-xl text-teal-900 dark:text-cream-50 placeholder-teal-400 dark:placeholder-cream-400 focus:outline-none focus:ring-2 focus:ring-coral-500 resize-none transition"
              />
              <p className="text-xs text-teal-400 dark:text-cream-400 mt-1 text-right">{caption.length}/2000</p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || mediaFiles.length === 0}
              className="w-full py-3 bg-teal-700 text-white font-semibold rounded-xl hover:bg-teal-800 disabled:opacity-50 transition flex items-center justify-center gap-2"
            >
              {loading ? <FaSpinner className="animate-spin" /> : null}
              {loading ? 'Publishing...' : 'Publish Post'}
            </button>
          </form>
        </div>
      </section>
    </div>
  )
}

export default CreatePost
