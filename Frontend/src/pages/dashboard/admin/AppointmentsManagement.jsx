import { useMemo, useState, useCallback } from 'react'
import { FaCalendarCheck, FaCheckCircle, FaClock, FaTimesCircle, FaBan, FaTimes, FaList, FaCalendarAlt, FaChevronLeft, FaChevronRight, FaBell } from 'react-icons/fa'
import { useAdminDashboardContext } from './AdminLayout'
import { appointmentAPI } from '../../../services/api'

const statusStyles = {
  pending: 'bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-500/20 dark:text-amber-100 dark:border-amber-400/30',
  approved: 'bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-100 dark:border-emerald-400/30',
  rejected: 'bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-500/20 dark:text-rose-100 dark:border-rose-400/30',
  cancelled: 'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-600/30 dark:text-slate-100 dark:border-slate-500/40',
  blocked: 'bg-red-100 text-red-800 border border-red-300 dark:bg-red-500/20 dark:text-red-100 dark:border-red-400/30',
}

const statusFilters = ['all', 'pending', 'approved', 'rejected', 'blocked', 'cancelled']

const normalizeStatus = (status) => (status || 'pending').toLowerCase()

const capitalize = (value) => {
  if (!value) return ''
  return value.charAt(0).toUpperCase() + value.slice(1)
}

const formatShortId = (value) => {
  if (!value) return ''
  const str = String(value)
  const short = str.slice(-6).toUpperCase()
  return `#${short}`
}

const formatRequester = (appt) => {
  const roleLabel = capitalize(appt?.requesterType || 'visitor')
  const shortId = formatShortId(appt?.requesterId)
  return shortId ? `${roleLabel} • ${shortId}` : roleLabel
}

const formatDateTime = (value) => {
  if (!value) return 'Not scheduled yet'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Not scheduled yet'
  return date.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
}

const getStatusStyle = (status) => statusStyles[normalizeStatus(status)] || statusStyles.pending

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate()
const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay()

const isSameDay = (d1, d2) =>
  d1.getFullYear() === d2.getFullYear() &&
  d1.getMonth() === d2.getMonth() &&
  d1.getDate() === d2.getDate()

const statusDot = {
  pending: 'bg-amber-400',
  approved: 'bg-emerald-400',
  rejected: 'bg-rose-400',
  blocked: 'bg-red-600',
  cancelled: 'bg-slate-400',
}

