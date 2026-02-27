import { FaCalendarPlus, FaPeopleCarry, FaClipboardList } from 'react-icons/fa'
import { useAdminDashboardContext } from './AdminLayout'

const statusColor = {
  upcoming: 'bg-emerald-500/20 text-emerald-200',
  planning: 'bg-indigo-500/20 text-indigo-200',
  completed: 'bg-slate-500/20 text-slate-200',
}

const EventsManagement = () => {
  const { data } = useAdminDashboardContext()

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Events</p>
          <h2 className="text-3xl font-semibold text-white">Community engagement calendar</h2>
          <p className="text-sm text-slate-400">Plan health camps, festivals, and volunteer drives with clarity.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300">View calendar</button>
          <button className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-900/40">
            <FaCalendarPlus /> Schedule event
          </button>
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {data.events?.map((event) => (
          <div key={event.id} className="rounded-3xl border border-white/5 bg-slate-900/40 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{event.focus}</p>
                <h3 className="text-xl font-semibold text-white">{event.name}</h3>
                <p className="text-sm text-slate-400">{new Date(event.date).toLocaleDateString('en-IN', { dateStyle: 'long' })}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColor[event.status]}`}>{event.status}</span>
            </div>
            <div className="mt-6 flex items-center justify-between text-sm text-slate-300">
              <span>Volunteers confirmed</span>
              <span className="font-semibold text-white">{event.volunteerCount}</span>
            </div>
            <button className="mt-6 w-full rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300">View runbook</button>
          </div>
        ))}
      </div>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-3xl border border-white/5 bg-slate-900/40 p-6">
          <div className="flex items-center gap-3">
            <FaPeopleCarry className="text-3xl text-cyan-300" />
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Volunteer ops</p>
              <h3 className="text-xl font-semibold text-white">On-ground readiness</h3>
            </div>
          </div>
          <ul className="mt-6 list-disc space-y-2 pl-6 text-sm text-slate-300">
            <li>Share briefing kit 48h before the event.</li>
            <li>Auto assign checklists to volunteer captains.</li>
            <li>Publish event summary posts within 24h.</li>
          </ul>
        </div>
        <div className="rounded-3xl border border-white/5 bg-slate-900/40 p-6">
          <div className="flex items-center gap-3">
            <FaClipboardList className="text-3xl text-amber-300" />
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Reporting</p>
              <h3 className="text-xl font-semibold text-white">Event scorecard</h3>
            </div>
          </div>
          <p className="mt-4 text-sm text-slate-400">
            Track attendance, funds raised, volunteer hours, and beneficiaries served to communicate impact clearly.
          </p>
        </div>
      </section>
    </div>
  )
}

export default EventsManagement
