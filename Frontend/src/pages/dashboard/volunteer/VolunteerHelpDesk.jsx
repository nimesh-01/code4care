import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FaHandsHelping, FaInbox, FaUserClock, FaCheckCircle, FaCommentDots, FaPaperPlane, FaClock, FaTimes, FaRedoAlt } from 'react-icons/fa'
import { toast } from 'react-toastify'
import Navbar from '../../../components/Navbar'
import { helpRequestAPI } from '../../../services/api'

const tabs = [
  { id: 'available', label: 'Available missions' },
  { id: 'active', label: 'In progress' },
  { id: 'completed', label: 'Completed' },
]

const emptyStateCopy = {
  available: 'No open missions at the moment. Check back shortly or refresh the feed.',
  active: 'You have not accepted any missions yet. Pick one from available requests.',
  completed: 'Completed missions will show up here for quick reference.',
}

const statusBadges = {
  pending: 'bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-500/20 dark:text-amber-100 dark:border-amber-400/30',
  accepted: 'bg-teal-100 text-teal-700 border border-teal-200 dark:bg-cyan-500/20 dark:text-cyan-100 dark:border-cyan-400/30',
  completed: 'bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-100 dark:border-emerald-400/30',
}

const typeBadges = {
  Teaching: 'bg-indigo-100 text-indigo-700 border border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-100 dark:border-indigo-400/30',
  Medical: 'bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-500/20 dark:text-rose-100 dark:border-rose-400/30',
  Exam: 'bg-violet-100 text-violet-700 border border-violet-200 dark:bg-violet-500/20 dark:text-violet-100 dark:border-violet-400/30',
  Other: 'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-500/20 dark:text-slate-100 dark:border-slate-400/30',
}

const roleTags = {
  volunteer: 'text-teal-600 dark:text-cyan-200',
  orphanAdmin: 'text-amber-600 dark:text-amber-200',
  superAdmin: 'text-emerald-600 dark:text-emerald-200',
}

const getRequestId = (request) => request?._id || request?.id || ''
const formatShortId = (value) => (value ? `#${String(value).slice(-6).toUpperCase()}` : '—')
const formatDateTime = (value) => {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
}

