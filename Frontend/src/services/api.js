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

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      // Don't redirect if already on login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
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

export const childrenAPI = {
  getAll: (params) => childrenApi.get('/children', { params }),
  getById: (id) => childrenApi.get(`/children/${id}`),
  getByOrphanage: (orphanageId) => childrenApi.get(`/orphanage/${orphanageId}`),
}

export default api
