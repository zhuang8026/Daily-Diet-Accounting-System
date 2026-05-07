/**
 * 模組名稱：pages/foodSearch.js
 * 功能說明：食物搜尋頁，提供關鍵字搜尋、類別篩選、熱量範圍滑桿、食物卡片列表與分頁
 */

import { getCurrentSession } from '../auth.js';
import { getFoods } from '../foodService.js';
import { addRecord } from '../recordService.js';
import { getDailySummary } from '../recordService.js';
import { showToast, getTodayISO, sanitizeInput, getMealLabel } from '../utils.js';

const CATEGORIES = ['全部', '主食', '蔬菜', '水果', '肉類', '蛋類', '乳製品', '飲料', '零食', '其他'];
let currentPage = 1;

/**
 * 函式名稱：mount
 * 功能說明：掛載食物搜尋頁
 * @param {HTMLElement} container - 掛載目標
 */
const mount = (container) => {
  currentPage = 1;
  container.innerHTML = buildHTML();
  attachEvents(container);
  renderFoods(container);
};

const buildHTML = () => `
  <div class="container-fluid p-3">
    <h1 class="h5 mb-4 fw-500">食物搜尋</h1>

    <div class="card p-3 mb-3">
      <div class="row g-3 align-items-end">
        <div class="col-12 col-md-4">
          <label for="food-keyword" class="form-label">關鍵字搜尋</label>
          <input type="text" id="food-keyword" class="form-control"
                 placeholder="輸入食物名稱，如：雞胸肉、白飯..."
                 maxlength="50">
        </div>
        <div class="col-6 col-md-3">
          <label for="cat-filter" class="form-label">類別</label>
          <select id="cat-filter" class="form-select">
            ${CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join('')}
          </select>
        </div>
        <div class="col-6 col-md-5">
          <label class="form-label">熱量範圍：<span id="cal-range-label">0 – 1000 kcal</span></label>
          <div class="d-flex gap-2 align-items-center">
            <input type="range" id="cal-min" class="form-range" min="0" max="1000" step="10" value="0" aria-label="最低熱量">
            <input type="range" id="cal-max" class="form-range" min="0" max="1000" step="10" value="1000" aria-label="最高熱量">
          </div>
        </div>
      </div>
    </div>

    <div id="food-list-container">
      <div class="row g-3" id="food-cards"></div>
      <div id="food-pagination" class="mt-3 d-flex justify-content-center"></div>
    </div>
  </div>

  <div class="modal fade" id="add-to-record-modal" tabindex="-1"
       aria-labelledby="add-modal-title" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h2 class="modal-title h5" id="add-modal-title">加入飲食紀錄</h2>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="關閉"></button>
        </div>
        <div class="modal-body">
          <div id="add-food-preview" class="alert alert-light mb-3"></div>
          <div class="row g-2">
            <div class="col-6">
              <label for="add-meal-type" class="form-label">餐別 <span class="text-danger">*</span></label>
              <select id="add-meal-type" class="form-select">
                <option value="breakfast">早餐</option>
                <option value="lunch">午餐</option>
                <option value="dinner">晚餐</option>
                <option value="snack">點心</option>
              </select>
            </div>
            <div class="col-6">
              <label for="add-serving" class="form-label">份量 <span class="text-danger">*</span></label>
              <input type="number" id="add-serving" class="form-control"
                     value="1" min="0.01" step="0.01">
            </div>
          </div>
          <div class="mt-3 p-2 bg-light rounded small" id="add-calc-display"></div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
          <button type="button" class="btn btn-success" id="confirm-add-btn">加入</button>
        </div>
      </div>
    </div>
  </div>
`;

const renderFoods = (container) => {
  const keyword = document.getElementById('food-keyword')?.value.trim() || '';
  const category = document.getElementById('cat-filter')?.value || '全部';
  const minCal = parseInt(document.getElementById('cal-min')?.value || 0, 10);
  const maxCal = parseInt(document.getElementById('cal-max')?.value || 1000, 10);

  const { items, total, page, totalPages } = getFoods({ keyword, category, minCal, maxCal, page: currentPage, limit: 12 });

  const cardsEl = document.getElementById('food-cards');
  const paginationEl = document.getElementById('food-pagination');
  if (!cardsEl) return;

  if (items.length === 0) {
    cardsEl.innerHTML = `<div class="col-12 text-center text-secondary py-5"><i class="bi bi-search fs-2 d-block mb-2"></i>找不到符合條件的食物</div>`;
    paginationEl.innerHTML = '';
    return;
  }

  cardsEl.innerHTML = items.map(f => buildFoodCard(f)).join('');

  // 安全插入食物名稱（防 XSS）
  cardsEl.querySelectorAll('[data-food-name]').forEach(el => {
    const food = items.find(f => f.foodId === el.dataset.foodId);
    if (food) el.textContent = food.foodName;
  });

  renderPagination(paginationEl, page, totalPages, container);
};

