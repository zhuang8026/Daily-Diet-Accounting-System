/**
 * 模組名稱：pages/admin/adminRecords.js
 * 功能說明：後台飲食紀錄管理，支援多條件篩選、刪除單筆、CSV/JSON 匯出
 */

import { getAllRecordsForAdmin, deleteRecord } from '../../recordService.js';
import { showToast, getMealLabel, getTodayISO, offsetDate } from '../../utils.js';

let filters = { startDate: offsetDate(getTodayISO(), -6), endDate: getTodayISO(), mealType: '', userId: '' };

/**
 * 函式名稱：mount
 * 功能說明：掛載後台飲食紀錄管理頁
 * @param {HTMLElement} container - 掛載目標
 */
const mount = (container) => {
  container.innerHTML = buildHTML();
  attachEvents(container);
  renderTable(container);
};

const buildHTML = () => `
  <div class="container-fluid p-3">
    <div class="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
      <h1 class="h5 fw-500 mb-0">飲食紀錄管理</h1>
      <div class="d-flex gap-2 flex-wrap">
        <button class="btn btn-outline-secondary btn-sm" id="export-csv-btn">
          <i class="bi bi-download me-1"></i>匯出 CSV
        </button>
        <button class="btn btn-outline-info btn-sm" id="export-json-btn">
          <i class="bi bi-download me-1"></i>匯出 JSON
        </button>
      </div>
    </div>

    <div class="card p-3 mb-3">
      <div class="row g-2 align-items-end">
        <div class="col-12 col-sm-4 col-md-3">
          <label for="r-start-date" class="form-label small">開始日期</label>
          <input type="date" id="r-start-date" class="form-control form-control-sm" value="${filters.startDate}">
        </div>
        <div class="col-12 col-sm-4 col-md-3">
          <label for="r-end-date" class="form-label small">結束日期</label>
          <input type="date" id="r-end-date" class="form-control form-control-sm" value="${filters.endDate}">
        </div>
        <div class="col-6 col-sm-4 col-md-2">
          <label for="r-meal-type" class="form-label small">餐別</label>
          <select id="r-meal-type" class="form-select form-select-sm">
            <option value="">全部</option>
            <option value="breakfast">早餐</option>
            <option value="lunch">午餐</option>
            <option value="dinner">晚餐</option>
            <option value="snack">點心</option>
          </select>
        </div>
        <div class="col-6 col-sm-6 col-md-3">
          <label for="r-user-filter" class="form-label small">使用者 Email</label>
          <input type="text" id="r-user-filter" class="form-control form-control-sm" placeholder="模糊搜尋...">
        </div>
        <div class="col-6 col-sm-4 col-md-1">
          <button class="btn btn-success btn-sm w-100" id="filter-btn">篩選</button>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="table-responsive">
        <table class="table table-hover table-sm mb-0">
          <caption class="visually-hidden">飲食紀錄管理列表</caption>
          <thead class="table-light">
            <tr>
              <th scope="col">紀錄ID</th>
              <th scope="col">使用者</th>
              <th scope="col">日期</th>
              <th scope="col">餐別</th>
              <th scope="col">食物名稱</th>
              <th scope="col">份量</th>
              <th scope="col">熱量</th>
              <th scope="col" class="d-none d-lg-table-cell">蛋白質</th>
              <th scope="col" class="d-none d-lg-table-cell">脂肪</th>
              <th scope="col" class="d-none d-lg-table-cell">碳水</th>
              <th scope="col">操作</th>
            </tr>
          </thead>
          <tbody id="records-tbody"></tbody>
        </table>
      </div>
      <div class="card-footer" id="record-info"></div>
    </div>
  </div>

  <div class="modal fade" id="del-record-modal" tabindex="-1" aria-labelledby="del-record-title" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-sm">
      <div class="modal-content">
        <div class="modal-header">
          <h2 class="modal-title h5" id="del-record-title">確認刪除</h2>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="關閉"></button>
        </div>
        <div class="modal-body">確定要刪除這筆飲食紀錄？此操作無法復原。</div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">取消</button>
          <button type="button" class="btn btn-danger btn-sm" id="confirm-del-record-btn">確認刪除</button>
        </div>
      </div>
    </div>
  </div>
`;

