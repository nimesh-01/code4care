import { FaChild, FaHandsHelping, FaUserShield, FaChartLine, FaCalendarCheck } from 'react-icons/fa'
import { MdOutlineVolunteerActivism } from 'react-icons/md'
import { useAdminDashboardContext } from './AdminLayout'

const StatCard = ({ title, value, subtitle, accent }) => (
  <div className="rounded-3xl border border-white/5 bg-gradient-to-br from-slate-900/70 to-slate-900/30 p-6 shadow-2xl shadow-black/30">
    <p className="text-sm uppercase tracking-[0.4em] text-slate-500">{title}</p>
    <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
    <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
    <div className={`mt-4 h-1 rounded-full bg-gradient-to-r ${accent}`} />
  </div>
)

const DonationTrend = ({ series }) => {
  const max = Math.max(...series.map((item) => item.amount), 1)
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Financial pulse</p>
          <h3 className="text-2xl font-semibold text-white">Monthly donations trend</h3>
        </div>
        <span className="rounded-full border border-cyan-500/30 px-3 py-1 text-xs text-cyan-300">Last 12 months</span>
      </div>
      <div className="grid grid-cols-12 gap-3 rounded-3xl border border-white/5 bg-slate-900/40 p-6">
        {series.map((point) => (
          <div key={point.month} className="flex flex-col items-center gap-2">
            <div className="flex h-40 w-full items-end justify-center rounded-full bg-slate-900/60 p-1">
              <div
                className="w-full rounded-full bg-gradient-to-t from-cyan-500 to-indigo-500"
                style={{ height: `${Math.max(10, (point.amount / max) * 100)}%` }}
              />
            </div>
            <p className="text-xs text-slate-400">{point.month}</p>
            <p className="text-xs font-semibold text-slate-200">₹{point.amount.toLocaleString('en-IN')}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

const ActivityTimeline = ({ activities }) => (
  <div className="rounded-3xl border border-white/5 bg-slate-900/40 p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Mission log</p>
        <h3 className="text-2xl font-semibold text-white">Recent activity</h3>
      </div>
      <span className="text-xs text-slate-500">Auto-synced</span>
    </div>
    <ol className="mt-6 space-y-5 border-l border-slate-800 pl-6">
      {activities.map((activity) => (
        <li key={activity.id} className="relative">
          <span className="absolute -left-2 top-1 h-3 w-3 rounded-full bg-cyan-400" />
          <p className="text-sm font-medium text-white">{activity.label}</p>
          <p className="text-xs text-slate-500">{activity.timestamp}</p>
        </li>
      ))}
    </ol>
  </div>
)

const DashboardOverview = () => {
  const { data, metrics } = useAdminDashboardContext()

  const overviewStats = [
    {
      title: 'Children',
      value: metrics.childrenCount.toString(),
      subtitle: 'Active & cared for',
      accent: 'from-cyan-500 to-cyan-300',
      icon: <FaChild className="text-cyan-300" />,
    },
    {
      title: 'Volunteers',
      value: metrics.volunteerCount.toString(),
      subtitle: 'Trusted contributors',
      accent: 'from-purple-500 to-indigo-400',
      icon: <MdOutlineVolunteerActivism className="text-purple-300" />,
    },
    {
      title: 'Pending appointments',
      value: metrics.pendingAppointments.toString(),
      subtitle: 'Need review',
      accent: 'from-amber-500 to-orange-400',
      icon: <FaCalendarCheck className="text-amber-300" />,
    },
    {
      title: 'Active help requests',
      value: metrics.activeHelpRequests.toString(),
      subtitle: 'Support in progress',
      accent: 'from-rose-500 to-amber-400',
      icon: <FaHandsHelping className="text-rose-300" />,
    },
  ]

  return (
    <div className="space-y-10">
      <section>
        <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Dashboard</p>
        <h2 className="mt-2 text-3xl font-semibold text-white">Unified orphanage intelligence</h2>
        <p className="text-sm text-slate-400">Insights refreshed in real-time from children, donations, appointments and volunteer services.</p>
      </section>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {overviewStats.map((stat) => (
          <div key={stat.title} className="relative overflow-hidden">
            <StatCard {...stat} />
            <div className="absolute right-6 top-6 text-3xl opacity-60">{stat.icon}</div>
          </div>
        ))}
      </section>

      <section className="grid gap-8 lg:grid-cols-2">
        <DonationTrend series={metrics.donationSeries} />
        <div className="space-y-6">
          <div className="rounded-3xl border border-white/5 bg-slate-900/40 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Financial health</p>
                <h3 className="text-2xl font-semibold text-white">Donations snapshot</h3>
              </div>
              <FaChartLine className="text-3xl text-cyan-400" />
            </div>
            <dl className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-white/5 bg-slate-950/60 p-4">
                <dt className="text-xs uppercase tracking-[0.3em] text-slate-500">Total received</dt>
                <dd className="text-2xl font-semibold text-white">₹{metrics.totalDonations.toLocaleString('en-IN')}</dd>
                <p className="text-xs text-slate-500">All-time impact</p>
              </div>
              <div className="rounded-2xl border border-white/5 bg-slate-950/60 p-4">
                <dt className="text-xs uppercase tracking-[0.3em] text-slate-500">Current month</dt>
                <dd className="text-2xl font-semibold text-white">₹{metrics.monthlyDonations.toLocaleString('en-IN')}</dd>
                <p className="text-xs text-slate-500">Goal: ₹60,000</p>
              </div>
            </dl>
          </div>
          <ActivityTimeline activities={data.recentActivities} />
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-3xl border border-white/5 bg-slate-900/40 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Operational workload</p>
              <h3 className="text-2xl font-semibold text-white">Appointments & help</h3>
            </div>
            <FaChartLine className="text-3xl text-indigo-400" />
          </div>
          <ul className="mt-6 space-y-4 text-sm text-slate-300">
            <li className="flex items-center justify-between">
              <span>Pending appointments</span>
              <span className="rounded-full bg-indigo-500/20 px-3 py-1 text-indigo-200">{metrics.pendingAppointments}</span>
            </li>
            <li className="flex items-center justify-between">
              <span>Active help requests</span>
              <span className="rounded-full bg-rose-500/20 px-3 py-1 text-rose-100">{metrics.activeHelpRequests}</span>
            </li>
            <li className="flex items-center justify-between">
              <span>Upcoming events</span>
              <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-emerald-100">{metrics.upcomingEvents}</span>
            </li>
          </ul>
        </div>
        <div className="rounded-3xl border border-white/5 bg-gradient-to-br from-slate-900/70 to-slate-900/30 p-6">
          <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Compliance & trust</p>
          <h3 className="text-2xl font-semibold text-white">Verification & reporting</h3>
          <p className="mt-2 text-sm text-slate-400">
            Keep your orphanage compliant with real-time verification, financial audits, and transparent reporting for donors and regulators.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/5 bg-slate-950/60 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Verification</p>
              <p className="text-lg font-semibold text-emerald-300">{data.orphanageProfile?.verificationStatus ?? 'pending'}</p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-slate-950/60 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Registration</p>
              <p className="text-sm font-semibold text-slate-200">{data.orphanageProfile?.registrationNumber ?? 'N/A'}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default DashboardOverview
