/**
 * 模組名稱：pages/admin/adminDashboard.js
 * 功能說明：後台統計儀表板，顯示今日活躍人數、紀錄筆數、本週統計、
 *           食物資料庫總筆數、前 10 大食物長條圖、今日有記錄使用者清單
 */

import { getStorage } from '../../storage.js';
import { getTodayISO, offsetDate } from '../../utils.js';

/**
 * 函式名稱：mount
 * 功能說明：掛載後台統計儀表板
 * @param {HTMLElement} container - 掛載目標
 */
const mount = (container) => {
  const stats = computeStats();
  container.innerHTML = buildHTML(stats);
  renderTopFoodsChart(stats.topFoods);
  renderUserTable(stats.todayUsers, container);
};

const computeStats = () => {
  const today = getTodayISO();
  const weekStart = offsetDate(today, -6);
  const users = getStorage('ddas_users') || [];
  const foods = getStorage('ddas_foods') || [];

  // 計算所有使用者的紀錄
  const allRecords = users.flatMap(u => {
    const records = getStorage(`ddas_records_${u.userId}`) || [];
    return records.map(r => ({ ...r, displayName: u.displayName, userEmail: u.email }));
  });

  // 今日活躍使用者（有飲食紀錄）
  const todayRecords = allRecords.filter(r => r.recordDate === today);
  const todayActiveUserIds = [...new Set(todayRecords.map(r => r.userId))];

  // 本週紀錄
  const weekRecords = allRecords.filter(r => r.recordDate >= weekStart && r.recordDate <= today);

  // 本週前 10 大食物
  const foodCount = weekRecords.reduce((acc, r) => {
    const key = r.foodName;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const topFoods = Object.entries(foodCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));

  // 今日有記錄的使用者清單
  const todayUsers = todayActiveUserIds.map(uid => {
    const user = users.find(u => u.userId === uid);
    const count = todayRecords.filter(r => r.userId === uid).length;
    return { displayName: user?.displayName || '未知', email: user?.email || '', count };
  });

  return {
    todayActiveCount: todayActiveUserIds.length,
    todayRecordCount: todayRecords.length,
    weekRecordCount: weekRecords.length,
    foodDbCount: foods.length,
    topFoods,
    todayUsers
  };
};

const buildHTML = (stats) => `
  <div class="container-fluid p-3">
    <h1 class="h5 fw-500 mb-4">統計儀表板</h1>

    <div class="row g-3 mb-4">
      ${[
        { label: '今日活躍使用者', value: stats.todayActiveCount, icon: 'bi-people-fill', color: 'primary' },
        { label: '今日飲食紀錄筆數', value: stats.todayRecordCount, icon: 'bi-journal-text', color: 'success' },
        { label: '本週累計紀錄筆數', value: stats.weekRecordCount, icon: 'bi-calendar-week', color: 'warning' },
        { label: '食物資料庫總筆數', value: stats.foodDbCount, icon: 'bi-database-fill', color: 'info' }
      ].map(c => `
        <div class="col-6 col-lg-3">
          <div class="card p-3">
            <div class="d-flex align-items-center gap-3">
              <div class="rounded-circle d-flex align-items-center justify-content-center"
                   style="width:48px;height:48px;background-color:var(--bs-${c.color}-bg-subtle);">
                <i class="bi ${c.icon} text-${c.color} fs-5"></i>
              </div>
              <div>
                <div class="fs-4 fw-bold" id="stat-${c.color}">${c.value}</div>
                <div class="small text-secondary">${c.label}</div>
              </div>
            </div>
          </div>
        </div>
      `).join('')}
    </div>

    <div class="row g-3">
      <div class="col-12 col-lg-7">
        <div class="card p-3">
          <h2 class="h6 text-secondary mb-3">本週最常記錄的前 10 大食物</h2>
          <div style="position:relative;height:260px;">
            <canvas id="top-foods-chart" aria-label="前 10 大食物長條圖" role="img"></canvas>
            <figcaption class="visually-hidden">本週最常記錄的前 10 大食物統計</figcaption>
          </div>
        </div>
      </div>
      <div class="col-12 col-lg-5">
        <div class="card p-3">
          <h2 class="h6 text-secondary mb-3">今日有記錄的使用者</h2>
          <div id="today-users-table"></div>
        </div>
      </div>
    </div>
  </div>
`;

const renderTopFoodsChart = (topFoods) => {
  const canvas = document.getElementById('top-foods-chart');
  if (!canvas) return;

  if (topFoods.length === 0) {
    canvas.parentElement.innerHTML = '<p class="text-secondary text-center py-4">本週尚無飲食紀錄</p>';
    return;
  }

  new window.Chart(canvas, {
    type: 'bar',
    data: {
      labels: topFoods.map(f => f.name),
      datasets: [{
        label: '記錄次數',
        data: topFoods.map(f => f.count),
        backgroundColor: '#2e7d32',
        borderRadius: 4
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { x: { beginAtZero: true, ticks: { stepSize: 1 } } }
    }
  });
};

const renderUserTable = (todayUsers, container) => {
  const el = document.getElementById('today-users-table');
  if (!el) return;

  if (todayUsers.length === 0) {
    el.innerHTML = '<p class="text-secondary text-center py-4 small">今日尚無使用者有飲食紀錄</p>';
    return;
  }

  const table = document.createElement('table');
  table.className = 'table table-sm table-hover';
  table.innerHTML = '<caption class="visually-hidden">今日有記錄的使用者清單</caption>';

  const thead = document.createElement('thead');
  thead.className = 'table-light';
  thead.innerHTML = `<tr>
    <th scope="col">使用者</th>
    <th scope="col">Email</th>
    <th scope="col">筆數</th>
  </tr>`;

  const tbody = document.createElement('tbody');
  todayUsers.forEach(u => {
    const tr = document.createElement('tr');
    ['displayName', 'email', 'count'].forEach((key, i) => {
      const td = document.createElement(i === 0 ? 'th' : 'td');
      if (i === 0) td.scope = 'row';
      // 使用 textContent 防止 XSS
      td.textContent = u[key];
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });

  table.append(thead, tbody);
  el.appendChild(table);
};

export { mount };
