import { useEffect, useMemo, useState } from 'react'
import { FaCalendarAlt, FaClock, FaTimes } from 'react-icons/fa'
import { toast } from 'react-toastify'
import { appointmentAPI } from '../services/api'

const formatDateTimeLocal = (date) => {
  if (!date) return ''
  const offset = date.getTimezoneOffset()
  const local = new Date(date.getTime() - offset * 60000)
  return local.toISOString().slice(0, 16)
}

const AppointmentRequestModal = ({ isOpen, onClose, context, onSuccess, defaultPurpose = '' }) => {
  const [requestedAt, setRequestedAt] = useState('')
  const [purpose, setPurpose] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const minDateTime = useMemo(() => formatDateTimeLocal(new Date(Date.now() + 60 * 60 * 1000)), [])

  useEffect(() => {
    if (isOpen) {
      const defaultDate = formatDateTimeLocal(new Date(Date.now() + 2 * 60 * 60 * 1000))
      setRequestedAt(defaultDate)
      setPurpose(defaultPurpose || '')
    }
  }, [isOpen, defaultPurpose])

  if (!isOpen) return null

  const closeModal = () => {
    if (submitting) return
    onClose?.()
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!context?.orphanageId) {
      toast.error('Orphanage information is missing for this request')
      return
    }

    if (!requestedAt) {
      toast.error('Please select a preferred visit date and time')
      return
    }

    if (!purpose || purpose.trim().length < 10) {
      toast.error('Please describe the purpose (at least 10 characters)')
      return
    }

    try {
      setSubmitting(true)
      const payload = {
        requestedAt: new Date(requestedAt).toISOString(),
        purpose: purpose.trim(),
        orphanageId: context.orphanageId,
      }

      if (context.childId) {
        payload.childId = context.childId
      }

      await appointmentAPI.request(payload)
      toast.success('Appointment request sent successfully')
      if (onSuccess) {
        onSuccess()
      } else {
        closeModal()
      }
    } catch (error) {
      const message = error.response?.data?.msg || error.response?.data?.error || 'Unable to submit request'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={closeModal}>
      <div
        className="relative w-full max-w-lg rounded-3xl bg-white shadow-2xl dark:bg-dark-900"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          onClick={closeModal}
          className="absolute right-4 top-4 text-teal-700 dark:text-cream-200 hover:text-coral-500"
          aria-label="Close appointment request"
        >
          <FaTimes className="text-xl" />
        </button>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-coral-100 text-coral-600">
              <FaCalendarAlt className="text-2xl" />
            </div>
            <div>
              <p className="text-sm uppercase tracking-wide text-teal-500">Plan an appointment</p>
              <h2 className="text-xl font-bold text-teal-900 dark:text-cream-50">
                {context?.childName ? `Meet ${context.childName}` : 'Visit the orphanage'}
              </h2>
            </div>
          </div>

          <div className="rounded-2xl border border-cream-200 bg-cream-50 p-4 dark:border-dark-600 dark:bg-dark-800">
            <p className="text-sm font-medium text-teal-700 dark:text-cream-100">Visit details</p>
            <ul className="mt-2 space-y-1 text-sm text-teal-600 dark:text-cream-300">
              {context?.orphanageName && <li>Orphanage: {context.orphanageName}</li>}
              {context?.location && <li>Location: {context.location}</li>}
              {context?.childName && <li>Child: {context.childName}</li>}
            </ul>
          </div>

          <label className="block text-sm font-medium text-teal-700 dark:text-cream-100">
            Preferred date & time
            <div className="mt-2 flex items-center gap-3 rounded-2xl border border-cream-200 bg-white px-4 py-2.5 dark:border-dark-600 dark:bg-dark-800">
              <FaClock className="text-teal-400" />
              <input
                type="datetime-local"
                value={requestedAt}
                onChange={(e) => setRequestedAt(e.target.value)}
                min={minDateTime}
                required
                className="w-full bg-transparent text-teal-900 outline-none dark:text-cream-50"
              />
            </div>
          </label>

          <label className="block text-sm font-medium text-teal-700 dark:text-cream-100">
            Purpose of visit
            <textarea
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              rows={4}
              placeholder="Share why you’d like to visit, any specific needs, and how many people will join."
              className="mt-2 w-full rounded-2xl border border-cream-200 bg-white px-4 py-3 text-teal-900 outline-none transition focus:border-coral-400 focus:ring-2 focus:ring-coral-100 dark:border-dark-600 dark:bg-dark-800 dark:text-cream-50"
            />
          </label>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <button
              type="button"
              onClick={closeModal}
              className="w-full rounded-2xl border border-cream-300 px-6 py-3 font-semibold text-teal-700 transition hover:bg-cream-100 dark:border-dark-600 dark:text-cream-100 sm:w-auto"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-2xl bg-coral-500 px-6 py-3 font-semibold text-white transition hover:bg-coral-600 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
            >
              {submitting ? 'Sending...' : 'Send Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AppointmentRequestModal
