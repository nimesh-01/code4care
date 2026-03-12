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
import Appointments from './pages/Appointments'
import Events from './pages/Events'
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
import VolunteerProfile from './pages/dashboard/admin/VolunteerProfile'
import ReportsAnalytics from './pages/dashboard/admin/ReportsAnalytics'
import SettingsPanel from './pages/dashboard/admin/SettingsPanel'
import NotificationsPanel from './pages/dashboard/admin/NotificationsPanel'
import VolunteerHelpDesk from './pages/dashboard/volunteer/VolunteerHelpDesk'
import Chat from './pages/Chat'
import Notifications from './pages/Notifications'
import ParticipantProfile from './pages/dashboard/admin/ParticipantProfile'
import CreatePost from './pages/posts/CreatePost'
import OrphanagePosts from './pages/posts/OrphanagePosts'
import Contact from './pages/Contact'
import Privacy from './pages/Privacy'

// Super Admin pages
import SuperAdminLayout from './pages/dashboard/superadmin/SuperAdminLayout'
import SADashboardOverview from './pages/dashboard/superadmin/SADashboardOverview'
import SAOrphanageVerification from './pages/dashboard/superadmin/SAOrphanageVerification'
import SAOrphanageManagement from './pages/dashboard/superadmin/SAOrphanageManagement'
import SAOrphanageDetail from './pages/dashboard/superadmin/SAOrphanageDetail'
import SADonationMonitoring from './pages/dashboard/superadmin/SADonationMonitoring'
import SAUserManagement from './pages/dashboard/superadmin/SAUserManagement'
import SAContentModeration from './pages/dashboard/superadmin/SAContentModeration'
import SAPlatformAnalytics from './pages/dashboard/superadmin/SAPlatformAnalytics'
import SANotifications from './pages/dashboard/superadmin/SANotifications'

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

const ProfileAccessGate = () => {
  const { user } = useAuth()
  if (user?.role === 'orphanAdmin') {
    return <Navigate to="/dashboard/admin/settings" replace />
  }
  if (user?.role === 'superAdmin') {
    return <Navigate to="/dashboard/superadmin" replace />
  }
  return <Profile />
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
        <Route path="/orphanage/:orphanageId/posts" element={<OrphanagePosts />} />
        <Route path="/events" element={<Events />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route
          path="/posts/create"
          element={
            <ProtectedRoute allowedRoles={['orphanAdmin']}>
              <CreatePost />
            </ProtectedRoute>
          }
        />
        <Route
          path="/appointments"
          element={
            <ProtectedRoute allowedRoles={['user', 'volunteer']}>
              <Appointments />
            </ProtectedRoute>
          }
        />

        {/* Profile Page (Protected) */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute allowedRoles={['user', 'volunteer', 'orphanAdmin', 'superAdmin']}>
              <ProfileAccessGate />
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
          <Route path="volunteers/:odaUserId" element={<VolunteerProfile />} />
          <Route path="reports" element={<ReportsAnalytics />} />
          <Route path="settings" element={<SettingsPanel />} />
          <Route path="notifications" element={<NotificationsPanel />} />
        </Route>

        <Route
          path="/participants/:userId"
          element={
            <ProtectedRoute allowedRoles={['orphanAdmin']}>
              <ParticipantProfile />
            </ProtectedRoute>
          }
        />

        {/* Chat */}
        <Route
          path="/chat"
          element={
            <ProtectedRoute allowedRoles={['user', 'volunteer', 'orphanAdmin']}>
              <Chat />
            </ProtectedRoute>
          }
        />

        {/* Notifications */}
        <Route
          path="/notifications"
          element={
            <ProtectedRoute allowedRoles={['user', 'volunteer', 'orphanAdmin', 'superAdmin']}>
              <Notifications />
            </ProtectedRoute>
          }
        />

        {/* Volunteer help desk */}
        <Route
          path="/dashboard/volunteer"
          element={
            <ProtectedRoute allowedRoles={['volunteer']}>
              <VolunteerHelpDesk />
            </ProtectedRoute>
          }
        />

        {/* Super Admin Dashboard */}
        <Route
          path="/dashboard/superadmin"
          element={
            <ProtectedRoute allowedRoles={['superAdmin']}>
              <SuperAdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<SADashboardOverview />} />
          <Route path="verification" element={<SAOrphanageVerification />} />
          <Route path="orphanages" element={<SAOrphanageManagement />} />
          <Route path="orphanages/:id" element={<SAOrphanageDetail />} />
          <Route path="donations" element={<SADonationMonitoring />} />
          <Route path="users" element={<SAUserManagement />} />
          <Route path="content" element={<SAContentModeration />} />
          <Route path="analytics" element={<SAPlatformAnalytics />} />
          <Route path="notifications" element={<SANotifications />} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default App