const AppointmentsManagement = () => {
  const { data, refresh } = useAdminDashboardContext()
  const [statusFilter, setStatusFilter] = useState('all')
  const [actionLoading, setActionLoading] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalAction, setModalAction] = useState(null) // 'reject' | 'block'
  const [modalAppointmentId, setModalAppointmentId] = useState(null)
  const [issueText, setIssueText] = useState('')
  const [actionError, setActionError] = useState(null)
  const [actionSuccess, setActionSuccess] = useState(null)

  // Calendar / view state
  const [viewMode, setViewMode] = useState('list') // 'list' | 'calendar'
  const [calMonth, setCalMonth] = useState(new Date().getMonth())
  const [calYear, setCalYear] = useState(new Date().getFullYear())
  const [selectedDay, setSelectedDay] = useState(null) // Date object or null
  const [reminderLoading, setReminderLoading] = useState(false)

  const appointmentSource = useMemo(() => (Array.isArray(data.appointments) ? data.appointments : []), [data.appointments])

  const appointments = useMemo(() => {
    const sorted = [...appointmentSource].sort((a, b) => {
      const aTime = a?.requestedAt ? new Date(a.requestedAt).getTime() : 0
      const bTime = b?.requestedAt ? new Date(b.requestedAt).getTime() : 0
      return bTime - aTime
    })
    if (statusFilter === 'all') return sorted
    return sorted.filter((appt) => normalizeStatus(appt.status) === statusFilter)
  }, [appointmentSource, statusFilter])

  const statusMetrics = useMemo(() => {
    const base = { pending: 0, approved: 0, rejected: 0, blocked: 0 }
    appointmentSource.forEach((appt) => {
      const state = normalizeStatus(appt.status)
      if (base[state] !== undefined) base[state] += 1
    })
    return base
  }, [appointmentSource])

  const clearMessages = () => {
    setActionError(null)
    setActionSuccess(null)
  }

  const handleApprove = useCallback(async (id) => {
    clearMessages()
    setActionLoading(id)
    try {
      await appointmentAPI.approve(id)
      setActionSuccess('Appointment approved successfully!')
      if (refresh) await refresh()
    } catch (err) {
      setActionError(err?.response?.data?.error || 'Failed to approve appointment')
    } finally {
      setActionLoading(null)
    }
  }, [refresh])

  const openRejectModal = (id) => {
    clearMessages()
    setModalAction('reject')
    setModalAppointmentId(id)
    setIssueText('')
    setModalOpen(true)
  }

  const openBlockModal = (id) => {
    clearMessages()
    setModalAction('block')
    setModalAppointmentId(id)
    setIssueText('')
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setModalAction(null)
    setModalAppointmentId(null)
    setIssueText('')
  }

  const handleModalSubmit = useCallback(async () => {
    if (!issueText.trim()) {
      setActionError('Please provide a reason / issue before submitting.')
      return
    }
    clearMessages()
    setActionLoading(modalAppointmentId)
    try {
      const payload = { adminResponse: issueText.trim() }
      if (modalAction === 'reject') {
        await appointmentAPI.reject(modalAppointmentId, payload)
        setActionSuccess('Appointment rejected.')
      } else if (modalAction === 'block') {
        await appointmentAPI.block(modalAppointmentId, payload)
        setActionSuccess('Appointment blocked.')
      }
      closeModal()
      if (refresh) await refresh()
    } catch (err) {
      setActionError(err?.response?.data?.error || `Failed to ${modalAction} appointment`)
    } finally {
      setActionLoading(null)
    }
  }, [modalAction, modalAppointmentId, issueText, refresh])

  // ---- Calendar helpers ----
  const goToPrevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear((y) => y - 1) }
    else setCalMonth((m) => m - 1)
    setSelectedDay(null)
  }
  const goToNextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear((y) => y + 1) }
    else setCalMonth((m) => m + 1)
    setSelectedDay(null)
  }
  const goToToday = () => {
    const now = new Date()
    setCalMonth(now.getMonth())
    setCalYear(now.getFullYear())
    setSelectedDay(now)
  }

  // Map: "YYYY-MM-DD" -> [appointments]
  const appointmentsByDate = useMemo(() => {
    const map = {}
    appointmentSource.forEach((appt) => {
      if (!appt.requestedAt) return
      const d = new Date(appt.requestedAt)
      if (Number.isNaN(d.getTime())) return
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
      if (!map[key]) map[key] = []
      map[key].push(appt)
    })
    return map
  }, [appointmentSource])

  // Appointments for the selected calendar day
  const selectedDayAppointments = useMemo(() => {
    if (!selectedDay) return []
    const key = `${selectedDay.getFullYear()}-${selectedDay.getMonth()}-${selectedDay.getDate()}`
    return appointmentsByDate[key] || []
  }, [selectedDay, appointmentsByDate])

  // Calendar grid data
  const calendarDays = useMemo(() => {
    const daysInMonth = getDaysInMonth(calYear, calMonth)
    const firstDay = getFirstDayOfMonth(calYear, calMonth)
    const cells = []
    // Blank cells before the 1st
    for (let i = 0; i < firstDay; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(d)
    return cells
  }, [calYear, calMonth])

  // ---- Send reminders ----
  const handleSendReminders = useCallback(async () => {
    clearMessages()
    setReminderLoading(true)
    try {
      const res = await appointmentAPI.sendReminders()
      const msg = res?.data?.message || `Reminders sent for ${res?.data?.sent || 0} appointment(s).`
      setActionSuccess(msg)
    } catch (err) {
      setActionError(err?.response?.data?.error || 'Failed to send reminders')
    } finally {
      setReminderLoading(false)
    }
  }, [])

  return (
    <div className="space-y-8">
      {/* Success / Error banners */}
      {actionSuccess && (
        <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-200">
          {actionSuccess}
          <button onClick={() => setActionSuccess(null)} className="ml-3 text-emerald-500 hover:text-emerald-700"><FaTimes /></button>
        </div>
      )}
      {actionError && (
        <div className="flex items-center justify-between rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3 text-sm text-rose-700 dark:border-rose-400/30 dark:bg-rose-500/10 dark:text-rose-200">
          {actionError}
          <button onClick={() => setActionError(null)} className="ml-3 text-rose-500 hover:text-rose-700"><FaTimes /></button>
        </div>
      )}

      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.4em] text-teal-500 dark:text-cream-300">Appointments</p>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-3xl font-semibold text-teal-900 dark:text-cream-50">Visits & reviews</h2>
            <p className="text-sm text-teal-600 dark:text-cream-300/70">Approve donor visits, volunteer meets, and medical check-ups from one view.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setViewMode(viewMode === 'calendar' ? 'list' : 'calendar')}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm shadow-sm transition ${
                viewMode === 'calendar'
                  ? 'border-teal-400 bg-teal-50 text-teal-700 dark:border-teal-400/40 dark:bg-teal-400/10 dark:text-teal-200'
                  : 'border-cream-200 bg-white text-teal-600 dark:border-dark-700 dark:bg-dark-800 dark:text-cream-200'
              }`}
            >
              {viewMode === 'calendar' ? <FaList /> : <FaCalendarAlt />}
              {viewMode === 'calendar' ? 'List view' : 'Calendar view'}
            </button>
            <button
              disabled={reminderLoading}
              onClick={handleSendReminders}
              className="inline-flex items-center gap-2 rounded-full border border-coral-200 bg-coral-50 px-4 py-2 text-sm text-coral-600 shadow-sm transition hover:bg-coral-100 disabled:opacity-50 dark:border-coral-400/40 dark:bg-coral-400/10 dark:text-coral-100"
            >
              <FaBell className={reminderLoading ? 'animate-pulse' : ''} />
              {reminderLoading ? 'Sending…' : 'Send reminders'}
            </button>
          </div>
        </div>
      </header>

      <div className="rounded-3xl border border-cream-200 bg-white/90 p-6 shadow-lg dark:border-dark-700 dark:bg-dark-900/70">
        {/* Status filter tabs (both views) */}
        <div className="flex flex-wrap items-center gap-3">
          {statusFilters.map((value) => (
            <button
              key={value}
              onClick={() => setStatusFilter(value)}
              className={`rounded-full px-4 py-2 text-xs font-semibold ${
                statusFilter === value
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-teal-600 hover:text-teal-800 dark:text-cream-300 dark:hover:text-cream-100'
              }`}
            >
              {value === 'all' ? 'All' : capitalize(value)}
            </button>
          ))}
        </div>

        {/* ========== CALENDAR VIEW ========== */}
        {viewMode === 'calendar' && (
          <div className="mt-6">
            {/* Month navigation */}
            <div className="mb-4 flex items-center justify-between">
              <button onClick={goToPrevMonth} className="rounded-full p-2 text-teal-600 hover:bg-cream-100 dark:text-cream-300 dark:hover:bg-dark-700">
                <FaChevronLeft />
              </button>
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold text-teal-900 dark:text-cream-50">
                  {new Date(calYear, calMonth).toLocaleString('en-IN', { month: 'long', year: 'numeric' })}
                </h3>
                <button onClick={goToToday} className="rounded-full border border-cream-200 px-3 py-1 text-xs text-teal-600 hover:bg-cream-100 dark:border-dark-700 dark:text-cream-300 dark:hover:bg-dark-700">
                  Today
                </button>
              </div>
              <button onClick={goToNextMonth} className="rounded-full p-2 text-teal-600 hover:bg-cream-100 dark:text-cream-300 dark:hover:bg-dark-700">
                <FaChevronRight />
              </button>
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {WEEKDAYS.map((day) => (
                <div key={day} className="py-2 text-xs font-semibold uppercase tracking-wider text-teal-500 dark:text-cream-400">
                  {day}
                </div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, idx) => {
                if (day === null) return <div key={`blank-${idx}`} className="h-24" />

                const cellDate = new Date(calYear, calMonth, day)
                const key = `${calYear}-${calMonth}-${day}`
                const dayAppts = appointmentsByDate[key] || []
                // Apply status filter
                const filteredDayAppts = statusFilter === 'all'
                  ? dayAppts
                  : dayAppts.filter((a) => normalizeStatus(a.status) === statusFilter)

                const isToday = isSameDay(cellDate, new Date())
                const isSelected = selectedDay && isSameDay(cellDate, selectedDay)

                return (
                  <button
                    key={key}
                    onClick={() => setSelectedDay(cellDate)}
                    className={`relative flex h-24 flex-col items-start rounded-xl border p-2 text-left text-sm transition
                      ${isSelected
                        ? 'border-teal-400 bg-teal-50 dark:border-teal-500 dark:bg-teal-500/10'
                        : 'border-cream-100 hover:border-teal-200 hover:bg-cream-50 dark:border-dark-700 dark:hover:border-dark-600 dark:hover:bg-dark-800/50'}
                      ${isToday ? 'ring-2 ring-teal-400/50 dark:ring-teal-500/40' : ''}`}
                  >
                    <span className={`text-xs font-semibold ${isToday ? 'text-teal-600 dark:text-teal-300' : 'text-teal-800 dark:text-cream-100'}`}>
                      {day}
                    </span>
                    {filteredDayAppts.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {filteredDayAppts.slice(0, 3).map((a, i) => (
                          <span key={i} className={`h-2 w-2 rounded-full ${statusDot[normalizeStatus(a.status)] || 'bg-gray-400'}`} title={a.purpose} />
                        ))}
                        {filteredDayAppts.length > 3 && (
                          <span className="text-[10px] text-teal-500 dark:text-cream-400">+{filteredDayAppts.length - 3}</span>
                        )}
                      </div>
                    )}
                    {filteredDayAppts.length > 0 && (
                      <span className="mt-auto text-[10px] leading-tight text-teal-600 dark:text-cream-300 line-clamp-1">
                        {filteredDayAppts[0].purpose?.slice(0, 18) || 'Visit'}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Selected day detail panel */}
            {selectedDay && (
              <div className="mt-6 rounded-2xl border border-cream-200 bg-cream-50 p-5 dark:border-dark-700 dark:bg-dark-800/60">
                <h4 className="text-sm font-semibold text-teal-900 dark:text-cream-50">
                  {selectedDay.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </h4>
                {selectedDayAppointments.length === 0 ? (
                  <p className="mt-3 text-sm text-teal-500 dark:text-cream-400">No appointments on this day.</p>
                ) : (
                  <div className="mt-3 space-y-3">
                    {selectedDayAppointments.map((appt) => {
                      const appointmentId = appt?._id || appt?.id
                      const statusLabel = capitalize(normalizeStatus(appt.status))
                      return (
                        <div key={appointmentId} className="rounded-xl border border-cream-200 bg-white p-4 dark:border-dark-700 dark:bg-dark-900">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-teal-900 dark:text-cream-50">{appt.purpose || 'Visit request'}</p>
                              <p className="text-xs text-teal-500 dark:text-cream-400">{formatDateTime(appt.requestedAt)} • {formatRequester(appt)}</p>
                            </div>
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(appt.status)}`}>{statusLabel}</span>
                          </div>
                          {normalizeStatus(appt.status) === 'pending' && (
                            <div className="mt-3 flex flex-wrap gap-2 border-t border-cream-100 pt-3 dark:border-dark-700">
                              <button disabled={actionLoading === appointmentId} onClick={() => handleApprove(appointmentId)} className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-50"><FaCheckCircle /> Accept</button>
                              <button disabled={actionLoading === appointmentId} onClick={() => openRejectModal(appointmentId)} className="inline-flex items-center gap-1.5 rounded-full bg-rose-500 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-600 disabled:opacity-50"><FaTimesCircle /> Reject</button>
                              <button disabled={actionLoading === appointmentId} onClick={() => openBlockModal(appointmentId)} className="inline-flex items-center gap-1.5 rounded-full bg-red-700 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-red-800 disabled:opacity-50"><FaBan /> Block</button>
                            </div>
                          )}
                          {appt.adminResponse && (
                            <p className="mt-2 rounded-xl border border-cream-200 bg-cream-50 px-3 py-2 text-xs text-teal-700 dark:border-dark-700 dark:bg-dark-900 dark:text-cream-200">
                              Admin: {appt.adminResponse}
                            </p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ========== LIST VIEW ========== */}
        {viewMode === 'list' && (
        <div className="mt-6 grid gap-4">
          {appointments.map((appt) => {
            const appointmentId = appt?._id || appt?.id || appt?.requestedAt
            const statusLabel = capitalize(normalizeStatus(appt.status))
            return (
              <div
                key={appointmentId}
                className="rounded-2xl border border-cream-200 bg-white/80 p-5 dark:border-dark-700 dark:bg-dark-800/80"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-lg font-semibold text-teal-900 dark:text-cream-50">{appt.purpose || 'Visit request'}</p>
                    <p className="text-sm text-teal-600 dark:text-cream-300/80">{formatDateTime(appt.requestedAt)}</p>
                    <p className="mt-1 text-xs text-teal-500 dark:text-cream-400">{formatRequester(appt)}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`rounded-full px-4 py-1 text-xs font-semibold ${getStatusStyle(appt.status)}`}>
                      {statusLabel}
                    </span>
                    <span className="text-xs text-teal-500 dark:text-cream-400">Created • {formatDateTime(appt.createdAt || appt.updatedAt)}</span>
                  </div>
                </div>

                {/* Action buttons for pending appointments */}
                {normalizeStatus(appt.status) === 'pending' && (
                  <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-cream-100 pt-4 dark:border-dark-700">
                    <button
                      disabled={actionLoading === appointmentId}
                      onClick={() => handleApprove(appointmentId)}
                      className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-600 disabled:opacity-50"
                    >
                      <FaCheckCircle /> {actionLoading === appointmentId ? 'Processing…' : 'Accept'}
                    </button>
                    <button
                      disabled={actionLoading === appointmentId}
                      onClick={() => openRejectModal(appointmentId)}
                      className="inline-flex items-center gap-2 rounded-full bg-rose-500 px-5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-rose-600 disabled:opacity-50"
                    >
                      <FaTimesCircle /> Reject
                    </button>
                    <button
                      disabled={actionLoading === appointmentId}
                      onClick={() => openBlockModal(appointmentId)}
                      className="inline-flex items-center gap-2 rounded-full bg-red-700 px-5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-red-800 disabled:opacity-50"
                    >
                      <FaBan /> Block
                    </button>
                  </div>
                )}
                {appt.adminResponse && (
                  <p className="mt-3 rounded-2xl border border-cream-200 bg-cream-50 px-4 py-3 text-xs text-teal-700 dark:border-dark-700 dark:bg-dark-900 dark:text-cream-200">
                    Admin response: {appt.adminResponse}
                  </p>
                )}
              </div>
            )
          })}
          {!appointments.length && (
            <p className="py-10 text-center text-sm text-teal-500 dark:text-cream-300">No appointments in this filter.</p>
          )}
        </div>
        )}
      </div>

      <section className="grid gap-6 md:grid-cols-4">
        <div className="rounded-3xl border border-cream-200 bg-white/90 p-5 shadow-sm dark:border-dark-700 dark:bg-dark-900/70">
          <FaClock className="text-2xl text-amber-500" />
          <p className="mt-3 text-xs uppercase tracking-[0.3em] text-teal-500 dark:text-cream-300">Awaiting response</p>
          <p className="mt-1 text-3xl font-semibold text-teal-900 dark:text-cream-50">{statusMetrics.pending}</p>
        </div>
        <div className="rounded-3xl border border-cream-200 bg-white/90 p-5 shadow-sm dark:border-dark-700 dark:bg-dark-900/70">
          <FaCheckCircle className="text-2xl text-emerald-500" />
          <p className="mt-3 text-xs uppercase tracking-[0.3em] text-teal-500 dark:text-cream-300">Approved this week</p>
          <p className="mt-1 text-3xl font-semibold text-teal-900 dark:text-cream-50">{statusMetrics.approved}</p>
        </div>
        <div className="rounded-3xl border border-cream-200 bg-white/90 p-5 shadow-sm dark:border-dark-700 dark:bg-dark-900/70">
          <FaTimesCircle className="text-2xl text-rose-500" />
          <p className="mt-3 text-xs uppercase tracking-[0.3em] text-teal-500 dark:text-cream-300">Rejected</p>
          <p className="mt-1 text-3xl font-semibold text-teal-900 dark:text-cream-50">{statusMetrics.rejected}</p>
        </div>
        <div className="rounded-3xl border border-cream-200 bg-white/90 p-5 shadow-sm dark:border-dark-700 dark:bg-dark-900/70">
          <FaBan className="text-2xl text-red-700" />
          <p className="mt-3 text-xs uppercase tracking-[0.3em] text-teal-500 dark:text-cream-300">Blocked</p>
          <p className="mt-1 text-3xl font-semibold text-teal-900 dark:text-cream-50">{statusMetrics.blocked}</p>
        </div>
      </section>

      <section className="rounded-3xl border border-cream-200 bg-white/90 p-6 shadow-sm dark:border-dark-700 dark:bg-dark-900/70">
        <div className="flex items-center gap-3">
          <FaCalendarCheck className="text-3xl text-cyan-500" />
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-teal-500 dark:text-cream-300">Automation</p>
            <h3 className="text-2xl font-semibold text-teal-900 dark:text-cream-50">Smart reminders</h3>
          </div>
        </div>
        <ul className="mt-6 list-disc space-y-2 pl-6 text-sm text-teal-800 dark:text-cream-200">
          <li>Email + SMS reminders go out 24h before every appointment.</li>
          <li>Volunteers receive in-app push notifications for approvals.</li>
          <li>Attendance automatically updates the visit log post completion.</li>
        </ul>
      </section>

      {/* Reject / Block reason modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-3xl border border-cream-200 bg-white p-8 shadow-2xl dark:border-dark-700 dark:bg-dark-900">
            <button onClick={closeModal} className="absolute right-4 top-4 text-teal-400 hover:text-teal-700 dark:text-cream-400 dark:hover:text-cream-100">
              <FaTimes className="text-lg" />
            </button>

            <h3 className="text-xl font-semibold text-teal-900 dark:text-cream-50">
              {modalAction === 'reject' ? 'Reject Appointment' : 'Block Appointment'}
            </h3>
            <p className="mt-1 text-sm text-teal-600 dark:text-cream-300/70">
              {modalAction === 'reject'
                ? 'Please provide a reason for rejecting this appointment request.'
                : 'Please provide the issue / reason for blocking this appointment request.'}
            </p>

            <textarea
              rows={4}
              value={issueText}
              onChange={(e) => setIssueText(e.target.value)}
              placeholder={modalAction === 'reject' ? 'Reason for rejection…' : 'Issue / reason for blocking…'}
              className="mt-4 w-full rounded-2xl border border-cream-200 bg-cream-50 px-4 py-3 text-sm text-teal-800 outline-none focus:border-teal-400 dark:border-dark-700 dark:bg-dark-800 dark:text-cream-100 dark:focus:border-teal-500"
            />

            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                onClick={closeModal}
                className="rounded-full border border-cream-200 px-5 py-2 text-sm text-teal-600 hover:bg-cream-100 dark:border-dark-700 dark:text-cream-300 dark:hover:bg-dark-800"
              >
                Cancel
              </button>
              <button
                disabled={actionLoading === modalAppointmentId}
                onClick={handleModalSubmit}
                className={`rounded-full px-5 py-2 text-sm font-semibold text-white shadow-sm transition disabled:opacity-50 ${
                  modalAction === 'reject'
                    ? 'bg-rose-500 hover:bg-rose-600'
                    : 'bg-red-700 hover:bg-red-800'
                }`}
              >
                {actionLoading === modalAppointmentId
                  ? 'Submitting…'
                  : modalAction === 'reject'
                    ? 'Reject'
                    : 'Block'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AppointmentsManagement
