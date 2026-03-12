import axios from 'axios'

// Base API instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for cookies
})

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Shared 401 error handler
const handle401Error = (error) => {
  if (error.response?.status === 401) {
    localStorage.removeItem('token')
    // Don't redirect for auth checks or listing routes
    const url = error.config?.url || ''
    const isAuthCheck = url.includes('/auth/me')
    // Allow listing routes without redirect, but redirect for individual profiles
    const isListingRoute = url === '/auth/orphanages' || url === '/children' || url.endsWith('/children')
    // Skip redirect for secondary fetches (marked with skipRedirect)
    const skipRedirect = error.config?.skipRedirect
    // Don't redirect for superadmin or dashboard API calls
    const isSuperAdminRoute = url.includes('/superadmin') || window.location.pathname.includes('/dashboard/')
    if (!isAuthCheck && !isListingRoute && !skipRedirect && !isSuperAdminRoute && !window.location.pathname.includes('/login')) {
      // Store message and intended URL for login page
      sessionStorage.setItem('loginRedirectMessage', 'Please login to view this content')
      sessionStorage.setItem('loginRedirectUrl', window.location.pathname)
      // Use replace to prevent back button returning to protected page
      window.location.replace('/login')
    }
  }
  return Promise.reject(error)
}

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  handle401Error
)

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  registerOrphan: (data) => api.post('/auth/registerorphan', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.get('/auth/logout'),
  getCurrentUser: () => api.get('/auth/me'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, newPassword) => api.post('/auth/reset-password', { token, newPassword }),
  getPlatformStats: () => api.get('/auth/platform-stats'),
  updateProfile: (data) => {
    // If data is FormData (for file uploads), use multipart/form-data
    if (data instanceof FormData) {
      return api.put('/auth/users/me', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    }
    return api.put('/auth/users/me', data)
  },
  // Orphanage document upload (multipart/form-data) - requires auth (for approved orphanages)
  uploadOrphanageDocument: (file, field, name) => {
    const formData = new FormData()
    formData.append('document', file)
    formData.append('field', field)
    if (name) formData.append('name', name)
    return api.post('/auth/orphanage/document', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  // Public document upload during registration (no auth required, for pending orphanages)
  uploadOrphanageDocumentPublic: (orphanageId, file, field, name) => {
    const formData = new FormData()
    formData.append('document', file)
    formData.append('field', field)
    if (name) formData.append('name', name)
    return api.post(`/auth/orphanage/${orphanageId}/document`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  uploadAdminIdDocumentPublic: (userId, file) => {
    const formData = new FormData()
    formData.append('document', file)
    return api.post(`/auth/orphan-admin/${userId}/id-document`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  deleteOrphanageDocument: (field, fileId) => api.delete('/auth/orphanage/document', { data: { field, fileId } }),
  getUserById: (id) => api.get(`/auth/user/${id}`),
  getUsersBatch: (ids) => api.post('/auth/users/batch', { ids }),
}

// Orphanages API (from auth service)
export const orphanagesAPI = {
  getAll: (params) => api.get('/auth/orphanages', { params }),
  getById: (id) => api.get(`/auth/orphanage/${id}`),
}

// Children API (Children Service - port 3001)
const childrenApi = axios.create({
  baseURL: import.meta.env.VITE_CHILDREN_API_URL || 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

// Add auth token to children API requests
childrenApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Add 401 interceptor to children API
childrenApi.interceptors.response.use(
  (response) => response,
  handle401Error
)

export const childrenAPI = {
  getPublicCount: () => childrenApi.get('/children/public/count'),
  getAll: (params) => childrenApi.get('/children', { params }),
  getById: (id) => childrenApi.get(`/children/${id}`),
  getByOrphanage: (orphanageId) => childrenApi.get(`/orphanage/${orphanageId}`, { skipRedirect: true }),
  // Admin CRUD operations
  create: (formData) => childrenApi.post('/children', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  update: (id, formData) => childrenApi.put(`/children/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  delete: (id) => childrenApi.delete(`/children/${id}`),
  deleteFile: (childId, fileId) => childrenApi.delete(`/children/${childId}/files/${fileId}`),
}

// Appointments API (Appointment Service - port 3002)
const appointmentApi = axios.create({
  baseURL: import.meta.env.VITE_APPOINTMENT_API_URL || '/api/appointment',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})
appointmentApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error)
)
appointmentApi.interceptors.response.use((response) => response, handle401Error)

export const appointmentAPI = {
  // User/Volunteer
  request: (data) => appointmentApi.post('/request', data),
  cancel: (id) => appointmentApi.delete(`/${id}/cancel`),
  cancelByAdmin: (id, data = {}) => appointmentApi.put(`/${id}/cancel`, data),
  confirm: (id, data = {}) => appointmentApi.post(`/${id}/confirm`, data),
  // Admin
  getAll: () => appointmentApi.get('/all'),
  getByOrphanage: (orphanageId, params = {}) => appointmentApi.get(`/orphanage/${orphanageId}`, { params }),
  approve: (id, data = {}) => appointmentApi.put(`/${id}/approve`, data),
  reject: (id, data = {}) => appointmentApi.put(`/${id}/reject`, data),
  block: (id, data = {}) => appointmentApi.put(`/${id}/block`, data),
  sendReminders: () => appointmentApi.post('/send-reminders'),
}

// Help Request API (Help Service - port 3003)
const helpApi = axios.create({
  baseURL: import.meta.env.VITE_HELP_API_URL || '/api/help',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})
helpApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error)
)
helpApi.interceptors.response.use((response) => response, handle401Error)

export const helpRequestAPI = {
  create: (data) => helpApi.post('/add', data),
  getAll: (params = {}) => helpApi.get('/all', { params }),
  getById: (id) => helpApi.get(`/${id}`),
  // Volunteer actions
  accept: (id, data = {}) => helpApi.put(`/${id}/accept`, data),
  complete: (id) => helpApi.put(`/${id}/complete`),
  getVolunteerRequests: (params = {}) => helpApi.get('/volunteer', { params }),
  addMessage: (id, data) => helpApi.post(`/${id}/messages`, data),
}

// Donation API (Donation Service - port 3006)
const donationApi = axios.create({
  baseURL: import.meta.env.VITE_DONATION_API_URL || 'http://localhost:3006/donation',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})
donationApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error)
)
donationApi.interceptors.response.use((response) => response, handle401Error)

export const donationAPI = {
  getPublicStats: () => donationApi.get('/public/stats'),
  init: (data) => donationApi.post('/init', data),
  verify: (data) => donationApi.post('/verify', data),
  getById: (id) => donationApi.get(`/${id}`),
  getUserDonations: (userId) => donationApi.get(`/user/${userId}`),
  getOrphanageDonations: (orphanageId, params = {}) => donationApi.get(`/orphanage/${orphanageId}`, { params }),
  getOrphanageChartStats: (orphanageId) => donationApi.get(`/orphanage/${orphanageId}/chart-stats`),
  downloadOrphanageReceipts: (orphanageId, params = {}) => donationApi.get(`/orphanage/${orphanageId}/receipts`, {
    params,
    responseType: 'blob',
  }),
  exportOrphanageDonations: (orphanageId, params = {}) => donationApi.get(`/orphanage/${orphanageId}/export`, {
    params,
    responseType: 'blob',
  }),
  generateReceipt: (id) => donationApi.post(`/${id}/receipt`),
  downloadReceipt: (id) => donationApi.get(`/${id}/receipt`, { responseType: 'blob' }),
}

// Chat API (Chat Service - port 3004)
const chatApi = axios.create({
  baseURL: import.meta.env.VITE_CHAT_API_URL || '/api/chat',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})
chatApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error)
)
chatApi.interceptors.response.use((response) => response, handle401Error)

export const chatAPI = {
  getConversations: (params = {}) => chatApi.get('/conversations', { params }),
  getOrCreateConversation: (data) => chatApi.post('/conversation', data),
  getChatHistory: (conversationId, params = {}) => chatApi.get(`/history/${conversationId}`, { params }),
  sendMessage: (data) => chatApi.post('/message', data),
  markAsRead: (conversationId) => chatApi.patch(`/read/${conversationId}`),
  deleteMessage: (messageId) => chatApi.delete(`/message/${messageId}`),
  deleteConversation: (conversationId) => chatApi.delete(`/conversation/${conversationId}`),
  getUnreadCount: () => chatApi.get('/unread'),
}

// Admin Orphanage API (self management)
export const adminOrphanageAPI = {
  get: () => api.get('/auth/orphanage'),
  update: (data) => api.put('/auth/orphanage', data),
  uploadDocument: (file, field, name) => {
    const formData = new FormData()
    formData.append('document', file)
    formData.append('field', field)
    if (name) formData.append('name', name)
    return api.post('/auth/orphanage/document', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  deleteDocument: (field, fileId) => api.delete('/auth/orphanage/document', { data: { field, fileId } }),
}

// Super Admin API
export const superAdminAPI = {
  getDashboardStats: () => api.get('/superadmin/dashboard-stats'),
  // Orphanage management
  getOrphanages: (params = {}) => api.get('/superadmin/orphanages', { params }),
  getOrphanageById: (id) => api.get(`/superadmin/orphanages/${id}`),
  verifyOrphanage: (id, data) => api.put(`/superadmin/orphanages/${id}/verify`, data),
  deleteOrphanage: (id) => api.delete(`/superadmin/orphanages/${id}`),
  // User management
  getUsers: (params = {}) => api.get('/superadmin/users', { params }),
  updateUserStatus: (id, data) => api.put(`/superadmin/users/${id}/status`, data),
}

// Post API (Post Service - port 3007)
const postApi = axios.create({
  baseURL: import.meta.env.VITE_POST_API_URL || 'http://localhost:3007/post',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})
postApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error)
)
postApi.interceptors.response.use((response) => response, handle401Error)

// Event API (Event Service - port 3008)
const eventApi = axios.create({
  baseURL: import.meta.env.VITE_EVENT_API_URL || 'http://localhost:3008/event',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})
eventApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error)
)
eventApi.interceptors.response.use((response) => response, handle401Error)

export const eventAPI = {
  create: (formData) => eventApi.post('/create', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getAll: (params = {}) => eventApi.get('/all', { params }),
  getById: (id) => eventApi.get(`/${id}`),
  join: (id) => eventApi.post(`/${id}/join`),
  leave: (id) => eventApi.delete(`/${id}/leave`),
  update: (id, formData) => eventApi.put(`/${id}/update`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  delete: (id) => eventApi.delete(`/${id}/delete`),
  getParticipants: (id) => eventApi.get(`/${id}/participants`),
  sendReminder: (id, data = {}) => eventApi.post(`/${id}/send-reminder`, data),
}

export const postAPI = {
  create: (formData) => postApi.post('/create', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000, // 2min timeout for large video uploads
  }),
  getByOrphanage: (orphanageId, params = {}) => postApi.get(`/orphanage/${orphanageId}`, { params }),
  like: (id) => postApi.put(`/${id}/like`),
  comment: (id, data) => postApi.post(`/${id}/comment`, data),
  edit: (id, data) => postApi.put(`/${id}/edit`, data),
  delete: (id) => postApi.delete(`/${id}/delete`),
  generateCaption: (imageDescription) => postApi.post('/generate-caption', { imageDescription }),
  getEngagement: (id) => postApi.get(`/${id}/engagement`),
}

// Notification API (Notification Service - port 3005)
const notificationApi = axios.create({
  baseURL: import.meta.env.VITE_NOTIFICATION_API_URL || 'http://localhost:3005/api/notifications',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})
notificationApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error)
)
notificationApi.interceptors.response.use((response) => response, handle401Error)

export const notificationAPI = {
  getAll: (params = {}) => notificationApi.get('/', { params }),
  getUnreadCount: () => notificationApi.get('/unread-count'),
  markAsRead: (id) => notificationApi.put(`/${id}/read`),
  markAllAsRead: () => notificationApi.put('/read-all'),
  delete: (id) => notificationApi.delete(`/${id}`),
  clearRead: () => notificationApi.delete('/clear'),
  send: (data) => notificationApi.post('/send', data),
  sendBulk: (data) => notificationApi.post('/send-bulk', data),
}

export default api
