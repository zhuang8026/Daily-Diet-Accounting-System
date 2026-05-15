import { useState, useEffect, useRef } from 'react'
import { Modal } from 'bootstrap'
import { useToast } from '@/context/ToastContext'
import { useAuth } from '@/context/AuthContext'
import apiClient from '@/assets/api/apiClient'

export default function AdminUsers() {
  const { showToast } = useToast()
  const { session } = useAuth()

  const [users, setUsers] = useState([])
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showResetModal, setShowResetModal] = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState(null)
  const [resetTarget, setResetTarget] = useState(null) // { userId, displayName }
  const [tempPassword, setTempPassword] = useState('')
  const [copied, setCopied] = useState(false)

  const deleteModalRef = useRef(null)
  const deleteBsModal = useRef(null)
  const resetModalRef = useRef(null)
  const resetBsModal = useRef(null)

  useEffect(() => {
    deleteBsModal.current = new Modal(deleteModalRef.current)
    resetBsModal.current = new Modal(resetModalRef.current)
  }, [])

  useEffect(() => {
    if (showDeleteModal) {
      deleteBsModal.current.show()
    } else {
      deleteBsModal.current?.hide()
    }
  }, [showDeleteModal])

  useEffect(() => {
    if (showResetModal) {
      resetBsModal.current.show()
    } else {
      resetBsModal.current?.hide()
    }
  }, [showResetModal])

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    const { data } = await apiClient.get('/admin/users')
    setUsers(data)
  }

  const toggleActive = async (userId) => {
    const user = users.find(u => u.userId === userId)
    try {
      await apiClient.put(`/admin/users/${userId}/status`, { isActive: !user.isActive })
      showToast('使用者狀態已更新', 'success')
      loadUsers()
    } catch (err) {
      showToast(err.response?.data?.detail || '操作失敗', 'danger')
    }
  }

  const changeRole = async (userId, newRole) => {
    try {
      await apiClient.put(`/admin/users/${userId}/role`, { role: newRole })
      showToast('角色已變更', 'success')
      loadUsers()
    } catch (err) {
      showToast(err.response?.data?.detail || '操作失敗', 'danger')
    }
  }

  const openDelete = (userId) => {
    if (userId === session?.userId) {
      showToast('無法刪除目前登入的帳號', 'warning')
      return
    }
    setPendingDeleteId(userId)
    setShowDeleteModal(true)
  }

  const handleDelete = async () => {
    try {
      await apiClient.delete(`/admin/users/${pendingDeleteId}`)
      showToast('使用者已刪除', 'success')
    } catch (err) {
      showToast(err.response?.data?.detail || '刪除失敗', 'danger')
    }
    setShowDeleteModal(false)
    setPendingDeleteId(null)
    loadUsers()
  }

  const openResetPassword = (user) => {
    setResetTarget({ userId: user.userId, displayName: user.displayName })
    setTempPassword('')
    setCopied(false)
    setShowResetModal(true)
  }

  const handleResetPassword = async () => {
    const tempPwd = `Tmp@${Math.random().toString(36).slice(2, 8)}${Math.floor(Math.random() * 90 + 10)}`
    try {
      await apiClient.post(`/admin/users/${resetTarget.userId}/reset-password`, { newPassword: tempPwd })
      setTempPassword(tempPwd)
      showToast('臨時密碼已產生', 'success')
    } catch {
      showToast('密碼重設失敗', 'danger')
    }
  }

  const copyTempPassword = () => {
    if (!tempPassword) return
    navigator.clipboard.writeText(tempPassword).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {
      showToast('複製失敗，請手動複製', 'warning')
    })
  }

  const getRoleBadge = (role) => {
    if (role === 'admin') return <span className="badge bg-danger">管理員</span>
    return <span className="badge bg-secondary">一般使用者</span>
  }

  return (
    <div className="container-fluid p-3">
      <h1 className="h5 fw-bold mb-4">使用者管理</h1>

      <div className="text-secondary small mb-2">共 {users.length} 位使用者</div>

      <div className="table-responsive">
        <table className="table table-sm table-hover align-middle">
          <thead className="table-light">
            <tr>
              <th>顯示名稱</th>
              <th>Email</th>
              <th>角色</th>
              <th>狀態</th>
              <th>建立時間</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center text-secondary py-4">無使用者資料</td>
              </tr>
            ) : (
              users.map(user => (
                <tr key={user.userId}>
                  <td>
                    <div className="fw-medium">{user.displayName}</div>
                    {user.userId === session?.userId && (
                      <span className="badge bg-primary-subtle text-primary small">目前登入</span>
                    )}
                  </td>
                  <td>{user.email}</td>
                  <td>
                    <div className="d-flex align-items-center gap-2">
                      {getRoleBadge(user.role)}
                      {user.userId !== session?.userId && (
                        <select
                          className="form-select form-select-sm"
                          style={{ width: 'auto' }}
                          value={user.role}
                          onChange={e => changeRole(user.userId, e.target.value)}
                          aria-label="變更角色"
                        >
                          <option value="user">一般使用者</option>
                          <option value="admin">管理員</option>
                        </select>
                      )}
                    </div>
                  </td>
                  <td>
                    {user.isActive !== false ? (
                      <span className="badge bg-success">啟用</span>
                    ) : (
                      <span className="badge bg-secondary">停用</span>
                    )}
                  </td>
                  <td className="small text-secondary">
                    {user.createdAt ? user.createdAt.slice(0, 10) : '-'}
                  </td>
                  <td>
                    <div className="d-flex gap-1 flex-wrap">
                      {user.userId !== session?.userId && (
                        <button
                          className={`btn btn-sm ${user.isActive !== false ? 'btn-outline-warning' : 'btn-outline-success'}`}
                          onClick={() => toggleActive(user.userId)}
                        >
                          {user.isActive !== false ? '停用' : '啟用'}
                        </button>
                      )}
                      <button
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => openResetPassword(user)}
                      >
                        重設密碼
                      </button>
                      {user.userId !== session?.userId && (
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => openDelete(user.userId)}
                        >
                          刪除
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 刪除確認 Modal */}
      <div className="modal fade" ref={deleteModalRef} tabIndex="-1" aria-labelledby="deleteUserLabel" aria-hidden="true">
        <div className="modal-dialog modal-sm">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="deleteUserLabel">確認刪除使用者</h5>
              <button type="button" className="btn-close" onClick={() => setShowDeleteModal(false)} aria-label="關閉"></button>
            </div>
            <div className="modal-body">確定要刪除此使用者帳號？此操作無法復原。</div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>取消</button>
              <button type="button" className="btn btn-danger" onClick={handleDelete}>確認刪除</button>
            </div>
          </div>
        </div>
      </div>

      {/* 重設密碼 Modal */}
      <div className="modal fade" ref={resetModalRef} tabIndex="-1" aria-labelledby="resetPwdLabel" aria-hidden="true">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="resetPwdLabel">
                重設密碼 — {resetTarget?.displayName}
              </h5>
              <button type="button" className="btn-close" onClick={() => setShowResetModal(false)} aria-label="關閉"></button>
            </div>
            <div className="modal-body">
              {tempPassword ? (
                <div>
                  <p className="mb-2">臨時密碼已產生，請將此密碼告知使用者：</p>
                  <div className="input-group">
                    <input
                      type="text"
                      className="form-control font-monospace"
                      value={tempPassword}
                      readOnly
                      aria-label="臨時密碼"
                    />
                    <button className="btn btn-outline-secondary" onClick={copyTempPassword}>
                      {copied ? <i className="bi bi-check-lg text-success"></i> : <i className="bi bi-clipboard"></i>}
                    </button>
                  </div>
                  <p className="text-warning small mt-2">
                    <i className="bi bi-exclamation-triangle me-1"></i>
                    使用者下次登入時需強制變更密碼。
                  </p>
                </div>
              ) : (
                <p>點擊「產生臨時密碼」以重設此使用者的密碼。</p>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowResetModal(false)}>關閉</button>
              {!tempPassword && (
                <button type="button" className="btn btn-warning" onClick={handleResetPassword}>
                  產生臨時密碼
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
