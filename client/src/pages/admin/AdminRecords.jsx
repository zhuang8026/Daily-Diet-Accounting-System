import { useState, useEffect, useRef } from 'react'
import { Modal } from 'bootstrap'
import { useToast } from '@/context/ToastContext'
import { getAllRecordsForAdmin, adminDeleteRecord } from '@/assets/api/recordService'
import { getMealLabel, getTodayISO, offsetDate } from '@/assets/api/utils'

export default function AdminRecords() {
  const { showToast } = useToast()
  const today = getTodayISO()

  const [filters, setFilters] = useState({
    startDate: offsetDate(today, -6),
    endDate: today,
    mealType: '',
    userEmail: ''
  })
  const [records, setRecords] = useState([])
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [pendingDelete, setPendingDelete] = useState(null) // { userId, recordId }

  const deleteModalRef = useRef(null)
  const deleteBsModal = useRef(null)

  useEffect(() => {
    deleteBsModal.current = new Modal(deleteModalRef.current)
  }, [])

  useEffect(() => {
    if (showDeleteModal) {
      deleteBsModal.current.show()
    } else {
      deleteBsModal.current?.hide()
    }
  }, [showDeleteModal])

  useEffect(() => {
    loadRecords()
  }, [filters])

  const loadRecords = async () => {
    const result = await getAllRecordsForAdmin({
      startDate: filters.startDate,
      endDate: filters.endDate,
      mealType: filters.mealType || undefined,
      userEmail: filters.userEmail || undefined
    })
    setRecords(result)
  }

  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters(prev => ({ ...prev, [name]: value }))
  }

  const openDelete = (recordId) => {
    setPendingDelete({ recordId })
    setShowDeleteModal(true)
  }

  const handleDelete = async () => {
    try {
      await adminDeleteRecord(pendingDelete.recordId)
      showToast('紀錄已刪除', 'success')
    } catch {
      showToast('刪除失敗', 'danger')
    }
    setShowDeleteModal(false)
    setPendingDelete(null)
    loadRecords()
  }

  const exportCsv = () => {
    if (records.length === 0) {
      showToast('無資料可匯出', 'warning')
      return
    }
    const header = ['recordId', 'displayName', 'email', 'recordDate', 'mealType', 'foodName', 'servingAmount', 'calories', 'protein', 'fat', 'carb']
    const rows = records.map(r => [
      r.recordId,
      r.displayName,
      r.userEmail,
      r.recordDate,
      getMealLabel(r.mealType),
      r.foodName,
      r.servingAmount,
      r.calories,
      r.protein,
      r.fat,
      r.carbohydrate
    ])
    const csvContent = [header, ...rows].map(row => row.join(',')).join('\n')
    downloadBlob(csvContent, 'text/csv;charset=utf-8;', `ddas_records_${today}.csv`)
  }

  const exportJson = () => {
    if (records.length === 0) {
      showToast('無資料可匯出', 'warning')
      return
    }
    const jsonContent = JSON.stringify(records, null, 2)
    downloadBlob(jsonContent, 'application/json', `ddas_records_${today}.json`)
  }

  const downloadBlob = (content, mimeType, filename) => {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="container-fluid p-3">
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
        <h1 className="h5 fw-bold mb-0">飲食紀錄管理</h1>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary btn-sm" onClick={exportCsv}>
            <i className="bi bi-filetype-csv me-1"></i>匯出 CSV
          </button>
          <button className="btn btn-outline-secondary btn-sm" onClick={exportJson}>
            <i className="bi bi-filetype-json me-1"></i>匯出 JSON
          </button>
        </div>
      </div>

      {/* 篩選列 */}
      <div className="row g-2 mb-3 align-items-end">
        <div className="col-6 col-md-2">
          <label className="form-label small mb-1">開始日期</label>
          <input
            type="date"
            className="form-control form-control-sm"
            name="startDate"
            value={filters.startDate}
            onChange={handleFilterChange}
          />
        </div>
        <div className="col-6 col-md-2">
          <label className="form-label small mb-1">結束日期</label>
          <input
            type="date"
            className="form-control form-control-sm"
            name="endDate"
            value={filters.endDate}
            onChange={handleFilterChange}
          />
        </div>
        <div className="col-6 col-md-2">
          <label className="form-label small mb-1">餐別</label>
          <select
            className="form-select form-select-sm"
            name="mealType"
            value={filters.mealType}
            onChange={handleFilterChange}
          >
            <option value="">全部</option>
            <option value="breakfast">早餐</option>
            <option value="lunch">午餐</option>
            <option value="dinner">晚餐</option>
            <option value="snack">點心</option>
          </select>
        </div>
        <div className="col-12 col-md-4">
          <label className="form-label small mb-1">使用者 Email</label>
          <input
            type="text"
            className="form-control form-control-sm"
            name="userEmail"
            value={filters.userEmail}
            onChange={handleFilterChange}
            placeholder="篩選使用者 Email..."
          />
        </div>
      </div>

      <div className="text-secondary small mb-2">共 {records.length} 筆</div>

      {/* 表格 */}
      <div className="table-responsive">
        <table className="table table-sm table-hover align-middle">
          <thead className="table-light">
            <tr>
              <th>ID</th>
              <th>使用者</th>
              <th>日期</th>
              <th>餐別</th>
              <th>食物</th>
              <th>份量</th>
              <th>熱量</th>
              <th>蛋白質</th>
              <th>脂肪</th>
              <th>碳水</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr>
                <td colSpan={11} className="text-center text-secondary py-4">無資料</td>
              </tr>
            ) : (
              records.map(r => (
                <tr key={r.recordId}>
                  <td className="text-secondary small font-monospace">{r.recordId}</td>
                  <td>
                    <div>{r.displayName}</div>
                    <div className="text-secondary small">{r.userEmail}</div>
                  </td>
                  <td>{r.recordDate}</td>
                  <td>{getMealLabel(r.mealType)}</td>
                  <td>{r.foodName}</td>
                  <td>{r.servingAmount}</td>
                  <td>{r.calories}</td>
                  <td>{r.protein}</td>
                  <td>{r.fat}</td>
                  <td>{r.carbohydrate}</td>
                  <td>
                    <button
                      className="btn btn-outline-danger btn-sm"
                      onClick={() => openDelete(r.recordId)}
                    >
                      刪除
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 刪除確認 Modal */}
      <div className="modal fade" ref={deleteModalRef} tabIndex="-1" aria-labelledby="deleteRecordLabel" aria-hidden="true">
        <div className="modal-dialog modal-sm">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="deleteRecordLabel">確認刪除</h5>
              <button type="button" className="btn-close" onClick={() => setShowDeleteModal(false)} aria-label="關閉"></button>
            </div>
            <div className="modal-body">確定要刪除此飲食紀錄？此操作無法復原。</div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>取消</button>
              <button type="button" className="btn btn-danger" onClick={handleDelete}>確認刪除</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
