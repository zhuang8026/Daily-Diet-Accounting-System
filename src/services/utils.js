const generateUUID = () =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })

const getTodayISO = () => {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const formatDateDisplay = (dateStr) => {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-')
  const today = getTodayISO()
  const yesterday = offsetDate(today, -1)
  if (dateStr === today) return `${y}年${m}月${d}日（今天）`
  if (dateStr === yesterday) return `${y}年${m}月${d}日（昨天）`
  return `${y}年${m}月${d}日`
}

const offsetDate = (dateStr, days) => {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + days)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const sanitizeInput = (str) => {
  if (typeof str !== 'string') return ''
  return str.replace(/<[^>]*>/g, '').replace(/[<>]/g, '')
}

const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

const validatePassword = (pwd) => {
  const hasUpper  = /[A-Z]/.test(pwd)
  const hasLower  = /[a-z]/.test(pwd)
  const hasNumber = /[0-9]/.test(pwd)
  const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':,./<>?]/.test(pwd)
  const typeCount = [hasUpper, hasLower, hasNumber, hasSymbol].filter(Boolean).length
  return { isValid: pwd.length >= 6 && typeCount >= 3, typeCount }
}

const calculateBMR = ({ gender, age, heightCm, weightKg, activityLevel, dietGoal }) => {
  const bmr = gender === 'male'
    ? 88.362 + (13.397 * weightKg) + (4.799 * heightCm) - (5.677 * age)
    : 447.593 + (9.247 * weightKg) + (3.098 * heightCm) - (4.330 * age)
  const activityMap = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, veryActive: 1.9 }
  const goalMap = { lose: 0.8, maintain: 1.0, gain: 1.15 }
  return Math.round(bmr * (activityMap[activityLevel] || 1.2) * (goalMap[dietGoal] || 1.0))
}

const getMealLabel = (mealType) =>
  ({ breakfast: '早餐', lunch: '午餐', dinner: '晚餐', snack: '點心' })[mealType] || mealType

const formatISO = () => new Date().toISOString()

export {
  generateUUID, getTodayISO, formatDateDisplay, offsetDate,
  sanitizeInput, validateEmail, validatePassword,
  calculateBMR, getMealLabel, formatISO
}
