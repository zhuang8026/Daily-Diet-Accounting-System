/**
 * 模組名稱：pages/report.js
 * 功能說明：趨勢報表頁，顯示 7/30 天熱量折線圖、三大營養素圓餅圖（Donut），
 *           無紀錄的日期顯示 0 並以空心圓標示
 */

import { getCurrentSession } from '../auth.js';
import { getDateRangeSummary } from '../recordService.js';
import { getTargets } from '../profileService.js';
import { offsetDate, getTodayISO } from '../utils.js';

let trendChart = null;
let nutrientChart = null;

/**
 * 函式名稱：mount
 * 功能說明：掛載趨勢報表頁
 * @param {HTMLElement} container - 掛載目標
 */
const mount = (container) => {
  container.innerHTML = buildHTML();
  attachEvents(container);
  renderCharts('7', container);
};

const buildHTML = () => `
  <div class="container-fluid p-3">
    <div class="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
      <h1 class="h5 fw-500 mb-0">趨勢報表</h1>
      <div class="btn-group" role="group" aria-label="報表時間範圍">
        <input type="radio" class="btn-check" name="range" id="range-7" value="7" autocomplete="off" checked>
        <label class="btn btn-outline-success" for="range-7" data-testid="range-7">近 7 天</label>
        <input type="radio" class="btn-check" name="range" id="range-30" value="30" autocomplete="off">
        <label class="btn btn-outline-success" for="range-30" data-testid="range-30">近 30 天</label>
      </div>
    </div>

    <div class="card p-3 mb-4">
      <h2 class="h6 text-secondary mb-3">熱量趨勢</h2>
      <div style="position:relative;height:280px;">
        <canvas id="trend-chart" aria-label="熱量趨勢折線圖" role="img"></canvas>
        <figcaption class="visually-hidden">熱量趨勢折線圖：顯示每日實際攝取與目標熱量</figcaption>
      </div>
      <div class="d-flex gap-4 mt-2 small justify-content-center">
        <span><span class="d-inline-block me-1 rounded-circle" style="width:12px;height:12px;background:#2e7d32;"></span>實際攝取</span>
        <span><span class="d-inline-block me-1 rounded-circle" style="width:12px;height:12px;background:#bdbdbd;"></span>目標熱量</span>
      </div>
    </div>

    <div class="row g-3">
      <div class="col-12 col-md-5">
        <div class="card p-3">
          <h2 class="h6 text-secondary mb-3">三大營養素比例</h2>
          <div style="position:relative;height:240px;">
            <canvas id="nutrient-chart" aria-label="三大營養素圓餅圖" role="img"></canvas>
            <figcaption class="visually-hidden">三大營養素比例：蛋白質、脂肪、碳水化合物的累計比例</figcaption>
          </div>
        </div>
      </div>
      <div class="col-12 col-md-7">
        <div class="card p-3 h-100">
          <h2 class="h6 text-secondary mb-3">摘要統計</h2>
          <div id="summary-stats" aria-live="polite"></div>
        </div>
      </div>
    </div>
  </div>
`;

/**
 * 函式名稱：renderCharts
 * 功能說明：依選定天數範圍渲染熱量趨勢圖與營養素圓餅圖
 * @param {string} days - 天數（'7' 或 '30'）
 */
const renderCharts = (days, container) => {
  const session = getCurrentSession();
  const targets = getTargets(session.userId);
  const today = getTodayISO();
  const startDate = offsetDate(today, -(parseInt(days, 10) - 1));
  const data = getDateRangeSummary(session.userId, startDate, today);

  renderTrendChart(data, targets);
  renderNutrientChart(data);
  renderSummaryStats(data, targets, parseInt(days, 10));
};

/**
 * 函式名稱：renderTrendChart
 * 功能說明：繪製熱量折線圖，無紀錄日期以空心圓標示（pointStyle: 'circle' + 空背景）
 */
const renderTrendChart = (data, targets) => {
  const canvas = document.getElementById('trend-chart');
  if (!canvas) return;
  if (trendChart) { trendChart.destroy(); trendChart = null; }

  const labels = data.map(d => d.date.slice(5)); // MM-DD
  const actualData = data.map(d => d.totalCalories);
  const targetData = data.map(() => targets.targetCalories);

  // 無紀錄日期的點樣式：空心圓
  const pointStyles = data.map(d => d.hasData ? 'circle' : 'circle');
  const pointBgColors = data.map(d => d.hasData ? '#2e7d32' : 'transparent');
  const pointBorderColors = data.map(d => d.hasData ? '#2e7d32' : '#2e7d32');

  trendChart = new window.Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: '實際攝取',
          data: actualData,
          borderColor: '#2e7d32',
          backgroundColor: 'rgba(46,125,50,0.08)',
          fill: true,
          tension: 0.3,
          pointStyle: pointStyles,
          pointBackgroundColor: pointBgColors,
          pointBorderColor: pointBorderColors,
          pointBorderWidth: 2,
          pointRadius: 5
        },
        {
          label: '目標熱量',
          data: targetData,
          borderColor: '#bdbdbd',
          borderDash: [6, 4],
          fill: false,
          pointRadius: 0,
          tension: 0
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { grid: { display: false } },
        y: {
          beginAtZero: true,
          title: { display: true, text: 'kcal' }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const d = data[ctx.dataIndex];
              if (ctx.datasetIndex === 0 && !d.hasData) return '無紀錄';
              return `${ctx.dataset.label}: ${ctx.parsed.y} kcal`;
            }
          }
        }
      }
    }
  });
};

