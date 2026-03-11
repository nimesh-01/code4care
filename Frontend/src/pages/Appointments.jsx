import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FaCalendarAlt,
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
  FaInfoCircle,
  FaRedo,
  FaTimes,
  FaTimesCircle
} from 'react-icons/fa'
import { toast } from 'react-toastify'
import Navbar from '../components/Navbar'
import { appointmentAPI, orphanagesAPI, childrenAPI } from '../services/api'
import { useConfirm } from '../context/ConfirmContext'
import { ScrollReveal } from '../hooks/useScrollReveal'

const statusMeta = {
  pending: {
    label: 'Pending review',
    badge: 'bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-500/20 dark:text-amber-100 dark:border-amber-300/30',
    icon: FaClock,
  },
  approved: {
    label: 'Approved',
    badge: 'bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-100 dark:border-emerald-400/30',
    icon: FaCheckCircle,
  },
  rejected: {
    label: 'Rejected',
    badge: 'bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-500/20 dark:text-rose-100 dark:border-rose-400/30',
    icon: FaTimesCircle,
  },
  cancelled: {
    label: 'Cancelled',
    badge: 'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-600/30 dark:text-slate-100 dark:border-slate-500/40',
    icon: FaTimesCircle,
  },
  blocked: {
    label: 'Blocked',
    badge: 'bg-red-100 text-red-800 border border-red-200 dark:bg-red-500/20 dark:text-red-100 dark:border-red-300/40',
    icon: FaExclamationTriangle,
  },
  needsconfirmation: {
    label: 'Pending your review',
    badge: 'bg-sky-100 text-sky-800 border border-sky-200 dark:bg-sky-500/20 dark:text-sky-100 dark:border-sky-400/30',
    icon: FaInfoCircle,
  },
  completed: {
    label: 'Completed',
    badge: 'bg-teal-100 text-teal-700 border border-teal-200 dark:bg-teal-500/20 dark:text-teal-100 dark:border-teal-400/30',
    icon: FaCheckCircle,
  },
}

const statusFilters = ['all', 'pending', 'needsconfirmation', 'approved', 'rejected', 'cancelled', 'blocked', 'completed']

const formatDateTime = (value, options = {}) => {
  if (!value) return 'Not set'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Not set'
  return date.toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  })
}

const extractAppointments = (payload) => {
  if (!payload) return []
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload.appointments)) return payload.appointments
  if (Array.isArray(payload.data)) return payload.data
  if (Array.isArray(payload.results)) return payload.results
  if (payload.data) return extractAppointments(payload.data)
  return []
}

const AppointmentDetailModal = ({ appointment, onClose, orphanage, child }) => {
  if (!appointment) return null
  const status = (appointment.status || 'pending').toLowerCase()
  const statusInfo = statusMeta[status]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={onClose}>
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-8 shadow-2xl dark:bg-dark-900"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-wide text-teal-500">Appointment summary</p>
            <h2 className="text-2xl font-bold text-teal-900 dark:text-cream-50">{orphanage?.name || 'Orphanage visit'}</h2>
          </div>
          <button onClick={onClose} className="text-teal-700 hover:text-coral-500 dark:text-cream-100" aria-label="Close details">
            <FaTimes className="text-xl" />
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-cream-200 bg-cream-50 p-4 dark:border-dark-700 dark:bg-dark-800">
            <p className="text-xs uppercase tracking-wide text-teal-500">Preferred date & time</p>
            <p className="mt-1 text-lg font-semibold text-teal-900 dark:text-cream-50">{formatDateTime(appointment.requestedAt)}</p>
          </div>
          <div className="rounded-2xl border border-cream-200 bg-cream-50 p-4 dark:border-dark-700 dark:bg-dark-800">
            <p className="text-xs uppercase tracking-wide text-teal-500">Status</p>
            <span className={`mt-1 inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ${statusInfo?.badge || ''}`}>
              {statusInfo?.icon && <statusInfo.icon />}
              {statusInfo?.label || status}
            </span>
          </div>
        </div>

        <div className="mt-6 space-y-3 rounded-2xl border border-cream-200 bg-white p-5 dark:border-dark-700 dark:bg-dark-800">
          <p className="text-xs uppercase tracking-wide text-teal-500">Purpose</p>
          <p className="text-teal-800 dark:text-cream-100 whitespace-pre-line">{appointment.purpose}</p>
        </div>

        {child && (
          <div className="mt-4 rounded-2xl border border-cream-200 bg-white p-5 dark:border-dark-700 dark:bg-dark-800">
            <p className="text-xs uppercase tracking-wide text-teal-500">Child requested</p>
            <p className="text-teal-900 dark:text-cream-100 font-semibold">{child.name}</p>
            <p className="text-sm text-teal-500 dark:text-cream-300">{[child.age && `${child.age} yrs`, child.gender].filter(Boolean).join(' • ')}</p>
          </div>
        )}

        {appointment.adminResponse && (
          <div className={`mt-4 rounded-2xl border px-5 py-4 ${status === 'rejected' ? 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/40 dark:bg-rose-500/10 dark:text-rose-100' : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-300/40 dark:bg-emerald-500/10 dark:text-emerald-100'}`}>
            <p className="text-sm font-semibold">Note from orphanage</p>
            <p className="text-sm mt-1 whitespace-pre-line">{appointment.adminResponse}</p>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-2 text-sm text-teal-500 dark:text-cream-300">
          <span>Requested on {formatDateTime(appointment.createdAt)}</span>
          <span>Request ID: {appointment._id || appointment.id}</span>
        </div>
      </div>
    </div>
  )
}

const Appointments = () => {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [orphanageLookup, setOrphanageLookup] = useState({})
  const [childLookup, setChildLookup] = useState({})
  const [cancellingId, setCancellingId] = useState(null)
  const [confirmingAction, setConfirmingAction] = useState({ id: null, action: null })
  const confirmAction = useConfirm()

  useEffect(() => {
    fetchAppointments()
  }, [])

  const fetchAppointments = async (withSpinner = true) => {
    try {
      if (withSpinner) {
        setLoading(true)
      } else {
        setRefreshing(true)
      }
      setError(null)
      const response = await appointmentAPI.getAll()
      const list = extractAppointments(response.data)
        .map((item) => ({ ...item, status: (item.status || 'pending').toLowerCase() }))
        .sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt))

      setAppointments(list)
      await hydrateLookups(list)
    } catch (err) {
      console.error('Failed to load appointments', err)
      setError('Unable to load appointments right now. Please try again later.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const hydrateLookups = async (list) => {
    const orphanageIds = [...new Set(list.map((appt) => appt.orphanageId).filter(Boolean))]
    const childIds = [...new Set(list.map((appt) => appt.childId).filter(Boolean))]

    try {
      const [orphanageResponses, childResponses] = await Promise.all([
        Promise.allSettled(orphanageIds.map((id) => orphanagesAPI.getById(id))),
        Promise.allSettled(childIds.map((id) => childrenAPI.getById(id))),
      ])

      const nextOrphanageMap = {}
      orphanageResponses.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          const value = result.value.data?.orphanage || result.value.data?.data || result.value.data
          if (value) nextOrphanageMap[orphanageIds[index]] = value
        }
      })

      const nextChildMap = {}
      childResponses.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          const value = result.value.data?.child || result.value.data || null
          if (value) nextChildMap[childIds[index]] = value
        }
      })

      setOrphanageLookup(nextOrphanageMap)
      setChildLookup(nextChildMap)
    } catch (lookupError) {
      console.warn('Failed to hydrate appointment context', lookupError)
    }
  }

  const filteredAppointments = useMemo(() => {
    if (statusFilter === 'all') return appointments
    return appointments.filter((appt) => appt.status === statusFilter)
  }, [appointments, statusFilter])

  const stats = useMemo(() => {
    const total = appointments.length
    const pending = appointments.filter((appt) => ['pending', 'needsconfirmation'].includes(appt.status)).length
    const approved = appointments.filter((appt) => appt.status === 'approved').length
    const rejected = appointments.filter((appt) => appt.status === 'rejected').length
    const completed = appointments.filter((appt) => appt.status === 'completed').length
    return { total, pending, approved, rejected, completed }
  }, [appointments])

  const getFilterLabel = (status) => {
    if (status === 'all') return 'All'
    return statusMeta[status]?.label || status.replace(/(^|\s)([a-z])/g, (_, space, char) => `${space}${char.toUpperCase()}`)
  }

  const handleCancel = async (appointment) => {
    const status = (appointment.status || '').toLowerCase()
    if (status !== 'pending') return

    const proceed = await confirmAction({
      title: 'Cancel this appointment?',
      message: 'Your request will be withdrawn and the orphanage will be notified.',
      confirmLabel: 'Cancel request',
      cancelLabel: 'Keep request',
      tone: 'danger',
    })
    if (!proceed) return

    try {
      setCancellingId(appointment._id || appointment.id)
      await appointmentAPI.cancel(appointment._id || appointment.id)
      toast.success('Appointment cancelled')
      await fetchAppointments(false)
    } catch (err) {
      const message = err.response?.data?.error || 'Unable to cancel request'
      toast.error(message)
    } finally {
      setCancellingId(null)
    }
  }

  const handleConfirmAction = async (appointment, action) => {
    const status = (appointment.status || '').toLowerCase()
    if (status !== 'needsconfirmation') return

    if (action === 'cancel') {
      const decline = await confirmAction({
        title: 'Decline schedule update?',
        message: 'This action cannot be undone and the slot may be offered to someone else.',
        confirmLabel: 'Decline',
        cancelLabel: 'Go back',
        tone: 'danger',
      })
      if (!decline) return
    }

    const appointmentId = appointment._id || appointment.id
    try {
      setConfirmingAction({ id: appointmentId, action })
      await appointmentAPI.confirm(appointmentId, { action })
      toast.success(action === 'accept' ? 'Appointment confirmed' : 'Appointment declined')
      await fetchAppointments(false)
    } catch (err) {
      const message = err.response?.data?.error || 'Unable to update appointment'
      toast.error(message)
    } finally {
      setConfirmingAction({ id: null, action: null })
    }
  }

  return (
    <div className="min-h-screen bg-cream-50 dark:bg-dark-900">
      <Navbar />

      <section className="pt-32 pb-16 bg-gradient-to-br from-coral-500 to-teal-600 dark:from-dark-800 dark:to-dark-950">
        <ScrollReveal animation="fade-up" className="container mx-auto px-6">
          <div className="flex flex-col gap-4 text-white">
            <p className="text-sm uppercase tracking-[0.3em] text-white/80">Appointments</p>
            <h1 className="text-4xl font-playfair font-bold">Manage Your Visits</h1>
            <p className="max-w-2xl text-white/80">
              Track every appointment you have requested with orphanages. Each request is reviewed by the orphanage admin, who may approve, reschedule, or share follow-up notes.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => fetchAppointments(false)}
                className="inline-flex items-center gap-2 rounded-full bg-white/15 px-5 py-2 text-sm font-medium text-white transition hover:bg-white/25"
              >
                <FaRedo className={refreshing ? 'animate-spin' : ''} />
                Refresh
              </button>
            </div>
          </div>
        </ScrollReveal>
      </section>

      <section className="-mt-12 pb-16">
        <div className="container mx-auto px-6">
          <div className="grid gap-4 md:grid-cols-4">
            <ScrollReveal animation="fade-up" className="rounded-2xl bg-white p-5 shadow-sm dark:bg-dark-800">
              <p className="text-sm text-teal-500">Total requests</p>
              <p className="text-3xl font-bold text-teal-900 dark:text-cream-50">{stats.total}</p>
            </ScrollReveal>
            <ScrollReveal animation="fade-up" delay={100} className="rounded-2xl bg-white p-5 shadow-sm dark:bg-dark-800">
              <p className="text-sm text-amber-500">Pending</p>
              <p className="text-3xl font-bold text-teal-900 dark:text-cream-50">{stats.pending}</p>
            </ScrollReveal>
            <ScrollReveal animation="fade-up" delay={200} className="rounded-2xl bg-white p-5 shadow-sm dark:bg-dark-800">
              <p className="text-sm text-emerald-500">Approved</p>
              <p className="text-3xl font-bold text-teal-900 dark:text-cream-50">{stats.approved}</p>
            </ScrollReveal>
            <ScrollReveal animation="fade-up" delay={300} className="rounded-2xl bg-white p-5 shadow-sm dark:bg-dark-800">
              <p className="text-sm text-rose-500">Rejected</p>
              <p className="text-3xl font-bold text-teal-900 dark:text-cream-50">{stats.rejected}</p>
            </ScrollReveal>
            <ScrollReveal animation="fade-up" delay={400} className="rounded-2xl bg-white p-5 shadow-sm dark:bg-dark-800">
              <p className="text-sm text-teal-500">Completed</p>
              <p className="text-3xl font-bold text-teal-900 dark:text-cream-50">{stats.completed}</p>
            </ScrollReveal>
          </div>

          <div className="mt-10 overflow-x-auto">
            <div className="flex gap-3">
              {statusFilters.map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`rounded-full px-5 py-2 text-sm font-medium capitalize ${
                    statusFilter === status
                      ? 'bg-teal-600 text-white shadow'
                      : 'bg-white text-teal-700 dark:bg-dark-800 dark:text-cream-200'
                  }`}
                >
                  {getFilterLabel(status)}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8">
            {loading ? (
              <div className="flex justify-center py-20">
                <div className="h-16 w-16 animate-spin rounded-full border-b-4 border-t-4 border-coral-500" />
              </div>
            ) : error ? (
              <div className="rounded-3xl bg-white p-10 text-center shadow dark:bg-dark-800">
                <FaInfoCircle className="mx-auto text-4xl text-coral-500" />
                <p className="mt-4 text-lg text-teal-700 dark:text-cream-100">{error}</p>
                <button
                  onClick={() => fetchAppointments(true)}
                  className="mt-6 rounded-full bg-coral-500 px-6 py-2 text-white"
                >
                  Try again
                </button>
              </div>
            ) : filteredAppointments.length === 0 ? (
              <div className="rounded-3xl bg-white p-10 text-center shadow dark:bg-dark-800">
                <FaCalendarAlt className="mx-auto text-5xl text-teal-300" />
                <h3 className="mt-4 text-2xl font-semibold text-teal-900 dark:text-cream-50">No appointments yet</h3>
                <p className="mt-2 text-teal-600 dark:text-cream-300">
                  Browse children or orphanages to schedule your first appointment. Each visit helps build trust with the caretakers.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-4">
                  <Link to="/children" className="rounded-full bg-teal-600 px-6 py-2 text-white">Browse Children</Link>
                  <Link to="/orphanages" className="rounded-full border border-teal-200 px-6 py-2 text-teal-700 dark:border-dark-600 dark:text-cream-100">Browse Orphanages</Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAppointments.map((appointment) => {
                  const status = (appointment.status || 'pending').toLowerCase()
                  const statusInfo = statusMeta[status] || statusMeta.pending
                  const orphanage = orphanageLookup[appointment.orphanageId]
                  const child = appointment.childId ? childLookup[appointment.childId] : null
                  const needsUserDecision = status === 'needsconfirmation'
                  const canCancel = status === 'pending'
                  const isCancelling = cancellingId === (appointment._id || appointment.id)
                  const isConfirming = needsUserDecision && confirmingAction.id === (appointment._id || appointment.id)
                  const isConfirmingAccept = isConfirming && confirmingAction.action === 'accept'
                  const isConfirmingDecline = isConfirming && confirmingAction.action === 'cancel'

                  return (
                    <div key={appointment._id || appointment.id} className="rounded-2xl bg-white p-6 shadow-sm dark:bg-dark-800">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm text-teal-500">{formatDateTime(appointment.requestedAt)}</p>
                          <h3 className="text-xl font-semibold text-teal-900 dark:text-cream-50">
                            {orphanage?.name || 'Orphanage visit'}
                          </h3>
                          {child && (
                            <p className="text-sm text-teal-500 dark:text-cream-300">Child: {child.name}</p>
                          )}
                        </div>
                        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ${statusInfo.badge}`}>
                          <statusInfo.icon />
                          {statusInfo.label}
                        </span>
                      </div>

                      <p className="mt-4 line-clamp-2 text-teal-700 dark:text-cream-200">{appointment.purpose}</p>

                      {appointment.adminResponse && ['rejected', 'approved', 'needsconfirmation'].includes(status) && (
                        <p
                          className={`mt-3 rounded-xl px-4 py-2 text-sm ${
                            status === 'rejected'
                              ? 'bg-rose-50 text-rose-600 dark:bg-rose-500/20 dark:text-rose-100'
                              : status === 'needsconfirmation'
                                ? 'bg-sky-50 text-sky-700 dark:bg-sky-500/20 dark:text-sky-100'
                                : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-100'
                          }`}
                        >
                          {status === 'rejected' ? 'Reason' : 'Update'}: {appointment.adminResponse}
                        </p>
                      )}

                      {needsUserDecision && (
                        <div className="mt-4 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-100">
                          The orphanage suggested a new schedule. Please accept it or decline so they can plan accordingly.
                        </div>
                      )}

                      <div className="mt-4 flex flex-wrap items-center gap-3">
                        <button
                          onClick={() => setSelectedAppointment(appointment)}
                          className="rounded-full border border-cream-200 px-4 py-2 text-sm font-medium text-teal-700 hover:border-coral-400 hover:text-coral-500 dark:border-dark-600 dark:text-cream-200"
                        >
                          View details
                        </button>
                        {needsUserDecision && (
                          <>
                            <button
                              onClick={() => handleConfirmAction(appointment, 'accept')}
                              disabled={isConfirmingAccept}
                              className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-emerald-500/20 dark:text-emerald-100"
                            >
                              {isConfirmingAccept ? 'Saving...' : 'Accept new time'}
                            </button>
                            <button
                              onClick={() => handleConfirmAction(appointment, 'cancel')}
                              disabled={isConfirmingDecline}
                              className="rounded-full border border-transparent bg-rose-100 px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-200 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-rose-500/20 dark:text-rose-100"
                            >
                              {isConfirmingDecline ? 'Processing...' : 'Decline update'}
                            </button>
                          </>
                        )}
                        {canCancel && (
                          <button
                            onClick={() => handleCancel(appointment)}
                            disabled={isCancelling}
                            className="rounded-full border border-transparent bg-rose-100 px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-200 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-rose-500/20 dark:text-rose-100"
                          >
                            {isCancelling ? 'Cancelling...' : 'Cancel request'}
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      <AppointmentDetailModal
        appointment={selectedAppointment}
        orphanage={selectedAppointment ? orphanageLookup[selectedAppointment.orphanageId] : null}
        child={selectedAppointment?.childId ? childLookup[selectedAppointment.childId] : null}
        onClose={() => setSelectedAppointment(null)}
      />
    </div>
  )
}

export default Appointments
