import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  FaHeart, FaHome, FaBuilding, FaUsers, FaUserShield, FaChartBar,
  FaSignOutAlt, FaBars, FaTimes, FaCog, FaBell, FaCheckCircle, FaTimesCircle,
  FaShieldAlt, FaGlobe, FaSun, FaMoon
} from 'react-icons/fa'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'

const SuperAdminDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, logout } = useAuth()
  const { isDarkMode, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const menuItems = [
    { icon: <FaHome />, label: 'Dashboard', active: true },
    { icon: <FaBuilding />, label: 'Orphanages' },
    { icon: <FaUsers />, label: 'Users' },
    { icon: <FaUserShield />, label: 'Admins' },
    { icon: <FaChartBar />, label: 'Analytics' },
    { icon: <FaShieldAlt />, label: 'Verifications' },
    { icon: <FaCog />, label: 'Settings' },
  ]

  const stats = [
    { label: 'Total Orphanages', value: '156', icon: <FaBuilding className="text-coral-500" />, bg: 'bg-coral-50 dark:bg-coral-900/20' },
    { label: 'Total Users', value: '12,450', icon: <FaUsers className="text-teal-500" />, bg: 'bg-teal-50 dark:bg-teal-900/20' },
    { label: 'Total Volunteers', value: '2,340', icon: <FaUserShield className="text-coral-400" />, bg: 'bg-coral-50 dark:bg-coral-900/20' },
    { label: 'Pending Verifications', value: '23', icon: <FaCheckCircle className="text-teal-400" />, bg: 'bg-teal-50 dark:bg-teal-900/20' },
  ]

  const pendingOrphanages = [
    { name: 'New Hope Foundation', location: 'Mumbai', date: 'Feb 17, 2026', status: 'pending' },
    { name: 'Little Stars Home', location: 'Delhi', date: 'Feb 16, 2026', status: 'pending' },
    { name: 'Care Foundation', location: 'Bangalore', date: 'Feb 15, 2026', status: 'pending' },
  ]

  const recentActivity = [
    { action: 'Approved', target: 'Sunshine Orphanage', admin: 'System', time: '2 hours ago', type: 'success' },
    { action: 'Rejected', target: 'Unknown Foundation', admin: 'System', time: '5 hours ago', type: 'danger' },
    { action: 'User Registered', target: 'john@example.com', admin: 'System', time: '1 day ago', type: 'info' },
    { action: 'Donation Received', target: '₹50,000', admin: 'Hope Orphanage', time: '1 day ago', type: 'success' },
  ]

  return (
    <div className="min-h-screen bg-cream-100 dark:bg-dark-900 flex transition-colors duration-300">
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-teal-900 dark:bg-dark-950 shadow-xl transform transition-all duration-300
        lg:relative lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 border-b border-teal-800 dark:border-dark-800">
          <Link to="/" className="flex items-center gap-2 text-xl font-playfair font-bold text-white">
            <FaHeart className="text-coral-400" />
            SoulConnect
          </Link>
          <div className="mt-3 flex items-center gap-2">
            <FaShieldAlt className="text-coral-400" />
            <span className="text-sm text-cream-200/70">Super Admin</span>
          </div>
        </div>
        <nav className="p-4">
          <ul className="space-y-2">
            {menuItems.map((item, index) => (
              <li key={index}>
                <button
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                    item.active 
                      ? 'bg-coral-500 text-white' 
                      : 'text-cream-200/70 hover:bg-teal-800 dark:hover:bg-dark-800 hover:text-white'
                  }`}
                >
                  {item.icon}
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-teal-800 dark:border-dark-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-coral-400 hover:bg-coral-900/30 transition-colors"
          >
            <FaSignOutAlt />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 min-h-screen">
        {/* Top Bar */}
        <header className="bg-white dark:bg-dark-800 shadow-sm px-6 py-4 flex items-center justify-between transition-colors duration-300">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden text-teal-700 dark:text-cream-100 text-xl"
          >
            {sidebarOpen ? <FaTimes /> : <FaBars />}
          </button>
          <div className="flex items-center gap-2">
            <FaGlobe className="text-coral-500" />
            <h1 className="text-xl font-playfair font-bold text-teal-900 dark:text-cream-50">Super Admin Control Panel</h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full bg-cream-100 dark:bg-dark-700 text-coral-500 dark:text-coral-400 hover:bg-cream-200 dark:hover:bg-dark-600 transition-all duration-300"
            >
              {isDarkMode ? <FaSun className="w-5 h-5" /> : <FaMoon className="w-5 h-5" />}
            </button>
            <button className="relative p-2 text-teal-500 dark:text-cream-300 hover:text-coral-500">
              <FaBell className="text-xl" />
              <span className="absolute top-0 right-0 w-5 h-5 bg-coral-500 text-white text-xs rounded-full flex items-center justify-center">
                5
              </span>
            </button>
            <div className="w-10 h-10 rounded-full bg-coral-500 flex items-center justify-center text-white font-bold">
              SA
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <div key={index} className={`${stat.bg} rounded-2xl p-6 shadow-sm transition-colors duration-300`}>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-3xl">{stat.icon}</span>
                </div>
                <h3 className="text-2xl font-bold text-teal-900 dark:text-cream-50">{stat.value}</h3>
                <p className="text-teal-600 dark:text-cream-200">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pending Orphanage Verifications */}
            <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm p-6 transition-colors duration-300">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-playfair font-bold text-teal-900 dark:text-cream-50">Pending Verifications</h2>
                <span className="bg-coral-100 dark:bg-coral-900/30 text-coral-600 dark:text-coral-400 px-3 py-1 rounded-full text-sm font-medium">
                  {pendingOrphanages.length} pending
                </span>
              </div>
              <div className="space-y-4">
                {pendingOrphanages.map((orphanage, index) => (
                  <div key={index} className="p-4 border border-cream-200 dark:border-dark-600 rounded-xl">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-teal-900 dark:text-cream-50">{orphanage.name}</h3>
                        <p className="text-teal-500 dark:text-cream-300 text-sm">{orphanage.location} • {orphanage.date}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="flex-1 flex items-center justify-center gap-2 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg transition-colors">
                        <FaCheckCircle />
                        <span>Approve</span>
                      </button>
                      <button className="flex-1 flex items-center justify-center gap-2 py-2 bg-coral-500 hover:bg-coral-600 text-white rounded-lg transition-colors">
                        <FaTimesCircle />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-4 py-3 border-2 border-teal-500 dark:border-teal-400 text-teal-600 dark:text-teal-400 rounded-xl font-medium hover:bg-teal-500 hover:text-white dark:hover:bg-teal-400 dark:hover:text-dark-900 transition-colors">
                View All Pending
              </button>
            </div>

            {/* Recent Activity */}
            <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm p-6 transition-colors duration-300">
              <h2 className="text-xl font-playfair font-bold text-teal-900 dark:text-cream-50 mb-4">Recent Activity</h2>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start gap-4 p-4 bg-cream-50 dark:bg-dark-700 rounded-xl transition-colors duration-300">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      activity.type === 'success' ? 'bg-teal-100 dark:bg-teal-900/30' :
                      activity.type === 'danger' ? 'bg-coral-100 dark:bg-coral-900/30' : 'bg-teal-100 dark:bg-teal-900/30'
                    }`}>
                      {activity.type === 'success' ? <FaCheckCircle className="text-teal-500" /> :
                       activity.type === 'danger' ? <FaTimesCircle className="text-coral-500" /> :
                       <FaUsers className="text-teal-500" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-teal-900 dark:text-cream-50">
                        <span className="font-medium">{activity.action}:</span> {activity.target}
                      </p>
                      <p className="text-teal-500 dark:text-cream-300 text-sm">{activity.time}</p>
                      <p className="text-gray-500 text-sm">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Platform Overview */}
          <div className="mt-6 bg-gradient-to-r from-teal-800 to-teal-900 dark:from-dark-800 dark:to-dark-950 rounded-2xl p-6 text-white transition-colors duration-300">
            <h2 className="text-xl font-playfair font-bold mb-6">Platform Overview</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-coral-400">₹2.5Cr</p>
                <p className="text-cream-200/70 text-sm mt-1">Total Donations</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-teal-400">5,420</p>
                <p className="text-cream-200/70 text-sm mt-1">Children Helped</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-coral-300">156</p>
                <p className="text-cream-200/70 text-sm mt-1">Active Orphanages</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-teal-300">98%</p>
                <p className="text-cream-200/70 text-sm mt-1">Satisfaction Rate</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default SuperAdminDashboard
