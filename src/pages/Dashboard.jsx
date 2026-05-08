import { useState, useEffect, useRef, useCallback } from 'react'
import { Modal } from 'bootstrap'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { Doughnut } from 'react-chartjs-2'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { getRecords, addRecord, updateRecord, deleteRecord, getDailySummary } from '../services/recordService'
import { searchFoods, getFoodById } from '../services/foodService'
import { getTargets } from '../services/profileService'
import { getActiveAnnouncement } from '../services/announcementService'
import { getTodayISO, formatDateDisplay, offsetDate, getMealLabel, sanitizeInput } from '../services/utils'

ChartJS.register(ArcElement, Tooltip, Legend)

const MEAL_ICONS = { breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '🍎' }
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack']

const centerTextPlugin = {
  id: 'centerText',
  afterDatasetsDraw(chart, _, opts) {
    if (!opts) return
    const { ctx, chartArea: { width, height, left, top } } = chart
    ctx.save()
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const cx = left + width / 2, cy = top + height / 2
    ctx.font = 'bold 20px sans-serif'
    ctx.fillStyle = opts.color || '#2e7d32'
    ctx.fillText(opts.calories, cx, cy - 10)
    ctx.font = '12px sans-serif'
    ctx.fillStyle = '#757575'
    ctx.fillText('kcal', cx, cy + 10)
    ctx.restore()
  }
}

const EMPTY_FORM = { recordId: '', foodName: '', foodId: '', mealType: 'breakfast', recordDate: '', servingAmount: 1, calories: 0, protein: 0, fat: 0, carb: 0, note: '' }