const renderTable = (container) => {
  const userEmailFilter = document.getElementById('r-user-filter')?.value.trim().toLowerCase() || '';
  const allRecords = getAllRecordsForAdmin(filters).filter(r =>
    !userEmailFilter || r.userEmail?.toLowerCase().includes(userEmailFilter)
  );

  const tbody = document.getElementById('records-tbody');
  const infoEl = document.getElementById('record-info');
  if (!tbody) return;

  if (infoEl) infoEl.textContent = `共 ${allRecords.length} 筆紀錄`;

  tbody.innerHTML = allRecords.length === 0
    ? `<tr><td colspan="11" class="text-center text-secondary py-4">找不到符合條件的紀錄</td></tr>`
    : '';

  allRecords.forEach(r => {
    const tr = document.createElement('tr');
    const cells = [
      r.recordId.slice(0, 8), r.displayName, r.recordDate,
      getMealLabel(r.mealType), r.foodName,
      `${r.servingAmount} 份`, `${r.calories} kcal`,
      `${r.protein}g`, `${r.fat}g`, `${r.carbohydrate}g`
    ];
    cells.forEach((val, i) => {
      const td = document.createElement(i === 0 ? 'th' : 'td');
      if (i === 0) { td.scope = 'row'; td.className = 'small'; }
      if ([7, 8, 9].includes(i)) td.className = 'd-none d-lg-table-cell';
      td.textContent = val; // textContent 防 XSS
      tr.appendChild(td);
    });

    const actionTd = document.createElement('td');
    const delBtn = document.createElement('button');
    delBtn.className = 'btn btn-sm btn-outline-danger';
    delBtn.setAttribute('aria-label', `刪除紀錄 ${r.recordId.slice(0, 8)}`);
    delBtn.innerHTML = '<i class="bi bi-trash"></i>';
    delBtn.addEventListener('click', () => openDeleteModal(r.userId, r.recordId, container));
    actionTd.appendChild(delBtn);
    tr.appendChild(actionTd);
    tbody.appendChild(tr);
  });
};

let pendingDelete = null;
const openDeleteModal = (userId, recordId, container) => {
  pendingDelete = { userId, recordId, container };
  new window.bootstrap.Modal(document.getElementById('del-record-modal')).show();
};

const attachEvents = (container) => {
  document.getElementById('filter-btn')?.addEventListener('click', () => {
    filters.startDate = document.getElementById('r-start-date').value || '';
    filters.endDate = document.getElementById('r-end-date').value || '';
    filters.mealType = document.getElementById('r-meal-type').value;
    renderTable(container);
  });

  document.getElementById('confirm-del-record-btn')?.addEventListener('click', () => {
    if (!pendingDelete) return;
    deleteRecord(pendingDelete.userId, pendingDelete.recordId);
    window.bootstrap.Modal.getInstance(document.getElementById('del-record-modal'))?.hide();
    renderTable(pendingDelete.container);
    showToast('紀錄已刪除', 'info');
    pendingDelete = null;
  });

  document.getElementById('export-csv-btn')?.addEventListener('click', () => exportData('csv'));
  document.getElementById('export-json-btn')?.addEventListener('click', () => exportData('json'));
};

const exportData = (format) => {
  const userEmailFilter = document.getElementById('r-user-filter')?.value.trim().toLowerCase() || '';
  const records = getAllRecordsForAdmin(filters).filter(r =>
    !userEmailFilter || r.userEmail?.toLowerCase().includes(userEmailFilter)
  );

  if (records.length === 0) { showToast('無資料可匯出', 'warning'); return; }

  let content, mime, ext;
  if (format === 'csv') {
    const headers = ['recordId', 'userId', 'userEmail', 'displayName', 'recordDate', 'mealType', 'foodName', 'servingAmount', 'calories', 'protein', 'fat', 'carbohydrate', 'note'];
    const rows = records.map(r => headers.map(h => `"${String(r[h] || '').replace(/"/g, '""')}"`).join(','));
    content = [headers.join(','), ...rows].join('\n');
    mime = 'text/csv;charset=utf-8;';
    ext = 'csv';
  } else {
    content = JSON.stringify(records, null, 2);
    mime = 'application/json';
    ext = 'json';
  }

  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `records_${getTodayISO()}.${ext}`;
  a.click();
  URL.revokeObjectURL(url);
  showToast(`已匯出 ${records.length} 筆紀錄`, 'success');
};

export { mount };
