import { useEffect, useMemo, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaUsers,
  FaRedo,
  FaInfoCircle,
  FaTimes,
  FaCheck,
  FaSignOutAlt,
  FaFilter,
} from 'react-icons/fa'
import { MdEvent } from 'react-icons/md'
import { toast } from 'react-toastify'
import Navbar from '../components/Navbar'
import { eventAPI, orphanagesAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useConfirm } from '../context/ConfirmContext'
import { ScrollReveal } from '../hooks/useScrollReveal'
import useInfiniteScroll from '../hooks/useInfiniteScroll'

const ITEMS_PER_PAGE = 6

const categoryColors = {
  Education: 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-200 dark:border-indigo-400/30',
  Health: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-200 dark:border-emerald-400/30',
  Fundraising: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-200 dark:border-amber-400/30',
  Cultural: 'bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-500/20 dark:text-pink-200 dark:border-pink-400/30',
  Other: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-500/20 dark:text-slate-200 dark:border-slate-400/30',
}

const statusBadge = {
  upcoming: 'bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-200',
  ongoing: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-200',
  completed: 'bg-slate-100 text-slate-600 dark:bg-slate-600/30 dark:text-slate-300',
  cancelled: 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300',
}

const categoryFilters = ['All', 'Education', 'Health', 'Fundraising', 'Cultural', 'Other']

const formatDate = (value) => {
  if (!value) return 'TBD'
  const d = new Date(value)
  if (isNaN(d.getTime())) return 'TBD'
  return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
}

