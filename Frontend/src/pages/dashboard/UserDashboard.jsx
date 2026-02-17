import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  FaHeart, FaHome, FaChild, FaDonate, FaComments, FaUser, 
  FaSignOutAlt, FaBars, FaTimes, FaCalendarAlt, FaHandHoldingHeart
} from 'react-icons/fa'
import { useAuth } from '../../context/AuthContext'

const UserDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, logout } = useAuth()
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
    { label: 'Total Donated', value: '₹25,000', icon: <FaDonate className="text-green-500" />, bg: 'bg-green-50' },
    { label: 'Children Sponsored', value: '2', icon: <FaChild className="text-blue-500" />, bg: 'bg-blue-50' },
    { label: 'Appointments', value: '5', icon: <FaCalendarAlt className="text-purple-500" />, bg: 'bg-purple-50' },
    { label: 'Messages', value: '12', icon: <FaComments className="text-pink-500" />, bg: 'bg-pink-50' },
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
        </div>
        <nav className="p-4">
          <ul className="space-y-2">
            {menuItems.map((item, index) => (
              <li key={index}>
                <button
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    item.active 
                      ? 'bg-gradient-to-r from-soul-purple to-soul-pink text-white' 
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
          <h1 className="text-xl font-bold text-gray-800">Welcome, {user?.name || 'User'}!</h1>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-soul-purple to-soul-pink flex items-center justify-center text-white font-bold">
              {user?.name?.charAt(0) || 'U'}
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

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button className="flex items-center gap-3 p-4 bg-gradient-to-r from-soul-purple to-soul-pink text-white rounded-xl hover:shadow-lg transition-shadow">
                <FaChild className="text-2xl" />
                <span className="font-medium">Sponsor a Child</span>
              </button>
              <button className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:shadow-lg transition-shadow">
                <FaDonate className="text-2xl" />
                <span className="font-medium">Make a Donation</span>
              </button>
              <button className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:shadow-lg transition-shadow">
                <FaCalendarAlt className="text-2xl" />
                <span className="font-medium">Book Appointment</span>
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Activity</h2>
            <div className="space-y-4">
              {[
                { icon: <FaDonate className="text-green-500" />, text: 'Donated ₹5,000 to Hope Orphanage', time: '2 hours ago' },
                { icon: <FaCalendarAlt className="text-blue-500" />, text: 'Scheduled visit to Sunshine Home', time: '1 day ago' },
                { icon: <FaHandHoldingHeart className="text-pink-500" />, text: 'Started sponsoring Rahul', time: '3 days ago' },
              ].map((activity, index) => (
                <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="text-xl">{activity.icon}</div>
                  <div className="flex-1">
                    <p className="text-gray-800 font-medium">{activity.text}</p>
                    <p className="text-gray-500 text-sm">{activity.time}</p>
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
