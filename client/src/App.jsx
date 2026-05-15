import { useEffect } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { ToastProvider } from '@/context/ToastContext'
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
  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', 'light')
  }, [])

  return (
    <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </HashRouter>
  )
}
