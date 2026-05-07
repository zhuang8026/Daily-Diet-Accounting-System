/**
 * 模組名稱：pages/about.js
 * 功能說明：系統介紹頁，訪客可查看，無需登入
 */

/**
 * 函式名稱：mount
 * 功能說明：渲染系統介紹頁面
 * @param {HTMLElement} container - 掛載目標 DOM 元素
 */
const mount = (container) => {
  container.innerHTML = `
    <div class="container py-5" style="max-width:760px;">
      <div class="text-center mb-5">
        <i class="bi bi-clipboard2-heart-fill text-success" style="font-size:3rem;"></i>
        <h1 class="mt-3">每日飲食記帳系統</h1>
        <p class="lead text-secondary">輕鬆記錄飲食、精準追蹤營養、達成健康目標</p>
        <div class="mt-4 d-flex gap-3 justify-content-center flex-wrap">
          <a href="#/login" class="btn btn-success px-4">立即登入</a>
          <a href="#/register" class="btn btn-outline-success px-4">免費註冊</a>
        </div>
      </div>

      <div class="row g-4 mb-5">
        <div class="col-12 col-md-4">
          <div class="card h-100 text-center p-4">
            <i class="bi bi-journal-plus text-success mb-3" style="font-size:2rem;"></i>
            <h2 class="h5">每日飲食記錄</h2>
            <p class="text-secondary small">記錄三餐與點心，自動計算熱量與三大營養素</p>
          </div>
        </div>
        <div class="col-12 col-md-4">
          <div class="card h-100 text-center p-4">
            <i class="bi bi-bullseye text-success mb-3" style="font-size:2rem;"></i>
            <h2 class="h5">個人化目標</h2>
            <p class="text-secondary small">依據身體數據以 Harris-Benedict 公式計算建議熱量</p>
          </div>
        </div>
        <div class="col-12 col-md-4">
          <div class="card h-100 text-center p-4">
            <i class="bi bi-graph-up-arrow text-success mb-3" style="font-size:2rem;"></i>
            <h2 class="h5">趨勢報表</h2>
            <p class="text-secondary small">7 天或 30 天趨勢圖表，直觀呈現飲食狀況</p>
          </div>
        </div>
      </div>

      <div class="card p-4 mb-4">
        <h2 class="h5 mb-3"><i class="bi bi-info-circle-fill text-info me-2"></i>Demo 帳號</h2>
        <div class="row g-3">
          <div class="col-12 col-sm-6">
            <div class="p-3 bg-light rounded">
              <div class="fw-bold mb-1">一般使用者</div>
              <div class="small text-secondary">demo@demo.com</div>
              <div class="small text-secondary">密碼：Demo@123</div>
            </div>
          </div>
          <div class="col-12 col-sm-6">
            <div class="p-3 bg-light rounded">
              <div class="fw-bold mb-1">管理員</div>
              <div class="small text-secondary">admin@demo.com</div>
              <div class="small text-secondary">密碼：Admin@123</div>
            </div>
          </div>
        </div>
      </div>

      <p class="text-center text-secondary small">
        <a href="#/login" class="text-success">← 返回登入頁</a>
      </p>
    </div>
  `;
};

export { mount };
