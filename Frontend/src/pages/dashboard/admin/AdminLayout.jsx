import { createContext, useContext } from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'
import {
  FaChartLine,
  FaChild,
  FaHandsHelping,
  FaCalendarAlt,
  FaGift,
  FaBullhorn,
  FaUsers,
  FaFileAlt,
  FaCogs,
  FaBell,
  FaCircleNotch,
} from 'react-icons/fa'
import { MdDashboardCustomize, MdEvent, MdPostAdd } from 'react-icons/md'
import { useAdminDashboardData } from './hooks/useAdminDashboardData'
import { useAuth } from '../../../context/AuthContext'
import Navbar from '../../../components/Navbar'

const AdminDashboardContext = createContext(null)

export const useAdminDashboardContext = () => {
  const ctx = useContext(AdminDashboardContext)
  if (!ctx) throw new Error('useAdminDashboardContext must be used inside AdminDashboardContext.Provider')
  return ctx
}

const navigation = [
  { label: 'Overview', path: '/dashboard/admin', icon: MdDashboardCustomize },
  { label: 'Children', path: '/dashboard/admin/children', icon: FaChild },
  { label: 'Donations', path: '/dashboard/admin/donations', icon: FaGift },
  { label: 'Appointments', path: '/dashboard/admin/appointments', icon: FaCalendarAlt },
  { label: 'Help Requests', path: '/dashboard/admin/help-requests', icon: FaHandsHelping },
  { label: 'Events', path: '/dashboard/admin/events', icon: MdEvent },
  { label: 'Posts & Updates', path: '/dashboard/admin/posts', icon: MdPostAdd },
  { label: 'Volunteers', path: '/dashboard/admin/volunteers', icon: FaUsers },
  { label: 'Reports', path: '/dashboard/admin/reports', icon: FaFileAlt },
  { label: 'Settings', path: '/dashboard/admin/settings', icon: FaCogs },
  { label: 'Notifications', path: '/dashboard/admin/notifications', icon: FaBell },
]

const AdminLayout = () => {
  const dashboard = useAdminDashboardData()
  const location = useLocation()
  const { user } = useAuth()

  return (
    <AdminDashboardContext.Provider value={dashboard}>
      <div className="min-h-screen bg-cream-50 text-teal-900 dark:bg-dark-900 dark:text-cream-50 transition-colors duration-300">
        <Navbar />
        <div className="flex min-h-screen pt-24 lg:pt-28">
          <aside className="hidden lg:flex w-72 flex-col border-r border-cream-200 dark:border-dark-700 bg-white/90 dark:bg-dark-800/80 backdrop-blur-xl">
            <div className="px-6 py-8 border-b border-cream-200 dark:border-dark-700">
              <p className="text-xs uppercase tracking-[0.3em] text-teal-500 dark:text-cream-300">Orphanage Admin</p>
              <h1 className="mt-2 text-2xl font-semibold text-teal-900 dark:text-cream-50 font-playfair">Command Center</h1>
            </div>
            <nav className="flex-1 overflow-y-auto px-4 py-6">
              <ul className="space-y-1">
                {navigation.map((item) => {
                  const Icon = item.icon
                  return (
                    <li key={item.path}>
                      <NavLink
                        to={item.path}
                        className={({ isActive }) => `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                          isActive
                            ? 'bg-gradient-to-r from-coral-400 to-teal-400 text-white shadow-lg shadow-coral-200/60'
                            : 'text-teal-700 dark:text-cream-200 hover:bg-cream-50 dark:hover:bg-dark-700/60'
                        }`}
                      >
                        <Icon className="text-lg" />
                        <span>{item.label}</span>
                      </NavLink>
                    </li>
                  )
                })}
              </ul>
            </nav>
            <div className="px-6 py-6 text-sm text-teal-600 dark:text-cream-300 border-t border-cream-200 dark:border-dark-700">
              <p className="font-semibold text-teal-900 dark:text-cream-50">{user?.fullname?.firstname} {user?.fullname?.lastname}</p>
              <p className="text-xs uppercase tracking-[0.3em] text-coral-500">Orphanage Admin</p>
              <p className="mt-2 text-xs text-teal-400 dark:text-cream-400">Last sync • {new Date().toLocaleTimeString()}</p>
            </div>
          </aside>

          <div className="flex flex-1 flex-col">
            <header className="sticky top-0 z-10 border-b border-cream-200 dark:border-dark-700 bg-white/80 dark:bg-dark-900/80 backdrop-blur-xl">
            <div className="flex flex-col gap-4 px-6 py-4 md:flex-row md:items-center md:justify-between">
              <div>
                  <p className="text-xs uppercase tracking-[0.4em] text-teal-500 dark:text-cream-300">SoulConnect</p>
                  <h2 className="text-2xl font-semibold text-teal-900 dark:text-cream-50 font-playfair">Orphanage Operations Dashboard</h2>
                  <p className="text-sm text-teal-600 dark:text-cream-400">{location.pathname.replace('/dashboard/', '').replaceAll('-', ' ') || 'overview'}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={dashboard.refresh}
                    className="inline-flex items-center gap-2 rounded-xl border border-cream-300 dark:border-dark-600 px-4 py-2 text-sm font-medium text-teal-700 dark:text-cream-50 hover:border-coral-400 dark:hover:border-coral-300 hover:bg-cream-50 dark:hover:bg-dark-700"
                >
                    <FaCircleNotch className={`text-sm ${dashboard.loading ? 'animate-spin text-coral-500 dark:text-coral-400' : 'text-teal-400 dark:text-cream-300'}`} />
                  Refresh Data
                </button>
                  <div className="rounded-xl border border-cream-300 dark:border-dark-600 bg-white dark:bg-dark-800 px-4 py-2 text-right shadow-sm">
                    <p className="text-xs text-teal-500 dark:text-cream-300">Monthly Donations</p>
                    <p className="text-lg font-semibold text-coral-500">₹{dashboard.metrics.monthlyDonations.toLocaleString('en-IN')}</p>
                </div>
              </div>
            </div>
            {dashboard.error && (
                <div className="mx-6 mb-4 rounded-xl border border-yellow-500/40 bg-yellow-50 dark:bg-yellow-500/10 px-4 py-3 text-sm text-yellow-800 dark:text-yellow-100">
                {dashboard.error}
              </div>
            )}
            </header>

            <main className="flex-1 overflow-y-auto bg-gradient-to-b from-cream-50 via-white to-cream-100 dark:from-dark-900 dark:via-dark-950 dark:to-dark-900">
            <div className="mx-auto max-w-7xl px-6 py-10">
              {dashboard.loading ? (
                  <div className="flex flex-col items-center justify-center py-24 text-center text-teal-500 dark:text-cream-200">
                    <FaChartLine className="mb-4 text-4xl animate-pulse text-coral-500" />
                    <p className="text-lg font-medium">Syncing live orphanage metrics…</p>
                    <p className="text-sm text-teal-400 dark:text-cream-400/80">Fetching children, donations, appointments and more.</p>
                </div>
              ) : (
                <Outlet />
              )}
            </div>
            </main>
          </div>
        </div>
      </div>
    </AdminDashboardContext.Provider>
  )
}

export default AdminLayout
