import { Link } from 'react-router-dom'

export default function About() {
  return (
    <div className="container py-5" style={{ maxWidth: 760 }}>
      <div className="text-center mb-5">
        <i className="bi bi-clipboard2-heart-fill text-success" style={{ fontSize: '3rem' }}></i>
        <h1 className="mt-3">飲食與熱量紀錄系統</h1>
        <p className="lead text-secondary">輕鬆記錄飲食、精準追蹤營養、達成健康目標</p>
        <div className="mt-4 d-flex gap-3 justify-content-center flex-wrap">
          <Link to="/login" className="btn btn-success px-4">立即登入</Link>
          <Link to="/register" className="btn btn-outline-success px-4">免費註冊</Link>
        </div>
      </div>

      <div className="row g-4 mb-5">
        {[
          { icon: 'bi-journal-plus', title: '每日飲食記錄', desc: '記錄三餐與點心，自動計算熱量與三大營養素' },
          { icon: 'bi-bullseye', title: '個人化目標', desc: '依據身體數據以 Harris-Benedict 公式計算建議熱量' },
          { icon: 'bi-graph-up-arrow', title: '趨勢報表', desc: '7 天或 30 天趨勢圖表，直觀呈現飲食狀況' }
        ].map(f => (
          <div className="col-12 col-md-4" key={f.title}>
            <div className="card h-100 text-center p-4">
              <i className={`bi ${f.icon} text-success mb-3`} style={{ fontSize: '2rem' }}></i>
              <h2 className="h5">{f.title}</h2>
              <p className="text-secondary small">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="card p-4 mb-4">
        <h2 className="h5 mb-3"><i className="bi bi-info-circle-fill text-info me-2"></i>Demo 帳號</h2>
        <div className="row g-3">
          {[
            { role: '一般使用者', email: 'demo@demo.com', pwd: 'Demo@123' },
            { role: '管理員', email: 'admin@demo.com', pwd: 'Admin@123' }
          ].map(a => (
            <div className="col-12 col-sm-6" key={a.role}>
              <div className="p-3 bg-light rounded">
                <div className="fw-bold mb-1">{a.role}</div>
                <div className="small text-secondary">{a.email}</div>
                <div className="small text-secondary">密碼：{a.pwd}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="text-center text-secondary small">
        <Link to="/login" className="text-success">← 返回登入頁</Link>
      </p>
    </div>
  )
}
