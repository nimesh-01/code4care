import { useState, useCallback, useMemo } from 'react'
import { FaChartPie, FaDownload } from 'react-icons/fa'
import { toast } from 'react-toastify'
import { useAdminDashboardContext } from './AdminLayout'
import { donationAPI } from '../../../services/api'
import { ScrollReveal } from '../../../hooks/useScrollReveal'

const ReportsAnalytics = () => {
  const { metrics, data, orphanage } = useAdminDashboardContext()
  const [downloading, setDownloading] = useState({
    donation: false,
    children: false,
    volunteers: false,
    appointments: false,
    all: false,
  })

  const safeDate = (value) => {
    if (!value) return 'N/A'
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString('en-IN')
  }

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
      // individual handlers already surfaced toasts; keep silent here
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

  return (
    <div className="space-y-8">
      <ScrollReveal animation="fade-up">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Reports</p>
          <h2 className="text-3xl font-semibold text-white">Intelligence & audits</h2>
          <p className="text-sm text-slate-400">Export-ready insights for donors, board members, and regulatory submissions.</p>
        </div>
        <button
          onClick={handleDownloadAll}
          disabled={downloading.all}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-cyan-900/40 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <FaDownload className={downloading.all ? 'animate-spin' : ''} />
          {downloading.all ? 'Preparing reports…' : 'Download everything'}
        </button>
      </header>
      </ScrollReveal>

      <ScrollReveal animation="fade-up" delay={100}>
      <section className="grid gap-6 md:grid-cols-2">
        {reportCatalog.map((report) => (
          <article key={report.title} className="rounded-3xl border border-white/5 bg-slate-900/40 p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{report.format}</p>
            <h3 className="mt-3 text-2xl font-semibold text-white">{report.title}</h3>
            <p className="mt-2 text-sm text-slate-400">{report.description}</p>
            <div className={`mt-6 h-1 rounded-full bg-gradient-to-r ${report.accent}`} />
            <button
              onClick={report.action}
              disabled={downloading[report.loadingKey]}
              className="mt-6 rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300 hover:border-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
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
            <p className="text-2xl font-semibold text-white">{metrics.childrenCount}</p>
          </div>
          <div className="rounded-2xl border border-white/5 bg-slate-950/60 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Volunteers</p>
            <p className="text-2xl font-semibold text-white">{metrics.volunteerCount}</p>
          </div>
          <div className="rounded-2xl border border-white/5 bg-slate-950/60 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Pending visits</p>
            <p className="text-2xl font-semibold text-white">{metrics.pendingAppointments}</p>
          </div>
          <div className="rounded-2xl border border-white/5 bg-slate-950/60 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Active help</p>
            <p className="text-2xl font-semibold text-white">{metrics.activeHelpRequests}</p>
          </div>
        </div>
      </section>
      </ScrollReveal>

      <ScrollReveal animation="fade-up" delay={300}>
      <section className="rounded-3xl border border-white/5 bg-slate-900/40 p-6">
        <h3 className="text-2xl font-semibold text-white">Compliance automation</h3>
        <p className="mt-2 text-sm text-slate-400">
          Configure once, and SoulConnect will deliver monthly, quarterly, and annual statements directly to your board, donors, and governing bodies.
        </p>
        <ul className="mt-6 list-disc space-y-2 pl-6 text-sm text-slate-300">
          <li>Auto-email to registered trustees.</li>
          <li>Secure shareable link for donors.</li>
          <li>On-demand CSV exports for accountants.</li>
        </ul>
      </section>
      </ScrollReveal>
    </div>
  )
}

export default ReportsAnalytics
