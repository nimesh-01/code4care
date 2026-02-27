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
    if (!isAuthCheck && !isListingRoute && !skipRedirect && !window.location.pathname.includes('/login')) {
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
  deleteOrphanageDocument: (field, fileId) => api.delete('/auth/orphanage/document', { data: { field, fileId } }),
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
  // Admin
  getAll: () => appointmentApi.get('/all'),
  getByOrphanage: (orphanageId, params = {}) => appointmentApi.get(`/orphanage/${orphanageId}`, { params }),
  approve: (id) => appointmentApi.put(`/${id}/approve`),
  reject: (id) => appointmentApi.put(`/${id}/reject`),
}

// Help Request API (Help Service - port 3003)
const helpApi = axios.create({
  baseURL: import.meta.env.VITE_HELP_API_URL || 'http://localhost:3003/help',
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
  getAll: () => helpApi.get('/all'),
  getById: (id) => helpApi.get(`/${id}`),
  // Volunteer actions
  accept: (id) => helpApi.put(`/${id}/accept`),
  complete: (id) => helpApi.put(`/${id}/complete`),
  getVolunteerRequests: () => helpApi.get('/volunteer'),
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
  init: (data) => donationApi.post('/init', data),
  verify: (data) => donationApi.post('/verify', data),
  getById: (id) => donationApi.get(`/${id}`),
  getUserDonations: (userId) => donationApi.get(`/user/${userId}`),
  getOrphanageDonations: (orphanageId, params = {}) => donationApi.get(`/orphanage/${orphanageId}`, { params }),
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

export default api
