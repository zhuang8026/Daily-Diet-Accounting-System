import { useState, useEffect, useRef } from 'react'
import { Modal } from 'bootstrap'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { getFoods } from '@/assets/api/foodService'
import { addRecord, getDailySummary } from '@/assets/api/recordService'
import { getTodayISO } from '@/assets/api/utils'

const CATEGORIES = ['全部', '主食', '蔬菜', '水果', '肉類', '蛋類', '乳製品', '飲料', '零食', '其他']

export default function FoodSearch() {
  const { session } = useAuth()
  const { showToast } = useToast()

  const [keyword, setKeyword] = useState('')
  const [category, setCategory] = useState('全部')
  const [calMin, setCalMin] = useState(0)
  const [calMax, setCalMax] = useState(1000)
  const [page, setPage] = useState(1)
  const [result, setResult] = useState({ items: [], total: 0, totalPages: 0 })
  const [selectedFood, setSelectedFood] = useState(null)
  const [serving, setServing] = useState(1)
  const [mealType, setMealType] = useState('breakfast')

  const modalRef = useRef(null)
  const bsModal = useRef(null)
  const searchTimer = useRef(null)

  useEffect(() => {
    bsModal.current = new Modal(modalRef.current)
  }, [])

  useEffect(() => {
    loadFoods()
  }, [category, calMin, calMax, page])

  const loadFoods = () => {
    setResult(getFoods({ keyword, category, minCal: Math.min(calMin, calMax), maxCal: Math.max(calMin, calMax), page, limit: 12 }))
  }

  const handleKeyword = (e) => {
    setKeyword(e.target.value)
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => { setPage(1); loadFoods() }, 300)
  }

  const handleRangeChange = (field, val) => {
    if (field === 'min') setCalMin(val)
    else setCalMax(val)
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => { setPage(1); loadFoods() }, 200)
  }

  const openAddModal = (food) => {
    setSelectedFood(food)
    setServing(1)
    bsModal.current.show()
  }

  const handleConfirmAdd = () => {
    if (!selectedFood) return
    const s = parseFloat(serving)
    if (!s || s <= 0) { showToast('請輸入正確份量', 'warning'); return }

    addRecord(session.userId, {
      mealType, recordDate: getTodayISO(),
      foodName: selectedFood.foodName, foodId: selectedFood.foodId,
      servingAmount: s,
      calories: Math.round(selectedFood.caloriesPerServing * s),
      protein: Number((selectedFood.proteinPerServing * s).toFixed(1)),
      fat: Number((selectedFood.fatPerServing * s).toFixed(1)),
      carbohydrate: Number((selectedFood.carbPerServing * s).toFixed(1))
    })
    bsModal.current.hide()
    const summary = getDailySummary(session.userId, getTodayISO())
    showToast(`✓ 飲食紀錄已儲存，今日累計 ${summary.totalCalories} kcal`, 'success')
  }

  const calcDisplay = selectedFood && parseFloat(serving) > 0 ? {
    cal: Math.round(selectedFood.caloriesPerServing * parseFloat(serving)),
    protein: Number((selectedFood.proteinPerServing * parseFloat(serving)).toFixed(1)),
    fat: Number((selectedFood.fatPerServing * parseFloat(serving)).toFixed(1)),
    carb: Number((selectedFood.carbPerServing * parseFloat(serving)).toFixed(1))
  } : null

  return (
    <div className="container-fluid p-3">
      <h1 className="h5 mb-4 fw-500">食物搜尋</h1>

      <div className="card p-3 mb-3">
        <div className="row g-3 align-items-end">
          <div className="col-12 col-md-4">
            <label htmlFor="food-keyword" className="form-label">關鍵字搜尋</label>
            <input type="text" id="food-keyword" className="form-control" placeholder="輸入食物名稱..." maxLength={50} value={keyword} onChange={handleKeyword} />
          </div>
          <div className="col-6 col-md-3">
            <label htmlFor="cat-filter" className="form-label">類別</label>
            <select id="cat-filter" className="form-select" value={category} onChange={e => { setCategory(e.target.value); setPage(1) }}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="col-6 col-md-5">
            <label className="form-label">熱量範圍：<span>{Math.min(calMin, calMax)} – {Math.max(calMin, calMax)} kcal</span></label>
            <div className="d-flex gap-2 align-items-center">
              <input type="range" className="form-range" min={0} max={1000} step={10} value={calMin} onChange={e => handleRangeChange('min', +e.target.value)} aria-label="最低熱量" />
              <input type="range" className="form-range" min={0} max={1000} step={10} value={calMax} onChange={e => handleRangeChange('max', +e.target.value)} aria-label="最高熱量" />
            </div>
          </div>
        </div>
      </div>

      <div className="row g-3" id="food-cards">
        {result.items.length === 0 ? (
          <div className="col-12 text-center text-secondary py-5">
            <i className="bi bi-search fs-2 d-block mb-2"></i>找不到符合條件的食物
          </div>
        ) : result.items.map(f => (
          <div className="col-12 col-sm-6 col-lg-4" key={f.foodId}>
            <div className="card h-100">
              <div className="card-body p-3">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <span className="fw-bold">{f.foodName}</span>
                  <span className="badge" style={{ backgroundColor: 'var(--color-primary)' }}>{f.category}</span>
                </div>
                <div className="small text-secondary mb-2">{f.servingUnit}</div>
                <div className="d-flex gap-2 flex-wrap small">
                  <span className="badge text-bg-warning p-2">{f.caloriesPerServing} kcal</span>
                  <span className="text-secondary">蛋白 {f.proteinPerServing}g</span>
                  <span className="text-secondary">脂肪 {f.fatPerServing}g</span>
                  <span className="text-secondary">碳水 {f.carbPerServing}g</span>
                </div>
              </div>
              <div className="card-footer p-2">
                <button className="btn btn-success btn-sm w-100" onClick={() => openAddModal(f)}>
                  <i className="bi bi-plus-circle me-1"></i> 加入
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {result.totalPages > 1 && (
        <nav aria-label="食物列表分頁" className="mt-3 d-flex justify-content-center">
          <ul className="pagination pagination-sm mb-0">
            <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
              <button className="page-link" onClick={() => setPage(p => p - 1)}>‹</button>
            </li>
            {Array.from({ length: result.totalPages }, (_, i) => i + 1).map(p => (
              <li key={p} className={`page-item ${p === page ? 'active' : ''}`}>
                <button className="page-link" onClick={() => setPage(p)}>{p}</button>
              </li>
            ))}
            <li className={`page-item ${page === result.totalPages ? 'disabled' : ''}`}>
              <button className="page-link" onClick={() => setPage(p => p + 1)}>›</button>
            </li>
          </ul>
        </nav>
      )}

      {/* Add Modal */}
      <div className="modal fade" ref={modalRef} tabIndex="-1" aria-labelledby="add-modal-title" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title h5" id="add-modal-title">加入飲食紀錄</h2>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="關閉"></button>
            </div>
            <div className="modal-body">
              {selectedFood && (
                <div className="alert alert-light mb-3">
                  <strong>{selectedFood.foodName}</strong> &nbsp;{selectedFood.servingUnit}，{selectedFood.caloriesPerServing} kcal/份
                </div>
              )}
              <div className="row g-2">
                <div className="col-6">
                  <label htmlFor="add-meal-type" className="form-label">餐別 <span className="text-danger">*</span></label>
                  <select id="add-meal-type" className="form-select" value={mealType} onChange={e => setMealType(e.target.value)}>
                    <option value="breakfast">早餐</option>
                    <option value="lunch">午餐</option>
                    <option value="dinner">晚餐</option>
                    <option value="snack">點心</option>
                  </select>
                </div>
                <div className="col-6">
                  <label htmlFor="add-serving" className="form-label">份量 <span className="text-danger">*</span></label>
                  <input type="number" id="add-serving" className="form-control" value={serving} min={0.01} step={0.01} onChange={e => setServing(e.target.value)} />
                </div>
              </div>
              {calcDisplay && (
                <div className="mt-3 p-2 bg-light rounded small">
                  {calcDisplay.cal} kcal｜蛋白質 {calcDisplay.protein}g｜脂肪 {calcDisplay.fat}g｜碳水 {calcDisplay.carb}g
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">取消</button>
              <button type="button" className="btn btn-success" onClick={handleConfirmAdd}>加入</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
