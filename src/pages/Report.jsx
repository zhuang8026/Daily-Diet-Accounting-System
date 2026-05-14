import { useState, useEffect } from 'react'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js'
import { Line, Doughnut } from 'react-chartjs-2'
import { useAuth } from '@/context/AuthContext'
import { getDateRangeSummary } from '@/assets/api/recordService'
import { getTargets } from '@/assets/api/profileService'
import { offsetDate, getTodayISO } from '@/assets/api/utils'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler)

const centerTotalPlugin = {
  id: 'centerTotal',
  afterDatasetsDraw(chart, _, pluginOptions) {
    if (!pluginOptions?.show) return
    const { ctx, chartArea: { width, height, left, top } } = chart
    const total = pluginOptions.total
    ctx.save()
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const cx = left + width / 2, cy = top + height / 2
    ctx.font = 'bold 16px sans-serif'
    ctx.fillStyle = '#2e7d32'
    ctx.fillText(total, cx, cy - 8)
    ctx.font = '11px sans-serif'
    ctx.fillStyle = '#757575'
    ctx.fillText('kcal', cx, cy + 10)
    ctx.restore()
  }
}

export default function Report() {
  const { session } = useAuth()
  const [days, setDays] = useState('7')
  const [data, setData] = useState([])
  const [targets, setTargets] = useState({})

  useEffect(() => {
    const t = getTargets(session.userId)
    setTargets(t)
  }, [session.userId])

  useEffect(() => {
    const today = getTodayISO()
    const startDate = offsetDate(today, -(parseInt(days, 10) - 1))
    setData(getDateRangeSummary(session.userId, startDate, today))
  }, [days, session.userId])

  const daysWithData = data.filter(d => d.hasData).length
  const totalCal = data.reduce((s, d) => s + d.totalCalories, 0)
  const avgCal = daysWithData > 0 ? Math.round(totalCal / daysWithData) : 0
  const maxDay = data.reduce((max, d) => d.totalCalories > (max?.totalCalories ?? -1) ? d : max, null)
  const minDay = data.filter(d => d.hasData).reduce((min, d) => !min || d.totalCalories < min.totalCalories ? d : min, null)

  const totalProtein = data.reduce((s, d) => s + d.totalProtein, 0)
  const totalFat = data.reduce((s, d) => s + d.totalFat, 0)
  const totalCarb = data.reduce((s, d) => s + d.totalCarb, 0)
  const hasNutrient = totalProtein + totalFat + totalCarb > 0

  const trendData = {
    labels: data.map(d => d.date.slice(5)),
    datasets: [
      {
        label: '實際攝取',
        data: data.map(d => d.totalCalories),
        borderColor: '#2e7d32',
        backgroundColor: 'rgba(46,125,50,0.08)',
        fill: true, tension: 0.3,
        pointBackgroundColor: data.map(d => d.hasData ? '#2e7d32' : 'transparent'),
        pointBorderColor: '#2e7d32',
        pointBorderWidth: 2, pointRadius: 5
      },
      {
        label: '目標熱量',
        data: data.map(() => targets.targetCalories || 0),
        borderColor: '#bdbdbd',
        borderDash: [6, 4], fill: false, pointRadius: 0, tension: 0
      }
    ]
  }

  const trendOptions = {
    responsive: true, maintainAspectRatio: false,
    scales: { x: { grid: { display: false } }, y: { beginAtZero: true, title: { display: true, text: 'kcal' } } },
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (ctx) => {
        const d = data[ctx.dataIndex]
        if (ctx.datasetIndex === 0 && !d?.hasData) return '無紀錄'
        return `${ctx.dataset.label}: ${ctx.parsed.y} kcal`
      }}}
    }
  }

  const nutrientData = {
    labels: ['蛋白質', '脂肪', '碳水化合物'],
    datasets: [{ data: hasNutrient ? [totalProtein, totalFat, totalCarb] : [1, 1, 1], backgroundColor: ['#1565c0', '#e65100', '#2e7d32'], borderWidth: 2 }]
  }

  const nutrientOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: { position: 'bottom' },
      tooltip: { callbacks: { label: (ctx) => {
        if (!hasNutrient) return '無資料'
        const vals = [totalProtein, totalFat, totalCarb]
        const total = vals.reduce((s, v) => s + v, 0)
        const pct = total > 0 ? ((vals[ctx.dataIndex] / total) * 100).toFixed(1) : 0
        return `${ctx.label}: ${vals[ctx.dataIndex].toFixed(1)}g (${pct}%)`
      }}},
      centerTotal: { show: hasNutrient, total: totalCal }
    }
  }

  const summaryRows = [
    { label: '統計天數', value: `${days} 天（有紀錄 ${daysWithData} 天）` },
    { label: '平均每日熱量', value: `${avgCal} kcal` },
    { label: '熱量目標', value: `${targets.targetCalories || 0} kcal / 天` },
    { label: '最高熱量日', value: maxDay?.hasData ? `${maxDay.date}（${maxDay.totalCalories} kcal）` : '—' },
    { label: '最低熱量日', value: minDay ? `${minDay.date}（${minDay.totalCalories} kcal）` : '—' }
  ]

  return (
    <div className="container-fluid p-3">
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
        <h1 className="h5 fw-500 mb-0">趨勢報表</h1>
        <div className="" role="group" aria-label="報表時間範圍">
          {['7', '30'].map(d => (
            <label key={d} className={`ms-2 btn btn-outline-success ${days === d ? 'active' : ''}`}>
              <input type="radio" name="range" value={d} checked={days === d} onChange={() => setDays(d)} className="btn-check" data-testid={`range-${d}`} />
              近 {d} 天
            </label>
          ))}
        </div>
      </div>

      <div className="card p-3 mb-4">
        <h2 className="h6 text-secondary mb-3">熱量趨勢</h2>
        <div style={{ position: 'relative', height: 280 }}>
          <Line data={trendData} options={trendOptions} />
        </div>
        <div className="d-flex gap-4 mt-2 small justify-content-center">
          <span><span className="d-inline-block me-1 rounded-circle" style={{ width: 12, height: 12, background: '#2e7d32' }}></span>實際攝取</span>
          <span><span className="d-inline-block me-1 rounded-circle" style={{ width: 12, height: 12, background: '#bdbdbd' }}></span>目標熱量</span>
        </div>
      </div>

      <div className="row g-3">
        <div className="col-12 col-md-5">
          <div className="card p-3">
            <h2 className="h6 text-secondary mb-3">三大營養素比例</h2>
            <div style={{ position: 'relative', height: 240 }}>
              <Doughnut data={nutrientData} options={nutrientOptions} plugins={[centerTotalPlugin]} />
            </div>
          </div>
        </div>
        <div className="col-12 col-md-7">
          <div className="card p-3 h-100">
            <h2 className="h6 text-secondary mb-3">摘要統計</h2>
            <table className="table table-sm">
              <caption className="visually-hidden">摘要統計</caption>
              <tbody>
                {summaryRows.map(({ label, value }) => (
                  <tr key={label}>
                    <th scope="row" className="text-secondary fw-normal small">{label}</th>
                    <td className="fw-500">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