/**
 * 函式名稱：renderNutrientChart
 * 功能說明：繪製三大營養素累計比例 Donut 圖
 */
const renderNutrientChart = (data) => {
  const canvas = document.getElementById('nutrient-chart');
  if (!canvas) return;
  if (nutrientChart) { nutrientChart.destroy(); nutrientChart = null; }

  const totalProtein = data.reduce((s, d) => s + d.totalProtein, 0);
  const totalFat = data.reduce((s, d) => s + d.totalFat, 0);
  const totalCarb = data.reduce((s, d) => s + d.totalCarb, 0);
  const totalCal = data.reduce((s, d) => s + d.totalCalories, 0);

  const hasData = totalProtein + totalFat + totalCarb > 0;

  nutrientChart = new window.Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: ['蛋白質', '脂肪', '碳水化合物'],
      datasets: [{
        data: hasData ? [totalProtein, totalFat, totalCarb] : [1, 1, 1],
        backgroundColor: ['#1565c0', '#e65100', '#2e7d32'],
        borderWidth: 2
      }]
    },
    options: {
      cutout: '65%',
      plugins: {
        legend: { position: 'bottom' },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              if (!hasData) return '無資料';
              const vals = [totalProtein, totalFat, totalCarb];
              const total = vals.reduce((s, v) => s + v, 0);
              const pct = total > 0 ? ((vals[ctx.dataIndex] / total) * 100).toFixed(1) : 0;
              return `${ctx.label}: ${vals[ctx.dataIndex].toFixed(1)}g (${pct}%)`;
            }
          }
        }
      }
    },
    plugins: [{
      id: 'centerTotal',
      afterDatasetsDraw(chart) {
        if (!hasData) return;
        const { ctx, chartArea: { width, height, left, top } } = chart;
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const cx = left + width / 2;
        const cy = top + height / 2;
        ctx.font = 'bold 16px sans-serif';
        ctx.fillStyle = '#2e7d32';
        ctx.fillText(totalCal, cx, cy - 8);
        ctx.font = '11px sans-serif';
        ctx.fillStyle = '#757575';
        ctx.fillText('kcal', cx, cy + 10);
        ctx.restore();
      }
    }]
  });
};

const renderSummaryStats = (data, targets, days) => {
  const el = document.getElementById('summary-stats');
  if (!el) return;

  const daysWithData = data.filter(d => d.hasData).length;
  const totalCal = data.reduce((s, d) => s + d.totalCalories, 0);
  const avgCal = daysWithData > 0 ? Math.round(totalCal / daysWithData) : 0;
  const maxDay = data.reduce((max, d) => d.totalCalories > max.totalCalories ? d : max, data[0]);
  const minDay = data.filter(d => d.hasData).reduce((min, d) => d.totalCalories < min.totalCalories ? d : min, data.find(d => d.hasData) || data[0]);

  const rows = [
    { label: '統計天數', value: `${days} 天（有紀錄 ${daysWithData} 天）` },
    { label: '平均每日熱量', value: `${avgCal} kcal` },
    { label: '熱量目標', value: `${targets.targetCalories} kcal / 天` },
    { label: '最高熱量日', value: maxDay && maxDay.hasData ? `${maxDay.date}（${maxDay.totalCalories} kcal）` : '—' },
    { label: '最低熱量日', value: minDay && minDay.hasData ? `${minDay.date}（${minDay.totalCalories} kcal）` : '—' }
  ];

  // 使用 textContent 安全插入資料
  const table = document.createElement('table');
  table.className = 'table table-sm';
  table.innerHTML = '<caption class="visually-hidden">摘要統計</caption>';
  const tbody = document.createElement('tbody');

  rows.forEach(row => {
    const tr = document.createElement('tr');
    const th = document.createElement('th');
    th.scope = 'row';
    th.className = 'text-secondary fw-normal small';
    th.textContent = row.label;
    const td = document.createElement('td');
    td.className = 'fw-500';
    td.textContent = row.value;
    tr.append(th, td);
    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  el.innerHTML = '';
  el.appendChild(table);
};

const attachEvents = (container) => {
  document.querySelectorAll('input[name="range"]').forEach(radio => {
    radio.addEventListener('change', () => renderCharts(radio.value, container));
  });
};

export { mount };
