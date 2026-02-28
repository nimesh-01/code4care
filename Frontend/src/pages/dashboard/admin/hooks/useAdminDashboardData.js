import { useState, useEffect, useCallback, useMemo } from 'react'
import { childrenAPI, donationAPI, appointmentAPI, helpRequestAPI } from '../../../../services/api'
import { useAuth } from '../../../../context/AuthContext'

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const EMPTY_DONATION_STATS = {
  totalAmount: 0,
  totalDonations: 0,
  purposeBreakdown: [],
}

const EMPTY_PAGINATION = {
  currentPage: 1,
  totalPages: 1,
  totalDonations: 0,
  hasMore: false,
}

const extractArray = (payload) => {
  if (!payload) return null
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload.data)) return payload.data
  if (Array.isArray(payload.children)) return payload.children
  if (Array.isArray(payload.appointments)) return payload.appointments
  if (Array.isArray(payload.helpRequests)) return payload.helpRequests
  if (Array.isArray(payload.results)) return payload.results
  if (Array.isArray(payload.items)) return payload.items
  if (Array.isArray(payload?.data?.children)) return payload.data.children
  if (Array.isArray(payload?.data?.appointments)) return payload.data.appointments
  if (Array.isArray(payload?.data?.helpRequests)) return payload.data.helpRequests
  if (Array.isArray(payload?.data?.results)) return payload.data.results
  if (Array.isArray(payload?.data?.items)) return payload.data.items
  return null
}

const createFlatDonationSeries = () => MONTH_LABELS.map((month) => ({ month, amount: 0 }))

const EMPTY_DASHBOARD_STATE = {
  summary: {
    monthlyDonationTotal: 0,
    totalDonations: 0,
    totalChildren: 0,
    totalVolunteers: 0,
    pendingAppointments: 0,
    activeHelpRequests: 0,
    upcomingEvents: 0,
  },
  monthlyDonations: createFlatDonationSeries(),
  recentActivities: [],
  children: [],
  donations: [],
  donationStats: EMPTY_DONATION_STATS,
  donationPagination: EMPTY_PAGINATION,
  appointments: [],
  helpRequests: [],
  events: [],
  posts: [],
  volunteers: [],
  notifications: [],
  orphanageProfile: null,
}


const normalizeId = (value) => {
  if (!value) return null
  if (typeof value === 'string') return value
  if (typeof value === 'number') return String(value)
  if (typeof value === 'object') {
    if (value._id) return String(value._id)
    if (value.id) return String(value.id)
    if (value.$oid) return String(value.$oid)
    const asString = value.toString?.()
    if (asString && asString !== '[object Object]') return asString
  }
  return null
}

const resolveUserOrphanageId = (user) => {
  if (!user) return null
  const candidates = [
    user.orphanageId,
    user.orphanage?.id,
    user.orphanage?._id,
    user.orphanage,
    user.orphanageDetails,
    user.orphanageProfile,
  ]

  for (const candidate of candidates) {
    const normalized = normalizeId(candidate)
    if (normalized) return normalized
  }

  return null
}

const computeMetrics = (data) => {
  const childrenCount = data.children?.length ?? 0
  const volunteerCount = data.volunteers?.length ?? 0
  const pendingAppointments = data.appointments?.filter((appt) => appt.status === 'pending').length ?? 0
  const activeHelpRequests = data.helpRequests?.filter((req) => ['pending', 'accepted'].includes(req.status)).length ?? 0
  const upcomingEvents = data.events?.filter((event) => ['upcoming', 'planning'].includes(event.status)).length ?? 0

  const donationStats = data.donationStats || EMPTY_DONATION_STATS
  const fallbackDonationTotal = data.donations?.reduce((sum, donation) => sum + (donation.amount || 0), 0) ?? 0
  const fallbackDonationCount = data.donations?.length ?? 0

  const totalDonations = typeof donationStats.totalAmount === 'number'
    ? donationStats.totalAmount
    : fallbackDonationTotal

  const donationCount = typeof donationStats.totalDonations === 'number'
    ? donationStats.totalDonations
    : fallbackDonationCount

  const monthlyDonations = (data.donations || []).filter((donation) => {
    const donationDateRaw = donation.date || donation.createdAt
    if (!donationDateRaw) return false
    const donationDate = new Date(donationDateRaw)
    if (Number.isNaN(donationDate.getTime())) return false
    const now = new Date()
    return donationDate.getMonth() === now.getMonth() && donationDate.getFullYear() === now.getFullYear()
  }).reduce((sum, donation) => sum + (donation.amount || 0), 0)

  const donationSeries = (data.monthlyDonations && data.monthlyDonations.length)
    ? data.monthlyDonations
    : createFlatDonationSeries()

  return {
    childrenCount,
    volunteerCount,
    pendingAppointments,
    activeHelpRequests,
    upcomingEvents,
    totalDonations,
    monthlyDonations,
    donationSeries,
    donationCount,
  }
}