const buildFoodCard = (f) => `
  <div class="col-12 col-sm-6 col-lg-4">
    <div class="card h-100">
      <div class="card-body p-3">
        <div class="d-flex justify-content-between align-items-start mb-2">
          <span class="fw-bold" data-food-name data-food-id="${f.foodId}"></span>
          <span class="badge" style="background-color:var(--color-primary)">${f.category}</span>
        </div>
        <div class="small text-secondary mb-2">${f.servingUnit}</div>
        <div class="d-flex gap-2 flex-wrap small">
          <span class="badge text-bg-warning">${f.caloriesPerServing} kcal</span>
          <span class="text-secondary">蛋白 ${f.proteinPerServing}g</span>
          <span class="text-secondary">脂肪 ${f.fatPerServing}g</span>
          <span class="text-secondary">碳水 ${f.carbPerServing}g</span>
        </div>
      </div>
      <div class="card-footer p-2">
        <button class="btn btn-success btn-sm w-100 add-food-btn"
                data-food-id="${f.foodId}" aria-label="加入 ${f.foodId}">
          <i class="bi bi-plus-circle me-1"></i> 加入
        </button>
      </div>
    </div>
  </div>
`;

const renderPagination = (el, page, totalPages, container) => {
  if (totalPages <= 1) { el.innerHTML = ''; return; }
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  el.innerHTML = `
    <nav aria-label="食物列表分頁">
      <ul class="pagination pagination-sm mb-0">
        <li class="page-item ${page === 1 ? 'disabled' : ''}">
          <button class="page-link" data-page="${page - 1}" aria-label="上一頁">‹</button>
        </li>
        ${pages.map(p => `<li class="page-item ${p === page ? 'active' : ''}">
          <button class="page-link" data-page="${p}">${p}</button>
        </li>`).join('')}
        <li class="page-item ${page === totalPages ? 'disabled' : ''}">
          <button class="page-link" data-page="${page + 1}" aria-label="下一頁">›</button>
        </li>
      </ul>
    </nav>
  `;
  el.querySelectorAll('.page-link[data-page]').forEach(btn => {
    btn.addEventListener('click', () => {
      currentPage = parseInt(btn.dataset.page, 10);
      renderFoods(container);
    });
  });
};

let currentAddFood = null;

const attachEvents = (container) => {
  const session = getCurrentSession();
  let searchTimeout;

  // 關鍵字搜尋（防抖 300ms）
  document.getElementById('food-keyword')?.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => { currentPage = 1; renderFoods(container); }, 300);
  });

  // 類別篩選
  document.getElementById('cat-filter')?.addEventListener('change', () => { currentPage = 1; renderFoods(container); });

  // 熱量範圍滑桿
  ['cal-min', 'cal-max'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', () => {
      const min = parseInt(document.getElementById('cal-min').value, 10);
      const max = parseInt(document.getElementById('cal-max').value, 10);
      document.getElementById('cal-range-label').textContent = `${Math.min(min, max)} – ${Math.max(min, max)} kcal`;
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => { currentPage = 1; renderFoods(container); }, 200);
    });
  });

  // 加入按鈕（事件委派）
  document.getElementById('food-cards')?.addEventListener('click', (e) => {
    const btn = e.target.closest('.add-food-btn');
    if (!btn) return;
    const { items } = getFoods({ page: currentPage, limit: 12 });
    const food = items.find(f => f.foodId === btn.dataset.foodId) || null;
    if (food) openAddModal(food);
  });

  // 份量更新時重新計算
  document.getElementById('add-serving')?.addEventListener('input', updateCalcDisplay);

  // 確認加入
  document.getElementById('confirm-add-btn')?.addEventListener('click', () => {
    if (!currentAddFood) return;
    const mealType = document.getElementById('add-meal-type').value;
    const serving = parseFloat(document.getElementById('add-serving').value);
    if (!serving || serving <= 0) { showToast('請輸入正確份量', 'warning'); return; }

    addRecord(session.userId, {
      mealType,
      recordDate: getTodayISO(),
      foodName: currentAddFood.foodName,
      foodId: currentAddFood.foodId,
      servingAmount: serving,
      calories: Math.round(currentAddFood.caloriesPerServing * serving),
      protein: Number((currentAddFood.proteinPerServing * serving).toFixed(1)),
      fat: Number((currentAddFood.fatPerServing * serving).toFixed(1)),
      carbohydrate: Number((currentAddFood.carbPerServing * serving).toFixed(1))
    });

    window.bootstrap.Modal.getInstance(document.getElementById('add-to-record-modal'))?.hide();
    const newSummary = getDailySummary(session.userId, getTodayISO());
    showToast(`✓ 飲食紀錄已儲存，今日累計 ${newSummary.totalCalories} kcal`, 'success');
  });
};

const openAddModal = (food) => {
  currentAddFood = food;
  const preview = document.getElementById('add-food-preview');
  // 使用 textContent 安全插入食物名稱
  preview.textContent = '';
  const nameEl = document.createElement('strong');
  nameEl.textContent = food.foodName;
  const detailEl = document.createElement('span');
  detailEl.textContent = `  ${food.servingUnit}，${food.caloriesPerServing} kcal/份`;
  preview.append(nameEl, detailEl);

  document.getElementById('add-serving').value = 1;
  updateCalcDisplay();
  new window.bootstrap.Modal(document.getElementById('add-to-record-modal')).show();
};

const updateCalcDisplay = () => {
  if (!currentAddFood) return;
  const serving = parseFloat(document.getElementById('add-serving')?.value) || 1;
  const el = document.getElementById('add-calc-display');
  if (el) {
    el.textContent = `${Math.round(currentAddFood.caloriesPerServing * serving)} kcal｜蛋白質 ${Number((currentAddFood.proteinPerServing * serving).toFixed(1))}g｜脂肪 ${Number((currentAddFood.fatPerServing * serving).toFixed(1))}g｜碳水 ${Number((currentAddFood.carbPerServing * serving).toFixed(1))}g`;
  }
};

export { mount };
