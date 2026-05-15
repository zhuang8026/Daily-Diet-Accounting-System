import { useState, useEffect, useRef } from 'react'
import { Modal } from 'bootstrap'
import { useToast } from '@/context/ToastContext'
import { useAuth } from '@/context/AuthContext'
import {
  getFoods,
  addFood,
  updateFood,
  deleteFood,
  generateFoodId,
  importFoodsFromCsv
} from '@/assets/api/foodService'

const CATEGORIES = ['主食', '蔬菜', '水果', '肉類', '蛋類', '乳製品', '飲料', '零食', '其他']
const PAGE_SIZE = 20

const emptyForm = () => ({
  foodId: '',
  foodName: '',
  category: '主食',
  servingSize: 100,
  servingUnit: '克',
  caloriesPerServing: 0,
  proteinPerServing: 0,
  fatPerServing: 0,
  carbPerServing: 0,
  isCustom: false
})

export default function AdminFoods() {
  const { showToast } = useToast()
  const { session } = useAuth()

  const [currentPage, setCurrentPage] = useState(1)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [searchCategory, setSearchCategory] = useState('')
  const [listResult, setListResult] = useState({ items: [], total: 0, totalPages: 1 })

  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showCsvModal, setShowCsvModal] = useState(false)
  const [editingFood, setEditingFood] = useState(null)
  const [formData, setFormData] = useState(emptyForm())
  const [pendingDeleteId, setPendingDeleteId] = useState(null)
  const [csvText, setCsvText] = useState('')

  const editModalRef = useRef(null)
  const editBsModal = useRef(null)
  const deleteModalRef = useRef(null)
  const deleteBsModal = useRef(null)
  const csvModalRef = useRef(null)
  const csvBsModal = useRef(null)

  useEffect(() => {
    editBsModal.current = new Modal(editModalRef.current)
    deleteBsModal.current = new Modal(deleteModalRef.current)
    csvBsModal.current = new Modal(csvModalRef.current)
  }, [])

  useEffect(() => {
    loadFoods()
  }, [currentPage, searchKeyword, searchCategory])

  useEffect(() => {
    if (showModal) {
      editBsModal.current.show()
    } else {
      editBsModal.current?.hide()
    }
  }, [showModal])

  useEffect(() => {
    if (showDeleteModal) {
      deleteBsModal.current.show()
    } else {
      deleteBsModal.current?.hide()
    }
  }, [showDeleteModal])

  useEffect(() => {
    if (showCsvModal) {
      csvBsModal.current.show()
    } else {
      csvBsModal.current?.hide()
    }
  }, [showCsvModal])

  const loadFoods = async () => {
    const result = await getFoods({
      keyword: searchKeyword,
      category: searchCategory || undefined,
      page: currentPage,
      limit: PAGE_SIZE
    })
    setListResult(result)
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setCurrentPage(1)
    loadFoods()
  }

  const openAdd = () => {
    setEditingFood(null)
    setFormData({ ...emptyForm(), foodId: '' })
    setShowModal(true)
  }

  const openEdit = (food) => {
    setEditingFood(food)
    setFormData({
      foodId: food.foodId,
      foodName: food.foodName,
      category: food.category,
      servingSize: food.servingSize,
      servingUnit: food.servingUnit,
      caloriesPerServing: food.caloriesPerServing,
      proteinPerServing: food.proteinPerServing,
      fatPerServing: food.fatPerServing,
      carbPerServing: food.carbPerServing,
      isCustom: food.isCustom ?? false
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!formData.foodName.trim()) {
      showToast('請輸入食物名稱', 'warning')
      return
    }
    const payload = {
      foodName: formData.foodName.trim(),
      category: formData.category,
      servingSize: Number(formData.servingSize),
      servingUnit: formData.servingUnit,
      caloriesPerServing: Number(formData.caloriesPerServing),
      proteinPerServing: Number(formData.proteinPerServing),
      fatPerServing: Number(formData.fatPerServing),
      carbPerServing: Number(formData.carbPerServing),
      isCustom: formData.isCustom
    }
    try {
      if (editingFood) {
        await updateFood(editingFood.foodId, payload)
        showToast('食物已更新', 'success')
      } else {
        await addFood(payload)
        showToast('食物已新增', 'success')
      }
      setShowModal(false)
      loadFoods()
    } catch (err) {
      showToast(err.response?.data?.detail || '操作失敗', 'danger')
    }
  }

  const openDelete = (foodId) => {
    setPendingDeleteId(foodId)
    setShowDeleteModal(true)
  }

  const handleDelete = async () => {
    try {
      await deleteFood(pendingDeleteId)
      showToast('食物已刪除', 'success')
    } catch (err) {
      showToast(err.response?.data?.detail || '刪除失敗', 'danger')
    }
    setShowDeleteModal(false)
    setPendingDeleteId(null)
    loadFoods()
  }

  const handleCsvImport = async () => {
    if (!csvText.trim()) {
      showToast('請貼上 CSV 內容', 'warning')
      return
    }
    try {
      const result = await importFoodsFromCsv(csvText)
      if (result.success > 0) {
        showToast(`成功匯入 ${result.success} 筆，失敗 ${result.failed} 筆`, result.failed > 0 ? 'warning' : 'success')
      } else {
        showToast(`匯入失敗：${result.errors?.[0] || '未知錯誤'}`, 'danger')
      }
    } catch {
      showToast('匯入失敗', 'danger')
    }
    setCsvText('')
    setShowCsvModal(false)
    loadFoods()
  }

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  return (
    <div className="container-fluid p-3">
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
        <h1 className="h5 fw-bold mb-0">食物資料庫管理</h1>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary btn-sm" onClick={() => setShowCsvModal(true)}>
            <i className="bi bi-upload me-1"></i>CSV 匯入
          </button>
          <button className="btn btn-success btn-sm" onClick={openAdd}>
            <i className="bi bi-plus-lg me-1"></i>新增食物
          </button>
        </div>
      </div>

      {/* 搜尋列 */}
      <form className="row g-2 mb-3" onSubmit={handleSearch}>
        <div className="col-12 col-md-5">
          <input
            type="text"
            className="form-control form-control-sm"
            placeholder="搜尋食物名稱..."
            value={searchKeyword}
            onChange={e => { setSearchKeyword(e.target.value); setCurrentPage(1) }}
          />
        </div>
        <div className="col-12 col-md-4">
          <select
            className="form-select form-select-sm"
            value={searchCategory}
            onChange={e => { setSearchCategory(e.target.value); setCurrentPage(1) }}
          >
            <option value="">全部類別</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="col-auto">
          <button type="submit" className="btn btn-primary btn-sm">搜尋</button>
        </div>
      </form>

      {/* 表格 */}
      <div className="table-responsive">
        <table className="table table-sm table-hover align-middle">
          <thead className="table-light">
            <tr>
              <th>ID</th>
              <th>名稱</th>
              <th>類別</th>
              <th>份量</th>
              <th>熱量(kcal)</th>
              <th>蛋白質(g)</th>
              <th>脂肪(g)</th>
              <th>碳水(g)</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {listResult.items.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center text-secondary py-4">無資料</td>
              </tr>
            ) : (
              listResult.items.map(food => (
                <tr key={food.foodId}>
                  <td className="text-secondary small">{food.foodId}</td>
                  <td>{food.foodName}</td>
                  <td>{food.category}</td>
                  <td>{food.servingSize} {food.servingUnit}</td>
                  <td>{food.caloriesPerServing}</td>
                  <td>{food.proteinPerServing}</td>
                  <td>{food.fatPerServing}</td>
                  <td>{food.carbPerServing}</td>
                  <td>
                    <div className="d-flex gap-1">
                      <button
                        className="btn btn-outline-primary btn-sm"
                        onClick={() => openEdit(food)}
                      >
                        編輯
                      </button>
                      <button
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => openDelete(food.foodId)}
                      >
                        刪除
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 分頁 */}
      {listResult.totalPages > 1 && (
        <nav aria-label="食物列表分頁">
          <ul className="pagination pagination-sm justify-content-center">
            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
              <button className="page-link" onClick={() => setCurrentPage(p => p - 1)}>上一頁</button>
            </li>
            {Array.from({ length: listResult.totalPages }, (_, i) => i + 1).map(p => (
              <li key={p} className={`page-item ${currentPage === p ? 'active' : ''}`}>
                <button className="page-link" onClick={() => setCurrentPage(p)}>{p}</button>
              </li>
            ))}
            <li className={`page-item ${currentPage === listResult.totalPages ? 'disabled' : ''}`}>
              <button className="page-link" onClick={() => setCurrentPage(p => p + 1)}>下一頁</button>
            </li>
          </ul>
        </nav>
      )}

      <div className="text-secondary small mt-1">共 {listResult.total} 筆</div>

      {/* 新增/編輯 Modal */}
      <div className="modal fade" ref={editModalRef} tabIndex="-1" aria-labelledby="foodModalLabel" aria-hidden="true">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="foodModalLabel">
                {editingFood ? '編輯食物' : '新增食物'}
              </h5>
              <button type="button" className="btn-close" onClick={() => setShowModal(false)} aria-label="關閉"></button>
            </div>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label">食物 ID</label>
                <input
                  type="text"
                  className="form-control"
                  name="foodId"
                  value={formData.foodId}
                  onChange={handleFormChange}
                  disabled={!!editingFood}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">食物名稱 <span className="text-danger">*</span></label>
                <input
                  type="text"
                  className="form-control"
                  name="foodName"
                  value={formData.foodName}
                  onChange={handleFormChange}
                  placeholder="請輸入食物名稱"
                />
              </div>
              <div className="row g-2 mb-3">
                <div className="col-6">
                  <label className="form-label">類別</label>
                  <select className="form-select" name="category" value={formData.category} onChange={handleFormChange}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="col-3">
                  <label className="form-label">份量</label>
                  <input type="number" className="form-control" name="servingSize" value={formData.servingSize} onChange={handleFormChange} min={0} />
                </div>
                <div className="col-3">
                  <label className="form-label">單位</label>
                  <input type="text" className="form-control" name="servingUnit" value={formData.servingUnit} onChange={handleFormChange} />
                </div>
              </div>
              <div className="row g-2 mb-3">
                <div className="col-6">
                  <label className="form-label">熱量 (kcal)</label>
                  <input type="number" className="form-control" name="caloriesPerServing" value={formData.caloriesPerServing} onChange={handleFormChange} min={0} />
                </div>
                <div className="col-6">
                  <label className="form-label">蛋白質 (g)</label>
                  <input type="number" className="form-control" name="proteinPerServing" value={formData.proteinPerServing} onChange={handleFormChange} min={0} step="0.1" />
                </div>
              </div>
              <div className="row g-2 mb-3">
                <div className="col-6">
                  <label className="form-label">脂肪 (g)</label>
                  <input type="number" className="form-control" name="fatPerServing" value={formData.fatPerServing} onChange={handleFormChange} min={0} step="0.1" />
                </div>
                <div className="col-6">
                  <label className="form-label">碳水化合物 (g)</label>
                  <input type="number" className="form-control" name="carbPerServing" value={formData.carbPerServing} onChange={handleFormChange} min={0} step="0.1" />
                </div>
              </div>
              <div className="form-check">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="isCustomCheck"
                  name="isCustom"
                  checked={formData.isCustom}
                  onChange={handleFormChange}
                />
                <label className="form-check-label" htmlFor="isCustomCheck">自訂食物</label>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>取消</button>
              <button type="button" className="btn btn-success" onClick={handleSave}>儲存</button>
            </div>
          </div>
        </div>
      </div>

      {/* 刪除確認 Modal */}
      <div className="modal fade" ref={deleteModalRef} tabIndex="-1" aria-labelledby="deleteFoodLabel" aria-hidden="true">
        <div className="modal-dialog modal-sm">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="deleteFoodLabel">確認刪除</h5>
              <button type="button" className="btn-close" onClick={() => setShowDeleteModal(false)} aria-label="關閉"></button>
            </div>
            <div className="modal-body">確定要刪除此食物嗎？若已被飲食紀錄引用則無法刪除。</div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>取消</button>
              <button type="button" className="btn btn-danger" onClick={handleDelete}>確認刪除</button>
            </div>
          </div>
        </div>
      </div>

      {/* CSV 匯入 Modal */}
      <div className="modal fade" ref={csvModalRef} tabIndex="-1" aria-labelledby="csvModalLabel" aria-hidden="true">
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="csvModalLabel">CSV 批次匯入食物</h5>
              <button type="button" className="btn-close" onClick={() => setShowCsvModal(false)} aria-label="關閉"></button>
            </div>
            <div className="modal-body">
              <p className="small text-secondary mb-2">
                格式（含標題行）：<code>foodName,category,servingSize,servingUnit,caloriesPerServing,proteinPerServing,fatPerServing,carbPerServing</code>
              </p>
              <textarea
                className="form-control font-monospace"
                rows={10}
                placeholder="貼上 CSV 內容..."
                value={csvText}
                onChange={e => setCsvText(e.target.value)}
              />
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowCsvModal(false)}>取消</button>
              <button type="button" className="btn btn-primary" onClick={handleCsvImport}>開始匯入</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
