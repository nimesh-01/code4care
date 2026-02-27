import { FaFileAlt, FaChartPie, FaDownload } from 'react-icons/fa'
import { useAdminDashboardContext } from './AdminLayout'

const ReportsAnalytics = () => {
  const { metrics } = useAdminDashboardContext()

  const reportCatalog = [
    {
      title: 'Monthly donation statement',
      description: 'Detailed inflows, donor sources, and utilization mapping.',
      format: 'PDF + CSV',
      accent: 'from-cyan-500 to-blue-500',
    },
    {
      title: 'Child growth tracker',
      description: 'Progress across health, education, and wellbeing touchpoints.',
      format: 'Dashboard + XLS',
      accent: 'from-emerald-500 to-lime-500',
    },
    {
      title: 'Volunteer performance',
      description: 'Engagement heatmap, hours contributed, and task completion.',
      format: 'Interactive',
      accent: 'from-purple-500 to-pink-500',
    },
    {
      title: 'Appointment & visitor logs',
      description: 'Approved visits, feedback captured, and compliance notes.',
      format: 'CSV',
      accent: 'from-amber-500 to-orange-500',
    },
  ]

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Reports</p>
          <h2 className="text-3xl font-semibold text-white">Intelligence & audits</h2>
          <p className="text-sm text-slate-400">Export-ready insights for donors, board members, and regulatory submissions.</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-cyan-900/40">
          <FaDownload /> Download everything
        </button>
      </header>

      <section className="grid gap-6 md:grid-cols-2">
        {reportCatalog.map((report) => (
          <article key={report.title} className="rounded-3xl border border-white/5 bg-slate-900/40 p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{report.format}</p>
            <h3 className="mt-3 text-2xl font-semibold text-white">{report.title}</h3>
            <p className="mt-2 text-sm text-slate-400">{report.description}</p>
            <div className={`mt-6 h-1 rounded-full bg-gradient-to-r ${report.accent}`} />
            <button className="mt-6 rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300">Schedule export</button>
          </article>
        ))}
      </section>

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
    </div>
  )
}

export default ReportsAnalytics
