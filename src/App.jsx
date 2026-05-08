import { useEffect, useState } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { ToastProvider } from '@/context/ToastContext'
import { initSeed } from '@/services/seed'
import Layout from '@/components/Layout'
import About from '@/pages/About'
import { guestRoutes, authRoutes, adminRoutes } from '@/router'

function RequireAuth({ children }) {
  const { session } = useAuth()
  if (!session) return <Navigate to="/login" replace />
  return children
}

function RequireAdmin({ children }) {
  const { session } = useAuth()
  if (!session) return <Navigate to="/login" replace />
  if (session.role !== 'admin') return <Navigate to="/dashboard" replace />
  return children
}

function GuestOnly({ children }) {
  const { session } = useAuth()
  if (session) return <Navigate to="/dashboard" replace />
  return children
}

function RootRedirect() {
  const { session } = useAuth()
  return <Navigate to={session ? '/dashboard' : '/login'} replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      {guestRoutes.map(({ path, component: C }) => (
        <Route key={path} path={path} element={<GuestOnly><C /></GuestOnly>} />
      ))}
      <Route path="/about" element={<About />} />
      <Route element={<Layout />}>
        {authRoutes.map(({ path, component: C }) => (
          <Route key={path} path={path} element={<RequireAuth><C /></RequireAuth>} />
        ))}
        {adminRoutes.map(({ path, component: C }) => (
          <Route key={path} path={path} element={<RequireAdmin><C /></RequireAdmin>} />
        ))}
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', 'light')
    initSeed().finally(() => setReady(true))
  }, [])

  if (!ready) {
    return (
      <div className="loading-overlay" role="status" aria-label="系統初始化中">
        <div className="text-center">
          <div className="spinner-border text-success mb-3" style={{ width: '3rem', height: '3rem' }} aria-hidden="true"></div>
          <p className="text-secondary">每日飲食記帳系統初始化中...</p>
          <p className="text-secondary small">首次載入需建立示範資料，請稍候</p>
        </div>
      </div>
    )
  }

  return (
    <HashRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </HashRouter>
  )
}
