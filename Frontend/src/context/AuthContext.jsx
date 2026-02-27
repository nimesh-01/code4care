import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../services/api'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth(true) // Initial load

    // Handle browser back/forward cache (bfcache) - re-check auth when page is restored
    const handlePageShow = (event) => {
      if (event.persisted) {
        // Page was restored from bfcache, re-validate auth state
        checkAuth(false)
      }
    }

    window.addEventListener('pageshow', handlePageShow)
    return () => window.removeEventListener('pageshow', handlePageShow)
  }, [])

  const checkAuth = async (isInitialLoad = false) => {
    try {
      // Only set loading to true on initial load to prevent flicker on navigation
      if (isInitialLoad) {
        setLoading(true)
      }
      const response = await authAPI.getCurrentUser()
      setUser(response.data.user)
    } catch (error) {
      console.error('Auth check failed:', error)
      setUser(null)
    } finally {
      if (isInitialLoad) {
        setLoading(false)
      }
    }
  }

  const login = async (credentials) => {
    const response = await authAPI.login(credentials)
    const { user: userData, token } = response.data
    if (token) {
      localStorage.setItem('token', token)
    }
    setUser(userData)
    return userData
  }

  const register = async (userData) => {
    // If registering as orphanAdmin, use registerOrphan endpoint
    let response
    if (userData.role === 'orphanAdmin') {
      response = await authAPI.registerOrphan(userData)
      // Don't set user for orphanAdmin - they need admin approval first
      // Return response data including status and message
      return { 
        user: response.data.user, 
        orphanage: response.data.orphanage,
        status: response.data.status,
        message: response.data.message,
        isPending: true
      }
    } else {
      response = await authAPI.register(userData)
      const { user: newUser, token } = response.data
      if (token) {
        localStorage.setItem('token', token)
      }
      setUser(newUser)
      return { user: newUser, isPending: false }
    }
  }

  const logout = async () => {
    try {
      await authAPI.logout()
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      localStorage.removeItem('token')
      setUser(null)
    }
  }

  const forgotPassword = async (email) => {
    const response = await authAPI.forgotPassword(email)
    return response.data
  }

  const resetPassword = async (token, newPassword) => {
    const response = await authAPI.resetPassword(token, newPassword)
    return response.data
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    checkAuth,
    forgotPassword,
    resetPassword
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
