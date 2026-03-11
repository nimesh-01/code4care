import { useMemo, useState, useCallback } from 'react'
import { FaCalendarCheck, FaCheckCircle, FaClock, FaTimesCircle, FaBan, FaTimes, FaList, FaCalendarAlt, FaChevronLeft, FaChevronRight, FaBell, FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaChild, FaInfoCircle } from 'react-icons/fa'
import { useAdminDashboardContext } from './AdminLayout'
import { appointmentAPI, authAPI, childrenAPI } from '../../../services/api'
import { ScrollReveal } from '../../../hooks/useScrollReveal'

const statusStyles = {
  pending: 'bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-500/20 dark:text-amber-100 dark:border-amber-400/30',
  needsconfirmation: 'bg-sky-100 text-sky-800 border border-sky-200 dark:bg-sky-500/20 dark:text-sky-100 dark:border-sky-400/30',
  approved: 'bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-100 dark:border-emerald-400/30',
  rejected: 'bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-500/20 dark:text-rose-100 dark:border-rose-400/30',
  cancelled: 'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-600/30 dark:text-slate-100 dark:border-slate-500/40',
  blocked: 'bg-red-100 text-red-800 border border-red-300 dark:bg-red-500/20 dark:text-red-100 dark:border-red-400/30',
  completed: 'bg-teal-100 text-teal-700 border border-teal-200 dark:bg-teal-500/20 dark:text-teal-100 dark:border-teal-400/30',
}

const statusFilters = ['all', 'pending', 'needsconfirmation', 'approved', 'rejected', 'blocked', 'cancelled', 'completed']

const normalizeStatus = (status) => (status || 'pending').toLowerCase()

const capitalize = (value) => {
  if (!value) return ''
  return value.charAt(0).toUpperCase() + value.slice(1)
}

const formatFilterLabel = (value) => {
  if (value === 'all') return 'All'
  if (value === 'needsconfirmation') return 'Needs confirmation'
  return capitalize(value)
}

