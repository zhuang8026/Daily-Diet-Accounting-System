import bcrypt from 'bcryptjs'
import { setStorage, getStorage, removeStorage } from './storage'
import { generateUUID, validateEmail, validatePassword, formatISO } from './utils'

const register = async (email, password, displayName) => {
  const trimEmail = email.trim().toLowerCase()
  if (!validateEmail(trimEmail)) return { success: false, message: 'Email 格式不正確' }
  const { isValid } = validatePassword(password)
  if (!isValid) return { success: false, message: '密碼強度不足，需至少 6 字元且包含大寫、小寫、數字、符號中的 3 種' }
  if (!displayName || displayName.trim().length < 1 || displayName.trim().length > 30)
    return { success: false, message: '暱稱長度需為 1–30 字' }

  const users = getStorage('ddas_users') || []
  if (users.some(u => u.email === trimEmail)) return { success: false, message: '此 Email 已被使用' }

  const passwordHash = await bcrypt.hash(password, 12)
  const now = formatISO()
  const newUser = {
    userId: generateUUID(), displayName: displayName.trim(), email: trimEmail,
    passwordHash, gender: null, age: null, heightCm: null, weightKg: null,
    activityLevel: 'sedentary', dietGoal: 'maintain', targetCalories: 2000,
    targetProtein: 0, targetFat: 0, targetCarb: 0, role: 'user',
    isActive: true, createdAt: now, updatedAt: now, lastLoginAt: null
  }
  setStorage('ddas_users', [...users, newUser])
  return { success: true, message: '註冊成功，請登入' }
}

const login = async (email, password) => {
  const trimEmail = email.trim().toLowerCase()
  const attemptsKey = `ddas_login_attempts_${trimEmail}`

  const attemptsData = getStorage(attemptsKey)
  if (attemptsData) {
    const { count, lockedUntil } = attemptsData
    if (count >= 5 && lockedUntil && new Date() < new Date(lockedUntil)) {
      const remaining = Math.ceil((new Date(lockedUntil) - new Date()) / 60000)
      return { success: false, locked: true, message: `帳號已鎖定，請於 ${remaining} 分鐘後再試` }
    }
  }

  const users = getStorage('ddas_users') || []
  const user = users.find(u => u.email === trimEmail)
  if (!user) { recordFailedAttempt(attemptsKey); return { success: false, message: '帳號或密碼錯誤' } }
  if (!user.isActive) return { success: false, message: '帳號已停用，請聯繫管理員' }

  const isMatch = await bcrypt.compare(password, user.passwordHash)
  if (!isMatch) {
    recordFailedAttempt(attemptsKey)
    const remaining = getRemainingAttempts(attemptsKey)
    return { success: false, message: `帳號或密碼錯誤（剩餘 ${remaining} 次機會）` }
  }

  removeStorage(attemptsKey)
  setStorage('ddas_users', users.map(u => u.userId === user.userId ? { ...u, lastLoginAt: formatISO() } : u))
  setStorage('ddas_session', { userId: user.userId, displayName: user.displayName, email: user.email, role: user.role })
  return { success: true, message: '登入成功' }
}

const recordFailedAttempt = (key) => {
  const raw = getStorage(key) || { count: 0, lockedUntil: null }
  const newCount = raw.count + 1
  setStorage(key, { count: newCount, lockedUntil: newCount >= 5 ? new Date(Date.now() + 15 * 60 * 1000).toISOString() : null })
}

const getRemainingAttempts = (key) => Math.max(0, 5 - (getStorage(key)?.count || 0))

const logout = () => { removeStorage('ddas_session') }

const getCurrentSession = () => getStorage('ddas_session')

const isAuthenticated = () => Boolean(getCurrentSession())

const isAdmin = () => getCurrentSession()?.role === 'admin'

export { register, login, logout, getCurrentSession, isAuthenticated, isAdmin }
