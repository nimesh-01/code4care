import { useMemo, useState, useCallback } from 'react'
import { FaExclamationTriangle, FaLifeRing, FaPlusCircle, FaTimes, FaCheckCircle, FaUserShield } from 'react-icons/fa'
import { useAdminDashboardContext } from './AdminLayout'
import { helpRequestAPI } from '../../../services/api'

const REQUEST_TYPES = ['Teaching', 'Medical', 'Exam', 'Other']

const statusStyles = {
  pending: 'bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-500/20 dark:text-amber-100 dark:border-amber-400/30',
  accepted: 'bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-500/20 dark:text-blue-100 dark:border-blue-400/30',
  completed: 'bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-100 dark:border-emerald-400/30',
}

const typeStyles = {
  Teaching: 'bg-indigo-100 text-indigo-700 border border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-100 dark:border-indigo-400/30',
  Medical: 'bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-500/20 dark:text-rose-100 dark:border-rose-400/30',
  Exam: 'bg-violet-100 text-violet-700 border border-violet-200 dark:bg-violet-500/20 dark:text-violet-100 dark:border-violet-400/30',
  Other: 'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-500/20 dark:text-slate-100 dark:border-slate-400/30',
}

const capitalize = (v) => v ? v.charAt(0).toUpperCase() + v.slice(1) : ''

const formatShortId = (v) => v ? `#${String(v).slice(-6).toUpperCase()}` : ''

const formatDateTime = (v) => {
  if (!v) return '—'
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
}

