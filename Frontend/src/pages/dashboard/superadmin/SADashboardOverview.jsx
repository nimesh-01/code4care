import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  FaBuilding, FaUsers, FaHandsHelping, FaCheckCircle, FaBan,
  FaClock, FaChild, FaDonate, FaCalendarAlt, FaArrowRight,
} from 'react-icons/fa'
import { MdPendingActions } from 'react-icons/md'
import { useSuperAdminContext } from './SuperAdminLayout'
import { superAdminAPI, donationAPI, childrenAPI } from '../../../services/api'

const StatCard = ({ title, value, subtitle, icon: Icon, gradient, link }) => (
  <Link
    to={link || '#'}
    className="group relative overflow-hidden rounded-2xl border border-cream-200 dark:border-dark-700 bg-white dark:bg-dark-800 p-6 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-teal-500 dark:text-cream-300">{title}</p>
        <p className="mt-2 text-3xl font-bold text-teal-900 dark:text-cream-50">{value}</p>
        <p className="mt-1 text-sm text-teal-600 dark:text-cream-400">{subtitle}</p>
      </div>
      <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient} text-white`}>
        <Icon className="text-xl" />
      </div>
    </div>
    <div className={`mt-4 h-1 rounded-full bg-gradient-to-r ${gradient} opacity-60`} />
  </Link>
)

const QuickAction = ({ title, description, icon: Icon, link, color }) => (
  <Link
    to={link}
    className="flex items-center gap-4 rounded-xl border border-cream-200 dark:border-dark-700 bg-white dark:bg-dark-800 p-4 hover:shadow-md transition-all duration-200 group"
  >
    <div className={`p-3 rounded-xl ${color} text-white`}>
      <Icon className="text-lg" />
    </div>
    <div className="flex-1">
      <p className="font-medium text-teal-900 dark:text-cream-50">{title}</p>
      <p className="text-xs text-teal-500 dark:text-cream-400">{description}</p>
    </div>
    <FaArrowRight className="text-teal-400 dark:text-cream-400 group-hover:translate-x-1 transition-transform" />
  </Link>
)

const RecentOrphanage = ({ orphanage }) => {
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-300',
    approved: 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300',
    blocked: 'bg-gray-100 text-gray-800 dark:bg-gray-500/20 dark:text-gray-300',
  }

  return (
    <div className="flex items-center justify-between py-3 border-b border-cream-100 dark:border-dark-700 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-teal-900 dark:text-cream-50 truncate">{orphanage.name}</p>
        <p className="text-xs text-teal-500 dark:text-cream-400">
          {orphanage.address?.city}, {orphanage.address?.state}
        </p>
      </div>
      <span className={`ml-3 px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[orphanage.status]}`}>
        {orphanage.status}
      </span>
    </div>
  )
}

const SADashboardOverview = () => {
  const { stats, loading } = useSuperAdminContext()
  const [recentOrphanages, setRecentOrphanages] = useState([])

  useEffect(() => {
    superAdminAPI.getOrphanages({ limit: 5 }).then(res => {
      setRecentOrphanages(res.data.orphanages || [])
    }).catch(() => {})
  }, [])

  if (loading || !stats) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-coral-500 mb-4" />
        <p className="text-lg font-medium text-teal-700 dark:text-cream-200">Loading dashboard...</p>
      </div>
    )
  }

  const statCards = [
    { title: 'Total Orphanages', value: stats.totalOrphanages, subtitle: 'Registered on platform', icon: FaBuilding, gradient: 'from-teal-400 to-teal-600', link: '/dashboard/superadmin/orphanages' },
    { title: 'Pending Reviews', value: stats.pendingOrphanages, subtitle: 'Await verification', icon: MdPendingActions, gradient: 'from-yellow-400 to-orange-500', link: '/dashboard/superadmin/verification' },
    { title: 'Approved', value: stats.approvedOrphanages, subtitle: 'Active orphanages', icon: FaCheckCircle, gradient: 'from-green-400 to-emerald-600', link: '/dashboard/superadmin/orphanages' },
    { title: 'Total Users', value: stats.totalUsers, subtitle: 'Registered users', icon: FaUsers, gradient: 'from-blue-400 to-indigo-600', link: '/dashboard/superadmin/users' },
    { title: 'Volunteers', value: stats.totalVolunteers, subtitle: 'Active volunteers', icon: FaHandsHelping, gradient: 'from-purple-400 to-violet-600', link: '/dashboard/superadmin/users' },
    { title: 'Blocked Users', value: stats.blockedUsers, subtitle: 'Policy violations', icon: FaBan, gradient: 'from-red-400 to-rose-600', link: '/dashboard/superadmin/users' },
  ]

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="rounded-2xl bg-gradient-to-r from-coral-400 via-coral-500 to-teal-500 p-8 text-white shadow-lg">
        <h2 className="text-2xl font-bold font-playfair">Welcome to Command Center</h2>
        <p className="mt-2 text-white/80 max-w-2xl">
          Oversee all platform operations. Verify orphanages, manage users, monitor donations, and ensure platform integrity.
        </p>
        {stats.pendingOrphanages > 0 && (
          <Link
            to="/dashboard/superadmin/verification"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white/20 backdrop-blur-sm px-4 py-2 text-sm font-medium hover:bg-white/30 transition"
          >
            <FaClock /> {stats.pendingOrphanages} pending verification{stats.pendingOrphanages > 1 ? 's' : ''}
            <FaArrowRight className="text-xs" />
          </Link>
        )}
      </div>

      {/* Stats Grid */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {statCards.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </section>

      {/* Quick Actions + Recent Orphanages */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quick Actions */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-teal-900 dark:text-cream-50 font-playfair">Quick Actions</h3>
          <div className="space-y-3">
            <QuickAction
              title="Review Pending Orphanages"
              description={`${stats.pendingOrphanages} orphanage(s) awaiting verification`}
              icon={FaCheckCircle}
              link="/dashboard/superadmin/verification"
              color="bg-yellow-500"
            />
            <QuickAction
              title="Monitor Donations"
              description="Track donation activity across the platform"
              icon={FaDonate}
              link="/dashboard/superadmin/donations"
              color="bg-green-500"
            />
            <QuickAction
              title="Manage Users"
              description="View and manage user accounts"
              icon={FaUsers}
              link="/dashboard/superadmin/users"
              color="bg-blue-500"
            />
            <QuickAction
              title="View Analytics"
              description="Platform performance insights"
              icon={FaCalendarAlt}
              link="/dashboard/superadmin/analytics"
              color="bg-purple-500"
            />
          </div>
        </div>

        {/* Recent Orphanages */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-teal-900 dark:text-cream-50 font-playfair">Recent Registrations</h3>
            <Link
              to="/dashboard/superadmin/orphanages"
              className="text-sm text-coral-500 hover:text-coral-600 font-medium flex items-center gap-1"
            >
              View all <FaArrowRight className="text-xs" />
            </Link>
          </div>
          <div className="rounded-2xl border border-cream-200 dark:border-dark-700 bg-white dark:bg-dark-800 p-5">
            {recentOrphanages.length > 0 ? (
              recentOrphanages.map((org) => (
                <RecentOrphanage key={org._id} orphanage={org} />
              ))
            ) : (
              <p className="text-sm text-teal-500 dark:text-cream-400 text-center py-6">No registrations yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SADashboardOverview
