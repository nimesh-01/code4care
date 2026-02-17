import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  FaHeart, FaHome, FaCalendarCheck, FaMapMarkerAlt, FaComments, FaUser, 
  FaSignOutAlt, FaBars, FaTimes, FaClock, FaUsers, FaTasks, FaStar
} from 'react-icons/fa'
import { useAuth } from '../../context/AuthContext'

const VolunteerDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, logout } = useAuth()
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
    { label: 'Hours Volunteered', value: '120', icon: <FaClock className="text-blue-500" />, bg: 'bg-blue-50' },
    { label: 'Orphanages Helped', value: '8', icon: <FaMapMarkerAlt className="text-green-500" />, bg: 'bg-green-50' },
    { label: 'Tasks Completed', value: '45', icon: <FaTasks className="text-purple-500" />, bg: 'bg-purple-50' },
    { label: 'Rating', value: '4.9', icon: <FaStar className="text-yellow-500" />, bg: 'bg-yellow-50' },
  ]

  const upcomingTasks = [
    { title: 'Teaching Session at Hope Orphanage', date: 'Feb 18, 2026', time: '10:00 AM', status: 'upcoming' },
    { title: 'Sports Day at Sunshine Home', date: 'Feb 20, 2026', time: '2:00 PM', status: 'upcoming' },
    { title: 'Art Workshop at Rainbow House', date: 'Feb 22, 2026', time: '11:00 AM', status: 'pending' },
  ]

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300
        lg:relative lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 border-b">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold text-soul-purple">
            <FaHeart className="text-soul-pink" />
            SoulConnect
          </Link>
          <span className="inline-block mt-2 px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
            Volunteer
          </span>
        </div>
        <nav className="p-4">
          <ul className="space-y-2">
            {menuItems.map((item, index) => (
              <li key={index}>
                <button
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    item.active 
                      ? 'bg-gradient-to-r from-green-500 to-green-600 text-white' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {item.icon}
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
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
          <h1 className="text-xl font-bold text-gray-800">Welcome, {user?.name || 'Volunteer'}!</h1>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center text-white font-bold">
              {user?.name?.charAt(0) || 'V'}
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
            {/* Upcoming Tasks */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Upcoming Tasks</h2>
              <div className="space-y-4">
                {upcomingTasks.map((task, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-xl hover:border-green-500 transition-colors">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-800">{task.title}</h3>
                        <p className="text-gray-500 text-sm mt-1">
                          {task.date} • {task.time}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        task.status === 'upcoming' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {task.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-4 py-3 border-2 border-green-500 text-green-500 rounded-xl font-medium hover:bg-green-500 hover:text-white transition-colors">
                View All Tasks
              </button>
            </div>

            {/* Quick Actions */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h2>
                <div className="space-y-3">
                  <button className="w-full flex items-center gap-3 p-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:shadow-lg transition-shadow">
                    <FaMapMarkerAlt className="text-xl" />
                    <span className="font-medium">Find Nearby Orphanages</span>
                  </button>
                  <button className="w-full flex items-center gap-3 p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:shadow-lg transition-shadow">
                    <FaCalendarCheck className="text-xl" />
                    <span className="font-medium">Schedule a Visit</span>
                  </button>
                  <button className="w-full flex items-center gap-3 p-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:shadow-lg transition-shadow">
                    <FaTasks className="text-xl" />
                    <span className="font-medium">Browse Available Tasks</span>
                  </button>
                </div>
              </div>

              {/* Impact Summary */}
              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-6 text-white">
                <h2 className="text-xl font-bold mb-4">Your Impact</h2>
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
