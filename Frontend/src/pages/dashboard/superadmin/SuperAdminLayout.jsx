import { createContext, useContext, useState, useEffect, useCallback, Component } from 'react'
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  FaShieldAlt, FaCheckCircle, FaBuilding, FaChartBar, FaDonate,
  FaUsers, FaFileAlt, FaCogs, FaBell, FaCircleNotch, FaBars, FaTimes,
} from 'react-icons/fa'
import { MdDashboardCustomize } from 'react-icons/md'
import { useAuth } from '../../../context/AuthContext'
import { superAdminAPI, donationAPI, childrenAPI, eventAPI, postAPI } from '../../../services/api'
import Navbar from '../../../components/Navbar'

const SuperAdminContext = createContext(null)

export const useSuperAdminContext = () => {
  const ctx = useContext(SuperAdminContext)
  if (!ctx) throw new Error('useSuperAdminContext must be used inside SuperAdminLayout')
  return ctx
}

const navigation = [
  { label: 'Overview', path: '/dashboard/superadmin', icon: MdDashboardCustomize, end: true },
  { label: 'Verification', path: '/dashboard/superadmin/verification', icon: FaCheckCircle },
  { label: 'Orphanages', path: '/dashboard/superadmin/orphanages', icon: FaBuilding },
  { label: 'Donations', path: '/dashboard/superadmin/donations', icon: FaDonate },
  { label: 'Users', path: '/dashboard/superadmin/users', icon: FaUsers },
  { label: 'Content', path: '/dashboard/superadmin/content', icon: FaFileAlt },
  { label: 'Analytics', path: '/dashboard/superadmin/analytics', icon: FaChartBar },
  { label: 'Notifications', path: '/dashboard/superadmin/notifications', icon: FaBell },
]

