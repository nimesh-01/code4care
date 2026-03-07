import { createContext, useContext, useState, useCallback } from 'react'

const ConfirmContext = createContext(null)

const defaultDialog = {
  open: false,
  title: '',
  message: '',
  confirmLabel: 'Confirm',
  cancelLabel: 'Cancel',
  tone: 'neutral',
  resolve: null,
}

export const ConfirmProvider = ({ children }) => {
  const [dialog, setDialog] = useState(defaultDialog)

  const confirm = useCallback((options = {}) => {
    return new Promise((resolve) => {
      setDialog({
        open: true,
        resolve,
        title: options.title || 'Are you sure?',
        message: options.message || '',
        confirmLabel: options.confirmLabel || 'Confirm',
        cancelLabel: options.cancelLabel || 'Cancel',
        tone: options.tone || 'neutral',
      })
    })
  }, [])

  const closeDialog = useCallback((result) => {
    setDialog((current) => {
      current.resolve?.(result)
      return defaultDialog
    })
  }, [])

  const toneClasses = {
    neutral: 'bg-teal-600 hover:bg-teal-500 text-white',
    danger: 'bg-rose-600 hover:bg-rose-500 text-white',
    warning: 'bg-amber-500 hover:bg-amber-400 text-dark-900',
  }

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {dialog.open && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 px-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-sm rounded-3xl border border-cream-200 bg-white p-6 shadow-2xl dark:border-dark-700 dark:bg-dark-900">
            <h3 className="text-lg font-semibold text-teal-900 dark:text-cream-50">{dialog.title}</h3>
            {dialog.message && (
              <p className="mt-2 text-sm text-teal-600 dark:text-cream-300">{dialog.message}</p>
            )}
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                className="flex-1 rounded-2xl border border-cream-300 px-4 py-2 text-sm font-semibold text-teal-700 hover:border-teal-400 dark:border-dark-700 dark:text-cream-200"
                onClick={() => closeDialog(false)}
              >
                {dialog.cancelLabel}
              </button>
              <button
                type="button"
                className={`flex-1 rounded-2xl px-4 py-2 text-sm font-semibold transition ${toneClasses[dialog.tone] || toneClasses.neutral}`}
                onClick={() => closeDialog(true)}
              >
                {dialog.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}

export const useConfirm = () => {
  const context = useContext(ConfirmContext)
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider')
  }
  return context.confirm
}
