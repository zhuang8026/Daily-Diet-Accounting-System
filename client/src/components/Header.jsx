import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

export default function Header({ session }) {
  const { logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  if (!session) return null

  return (
    <div className="header-inner d-flex align-items-center justify-content-between px-3">
      <div className="d-flex align-items-center gap-2">
        <a href="#/dashboard" className="header-brand text-white text-decoration-none fw-bold">
          <i className="bi bi-clipboard2-heart-fill me-2"></i>
          <span className="d-none d-sm-inline">飲食與熱量紀錄系統</span>
          <span className="d-sm-none">飲食記帳</span>
        </a>
      </div>
      <div className="d-flex align-items-center gap-3">
        {session.role === 'admin' && <span className="badge text-bg-warning">Administrator</span>}
        {session.role === 'user' && <span className="badge text-bg-info">User</span>}
        <button className="btn btn-sm btn-outline-light" onClick={handleLogout} aria-label="登出">
          <i className="bi bi-box-arrow-right me-1"></i>
          <span className="d-none d-sm-inline">登出</span>
        </button>
      </div>
    </div>
  )
}