const SuperAdminLayout = () => {
  const { user } = useAuth()
  const location = useLocation()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await superAdminAPI.getDashboardStats()
      setStats(res.data)
    } catch (err) {
      setError('Failed to load dashboard stats')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  const value = { stats, loading, error, refresh: fetchStats }

  return (
    <SuperAdminContext.Provider value={value}>
      <div className="min-h-screen bg-cream-50 text-teal-900 dark:bg-dark-900 dark:text-cream-50 transition-colors duration-300">
        <Navbar />
        <div className="flex min-h-screen pt-16">
          {/* Mobile sidebar toggle */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden fixed bottom-6 right-6 z-50 p-4 rounded-full bg-coral-500 text-white shadow-xl hover:bg-coral-600 transition"
          >
            {sidebarOpen ? <FaTimes className="text-lg" /> : <FaBars className="text-lg" />}
          </button>

          {/* Sidebar overlay for mobile */}
          {sidebarOpen && (
            <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setSidebarOpen(false)} />
          )}

          {/* Sidebar */}
          <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:sticky top-16 z-40 lg:z-auto w-72 flex-col border-r border-cream-200 dark:border-dark-700 bg-white/95 dark:bg-dark-800/95 backdrop-blur-xl h-[calc(100vh-4rem)] overflow-y-auto scrollbar-hide transition-transform duration-300 flex`}>
            <div className="px-6 py-8 border-b border-cream-200 dark:border-dark-700">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-coral-400 to-teal-500 text-white">
                  <FaShieldAlt className="text-lg" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-teal-500 dark:text-cream-300">Super Admin</p>
                  <h1 className="text-xl font-semibold text-teal-900 dark:text-cream-50 font-playfair">Control Center</h1>
                </div>
              </div>
            </div>
            <nav className="flex-1 overflow-y-auto scrollbar-hide px-4 py-6">
              <ul className="space-y-1">
                {navigation.map((item) => {
                  const Icon = item.icon
                  return (
                    <li key={item.path}>
                      <NavLink
                        to={item.path}
                        end={item.end}
                        onClick={() => setSidebarOpen(false)}
                        className={({ isActive }) =>
                          `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                            isActive
                              ? 'bg-gradient-to-r from-coral-400 to-teal-400 text-white shadow-lg shadow-coral-200/60 dark:shadow-coral-900/40'
                              : 'text-teal-700 dark:text-cream-200 hover:bg-cream-50 dark:hover:bg-dark-700/60'
                          }`
                        }
                      >
                        <Icon className="text-lg" />
                        <span>{item.label}</span>
                        {item.label === 'Verification' && stats?.pendingOrphanages > 0 && (
                          <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-coral-500 text-[10px] font-bold text-white">
                            {stats.pendingOrphanages}
                          </span>
                        )}
                      </NavLink>
                    </li>
                  )
                })}
              </ul>
            </nav>
            <div className="px-6 py-6 text-sm text-teal-600 dark:text-cream-300 border-t border-cream-200 dark:border-dark-700">
              <p className="font-semibold text-teal-900 dark:text-cream-50">
                {user?.fullname?.firstname} {user?.fullname?.lastname}
              </p>
              <p className="text-xs uppercase tracking-[0.3em] text-coral-500">Super Admin</p>
            </div>
          </aside>

          {/* Main content */}
          <div className="flex flex-1 flex-col">
            <header className="sticky top-16 z-10 border-b border-cream-200 dark:border-dark-700 bg-white/80 dark:bg-dark-900/80 backdrop-blur-xl">
              <div className="flex flex-col gap-4 px-6 py-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.4em] text-teal-500 dark:text-cream-300">SoulConnect</p>
                  <h2 className="text-2xl font-semibold text-teal-900 dark:text-cream-50 font-playfair">
                    Super Admin Dashboard
                  </h2>
                  <p className="text-sm text-teal-600 dark:text-cream-400 capitalize">
                    {location.pathname.replace('/dashboard/superadmin/', '').replace('/dashboard/superadmin', 'overview').replaceAll('-', ' ')}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={fetchStats}
                    className="inline-flex items-center gap-2 rounded-xl border border-cream-300 dark:border-dark-600 px-4 py-2 text-sm font-medium text-teal-700 dark:text-cream-50 hover:border-coral-400 dark:hover:border-coral-300 hover:bg-cream-50 dark:hover:bg-dark-700"
                  >
                    <FaCircleNotch className={`text-sm ${loading ? 'animate-spin text-coral-500' : 'text-teal-400'}`} />
                    Refresh
                  </button>
                  {stats && (
                    <div className="rounded-xl border border-cream-300 dark:border-dark-600 bg-white dark:bg-dark-800 px-4 py-2 text-right shadow-sm">
                      <p className="text-xs text-teal-500 dark:text-cream-300">Pending Reviews</p>
                      <p className="text-lg font-semibold text-coral-500">{stats.pendingOrphanages}</p>
                    </div>
                  )}
                </div>
              </div>
              {error && (
                <div className="mx-6 mb-4 rounded-xl border border-yellow-500/40 bg-yellow-50 dark:bg-yellow-500/10 px-4 py-3 text-sm text-yellow-800 dark:text-yellow-100">
                  {error}
                </div>
              )}
            </header>

            <main className="flex-1 overflow-y-auto bg-gradient-to-b from-cream-50 via-white to-cream-100 dark:from-dark-900 dark:via-dark-950 dark:to-dark-900">
              <div className="mx-auto max-w-7xl px-6 py-10">
                <OutletErrorBoundary>
                  <Outlet />
                </OutletErrorBoundary>
              </div>
            </main>
          </div>
        </div>
      </div>
    </SuperAdminContext.Provider>
  )
}

class OutletErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  componentDidCatch(error, info) {
    console.error('SuperAdmin page error:', error, info)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="text-center py-16 space-y-4">
          <div className="text-5xl">⚠️</div>
          <h3 className="text-lg font-semibold text-teal-900 dark:text-cream-50">Something went wrong</h3>
          <p className="text-sm text-red-500 dark:text-red-400 max-w-md mx-auto break-words">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 rounded-xl bg-coral-500 text-white text-sm font-medium hover:bg-coral-600 transition"
          >
            Try Again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

export default SuperAdminLayout
