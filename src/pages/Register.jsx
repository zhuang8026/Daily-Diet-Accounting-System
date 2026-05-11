import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register } from '@/assets/api/auth'
import { validateEmail, validatePassword } from '@/assets/api/utils'
import { useToast } from '@/context/ToastContext'

const STRENGTH_LABEL = ['弱', '弱', '尚可', '強', '非常強']
const STRENGTH_COLOR = ['danger', 'danger', 'warning', 'success', 'success']

export default function Register() {
  const { showToast } = useToast()
  const navigate = useNavigate()

  const [form, setForm] = useState({ displayName: '', email: '', password: '', confirm: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [errors, setErrors] = useState({})
  const [alertMsg, setAlertMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [pwdStrength, setPwdStrength] = useState(null)

  const set = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }))
    if (field === 'password') {
      const { typeCount } = validatePassword(e.target.value)
      setPwdStrength(e.target.value.length > 0 ? typeCount : null)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setAlertMsg('')
    const errs = {}

    if (!form.displayName.trim()) errs.displayName = '請輸入暱稱'
    if (!validateEmail(form.email.trim())) errs.email = 'Email 格式不正確'
    const { isValid } = validatePassword(form.password)
    if (!isValid) errs.password = '密碼強度不足，需至少 6 字元且包含 3 種字元類型'
    if (form.password !== form.confirm) errs.confirm = '兩次輸入的密碼不一致'
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    setErrors({})
    try {
      const result = await register(form.email.trim(), form.password, form.displayName.trim())
      if (result.success) {
        showToast('註冊成功，請登入', 'success')
        navigate('/login')
      } else {
        setAlertMsg(result.message)
      }
    } catch {
      setAlertMsg('系統錯誤，請稍後再試')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page d-flex align-items-center justify-content-center min-vh-100 py-4">
      <div className="auth-card card shadow-sm w-100" style={{ maxWidth: 440 }}>
        <div className="card-body p-4 p-md-5">
          <div className="text-center mb-4">
            <i className="bi bi-person-plus-fill text-success" style={{ fontSize: '2.5rem' }}></i>
            <h1 className="h4 mt-2 fw-500">建立帳號</h1>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-3">
              <label htmlFor="reg-name" className="form-label">暱稱</label>
              <input type="text" id="reg-name" className={`form-control ${errors.displayName ? 'is-invalid' : ''}`}
                placeholder="1–30 個字" maxLength={30} value={form.displayName} onChange={set('displayName')} data-testid="reg-name" />
              {errors.displayName && <div className="invalid-feedback">{errors.displayName}</div>}
            </div>

            <div className="mb-3">
              <label htmlFor="reg-email" className="form-label">電子郵件</label>
              <input type="email" id="reg-email" className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                placeholder="請輸入 Email" autoComplete="email" value={form.email} onChange={set('email')} data-testid="reg-email" />
              {errors.email && <div className="invalid-feedback">{errors.email}</div>}
            </div>

            <div className="mb-3">
              <label htmlFor="reg-password" className="form-label">密碼</label>
              <div className="input-group">
                <input type={showPwd ? 'text' : 'password'} id="reg-password"
                  className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                  placeholder="至少 6 字元" autoComplete="new-password" value={form.password} onChange={set('password')} data-testid="reg-password" />
                <button type="button" className="btn btn-outline-secondary" onClick={() => setShowPwd(v => !v)} aria-label="顯示或隱藏密碼">
                  <i className={`bi ${showPwd ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                </button>
                {errors.password && <div className="invalid-feedback">{errors.password}</div>}
              </div>
              <div className="form-text text-secondary small">需包含大寫、小寫、數字、符號中至少 3 種，且至少 6 字元</div>
              {pwdStrength !== null && (
                <span className={`badge text-bg-${STRENGTH_COLOR[pwdStrength] || 'danger'} mt-1`}>
                  密碼強度：{STRENGTH_LABEL[pwdStrength] || '弱'}
                </span>
              )}
            </div>

            <div className="mb-4">
              <label htmlFor="reg-confirm" className="form-label">確認密碼</label>
              <input type="password" id="reg-confirm" className={`form-control ${errors.confirm ? 'is-invalid' : ''}`}
                placeholder="再次輸入密碼" autoComplete="new-password" value={form.confirm} onChange={set('confirm')} data-testid="reg-confirm" />
              {errors.confirm && <div className="invalid-feedback">{errors.confirm}</div>}
            </div>

            {alertMsg && <div className="alert alert-danger mb-3" role="alert" aria-live="assertive">{alertMsg}</div>}

            <button type="submit" className="btn btn-success w-100" disabled={loading} data-testid="reg-submit">
              {loading && <span className="spinner-border spinner-border-sm me-2" role="status"></span>}
              建立帳號
            </button>
          </form>

          <hr className="my-4" />
          <p className="text-center text-secondary small">
            已有帳號？<Link to="/login" className="text-success">立即登入</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
