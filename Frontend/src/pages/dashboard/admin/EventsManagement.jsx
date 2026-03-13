import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  FaCalendarPlus,
  FaPeopleCarry,
  FaClipboardList,
  FaTimes,
  FaEdit,
  FaTrash,
  FaUsers,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaRedo,
  FaExternalLinkAlt,
  FaBell,
} from 'react-icons/fa'
import { MdEvent } from 'react-icons/md'
import { toast } from 'react-toastify'
import { eventAPI, authAPI } from '../../../services/api'
import { annotateEventStatus } from '../../../utils/eventStatus'
import { useAuth } from '../../../context/AuthContext'
import { ScrollReveal } from '../../../hooks/useScrollReveal'

const categoryColors = {
  Education: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200',
  Health: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200',
  Fundraising: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200',
  Cultural: 'bg-pink-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-200',
  Other: 'bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-200',
}

const statusBadge = {
  upcoming: 'bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-200',
  ongoing: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-200',
  past: 'bg-slate-200 text-slate-700 dark:bg-slate-600/40 dark:text-slate-200',
  completed: 'bg-slate-100 text-slate-600 dark:bg-slate-600/30 dark:text-slate-300',
  cancelled: 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300',
}

const categories = ['Education', 'Health', 'Fundraising', 'Cultural', 'Other']
const statuses = ['upcoming', 'ongoing', 'past', 'completed', 'cancelled']

const formatDate = (value) => {
  if (!value) return 'TBD'
  const d = new Date(value)
  if (isNaN(d.getTime())) return 'TBD'
  return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
}

const formatISODate = (value) => {
  if (!value) return ''
  const d = new Date(value)
  if (isNaN(d.getTime())) return ''
  return d.toISOString().slice(0, 10)
}

