import { useState, useEffect, useRef } from 'react'
import { Modal } from 'bootstrap'
import { useToast } from '../../context/ToastContext'
import {
  getAnnouncements,
  addAnnouncement,
  updateAnnouncement,
  deleteAnnouncement
} from '../../services/announcementService'
import { getTodayISO, sanitizeInput } from '../../services/utils'

const emptyForm = (today) => ({
  title: '',
  content: '',
  startDate: today,
  endDate: today,
  isActive: true
})

export default function AdminAnnouncements() {
  const { showToast } = useToast()
  const today = getTodayISO()

  const [list, setList] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [editingAnn, setEditingAnn] = useState(null)
  const [formData, setFormData] = useState(emptyForm(today))
  const [pendingDeleteId, setPendingDeleteId] = useState(null)

  const editModalRef = useRef(null)
  const editBsModal = useRef(null)
  const deleteModalRef = useRef(null)
  const deleteBsModal = useRef(null)

  useEffect(() => {
    editBsModal.current = new Modal(editModalRef.current)
    deleteBsModal.current = new Modal(deleteModalRef.current)
  }, [])

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
    loadList()
  }, [])

  const loadList = () => {
    setList(getAnnouncements())
  }

  const isEffective = (ann) => {
    return ann.isActive && ann.startDate <= today && ann.endDate >= today
  }

  const openAdd = () => {
    setEditingAnn(null)
    setFormData(emptyForm(today))
    setShowModal(true)
  }

  const openEdit = (ann) => {
    setEditingAnn(ann)
    setFormData({
      title: ann.title,
      content: ann.content,
      startDate: ann.startDate,
      endDate: ann.endDate,
      isActive: ann.isActive
    })
    setShowModal(true)
  }

  const handleSave = () => {
    const title = sanitizeInput(formData.title.trim())
    const content = sanitizeInput(formData.content.trim())

    if (!title) {
      showToast('請輸入公告標題', 'warning')
      return
    }
    if (!content) {
      showToast('請輸入公告內容', 'warning')
      return
    }
    if (formData.startDate > formData.endDate) {
      showToast('開始日期不得晚於結束日期', 'warning')
      return
    }

    const payload = {
      title,
      content,
      startDate: formData.startDate,
      endDate: formData.endDate,
      isActive: formData.isActive
    }

    if (editingAnn) {
      const ok = updateAnnouncement(editingAnn.id, payload)
      if (ok) {
        showToast('公告已更新', 'success')
      } else {
        showToast('更新失敗', 'danger')
      }
    } else {
      addAnnouncement(payload)
      showToast('公告已新增', 'success')
    }

    setShowModal(false)
    loadList()
  }

  const openDelete = (id) => {
    setPendingDeleteId(id)
    setShowDeleteModal(true)
  }

  const handleDelete = () => {
    const ok = deleteAnnouncement(pendingDeleteId)
    if (ok) {
      showToast('公告已刪除', 'success')
    } else {
      showToast('刪除失敗', 'danger')
    }
    setShowDeleteModal(false)
    setPendingDeleteId(null)
    loadList()
  }

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const toggleActive = (ann) => {
    const ok = updateAnnouncement(ann.id, { isActive: !ann.isActive })
    if (ok) {
      showToast(ann.isActive ? '公告已停用' : '公告已啟用', 'success')
      loadList()
    }
  }

  return (
    <div className="container-fluid p-3">
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
        <h1 className="h5 fw-bold mb-0">系統公告管理</h1>
        <button className="btn btn-success btn-sm" onClick={openAdd}>
          <i className="bi bi-plus-lg me-1"></i>新增公告
        </button>
      </div>

      {list.length === 0 ? (
        <p className="text-secondary text-center py-5">尚無公告</p>
      ) : (
        <div className="row g-3">
          {list.map(ann => (
            <div key={ann.id} className="col-12 col-lg-6">
              <div className={`card h-100 ${isEffective(ann) ? 'border-success' : ''}`}>
                <div className="card-body">
                  <div className="d-flex align-items-start justify-content-between gap-2 mb-2">
                    <h2 className="h6 fw-bold mb-0">{ann.title}</h2>
                    <div className="d-flex gap-1 flex-shrink-0">
                      {isEffective(ann) && (
                        <span className="badge bg-success">生效中</span>
                      )}
                      {!ann.isActive && (
                        <span className="badge bg-secondary">已停用</span>
                      )}
                      {ann.isActive && !isEffective(ann) && (
                        <span className="badge bg-warning text-dark">未生效</span>
                      )}
                    </div>
                  </div>

                  <p className="card-text small text-secondary mb-2" style={{ whiteSpace: 'pre-wrap' }}>
                    {ann.content}
                  </p>

                  <div className="text-secondary small mb-3">
                    生效期間：{ann.startDate} ～ {ann.endDate}
                  </div>

                  <div className="d-flex gap-2 flex-wrap">
                    <button
                      className={`btn btn-sm ${ann.isActive ? 'btn-outline-warning' : 'btn-outline-success'}`}
                      onClick={() => toggleActive(ann)}
                    >
                      {ann.isActive ? '停用' : '啟用'}
                    </button>
                    <button className="btn btn-sm btn-outline-primary" onClick={() => openEdit(ann)}>
                      編輯
                    </button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => openDelete(ann.id)}>
                      刪除
                    </button>
                  </div>
                </div>
                <div className="card-footer text-secondary small">
                  建立：{ann.createdAt?.slice(0, 16).replace('T', ' ')}
                  {ann.updatedAt !== ann.createdAt && (
                    <span className="ms-2">更新：{ann.updatedAt?.slice(0, 16).replace('T', ' ')}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 新增/編輯 Modal */}
      <div className="modal fade" ref={editModalRef} tabIndex="-1" aria-labelledby="annModalLabel" aria-hidden="true">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="annModalLabel">
                {editingAnn ? '編輯公告' : '新增公告'}
              </h5>
              <button type="button" className="btn-close" onClick={() => setShowModal(false)} aria-label="關閉"></button>
            </div>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label">標題 <span className="text-danger">*</span></label>
                <input
                  type="text"
                  className="form-control"
                  name="title"
                  value={formData.title}
                  onChange={handleFormChange}
                  placeholder="公告標題（最多 50 字）"
                  maxLength={50}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">內容 <span className="text-danger">*</span></label>
                <textarea
                  className="form-control"
                  name="content"
                  value={formData.content}
                  onChange={handleFormChange}
                  rows={4}
                  placeholder="公告內容（最多 500 字）"
                  maxLength={500}
                />
                <div className="form-text text-end">{formData.content.length} / 500</div>
              </div>
              <div className="row g-2 mb-3">
                <div className="col-6">
                  <label className="form-label">開始日期</label>
                  <input
                    type="date"
                    className="form-control"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleFormChange}
                  />
                </div>
                <div className="col-6">
                  <label className="form-label">結束日期</label>
                  <input
                    type="date"
                    className="form-control"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleFormChange}
                  />
                </div>
              </div>
              <div className="form-check">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="annIsActive"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleFormChange}
                />
                <label className="form-check-label" htmlFor="annIsActive">啟用此公告</label>
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
      <div className="modal fade" ref={deleteModalRef} tabIndex="-1" aria-labelledby="deleteAnnLabel" aria-hidden="true">
        <div className="modal-dialog modal-sm">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="deleteAnnLabel">確認刪除</h5>
              <button type="button" className="btn-close" onClick={() => setShowDeleteModal(false)} aria-label="關閉"></button>
            </div>
            <div className="modal-body">確定要刪除此公告？此操作無法復原。</div>
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
