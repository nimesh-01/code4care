const parseDate = (value) => {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

const IMMUTABLE_STATUSES = new Set(['cancelled', 'completed', 'archived'])

/**
 * Returns a user-friendly status for an event based on its schedule.
 * - Keeps backend-provided terminal states (cancelled, completed, archived)
 * - Converts planning -> upcoming for clarity
 * - Automatically flips upcoming events to "past" when their end date has passed
 * - Marks in-progress events as "ongoing"
 */
export const deriveEventStatus = (event, options = {}) => {
  if (!event) return 'upcoming'
  const now = options.now instanceof Date ? options.now : new Date()
  const baseStatus = (event.status || 'upcoming').toLowerCase()

  if (IMMUTABLE_STATUSES.has(baseStatus)) {
    return baseStatus
  }

  const startDate =
    parseDate(event.eventDate || event.startDate || event.date || event.schedule?.start)
  const endDate = parseDate(event.endDate || event.schedule?.end) || startDate

  if (!startDate) {
    return baseStatus === 'planning' ? 'upcoming' : baseStatus
  }

  if (now > (endDate || startDate)) {
    return 'past'
  }

  if (now >= startDate && now <= (endDate || startDate)) {
    return 'ongoing'
  }

  if (baseStatus === 'planning') {
    return 'upcoming'
  }

  return baseStatus
}

export const annotateEventStatus = (event, options = {}) => {
  const status = deriveEventStatus(event, options)
  return status === event.status ? event : { ...event, status }
}
