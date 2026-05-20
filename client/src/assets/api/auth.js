import apiClient from './apiClient'

const register = async (email, password, displayName) => {
  try {
    const { data } = await apiClient.post('/auth/register', { email, password, displayName })
    return data
  } catch (err) {
    return { success: false, message: err.response?.data?.detail || '註冊失敗' }
  }
}

const login = async (email, password) => {
  try {
    const { data } = await apiClient.post('/auth/login', { email, password })
    // Cookie is set by the backend (HttpOnly); only store display metadata locally
    localStorage.setItem('ddas_session', JSON.stringify(data.user))
    return { success: true, message: '登入成功' }
  } catch (err) {
    const detail = err.response?.data?.detail
    if (detail && typeof detail === 'object') {
      return { success: false, locked: detail.locked, message: detail.message }
    }
    return { success: false, message: typeof detail === 'string' ? detail : '帳號或密碼錯誤' }
  }
}

const logout = async () => {
  try {
    await apiClient.post('/auth/logout')
  } catch {
    // ignore network errors; still clear local session
  }
  localStorage.removeItem('ddas_session')
}

const getCurrentSession = () => {
  const raw = localStorage.getItem('ddas_session')
  if (!raw) return null
  try { return JSON.parse(raw) } catch { return null }
}

const isAuthenticated = () => Boolean(getCurrentSession())
const isAdmin = () => getCurrentSession()?.role === 'admin'

export { register, login, logout, getCurrentSession, isAuthenticated, isAdmin }
