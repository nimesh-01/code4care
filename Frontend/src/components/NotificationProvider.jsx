import { ToastContainer } from 'react-toastify'
import { useTheme } from '../context/ThemeContext'

const toastBaseClasses = 'notification-toast border shadow-2xl rounded-2xl px-5 py-4 flex gap-3 items-start bg-white text-teal-900 border-cream-200 dark:bg-dark-800 dark:text-cream-50 dark:border-dark-600'
const AUTO_CLOSE_MS = 4200

const NotificationCloseButton = ({ closeToast }) => (
  <button
    type="button"
    className="notification-close"
    aria-label="Dismiss notification"
    onClick={(event) => {
      event.stopPropagation()
      closeToast?.()
    }}
  >
    <span aria-hidden="true">×</span>
  </button>
)

const NotificationProvider = () => {
  const { theme } = useTheme()
  const visualTheme = theme === 'dark' ? 'dark' : 'light'

  const themeClass = visualTheme === 'dark' ? 'notification-dark' : 'notification-light'

  return (
    <ToastContainer
      position="top-center"
      className={`notification-container ${themeClass}`}
      theme={visualTheme}
      autoClose={AUTO_CLOSE_MS}
      newestOnTop
      closeOnClick
      pauseOnHover={false}
      pauseOnFocusLoss={false}
      draggable={false}
      limit={4}
      closeButton={(props) => <NotificationCloseButton {...props} />}
      toastClassName={({ defaultClassName }) => `${defaultClassName} ${toastBaseClasses}`}
      bodyClassName={({ defaultClassName }) => `${defaultClassName} notification-body`}
      progressClassName={({ defaultClassName }) => `${defaultClassName} notification-progress`}
      toastStyle={{ '--toast-duration': `${AUTO_CLOSE_MS}ms` }}
      icon={({ type }) => <span className="notification-dot" data-type={type} />}
    />
  )
}

export default NotificationProvider