export default function Dashboard() {
  const { session } = useAuth()
  const { showToast } = useToast()

  const [currentDate, setCurrentDate] = useState(getTodayISO())
  const [records, setRecords] = useState([])
  const [summary, setSummary] = useState({ totalCalories: 0, totalProtein: 0, totalFat: 0, totalCarb: 0 })
  const [targets, setTargets] = useState({ targetCalories: 2000, targetProtein: 0, targetFat: 0, targetCarb: 0 })
  const [announcement, setAnnouncement] = useState(null)

  const [form, setForm] = useState(EMPTY_FORM)
  const [isEditing, setIsEditing] = useState(false)
  const [autocomplete, setAutocomplete] = useState([])
  const [selectedFoodBase, setSelectedFoodBase] = useState(null)
  const [showAnnouncement, setShowAnnouncement] = useState(true)
  const [pendingDeleteId, setPendingDeleteId] = useState(null)

  const recordModalRef = useRef(null)
  const deleteModalRef = useRef(null)
  const bsRecord = useRef(null)
  const bsDelete = useRef(null)

  useEffect(() => {
    bsRecord.current = new Modal(recordModalRef.current)
    bsDelete.current = new Modal(deleteModalRef.current)
  }, [])

  const refresh = useCallback(() => {
    const t = getTargets(session.userId)
    setTargets(t)
    setSummary(getDailySummary(session.userId, currentDate))
    setRecords(getRecords(session.userId, currentDate))
    setAnnouncement(getActiveAnnouncement())
  }, [session.userId, currentDate])

  useEffect(() => { refresh() }, [refresh])

  const today = getTodayISO()
  const isToday = currentDate === today

  const pct = targets.targetCalories > 0 ? summary.totalCalories / targets.targetCalories : 0
  const chartColor = pct > 1 ? '#c62828' : pct >= 0.75 ? '#e65100' : '#2e7d32'
  const remaining = Math.max(0, targets.targetCalories - summary.totalCalories)

  const chartData = {
    labels: ['已攝取', '剩餘'],
    datasets: [{ data: [summary.totalCalories, remaining || (summary.totalCalories === 0 ? 1 : 0)], backgroundColor: [chartColor, '#e0e0e0'], borderWidth: 0 }]
  }
  const chartOptions = {
    cutout: '72%', animation: { duration: 600 },
    plugins: { legend: { display: false }, tooltip: { enabled: false }, centerText: { calories: summary.totalCalories, color: chartColor } }
  }

  const macros = [
    { key: 'protein', label: '蛋白質', value: summary.totalProtein, target: targets.targetProtein, color: '#1565c0' },
    { key: 'fat', label: '脂肪', value: summary.totalFat, target: targets.targetFat, color: '#e65100' },
    { key: 'carb', label: '碳水化合物', value: summary.totalCarb, target: targets.targetCarb, color: '#2e7d32' }
  ]

  const openAddModal = (mealType = 'breakfast') => {
    setIsEditing(false)
    setSelectedFoodBase(null)
    setAutocomplete([])
    setForm({ ...EMPTY_FORM, mealType, recordDate: currentDate })
    bsRecord.current.show()
  }

  const openEditModal = (record) => {
    setIsEditing(true)
    setSelectedFoodBase(record.foodId ? getFoodById(record.foodId) : null)
    setAutocomplete([])
    setForm({ recordId: record.recordId, foodName: record.foodName, foodId: record.foodId || '', mealType: record.mealType, recordDate: record.recordDate, servingAmount: record.servingAmount, calories: record.calories, protein: record.protein, fat: record.fat, carb: record.carbohydrate, note: record.note || '' })
    bsRecord.current.show()
  }

  const handleFoodSearch = (val) => {
    setForm(f => ({ ...f, foodName: val, foodId: '' }))
    if (val.length < 1) { setAutocomplete([]); return }
    setAutocomplete(searchFoods(val))
  }

  const selectFood = (food) => {
    setSelectedFoodBase(food)
    setAutocomplete([])
    setForm(f => ({ ...f, foodName: food.foodName, foodId: food.foodId, servingAmount: 1, calories: Math.round(food.caloriesPerServing), protein: Number(food.proteinPerServing.toFixed(1)), fat: Number(food.fatPerServing.toFixed(1)), carb: Number(food.carbPerServing.toFixed(1)) }))
  }

  const handleServingChange = (val) => {
    const amount = parseFloat(val) || 1
    setForm(f => {
      if (!selectedFoodBase) return { ...f, servingAmount: val }
      return { ...f, servingAmount: val, calories: Math.round(selectedFoodBase.caloriesPerServing * amount), protein: Number((selectedFoodBase.proteinPerServing * amount).toFixed(1)), fat: Number((selectedFoodBase.fatPerServing * amount).toFixed(1)), carb: Number((selectedFoodBase.carbPerServing * amount).toFixed(1)) }
    })
  }

  const handleSave = () => {
    const foodName = sanitizeInput(form.foodName.trim())
    if (!foodName) { showToast('請輸入食物名稱', 'warning'); return }
    if (!form.mealType) { showToast('請選擇餐別', 'warning'); return }
    if (!form.recordDate || form.recordDate > today) { showToast('日期無效或為未來日期', 'warning'); return }
    if (!form.servingAmount || parseFloat(form.servingAmount) <= 0) { showToast('份量需大於 0', 'warning'); return }
    if (isNaN(parseInt(form.calories, 10)) || parseInt(form.calories, 10) < 0) { showToast('請輸入正確的熱量數值', 'warning'); return }

    const data = { mealType: form.mealType, recordDate: form.recordDate, foodName, foodId: form.foodId || null, servingAmount: parseFloat(form.servingAmount), calories: parseInt(form.calories, 10), protein: parseFloat(form.protein) || 0, fat: parseFloat(form.fat) || 0, carbohydrate: parseFloat(form.carb) || 0, note: sanitizeInput(form.note) }

    if (isEditing) updateRecord(session.userId, form.recordId, data)
    else addRecord(session.userId, data)

    bsRecord.current.hide()
    refresh()
    const newSummary = getDailySummary(session.userId, currentDate)
    showToast(`✓ 飲食紀錄已儲存，今日累計 ${newSummary.totalCalories} kcal`, 'success')
  }

  const handleDeleteConfirm = () => {
    if (!pendingDeleteId) return
    deleteRecord(session.userId, pendingDeleteId)
    bsDelete.current.hide()
    setPendingDeleteId(null)
    refresh()
    showToast('飲食紀錄已刪除', 'info')
  }

  return (
    <div>
      {announcement && showAnnouncement && (
        <div className="alert alert-info alert-dismissible fade show m-3 mb-0" role="alert">
          <i className="bi bi-megaphone-fill me-2"></i>
          <strong>{announcement.title}</strong> {announcement.content}
          <button type="button" className="btn-close" onClick={() => setShowAnnouncement(false)} aria-label="關閉公告"></button>
        </div>
      )}

      <div className="container-fluid p-3">
        <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
          <h1 className="h5 mb-0 fw-500">每日飲食總覽</h1>
          <div className="d-flex align-items-center gap-2">
            <button className="btn btn-outline-secondary btn-sm" onClick={() => setCurrentDate(d => offsetDate(d, -1))} aria-label="前一天"><i className="bi bi-chevron-left"></i></button>
            <input type="date" className="form-control form-control-sm" value={currentDate} max={today} style={{ width: 150 }} onChange={e => { if (e.target.value && e.target.value <= today) setCurrentDate(e.target.value) }} aria-label="選擇日期" />
            <button className="btn btn-outline-secondary btn-sm" onClick={() => setCurrentDate(d => offsetDate(d, 1))} disabled={isToday} aria-label="後一天"><i className="bi bi-chevron-right"></i></button>
          </div>
        </div>
        <p className="text-secondary small mb-3">{formatDateDisplay(currentDate)}</p>

        <div className="row g-3 mb-3">
          <div className="col-12 col-md-5 col-lg-4">
            <div className="card h-100 p-3 text-center">
              <h2 className="h6 mb-3 text-secondary">熱量總覽</h2>
              <div className="position-relative mx-auto" style={{ width: 180, height: 180 }}>
                <Doughnut data={chartData} options={chartOptions} plugins={[centerTextPlugin]} />
              </div>
              <div className="mt-2 small text-secondary" aria-live="polite">
                <span className="fw-bold fs-5 text-body">{summary.totalCalories}</span> / {targets.targetCalories} kcal
              </div>
            </div>
          </div>
          <div className="col-12 col-md-7 col-lg-8">
            <div className="card h-100 p-3">
              <h2 className="h6 mb-3 text-secondary">三大營養素</h2>
              {macros.map(m => {
                const p = m.target > 0 ? Math.min(100, (m.value / m.target) * 100) : 0
                const isOver = m.target > 0 && m.value > m.target
                return (
                  <div className="mb-3" key={m.key}>
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="small fw-500">{m.label}</span>
                      <span className={`small ${isOver ? 'text-danger fw-bold' : 'text-secondary'}`}>{m.value}g / {m.target || '—'}g{isOver ? ' ⚠️' : ''}</span>
                    </div>
                    <div className="progress" style={{ height: 10 }} role="progressbar" aria-valuenow={m.value} aria-valuemin={0} aria-valuemax={m.target || 100} aria-label={`${m.label} 進度`}>
                      <div className={`progress-bar ${isOver ? 'bg-danger' : ''}`} style={{ width: `${p}%`, ...(isOver ? {} : { backgroundColor: m.color }) }}></div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="accordion mb-5" id="meal-accordion">
          {MEAL_TYPES.map((mealType, idx) => {
            const mealRecords = records.filter(r => r.mealType === mealType)
            const mealCal = mealRecords.reduce((s, r) => s + r.calories, 0)
            const collapseId = `meal-${mealType}`
            return (
              <div className="accordion-item" key={mealType}>
                <h2 className="accordion-header">
                  <button className={`accordion-button ${idx !== 0 ? 'collapsed' : ''}`} type="button" data-bs-toggle="collapse" data-bs-target={`#${collapseId}`} aria-expanded={idx === 0} aria-controls={collapseId}>
                    <span className="me-2">{MEAL_ICONS[mealType]}</span>
                    <strong>{getMealLabel(mealType)}</strong>
                    <span className="badge bg-secondary ms-2">{mealCal} kcal</span>
                    <span className="badge bg-light text-secondary ms-1">{mealRecords.length} 筆</span>
                  </button>
                </h2>
                <div id={collapseId} className={`accordion-collapse collapse ${idx === 0 ? 'show' : ''}`} data-bs-parent="#meal-accordion">
                  <div className="accordion-body p-0">
                    {mealRecords.length === 0 ? (
                      <p className="text-secondary text-center py-3 small">尚無 {getMealLabel(mealType)} 紀錄</p>
                    ) : (
                      <div className="table-responsive">
                        <table className="table table-hover mb-0">
                          <thead className="table-light">
                            <tr>
                              <th>食物</th><th>份量</th><th>熱量</th>
                              <th className="d-none d-sm-table-cell">蛋白質</th>
                              <th className="d-none d-sm-table-cell">脂肪</th>
                              <th className="d-none d-sm-table-cell">碳水</th>
                              <th>操作</th>
                            </tr>
                          </thead>
                          <tbody>
                            {mealRecords.map(r => (
                              <tr key={r.recordId}>
                                <td>
                                  <span className="fw-500">{r.foodName}</span>
                                  {r.note && <div className="small text-secondary">{r.note}</div>}
                                </td>
                                <td className="small">{r.servingAmount} 份</td>
                                <td className="small">{r.calories} kcal</td>
                                <td className="small d-none d-sm-table-cell">{r.protein}g</td>
                                <td className="small d-none d-sm-table-cell">{r.fat}g</td>
                                <td className="small d-none d-sm-table-cell">{r.carbohydrate}g</td>
                                <td>
                                  <button className="btn btn-sm btn-outline-secondary me-1" onClick={() => openEditModal(r)} aria-label={`編輯 ${r.foodName}`}><i className="bi bi-pencil"></i></button>
                                  <button className="btn btn-sm btn-outline-danger" onClick={() => { setPendingDeleteId(r.recordId); bsDelete.current.show() }} aria-label={`刪除 ${r.foodName}`}><i className="bi bi-trash"></i></button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    <div className="p-2 border-top">
                      <button className="btn btn-outline-success btn-sm w-100" onClick={() => openAddModal(mealType)} aria-label={`新增${getMealLabel(mealType)}紀錄`}>
                        <i className="bi bi-plus-circle me-1"></i> 新增{getMealLabel(mealType)}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <button className="btn btn-success rounded-circle shadow-lg position-fixed d-flex align-items-center justify-content-center"
        style={{ bottom: 80, right: 20, width: 56, height: 56, zIndex: 1000 }}
        onClick={() => openAddModal()} aria-label="新增飲食紀錄" data-testid="add-record-btn">
        <i className="bi bi-plus-lg fs-5"></i>
      </button>

      {/* Record Modal */}
      <div className="modal fade" ref={recordModalRef} tabIndex="-1" aria-labelledby="record-modal-title" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title h5" id="record-modal-title">{isEditing ? '編輯' : '新增'}飲食紀錄</h2>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="關閉"></button>
            </div>
            <div className="modal-body">
              <div className="mb-3">
                <label htmlFor="food-search-input" className="form-label">食物名稱 <span className="text-danger">*</span></label>
                <div className="position-relative">
                  <input type="text" id="food-search-input" className="form-control" placeholder="輸入食物名稱..." maxLength={50} autoComplete="off"
                    value={form.foodName} onChange={e => handleFoodSearch(e.target.value)} data-testid="food-search" />
                  {autocomplete.length > 0 && (
                    <div className="autocomplete-dropdown shadow-sm border rounded" role="listbox">
                      {autocomplete.map(food => (
                        <div key={food.foodId} className="autocomplete-item p-2" role="option" tabIndex={0}
                          onClick={() => selectFood(food)} onKeyDown={e => e.key === 'Enter' && selectFood(food)}
                          data-testid={`food-item-${food.foodId}`}>
                          <span className="fw-500">{food.foodName}</span>
                          <span className="small text-secondary ms-2">{food.caloriesPerServing}kcal/{food.servingUnit}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="row g-2 mb-3">
                <div className="col-6">
                  <label htmlFor="meal-type-select" className="form-label">餐別 <span className="text-danger">*</span></label>
                  <select id="meal-type-select" className="form-select" value={form.mealType} onChange={e => setForm(f => ({ ...f, mealType: e.target.value }))}>
                    <option value="breakfast">早餐</option><option value="lunch">午餐</option><option value="dinner">晚餐</option><option value="snack">點心</option>
                  </select>
                </div>
                <div className="col-6">
                  <label htmlFor="record-date-input" className="form-label">日期 <span className="text-danger">*</span></label>
                  <input type="date" id="record-date-input" className="form-control" max={today} value={form.recordDate} onChange={e => setForm(f => ({ ...f, recordDate: e.target.value }))} />
                </div>
              </div>
              <div className="mb-3">
                <label htmlFor="serving-amount-input" className="form-label">份量（倍數）<span className="text-danger">*</span></label>
                <input type="number" id="serving-amount-input" className="form-control" value={form.servingAmount} min={0.01} step={0.01} onChange={e => handleServingChange(e.target.value)} data-testid="serving-amount" />
                {selectedFoodBase && <div className="form-text text-secondary small">每份基準：{selectedFoodBase.servingUnit}，{selectedFoodBase.caloriesPerServing} kcal</div>}
              </div>
              <div className="row g-2 mb-3">
                {[['calories', '熱量', 'kcal', 'cal-input', 0, 1], ['protein', '蛋白質', 'g', null, 0, 0.1], ['fat', '脂肪', 'g', null, 0, 0.1], ['carb', '碳水', 'g', null, 0, 0.1]].map(([field, label, unit, testid, min, step]) => (
                  <div className="col-6 col-sm-3" key={field}>
                    <label className="form-label">{label}</label>
                    <div className="input-group input-group-sm">
                      <input type="number" id={testid || field} className="form-control" min={min} step={step} value={form[field]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))} />
                      <span className="input-group-text">{unit}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mb-3">
                <label htmlFor="note-input" className="form-label">備註</label>
                <textarea id="note-input" className="form-control" rows={2} maxLength={200} placeholder="選填，最多 200 字" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))}></textarea>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">取消</button>
              <button type="button" className="btn btn-success" onClick={handleSave} data-testid="save-record-btn">儲存</button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirm Modal */}
      <div className="modal fade" ref={deleteModalRef} tabIndex="-1" aria-labelledby="delete-confirm-title" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered modal-sm">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title h5" id="delete-confirm-title">確認刪除</h2>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="關閉"></button>
            </div>
            <div className="modal-body">確定要刪除這筆飲食紀錄嗎？此操作無法復原。</div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary btn-sm" data-bs-dismiss="modal">取消</button>
              <button type="button" className="btn btn-danger btn-sm" onClick={handleDeleteConfirm}>確認刪除</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
