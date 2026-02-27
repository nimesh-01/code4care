import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

// Pages
import Home from './pages/Home'
import About from './pages/About'
import Children from './pages/Children'
import Orphanages from './pages/Orphanages'
import Profile from './pages/Profile'
import ChildProfile from './pages/ChildProfile'
import OrphanageProfile from './pages/OrphanageProfile'
import OrphanageChildren from './pages/OrphanageChildren'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ForgotPassword from './pages/auth/ForgotPassword'
import AdminLayout from './pages/dashboard/admin/AdminLayout'
import DashboardOverview from './pages/dashboard/admin/DashboardOverview'
import ChildrenManagement from './pages/dashboard/admin/ChildrenManagement'
import DonationsManagement from './pages/dashboard/admin/DonationsManagement'
import AppointmentsManagement from './pages/dashboard/admin/AppointmentsManagement'
import HelpRequestsManagement from './pages/dashboard/admin/HelpRequestsManagement'
import EventsManagement from './pages/dashboard/admin/EventsManagement'
import PostsUpdates from './pages/dashboard/admin/PostsUpdates'
import VolunteersManagement from './pages/dashboard/admin/VolunteersManagement'
import ReportsAnalytics from './pages/dashboard/admin/ReportsAnalytics'
import SettingsPanel from './pages/dashboard/admin/SettingsPanel'
import NotificationsPanel from './pages/dashboard/admin/NotificationsPanel'

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-bg">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-white"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />
  }

  return children
}

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/children" element={<Children />} />
        <Route path="/orphanages" element={<Orphanages />} />
        <Route path="/orphanages/:id" element={<OrphanageProfile />} />
        <Route path="/orphanages/:id/children" element={<OrphanageChildren />} />
        <Route path="/children/:id" element={<ChildProfile />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Profile Page (Protected) */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute allowedRoles={['user', 'volunteer', 'orphanAdmin', 'superAdmin']}>
              <Profile />
            </ProtectedRoute>
          }
        />

        {/* Orphanage admin dashboard */}
        <Route
          path="/dashboard/admin"
          element={
            <ProtectedRoute allowedRoles={['orphanAdmin']}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardOverview />} />
          <Route path="children" element={<ChildrenManagement />} />
          <Route path="donations" element={<DonationsManagement />} />
          <Route path="appointments" element={<AppointmentsManagement />} />
          <Route path="help-requests" element={<HelpRequestsManagement />} />
          <Route path="events" element={<EventsManagement />} />
          <Route path="posts" element={<PostsUpdates />} />
          <Route path="volunteers" element={<VolunteersManagement />} />
          <Route path="reports" element={<ReportsAnalytics />} />
          <Route path="settings" element={<SettingsPanel />} />
          <Route path="notifications" element={<NotificationsPanel />} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default App
