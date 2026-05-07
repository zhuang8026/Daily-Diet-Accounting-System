/**
 * 模組名稱：pages/dashboard.js
 * 功能說明：每日飲食總覽頁，包含日期切換、熱量環形圖、三大營養素進度條、
 *           餐別分區列表、新增/編輯飲食紀錄 Modal
 */

import { getCurrentSession } from '../auth.js';
import { getRecords, addRecord, updateRecord, deleteRecord, getDailySummary } from '../recordService.js';
import { searchFoods, getFoodById } from '../foodService.js';
import { getTargets } from '../profileService.js';
import { getActiveAnnouncement } from '../announcementService.js';
import {
  showToast, getTodayISO, formatDateDisplay, offsetDate,
  getMealLabel, sanitizeInput, generateUUID
} from '../utils.js';

let currentDate = getTodayISO();
let calorieChart = null;

/**
 * 函式名稱：mount
 * 功能說明：掛載每日飲食總覽頁
 * @param {HTMLElement} container - 掛載目標
 */
const mount = (container) => {
  currentDate = getTodayISO();
  renderPage(container);
};

/**
 * 函式名稱：renderPage
 * 功能說明：完整渲染頁面內容，每次日期切換後重新呼叫
 * @param {HTMLElement} container - 掛載目標
 */
const renderPage = (container) => {
  const session = getCurrentSession();
  const targets = getTargets(session.userId);
  const summary = getDailySummary(session.userId, currentDate);
  const records = getRecords(session.userId, currentDate);
  const announcement = getActiveAnnouncement();

  container.innerHTML = buildHTML(summary, targets, records, announcement);
  attachEvents(container, session.userId, targets, summary);
  renderCalorieChart(summary, targets);
};

/**
 * 函式名稱：buildHTML
 * 功能說明：產生頁面 HTML 結構
 */
const buildHTML = (summary, targets, records, announcement) => {
  const today = getTodayISO();
  const isToday = currentDate === today;

  return `
    ${announcement ? `
    <div class="alert alert-info alert-dismissible fade show m-3 mb-0" role="alert">
      <i class="bi bi-megaphone-fill me-2"></i>
      <strong id="ann-title"></strong> <span id="ann-content"></span>
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="關閉公告"></button>
    </div>` : ''}

    <div class="container-fluid p-3">
      <div class="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
        <h1 class="h5 mb-0 fw-500">每日飲食總覽</h1>
        <div class="d-flex align-items-center gap-2">
          <button class="btn btn-outline-secondary btn-sm" id="prev-day-btn" aria-label="前一天">
            <i class="bi bi-chevron-left"></i>
          </button>
          <input type="date" id="date-picker" class="form-control form-control-sm"
                 value="${currentDate}" max="${today}"
                 aria-label="選擇日期" style="width:150px;">
          <button class="btn btn-outline-secondary btn-sm" id="next-day-btn"
                  aria-label="後一天" ${isToday ? 'disabled' : ''}>
            <i class="bi bi-chevron-right"></i>
          </button>
        </div>
      </div>
      <p class="text-secondary small mb-3" id="date-display">${formatDateDisplay(currentDate)}</p>

      <div class="row g-3 mb-3">
        <div class="col-12 col-md-5 col-lg-4">
          <div class="card h-100 p-3 text-center">
            <h2 class="h6 mb-3 text-secondary">熱量總覽</h2>
            <div class="position-relative mx-auto" style="width:180px;height:180px;">
              <canvas id="calorie-donut" aria-label="熱量環形進度圖" role="img"></canvas>
            </div>
            <figcaption class="visually-hidden" id="chart-caption">
              已攝取 ${summary.totalCalories} kcal，目標 ${targets.targetCalories} kcal
            </figcaption>
            <div class="mt-2 small text-secondary" aria-live="polite" id="calorie-text">
              <span class="fw-bold fs-5 text-body">${summary.totalCalories}</span> / ${targets.targetCalories} kcal
            </div>
          </div>
        </div>

        <div class="col-12 col-md-7 col-lg-8">
          <div class="card h-100 p-3">
            <h2 class="h6 mb-3 text-secondary">三大營養素</h2>
            <div aria-live="polite" id="macro-bars">
              ${buildMacroBars(summary, targets)}
            </div>
          </div>
        </div>
      </div>

      <div class="accordion mb-5" id="meal-accordion">
        ${['breakfast', 'lunch', 'dinner', 'snack'].map(mealType =>
          buildMealSection(mealType, records.filter(r => r.mealType === mealType))
        ).join('')}
      </div>
    </div>

    <button class="btn btn-success rounded-circle shadow-lg position-fixed d-flex align-items-center justify-content-center"
            id="fab-add-btn"
            style="bottom:80px;right:20px;width:56px;height:56px;z-index:1000;"
            aria-label="新增飲食紀錄"
            data-testid="add-record-btn">
      <i class="bi bi-plus-lg fs-5"></i>
    </button>

    ${buildRecordModal()}
    ${buildDeleteConfirmModal()}
  `;

  // 安全插入公告內容（textContent 防 XSS）
};

