import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  FaHeart, FaHome, FaChild, FaUserFriends, FaDonate, FaCalendarAlt,
  FaSignOutAlt, FaBars, FaTimes, FaBuilding, FaChartLine, FaBell, FaCog, FaSun, FaMoon
} from 'react-icons/fa'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'

const AdminDashboard = () => {
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
    { icon: <FaChild />, label: 'Children' },
    { icon: <FaUserFriends />, label: 'Volunteers' },
    { icon: <FaDonate />, label: 'Donations' },
    { icon: <FaCalendarAlt />, label: 'Appointments' },
    { icon: <FaChartLine />, label: 'Reports' },
    { icon: <FaCog />, label: 'Settings' },
  ]

  const stats = [
    { label: 'Total Children', value: '48', icon: <FaChild className="text-teal-500" />, bg: 'bg-teal-50 dark:bg-teal-900/20', change: '+3' },
    { label: 'Active Volunteers', value: '12', icon: <FaUserFriends className="text-coral-500" />, bg: 'bg-coral-50 dark:bg-coral-900/20', change: '+2' },
    { label: 'This Month Donations', value: '₹1,25,000', icon: <FaDonate className="text-teal-400" />, bg: 'bg-teal-50 dark:bg-teal-900/20', change: '+15%' },
    { label: 'Pending Appointments', value: '8', icon: <FaCalendarAlt className="text-coral-400" />, bg: 'bg-coral-50 dark:bg-coral-900/20', change: '' },
  ]

  const recentChildren = [
    { name: 'Rahul Kumar', age: 8, status: 'Sponsored', sponsor: 'John Doe' },
    { name: 'Priya Singh', age: 6, status: 'Available', sponsor: null },
    { name: 'Amit Sharma', age: 10, status: 'Sponsored', sponsor: 'Jane Smith' },
    { name: 'Sneha Patel', age: 7, status: 'Available', sponsor: null },
  ]

  const recentDonations = [
    { donor: 'Anonymous', amount: '₹10,000', date: 'Feb 17, 2026', type: 'General' },
    { donor: 'Rajesh Kumar', amount: '₹25,000', date: 'Feb 16, 2026', type: 'Education' },
    { donor: 'Priya Verma', amount: '₹5,000', date: 'Feb 15, 2026', type: 'Food' },
  ]

  return (
    <div className="min-h-screen bg-cream-100 dark:bg-dark-900 flex transition-colors duration-300">
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-dark-800 shadow-xl transform transition-all duration-300
        lg:relative lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 border-b border-cream-200 dark:border-dark-700">
          <Link to="/" className="flex items-center gap-2 text-xl font-playfair font-bold text-coral-500">
            <FaHeart className="text-coral-500" />
            SoulConnect
          </Link>
          <div className="mt-3 flex items-center gap-2">
            <FaBuilding className="text-coral-500" />
            <span className="text-sm text-teal-600 dark:text-cream-200 truncate">Hope Orphanage</span>
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
                      : 'text-teal-700 dark:text-cream-200 hover:bg-cream-100 dark:hover:bg-dark-700'
                  }`}
                >
                  {item.icon}
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-cream-200 dark:border-dark-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-coral-500 hover:bg-coral-50 dark:hover:bg-coral-900/20 transition-colors"
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
          <h1 className="text-xl font-playfair font-bold text-teal-900 dark:text-cream-50">Admin Dashboard</h1>
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
                3
              </span>
            </button>
            <div className="w-10 h-10 rounded-full bg-coral-500 flex items-center justify-center text-white font-bold">
              {user?.fullname?.firstname?.charAt(0) || user?.username?.charAt(0) || 'A'}
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
                  {stat.change && (
                    <span className="text-teal-600 dark:text-teal-400 text-sm font-medium">{stat.change}</span>
                  )}
                </div>
                <h3 className="text-2xl font-bold text-teal-900 dark:text-cream-50">{stat.value}</h3>
                <p className="text-teal-600 dark:text-cream-200">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Children List */}
            <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm p-6 transition-colors duration-300">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-playfair font-bold text-teal-900 dark:text-cream-50">Children</h2>
                <button className="text-coral-500 hover:text-coral-600 dark:text-coral-400 dark:hover:text-coral-300 font-medium text-sm">
                  View All
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-teal-500 dark:text-cream-300 text-sm border-b border-cream-200 dark:border-dark-600">
                      <th className="pb-3">Name</th>
                      <th className="pb-3">Age</th>
                      <th className="pb-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentChildren.map((child, index) => (
                      <tr key={index} className="border-b border-cream-100 dark:border-dark-700 last:border-b-0">
                        <td className="py-3 font-medium text-teal-900 dark:text-cream-50">{child.name}</td>
                        <td className="py-3 text-teal-600 dark:text-cream-200">{child.age} yrs</td>
                        <td className="py-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            child.status === 'Sponsored' 
                              ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400' 
                              : 'bg-coral-100 dark:bg-coral-900/30 text-coral-700 dark:text-coral-400'
                          }`}>
                            {child.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button className="w-full mt-4 py-3 bg-coral-500 hover:bg-coral-600 text-white rounded-xl font-medium hover:shadow-lg transition-all duration-300">
                + Add New Child
              </button>
            </div>

            {/* Recent Donations */}
            <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm p-6 transition-colors duration-300">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-playfair font-bold text-teal-900 dark:text-cream-50">Recent Donations</h2>
                <button className="text-coral-500 hover:text-coral-600 dark:text-coral-400 dark:hover:text-coral-300 font-medium text-sm">
                  View All
                </button>
              </div>
              <div className="space-y-4">
                {recentDonations.map((donation, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-cream-50 dark:bg-dark-700 rounded-xl transition-colors duration-300">
                    <div>
                      <p className="font-medium text-teal-900 dark:text-cream-50">{donation.donor}</p>
                      <p className="text-teal-500 dark:text-cream-300 text-sm">{donation.date} • {donation.type}</p>
                    </div>
                    <span className="font-bold text-teal-600 dark:text-teal-400">{donation.amount}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-6 bg-white dark:bg-dark-800 rounded-2xl shadow-sm p-6 transition-colors duration-300">
            <h2 className="text-xl font-playfair font-bold text-teal-900 dark:text-cream-50 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <button className="flex flex-col items-center gap-2 p-4 border-2 border-dashed border-cream-300 dark:border-dark-600 rounded-xl hover:border-coral-500 dark:hover:border-coral-400 hover:bg-coral-50 dark:hover:bg-coral-900/20 transition-colors">
                <FaChild className="text-2xl text-coral-500" />
                <span className="font-medium text-teal-700 dark:text-cream-200">Add Child</span>
              </button>
              <button className="flex flex-col items-center gap-2 p-4 border-2 border-dashed border-cream-300 dark:border-dark-600 rounded-xl hover:border-teal-500 dark:hover:border-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors">
                <FaUserFriends className="text-2xl text-teal-500" />
                <span className="font-medium text-teal-700 dark:text-cream-200">Manage Volunteers</span>
              </button>
              <button className="flex flex-col items-center gap-2 p-4 border-2 border-dashed border-cream-300 dark:border-dark-600 rounded-xl hover:border-coral-400 dark:hover:border-coral-400 hover:bg-coral-50 dark:hover:bg-coral-900/20 transition-colors">
                <FaCalendarAlt className="text-2xl text-coral-400" />
                <span className="font-medium text-teal-700 dark:text-cream-200">Appointments</span>
              </button>
              <button className="flex flex-col items-center gap-2 p-4 border-2 border-dashed border-cream-300 dark:border-dark-600 rounded-xl hover:border-teal-400 dark:hover:border-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors">
                <FaChartLine className="text-2xl text-teal-400" />
                <span className="font-medium text-teal-700 dark:text-cream-200">View Reports</span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default AdminDashboard
