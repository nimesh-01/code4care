import { useAdminDashboardContext } from './AdminLayout'
import { FaMedal, FaUserCheck, FaUserClock } from 'react-icons/fa'

const ratingTag = (rating) => {
  if (rating >= 4.8) return 'bg-emerald-500/20 text-emerald-100'
  if (rating >= 4.5) return 'bg-cyan-500/20 text-cyan-100'
  return 'bg-slate-500/20 text-slate-200'
}

const VolunteersManagement = () => {
  const { data } = useAdminDashboardContext()

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Volunteers</p>
          <h2 className="text-3xl font-semibold text-white">Human capital studio</h2>
          <p className="text-sm text-slate-400">Track availability, skills, and recognition for your core volunteer force.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300">Invite new</button>
          <button className="rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-900/30">
            Assign task
          </button>
        </div>
      </header>

      <section className="grid gap-6 md:grid-cols-3">
        <div className="rounded-3xl border border-white/5 bg-slate-900/40 p-5">
          <FaUserCheck className="text-2xl text-emerald-300" />
          <p className="mt-3 text-xs uppercase tracking-[0.3em] text-slate-500">Active volunteers</p>
          <p className="mt-1 text-3xl font-semibold text-white">{data.volunteers?.length || 0}</p>
        </div>
        <div className="rounded-3xl border border-white/5 bg-slate-900/40 p-5">
          <FaUserClock className="text-2xl text-amber-300" />
          <p className="mt-3 text-xs uppercase tracking-[0.3em] text-slate-500">Hours logged (30d)</p>
          <p className="mt-1 text-3xl font-semibold text-white">{(data.volunteers || []).reduce((sum, vol) => sum + (vol.tasksCompleted || 0), 0)}</p>
        </div>
        <div className="rounded-3xl border border-white/5 bg-slate-900/40 p-5">
          <FaMedal className="text-2xl text-rose-300" />
          <p className="mt-3 text-xs uppercase tracking-[0.3em] text-slate-500">Recognition</p>
          <p className="mt-1 text-3xl font-semibold text-white">Badges ready • 5</p>
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {data.volunteers?.map((volunteer) => (
          <div key={volunteer.id} className="rounded-3xl border border-white/5 bg-slate-900/40 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold text-white">{volunteer.name}</p>
                <p className="text-xs text-slate-500">{volunteer.availability}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${ratingTag(volunteer.rating)}`}>
                ⭐ {volunteer.rating}
              </span>
            </div>
            <p className="mt-4 text-xs uppercase tracking-[0.3em] text-slate-500">Specialisations</p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              {volunteer.skills?.map((skill) => (
                <span key={skill} className="rounded-full bg-white/5 px-3 py-1 text-slate-300">{skill}</span>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between text-sm text-slate-300">
              <span>Tasks completed</span>
              <span className="font-semibold text-white">{volunteer.tasksCompleted}</span>
            </div>
            <div className="mt-4 flex gap-2 text-xs">
              <button className="flex-1 rounded-full border border-white/10 px-3 py-2 text-center text-slate-300">Contact</button>
              <button className="flex-1 rounded-full border border-white/10 px-3 py-2 text-center text-slate-400">Assign</button>
            </div>
          </div>
        ))}
      </div>

      <section className="rounded-3xl border border-white/5 bg-slate-900/40 p-6">
        <h3 className="text-2xl font-semibold text-white">Volunteer success playbook</h3>
        <ul className="mt-6 list-disc space-y-2 pl-6 text-sm text-slate-300">
          <li>Track achievements and award digital badges for motivation.</li>
          <li>Pair volunteers with children based on skills and interests.</li>
          <li>Automate availability reminders before critical events.</li>
        </ul>
      </section>
    </div>
  )
}

export default VolunteersManagement
