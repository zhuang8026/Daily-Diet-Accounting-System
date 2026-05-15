import { useState, useEffect } from 'react'
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import apiClient from '@/assets/api/apiClient'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const EMPTY_STATS = { todayActiveCount: 0, todayRecordCount: 0, weekRecordCount: 0, foodDbCount: 0, topFoods: [], todayUsers: [] }

export default function AdminDashboard() {
  const [stats, setStats] = useState(EMPTY_STATS)

  useEffect(() => {
    apiClient.get('/admin/stats').then(r => setStats(r.data)).catch(() => {})
  }, [])

  const statCards = [
    { label: '今日活躍使用者', value: stats.todayActiveCount, icon: 'bi-people-fill', color: 'primary' },
    { label: '今日飲食紀錄筆數', value: stats.todayRecordCount, icon: 'bi-journal-text', color: 'success' },
    { label: '本週累計紀錄筆數', value: stats.weekRecordCount, icon: 'bi-calendar-week', color: 'warning' },
    { label: '食物資料庫總筆數', value: stats.foodDbCount, icon: 'bi-database-fill', color: 'info' }
  ]

  const chartData = {
    labels: stats.topFoods.map(f => f.name),
    datasets: [
      {
        label: '記錄次數',
        data: stats.topFoods.map(f => f.count),
        backgroundColor: '#2e7d32',
        borderRadius: 4
      }
    ]
  }

  const chartOptions = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { x: { beginAtZero: true, ticks: { stepSize: 1 } } }
  }

  return (
    <div className="container-fluid p-3">
      <h1 className="h5 fw-bold mb-4">統計儀表板</h1>

      <div className="row g-3 mb-4">
        {statCards.map(card => (
          <div key={card.label} className="col-6 col-lg-3">
            <div className="card p-3">
              <div className="d-flex align-items-center gap-3">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center"
                  style={{ width: 48, height: 48, backgroundColor: `var(--bs-${card.color}-bg-subtle)` }}
                >
                  <i className={`bi ${card.icon} text-${card.color} fs-5`}></i>
                </div>
                <div>
                  <div className="fs-4 fw-bold">{card.value}</div>
                  <div className="small text-secondary">{card.label}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="row g-3">
        <div className="col-12 col-lg-7">
          <div className="card p-3">
            <h2 className="h6 text-secondary mb-3">本週最常記錄的前 10 大食物</h2>
            {stats.topFoods.length === 0 ? (
              <p className="text-secondary text-center py-4">本週尚無飲食紀錄</p>
            ) : (
              <div style={{ position: 'relative', height: 260 }}>
                <Bar
                  data={chartData}
                  options={chartOptions}
                  aria-label="前 10 大食物長條圖"
                  role="img"
                />
              </div>
            )}
          </div>
        </div>

        <div className="col-12 col-lg-5">
          <div className="card p-3">
            <h2 className="h6 text-secondary mb-3">今日有記錄的使用者</h2>
            {stats.todayUsers.length === 0 ? (
              <p className="text-secondary text-center py-4 small">今日尚無使用者有飲食紀錄</p>
            ) : (
              <table className="table table-sm table-hover">
                <caption className="visually-hidden">今日有記錄的使用者清單</caption>
                <thead className="table-light">
                  <tr>
                    <th scope="col">使用者</th>
                    <th scope="col">Email</th>
                    <th scope="col">筆數</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.todayUsers.map((u) => (
                    <tr key={u.email}>
                      <th scope="row">{u.displayName}</th>
                      <td>{u.email}</td>
                      <td>{u.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
