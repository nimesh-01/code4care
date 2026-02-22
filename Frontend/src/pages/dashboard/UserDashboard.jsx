import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  FaHeart, FaHome, FaChild, FaDonate, FaComments, FaUser, 
  FaSignOutAlt, FaBars, FaTimes, FaCalendarAlt, FaHandHoldingHeart, FaSun, FaMoon
} from 'react-icons/fa'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'

const UserDashboard = () => {
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
    { icon: <FaChild />, label: 'Sponsor a Child' },
    { icon: <FaDonate />, label: 'My Donations' },
    { icon: <FaCalendarAlt />, label: 'Appointments' },
    { icon: <FaComments />, label: 'Messages' },
    { icon: <FaUser />, label: 'Profile' },
  ]

  const stats = [
    { label: 'Total Donated', value: '₹25,000', icon: <FaDonate className="text-coral-500" />, bg: 'bg-coral-50 dark:bg-coral-900/20' },
    { label: 'Children Sponsored', value: '2', icon: <FaChild className="text-teal-500" />, bg: 'bg-teal-50 dark:bg-teal-900/20' },
    { label: 'Appointments', value: '5', icon: <FaCalendarAlt className="text-coral-400" />, bg: 'bg-coral-50 dark:bg-coral-900/20' },
    { label: 'Messages', value: '12', icon: <FaComments className="text-teal-400" />, bg: 'bg-teal-50 dark:bg-teal-900/20' },
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
          <h1 className="text-xl font-playfair font-bold text-teal-900 dark:text-cream-50">Welcome, {user?.fullname?.firstname || user?.username || 'User'}!</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full bg-cream-100 dark:bg-dark-700 text-coral-500 dark:text-coral-400 hover:bg-cream-200 dark:hover:bg-dark-600 transition-all duration-300"
            >
              {isDarkMode ? <FaSun className="w-5 h-5" /> : <FaMoon className="w-5 h-5" />}
            </button>
            <div className="w-10 h-10 rounded-full bg-coral-500 flex items-center justify-center text-white font-bold">
              {user?.fullname?.firstname?.charAt(0) || user?.username?.charAt(0) || 'U'}
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

          {/* Quick Actions */}
          <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm p-6 mb-8 transition-colors duration-300">
            <h2 className="text-xl font-playfair font-bold text-teal-900 dark:text-cream-50 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button className="flex items-center gap-3 p-4 bg-coral-500 hover:bg-coral-600 text-white rounded-xl hover:shadow-lg transition-all duration-300">
                <FaChild className="text-2xl" />
                <span className="font-medium">Sponsor a Child</span>
              </button>
              <button className="flex items-center gap-3 p-4 bg-teal-500 hover:bg-teal-600 text-white rounded-xl hover:shadow-lg transition-all duration-300">
                <FaDonate className="text-2xl" />
                <span className="font-medium">Make a Donation</span>
              </button>
              <button className="flex items-center gap-3 p-4 bg-coral-400 hover:bg-coral-500 text-white rounded-xl hover:shadow-lg transition-all duration-300">
                <FaCalendarAlt className="text-2xl" />
                <span className="font-medium">Book Appointment</span>
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm p-6 transition-colors duration-300">
            <h2 className="text-xl font-playfair font-bold text-teal-900 dark:text-cream-50 mb-4">Recent Activity</h2>
            <div className="space-y-4">
              {[
                { icon: <FaDonate className="text-teal-500" />, text: 'Donated ₹5,000 to Hope Orphanage', time: '2 hours ago' },
                { icon: <FaCalendarAlt className="text-coral-500" />, text: 'Scheduled visit to Sunshine Home', time: '1 day ago' },
                { icon: <FaHandHoldingHeart className="text-coral-400" />, text: 'Started sponsoring Rahul', time: '3 days ago' },
              ].map((activity, index) => (
                <div key={index} className="flex items-center gap-4 p-4 bg-cream-50 dark:bg-dark-700 rounded-xl transition-colors duration-300">
                  <div className="text-xl">{activity.icon}</div>
                  <div className="flex-1">
                    <p className="text-teal-900 dark:text-cream-50 font-medium">{activity.text}</p>
                    <p className="text-teal-500 dark:text-cream-300 text-sm">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default UserDashboard
