import { useMemo, useState } from 'react'
import { FaExclamationTriangle, FaLifeRing, FaPlusCircle } from 'react-icons/fa'
import { useAdminDashboardContext } from './AdminLayout'

const priorityStyles = {
  high: 'border border-rose-500/30 bg-rose-500/10 text-rose-200',
  medium: 'border border-amber-500/30 bg-amber-500/10 text-amber-100',
  low: 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-100',
}

const HelpRequestsManagement = () => {
  const { data } = useAdminDashboardContext()
  const [statusFilter, setStatusFilter] = useState('all')

  const helpRequests = useMemo(() => {
    return (data.helpRequests || []).filter((req) => statusFilter === 'all' || req.status === statusFilter)
  }, [data.helpRequests, statusFilter])

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Help requests</p>
          <h2 className="text-3xl font-semibold text-white">Resource escalation desk</h2>
          <p className="text-sm text-slate-400">Create emergency alerts, assign volunteers, and close the loop with donors.</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-amber-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-rose-900/40">
          <FaPlusCircle /> New request
        </button>
      </header>

      <div className="rounded-3xl border border-white/5 bg-slate-900/40 p-6">
        <div className="flex flex-wrap items-center gap-3">
          {['all', 'pending', 'accepted', 'completed'].map((value) => (
            <button
              key={value}
              onClick={() => setStatusFilter(value)}
              className={`rounded-full px-4 py-2 text-xs ${statusFilter === value ? 'bg-white/10 text-white' : 'text-slate-400'}`}
            >
              {value}
            </button>
          ))}
        </div>

        <div className="mt-6 grid gap-4">
          {helpRequests.map((request) => (
            <div key={request.id} className="rounded-2xl border border-white/5 bg-slate-950/60 p-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-lg font-semibold text-white">{request.title}</p>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{request.id}</p>
                  <p className="mt-2 text-sm text-slate-400">Last update • {new Date(request.updatedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`rounded-full px-4 py-1 text-xs font-semibold ${priorityStyles[request.priority]}`}>{request.priority} priority</span>
                  <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">{request.status}</span>
                  <span className="text-xs text-slate-500">Volunteer • {request.volunteerName}</span>
                  <div className="inline-flex gap-2 text-xs">
                    <button className="rounded-full border border-white/10 px-3 py-1 text-slate-300">Assign</button>
                    <button className="rounded-full border border-white/10 px-3 py-1 text-slate-400">Update</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {!helpRequests.length && <p className="py-10 text-center text-sm text-slate-500">No help requests in this state.</p>}
        </div>
      </div>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-3xl border border-white/5 bg-slate-900/40 p-6">
          <div className="flex items-center gap-3">
            <FaExclamationTriangle className="text-3xl text-amber-300" />
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Escalation matrix</p>
              <h3 className="text-xl font-semibold text-white">Emergency readiness</h3>
            </div>
          </div>
          <ul className="mt-6 list-disc space-y-2 pl-6 text-sm text-slate-300">
            <li>Flag emergencies to volunteers and donors instantly.</li>
            <li>Tag requests by category (Medical, Education, Infrastructure).</li>
            <li>Maintain closure notes for transparency.</li>
          </ul>
        </div>
        <div className="rounded-3xl border border-white/5 bg-slate-900/40 p-6">
          <div className="flex items-center gap-3">
            <FaLifeRing className="text-3xl text-cyan-300" />
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Volunteer sync</p>
              <h3 className="text-xl font-semibold text-white">Assignment insights</h3>
            </div>
          </div>
          <p className="mt-4 text-sm text-slate-400">
            Track which volunteers have open tasks, late updates, or completed missions to keep requests moving.
          </p>
        </div>
      </section>
    </div>
  )
}

export default HelpRequestsManagement