const VolunteerHelpDesk = () => {
  const [tab, setTab] = useState('available')
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [availableRequests, setAvailableRequests] = useState([])
  const [activeRequests, setActiveRequests] = useState([])
  const [completedRequests, setCompletedRequests] = useState([])
  const [selectedRequest, setSelectedRequest] = useState(null)
  const selectedRequestRef = useRef(null)
  const [acceptNote, setAcceptNote] = useState('')
  const [accepting, setAccepting] = useState(false)
  const [messageInput, setMessageInput] = useState('')
  const [sending, setSending] = useState(false)

  const extractList = (payload) => {
    if (!payload) return []
    if (Array.isArray(payload)) return payload
    if (Array.isArray(payload?.helpRequests)) return payload.helpRequests
    if (Array.isArray(payload?.requests)) return payload.requests
    return []
  }

  useEffect(() => {
    selectedRequestRef.current = getRequestId(selectedRequest) || null
  }, [selectedRequest])

  const fetchRequests = useCallback(async ({ silent = false } = {}) => {
    if (silent) setRefreshing(true)
    else setLoading(true)
    setError(null)

    try {
      const [availableResponse, volunteerResponse] = await Promise.all([
        helpRequestAPI.getAll({ status: 'pending' }),
        helpRequestAPI.getVolunteerRequests(),
      ])

      const availableList = extractList(availableResponse?.data)
      const volunteerList = extractList(volunteerResponse?.data)
      const acceptedList = volunteerList.filter((item) => item.status === 'accepted')
      const completedList = volunteerList.filter((item) => item.status === 'completed')

      setAvailableRequests(availableList)
      setActiveRequests(acceptedList)
      setCompletedRequests(completedList)

      const currentSelectedId = selectedRequestRef.current
      if (currentSelectedId) {
        const refreshed = [...availableList, ...acceptedList, ...completedList].find(
          (item) => getRequestId(item) === currentSelectedId
        )
        if (refreshed) setSelectedRequest(refreshed)
      }
    } catch (err) {
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.response?.data?.errors?.[0]?.msg ||
        'Failed to load help requests'
      setError(message)
      toast.error(message)
    } finally {
      if (silent) setRefreshing(false)
      else setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  const metrics = useMemo(() => ({
    available: availableRequests.length,
    active: activeRequests.length,
    completed: completedRequests.length,
  }), [availableRequests, activeRequests, completedRequests])

  const listForTab = useMemo(() => {
    if (tab === 'available') return availableRequests
    if (tab === 'active') return activeRequests
    return completedRequests
  }, [tab, availableRequests, activeRequests, completedRequests])

  const handleSelect = (request) => {
    setSelectedRequest(request)
    setAcceptNote('')
    setMessageInput('')
  }

  const handleCloseModal = () => {
    setSelectedRequest(null)
    setAcceptNote('')
    setMessageInput('')
  }

  const handleAccept = useCallback(async () => {
    if (!selectedRequest || accepting) return
    if (acceptNote && acceptNote.trim().length < 3) {
      toast.error('Please provide a slightly longer note (minimum 3 characters).')
      return
    }

    setAccepting(true)
    try {
      const payload = acceptNote.trim() ? { message: acceptNote.trim() } : {}
      const response = await helpRequestAPI.accept(getRequestId(selectedRequest), payload)
      const updated = response?.data?.helpRequest
      setAcceptNote('')
      if (updated) setSelectedRequest(updated)
      toast.success('Mission accepted! You can now share updates.')
      await fetchRequests({ silent: true })
    } catch (err) {
      const message = err?.response?.data?.error || err?.response?.data?.message || 'Unable to accept this mission'
      toast.error(message)
    } finally {
      setAccepting(false)
    }
  }, [acceptNote, accepting, fetchRequests, selectedRequest])

  const handleSendMessage = useCallback(async () => {
    if (!selectedRequest || sending) return
    if (!messageInput.trim()) {
      toast.error('Please add a short update before sending.')
      return
    }

    setSending(true)
    try {
      const response = await helpRequestAPI.addMessage(getRequestId(selectedRequest), { content: messageInput.trim() })
      const updated = response?.data?.helpRequest
      if (updated) setSelectedRequest(updated)
      setMessageInput('')
      toast.success('Update shared with the orphanage.')
      await fetchRequests({ silent: true })
    } catch (err) {
      const message = err?.response?.data?.error || err?.response?.data?.message || 'Unable to send the update'
      toast.error(message)
    } finally {
      setSending(false)
    }
  }, [fetchRequests, messageInput, selectedRequest, sending])

  return (
    <div className="min-h-screen bg-cream-50 pb-10 dark:bg-dark-950">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 pt-28 pb-12 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 rounded-3xl border border-cream-200 bg-white/90 p-6 shadow-sm dark:border-dark-700 dark:bg-dark-900/70 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-teal-500 dark:text-cream-300">Volunteer desk</p>
            <h1 className="mt-2 flex items-center gap-3 text-3xl font-semibold text-teal-900 dark:text-cream-50">
              <FaHandsHelping className="text-2xl text-teal-500" />
              Mission control center
            </h1>
            <p className="mt-2 text-sm text-teal-600 dark:text-cream-300/80">Choose a mission, leave an acceptance note, and keep orphanages updated.</p>
          </div>
          <button
            type="button"
            onClick={() => fetchRequests({ silent: true })}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-teal-200 px-5 py-2 text-sm font-semibold text-teal-600 transition hover:border-teal-400 hover:text-teal-700 disabled:opacity-60 dark:border-dark-600 dark:text-cream-200 dark:hover:border-teal-400"
          >
            <FaRedoAlt className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Refreshing' : 'Refresh feed'}
          </button>
        </header>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <MetricCard icon={<FaInbox />} label="Open missions" value={metrics.available} accent="from-cream-200 to-cream-100 text-teal-700" />
          <MetricCard icon={<FaUserClock />} label="In progress" value={metrics.active} accent="from-teal-100 to-emerald-50 text-teal-700" />
          <MetricCard icon={<FaCheckCircle />} label="Completed" value={metrics.completed} accent="from-lime-100 to-emerald-100 text-teal-700" />
        </section>

        <section className="mt-8 rounded-3xl border border-cream-200 bg-white/95 p-6 shadow-lg dark:border-dark-700 dark:bg-dark-900/80">
          <div className="flex flex-wrap items-center gap-3">
            {tabs.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                  tab === item.id
                    ? 'border border-teal-500 bg-teal-600 text-white shadow-lg shadow-teal-200/50'
                    : 'border border-cream-300 text-teal-700 hover:border-teal-400 dark:border-dark-600 dark:text-cream-200'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {error && (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3 text-sm text-rose-700 dark:border-rose-400/40 dark:bg-rose-500/10 dark:text-rose-100">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center gap-3 py-16 text-teal-500">
              <FaClock className="text-3xl animate-spin" />
              <p className="text-sm">Loading missions...</p>
            </div>
          ) : (
            <div className="mt-6 grid gap-4">
              {listForTab.map((request) => (
                <article
                  key={getRequestId(request)}
                  className="rounded-3xl border border-cream-200 bg-white/90 p-6 shadow-sm transition hover:border-teal-200 dark:border-dark-700 dark:bg-dark-900/70"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className={`rounded-full px-3 py-0.5 font-semibold ${typeBadges[request.requestType] || typeBadges.Other}`}>
                          {request.requestType}
                        </span>
                        <span className={`rounded-full px-3 py-0.5 font-semibold ${statusBadges[request.status] || statusBadges.pending}`}>
                          {request.status}
                        </span>
                        <span className="text-teal-400 dark:text-cream-400">{formatShortId(getRequestId(request))}</span>
                      </div>
                      <p className="mt-3 text-lg text-teal-900 dark:text-cream-50">{request.description}</p>
                      {request.requiredSkills?.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2 text-xs">
                          {request.requiredSkills.map((skill) => (
                            <span
                              key={skill}
                              className="rounded-full border border-cream-200 bg-cream-50 px-3 py-1 text-teal-700 dark:border-dark-600 dark:bg-dark-800 dark:text-cream-200"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-right text-xs text-teal-500 dark:text-cream-400">
                      <p>Filed {formatDateTime(request.createdAt)}</p>
                      {request.assignedVolunteerId && (
                        <p className="mt-1">Volunteer {formatShortId(request.assignedVolunteerId)}</p>
                      )}
                      {request.completedAt && (
                        <p className="mt-1">Closed {formatDateTime(request.completedAt)}</p>
                      )}
                      <button
                        type="button"
                        onClick={() => handleSelect(request)}
                        className="mt-4 inline-flex items-center justify-center rounded-full border border-teal-500 px-4 py-1.5 text-xs font-semibold text-teal-600 transition hover:bg-teal-50 dark:text-cream-100 dark:hover:bg-dark-700"
                      >
                        {tab === 'available' ? 'Review & accept' : 'Open timeline'}
                      </button>
                    </div>
                  </div>
                </article>
              ))}

              {!listForTab.length && (
                <p className="py-16 text-center text-sm text-teal-400 dark:text-cream-300">{emptyStateCopy[tab]}</p>
              )}
            </div>
          )}
        </section>
      </main>

      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 px-3 py-8 backdrop-blur-sm sm:px-6">
          <div className="w-full max-w-4xl">
            <div className="relative flex max-h-[calc(100vh-4rem)] flex-col overflow-hidden rounded-3xl border border-cream-200 bg-white p-6 shadow-2xl dark:border-dark-700 dark:bg-dark-900">
              <button
                type="button"
                onClick={handleCloseModal}
                className="absolute right-4 top-4 text-teal-400 hover:text-teal-600 dark:text-cream-300 dark:hover:text-white"
                aria-label="Close request panel"
              >
                <FaTimes />
              </button>

              <div className="mt-6 flex-1 overflow-y-auto pr-1">
                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="flex flex-col gap-4">
                    <section className="rounded-2xl border border-cream-200 bg-cream-50/70 p-5 dark:border-dark-700 dark:bg-dark-800/70">
                      <p className="text-xs uppercase tracking-[0.4em] text-teal-500 dark:text-cyan-200">Mission brief</p>
                      <h2 className="mt-1 flex items-center gap-2 text-2xl font-semibold text-teal-900 dark:text-cream-50">
                        <FaCommentDots className="text-teal-500" />
                        {selectedRequest.requestType} support
                      </h2>
                      <p className="mt-2 text-sm text-teal-700 dark:text-cream-300">{selectedRequest.description}</p>
                      <p className="text-xs text-teal-400 dark:text-cream-400">Request {formatShortId(getRequestId(selectedRequest))}</p>
                      {selectedRequest.requiredSkills?.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2 text-xs">
                          {selectedRequest.requiredSkills.map((skill) => (
                            <span
                              key={skill}
                              className="rounded-full border border-cream-200 bg-white/70 px-3 py-1 text-teal-700 dark:border-dark-600 dark:bg-dark-900/80 dark:text-cream-200"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </section>

                    <section className="rounded-2xl border border-cream-200 bg-white/90 p-5 dark:border-dark-700 dark:bg-dark-900/70">
                      <div className="grid grid-cols-2 gap-3 text-xs text-teal-600 dark:text-cream-300">
                        <div>
                          <p className="uppercase tracking-[0.3em] text-teal-400">Filed</p>
                          <p className="mt-1 text-sm font-semibold text-teal-900 dark:text-cream-50">{formatDateTime(selectedRequest.createdAt)}</p>
                        </div>
                        <div>
                          <p className="uppercase tracking-[0.3em] text-teal-400">Status</p>
                          <p className="mt-1 inline-flex items-center gap-2 rounded-full border border-teal-200 px-3 py-1 text-sm font-semibold text-teal-700 dark:border-teal-500/40 dark:text-cream-100">
                            {selectedRequest.status}
                          </p>
                        </div>
                        <div>
                          <p className="uppercase tracking-[0.3em] text-teal-400">Volunteer</p>
                          <p className="mt-1 text-sm font-semibold text-teal-900 dark:text-cream-50">
                            {selectedRequest.assignedVolunteerId ? formatShortId(selectedRequest.assignedVolunteerId) : 'Unassigned'}
                          </p>
                        </div>
                        {selectedRequest.completedAt && (
                          <div>
                            <p className="uppercase tracking-[0.3em] text-teal-400">Closed</p>
                            <p className="mt-1 text-sm font-semibold text-teal-900 dark:text-cream-50">{formatDateTime(selectedRequest.completedAt)}</p>
                          </div>
                        )}
                      </div>
                    </section>

                    <section className="rounded-2xl border border-cream-200 bg-white/90 p-5 dark:border-dark-700 dark:bg-dark-900/70">
                      <div className="flex items-center justify-between">
                        <p className="text-xs uppercase tracking-[0.3em] text-teal-500 dark:text-cyan-200">Conversation</p>
                        <span className="text-[11px] text-teal-400 dark:text-cream-400">{(selectedRequest.messages || []).length} notes</span>
                      </div>
                      <div className="mt-4 h-64 space-y-3 overflow-y-auto pr-2">
                        {(selectedRequest.messages || []).length ? (
                          [...selectedRequest.messages]
                            .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
                            .map((message, index) => (
                              <div
                                key={`${message.createdAt}-${index}`}
                                className="rounded-2xl border border-cream-200 bg-cream-50/70 p-3 dark:border-dark-700 dark:bg-dark-800/70"
                              >
                                <div className="flex items-center justify-between text-[11px] text-teal-500 dark:text-cream-300">
                                  <span className={roleTags[message.senderRole] || 'text-teal-600'}>
                                    {message.senderRole === 'volunteer' ? 'You' : message.senderRole}
                                  </span>
                                  <span>{formatDateTime(message.createdAt)}</span>
                                </div>
                                <p className="mt-2 text-sm text-teal-900 dark:text-cream-100">{message.content}</p>
                              </div>
                            ))
                        ) : (
                          <p className="text-sm text-teal-400 dark:text-cream-400">No messages yet. Be the first to leave a note.</p>
                        )}
                      </div>
                    </section>
                  </div>

                  <div className="flex flex-col gap-4">
                    {selectedRequest.status === 'pending' && (
                      <div className="rounded-3xl border border-teal-200 bg-gradient-to-br from-teal-600/95 to-coral-500/90 p-5 text-white shadow-xl">
                        <p className="text-xs uppercase tracking-[0.3em] text-white/70">Accept mission</p>
                        <p className="mt-2 text-sm text-white/85">Leave a short plan so the orphanage knows how you will contribute.</p>
                        <textarea
                          rows={4}
                          value={acceptNote}
                          onChange={(e) => setAcceptNote(e.target.value)}
                          placeholder="Example: I can tutor maths every evening this week"
                          className="mt-3 w-full rounded-2xl border border-white/30 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/60 focus:border-white focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleAccept}
                          disabled={accepting}
                          className="mt-4 w-full rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-teal-700 shadow-lg transition hover:bg-white disabled:opacity-60"
                        >
                          {accepting ? 'Accepting...' : 'Accept mission'}
                        </button>
                      </div>
                    )}

                    {selectedRequest.status === 'accepted' && (
                      <div className="rounded-3xl border border-cream-200 bg-white p-5 shadow-xl dark:border-dark-700 dark:bg-dark-800/80">
                        <p className="text-xs uppercase tracking-[0.3em] text-teal-500">Share an update</p>
                        <textarea
                          rows={4}
                          value={messageInput}
                          onChange={(e) => setMessageInput(e.target.value)}
                          placeholder="Let the orphanage know your progress or blockers"
                          className="mt-3 w-full rounded-2xl border border-cream-300 bg-cream-50 px-4 py-3 text-sm text-teal-900 placeholder:text-teal-300 focus:border-teal-500 focus:outline-none dark:border-dark-600 dark:bg-dark-900 dark:text-cream-100"
                        />
                        <button
                          type="button"
                          onClick={handleSendMessage}
                          disabled={sending}
                          className="mt-4 w-full rounded-full bg-gradient-to-r from-emerald-500 to-lime-500 px-4 py-2 text-sm font-semibold text-white shadow-lg transition disabled:opacity-60"
                        >
                          {sending ? 'Sending...' : (
                            <span className="inline-flex items-center justify-center gap-2">
                              <FaPaperPlane /> Send update
                            </span>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const MetricCard = ({ icon, label, value, accent }) => (
  <div className="rounded-3xl border border-cream-200 bg-white/95 p-6 shadow-sm dark:border-dark-700 dark:bg-dark-900/70">
    <div className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${accent} text-xl`}>
      {icon}
    </div>
    <p className="mt-4 text-xs uppercase tracking-[0.3em] text-teal-500 dark:text-cream-300">{label}</p>
    <p className="mt-1 text-3xl font-semibold text-teal-900 dark:text-cream-50">{value}</p>
  </div>
)

export default VolunteerHelpDesk
