import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  FaHeart, FaHome, FaChild, FaUserFriends, FaDonate, FaCalendarAlt,
  FaSignOutAlt, FaBars, FaTimes, FaBuilding, FaChartLine, FaBell, FaCog
} from 'react-icons/fa'
import { useAuth } from '../../context/AuthContext'

const AdminDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, logout } = useAuth()
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
    { label: 'Total Children', value: '48', icon: <FaChild className="text-blue-500" />, bg: 'bg-blue-50', change: '+3' },
    { label: 'Active Volunteers', value: '12', icon: <FaUserFriends className="text-green-500" />, bg: 'bg-green-50', change: '+2' },
    { label: 'This Month Donations', value: '₹1,25,000', icon: <FaDonate className="text-purple-500" />, bg: 'bg-purple-50', change: '+15%' },
    { label: 'Pending Appointments', value: '8', icon: <FaCalendarAlt className="text-orange-500" />, bg: 'bg-orange-50', change: '' },
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
          <div className="mt-3 flex items-center gap-2">
            <FaBuilding className="text-soul-purple" />
            <span className="text-sm text-gray-600 truncate">Hope Orphanage</span>
          </div>
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
          <h1 className="text-xl font-bold text-gray-800">Admin Dashboard</h1>
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-gray-500 hover:text-soul-purple">
              <FaBell className="text-xl" />
              <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                3
              </span>
            </button>
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-soul-purple to-soul-pink flex items-center justify-center text-white font-bold">
              {user?.name?.charAt(0) || 'A'}
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
                  {stat.change && (
                    <span className="text-green-600 text-sm font-medium">{stat.change}</span>
                  )}
                </div>
                <h3 className="text-2xl font-bold text-gray-800">{stat.value}</h3>
                <p className="text-gray-600">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Children List */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800">Children</h2>
                <button className="text-soul-purple hover:text-soul-pink font-medium text-sm">
                  View All
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-gray-500 text-sm border-b">
                      <th className="pb-3">Name</th>
                      <th className="pb-3">Age</th>
                      <th className="pb-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentChildren.map((child, index) => (
                      <tr key={index} className="border-b last:border-b-0">
                        <td className="py-3 font-medium text-gray-800">{child.name}</td>
                        <td className="py-3 text-gray-600">{child.age} yrs</td>
                        <td className="py-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            child.status === 'Sponsored' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {child.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button className="w-full mt-4 py-3 bg-gradient-to-r from-soul-purple to-soul-pink text-white rounded-xl font-medium hover:shadow-lg transition-shadow">
                + Add New Child
              </button>
            </div>

            {/* Recent Donations */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800">Recent Donations</h2>
                <button className="text-soul-purple hover:text-soul-pink font-medium text-sm">
                  View All
                </button>
              </div>
              <div className="space-y-4">
                {recentDonations.map((donation, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                      <p className="font-medium text-gray-800">{donation.donor}</p>
                      <p className="text-gray-500 text-sm">{donation.date} • {donation.type}</p>
                    </div>
                    <span className="font-bold text-green-600">{donation.amount}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-6 bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <button className="flex flex-col items-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-soul-purple hover:bg-purple-50 transition-colors">
                <FaChild className="text-2xl text-soul-purple" />
                <span className="font-medium text-gray-700">Add Child</span>
              </button>
              <button className="flex flex-col items-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-green-500 hover:bg-green-50 transition-colors">
                <FaUserFriends className="text-2xl text-green-500" />
                <span className="font-medium text-gray-700">Manage Volunteers</span>
              </button>
              <button className="flex flex-col items-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-colors">
                <FaCalendarAlt className="text-2xl text-blue-500" />
                <span className="font-medium text-gray-700">Appointments</span>
              </button>
              <button className="flex flex-col items-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-orange-500 hover:bg-orange-50 transition-colors">
                <FaChartLine className="text-2xl text-orange-500" />
                <span className="font-medium text-gray-700">View Reports</span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default AdminDashboard