const buildMacroBars = (summary, targets) => {
  const macros = [
    { key: 'protein', label: '蛋白質', value: summary.totalProtein, target: targets.targetProtein, color: '#1565c0' },
    { key: 'fat', label: '脂肪', value: summary.totalFat, target: targets.targetFat, color: '#e65100' },
    { key: 'carb', label: '碳水化合物', value: summary.totalCarb, target: targets.targetCarb, color: '#2e7d32' }
  ];

  return macros.map(m => {
    const pct = m.target > 0 ? Math.min(100, (m.value / m.target) * 100) : 0;
    const isOver = m.target > 0 && m.value > m.target;
    return `
      <div class="mb-3">
        <div class="d-flex justify-content-between align-items-center mb-1">
          <span class="small fw-500">${m.label}</span>
          <span class="small ${isOver ? 'text-danger fw-bold' : 'text-secondary'}">${m.value}g / ${m.target || '—'}g${isOver ? ' ⚠️' : ''}</span>
        </div>
        <div class="progress" style="height:10px;" role="progressbar"
             aria-valuenow="${m.value}" aria-valuemin="0" aria-valuemax="${m.target || 100}"
             aria-label="${m.label} 進度">
          <div class="progress-bar ${isOver ? 'bg-danger' : ''}" style="width:${pct}%;${!isOver ? `background-color:${m.color}` : ''}"></div>
        </div>
      </div>
    `;
  }).join('');
};

