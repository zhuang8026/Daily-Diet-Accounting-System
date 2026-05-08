import { useEffect, useState } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { initSeed } from './services/seed'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import About from './pages/About'
import Dashboard from './pages/Dashboard'
import FoodSearch from './pages/FoodSearch'
import Report from './pages/Report'
import Settings from './pages/Settings'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminFoods from './pages/admin/AdminFoods'
import AdminRecords from './pages/admin/AdminRecords'
import AdminUsers from './pages/admin/AdminUsers'
import AdminAnnouncements from './pages/admin/AdminAnnouncements'

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
      <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
      <Route path="/register" element={<GuestOnly><Register /></GuestOnly>} />
      <Route path="/about" element={<About />} />
      <Route element={<Layout />}>
        <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
        <Route path="/food-search" element={<RequireAuth><FoodSearch /></RequireAuth>} />
        <Route path="/report" element={<RequireAuth><Report /></RequireAuth>} />
        <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />
        <Route path="/admin" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
        <Route path="/admin/foods" element={<RequireAdmin><AdminFoods /></RequireAdmin>} />
        <Route path="/admin/records" element={<RequireAdmin><AdminRecords /></RequireAdmin>} />
        <Route path="/admin/users" element={<RequireAdmin><AdminUsers /></RequireAdmin>} />
        <Route path="/admin/announcements" element={<RequireAdmin><AdminAnnouncements /></RequireAdmin>} />
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
