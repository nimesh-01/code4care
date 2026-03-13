import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { FaChartPie, FaDownload, FaBolt, FaShieldAlt, FaHeartbeat, FaUserFriends } from 'react-icons/fa'
import { toast } from 'react-toastify'
import { useAdminDashboardContext } from './AdminLayout'
import { donationAPI } from '../../../services/api'
import { ScrollReveal } from '../../../hooks/useScrollReveal'
import RadialGauge from '../../../components/analytics/RadialGauge'
import MiniAreaChart from '../../../components/analytics/MiniAreaChart'

const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3)

const useAnimatedNumber = (value, duration = 1200) => {
  const target = Number.isFinite(value) ? value : 0
  const [display, setDisplay] = useState(target)
  const rafRef = useRef(null)
  const startRef = useRef(null)
  const fromRef = useRef(target)

  useEffect(() => {
    const from = fromRef.current
    const diff = target - from
    if (Math.abs(diff) < 0.1) {
      setDisplay(target)
      fromRef.current = target
      return
    }

    const step = (timestamp) => {
      if (!startRef.current) startRef.current = timestamp
      const progress = Math.min((timestamp - startRef.current) / duration, 1)
      setDisplay(from + diff * easeOutCubic(progress))
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step)
      } else {
        fromRef.current = target
        startRef.current = null
      }
    }

    rafRef.current = requestAnimationFrame(step)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      startRef.current = null
    }
  }, [target, duration])

  return display
}

