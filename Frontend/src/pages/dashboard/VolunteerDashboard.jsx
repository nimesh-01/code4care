import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  FaHeart, FaHome, FaCalendarCheck, FaMapMarkerAlt, FaComments, FaUser, 
  FaSignOutAlt, FaBars, FaTimes, FaClock, FaUsers, FaTasks, FaStar, FaSun, FaMoon
} from 'react-icons/fa'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'

const VolunteerDashboard = () => {
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
    { icon: <FaCalendarCheck />, label: 'My Schedule' },
    { icon: <FaMapMarkerAlt />, label: 'Find Orphanages' },
    { icon: <FaTasks />, label: 'Tasks' },
    { icon: <FaComments />, label: 'Messages' },
    { icon: <FaUser />, label: 'Profile' },
  ]

  const stats = [
    { label: 'Hours Volunteered', value: '120', icon: <FaClock className="text-teal-500" />, bg: 'bg-teal-50 dark:bg-teal-900/20' },
    { label: 'Orphanages Helped', value: '8', icon: <FaMapMarkerAlt className="text-coral-500" />, bg: 'bg-coral-50 dark:bg-coral-900/20' },
    { label: 'Tasks Completed', value: '45', icon: <FaTasks className="text-teal-400" />, bg: 'bg-teal-50 dark:bg-teal-900/20' },
    { label: 'Rating', value: '4.9', icon: <FaStar className="text-coral-400" />, bg: 'bg-coral-50 dark:bg-coral-900/20' },
  ]

  const upcomingTasks = [
    { title: 'Teaching Session at Hope Orphanage', date: 'Feb 18, 2026', time: '10:00 AM', status: 'upcoming' },
    { title: 'Sports Day at Sunshine Home', date: 'Feb 20, 2026', time: '2:00 PM', status: 'upcoming' },
    { title: 'Art Workshop at Rainbow House', date: 'Feb 22, 2026', time: '11:00 AM', status: 'pending' },
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
          <span className="inline-block mt-2 px-3 py-1 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 text-xs font-medium rounded-full">
            Volunteer
          </span>
        </div>
        <nav className="p-4">
          <ul className="space-y-2">
            {menuItems.map((item, index) => (
              <li key={index}>
                <button
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                    item.active 
                      ? 'bg-teal-500 text-white' 
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
          <h1 className="text-xl font-playfair font-bold text-teal-900 dark:text-cream-50">Welcome, {user?.fullname?.firstname || user?.username || 'Volunteer'}!</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full bg-cream-100 dark:bg-dark-700 text-coral-500 dark:text-coral-400 hover:bg-cream-200 dark:hover:bg-dark-600 transition-all duration-300"
            >
              {isDarkMode ? <FaSun className="w-5 h-5" /> : <FaMoon className="w-5 h-5" />}
            </button>
            <div className="w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center text-white font-bold">
              {user?.fullname?.firstname?.charAt(0) || user?.username?.charAt(0) || 'V'}
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
            {/* Upcoming Tasks */}
            <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm p-6 transition-colors duration-300">
              <h2 className="text-xl font-playfair font-bold text-teal-900 dark:text-cream-50 mb-4">Upcoming Tasks</h2>
              <div className="space-y-4">
                {upcomingTasks.map((task, index) => (
                  <div key={index} className="p-4 border border-cream-200 dark:border-dark-600 rounded-xl hover:border-teal-500 dark:hover:border-teal-400 transition-colors">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-teal-900 dark:text-cream-50">{task.title}</h3>
                        <p className="text-teal-500 dark:text-cream-300 text-sm mt-1">
                          {task.date} • {task.time}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        task.status === 'upcoming' 
                          ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400' 
                          : 'bg-coral-100 dark:bg-coral-900/30 text-coral-700 dark:text-coral-400'
                      }`}>
                        {task.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-4 py-3 border-2 border-teal-500 dark:border-teal-400 text-teal-500 dark:text-teal-400 rounded-xl font-medium hover:bg-teal-500 hover:text-white dark:hover:bg-teal-400 dark:hover:text-dark-900 transition-colors">
                View All Tasks
              </button>
            </div>

            {/* Quick Actions */}
            <div className="space-y-6">
              <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm p-6 transition-colors duration-300">
                <h2 className="text-xl font-playfair font-bold text-teal-900 dark:text-cream-50 mb-4">Quick Actions</h2>
                <div className="space-y-3">
                  <button className="w-full flex items-center gap-3 p-4 bg-teal-500 hover:bg-teal-600 text-white rounded-xl hover:shadow-lg transition-all duration-300">
                    <FaMapMarkerAlt className="text-xl" />
                    <span className="font-medium">Find Nearby Orphanages</span>
                  </button>
                  <button className="w-full flex items-center gap-3 p-4 bg-coral-500 hover:bg-coral-600 text-white rounded-xl hover:shadow-lg transition-all duration-300">
                    <FaCalendarCheck className="text-xl" />
                    <span className="font-medium">Schedule a Visit</span>
                  </button>
                  <button className="w-full flex items-center gap-3 p-4 bg-teal-400 hover:bg-teal-500 text-white rounded-xl hover:shadow-lg transition-all duration-300">
                    <FaTasks className="text-xl" />
                    <span className="font-medium">Browse Available Tasks</span>
                  </button>
                </div>
              </div>

              {/* Impact Summary */}
              <div className="bg-gradient-to-r from-teal-500 to-teal-600 dark:from-teal-600 dark:to-teal-700 rounded-2xl p-6 text-white">
                <h2 className="text-xl font-playfair font-bold mb-4">Your Impact</h2>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>Children helped</span>
                    <span className="font-bold">150+</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Events participated</span>
                    <span className="font-bold">25</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Skills shared</span>
                    <span className="font-bold">Teaching, Sports</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default VolunteerDashboard
