import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { getProfile, updateProfile } from '@/assets/api/profileService'
import { calculateBMR, sanitizeInput } from '@/assets/api/utils'

const ACTIVITY_OPTIONS = [
  { value: 'sedentary', label: '久坐（幾乎不運動）' },
  { value: 'light', label: '輕度（每週運動 1–3 天）' },
  { value: 'moderate', label: '中度（每週運動 3–5 天）' },
  { value: 'active', label: '高度（每週運動 6–7 天）' },
  { value: 'veryActive', label: '非常高度（體力勞動或每日訓練）' }
]

const GOAL_OPTIONS = [
  { value: 'lose', label: '減重（降低攝取）' },
  { value: 'maintain', label: '維持體重' },
  { value: 'gain', label: '增肌（提高攝取）' }
]

export default function Settings() {
  const { session } = useAuth()
  const { showToast } = useToast()
  const [profile, setProfile] = useState({})
  const [form, setForm] = useState({ gender: 'male', age: '', heightCm: '', weightKg: '', activityLevel: 'sedentary', dietGoal: 'maintain', targetCalories: 2000, targetProtein: 0, targetFat: 0, targetCarb: 0, displayName: '' })
  const [errors, setErrors] = useState({})
  const [suggestedCal, setSuggestedCal] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const p = getProfile(session.userId) || {}
    setProfile(p)
    setForm({
      gender: p.gender || 'male',
      age: p.age || '',
      heightCm: p.heightCm || '',
      weightKg: p.weightKg || '',
      activityLevel: p.activityLevel || 'sedentary',
      dietGoal: p.dietGoal || 'maintain',
      targetCalories: p.targetCalories || 2000,
      targetProtein: p.targetProtein || 0,
      targetFat: p.targetFat || 0,
      targetCarb: p.targetCarb || 0,
      displayName: p.displayName || session.displayName || ''
    })
  }, [session.userId])

  useEffect(() => {
    calcBMR()
  }, [form.gender, form.age, form.heightCm, form.weightKg, form.activityLevel, form.dietGoal])

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

  const calcBMR = () => {
    const age = parseInt(form.age, 10)
    const h = parseFloat(form.heightCm)
    const w = parseFloat(form.weightKg)
    if (form.gender && age >= 10 && h >= 50 && w >= 20) {
      setSuggestedCal(calculateBMR({ gender: form.gender, age, heightCm: h, weightKg: w, activityLevel: form.activityLevel, dietGoal: form.dietGoal }))
    } else {
      setSuggestedCal(null)
    }
  }

  const applySuggested = () => {
    if (suggestedCal) {
      setForm(f => ({ ...f, targetCalories: suggestedCal }))
      showToast(`已套用建議熱量 ${suggestedCal} kcal`, 'info')
    } else {
      showToast('請先填寫完整生理資料', 'warning')
    }
  }

  const validate = () => {
    const errs = {}
    const age = parseInt(form.age, 10)
    const h = parseFloat(form.heightCm)
    const w = parseFloat(form.weightKg)
    const cal = parseInt(form.targetCalories, 10)
    if (isNaN(age) || age < 10 || age > 120) errs.age = '年齡需介於 10–120 歲'
    if (isNaN(h) || h < 50 || h > 250) errs.heightCm = '身高需介於 50–250 cm'
    if (isNaN(w) || w < 20 || w > 300) errs.weightKg = '體重需介於 20–300 kg'
    if (isNaN(cal) || cal < 500) errs.targetCalories = '熱量目標需 ≥ 500 kcal'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      updateProfile(session.userId, {
        displayName: sanitizeInput(form.displayName.trim()) || profile.displayName,
        gender: form.gender,
        age: parseInt(form.age, 10),
        heightCm: parseFloat(form.heightCm),
        weightKg: parseFloat(form.weightKg),
        activityLevel: form.activityLevel,
        dietGoal: form.dietGoal,
        targetCalories: parseInt(form.targetCalories, 10),
        targetProtein: parseFloat(form.targetProtein) || 0,
        targetFat: parseFloat(form.targetFat) || 0,
        targetCarb: parseFloat(form.targetCarb) || 0
      })
      showToast('設定已儲存', 'success')
    } catch {
      showToast('儲存失敗，請再試一次', 'danger')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container py-4" style={{ maxWidth: 680 }}>
      <h1 className="h5 fw-500 mb-4">個人目標設定</h1>
      <form onSubmit={handleSubmit} noValidate>
        <div className="card p-4 mb-4">
          <h2 className="h6 mb-3 text-secondary">生理資料</h2>
          <div className="mb-3">
            <label className="form-label">性別 <span className="text-danger">*</span></label>
            <div className="d-flex gap-4">
              {[['male', '男'], ['female', '女']].map(([v, l]) => (
                <div className="form-check" key={v}>
                  <input className="form-check-input" type="radio" name="gender" id={`gender-${v}`} value={v} checked={form.gender === v} onChange={set('gender')} />
                  <label className="form-check-label" htmlFor={`gender-${v}`}>{l}</label>
                </div>
              ))}
            </div>
          </div>
          <div className="row g-3">
            {[
              { field: 'age', label: '年齡', unit: '歲', testid: 'age-input', attrs: { type: 'number', min: 10, max: 120 } },
              { field: 'heightCm', label: '身高', unit: 'cm', testid: 'height-input', attrs: { type: 'number', min: 50, max: 250, step: 0.1 } },
              { field: 'weightKg', label: '體重', unit: 'kg', testid: 'weight-input', attrs: { type: 'number', min: 20, max: 300, step: 0.1 } }
            ].map(({ field, label, unit, testid, attrs }) => (
              <div className="col-6 col-sm-4" key={field}>
                <label htmlFor={field} className="form-label">{label} <span className="text-danger">*</span></label>
                <div className="input-group">
                  <input id={field} className={`form-control ${errors[field] ? 'is-invalid' : ''}`} value={form[field]} onChange={set(field)} data-testid={testid} {...attrs} />
                  <span className="input-group-text">{unit}</span>
                </div>
                {errors[field] && <div className="invalid-feedback d-block">{errors[field]}</div>}
              </div>
            ))}
          </div>
          <div className="mt-3">
            <label htmlFor="activityLevel" className="form-label">活動量 <span className="text-danger">*</span></label>
            <select id="activityLevel" className="form-select" value={form.activityLevel} onChange={set('activityLevel')}>
              {ACTIVITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        <div className="card p-4 mb-4">
          <h2 className="h6 mb-3 text-secondary">飲食目標</h2>
          <div className="mb-3">
            <label className="form-label">目標 <span className="text-danger">*</span></label>
            <div className="row g-2">
              {GOAL_OPTIONS.map(({ value, label }) => (
                <div className="col-12 col-sm-4" key={value}>
                  <div className={`form-check border rounded p-3 h-100 ${form.dietGoal === value ? 'border-success' : ''}`}>
                    <input className="form-check-input" type="radio" name="dietGoal" id={`goal-${value}`} value={value} checked={form.dietGoal === value} onChange={set('dietGoal')} />
                    <label className="form-check-label fw-500" htmlFor={`goal-${value}`}>{label}</label>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="alert alert-light border d-flex align-items-center justify-content-between mb-3">
            <div>
              <div className="small text-secondary">Harris-Benedict 建議熱量</div>
              <div className="fs-5 fw-bold text-success">{suggestedCal ? `${suggestedCal} kcal` : '—'}</div>
            </div>
            <button type="button" className="btn btn-outline-success btn-sm" onClick={applySuggested} data-testid="apply-suggested">套用建議值</button>
          </div>
          <div className="row g-3">
            {[
              { field: 'targetCalories', label: '熱量目標', unit: 'kcal', testid: 'target-cal', req: true },
              { field: 'targetProtein', label: '蛋白質目標', unit: 'g', testid: null },
              { field: 'targetFat', label: '脂肪目標', unit: 'g', testid: null },
              { field: 'targetCarb', label: '碳水目標', unit: 'g', testid: null }
            ].map(({ field, label, unit, testid, req }) => (
              <div className="col-6 col-sm-3" key={field}>
                <label htmlFor={field} className="form-label">{label}{req && <span className="text-danger"> *</span>}</label>
                <div className="input-group">
                  <input type="number" id={field} className={`form-control ${errors[field] ? 'is-invalid' : ''}`} value={form[field]} onChange={set(field)} min={req ? 500 : 0} step={unit === 'g' ? 0.1 : 1} data-testid={testid || undefined} />
                  <span className="input-group-text">{unit}</span>
                </div>
                {errors[field] && <div className="invalid-feedback d-block">{errors[field]}</div>}
              </div>
            ))}
          </div>
        </div>

        <div className="card p-4 mb-4">
          <h2 className="h6 mb-3 text-secondary">帳號資訊</h2>
          <div className="mb-3">
            <label htmlFor="displayName" className="form-label">暱稱</label>
            <input type="text" id="displayName" className="form-control" maxLength={30} value={form.displayName} onChange={set('displayName')} />
          </div>
          <div className="text-secondary small">Email：{profile.email || session.email}</div>
        </div>

        <button type="submit" className="btn btn-success px-5" disabled={loading}>
          {loading && <span className="spinner-border spinner-border-sm me-2" role="status"></span>}
          儲存設定
        </button>
      </form>
    </div>
  )
}
