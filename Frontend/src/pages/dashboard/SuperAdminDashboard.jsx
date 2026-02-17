import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  FaHeart, FaHome, FaBuilding, FaUsers, FaUserShield, FaChartBar,
  FaSignOutAlt, FaBars, FaTimes, FaCog, FaBell, FaCheckCircle, FaTimesCircle,
  FaShieldAlt, FaGlobe
} from 'react-icons/fa'
import { useAuth } from '../../context/AuthContext'

const SuperAdminDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, logout } = useAuth()
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
    { label: 'Total Orphanages', value: '156', icon: <FaBuilding className="text-purple-500" />, bg: 'bg-purple-50' },
    { label: 'Total Users', value: '12,450', icon: <FaUsers className="text-blue-500" />, bg: 'bg-blue-50' },
    { label: 'Total Volunteers', value: '2,340', icon: <FaUserShield className="text-green-500" />, bg: 'bg-green-50' },
    { label: 'Pending Verifications', value: '23', icon: <FaCheckCircle className="text-orange-500" />, bg: 'bg-orange-50' },
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
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 shadow-xl transform transition-transform duration-300
        lg:relative lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 border-b border-gray-700">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold text-white">
            <FaHeart className="text-soul-pink" />
            SoulConnect
          </Link>
          <div className="mt-3 flex items-center gap-2">
            <FaShieldAlt className="text-yellow-500" />
            <span className="text-sm text-gray-400">Super Admin</span>
          </div>
        </div>
        <nav className="p-4">
          <ul className="space-y-2">
            {menuItems.map((item, index) => (
              <li key={index}>
                <button
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    item.active 
                      ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white' 
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  {item.icon}
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-900/30 transition-colors"
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
        <header className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden text-gray-600 text-xl"
          >
            {sidebarOpen ? <FaTimes /> : <FaBars />}
          </button>
          <div className="flex items-center gap-2">
            <FaGlobe className="text-soul-purple" />
            <h1 className="text-xl font-bold text-gray-800">Super Admin Control Panel</h1>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-gray-500 hover:text-soul-purple">
              <FaBell className="text-xl" />
              <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                5
              </span>
            </button>
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-center text-white font-bold">
              SA
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <div key={index} className={`${stat.bg} rounded-2xl p-6 shadow-sm`}>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-3xl">{stat.icon}</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-800">{stat.value}</h3>
                <p className="text-gray-600">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pending Orphanage Verifications */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800">Pending Verifications</h2>
                <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-sm font-medium">
                  {pendingOrphanages.length} pending
                </span>
              </div>
              <div className="space-y-4">
                {pendingOrphanages.map((orphanage, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-xl">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-800">{orphanage.name}</h3>
                        <p className="text-gray-500 text-sm">{orphanage.location} • {orphanage.date}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="flex-1 flex items-center justify-center gap-2 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
                        <FaCheckCircle />
                        <span>Approve</span>
                      </button>
                      <button className="flex-1 flex items-center justify-center gap-2 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
                        <FaTimesCircle />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-4 py-3 border-2 border-gray-300 text-gray-600 rounded-xl font-medium hover:border-soul-purple hover:text-soul-purple transition-colors">
                View All Pending
              </button>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Activity</h2>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      activity.type === 'success' ? 'bg-green-100' :
                      activity.type === 'danger' ? 'bg-red-100' : 'bg-blue-100'
                    }`}>
                      {activity.type === 'success' ? <FaCheckCircle className="text-green-500" /> :
                       activity.type === 'danger' ? <FaTimesCircle className="text-red-500" /> :
                       <FaUsers className="text-blue-500" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-800">
                        <span className="font-medium">{activity.action}:</span> {activity.target}
                      </p>
                      <p className="text-gray-500 text-sm">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Platform Overview */}
          <div className="mt-6 bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-6 text-white">
            <h2 className="text-xl font-bold mb-6">Platform Overview</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-yellow-400">₹2.5Cr</p>
                <p className="text-gray-400 text-sm mt-1">Total Donations</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-green-400">5,420</p>
                <p className="text-gray-400 text-sm mt-1">Children Helped</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-400">156</p>
                <p className="text-gray-400 text-sm mt-1">Active Orphanages</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-purple-400">98%</p>
                <p className="text-gray-400 text-sm mt-1">Satisfaction Rate</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default SuperAdminDashboard
