import { createContext, useContext, useState, useCallback } from 'react'

const ToastContext = createContext(null)

const ICON_MAP = { success: 'bi-check-circle-fill', danger: 'bi-x-circle-fill', warning: 'bi-exclamation-triangle-fill', info: 'bi-info-circle-fill' }
const BG_MAP = { success: 'text-bg-success', danger: 'text-bg-danger', warning: 'text-bg-warning', info: 'text-bg-info' }

function ToastItem({ toast, onRemove }) {
  return (
    <div
      className={`toast show align-items-center ${BG_MAP[toast.type] || 'text-bg-success'} border-0 mb-2`}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      data-testid={`toast-${toast.type}`}
    >
      <div className="d-flex">
        <div className="toast-body d-flex align-items-center gap-2">
          <i className={`bi ${ICON_MAP[toast.type] || ICON_MAP.success}`}></i>
          <span>{toast.message}</span>
        </div>
        <button
          type="button"
          className="btn-close btn-close-white me-2 m-auto ms-auto"
          aria-label="關閉通知"
          onClick={() => onRemove(toast.id)}
        />
      </div>
    </div>
  )
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000)
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        className="toast-container position-fixed top-0 end-0 p-3"
        style={{ zIndex: 1200 }}
        aria-live="polite"
        aria-atomic="true"
      >
        {toasts.map(t => <ToastItem key={t.id} toast={t} onRemove={removeToast} />)}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
