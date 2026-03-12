import { useState, useEffect } from 'react'
import {
  FaBuilding, FaChild, FaUsers, FaHandsHelping, FaDonate,
  FaCalendarAlt, FaChartLine, FaArrowUp, FaArrowDown,
} from 'react-icons/fa'
import { useSuperAdminContext } from './SuperAdminLayout'
import { superAdminAPI, donationAPI } from '../../../services/api'

const AnalyticCard = ({ title, value, icon: Icon, color, change }) => (
  <div className="rounded-2xl border border-cream-200 dark:border-dark-700 bg-white dark:bg-dark-800 p-6 hover:shadow-md transition">
    <div className="flex items-center justify-between">
      <div className={`p-3 rounded-xl ${color} text-white`}>
        <Icon className="text-lg" />
      </div>
      {change !== undefined && (
        <div className={`flex items-center gap-1 text-xs font-medium ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          {change >= 0 ? <FaArrowUp /> : <FaArrowDown />}
          {Math.abs(change)}%
        </div>
      )}
    </div>
    <p className="mt-4 text-2xl font-bold text-teal-900 dark:text-cream-50">{value}</p>
    <p className="text-xs text-teal-500 dark:text-cream-400 mt-1">{title}</p>
  </div>
)

const BarChart = ({ data, label }) => {
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div className="rounded-2xl border border-cream-200 dark:border-dark-700 bg-white dark:bg-dark-800 p-6">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-teal-500 dark:text-cream-300 mb-4">{label}</h3>
      <div className="flex items-end gap-2 h-48">
        {data.map((item, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full flex items-end justify-center" style={{ height: '160px' }}>
              <div
                className="w-full max-w-[40px] rounded-t-lg bg-gradient-to-t from-coral-500 to-teal-400 transition-all duration-500"
                style={{ height: `${Math.max(8, (item.value / max) * 100)}%` }}
              />
            </div>
            <p className="text-[10px] text-teal-500 dark:text-cream-400 text-center">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

const DistributionChart = ({ data, title }) => {
  const total = data.reduce((acc, d) => acc + d.value, 0)
  const colors = ['bg-coral-500', 'bg-teal-500', 'bg-blue-500', 'bg-purple-500', 'bg-yellow-500', 'bg-green-500']

  return (
    <div className="rounded-2xl border border-cream-200 dark:border-dark-700 bg-white dark:bg-dark-800 p-6">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-teal-500 dark:text-cream-300 mb-4">{title}</h3>
      {/* Bar */}
      <div className="h-4 rounded-full overflow-hidden flex bg-cream-100 dark:bg-dark-700 mb-4">
        {data.map((item, i) => (
          <div
            key={i}
            className={`${colors[i % colors.length]} transition-all duration-500`}
            style={{ width: `${total > 0 ? (item.value / total) * 100 : 0}%` }}
          />
        ))}
      </div>
      {/* Legend */}
      <div className="grid grid-cols-2 gap-2">
        {data.map((item, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <div className={`w-3 h-3 rounded-full ${colors[i % colors.length]}`} />
            <span className="text-teal-700 dark:text-cream-200 truncate">{item.label}</span>
            <span className="ml-auto font-medium text-teal-900 dark:text-cream-50">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const SAPlatformAnalytics = () => {
  const { stats } = useSuperAdminContext()

  if (!stats) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-coral-500" />
      </div>
    )
  }

  const analyticsCards = [
    { title: 'Total Orphanages', value: stats.totalOrphanages, icon: FaBuilding, color: 'bg-teal-500' },
    { title: 'Pending Verification', value: stats.pendingOrphanages, icon: FaCalendarAlt, color: 'bg-yellow-500' },
    { title: 'Approved Orphanages', value: stats.approvedOrphanages, icon: FaBuilding, color: 'bg-green-500' },
    { title: 'Total Users', value: stats.totalUsers, icon: FaUsers, color: 'bg-blue-500' },
    { title: 'Active Volunteers', value: stats.totalVolunteers, icon: FaHandsHelping, color: 'bg-purple-500' },
    { title: 'Orphanage Admins', value: stats.totalAdmins, icon: FaUsers, color: 'bg-coral-500' },
    { title: 'Blocked Users', value: stats.blockedUsers, icon: FaUsers, color: 'bg-red-500' },
    { title: 'Rejected Orphanages', value: stats.rejectedOrphanages, icon: FaBuilding, color: 'bg-gray-500' },
  ]

  const orphanageDistribution = [
    { label: 'Pending', value: stats.pendingOrphanages },
    { label: 'Approved', value: stats.approvedOrphanages },
    { label: 'Rejected', value: stats.rejectedOrphanages },
    { label: 'Blocked', value: stats.blockedOrphanages },
  ]

  const userDistribution = [
    { label: 'Regular Users', value: stats.totalUsers },
    { label: 'Volunteers', value: stats.totalVolunteers },
    { label: 'Orphanage Admins', value: stats.totalAdmins },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-teal-900 dark:text-cream-50 font-playfair">Platform Analytics</h2>
        <p className="text-sm text-teal-600 dark:text-cream-400">Comprehensive platform performance insights</p>
      </div>

      {/* Key Metrics */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {analyticsCards.map((card) => (
          <AnalyticCard key={card.title} {...card} />
        ))}
      </section>

      {/* Distribution Charts */}
      <section className="grid gap-6 lg:grid-cols-2">
        <DistributionChart data={orphanageDistribution} title="Orphanage Status Distribution" />
        <DistributionChart data={userDistribution} title="User Role Distribution" />
      </section>

      {/* Platform Health */}
      <section className="rounded-2xl border border-cream-200 dark:border-dark-700 bg-white dark:bg-dark-800 p-6">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-teal-500 dark:text-cream-300 mb-4">Platform Health</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-green-50 dark:bg-green-500/10 border border-green-100 dark:border-green-500/20 p-4 text-center">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {stats.totalOrphanages > 0 ? Math.round((stats.approvedOrphanages / stats.totalOrphanages) * 100) : 0}%
            </p>
            <p className="text-xs text-green-600/70 dark:text-green-400/70 mt-1">Approval Rate</p>
          </div>
          <div className="rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 p-4 text-center">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {stats.totalUsers + stats.totalVolunteers}
            </p>
            <p className="text-xs text-blue-600/70 dark:text-blue-400/70 mt-1">Total Community Members</p>
          </div>
          <div className="rounded-xl bg-coral-50 dark:bg-coral-500/10 border border-coral-100 dark:border-coral-500/20 p-4 text-center">
            <p className="text-2xl font-bold text-coral-600 dark:text-coral-400">
              {stats.blockedUsers}
            </p>
            <p className="text-xs text-coral-600/70 dark:text-coral-400/70 mt-1">Policy Violations</p>
          </div>
        </div>
      </section>
    </div>
  )
}

export default SAPlatformAnalytics
