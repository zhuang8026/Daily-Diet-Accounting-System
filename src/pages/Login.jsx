import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login } from '../services/auth'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

export default function Login() {
  const { refresh } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [alertMsg, setAlertMsg] = useState('')
  const [alertLocked, setAlertLocked] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const handleSubmit = async (e) => {
    e.preventDefault()
    setAlertMsg('')
    setErrors({})

    const errs = {}
    if (!email.trim()) errs.email = 'Email 為必填欄位'
    if (!password) errs.password = '密碼為必填欄位'
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    try {
      const result = await login(email, password)
      if (result.success) {
        refresh()
        showToast('登入成功，歡迎回來！', 'success')
        navigate('/dashboard')
      } else {
        setAlertMsg(result.message)
        setAlertLocked(!!result.locked)
      }
    } catch {
      setAlertMsg('登入時發生錯誤，請重新整理後再試')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page d-flex align-items-center justify-content-center min-vh-100 py-4">
      <div className="auth-card card shadow-sm w-100" style={{ maxWidth: 420 }}>
        <div className="card-body p-4 p-md-5">
          <div className="text-center mb-4">
            <div className="auth-logo-icon mx-auto mb-3">
              <i className="bi bi-clipboard2-heart-fill text-white" style={{ fontSize: '2rem' }}></i>
            </div>
            <h1 className="h4 fw-500">每日飲食記帳</h1>
            <p className="text-secondary small">記錄每一餐，成就更好的自己 🌱</p>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-3">
              <label htmlFor="login-email" className="form-label">電子郵件</label>
              <input
                type="email" id="login-email" className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                placeholder="請輸入 Email" autoComplete="email"
                value={email} onChange={e => setEmail(e.target.value)}
                data-testid="login-email"
              />
              {errors.email && <div className="invalid-feedback">{errors.email}</div>}
            </div>

            <div className="mb-3">
              <label htmlFor="login-password" className="form-label">密碼</label>
              <div className="input-group">
                <input
                  type={showPwd ? 'text' : 'password'} id="login-password"
                  className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                  placeholder="請輸入密碼" autoComplete="current-password"
                  value={password} onChange={e => setPassword(e.target.value)}
                  data-testid="login-password"
                />
                <button type="button" className="btn btn-outline-secondary" onClick={() => setShowPwd(v => !v)} aria-label="顯示或隱藏密碼">
                  <i className={`bi ${showPwd ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                </button>
                {errors.password && <div className="invalid-feedback">{errors.password}</div>}
              </div>
            </div>

            {alertMsg && (
              <div className={`alert ${alertLocked ? 'alert-warning' : 'alert-danger'} mb-3`} role="alert" aria-live="assertive">
                {alertMsg}
              </div>
            )}

            <button type="submit" className="btn btn-success w-100 mt-2" disabled={loading} data-testid="login-submit">
              {loading && <span className="spinner-border spinner-border-sm me-2" role="status"></span>}
              登入
            </button>
          </form>

          <hr className="my-4" />
          <p className="text-center text-secondary small mb-2">
            還沒有帳號？<Link to="/register" className="text-success">立即註冊</Link>
          </p>
          <p className="text-center text-secondary small">
            <Link to="/about" className="text-secondary">關於本系統</Link>
          </p>

          <div className="mt-4 p-3 rounded small text-secondary" style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)' }}>
            <div className="fw-500 text-success mb-1">🔑 Demo 帳號</div>
            一般使用者：demo@demo.com / Demo@123<br />
            管理員：admin@demo.com / Admin@123
          </div>
        </div>
      </div>
    </div>
  )
}
