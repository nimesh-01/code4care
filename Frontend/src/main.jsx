import React, { useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { BrowserRouter, useLocation } from 'react-router-dom'
import 'react-toastify/dist/ReactToastify.css'
import { AuthProvider } from './context/AuthContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import NotificationProvider from './components/NotificationProvider.jsx'
import { NotificationProvider as NotificationDataProvider } from './context/NotificationContext.jsx'
import { ConfirmProvider } from './context/ConfirmContext.jsx'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <ScrollToTop />
        <AuthProvider>
          <NotificationDataProvider>
            <ConfirmProvider>
              <App />
              <NotificationProvider />
            </ConfirmProvider>
          </NotificationDataProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>,
)