const buildMealSection = (mealType, records) => {
  const label = getMealLabel(mealType);
  const mealCalories = records.reduce((sum, r) => sum + r.calories, 0);
  const collapseId = `meal-${mealType}`;

  return `
    <div class="accordion-item">
      <h2 class="accordion-header">
        <button class="accordion-button ${mealType !== 'breakfast' ? 'collapsed' : ''}"
                type="button" data-bs-toggle="collapse"
                data-bs-target="#${collapseId}"
                aria-expanded="${mealType === 'breakfast'}" aria-controls="${collapseId}">
          <span class="me-2">${getMealIcon(mealType)}</span>
          <strong>${label}</strong>
          <span class="badge bg-secondary ms-2">${mealCalories} kcal</span>
          <span class="badge bg-light text-secondary ms-1">${records.length} 筆</span>
        </button>
      </h2>
      <div id="${collapseId}" class="accordion-collapse collapse ${mealType === 'breakfast' ? 'show' : ''}"
           data-bs-parent="#meal-accordion">
        <div class="accordion-body p-0">
          ${records.length === 0
            ? `<p class="text-secondary text-center py-3 small">尚無 ${label} 紀錄</p>`
            : `<div class="table-responsive">
                <table class="table table-hover mb-0">
                  <caption class="visually-hidden">${label}飲食紀錄列表</caption>
                  <thead class="table-light">
                    <tr>
                      <th scope="col">食物</th>
                      <th scope="col">份量</th>
                      <th scope="col">熱量</th>
                      <th scope="col" class="d-none d-sm-table-cell">蛋白質</th>
                      <th scope="col" class="d-none d-sm-table-cell">脂肪</th>
                      <th scope="col" class="d-none d-sm-table-cell">碳水</th>
                      <th scope="col">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${records.map(r => buildRecordRow(r)).join('')}
                  </tbody>
                </table>
              </div>`
          }
          <div class="p-2 border-top">
            <button class="btn btn-outline-success btn-sm w-100 add-meal-btn"
                    data-meal="${mealType}" aria-label="新增${label}紀錄">
              <i class="bi bi-plus-circle me-1"></i> 新增${label}
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
};

const buildRecordRow = (r) => `
  <tr>
    <td>
      <span class="fw-500 record-name" data-id="${r.recordId}"></span>
      ${r.note ? `<div class="small text-secondary record-note" data-id="${r.recordId}"></div>` : ''}
    </td>
    <td class="small">${r.servingAmount} 份</td>
    <td class="small">${r.calories} kcal</td>
    <td class="small d-none d-sm-table-cell">${r.protein}g</td>
    <td class="small d-none d-sm-table-cell">${r.fat}g</td>
    <td class="small d-none d-sm-table-cell">${r.carbohydrate}g</td>
    <td>
      <button class="btn btn-sm btn-outline-secondary me-1 edit-record-btn"
              data-id="${r.recordId}" aria-label="編輯 ${r.recordId}">
        <i class="bi bi-pencil"></i>
      </button>
      <button class="btn btn-sm btn-outline-danger delete-record-btn"
              data-id="${r.recordId}" aria-label="刪除 ${r.recordId}">
        <i class="bi bi-trash"></i>
      </button>
    </td>
  </tr>
`;

const buildRecordModal = () => `
  <div class="modal fade" id="record-modal" tabindex="-1"
       aria-labelledby="record-modal-title" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h2 class="modal-title h5" id="record-modal-title">新增飲食紀錄</h2>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="關閉"></button>
        </div>
        <div class="modal-body">
          <form id="record-form" novalidate>
            <input type="hidden" id="edit-record-id">

            <div class="mb-3">
              <label for="food-search-input" class="form-label">食物名稱 <span class="text-danger">*</span></label>
              <div class="position-relative">
                <input type="text" id="food-search-input" class="form-control"
                       placeholder="輸入食物名稱，如：雞胸肉、白飯..."
                       maxlength="50" autocomplete="off" required
                       data-testid="food-search">
                <div id="food-autocomplete" class="autocomplete-dropdown shadow-sm border rounded d-none"
                     role="listbox" aria-label="食物搜尋結果"></div>
              </div>
              <input type="hidden" id="selected-food-id">
              <div class="invalid-feedback">食物名稱為必填欄位</div>
            </div>

            <div class="row g-2 mb-3">
              <div class="col-6">
                <label for="meal-type-select" class="form-label">餐別 <span class="text-danger">*</span></label>
                <select id="meal-type-select" name="mealType" class="form-select" required>
                  <option value="">請選擇</option>
                  <option value="breakfast">早餐</option>
                  <option value="lunch">午餐</option>
                  <option value="dinner">晚餐</option>
                  <option value="snack">點心</option>
                </select>
                <div class="invalid-feedback">請選擇餐別</div>
              </div>
              <div class="col-6">
                <label for="record-date-input" class="form-label">日期 <span class="text-danger">*</span></label>
                <input type="date" id="record-date-input" class="form-control"
                       max="${getTodayISO()}" required>
                <div class="invalid-feedback">日期為必填（不可為未來日期）</div>
              </div>
            </div>

            <div class="mb-3">
              <label for="serving-amount-input" class="form-label">份量（倍數）<span class="text-danger">*</span></label>
              <input type="number" id="serving-amount-input" name="servingAmount"
                     class="form-control" value="1" min="0.01" step="0.01"
                     required data-testid="serving-amount">
              <div class="form-text text-secondary small" id="serving-hint"></div>
              <div class="invalid-feedback">份量為必填欄位，需大於 0</div>
            </div>

            <div class="row g-2 mb-3">
              <div class="col-6 col-sm-3">
                <label for="cal-input" class="form-label">熱量 <span class="text-danger">*</span></label>
                <div class="input-group input-group-sm">
                  <input type="number" id="cal-input" class="form-control" min="0" step="1" required>
                  <span class="input-group-text">kcal</span>
                </div>
              </div>
              <div class="col-6 col-sm-3">
                <label for="protein-input" class="form-label">蛋白質</label>
                <div class="input-group input-group-sm">
                  <input type="number" id="protein-input" class="form-control" min="0" step="0.1">
                  <span class="input-group-text">g</span>
                </div>
              </div>
              <div class="col-6 col-sm-3">
                <label for="fat-input" class="form-label">脂肪</label>
                <div class="input-group input-group-sm">
                  <input type="number" id="fat-input" class="form-control" min="0" step="0.1">
                  <span class="input-group-text">g</span>
                </div>
              </div>
              <div class="col-6 col-sm-3">
                <label for="carb-input" class="form-label">碳水</label>
                <div class="input-group input-group-sm">
                  <input type="number" id="carb-input" class="form-control" min="0" step="0.1">
                  <span class="input-group-text">g</span>
                </div>
              </div>
            </div>

            <div class="mb-3">
              <label for="note-input" class="form-label">備註</label>
              <textarea id="note-input" class="form-control" rows="2"
                        maxlength="200" placeholder="選填，最多 200 字"></textarea>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
          <button type="button" class="btn btn-success" id="save-record-btn"
                  data-testid="save-record-btn">儲存</button>
        </div>
      </div>
    </div>
  </div>
`;

const buildDeleteConfirmModal = () => `
  <div class="modal fade" id="delete-confirm-modal" tabindex="-1"
       aria-labelledby="delete-confirm-title" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-sm">
      <div class="modal-content">
        <div class="modal-header">
          <h2 class="modal-title h5" id="delete-confirm-title">確認刪除</h2>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="關閉"></button>
        </div>
        <div class="modal-body">確定要刪除這筆飲食紀錄嗎？此操作無法復原。</div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">取消</button>
          <button type="button" class="btn btn-danger btn-sm" id="confirm-delete-btn">確認刪除</button>
        </div>
      </div>
    </div>
  </div>
`;

/**
 * 函式名稱：attachEvents
 * 功能說明：綁定所有頁面互動事件（日期切換、新增/編輯/刪除紀錄、自動補全）
 */
const attachEvents = (container, userId, targets, summary) => {
  // 安全插入公告（使用 textContent 防 XSS）
  const annTitle = document.getElementById('ann-title');
  const annContent = document.getElementById('ann-content');
  const announcement = getActiveAnnouncement();
  if (annTitle && announcement) {
    annTitle.textContent = announcement.title;
    annContent.textContent = announcement.content;
  }

  // 安全插入食物名稱與備註（使用 textContent 防 XSS）
  document.querySelectorAll('.record-name[data-id]').forEach(el => {
    const records = getRecords(userId, currentDate);
    const record = records.find(r => r.recordId === el.dataset.id);
    if (record) el.textContent = record.foodName;
  });
  document.querySelectorAll('.record-note[data-id]').forEach(el => {
    const records = getRecords(userId, currentDate);
    const record = records.find(r => r.recordId === el.dataset.id);
    if (record && record.note) el.textContent = record.note;
  });

  // 日期切換
  document.getElementById('prev-day-btn')?.addEventListener('click', () => {
    currentDate = offsetDate(currentDate, -1);
    renderPage(container);
  });
  document.getElementById('next-day-btn')?.addEventListener('click', () => {
    if (currentDate < getTodayISO()) {
      currentDate = offsetDate(currentDate, 1);
      renderPage(container);
    }
  });
  document.getElementById('date-picker')?.addEventListener('change', (e) => {
    if (e.target.value && e.target.value <= getTodayISO()) {
      currentDate = e.target.value;
      renderPage(container);
    }
  });

  // FAB 新增按鈕
  document.getElementById('fab-add-btn')?.addEventListener('click', () => openAddModal());

  // 餐別新增按鈕
  document.querySelectorAll('.add-meal-btn').forEach(btn => {
    btn.addEventListener('click', () => openAddModal(btn.dataset.meal));
  });

  // 編輯按鈕
  document.querySelectorAll('.edit-record-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const record = getRecords(userId, currentDate).find(r => r.recordId === btn.dataset.id);
      if (record) openEditModal(record);
    });
  });

  // 刪除按鈕
  let pendingDeleteId = null;
  const deleteModal = new window.bootstrap.Modal(document.getElementById('delete-confirm-modal'));
  document.querySelectorAll('.delete-record-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      pendingDeleteId = btn.dataset.id;
      deleteModal.show();
    });
  });
  document.getElementById('confirm-delete-btn')?.addEventListener('click', () => {
    if (pendingDeleteId) {
      deleteRecord(userId, pendingDeleteId);
      deleteModal.hide();
      renderPage(container);
      showToast('飲食紀錄已刪除', 'info');
    }
  });

  // 儲存按鈕
  document.getElementById('save-record-btn')?.addEventListener('click', () => saveRecord(container, userId, targets));

  // 自動補全
  setupAutocomplete();
};

/** 食物自動補全基準資料（選中食物時儲存） */
let selectedFoodBase = null;

const setupAutocomplete = () => {
  const input = document.getElementById('food-search-input');
  const dropdown = document.getElementById('food-autocomplete');
  if (!input || !dropdown) return;

  input.addEventListener('input', () => {
    const keyword = input.value.trim();
    if (keyword.length < 1) { dropdown.classList.add('d-none'); return; }

    const results = searchFoods(keyword);
    if (results.length === 0) { dropdown.classList.add('d-none'); return; }

    dropdown.innerHTML = '';
    results.forEach(food => {
      const item = document.createElement('div');
      item.className = 'autocomplete-item p-2 cursor-pointer';
      item.setAttribute('role', 'option');
      item.setAttribute('data-testid', `food-item-${food.foodId}`);
      // 使用 textContent 防止 XSS
      const nameSpan = document.createElement('span');
      nameSpan.className = 'fw-500';
      nameSpan.textContent = food.foodName;
      const detailSpan = document.createElement('span');
      detailSpan.className = 'small text-secondary ms-2';
      detailSpan.textContent = `${food.caloriesPerServing}kcal/${food.servingUnit}`;
      item.append(nameSpan, detailSpan);
      item.addEventListener('click', () => selectFood(food));
      dropdown.appendChild(item);
    });
    dropdown.classList.remove('d-none');
  });

  document.addEventListener('click', (e) => {
    if (!input.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.classList.add('d-none');
    }
  });

  // 份量變更時自動計算營養素
  document.getElementById('serving-amount-input')?.addEventListener('input', recalcNutrients);
};

const selectFood = (food) => {
  selectedFoodBase = food;
  const input = document.getElementById('food-search-input');
  input.value = food.foodName;
  document.getElementById('selected-food-id').value = food.foodId;
  document.getElementById('food-autocomplete').classList.add('d-none');
  document.getElementById('serving-hint').textContent = `每份基準：${food.servingUnit}，${food.caloriesPerServing} kcal`;

  // 帶入預設 1 份的營養素
  document.getElementById('serving-amount-input').value = 1;
  fillNutrients(food, 1);
};

const fillNutrients = (food, amount) => {
  document.getElementById('cal-input').value = Math.round(food.caloriesPerServing * amount);
  document.getElementById('protein-input').value = Number((food.proteinPerServing * amount).toFixed(1));
  document.getElementById('fat-input').value = Number((food.fatPerServing * amount).toFixed(1));
  document.getElementById('carb-input').value = Number((food.carbPerServing * amount).toFixed(1));
};

const recalcNutrients = () => {
  if (!selectedFoodBase) return;
  const amount = parseFloat(document.getElementById('serving-amount-input').value) || 1;
  fillNutrients(selectedFoodBase, amount);
};

const openAddModal = (mealType = 'breakfast') => {
  resetModalForm();
  document.getElementById('record-modal-title').textContent = '新增飲食紀錄';
  document.getElementById('meal-type-select').value = mealType;
  document.getElementById('record-date-input').value = currentDate;
  selectedFoodBase = null;
  const modal = new window.bootstrap.Modal(document.getElementById('record-modal'));
  modal.show();
};

const openEditModal = (record) => {
  resetModalForm();
  document.getElementById('record-modal-title').textContent = '編輯飲食紀錄';
  document.getElementById('edit-record-id').value = record.recordId;
  document.getElementById('food-search-input').value = record.foodName;
  document.getElementById('selected-food-id').value = record.foodId || '';
  document.getElementById('meal-type-select').value = record.mealType;
  document.getElementById('record-date-input').value = record.recordDate;
  document.getElementById('serving-amount-input').value = record.servingAmount;
  document.getElementById('cal-input').value = record.calories;
  document.getElementById('protein-input').value = record.protein;
  document.getElementById('fat-input').value = record.fat;
  document.getElementById('carb-input').value = record.carbohydrate;
  document.getElementById('note-input').value = record.note || '';

  // 嘗試找回食物基準資料
  if (record.foodId) selectedFoodBase = getFoodById(record.foodId);

  const modal = new window.bootstrap.Modal(document.getElementById('record-modal'));
  modal.show();
};

const saveRecord = (container, userId, targets) => {
  const foodName = sanitizeInput(document.getElementById('food-search-input').value.trim());
  const mealType = document.getElementById('meal-type-select').value;
  const recordDate = document.getElementById('record-date-input').value;
  const servingAmount = parseFloat(document.getElementById('serving-amount-input').value);
  const calories = parseInt(document.getElementById('cal-input').value, 10);
  const editId = document.getElementById('edit-record-id').value;

  // 前端驗證
  if (!foodName || foodName.length < 1) { showToast('請輸入食物名稱', 'warning'); return; }
  if (!mealType) { showToast('請選擇餐別', 'warning'); return; }
  if (!recordDate || recordDate > getTodayISO()) { showToast('日期無效或為未來日期', 'warning'); return; }
  if (!servingAmount || servingAmount <= 0) { showToast('份量為必填欄位，需大於 0', 'warning'); return; }
  if (isNaN(calories) || calories < 0) { showToast('請輸入正確的熱量數值', 'warning'); return; }

  const data = {
    mealType, recordDate, foodName,
    foodId: document.getElementById('selected-food-id').value || null,
    servingAmount,
    calories,
    protein: parseFloat(document.getElementById('protein-input').value) || 0,
    fat: parseFloat(document.getElementById('fat-input').value) || 0,
    carbohydrate: parseFloat(document.getElementById('carb-input').value) || 0,
    note: sanitizeInput(document.getElementById('note-input').value)
  };

  if (editId) {
    updateRecord(userId, editId, data);
  } else {
    addRecord(userId, data);
  }

  window.bootstrap.Modal.getInstance(document.getElementById('record-modal'))?.hide();
  renderPage(container);

  const newSummary = getDailySummary(userId, currentDate);
  showToast(`✓ 飲食紀錄已儲存，今日累計 ${newSummary.totalCalories} kcal`, 'success');
};

const resetModalForm = () => {
  document.getElementById('record-form')?.reset();
  document.getElementById('edit-record-id').value = '';
  document.getElementById('selected-food-id').value = '';
  document.getElementById('food-autocomplete')?.classList.add('d-none');
  document.getElementById('serving-hint').textContent = '';
  selectedFoodBase = null;
};

/**
 * 函式名稱：renderCalorieChart
 * 功能說明：使用 Chart.js 繪製熱量環形圖，顏色依攝取比例動態調整
 */
const renderCalorieChart = (summary, targets) => {
  const canvas = document.getElementById('calorie-donut');
  if (!canvas) return;

  // 銷毀舊圖表避免記憶體洩漏
  if (calorieChart) { calorieChart.destroy(); calorieChart = null; }

  const pct = targets.targetCalories > 0 ? summary.totalCalories / targets.targetCalories : 0;
  const chartColor = pct > 1 ? '#c62828' : pct >= 0.75 ? '#e65100' : '#2e7d32';
  const remaining = Math.max(0, targets.targetCalories - summary.totalCalories);

  calorieChart = new window.Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: ['已攝取', '剩餘'],
      datasets: [{
        data: [summary.totalCalories, remaining || (summary.totalCalories === 0 ? 1 : 0)],
        backgroundColor: [chartColor, getComputedStyle(document.documentElement).getPropertyValue('--bs-border-color').trim() || '#e0e0e0'],
        borderWidth: 0
      }]
    },
    options: {
      cutout: '72%',
      animation: { duration: 600 },
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false }
      }
    },
    plugins: [{
      // 圓心顯示熱量數字
      id: 'centerText',
      afterDatasetsDraw(chart) {
        const { ctx, chartArea: { width, height, left, top } } = chart;
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const cx = left + width / 2;
        const cy = top + height / 2;
        ctx.font = 'bold 20px sans-serif';
        ctx.fillStyle = chartColor;
        ctx.fillText(summary.totalCalories, cx, cy - 10);
        ctx.font = '12px sans-serif';
        ctx.fillStyle = '#757575';
        ctx.fillText('kcal', cx, cy + 10);
        ctx.restore();
      }
    }]
  });
};

const getMealIcon = (mealType) => {
  const icons = { breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '🍎' };
  return icons[mealType] || '🍽️';
};

export { mount };
