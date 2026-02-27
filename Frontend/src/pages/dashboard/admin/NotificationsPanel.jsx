import { FaBell, FaCheck } from 'react-icons/fa'
import { useAdminDashboardContext } from './AdminLayout'

const typeAccent = {
  donation: 'bg-emerald-500/20 text-emerald-100',
  appointment: 'bg-indigo-500/20 text-indigo-100',
  volunteer: 'bg-purple-500/20 text-purple-100',
  default: 'bg-slate-500/20 text-slate-200',
}

const NotificationsPanel = () => {
  const { data } = useAdminDashboardContext()

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Notifications</p>
          <h2 className="text-3xl font-semibold text-white">Mission control feed</h2>
          <p className="text-sm text-slate-400">All confirmations, escalations, and updates in one audit-friendly timeline.</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300">
          <FaCheck /> Mark all as read
        </button>
      </header>

      <div className="rounded-3xl border border-white/5 bg-slate-900/40 p-6">
        <div className="flex items-center gap-3">
          <FaBell className="text-3xl text-cyan-300" />
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Live updates</p>
            <h3 className="text-2xl font-semibold text-white">Activity timeline</h3>
          </div>
        </div>
        <ol className="mt-6 space-y-4">
          {data.notifications?.map((notification) => (
            <li key={notification.id} className="flex items-start gap-4 rounded-2xl border border-white/5 bg-slate-950/60 p-4">
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${typeAccent[notification.type] || typeAccent.default}`}>
                {notification.type || 'update'}
              </span>
              <div>
                <p className="text-sm font-semibold text-white">{notification.title}</p>
                <p className="text-sm text-slate-400">{notification.content}</p>
                <p className="text-xs text-slate-500">{notification.timeAgo}</p>
              </div>
            </li>
          ))}
          {!data.notifications?.length && <p className="py-10 text-center text-sm text-slate-500">No notifications available.</p>}
        </ol>
      </div>
    </div>
  )
}

export default NotificationsPanel