const ReportsAnalytics = () => {
  const dashboard = useAdminDashboardContext()
  const metrics = dashboard.metrics || {}
  const data = dashboard.data || {}
  const donationStats = data.donationStats || {}
  const orphanage = dashboard.orphanage

  const [downloading, setDownloading] = useState({
    donation: false,
    children: false,
    volunteers: false,
    appointments: false,
    all: false,
  })

  const safeNumber = (value, fallback = 0) => {
    if (typeof value === 'number' && Number.isFinite(value)) return value
    if (typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Number(value))) {
      return Number(value)
    }
    return fallback
  }

  const safeDate = (value) => {
    if (!value) return 'N/A'
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString('en-IN')
  }

  const formatEventWindow = (date, time) => {
    if (!date) return 'Awaiting schedule'
    const formatted = safeDate(date)
    if (formatted === 'N/A') return 'Awaiting schedule'
    return time ? `${formatted} • ${time}` : formatted
  }

  const formatPercent = (value) => `${Math.round(Math.min(Math.max(value, 0), 100))}%`
  const formatCurrency = (value) => `₹${safeNumber(value).toLocaleString('en-IN')}`

  const escapeCsvValue = (value) => {
    if (value == null) return ''
    const stringValue = String(value)
    if (/[",\n]/.test(stringValue)) {
      return '"' + stringValue.replace(/"/g, '""') + '"'
    }
    return stringValue
  }

  const downloadCsv = (rows, columns, filename) => {
    if (!rows?.length) {
      toast.info('No records available for this report yet')
      return false
    }
    const header = columns.map((col) => escapeCsvValue(col.label)).join(',')
    const body = rows
      .map((row) => columns.map((col) => escapeCsvValue(row[col.key])).join(','))
      .join('\n')
    const blob = new Blob([`${header}\n${body}`], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    return true
  }

  const saveBlobResponse = async (axiosResponse, fileName) => {
    const contentType = axiosResponse.headers?.['content-type'] || ''
    const blob = axiosResponse.data
    if (contentType.includes('application/json')) {
      const text = await blob.text()
      const payload = JSON.parse(text)
      throw new Error(payload?.message || 'Unable to export report')
    }

    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', fileName)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  const monthlyDonationCount = safeNumber(donationStats.monthlyCount ?? 0, 0)

  const donationTrendSeries = useMemo(() => {
    if (Array.isArray(donationStats.monthlyTrend) && donationStats.monthlyTrend.length) {
      return donationStats.monthlyTrend
    }
    if (Array.isArray(metrics.donationSeries) && metrics.donationSeries.length) {
      return metrics.donationSeries
    }
    return []
  }, [donationStats, metrics])

  const donationTrendValues = useMemo(() => {
    if (!donationTrendSeries.length) return []
    return donationTrendSeries.map((entry) => safeNumber(entry.amount ?? entry.value ?? entry, 0))
  }, [donationTrendSeries])

  const latestDonationAmount = donationTrendValues.length
    ? donationTrendValues[donationTrendValues.length - 1]
    : safeNumber(donationStats.monthlyTotal ?? metrics.monthlyDonations ?? 0, 0)

  const previousDonationAmount = donationTrendValues.length > 1
    ? donationTrendValues[donationTrendValues.length - 2]
    : null

  const donationMoM = useMemo(() => {
    if (previousDonationAmount == null || previousDonationAmount === 0) return null
    const delta = ((latestDonationAmount - previousDonationAmount) / previousDonationAmount) * 100
    return Math.round(delta)
  }, [latestDonationAmount, previousDonationAmount])

  const totalDonationValue = useMemo(
    () => safeNumber(donationStats.totalAmount ?? metrics.totalDonations ?? 0, 0),
    [donationStats, metrics],
  )

  const totalDonationCount = useMemo(
    () => safeNumber(donationStats.totalDonations ?? metrics.donationCount ?? (data.donations?.length || 0), 0),
    [donationStats, metrics, data.donations],
  )

  const averageDonation = useMemo(() => {
    if (!totalDonationCount) return totalDonationValue
    return totalDonationValue / totalDonationCount
  }, [totalDonationCount, totalDonationValue])

  const monthlyDonationTotal = useMemo(
    () => safeNumber(donationStats.monthlyTotal ?? latestDonationAmount ?? metrics.monthlyDonations ?? 0, 0),
    [donationStats, latestDonationAmount, metrics.monthlyDonations],
  )

  const donationTrend = useMemo(() => {
    if (donationTrendValues.length) return donationTrendValues
    return [monthlyDonationTotal || 0]
  }, [donationTrendValues, monthlyDonationTotal])

  const childGrowthRows = useMemo(() => {
    return (data.children || []).map((child) => {
      const firstName = child.fullname?.firstname || child.firstName || ''
      const lastName = child.fullname?.lastname || child.lastName || ''
      const age = child.age || child.profile?.age || 'N/A'
      const education = child.education?.currentLevel || child.education?.status || 'N/A'
      const wellbeing = child.health?.status || child.healthStatus || 'N/A'
      return {
        name: [firstName, lastName].filter(Boolean).join(' ') || child.name || 'Child',
        age,
        education,
        wellbeing,
        lastCheckup: safeDate(child.health?.lastCheckup || child.updatedAt),
      }
    })
  }, [data.children])

  const volunteerRows = useMemo(() => {
    return (data.volunteers || []).map((volunteer) => ({
      name: volunteer.name || volunteer.fullname || 'Volunteer',
      role: volunteer.role || volunteer.focus || 'General',
      assignments: volunteer.assignments?.length || 0,
      hours: volunteer.totalHours || volunteer.hoursContributed || 0,
      lastActive: safeDate(volunteer.updatedAt || volunteer.lastActiveAt),
    }))
  }, [data.volunteers])

  const appointmentRows = useMemo(() => {
    return (data.appointments || []).map((appointment) => ({
      visitor: appointment.visitorName || appointment.guardianName || 'Visitor',
      child: appointment.childName || appointment.child?.name || 'Child',
      status: appointment.status || 'pending',
      scheduledFor: safeDate(appointment.date || appointment.scheduledDate),
      notes: appointment.notes || appointment.purpose || '—',
    }))
  }, [data.appointments])

  const newChildrenThisMonth = useMemo(() => {
    const list = data.children || []
    if (!list.length) return 0
    const now = new Date()
    return list.filter((child) => {
      const joined = new Date(child.createdAt || child.admittedAt || child.admissionDate)
      if (Number.isNaN(joined.getTime())) return false
      return joined.getMonth() === now.getMonth() && joined.getFullYear() === now.getFullYear()
    }).length
  }, [data.children])

  const approvedAppointments = useMemo(() => {
    const list = data.appointments || []
    const approved = list.filter((appt) => appt.status === 'approved').length
    return {
      approved,
      total: list.length,
      rate: list.length ? Math.round((approved / list.length) * 100) : 0,
    }
  }, [data.appointments])

  const totalHelpRequests = data.helpRequests?.length || 0
  const resolvedHelpRequests = useMemo(
    () => (data.helpRequests || []).filter((req) => ['resolved', 'completed', 'closed'].includes((req.status || '').toLowerCase())).length,
    [data.helpRequests],
  )
  const helpRequestSummary = totalHelpRequests
    ? `${resolvedHelpRequests}/${totalHelpRequests} resolved`
    : 'All quiet this week'

  const volunteerHours = useMemo(() => {
    return (data.volunteers || []).reduce((sum, volunteer) => sum + safeNumber(volunteer.totalHours || volunteer.hoursContributed, 0), 0)
  }, [data.volunteers])

  const activeVolunteers = metrics.volunteerCount || volunteerRows.length

  const donationTarget = useMemo(() => {
    const manualTarget = safeNumber(donationStats.monthlyGoal ?? donationStats.monthlyTarget, 0)
    if (manualTarget > 0) return manualTarget
    if (donationTrendValues.length) {
      const average = donationTrendValues.reduce((sum, value) => sum + value, 0) / donationTrendValues.length
      if (average > 0) return average * 1.15
    }
    return monthlyDonationTotal || 1
  }, [donationStats, donationTrendValues, monthlyDonationTotal])

  const fundingPacePercent = useMemo(() => {
    if (!donationTarget) return 0
    return Math.round(Math.min(100, (monthlyDonationTotal / donationTarget) * 100))
  }, [monthlyDonationTotal, donationTarget])

  const volunteerCapacityHours = Math.max(activeVolunteers * 20, volunteerHours || 0, 1)
  const volunteerPercent = Math.round(Math.min(100, (volunteerHours / volunteerCapacityHours) * 100))
  const visitClearancePercent = approvedAppointments.rate
  const safeguardPercent = totalHelpRequests ? Math.round((resolvedHelpRequests / totalHelpRequests) * 100) : 100

  const impactHighlights = useMemo(() => ([
    {
      label: 'Avg. donation ticket',
      primary: formatCurrency(averageDonation || 0),
      delta: donationMoM != null
        ? `${donationMoM > 0 ? '+' : ''}${donationMoM}% vs prev month`
        : `${monthlyDonationCount || totalDonationCount} gifts logged`,
      accent: 'from-cyan-500/70 to-sky-400/60',
      icon: FaBolt,
    },
    {
      label: 'Volunteer energy',
      primary: `${safeNumber(volunteerHours)} hrs`,
      delta: `${activeVolunteers || 0} active contributors`,
      accent: 'from-emerald-500/70 to-lime-400/60',
      icon: FaUserFriends,
    },
    {
      label: 'Appointment approval',
      primary: formatPercent(approvedAppointments.rate),
      delta: `${approvedAppointments.approved}/${approvedAppointments.total || 1} confirmed`,
      accent: 'from-amber-500/80 to-orange-400/60',
      icon: FaHeartbeat,
    },
    {
      label: 'Safeguard coverage',
      primary: `${metrics.activeHelpRequests || 0} live cases`,
      delta: helpRequestSummary,
      accent: 'from-indigo-500/70 to-purple-500/50',
      icon: FaShieldAlt,
    },
  ]), [activeVolunteers, approvedAppointments, averageDonation, donationMoM, helpRequestSummary, metrics.activeHelpRequests, monthlyDonationCount, totalDonationCount, volunteerHours])

  const wellbeingTrend = useMemo(() => {
    const healthScores = (data.children || [])
      .map((child) => safeNumber(child.health?.score ?? child.health?.statusScore ?? child.progressIndex ?? child.age ?? 0, 0))
      .filter((value) => value > 0)
    if (healthScores.length) {
      return healthScores.slice(-8)
    }
    return [55, 58, 62, 64, 68, 70, 74, 77]
  }, [data.children])

  const gaugeInsights = useMemo(() => {
    return [
      { label: 'Funding pace', percentage: fundingPacePercent, color: '#06b6d4' },
      { label: 'Volunteer load', percentage: volunteerPercent, color: '#a855f7' },
      { label: 'Visit clearance', percentage: visitClearancePercent, color: '#f97316' },
      { label: 'Safeguard uptime', percentage: safeguardPercent, color: '#34d399' },
    ]
  }, [approvedAppointments.rate, fundingPacePercent, safeguardPercent, volunteerPercent, visitClearancePercent])

  const timelineMilestones = useMemo(() => {
    const upcomingEvents = (data.events || [])
      .filter((event) => !['past', 'completed', 'cancelled'].includes((event.status || '').toLowerCase()))
      .map((event) => {
        const rawDate = event.eventDate || event.startDate || event.date
        const timestamp = rawDate ? new Date(rawDate).getTime() : Number.POSITIVE_INFINITY
        const location = event.eventLocation || event.location || event.venue || ''
        const detailParts = []
        const windowLabel = formatEventWindow(rawDate, event.eventTime)
        if (windowLabel && windowLabel !== 'Awaiting schedule') detailParts.push(windowLabel)
        if (location) detailParts.push(location)
        return {
          title: event.title || 'Upcoming event',
          detail: detailParts.join(' • ') || 'Awaiting schedule',
          status: event.status === 'ongoing' ? 'Live' : (event.status === 'planning' ? 'Planning' : 'Upcoming'),
          timestamp,
        }
      })
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(0, 3)
      .map(({ timestamp, ...rest }) => rest)

    if (upcomingEvents.length) return upcomingEvents

    return [
      { title: 'Monthly compliance push', detail: 'Auto-export donation & appointment statements to trustees on the 1st.', status: 'Scheduled' },
      { title: 'Quarterly donor digest', detail: 'Curated impact stories + KPIs for top donors.', status: 'In-progress' },
      { title: 'Annual audit pack', detail: 'Consolidated CSV + receipts for government filings.', status: 'Ready' },
    ]
  }, [data.events])

  const runWithLoading = useCallback(async (key, fn) => {
    setDownloading((prev) => ({ ...prev, [key]: true }))
    try {
      await fn()
    } finally {
      setDownloading((prev) => ({ ...prev, [key]: false }))
    }
  }, [])

  const handleDonationExport = useCallback(async () => {
    if (!orphanage) {
      toast.error('Orphanage ID missing from your profile.')
      return
    }
    await runWithLoading('donation', async () => {
      try {
        const response = await donationAPI.exportOrphanageDonations(orphanage, { limit: 5000 })
        const fileName = `SoulConnect-Donation-Statement-${new Date().toISOString().split('T')[0]}.csv`
        await saveBlobResponse(response, fileName)
        toast.success('Monthly donation statement ready')
      } catch (err) {
        toast.error(err?.message || 'Unable to export donation statement')
        throw err
      }
    })
  }, [orphanage, runWithLoading])

  const handleChildTrackerExport = useCallback(async () => {
    await runWithLoading('children', async () => {
      const columns = [
        { key: 'name', label: 'Child Name' },
        { key: 'age', label: 'Age' },
        { key: 'education', label: 'Education Level' },
        { key: 'wellbeing', label: 'Wellbeing Status' },
        { key: 'lastCheckup', label: 'Last Checkup' },
      ]
      const success = downloadCsv(childGrowthRows, columns, 'SoulConnect-Child-Growth.csv')
      if (success) toast.success('Child growth tracker exported')
    })
  }, [childGrowthRows, runWithLoading])

  const handleVolunteerExport = useCallback(async () => {
    await runWithLoading('volunteers', async () => {
      const columns = [
        { key: 'name', label: 'Volunteer Name' },
        { key: 'role', label: 'Role / Focus' },
        { key: 'assignments', label: 'Assignments' },
        { key: 'hours', label: 'Hours Contributed' },
        { key: 'lastActive', label: 'Last Active' },
      ]
      const success = downloadCsv(volunteerRows, columns, 'SoulConnect-Volunteer-Performance.csv')
      if (success) toast.success('Volunteer performance report exported')
    })
  }, [volunteerRows, runWithLoading])

  const handleAppointmentExport = useCallback(async () => {
    await runWithLoading('appointments', async () => {
      const columns = [
        { key: 'visitor', label: 'Visitor' },
        { key: 'child', label: 'Child' },
        { key: 'status', label: 'Status' },
        { key: 'scheduledFor', label: 'Scheduled For' },
        { key: 'notes', label: 'Notes' },
      ]
      const success = downloadCsv(appointmentRows, columns, 'SoulConnect-Appointment-Logs.csv')
      if (success) toast.success('Appointment & visitor logs exported')
    })
  }, [appointmentRows, runWithLoading])

  const handleDownloadAll = useCallback(async () => {
    setDownloading((prev) => ({ ...prev, all: true }))
    try {
      await handleDonationExport()
      await handleChildTrackerExport()
      await handleVolunteerExport()
      await handleAppointmentExport()
      toast.success('All reports downloaded')
    } catch (err) {
      // Handlers already surfaced errors.
    } finally {
      setDownloading((prev) => ({ ...prev, all: false }))
    }
  }, [handleAppointmentExport, handleChildTrackerExport, handleDonationExport, handleVolunteerExport])

  const reportCatalog = useMemo(() => ([
    {
      title: 'Monthly donation statement',
      description: 'Detailed inflows, donor sources, and utilization mapping.',
      format: 'PDF + CSV',
      accent: 'from-cyan-500 to-blue-500',
      action: handleDonationExport,
      loadingKey: 'donation',
    },
    {
      title: 'Child growth tracker',
      description: 'Progress across health, education, and wellbeing touchpoints.',
      format: 'Dashboard + XLS',
      accent: 'from-emerald-500 to-lime-500',
      action: handleChildTrackerExport,
      loadingKey: 'children',
    },
    {
      title: 'Volunteer performance',
      description: 'Engagement heatmap, hours contributed, and task completion.',
      format: 'Interactive',
      accent: 'from-purple-500 to-pink-500',
      action: handleVolunteerExport,
      loadingKey: 'volunteers',
    },
    {
      title: 'Appointment & visitor logs',
      description: 'Approved visits, feedback captured, and compliance notes.',
      format: 'CSV',
      accent: 'from-amber-500 to-orange-500',
      action: handleAppointmentExport,
      loadingKey: 'appointments',
    },
  ]), [handleAppointmentExport, handleChildTrackerExport, handleDonationExport, handleVolunteerExport])

  const heroInflowValue = monthlyDonationTotal
  const animatedHeroInflow = useAnimatedNumber(heroInflowValue, 1400)
  const animatedChildrenCount = useAnimatedNumber(safeNumber(metrics.childrenCount ?? childGrowthRows.length ?? 0, 0), 900)
  const animatedVolunteerCount = useAnimatedNumber(safeNumber(metrics.volunteerCount ?? volunteerRows.length ?? 0, 0), 900)
  const animatedVolunteerHours = useAnimatedNumber(volunteerHours, 1100)
  const animatedPendingVisits = useAnimatedNumber(safeNumber(metrics.pendingAppointments ?? 0, 0), 900)
  const animatedApprovedVisits = useAnimatedNumber(approvedAppointments.approved, 900)
  const animatedActiveHelp = useAnimatedNumber(safeNumber(metrics.activeHelpRequests ?? 0, 0), 900)

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-[32px] border border-white/5 bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950/80 p-8">
        <div className="absolute -top-20 right-0 h-48 w-48 rounded-full bg-cyan-500/20 blur-3xl" aria-hidden="true" />
        <div className="absolute -bottom-24 left-5 h-48 w-48 rounded-full bg-purple-500/10 blur-3xl" aria-hidden="true" />
        <ScrollReveal animation="fade-up">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.4em] text-cyan-200">
                Pulse
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 animate-pulse" />
              </div>
              <h1 className="text-4xl font-semibold text-white">Command center for your orphanage intelligence</h1>
              <p className="text-sm text-slate-300">
                Export-ready analytics tuned for board reviews, donor confidence, and compliance peace of mind.
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-5 text-sm text-cyan-50">
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">This week</p>
              <p className="mt-2 text-3xl font-semibold text-white">{formatCurrency(animatedHeroInflow)}</p>
              <p className="text-xs text-slate-300">Current month inflow</p>
              <div className="mt-4 h-1 w-full rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-sky-500"
                  style={{ width: `${Math.min(100, fundingPacePercent || 0)}%` }}
                />
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>

      <ScrollReveal animation="fade-up" delay={50}>
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {impactHighlights.map((highlight) => (
            <article key={highlight.label} className="group relative overflow-hidden rounded-3xl border border-white/5 bg-slate-900/60 p-5">
              <div className={`absolute inset-0 opacity-0 transition group-hover:opacity-70 bg-gradient-to-br ${highlight.accent}`} aria-hidden="true" />
              <div className="relative flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-white">
                  <highlight.icon />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{highlight.label}</p>
                  <p className="text-2xl font-semibold text-white">{highlight.primary}</p>
                  <p className="text-[11px] text-slate-300/80">{highlight.delta}</p>
                </div>
              </div>
            </article>
          ))}
        </section>
      </ScrollReveal>

      <ScrollReveal animation="fade-up" delay={100}>
        <header className="flex flex-col gap-4 rounded-3xl border border-white/5 bg-slate-900/40 p-6 lg:flex-row lg:flex-wrap lg:items-center lg:justify-between xl:flex-nowrap">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Reports</p>
            <h2 className="text-3xl font-semibold text-white">Intelligence & audits</h2>
            <p className="text-sm text-slate-400">Export-ready insights for donors, board members, and regulatory submissions.</p>
          </div>
          <button
            onClick={handleDownloadAll}
            disabled={downloading.all}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-cyan-900/40 disabled:cursor-not-allowed disabled:opacity-60 lg:w-auto"
          >
            <FaDownload className={downloading.all ? 'animate-spin' : ''} />
            {downloading.all ? 'Preparing reports…' : 'Download everything'}
          </button>
        </header>
      </ScrollReveal>

      <ScrollReveal animation="fade-up" delay={150}>
        <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {reportCatalog.map((report) => (
            <article key={report.title} className="relative overflow-hidden rounded-3xl border border-white/5 bg-slate-900/40 p-6">
              <div className={`absolute -top-20 right-0 h-48 w-48 rounded-full bg-gradient-to-br ${report.accent} opacity-30 blur-3xl`} aria-hidden="true" />
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{report.format}</p>
              <h3 className="mt-3 text-2xl font-semibold text-white">{report.title}</h3>
              <p className="mt-2 text-sm text-slate-300">{report.description}</p>
              <div className={`relative mt-6 h-1 rounded-full bg-gradient-to-r ${report.accent}`} />
              <button
                onClick={report.action}
                disabled={downloading[report.loadingKey]}
                className="mt-6 rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 hover:border-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {downloading[report.loadingKey] ? 'Exporting…' : 'Schedule export'}
              </button>
            </article>
          ))}
        </section>
      </ScrollReveal>

      <ScrollReveal animation="fade-up" delay={200}>
        <section className="rounded-3xl border border-white/5 bg-slate-900/40 p-6">
          <div className="flex items-center gap-3">
            <FaChartPie className="text-3xl text-cyan-300" />
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Snapshot</p>
              <h3 className="text-2xl font-semibold text-white">Current KPIs</h3>
            </div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-white/5 bg-slate-950/60 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Children</p>
              <p className="text-2xl font-semibold text-white">{Math.round(animatedChildrenCount)}</p>
              <p className="text-[11px] text-slate-400">+{newChildrenThisMonth} this month</p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-slate-950/60 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Volunteers</p>
              <p className="text-2xl font-semibold text-white">{Math.round(animatedVolunteerCount)}</p>
              <p className="text-[11px] text-slate-400">{Math.round(animatedVolunteerHours)} hrs logged</p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-slate-950/60 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Pending visits</p>
              <p className="text-2xl font-semibold text-white">{Math.round(animatedPendingVisits)}</p>
              <p className="text-[11px] text-slate-400">{Math.round(animatedApprovedVisits)} approved this week</p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-slate-950/60 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Active help</p>
              <p className="text-2xl font-semibold text-white">{Math.round(animatedActiveHelp)}</p>
              <p className="text-[11px] text-slate-400">{formatPercent(safeguardPercent)} SLA met</p>
            </div>
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal animation="fade-up" delay={220}>
        <section className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-7 xl:col-span-8 rounded-3xl border border-white/5 bg-slate-900/40 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Momentum</p>
                <h3 className="text-2xl font-semibold text-white">Pipeline trajectory</h3>
                <p className="text-sm text-slate-400">Mini area charts echo the Power BI look so you can glance at inflow and wellbeing trends.</p>
              </div>
              <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">Live feed</span>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <MiniAreaChart label="Donation runway" points={donationTrend} accent={{ start: '#06b6d4', end: '#0ea5e9' }} />
              <MiniAreaChart label="Child wellbeing index" points={wellbeingTrend} accent={{ start: '#a855f7', end: '#ec4899' }} />
            </div>
          </div>
          <div className="rounded-3xl border border-white/5 bg-slate-900/40 p-6 lg:col-span-5 xl:col-span-4">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Capacity outlook</p>
            <h3 className="text-2xl font-semibold text-white">Power BI gauges</h3>
            <p className="text-sm text-slate-400">Each gauge tracks the levers trustees usually inspect before approvals.</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {gaugeInsights.map((gauge) => (
                <RadialGauge key={gauge.label} label={gauge.label} percentage={gauge.percentage} color={gauge.color} />
              ))}
            </div>
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal animation="fade-up" delay={250}>
        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/5 bg-slate-900/40 p-6">
            <h3 className="text-2xl font-semibold text-white">Compliance automation</h3>
            <p className="mt-2 text-sm text-slate-400">
              Configure once, and SoulConnect will deliver monthly, quarterly, and annual statements directly to your board, donors, and governing bodies.
            </p>
            <ul className="mt-6 space-y-4 text-sm text-slate-200">
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-cyan-400" />
                Auto-email to registered trustees.
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-emerald-400" />
                Secure shareable link for donors.
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-amber-400" />
                On-demand CSV exports for accountants.
              </li>
            </ul>
          </div>
          <div className="rounded-3xl border border-white/5 bg-slate-900/40 p-6">
            <h3 className="text-2xl font-semibold text-white">Automation timeline</h3>
            <div className="mt-5 space-y-5">
              {timelineMilestones.map((item) => (
                <div key={item.title} className="rounded-2xl border border-white/5 bg-slate-950/60 p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{item.status}</p>
                  <p className="text-lg font-semibold text-white">{item.title}</p>
                  <p className="text-sm text-slate-300">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </ScrollReveal>
    </div>
  )
}

export default ReportsAnalytics