const CreateEditModal = ({ event, onClose, onSaved }) => {
  const isEdit = !!event
  const [form, setForm] = useState({
    title: event?.title || '',
    description: event?.description || '',
    category: event?.category || 'Education',
    eventDate: formatISODate(event?.eventDate) || '',
    eventTime: event?.eventTime || '',
    eventLocation: event?.eventLocation || '',
    requiredVolunteers: event?.requiredVolunteers || 0,
    maxParticipants: event?.maxParticipants || 0,
    status: event?.status || 'upcoming',
  })
  const [image, setImage] = useState(null)
  const [saving, setSaving] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const formData = new FormData()
      Object.entries(form).forEach(([key, val]) => formData.append(key, val))
      if (image) formData.append('image', image)

      if (isEdit) {
        await eventAPI.update(event._id, formData)
        toast.success('Event updated successfully')
      } else {
        await eventAPI.create(formData)
        toast.success('Event created successfully')
      }
      onSaved()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Failed to save event')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={onClose}>
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-8 shadow-2xl dark:bg-dark-900"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-teal-900 dark:text-cream-50">
            {isEdit ? 'Edit Event' : 'Create Event'}
          </h2>
          <button onClick={onClose} className="text-teal-700 hover:text-coral-500 dark:text-cream-100">
            <FaTimes className="text-xl" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-teal-700 dark:text-cream-200 mb-1">Title *</label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              minLength={3}
              className="w-full rounded-xl border border-cream-200 bg-cream-50 px-4 py-3 text-teal-900 focus:border-coral-400 focus:outline-none dark:border-dark-600 dark:bg-dark-800 dark:text-cream-50"
              placeholder="Event title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-teal-700 dark:text-cream-200 mb-1">Description *</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              required
              minLength={10}
              rows={3}
              className="w-full rounded-xl border border-cream-200 bg-cream-50 px-4 py-3 text-teal-900 focus:border-coral-400 focus:outline-none dark:border-dark-600 dark:bg-dark-800 dark:text-cream-50"
              placeholder="Describe the event..."
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-teal-700 dark:text-cream-200 mb-1">Category *</label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className="w-full rounded-xl border border-cream-200 bg-cream-50 px-4 py-3 text-teal-900 focus:border-coral-400 focus:outline-none dark:border-dark-600 dark:bg-dark-800 dark:text-cream-50"
              >
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            {isEdit && (
              <div>
                <label className="block text-sm font-medium text-teal-700 dark:text-cream-200 mb-1">Status</label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-cream-200 bg-cream-50 px-4 py-3 text-teal-900 focus:border-coral-400 focus:outline-none dark:border-dark-600 dark:bg-dark-800 dark:text-cream-50"
                >
                  {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-teal-700 dark:text-cream-200 mb-1">Event Date *</label>
              <input
                type="date"
                name="eventDate"
                value={form.eventDate}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-cream-200 bg-cream-50 px-4 py-3 text-teal-900 focus:border-coral-400 focus:outline-none dark:border-dark-600 dark:bg-dark-800 dark:text-cream-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-teal-700 dark:text-cream-200 mb-1">Event Time</label>
              <input
                type="time"
                name="eventTime"
                value={form.eventTime}
                onChange={handleChange}
                className="w-full rounded-xl border border-cream-200 bg-cream-50 px-4 py-3 text-teal-900 focus:border-coral-400 focus:outline-none dark:border-dark-600 dark:bg-dark-800 dark:text-cream-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-teal-700 dark:text-cream-200 mb-1">Location *</label>
            <input
              name="eventLocation"
              value={form.eventLocation}
              onChange={handleChange}
              required
              minLength={3}
              className="w-full rounded-xl border border-cream-200 bg-cream-50 px-4 py-3 text-teal-900 focus:border-coral-400 focus:outline-none dark:border-dark-600 dark:bg-dark-800 dark:text-cream-50"
              placeholder="Event location"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-teal-700 dark:text-cream-200 mb-1">Required Volunteers</label>
              <input
                type="number"
                name="requiredVolunteers"
                value={form.requiredVolunteers}
                onChange={handleChange}
                min={0}
                className="w-full rounded-xl border border-cream-200 bg-cream-50 px-4 py-3 text-teal-900 focus:border-coral-400 focus:outline-none dark:border-dark-600 dark:bg-dark-800 dark:text-cream-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-teal-700 dark:text-cream-200 mb-1">Max Participants</label>
              <input
                type="number"
                name="maxParticipants"
                value={form.maxParticipants}
                onChange={handleChange}
                min={0}
                className="w-full rounded-xl border border-cream-200 bg-cream-50 px-4 py-3 text-teal-900 focus:border-coral-400 focus:outline-none dark:border-dark-600 dark:bg-dark-800 dark:text-cream-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-teal-700 dark:text-cream-200 mb-1">Event Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={e => setImage(e.target.files[0])}
              className="w-full text-sm text-teal-700 dark:text-cream-200 file:mr-4 file:rounded-full file:border-0 file:bg-coral-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-coral-700 hover:file:bg-coral-100 dark:file:bg-coral-500/20 dark:file:text-coral-200"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-cream-200 px-6 py-2 text-sm font-medium text-teal-700 hover:bg-cream-50 dark:border-dark-600 dark:text-cream-200 dark:hover:bg-dark-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-coral-500 px-6 py-2 text-sm font-medium text-white hover:bg-coral-600 disabled:opacity-70 transition"
            >
              {saving ? 'Saving...' : isEdit ? 'Update Event' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const ParticipantsModal = ({ event, onClose }) => {
  const [participants, setParticipants] = useState([])
  const [userDetails, setUserDetails] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchParticipants = async () => {
      try {
        const res = await eventAPI.getParticipants(event._id)
        const list = res.data?.participants || []
        setParticipants(list)

        // Fetch user details
        const ids = list.map(p => p.participantId).filter(Boolean)
        if (ids.length) {
          try {
            const batchRes = await authAPI.getUsersBatch(ids)
            const users = batchRes.data?.users || batchRes.data || []
            const map = {}
            users.forEach(u => { map[u._id || u.id] = u })
            setUserDetails(map)
          } catch (e) {
            console.warn('Failed to fetch user details:', e.message)
          }
        }
      } catch (err) {
        toast.error('Failed to load participants')
      } finally {
        setLoading(false)
      }
    }
    fetchParticipants()
  }, [event._id])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={onClose}>
      <div
        className="w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-3xl bg-white p-8 shadow-2xl dark:bg-dark-900"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs uppercase tracking-wide text-teal-500">Participants</p>
            <h2 className="text-xl font-bold text-teal-900 dark:text-cream-50">{event.title}</h2>
          </div>
          <button onClick={onClose} className="text-teal-700 hover:text-coral-500 dark:text-cream-100">
            <FaTimes className="text-xl" />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="h-10 w-10 animate-spin rounded-full border-b-4 border-t-4 border-coral-500" />
          </div>
        ) : participants.length === 0 ? (
          <p className="text-center text-teal-600 dark:text-cream-300 py-6">No participants yet.</p>
        ) : (
          <div className="space-y-3">
            {participants.map((p, i) => {
              const u = userDetails[p.participantId]
              const name = u
                ? `${u.fullname?.firstname || ''} ${u.fullname?.lastname || ''}`.trim() || u.email
                : p.participantId
              return (
                <div key={i} className="flex items-center justify-between rounded-xl border border-cream-200 bg-cream-50 p-4 dark:border-dark-700 dark:bg-dark-800">
                  <div>
                    <Link
                      to={`/participants/${p.participantId}`}
                      className="font-medium text-teal-900 hover:text-coral-500 dark:text-cream-50 dark:hover:text-coral-400 inline-flex items-center gap-1.5 transition"
                    >
                      {name}
                      <FaExternalLinkAlt className="text-[10px] opacity-50" />
                    </Link>
                    <p className="text-xs text-teal-500">{p.role} • Joined {formatDate(p.joinedAt)}</p>
                    {u?.email && <p className="text-xs text-teal-400 dark:text-cream-400">{u.email}</p>}
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${p.role === 'volunteer' ? 'bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-200' : 'bg-coral-100 text-coral-700 dark:bg-coral-500/20 dark:text-coral-200'}`}>
                    {p.role}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

const SendReminderModal = ({ event, onClose }) => {
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  const handleSend = async (e) => {
    e.preventDefault()
    setSending(true)
    try {
      await eventAPI.sendReminder(event._id, { message: message.trim() || undefined })
      toast.success(`Reminder sent to ${event.participants?.length || 0} participants`)
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send reminder')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-2xl dark:bg-dark-900"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs uppercase tracking-wide text-teal-500">Send Reminder</p>
            <h2 className="text-xl font-bold text-teal-900 dark:text-cream-50">{event.title}</h2>
            <p className="text-sm text-teal-500 mt-1">{event.participants?.length || 0} participant(s) will be notified</p>
          </div>
          <button onClick={onClose} className="text-teal-700 hover:text-coral-500 dark:text-cream-100">
            <FaTimes className="text-xl" />
          </button>
        </div>

        <form onSubmit={handleSend} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-teal-700 dark:text-cream-200 mb-1">Custom Message (optional)</label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={3}
              maxLength={500}
              className="w-full rounded-xl border border-cream-200 bg-cream-50 px-4 py-3 text-teal-900 focus:border-coral-400 focus:outline-none dark:border-dark-600 dark:bg-dark-800 dark:text-cream-50"
              placeholder={`Reminder: "${event.title}" is coming up on ${formatDate(event.eventDate)}...`}
            />
            <p className="text-xs text-teal-400 mt-1">Leave empty to send a default reminder about the event date.</p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-cream-200 px-6 py-2 text-sm font-medium text-teal-700 hover:bg-cream-50 dark:border-dark-600 dark:text-cream-200 dark:hover:bg-dark-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={sending || !event.participants?.length}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-coral-500 to-teal-500 px-6 py-2 text-sm font-medium text-white disabled:opacity-70 transition"
            >
              <FaBell className="text-xs" /> {sending ? 'Sending...' : 'Send Reminder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const EventsManagement = () => {
  const { user } = useAuth()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [editEvent, setEditEvent] = useState(null)
  const [participantsEvent, setParticipantsEvent] = useState(null)
  const [reminderEvent, setReminderEvent] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [viewFilter, setViewFilter] = useState('upcoming')

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const res = await eventAPI.getAll()
      const rawEvents = res.data?.events || res.data || []
      setEvents(rawEvents.map((event) => annotateEventStatus(event)))
    } catch (err) {
      toast.error('Failed to load events')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [])

  const handleDelete = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return
    try {
      setDeletingId(eventId)
      await eventAPI.delete(eventId)
      toast.success('Event deleted')
      fetchEvents()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete event')
    } finally {
      setDeletingId(null)
    }
  }

  const stats = useMemo(() => ({
    total: events.length,
    upcoming: events.filter(e => e.status === 'upcoming').length,
    completed: events.filter(e => ['completed', 'past'].includes(e.status)).length,
    totalParticipants: events.reduce((sum, e) => sum + (e.participants?.length || 0), 0),
  }), [events])

  const filteredEvents = useMemo(() => {
    if (viewFilter === 'past') {
      return events.filter((event) => ['past', 'completed', 'cancelled'].includes(event.status))
    }
    return events.filter((event) => !['past', 'completed', 'cancelled'].includes(event.status))
  }, [events, viewFilter])

  return (
    <div className="space-y-8">
      <ScrollReveal animation="fade-up">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-teal-500 dark:text-cream-300">Events</p>
          <h2 className="text-3xl font-semibold text-teal-900 dark:text-cream-50">Community Engagement Calendar</h2>
          <p className="text-sm text-teal-600 dark:text-cream-400">Plan health camps, festivals, and volunteer drives with clarity.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={fetchEvents}
            className="rounded-full border border-cream-200 dark:border-dark-600 px-4 py-2 text-sm text-teal-700 dark:text-cream-200 hover:border-coral-400 transition"
          >
            <FaRedo className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-coral-500 to-teal-500 px-5 py-2 text-sm font-semibold text-white shadow-lg"
          >
            <FaCalendarPlus /> Schedule Event
          </button>
        </div>
      </header>
      </ScrollReveal>

      {/* Stats */}
      <ScrollReveal animation="fade-up" delay={100}>
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-cream-200 bg-white p-5 dark:border-dark-700 dark:bg-dark-800">
          <p className="text-sm text-teal-500">Total Events</p>
          <p className="text-3xl font-bold text-teal-900 dark:text-cream-50">{stats.total}</p>
        </div>
        <div className="rounded-2xl border border-cream-200 bg-white p-5 dark:border-dark-700 dark:bg-dark-800">
          <p className="text-sm text-teal-500">Upcoming</p>
          <p className="text-3xl font-bold text-teal-900 dark:text-cream-50">{stats.upcoming}</p>
        </div>
        <div className="rounded-2xl border border-cream-200 bg-white p-5 dark:border-dark-700 dark:bg-dark-800">
          <p className="text-sm text-slate-500">Completed</p>
          <p className="text-3xl font-bold text-teal-900 dark:text-cream-50">{stats.completed}</p>
        </div>
        <div className="rounded-2xl border border-cream-200 bg-white p-5 dark:border-dark-700 dark:bg-dark-800">
          <p className="text-sm text-coral-500">Total Participants</p>
          <p className="text-3xl font-bold text-teal-900 dark:text-cream-50">{stats.totalParticipants}</p>
        </div>
      </div>
      </ScrollReveal>

      <ScrollReveal animation="fade-up" delay={150}>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-cream-200 bg-white px-5 py-3 dark:border-dark-700 dark:bg-dark-800">
          <p className="text-sm font-medium text-teal-700 dark:text-cream-200">Show:
            <span className="sr-only">Event view filter</span>
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setViewFilter('upcoming')}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                viewFilter === 'upcoming'
                  ? 'bg-gradient-to-r from-teal-500 to-coral-500 text-white shadow-lg'
                  : 'border border-cream-300 text-teal-600 hover:border-coral-200 dark:border-dark-600 dark:text-cream-300'
              }`}
            >
              Upcoming & Live
            </button>
            <button
              type="button"
              onClick={() => setViewFilter('past')}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                viewFilter === 'past'
                  ? 'bg-gradient-to-r from-slate-600 to-slate-800 text-white shadow-lg'
                  : 'border border-cream-300 text-slate-600 hover:border-slate-400 dark:border-dark-600 dark:text-cream-300'
              }`}
            >
              Past & Completed
            </button>
          </div>
        </div>
      </ScrollReveal>

      {/* Events List */}
      <ScrollReveal animation="fade-up" delay={200}>
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-16 w-16 animate-spin rounded-full border-b-4 border-t-4 border-coral-500" />
        </div>
      ) : events.length === 0 ? (
        <div className="rounded-3xl border border-cream-200 bg-white p-10 text-center dark:border-dark-700 dark:bg-dark-800">
          <MdEvent className="mx-auto text-5xl text-teal-300 dark:text-teal-500" />
          <h3 className="mt-4 text-2xl font-semibold text-teal-900 dark:text-cream-50">No events yet</h3>
          <p className="mt-2 text-teal-600 dark:text-cream-300">Create your first community event to get started.</p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-6 rounded-full bg-coral-500 px-6 py-2 text-white font-medium hover:bg-coral-600 transition"
          >
            Create Event
          </button>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-cream-300 bg-white/70 p-8 text-center text-teal-600 dark:border-dark-600 dark:bg-dark-800 dark:text-cream-300">
          <p className="text-lg font-semibold">
            {viewFilter === 'past' ? 'No past events documented yet.' : 'No upcoming events scheduled right now.'}
          </p>
          <p className="text-sm mt-1">Switch tabs or create a new event to populate this view.</p>
          {viewFilter === 'upcoming' && (
            <button
              onClick={() => setShowCreate(true)}
              className="mt-4 rounded-full bg-coral-500 px-5 py-2 text-sm font-semibold text-white hover:bg-coral-600"
            >
              Schedule Event
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredEvents.map(event => (
            <div key={event._id} className="rounded-3xl border border-cream-200 bg-white overflow-hidden dark:border-dark-700 dark:bg-dark-800">
              {/* Image */}
              <div className="relative h-40 bg-gradient-to-br from-teal-400 to-coral-400 dark:from-teal-700 dark:to-coral-700">
                {event.imageUrl ? (
                  <img src={event.imageUrl} alt={event.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <MdEvent className="text-5xl text-white/50" />
                  </div>
                )}
                <span className={`absolute top-3 right-3 rounded-full px-3 py-1 text-xs font-semibold ${statusBadge[event.status]}`}>
                  {event.status}
                </span>
              </div>

              <div className="p-5">
                <div className="flex items-center justify-between gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${categoryColors[event.category] || categoryColors.Other}`}>
                    {event.category}
                  </span>
                </div>
                <h3 className="mt-2 text-lg font-semibold text-teal-900 line-clamp-1 dark:text-cream-50">{event.title}</h3>

                <div className="mt-3 space-y-1 text-sm">
                  <div className="flex items-center gap-2 text-teal-600 dark:text-cream-300">
                    <FaCalendarAlt className="text-xs text-coral-400" />
                    <span>{formatDate(event.eventDate)}{event.eventTime ? ` • ${event.eventTime}` : ''}</span>
                  </div>
                  <div className="flex items-center gap-2 text-teal-600 dark:text-cream-300">
                    <FaMapMarkerAlt className="text-xs text-coral-400" />
                    <span className="truncate">{event.eventLocation}</span>
                  </div>
                  <div className="flex items-center gap-2 text-teal-600 dark:text-cream-300">
                    <FaUsers className="text-xs text-coral-400" />
                    <span>{event.participants?.length || 0}{event.maxParticipants > 0 ? ` / ${event.maxParticipants}` : ''} participants</span>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => setParticipantsEvent(event)}
                    className="rounded-full border border-cream-200 px-3 py-1.5 text-xs font-medium text-teal-700 hover:border-teal-400 dark:border-dark-600 dark:text-cream-200 transition"
                  >
                    <FaUsers className="inline mr-1" /> Participants
                  </button>
                  <button
                    onClick={() => setEditEvent(event)}
                    className="rounded-full border border-cream-200 px-3 py-1.5 text-xs font-medium text-teal-700 hover:border-coral-400 dark:border-dark-600 dark:text-cream-200 transition"
                  >
                    <FaEdit className="inline mr-1" /> Edit
                  </button>
                  {event.participants?.length > 0 && (event.status === 'upcoming' || event.status === 'ongoing') && (
                    <button
                      onClick={() => setReminderEvent(event)}
                      className="rounded-full border border-amber-200 px-3 py-1.5 text-xs font-medium text-amber-600 hover:bg-amber-50 dark:border-amber-400/30 dark:text-amber-300 transition"
                    >
                      <FaBell className="inline mr-1" /> Remind
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(event._id)}
                    disabled={deletingId === event._id}
                    className="rounded-full border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-70 dark:border-rose-400/30 dark:text-rose-300 transition"
                  >
                    <FaTrash className="inline mr-1" /> {deletingId === event._id ? '...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      </ScrollReveal>

      {/* Modals */}
      {(showCreate || editEvent) && (
        <CreateEditModal
          event={editEvent}
          onClose={() => { setShowCreate(false); setEditEvent(null) }}
          onSaved={fetchEvents}
        />
      )}
      {participantsEvent && (
        <ParticipantsModal
          event={participantsEvent}
          onClose={() => setParticipantsEvent(null)}
        />
      )}
      {reminderEvent && (
        <SendReminderModal
          event={reminderEvent}
          onClose={() => setReminderEvent(null)}
        />
      )}
    </div>
  )
}

export default EventsManagement
