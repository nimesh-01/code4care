import { useMemo, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAdminDashboardContext } from './AdminLayout'
import {
  FaUserCheck,
  FaUserClock,
  FaHandsHelping,
  FaCalendarAlt,
  FaExternalLinkAlt,
  FaCheckCircle,
  FaClock,
  FaFilter,
} from 'react-icons/fa'
import { MdEvent } from 'react-icons/md'
import { authAPI } from '../../../services/api'

const formatDate = (value) => {
  if (!value) return ''
  const d = new Date(value)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

const VolunteersManagement = () => {
  const { data } = useAdminDashboardContext()
  const [userLookup, setUserLookup] = useState({})
  const [filter, setFilter] = useState('all') // all | helpRequests | events

  // Build volunteer records from helpRequests and events
  const volunteerMap = useMemo(() => {
    const map = {} // volunteerId -> { id, helpRequests: [], events: [] }

    // From help requests - volunteers who accepted/completed
    ;(data.helpRequests || []).forEach((hr) => {
      if (!hr.assignedVolunteerId) return
      const vid = hr.assignedVolunteerId.toString()
      if (!map[vid]) map[vid] = { id: vid, helpRequests: [], events: [] }
      map[vid].helpRequests.push({
        _id: hr._id,
        requestType: hr.requestType,
        status: hr.status,
        description: hr.description,
        createdAt: hr.createdAt,
        completedAt: hr.completedAt,
      })
    })

    // From events - participants with role 'volunteer'
    ;(data.events || []).forEach((event) => {
      ;(event.participants || []).forEach((p) => {
        if (p.role !== 'volunteer') return
        const vid = (p.participantId || '').toString()
        if (!vid) return
        if (!map[vid]) map[vid] = { id: vid, helpRequests: [], events: [] }
        map[vid].events.push({
          _id: event._id,
          title: event.title,
          category: event.category,
          status: event.status,
          eventDate: event.eventDate,
          joinedAt: p.joinedAt,
        })
      })
    })

    return map
  }, [data.helpRequests, data.events])

  const volunteers = useMemo(() => {
    let list = Object.values(volunteerMap)
    if (filter === 'helpRequests') list = list.filter((v) => v.helpRequests.length > 0)
    if (filter === 'events') list = list.filter((v) => v.events.length > 0)
    // Sort by total activity desc
    return list.sort((a, b) => (b.helpRequests.length + b.events.length) - (a.helpRequests.length + a.events.length))
  }, [volunteerMap, filter])

  // Fetch user details for all volunteer IDs
  useEffect(() => {
    const ids = Object.keys(volunteerMap)
    if (!ids.length) return
    const unknownIds = ids.filter((id) => !userLookup[id])
    if (!unknownIds.length) return

    authAPI.getUsersBatch(unknownIds)
      .then((res) => {
        const users = res.data?.users || res.data || []
        const map = { ...userLookup }
        users.forEach((u) => { map[u._id || u.id] = u })
        setUserLookup(map)
      })
      .catch(() => {})
  }, [volunteerMap])

  const stats = useMemo(() => {
    const total = Object.keys(volunteerMap).length
    const helpActive = Object.values(volunteerMap).filter((v) => v.helpRequests.some((h) => h.status === 'accepted')).length
    const helpCompleted = Object.values(volunteerMap).reduce((sum, v) => sum + v.helpRequests.filter((h) => h.status === 'completed').length, 0)
    const eventJoined = Object.values(volunteerMap).reduce((sum, v) => sum + v.events.length, 0)
    return { total, helpActive, helpCompleted, eventJoined }
  }, [volunteerMap])

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-teal-500 dark:text-cream-300">Volunteers</p>
          <h2 className="text-3xl font-semibold text-teal-900 dark:text-cream-50">Volunteer Activity Hub</h2>
          <p className="text-sm text-teal-600 dark:text-cream-400">Track volunteers who serve your orphanage through help requests and community events.</p>
        </div>
      </header>

      {/* Stats */}
      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-cream-200 bg-white p-5 dark:border-dark-700 dark:bg-dark-800">
          <FaUserCheck className="text-2xl text-teal-500" />
          <p className="mt-3 text-xs uppercase tracking-[0.3em] text-teal-500">Total Volunteers</p>
          <p className="mt-1 text-3xl font-bold text-teal-900 dark:text-cream-50">{stats.total}</p>
        </div>
        <div className="rounded-2xl border border-cream-200 bg-white p-5 dark:border-dark-700 dark:bg-dark-800">
          <FaUserClock className="text-2xl text-amber-500" />
          <p className="mt-3 text-xs uppercase tracking-[0.3em] text-teal-500">Active in Help Requests</p>
          <p className="mt-1 text-3xl font-bold text-teal-900 dark:text-cream-50">{stats.helpActive}</p>
        </div>
        <div className="rounded-2xl border border-cream-200 bg-white p-5 dark:border-dark-700 dark:bg-dark-800">
          <FaCheckCircle className="text-2xl text-emerald-500" />
          <p className="mt-3 text-xs uppercase tracking-[0.3em] text-teal-500">Help Requests Completed</p>
          <p className="mt-1 text-3xl font-bold text-teal-900 dark:text-cream-50">{stats.helpCompleted}</p>
        </div>
        <div className="rounded-2xl border border-cream-200 bg-white p-5 dark:border-dark-700 dark:bg-dark-800">
          <MdEvent className="text-2xl text-coral-500" />
          <p className="mt-3 text-xs uppercase tracking-[0.3em] text-teal-500">Event Participations</p>
          <p className="mt-1 text-3xl font-bold text-teal-900 dark:text-cream-50">{stats.eventJoined}</p>
        </div>
      </section>

      {/* Filter tabs */}
      <div className="flex gap-3 overflow-x-auto">
        {[{ key: 'all', label: 'All Volunteers' }, { key: 'helpRequests', label: 'Help Request Volunteers' }, { key: 'events', label: 'Event Volunteers' }].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`rounded-full px-5 py-2 text-sm font-medium whitespace-nowrap transition ${
              filter === tab.key
                ? 'bg-teal-600 text-white shadow'
                : 'bg-white text-teal-700 dark:bg-dark-800 dark:text-cream-200 hover:bg-cream-50 dark:hover:bg-dark-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Volunteer cards */}
      {volunteers.length === 0 ? (
        <div className="rounded-3xl border border-cream-200 bg-white p-10 text-center dark:border-dark-700 dark:bg-dark-800">
          <FaUserCheck className="mx-auto text-5xl text-teal-300 dark:text-teal-500" />
          <h3 className="mt-4 text-2xl font-semibold text-teal-900 dark:text-cream-50">No volunteers yet</h3>
          <p className="mt-2 text-teal-600 dark:text-cream-300">
            When volunteers accept help requests or join your events, they will appear here.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {volunteers.map((vol) => {
            const u = userLookup[vol.id]
            const name = u
              ? `${u.fullname?.firstname || ''} ${u.fullname?.lastname || ''}`.trim() || u.email
              : `Volunteer ${vol.id.slice(-6)}`
            const totalActivity = vol.helpRequests.length + vol.events.length

            return (
              <div key={vol.id} className="rounded-3xl border border-cream-200 bg-white p-6 dark:border-dark-700 dark:bg-dark-800">
                {/* Header */}
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <Link
                      to={`/dashboard/admin/volunteers/${vol.id}`}
                      className="text-lg font-semibold text-teal-900 hover:text-coral-500 dark:text-cream-50 dark:hover:text-coral-400 inline-flex items-center gap-1.5 transition truncate"
                    >
                      {name}
                      <FaExternalLinkAlt className="text-[10px] opacity-50 flex-shrink-0" />
                    </Link>
                    {u?.email && <p className="text-xs text-teal-400 dark:text-cream-400 truncate">{u.email}</p>}
                  </div>
                  <span className="rounded-full bg-teal-100 px-3 py-1 text-xs font-semibold text-teal-700 dark:bg-teal-500/20 dark:text-teal-200 flex-shrink-0">
                    {totalActivity} {totalActivity === 1 ? 'activity' : 'activities'}
                  </span>
                </div>

                {/* Help Requests */}
                {vol.helpRequests.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs uppercase tracking-[0.3em] text-teal-500 flex items-center gap-1.5">
                      <FaHandsHelping className="text-sm" /> Help Requests ({vol.helpRequests.length})
                    </p>
                    <div className="mt-2 space-y-2">
                      {vol.helpRequests.slice(0, 3).map((hr) => (
                        <div key={hr._id} className="rounded-xl border border-cream-200 bg-cream-50 px-3 py-2 dark:border-dark-600 dark:bg-dark-700">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-teal-900 dark:text-cream-50">{hr.requestType}</span>
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              hr.status === 'completed'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200'
                                : hr.status === 'accepted'
                                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-200'
                                  : 'bg-slate-100 text-slate-600 dark:bg-slate-600/30 dark:text-slate-300'
                            }`}>
                              {hr.status}
                            </span>
                          </div>
                          <p className="text-xs text-teal-500 dark:text-cream-400 line-clamp-1 mt-0.5">{hr.description}</p>
                        </div>
                      ))}
                      {vol.helpRequests.length > 3 && (
                        <p className="text-xs text-teal-400 dark:text-cream-400">+{vol.helpRequests.length - 3} more</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Events */}
                {vol.events.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs uppercase tracking-[0.3em] text-teal-500 flex items-center gap-1.5">
                      <MdEvent className="text-sm" /> Events ({vol.events.length})
                    </p>
                    <div className="mt-2 space-y-2">
                      {vol.events.slice(0, 3).map((ev) => (
                        <div key={ev._id} className="rounded-xl border border-cream-200 bg-cream-50 px-3 py-2 dark:border-dark-600 dark:bg-dark-700">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-teal-900 dark:text-cream-50 truncate">{ev.title}</span>
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold flex-shrink-0 ${
                              ev.status === 'completed'
                                ? 'bg-slate-100 text-slate-600 dark:bg-slate-600/30 dark:text-slate-300'
                                : ev.status === 'upcoming'
                                  ? 'bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-200'
                                  : 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-200'
                            }`}>
                              {ev.status}
                            </span>
                          </div>
                          <p className="text-xs text-teal-500 dark:text-cream-400 mt-0.5">
                            {ev.category} • {formatDate(ev.eventDate)}
                          </p>
                        </div>
                      ))}
                      {vol.events.length > 3 && (
                        <p className="text-xs text-teal-400 dark:text-cream-400">+{vol.events.length - 3} more</p>
                      )}
                    </div>
                  </div>
                )}

                {/* View profile button */}
                <div className="mt-4">
                  <Link
                    to={`/dashboard/admin/volunteers/${vol.id}`}
                    className="block w-full rounded-full border border-cream-200 px-4 py-2 text-center text-sm font-medium text-teal-700 hover:border-coral-400 hover:text-coral-500 transition dark:border-dark-600 dark:text-cream-200 dark:hover:border-coral-400"
                  >
                    View Full Profile
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default VolunteersManagement
