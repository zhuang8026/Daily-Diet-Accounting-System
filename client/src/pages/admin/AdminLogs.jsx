import { useState, useEffect, useCallback } from 'react'
import apiClient from '@/assets/api/apiClient'

const ACTION_BADGE = {
  AUTH_LOGIN:         'bg-info text-dark',
  AUTH_REGISTER:      'bg-primary',
  ADD_FOOD:           'bg-success',
  UPDATE_FOOD:        'bg-warning text-dark',
  DELETE_FOOD:        'bg-danger',
  IMPORT_FOOD_CSV:    'bg-success',
  DELETE_USER:        'bg-danger',
  UPDATE_USER_STATUS: 'bg-warning text-dark',
  UPDATE_USER_ROLE:   'bg-warning text-dark',
  RESET_PASSWORD:     'bg-secondary',
  DELETE_RECORD:      'bg-danger',
}

export default function AdminLogs() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  const loadLogs = useCallback(async () => {
    setLoading(true)
    const { data } = await apiClient.get('/admin/logs')
    setLogs(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    loadLogs()
  }, [loadLogs])

  return (
    <div className="container-fluid p-3">
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
        <h1 className="h5 fw-bold mb-0">操作紀錄</h1>
        <button className="btn btn-outline-secondary btn-sm" onClick={loadLogs} disabled={loading}>
          <i className="bi bi-arrow-clockwise me-1"></i>重新整理
        </button>
      </div>

      <div className="text-secondary small mb-2">共 {logs.length} 筆（最新在前）</div>

      <div className="table-responsive">
        <table className="table table-sm table-hover align-middle">
          <thead className="table-light">
            <tr>
              <th style={{ whiteSpace: 'nowrap' }}>時間</th>
              <th>操作者</th>
              <th>操作類型</th>
              <th>詳情</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="text-center text-secondary py-4">載入中...</td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center text-secondary py-4">尚無操作紀錄</td>
              </tr>
            ) : (
              logs.map((log, i) => (
                <tr key={i}>
                  <td className="text-secondary small font-monospace" style={{ whiteSpace: 'nowrap' }}>
                    {log.timestamp}
                  </td>
                  <td className="small">{log.user}</td>
                  <td>
                    <span className={`badge ${ACTION_BADGE[log.action] || 'bg-secondary'}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="small">{log.detail}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