const formatStatusLabel = (value) => {
  const normalized = normalizeStatus(value)
  if (normalized === 'needsconfirmation') return 'Needs confirmation'
  return capitalize(normalized)
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

const formatAddress = (address) => {
  if (!address) return 'Not provided'
  const parts = [address.street, address.city, address.state, address.pincode, address.country]
  const filtered = parts.filter(Boolean)
  return filtered.length ? filtered.join(', ') : 'Not provided'
}

const formatDateTime = (value) => {
  if (!value) return 'Not scheduled yet'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Not scheduled yet'
  return date.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
}

const getStatusStyle = (status) => statusStyles[normalizeStatus(status)] || statusStyles.pending

const toDate = (value) => {
  if (!value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

const formatDateTimeLocalInput = (value) => {
  const date = toDate(value) || new Date()
  const offset = date.getTimezoneOffset()
  const local = new Date(date.getTime() - offset * 60000)
  return local.toISOString().slice(0, 16)
}

const formatReadableSlot = (value) => {
  const date = toDate(value)
  if (!date) return 'the updated schedule'
  return date.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate()
const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay()

const isSameDay = (d1, d2) =>
  d1.getFullYear() === d2.getFullYear() &&
  d1.getMonth() === d2.getMonth() &&
  d1.getDate() === d2.getDate()

const statusDot = {
  pending: 'bg-amber-400',
  needsconfirmation: 'bg-sky-400',
  approved: 'bg-emerald-400',
  rejected: 'bg-rose-400',
  blocked: 'bg-red-600',
  cancelled: 'bg-slate-400',
}

const canAdminCancel = (appt) => {
  const status = normalizeStatus(appt?.status)
  return ['approved', 'needsconfirmation'].includes(status)
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
  const [detailAppointment, setDetailAppointment] = useState(null)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailRequester, setDetailRequester] = useState(null)
  const [detailChild, setDetailChild] = useState(null)
  const [detailError, setDetailError] = useState(null)
  const [acceptModalOpen, setAcceptModalOpen] = useState(false)
  const [acceptAppointment, setAcceptAppointment] = useState(null)
  const [acceptDateTime, setAcceptDateTime] = useState('')
  const [acceptNote, setAcceptNote] = useState('')
  const [acceptOriginalTime, setAcceptOriginalTime] = useState('')
  const [acceptNoteTouched, setAcceptNoteTouched] = useState(false)
  const modalCopy = {
    reject: {
      title: 'Reject Appointment',
      description: 'Please provide a reason for rejecting this appointment request.',
      placeholder: 'Reason for rejection…',
      action: 'Reject',
    },
    block: {
      title: 'Block Appointment',
      description: 'Please provide the issue / reason for blocking this appointment request.',
      placeholder: 'Issue / reason for blocking…',
      action: 'Block',
    },
    cancel: {
      title: 'Cancel Appointment',
      description: 'Share a short note explaining why this visit must be cancelled.',
      placeholder: 'Reason for cancelling…',
      action: 'Cancel appointment',
    },
  }
  const activeModalCopy = modalCopy[modalAction] || modalCopy.reject

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
    const base = { pending: 0, approved: 0, rejected: 0, blocked: 0, completed: 0 }
    appointmentSource.forEach((appt) => {
      const state = normalizeStatus(appt.status)
      if (state === 'needsconfirmation') {
        base.pending += 1
        return
      }
      if (base[state] !== undefined) base[state] += 1
    })
    return base
  }, [appointmentSource])

  const clearMessages = () => {
    setActionError(null)
    setActionSuccess(null)
  }

  const closeApproveModal = useCallback(() => {
    setAcceptModalOpen(false)
    setAcceptAppointment(null)
    setAcceptDateTime('')
    setAcceptOriginalTime('')
    setAcceptNote('')
    setAcceptNoteTouched(false)
  }, [])

  const openApproveModal = useCallback((appointment) => {
    clearMessages()
    const requestedAtLocal = formatDateTimeLocalInput(appointment?.requestedAt || new Date(Date.now() + 2 * 60 * 60 * 1000))
    setAcceptAppointment(appointment)
    setAcceptOriginalTime(requestedAtLocal)
    setAcceptDateTime(requestedAtLocal)
    setAcceptNote('Approved. Looking forward to your visit!')
    setAcceptNoteTouched(false)
    setAcceptModalOpen(true)
  }, [])

  const handleApproveSubmit = useCallback(async () => {
    if (!acceptAppointment) return
    if (!acceptDateTime) {
      setActionError('Please choose a visit date and time before approving.')
      return
    }

    clearMessages()
    setActionLoading(acceptAppointment._id || acceptAppointment.id)
    const isoDate = new Date(acceptDateTime).toISOString()
    const payload = { requestedAt: isoDate }
    if (acceptNote) payload.adminResponse = acceptNote.trim()

    try {
      await appointmentAPI.approve(acceptAppointment._id || acceptAppointment.id, payload)
      setActionSuccess('Appointment approved successfully!')
      closeApproveModal()
      if (refresh) await refresh()
    } catch (err) {
      setActionError(err?.response?.data?.error || 'Failed to approve appointment')
    } finally {
      setActionLoading(null)
    }
  }, [acceptAppointment, acceptDateTime, acceptNote, refresh, closeApproveModal])

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

  const openCancelModal = (id) => {
    clearMessages()
    setModalAction('cancel')
    setModalAppointmentId(id)
    setIssueText('We need to cancel this visit due to an internal event.')
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
      } else if (modalAction === 'cancel') {
        await appointmentAPI.cancelByAdmin(modalAppointmentId, payload)
        setActionSuccess('Appointment cancelled for the visitor.')
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

  const loadDetailContext = useCallback(async (appointment) => {
    if (!appointment) return
    setDetailLoading(true)
    setDetailRequester(null)
    setDetailChild(null)
    setDetailError(null)
    try {
      const userPromise = appointment.requesterId
        ? authAPI.getUserById(appointment.requesterId)
        : Promise.resolve(null)
      const childPromise = appointment.childId
        ? childrenAPI.getById(appointment.childId)
        : Promise.resolve(null)

      const [userResult, childResult] = await Promise.allSettled([userPromise, childPromise])

      let aggregatedError = null

      if (userResult.status === 'fulfilled') {
        const payload = userResult.value?.data?.user || userResult.value?.data || null
        setDetailRequester(payload)
      } else if (userResult.status === 'rejected') {
        aggregatedError = userResult.reason?.response?.data?.error || 'Unable to load user profile'
      }

      if (childResult.status === 'fulfilled') {
        const payload = childResult.value?.data?.child || childResult.value?.data || null
        setDetailChild(payload)
      } else if (childResult.status === 'rejected') {
        aggregatedError = aggregatedError || childResult.reason?.response?.data?.error || 'Unable to load child details'
      }

      if (aggregatedError) {
        setDetailError(aggregatedError)
      }
    } catch (err) {
      setDetailError(err?.response?.data?.error || 'Unable to load appointment context')
    } finally {
      setDetailLoading(false)
    }
  }, [])

  const openDetailModal = useCallback((appointment) => {
    setDetailAppointment(appointment)
    setDetailModalOpen(true)
    loadDetailContext(appointment)
  }, [loadDetailContext])

  const closeDetailModal = () => {
    setDetailModalOpen(false)
    setDetailAppointment(null)
    setDetailRequester(null)
    setDetailChild(null)
    setDetailError(null)
  }

  const handleAcceptSlotChange = (value) => {
    setAcceptDateTime(value)
    if (acceptNoteTouched) return
    if (value && value !== acceptOriginalTime) {
      setAcceptNote(`Schedule updated to ${formatReadableSlot(value)}. Please confirm your availability.`)
    } else {
      setAcceptNote('Approved. Looking forward to your visit!')
    }
  }

  const handleAcceptNoteChange = (value) => {
    setAcceptNoteTouched(true)
    setAcceptNote(value)
  }

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

      <ScrollReveal animation="fade-up">
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
      </ScrollReveal>

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
              {formatFilterLabel(value)}
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
                      const statusLabel = formatStatusLabel(appt.status)
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
                              <button disabled={actionLoading === appointmentId} onClick={() => openApproveModal(appt)} className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-50"><FaCheckCircle /> Plan & Approve</button>
                              <button disabled={actionLoading === appointmentId} onClick={() => openRejectModal(appointmentId)} className="inline-flex items-center gap-1.5 rounded-full bg-rose-500 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-600 disabled:opacity-50"><FaTimesCircle /> Reject</button>
                              <button disabled={actionLoading === appointmentId} onClick={() => openBlockModal(appointmentId)} className="inline-flex items-center gap-1.5 rounded-full bg-red-700 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-red-800 disabled:opacity-50"><FaBan /> Block</button>
                              <button disabled={actionLoading === appointmentId} onClick={() => openCancelModal(appointmentId)} className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-4 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-50 dark:bg-dark-700 dark:text-rose-200 dark:hover:bg-dark-600"><FaTimes /> Cancel</button>
                            </div>
                          )}
                          {['approved', 'needsconfirmation'].includes(normalizeStatus(appt.status)) && (
                            <div className="mt-3 flex flex-wrap gap-2 border-t border-cream-100 pt-3 dark:border-dark-700">
                              <button
                                disabled={actionLoading === appointmentId}
                                onClick={() => openCancelModal(appointmentId)}
                                className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-4 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-50 dark:bg-dark-700 dark:text-rose-200 dark:hover:bg-dark-600"
                              >
                                <FaTimes /> Cancel appointment
                              </button>
                            </div>
                          )}
                          {appt.adminResponse && (
                            <p className="mt-2 rounded-xl border border-cream-200 bg-cream-50 px-3 py-2 text-xs text-teal-700 dark:border-dark-700 dark:bg-dark-900 dark:text-cream-200">
                              Admin: {appt.adminResponse}
                            </p>
                          )}
                          <button
                            onClick={() => openDetailModal(appt)}
                            className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-teal-600 hover:text-coral-500 dark:text-cream-200"
                          >
                            <FaInfoCircle /> View request details
                          </button>
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
            const statusLabel = formatStatusLabel(appt.status)
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

                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    onClick={() => openDetailModal(appt)}
                    className="inline-flex items-center gap-2 rounded-full border border-cream-200 px-4 py-2 text-xs font-semibold text-teal-700 transition hover:border-coral-300 hover:text-coral-500 dark:border-dark-600 dark:text-cream-200"
                  >
                    <FaInfoCircle /> View request details
                  </button>
                  {canAdminCancel(appt) && (
                    <button
                      onClick={() => openCancelModal(appointmentId)}
                      className="inline-flex items-center gap-2 rounded-full border border-rose-200 px-4 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 dark:border-dark-600 dark:text-rose-200 dark:hover:bg-dark-700"
                    >
                      <FaTimes /> Cancel appointment
                    </button>
                  )}
                </div>

                {/* Action buttons for pending appointments */}
                {normalizeStatus(appt.status) === 'pending' && (
                  <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-cream-100 pt-4 dark:border-dark-700">
                    <button
                      disabled={actionLoading === appointmentId}
                      onClick={() => openApproveModal(appt)}
                      className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-600 disabled:opacity-50"
                    >
                      <FaCheckCircle /> Plan & Approve
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
                    <button
                      disabled={actionLoading === appointmentId}
                      onClick={() => openCancelModal(appointmentId)}
                      className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-5 py-2 text-xs font-semibold text-rose-600 shadow-sm transition hover:bg-rose-50 disabled:opacity-50 dark:bg-dark-700 dark:text-rose-200"
                    >
                      <FaTimes /> Cancel appointment
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

      <ScrollReveal animation="fade-up" delay={300}>
      <section className="grid gap-6 md:grid-cols-5">
        <div className="rounded-3xl border border-cream-200 bg-white/90 p-5 shadow-sm dark:border-dark-700 dark:bg-dark-900/70">
          <FaClock className="text-2xl text-amber-500" />
          <p className="mt-3 text-xs uppercase tracking-[0.3em] text-teal-500 dark:text-cream-300">Awaiting response</p>
          <p className="mt-1 text-3xl font-semibold text-teal-900 dark:text-cream-50">{statusMetrics.pending}</p>
        </div>
        <div className="rounded-3xl border border-cream-200 bg-white/90 p-5 shadow-sm dark:border-dark-700 dark:bg-dark-900/70">
          <FaCheckCircle className="text-2xl text-emerald-500" />
          <p className="mt-3 text-xs uppercase tracking-[0.3em] text-teal-500 dark:text-cream-300">Approved</p>
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
        <div className="rounded-3xl border border-cream-200 bg-white/90 p-5 shadow-sm dark:border-dark-700 dark:bg-dark-900/70">
          <FaCheckCircle className="text-2xl text-teal-500" />
          <p className="mt-3 text-xs uppercase tracking-[0.3em] text-teal-500 dark:text-cream-300">Completed</p>
          <p className="mt-1 text-3xl font-semibold text-teal-900 dark:text-cream-50">{statusMetrics.completed}</p>
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
      </ScrollReveal>

      {/* Approve / Reschedule modal */}
      {acceptModalOpen && acceptAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={closeApproveModal}>
          <div
            className="relative w-full max-w-xl rounded-3xl border border-cream-200 bg-white p-8 shadow-2xl dark:border-dark-700 dark:bg-dark-900"
            onClick={(event) => event.stopPropagation()}
          >
            <button onClick={closeApproveModal} className="absolute right-4 top-4 text-teal-600 hover:text-coral-500 dark:text-cream-200" aria-label="Close approve modal">
              <FaTimes />
            </button>
            <p className="text-xs uppercase tracking-[0.4em] text-teal-500 dark:text-cream-400">Approve request</p>
            <h3 className="mt-1 text-2xl font-semibold text-teal-900 dark:text-cream-50">Confirm or reschedule visit</h3>
            <p className="mt-1 text-sm text-teal-600 dark:text-cream-300">
              Adjust the appointment slot if needed. A confirmation note will be sent to the requester automatically.
            </p>

            <div className="mt-6 space-y-5">
              <label className="block text-sm font-semibold text-teal-700 dark:text-cream-200">
                Preferred visit slot
                <input
                  type="datetime-local"
                  value={acceptDateTime}
                  onChange={(e) => handleAcceptSlotChange(e.target.value)}
                  min={formatDateTimeLocalInput(new Date(Date.now() + 60 * 60 * 1000))}
                  className="mt-2 w-full rounded-2xl border border-cream-200 bg-white px-4 py-3 text-teal-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 dark:border-dark-700 dark:bg-dark-800 dark:text-cream-50"
                  required
                />
              </label>

              <label className="block text-sm font-semibold text-teal-700 dark:text-cream-200">
                Note for requester
                <textarea
                  rows={4}
                  value={acceptNote}
                  onChange={(e) => handleAcceptNoteChange(e.target.value)}
                  placeholder="Share arrival instructions or mention the updated schedule."
                  className="mt-2 w-full rounded-2xl border border-cream-200 bg-white px-4 py-3 text-sm text-teal-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 dark:border-dark-700 dark:bg-dark-800 dark:text-cream-50"
                />
              </label>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeApproveModal}
                className="w-full rounded-full border border-cream-200 px-6 py-2 text-sm font-semibold text-teal-600 hover:bg-cream-100 dark:border-dark-700 dark:text-cream-300 dark:hover:bg-dark-800 sm:w-auto"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApproveSubmit}
                disabled={actionLoading === (acceptAppointment._id || acceptAppointment.id)}
                className="w-full rounded-full bg-emerald-500 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600 disabled:opacity-60 sm:w-auto"
              >
                {actionLoading === (acceptAppointment._id || acceptAppointment.id) ? 'Approving…' : 'Approve & Notify'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Appointment detail modal */}
      {detailModalOpen && detailAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={closeDetailModal}>
          <div
            className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl border border-cream-200 bg-white p-8 shadow-2xl dark:border-dark-700 dark:bg-dark-900"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              onClick={closeDetailModal}
              className="absolute right-4 top-4 text-teal-600 hover:text-coral-500 dark:text-cream-200"
              aria-label="Close appointment details"
            >
              <FaTimes />
            </button>

            <div className="flex flex-col gap-2 pr-10">
              <p className="text-xs uppercase tracking-[0.4em] text-teal-500 dark:text-cream-400">Appointment request</p>
              <h3 className="text-2xl font-semibold text-teal-900 dark:text-cream-50">{detailAppointment.purpose || 'Visit request'}</h3>
              <p className="text-sm text-teal-600 dark:text-cream-300">
                {formatDateTime(detailAppointment.requestedAt)} • {formatRequester(detailAppointment)}
              </p>
            </div>

            {detailLoading ? (
              <div className="mt-10 flex justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-b-4 border-t-4 border-coral-500" />
              </div>
            ) : (
              <div className="mt-6 space-y-6">
                {detailError && (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-400/30 dark:bg-rose-500/10 dark:text-rose-100">
                    {detailError}
                  </div>
                )}

                <div className="rounded-2xl border border-cream-200 bg-cream-50 p-5 dark:border-dark-700 dark:bg-dark-800">
                  <h4 className="text-sm font-semibold uppercase tracking-wider text-teal-500">Appointment info</h4>
                  <div className="mt-3 grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-xs text-teal-500">Preferred slot</p>
                      <p className="text-base font-semibold text-teal-900 dark:text-cream-100">{formatDateTime(detailAppointment.requestedAt)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-teal-500">Status</p>
                      <span className={`mt-1 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(detailAppointment.status)}`}>
                        {formatStatusLabel(detailAppointment.status)}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-teal-500">Created on</p>
                      <p className="text-base font-semibold text-teal-900 dark:text-cream-100">{formatDateTime(detailAppointment.createdAt || detailAppointment.updatedAt)}</p>
                    </div>
                    {detailAppointment.adminResponse && (
                      <div>
                        <p className="text-xs text-teal-500">Admin note</p>
                        <p className="text-sm text-teal-800 dark:text-cream-200 whitespace-pre-line">{detailAppointment.adminResponse}</p>
                      </div>
                    )}
                  </div>
                  <p className="mt-4 rounded-2xl bg-white px-4 py-3 text-sm text-teal-800 dark:bg-dark-900 dark:text-cream-100">
                    {detailAppointment.purpose || 'No additional notes provided.'}
                  </p>
                </div>

                <div className="rounded-2xl border border-cream-200 bg-white p-5 dark:border-dark-700 dark:bg-dark-800">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 dark:bg-teal-900/20">
                      <FaUser className="text-xl text-teal-500" />
                    </div>
                    <div>
                      <h4 className="text-base font-semibold text-teal-900 dark:text-cream-50">Requester profile</h4>
                      <p className="text-xs uppercase tracking-wider text-teal-500">{capitalize(detailAppointment.requesterType)}</p>
                    </div>
                  </div>
                  {detailRequester ? (
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <div>
                        <p className="text-xs text-teal-500">Full name</p>
                        <p className="text-base font-semibold text-teal-900 dark:text-cream-50">
                          {[detailRequester.fullname?.firstname, detailRequester.fullname?.lastname].filter(Boolean).join(' ') || 'Not provided'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-teal-500">Username</p>
                        <p className="font-semibold text-teal-800 dark:text-cream-100">{detailRequester.username}</p>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-teal-700 dark:text-cream-100">
                        <FaEnvelope />
                        <a href={`mailto:${detailRequester.email}`} className="underline-offset-2 hover:underline">{detailRequester.email}</a>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-teal-700 dark:text-cream-100">
                        <FaPhone />
                        <span>{detailRequester.phone || 'Not provided'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-teal-700 dark:text-cream-100 md:col-span-2">
                        <FaMapMarkerAlt />
                        <span>{formatAddress(detailRequester.address)}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-4 text-sm text-teal-600 dark:text-cream-200">Requester profile is unavailable.</p>
                  )}
                </div>

                {detailChild && (
                  <div className="rounded-2xl border border-cream-200 bg-white p-5 dark:border-dark-700 dark:bg-dark-800">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-coral-50 dark:bg-coral-900/20">
                        <FaChild className="text-xl text-coral-500" />
                      </div>
                      <div>
                        <h4 className="text-base font-semibold text-teal-900 dark:text-cream-50">Child requested</h4>
                        <p className="text-xs uppercase tracking-wider text-teal-500">{detailChild.gender || 'N/A'} • {detailChild.age ? `${detailChild.age} yrs` : 'Age N/A'}</p>
                      </div>
                    </div>
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <div>
                        <p className="text-xs text-teal-500">Name</p>
                        <p className="text-base font-semibold text-teal-900 dark:text-cream-50">{detailChild.name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-teal-500">Location</p>
                        <p className="text-sm text-teal-700 dark:text-cream-200">{[detailChild.city, detailChild.state].filter(Boolean).join(', ') || 'Not provided'}</p>
                      </div>
                      {detailChild.background && (
                        <div className="md:col-span-2">
                          <p className="text-xs text-teal-500">Story</p>
                          <p className="text-sm text-teal-700 dark:text-cream-200 line-clamp-4">{detailChild.background}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reject / Block reason modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-3xl border border-cream-200 bg-white p-8 shadow-2xl dark:border-dark-700 dark:bg-dark-900">
            <button onClick={closeModal} className="absolute right-4 top-4 text-teal-400 hover:text-teal-700 dark:text-cream-400 dark:hover:text-cream-100">
              <FaTimes className="text-lg" />
            </button>

            <h3 className="text-xl font-semibold text-teal-900 dark:text-cream-50">
              {activeModalCopy.title}
            </h3>
            <p className="mt-1 text-sm text-teal-600 dark:text-cream-300/70">
              {activeModalCopy.description}
            </p>

            <textarea
              rows={4}
              value={issueText}
              onChange={(e) => setIssueText(e.target.value)}
              placeholder={activeModalCopy.placeholder}
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
                    : modalAction === 'block'
                      ? 'bg-red-700 hover:bg-red-800'
                      : 'bg-slate-600 hover:bg-slate-700'
                }`}
              >
                {actionLoading === modalAppointmentId
                  ? 'Submitting…'
                  : activeModalCopy.action}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AppointmentsManagement
