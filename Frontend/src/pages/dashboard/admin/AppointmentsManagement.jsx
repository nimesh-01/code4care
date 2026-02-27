import { useMemo, useState } from 'react'
import { FaCalendarCheck, FaCheckCircle, FaClock, FaTimesCircle } from 'react-icons/fa'
import { useAdminDashboardContext } from './AdminLayout'

const statusStyles = {
  pending: 'bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-500/20 dark:text-amber-100 dark:border-amber-400/30',
  approved: 'bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-100 dark:border-emerald-400/30',
  rejected: 'bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-500/20 dark:text-rose-100 dark:border-rose-400/30',
  cancelled: 'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-600/30 dark:text-slate-100 dark:border-slate-500/40',
}

const statusFilters = ['all', 'pending', 'approved', 'rejected', 'cancelled']

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

const AppointmentsManagement = () => {
  const { data } = useAdminDashboardContext()
  const [statusFilter, setStatusFilter] = useState('all')

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
    const base = { pending: 0, approved: 0, rejected: 0 }
    appointmentSource.forEach((appt) => {
      const state = normalizeStatus(appt.status)
      if (base[state] !== undefined) base[state] += 1
    })
    return base
  }, [appointmentSource])

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.4em] text-teal-500 dark:text-cream-300">Appointments</p>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-3xl font-semibold text-teal-900 dark:text-cream-50">Visits & reviews</h2>
            <p className="text-sm text-teal-600 dark:text-cream-300/70">Approve donor visits, volunteer meets, and medical check-ups from one view.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button className="rounded-full border border-cream-200 bg-white px-4 py-2 text-sm text-teal-600 shadow-sm dark:border-dark-700 dark:bg-dark-800 dark:text-cream-200">Calendar view</button>
            <button className="rounded-full border border-coral-200 bg-coral-50 px-4 py-2 text-sm text-coral-600 shadow-sm dark:border-coral-400/40 dark:bg-coral-400/10 dark:text-coral-100">Send reminders</button>
            <button className="rounded-full bg-gradient-to-r from-coral-500 to-teal-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-coral-200/60">New appointment</button>
          </div>
        </div>
      </header>

      <div className="rounded-3xl border border-cream-200 bg-white/90 p-6 shadow-lg dark:border-dark-700 dark:bg-dark-900/70">
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
      </div>

      <section className="grid gap-6 md:grid-cols-3">
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
    </div>
  )
}

export default AppointmentsManagement