const EventDetailModal = ({ event, onClose, orphanage, user, onJoin, onLeave, joining }) => {
  if (!event) return null
  const userId = user?.id || user?._id
  const hasJoined = userId && event.participants?.some(p => p.participantId === userId || p.participantId?.toString() === userId?.toString())
  const canJoin = user && ['user', 'volunteer'].includes(user.role) && !hasJoined && event.status !== 'cancelled' && event.status !== 'completed'
  const canLeave = user && hasJoined && event.status !== 'completed'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={onClose}>
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-8 shadow-2xl dark:bg-dark-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-wide text-teal-500">Event Details</p>
            <h2 className="text-2xl font-bold text-teal-900 dark:text-cream-50">{event.title}</h2>
          </div>
          <button onClick={onClose} className="text-teal-700 hover:text-coral-500 dark:text-cream-100" aria-label="Close">
            <FaTimes className="text-xl" />
          </button>
        </div>

        {event.imageUrl && (
          <img src={event.imageUrl} alt={event.title} className="mt-4 w-full rounded-2xl object-cover max-h-64" />
        )}

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-cream-200 bg-cream-50 p-4 dark:border-dark-700 dark:bg-dark-800">
            <p className="text-xs uppercase tracking-wide text-teal-500">Date</p>
            <p className="mt-1 text-lg font-semibold text-teal-900 dark:text-cream-50">{formatDate(event.eventDate)}</p>
            {event.eventTime && <p className="text-sm text-teal-600 dark:text-cream-300">{event.eventTime}</p>}
          </div>
          <div className="rounded-2xl border border-cream-200 bg-cream-50 p-4 dark:border-dark-700 dark:bg-dark-800">
            <p className="text-xs uppercase tracking-wide text-teal-500">Location</p>
            <p className="mt-1 text-lg font-semibold text-teal-900 dark:text-cream-50">{event.eventLocation}</p>
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-cream-200 bg-cream-50 p-4 dark:border-dark-700 dark:bg-dark-800">
            <p className="text-xs uppercase tracking-wide text-teal-500">Category</p>
            <span className={`mt-1 inline-block rounded-full border px-3 py-1 text-sm font-semibold ${categoryColors[event.category] || categoryColors.Other}`}>
              {event.category}
            </span>
          </div>
          <div className="rounded-2xl border border-cream-200 bg-cream-50 p-4 dark:border-dark-700 dark:bg-dark-800">
            <p className="text-xs uppercase tracking-wide text-teal-500">Status</p>
            <span className={`mt-1 inline-block rounded-full px-3 py-1 text-sm font-semibold ${statusBadge[event.status] || ''}`}>
              {event.status}
            </span>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-cream-200 bg-white p-5 dark:border-dark-700 dark:bg-dark-800">
          <p className="text-xs uppercase tracking-wide text-teal-500">Description</p>
          <p className="mt-2 text-teal-800 dark:text-cream-100 whitespace-pre-line">{event.description}</p>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-cream-200 bg-cream-50 p-4 dark:border-dark-700 dark:bg-dark-800 text-center">
            <p className="text-xs uppercase tracking-wide text-teal-500">Participants</p>
            <p className="text-2xl font-bold text-teal-900 dark:text-cream-50">{event.participants?.length || 0}</p>
            {event.maxParticipants > 0 && <p className="text-xs text-teal-500">/ {event.maxParticipants} max</p>}
          </div>
          <div className="rounded-2xl border border-cream-200 bg-cream-50 p-4 dark:border-dark-700 dark:bg-dark-800 text-center">
            <p className="text-xs uppercase tracking-wide text-teal-500">Volunteers needed</p>
            <p className="text-2xl font-bold text-teal-900 dark:text-cream-50">{event.requiredVolunteers || 0}</p>
          </div>
          <div className="rounded-2xl border border-cream-200 bg-cream-50 p-4 dark:border-dark-700 dark:bg-dark-800 text-center">
            <p className="text-xs uppercase tracking-wide text-teal-500">Orphanage</p>
            <p className="text-sm font-semibold text-teal-900 dark:text-cream-50 truncate">{orphanage?.name || 'Unknown'}</p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {canJoin && (
            <button
              onClick={() => onJoin(event._id)}
              disabled={joining}
              className="rounded-full bg-coral-500 px-6 py-2 text-white font-medium hover:bg-coral-600 disabled:opacity-70 transition"
            >
              {joining ? 'Joining...' : 'Join Event'}
            </button>
          )}
          {canLeave && (
            <button
              onClick={() => onLeave(event._id)}
              disabled={joining}
              className="rounded-full border border-rose-200 bg-rose-100 px-6 py-2 text-rose-600 font-medium hover:bg-rose-200 disabled:opacity-70 transition dark:bg-rose-500/20 dark:text-rose-200 dark:border-rose-400/30"
            >
              {joining ? 'Leaving...' : 'Leave Event'}
            </button>
          )}
          {hasJoined && (
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 text-emerald-700 text-sm font-semibold dark:bg-emerald-500/20 dark:text-emerald-200">
              <FaCheck /> You have joined
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

const Events = () => {
  const { user } = useAuth()
  const confirmAction = useConfirm()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [orphanageLookup, setOrphanageLookup] = useState({})
  const [joining, setJoining] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  useEffect(() => {
    fetchEvents(1, true)
  }, [])

  const fetchEvents = async (pageNum = 1, reset = false) => {
    try {
      if (reset) setLoading(true)
      else setLoadingMore(true)
      if (!reset) setRefreshing(false)
      setError(null)

      const params = { page: pageNum, limit: ITEMS_PER_PAGE }
      const response = await eventAPI.getAll(params)
      const list = response.data?.events || response.data || []
      const pagination = response.data?.pagination

      if (reset) {
        setEvents(list)
      } else {
        setEvents(prev => [...prev, ...list])
      }
      setPage(pageNum)
      setHasMore(pagination?.hasMore ?? list.length === ITEMS_PER_PAGE)
      await hydrateLookups(list)
    } catch (err) {
      console.error('Failed to load events', err)
      setError('Unable to load events right now. Please try again later.')
    } finally {
      setLoading(false)
      setLoadingMore(false)
      setRefreshing(false)
    }
  }

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchEvents(page + 1)
    }
  }, [loadingMore, hasMore, page])

  const { sentinelRef } = useInfiniteScroll(loadMore, hasMore, loadingMore)

  const handleRefresh = () => {
    setEvents([])
    setPage(1)
    setHasMore(true)
    setRefreshing(true)
    fetchEvents(1, true)
  }

  const hydrateLookups = async (list) => {
    const orphanageIds = [...new Set(list.map(e => e.orphanageId).filter(Boolean))]
    try {
      const results = await Promise.allSettled(orphanageIds.map(id => orphanagesAPI.getById(id)))
      const map = {}
      results.forEach((result, i) => {
        if (result.status === 'fulfilled') {
          const value = result.value.data?.orphanage || result.value.data?.data || result.value.data
          if (value) map[orphanageIds[i]] = value
        }
      })
      setOrphanageLookup(map)
    } catch (e) {
      console.warn('Failed to hydrate orphanage context', e)
    }
  }

  const handleJoin = async (eventId) => {
    if (!user) {
      toast.info('Please login to join events')
      return
    }
    try {
      setJoining(true)
      await eventAPI.join(eventId)
      toast.success('Successfully joined the event!')
      setSelectedEvent(null)
      setEvents([])
      setPage(1)
      setHasMore(true)
      await fetchEvents(1, true)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to join event')
    } finally {
      setJoining(false)
    }
  }

  const handleLeave = async (eventId) => {
    const proceed = await confirmAction({
      title: 'Leave this event?',
      message: 'You will be removed from the participant list.',
      confirmLabel: 'Leave event',
      cancelLabel: 'Stay',
      tone: 'danger',
    })
    if (!proceed) return

    try {
      setJoining(true)
      await eventAPI.leave(eventId)
      toast.success('You have left the event')
      setEvents([])
      setPage(1)
      setHasMore(true)
      await fetchEvents(1, true)
      if (selectedEvent?._id === eventId) {
        const res = await eventAPI.getById(eventId)
        setSelectedEvent(res.data?.event || res.data)
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to leave event')
    } finally {
      setJoining(false)
    }
  }

  const filteredEvents = useMemo(() => {
    if (categoryFilter === 'All') return events
    return events.filter(e => e.category === categoryFilter)
  }, [events, categoryFilter])

  const stats = useMemo(() => ({
    total: events.length,
    upcoming: events.filter(e => e.status === 'upcoming').length,
    ongoing: events.filter(e => e.status === 'ongoing').length,
    completed: events.filter(e => e.status === 'completed').length,
  }), [events])

  const userId = user?.id || user?._id

  return (
    <div className="min-h-screen bg-cream-50 dark:bg-dark-900">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-coral-500 to-teal-600 dark:from-dark-800 dark:to-dark-950">
        <ScrollReveal animation="fade-up" className="container mx-auto px-6">
          <div className="flex flex-col gap-4 text-white">
            <p className="text-sm uppercase tracking-[0.3em] text-white/80">Community Events</p>
            <h1 className="text-4xl font-playfair font-bold">Discover & Participate</h1>
            <p className="max-w-2xl text-white/80">
              Join impactful events organized by orphanages — from education workshops and health camps to fundraising drives and cultural festivals. Every participation makes a difference.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleRefresh}
                className="inline-flex items-center gap-2 rounded-full bg-white/15 px-5 py-2 text-sm font-medium text-white transition hover:bg-white/25"
              >
                <FaRedo className={refreshing ? 'animate-spin' : ''} />
                Refresh
              </button>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* Stats */}
      <section className="-mt-12 pb-4">
        <div className="container mx-auto px-6">
          <div className="grid gap-4 md:grid-cols-4">
            <ScrollReveal animation="fade-up" className="rounded-2xl bg-white p-5 shadow-sm dark:bg-dark-800">
              <p className="text-sm text-teal-500">Total Events</p>
              <p className="text-3xl font-bold text-teal-900 dark:text-cream-50">{stats.total}</p>
            </ScrollReveal>
            <ScrollReveal animation="fade-up" delay={100} className="rounded-2xl bg-white p-5 shadow-sm dark:bg-dark-800">
              <p className="text-sm text-teal-500">Upcoming</p>
              <p className="text-3xl font-bold text-teal-900 dark:text-cream-50">{stats.upcoming}</p>
            </ScrollReveal>
            <ScrollReveal animation="fade-up" delay={200} className="rounded-2xl bg-white p-5 shadow-sm dark:bg-dark-800">
              <p className="text-sm text-blue-500">Ongoing</p>
              <p className="text-3xl font-bold text-teal-900 dark:text-cream-50">{stats.ongoing}</p>
            </ScrollReveal>
            <ScrollReveal animation="fade-up" delay={300} className="rounded-2xl bg-white p-5 shadow-sm dark:bg-dark-800">
              <p className="text-sm text-slate-500">Completed</p>
              <p className="text-3xl font-bold text-teal-900 dark:text-cream-50">{stats.completed}</p>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Filter + List */}
      <section className="py-8">
        <div className="container mx-auto px-6">
          {/* Category filter */}
          <div className="mb-8 overflow-x-auto">
            <div className="flex gap-3">
              {categoryFilters.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`rounded-full px-5 py-2 text-sm font-medium whitespace-nowrap ${
                    categoryFilter === cat
                      ? 'bg-teal-600 text-white shadow'
                      : 'bg-white text-teal-700 dark:bg-dark-800 dark:text-cream-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="h-16 w-16 animate-spin rounded-full border-b-4 border-t-4 border-coral-500" />
            </div>
          ) : error ? (
            <div className="rounded-3xl bg-white p-10 text-center shadow dark:bg-dark-800">
              <FaInfoCircle className="mx-auto text-4xl text-coral-500" />
              <p className="mt-4 text-lg text-teal-700 dark:text-cream-100">{error}</p>
              <button onClick={() => fetchEvents(1, true)} className="mt-6 rounded-full bg-coral-500 px-6 py-2 text-white">
                Try again
              </button>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="rounded-3xl bg-white p-10 text-center shadow dark:bg-dark-800">
              <MdEvent className="mx-auto text-5xl text-teal-300" />
              <h3 className="mt-4 text-2xl font-semibold text-teal-900 dark:text-cream-50">No events found</h3>
              <p className="mt-2 text-teal-600 dark:text-cream-300">
                {categoryFilter !== 'All' ? `No ${categoryFilter} events available. Try a different category.` : 'Check back later for upcoming community events.'}
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredEvents.map(event => {
                const orphanage = orphanageLookup[event.orphanageId]
                const hasJoined = userId && event.participants?.some(p => p.participantId === userId || p.participantId?.toString() === userId?.toString())

                return (
                  <div
                    key={event._id}
                    className="group rounded-3xl border border-cream-200 bg-white overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 dark:border-dark-700 dark:bg-dark-800"
                  >
                    {/* Image */}
                    <div className="relative h-48 bg-gradient-to-br from-teal-400 to-coral-400 dark:from-teal-700 dark:to-coral-700 overflow-hidden">
                      {event.imageUrl ? (
                        <img src={event.imageUrl} alt={event.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <MdEvent className="text-6xl text-white/50" />
                        </div>
                      )}
                      <span className={`absolute top-3 right-3 rounded-full px-3 py-1 text-xs font-semibold ${statusBadge[event.status] || ''}`}>
                        {event.status}
                      </span>
                      {hasJoined && (
                        <span className="absolute top-3 left-3 rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white">
                          Joined
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      <span className={`inline-block rounded-full border px-3 py-1 text-xs font-semibold ${categoryColors[event.category] || categoryColors.Other}`}>
                        {event.category}
                      </span>
                      <h3 className="mt-3 text-xl font-semibold text-teal-900 line-clamp-1 dark:text-cream-50">{event.title}</h3>
                      <p className="mt-1 text-sm text-teal-600 line-clamp-2 dark:text-cream-300">{event.description}</p>

                      <div className="mt-4 space-y-2">
                        <div className="flex items-center gap-2 text-sm text-teal-600 dark:text-cream-300">
                          <FaCalendarAlt className="text-coral-400" />
                          <span>{formatDate(event.eventDate)}{event.eventTime ? ` • ${event.eventTime}` : ''}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-teal-600 dark:text-cream-300">
                          <FaMapMarkerAlt className="text-coral-400" />
                          <span className="truncate">{event.eventLocation}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-teal-600 dark:text-cream-300">
                          <FaUsers className="text-coral-400" />
                          <span>{event.participants?.length || 0}{event.maxParticipants > 0 ? ` / ${event.maxParticipants}` : ''} participants</span>
                        </div>
                      </div>

                      {orphanage && (
                        <p className="mt-3 text-xs text-teal-400 dark:text-cream-400 truncate">By {orphanage.name}</p>
                      )}

                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          onClick={() => setSelectedEvent(event)}
                          className="rounded-full border border-cream-200 px-4 py-2 text-sm font-medium text-teal-700 hover:border-coral-400 hover:text-coral-500 transition dark:border-dark-600 dark:text-cream-200"
                        >
                          View Details
                        </button>
                        {user && ['user', 'volunteer'].includes(user.role) && !hasJoined && event.status !== 'cancelled' && event.status !== 'completed' && (
                          <button
                            onClick={() => handleJoin(event._id)}
                            disabled={joining}
                            className="rounded-full bg-coral-500 px-4 py-2 text-sm font-medium text-white hover:bg-coral-600 disabled:opacity-70 transition"
                          >
                            Join Event
                          </button>
                        )}
                        {hasJoined && event.status !== 'completed' && (
                          <button
                            onClick={() => handleLeave(event._id)}
                            disabled={joining}
                            className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-100 transition dark:bg-rose-500/20 dark:text-rose-200 dark:border-rose-400/30"
                          >
                            Leave
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          {/* Infinite scroll sentinel */}
          {!loading && !error && hasMore && (
            <div ref={sentinelRef} className="flex justify-center py-8">
              {loadingMore && (
                <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 border-coral-500"></div>
              )}
            </div>
          )}
          {!loading && !error && !hasMore && events.length > 0 && (
            <p className="text-center text-teal-500 dark:text-cream-400 py-6 text-sm">You've reached the end</p>
          )}
        </div>
      </section>

      <EventDetailModal
        event={selectedEvent}
        orphanage={selectedEvent ? orphanageLookup[selectedEvent.orphanageId] : null}
        user={user}
        onClose={() => setSelectedEvent(null)}
        onJoin={handleJoin}
        onLeave={handleLeave}
        joining={joining}
      />
    </div>
  )
}

export default Events