const HelpRequestsManagement = () => {
  const { data, refresh } = useAdminDashboardContext()
  const [statusFilter, setStatusFilter] = useState('all')

  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [formData, setFormData] = useState({ requestType: 'Teaching', description: '', requiredSkills: '', childId: '' })
  const [submitting, setSubmitting] = useState(false)
  const [actionError, setActionError] = useState(null)
  const [actionSuccess, setActionSuccess] = useState(null)

  const helpRequests = useMemo(() => {
    const list = Array.isArray(data.helpRequests) ? data.helpRequests : []
    const sorted = [...list].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    if (statusFilter === 'all') return sorted
    return sorted.filter((req) => req.status === statusFilter)
  }, [data.helpRequests, statusFilter])

  const metrics = useMemo(() => {
    const list = Array.isArray(data.helpRequests) ? data.helpRequests : []
    return {
      pending: list.filter((r) => r.status === 'pending').length,
      accepted: list.filter((r) => r.status === 'accepted').length,
      completed: list.filter((r) => r.status === 'completed').length,
    }
  }, [data.helpRequests])

  // Children list for optional child selection
  const children = useMemo(() => Array.isArray(data.children) ? data.children : [], [data.children])

  const clearMessages = () => { setActionError(null); setActionSuccess(null) }

  const openModal = () => {
    clearMessages()
    setFormData({ requestType: 'Teaching', description: '', requiredSkills: '', childId: '' })
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setFormData({ requestType: 'Teaching', description: '', requiredSkills: '', childId: '' })
  }

  const handleChange = (field, value) => setFormData((prev) => ({ ...prev, [field]: value }))

  const handleSubmit = useCallback(async () => {
    clearMessages()
    if (!formData.description || formData.description.trim().length < 10) {
      setActionError('Description must be at least 10 characters.')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        requestType: formData.requestType,
        description: formData.description.trim(),
      }

      // Parse skills from comma-separated string
      const skills = formData.requiredSkills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
      if (skills.length) payload.requiredSkills = skills

      if (formData.childId) payload.childId = formData.childId

      await helpRequestAPI.create(payload)
      setActionSuccess('Help request created successfully!')
      closeModal()
      if (refresh) await refresh()
    } catch (err) {
      setActionError(err?.response?.data?.error || err?.response?.data?.errors?.[0]?.msg || 'Failed to create help request')
    } finally {
      setSubmitting(false)
    }
  }, [formData, refresh])

  return (
    <div className="space-y-8">
      {/* Success / Error banners */}
      {actionSuccess && (
        <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-200">
          {actionSuccess}
          <button onClick={() => setActionSuccess(null)} className="ml-3 text-emerald-500 hover:text-emerald-700"><FaTimes /></button>
        </div>
      )}
      {actionError && !modalOpen && (
        <div className="flex items-center justify-between rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3 text-sm text-rose-700 dark:border-rose-400/30 dark:bg-rose-500/10 dark:text-rose-200">
          {actionError}
          <button onClick={() => setActionError(null)} className="ml-3 text-rose-500 hover:text-rose-700"><FaTimes /></button>
        </div>
      )}

      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-teal-500 dark:text-cream-300">Help requests</p>
          <h2 className="text-3xl font-semibold text-teal-900 dark:text-cream-50">Resource escalation desk</h2>
          <p className="text-sm text-teal-600 dark:text-cream-300/70">Create emergency alerts, assign volunteers, and close the loop with donors.</p>
        </div>
        <button
          onClick={openModal}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-amber-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-rose-200/60 transition hover:shadow-xl"
        >
          <FaPlusCircle /> New request
        </button>
      </header>

      {/* Metrics */}
      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-cream-200 bg-white/90 p-5 shadow-sm dark:border-dark-700 dark:bg-dark-900/70">
          <FaExclamationTriangle className="text-2xl text-amber-500" />
          <p className="mt-3 text-xs uppercase tracking-[0.3em] text-teal-500 dark:text-cream-300">Pending</p>
          <p className="mt-1 text-3xl font-semibold text-teal-900 dark:text-cream-50">{metrics.pending}</p>
        </div>
        <div className="rounded-3xl border border-cream-200 bg-white/90 p-5 shadow-sm dark:border-dark-700 dark:bg-dark-900/70">
          <FaUserShield className="text-2xl text-blue-500" />
          <p className="mt-3 text-xs uppercase tracking-[0.3em] text-teal-500 dark:text-cream-300">Accepted</p>
          <p className="mt-1 text-3xl font-semibold text-teal-900 dark:text-cream-50">{metrics.accepted}</p>
        </div>
        <div className="rounded-3xl border border-cream-200 bg-white/90 p-5 shadow-sm dark:border-dark-700 dark:bg-dark-900/70">
          <FaCheckCircle className="text-2xl text-emerald-500" />
          <p className="mt-3 text-xs uppercase tracking-[0.3em] text-teal-500 dark:text-cream-300">Completed</p>
          <p className="mt-1 text-3xl font-semibold text-teal-900 dark:text-cream-50">{metrics.completed}</p>
        </div>
      </section>

      <div className="rounded-3xl border border-cream-200 bg-white/90 p-6 shadow-lg dark:border-dark-700 dark:bg-dark-900/70">
        <div className="flex flex-wrap items-center gap-3">
          {['all', 'pending', 'accepted', 'completed'].map((value) => (
            <button
              key={value}
              onClick={() => setStatusFilter(value)}
              className={`rounded-full px-4 py-2 text-xs font-semibold ${
                statusFilter === value
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-teal-600 hover:text-teal-800 dark:text-cream-300 dark:hover:text-cream-100'
              }`}
            >
              {capitalize(value)}
            </button>
          ))}
        </div>

        <div className="mt-6 grid gap-4">
          {helpRequests.map((request) => {
            const reqId = request._id || request.id
            return (
              <div key={reqId} className="rounded-2xl border border-cream-200 bg-white/80 p-5 dark:border-dark-700 dark:bg-dark-800/80">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-3 py-0.5 text-xs font-semibold ${typeStyles[request.requestType] || typeStyles.Other}`}>
                        {request.requestType}
                      </span>
                      <span className={`rounded-full px-3 py-0.5 text-xs font-semibold ${statusStyles[request.status] || statusStyles.pending}`}>
                        {capitalize(request.status)}
                      </span>
                      <span className="text-xs text-teal-400 dark:text-cream-400">{formatShortId(reqId)}</span>
                    </div>
                    <p className="mt-2 text-sm text-teal-800 dark:text-cream-100">{request.description}</p>
                    {request.requiredSkills?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {request.requiredSkills.map((skill, i) => (
                          <span key={i} className="rounded-full border border-cream-200 bg-cream-50 px-2.5 py-0.5 text-[11px] text-teal-600 dark:border-dark-600 dark:bg-dark-700 dark:text-cream-300">
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="shrink-0 text-right text-xs text-teal-500 dark:text-cream-400">
                    <p>Created {formatDateTime(request.createdAt)}</p>
                    {request.assignedVolunteerId && (
                      <p className="mt-1">Volunteer {formatShortId(request.assignedVolunteerId)}</p>
                    )}
                    {request.completedAt && (
                      <p className="mt-1">Done {formatDateTime(request.completedAt)}</p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
          {!helpRequests.length && (
            <p className="py-10 text-center text-sm text-teal-500 dark:text-cream-300">No help requests in this filter.</p>
          )}
        </div>
      </div>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-3xl border border-cream-200 bg-white/90 p-6 shadow-sm dark:border-dark-700 dark:bg-dark-900/70">
          <div className="flex items-center gap-3">
            <FaExclamationTriangle className="text-3xl text-amber-400" />
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-teal-500 dark:text-cream-300">Escalation matrix</p>
              <h3 className="text-xl font-semibold text-teal-900 dark:text-cream-50">Emergency readiness</h3>
            </div>
          </div>
          <ul className="mt-6 list-disc space-y-2 pl-6 text-sm text-teal-800 dark:text-cream-200">
            <li>Flag emergencies to volunteers and donors instantly.</li>
            <li>Tag requests by category (Medical, Education, Exam).</li>
            <li>Maintain closure notes for transparency.</li>
          </ul>
        </div>
        <div className="rounded-3xl border border-cream-200 bg-white/90 p-6 shadow-sm dark:border-dark-700 dark:bg-dark-900/70">
          <div className="flex items-center gap-3">
            <FaLifeRing className="text-3xl text-cyan-400" />
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-teal-500 dark:text-cream-300">Volunteer sync</p>
              <h3 className="text-xl font-semibold text-teal-900 dark:text-cream-50">Assignment insights</h3>
            </div>
          </div>
          <p className="mt-4 text-sm text-teal-600 dark:text-cream-300/70">
            Track which volunteers have open tasks, late updates, or completed missions to keep requests moving.
          </p>
        </div>
      </section>

      {/* ========== New Request Modal ========== */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-3xl border border-cream-200 bg-white p-8 shadow-2xl dark:border-dark-700 dark:bg-dark-900">
            <button onClick={closeModal} className="absolute right-4 top-4 text-teal-400 hover:text-teal-700 dark:text-cream-400 dark:hover:text-cream-100">
              <FaTimes className="text-lg" />
            </button>

            <h3 className="text-xl font-semibold text-teal-900 dark:text-cream-50">Create Help Request</h3>
            <p className="mt-1 text-sm text-teal-600 dark:text-cream-300/70">Fill in the details below to request volunteer assistance.</p>

            {actionError && modalOpen && (
              <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700 dark:border-rose-400/30 dark:bg-rose-500/10 dark:text-rose-200">
                {actionError}
              </div>
            )}

            <div className="mt-5 space-y-4">
              {/* Request Type */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-teal-600 dark:text-cream-300">
                  Request Type <span className="text-rose-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {REQUEST_TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => handleChange('requestType', type)}
                      className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                        formData.requestType === type
                          ? 'bg-teal-600 text-white shadow-sm'
                          : 'border border-cream-200 text-teal-600 hover:bg-cream-50 dark:border-dark-600 dark:text-cream-300 dark:hover:bg-dark-800'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-teal-600 dark:text-cream-300">
                  Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Describe what help is needed (min 10 characters)…"
                  className="w-full rounded-2xl border border-cream-200 bg-cream-50 px-4 py-3 text-sm text-teal-800 outline-none focus:border-teal-400 dark:border-dark-700 dark:bg-dark-800 dark:text-cream-100 dark:focus:border-teal-500"
                />
              </div>

              {/* Required Skills */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-teal-600 dark:text-cream-300">
                  Required Skills <span className="text-xs font-normal normal-case text-teal-400 dark:text-cream-400">(comma separated, optional)</span>
                </label>
                <input
                  type="text"
                  value={formData.requiredSkills}
                  onChange={(e) => handleChange('requiredSkills', e.target.value)}
                  placeholder="e.g. Math, Science, First Aid"
                  className="w-full rounded-2xl border border-cream-200 bg-cream-50 px-4 py-3 text-sm text-teal-800 outline-none focus:border-teal-400 dark:border-dark-700 dark:bg-dark-800 dark:text-cream-100 dark:focus:border-teal-500"
                />
              </div>

              {/* Child (optional) */}
              {children.length > 0 && (
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-teal-600 dark:text-cream-300">
                    Related Child <span className="text-xs font-normal normal-case text-teal-400 dark:text-cream-400">(optional)</span>
                  </label>
                  <select
                    value={formData.childId}
                    onChange={(e) => handleChange('childId', e.target.value)}
                    className="w-full rounded-2xl border border-cream-200 bg-cream-50 px-4 py-3 text-sm text-teal-800 outline-none focus:border-teal-400 dark:border-dark-700 dark:bg-dark-800 dark:text-cream-100 dark:focus:border-teal-500"
                  >
                    <option value="">None</option>
                    {children.map((child) => (
                      <option key={child._id || child.id} value={child._id || child.id}>
                        {child.name || child.fullName || `Child ${formatShortId(child._id || child.id)}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={closeModal}
                className="rounded-full border border-cream-200 px-5 py-2 text-sm text-teal-600 hover:bg-cream-100 dark:border-dark-700 dark:text-cream-300 dark:hover:bg-dark-800"
              >
                Cancel
              </button>
              <button
                disabled={submitting}
                onClick={handleSubmit}
                className="rounded-full bg-gradient-to-r from-rose-500 to-amber-500 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:shadow-lg disabled:opacity-50"
              >
                {submitting ? 'Creating…' : 'Create Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default HelpRequestsManagement