export const initialDashboardState = EMPTY_DASHBOARD_STATE

export const useAdminDashboardData = () => {
  const { user } = useAuth()
  const orphanageId = resolveUserOrphanageId(user)
  const [data, setData] = useState(initialDashboardState)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const filterByOrphanage = useCallback((list) => {
    if (!Array.isArray(list) || !orphanageId) return list || []

    const normalize = (record) => {
      if (!record) return null
      const direct = record.orphanageId || record.orphanage_id || record.orphanage || record.orphanageID
      if (direct) return typeof direct === 'object' ? direct._id || direct.id || null : direct
      if (record.orphanage?.id || record.orphanage?._id) return record.orphanage.id || record.orphanage._id
      return null
    }

    return list.filter((item) => {
      const itemOrphanage = normalize(item)
      if (!itemOrphanage) return false
      return String(itemOrphanage) === orphanageId
    })
  }, [orphanageId])

  const fetchData = useCallback(async () => {
    if (!orphanageId) {
      setLoading(false)
      setError('Orphanage ID is missing on the logged in user profile.')
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Use getAll() — the backend's getChildren controller already detects
      // orphanAdmin and returns only that orphanage's children automatically.
      const childrenRequest = childrenAPI.getAll()

      // Use getAll() — the backend's getAllAppointments controller already
      // detects orphanAdmin via the JWT token and filters by orphanageId.
      const appointmentRequest = appointmentAPI.getAll()

      const requests = [
        childrenRequest,
        donationAPI.getOrphanageDonations(orphanageId),
        appointmentRequest,
        helpRequestAPI.getAll(),
      ]

      const [childrenRes, donationRes, appointmentRes, helpRes] = await Promise.allSettled(requests)

      const pickArray = (result) => (result.status === 'fulfilled' ? extractArray(result.value.data) : null)
      const childrenList = pickArray(childrenRes)
      const appointmentList = pickArray(appointmentRes)
      const helpList = pickArray(helpRes)
      const donationPayload = donationRes.status === 'fulfilled' ? donationRes.value.data?.data : null

      setData((prev) => ({
        ...prev,
        children: childrenList ? filterByOrphanage(childrenList) : prev.children,
        donations: donationPayload ? donationPayload.donations || [] : prev.donations,
        donationStats: donationPayload
          ? { ...EMPTY_DONATION_STATS, ...donationPayload.stats }
          : prev.donationStats || EMPTY_DONATION_STATS,
        donationPagination: donationPayload
          ? { ...EMPTY_PAGINATION, ...donationPayload.pagination }
          : prev.donationPagination || EMPTY_PAGINATION,
        // Backend already filters appointments by orphanageId for orphanAdmin
        appointments: appointmentList ?? prev.appointments,
        helpRequests: helpList ? filterByOrphanage(helpList) : prev.helpRequests,
      }))
    } catch (err) {
      setError('Unable to fetch live dashboard data. Showing the cached snapshot instead.')
    } finally {
      setLoading(false)
    }
  }, [user?.role, orphanageId, filterByOrphanage])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const metrics = useMemo(() => computeMetrics(data), [data])

  return {
    data,
    metrics,
    loading,
    error,
    refresh: fetchData,
    orphanage: orphanageId,
  }
}
