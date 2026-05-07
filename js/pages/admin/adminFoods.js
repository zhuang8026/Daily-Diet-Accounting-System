/**
 * 模組名稱：pages/admin/adminFoods.js
 * 功能說明：後台食物資料庫管理，支援新增、編輯、刪除、CSV 批次匯入，每頁 20 筆
 */

import { getFoods, addFood, updateFood, deleteFood, generateFoodId, importFoodsFromCsv } from '../../foodService.js';
import { showToast, sanitizeInput } from '../../utils.js';
import { getCurrentSession } from '../../auth.js';

const CATEGORIES = ['主食', '蔬菜', '水果', '肉類', '蛋類', '乳製品', '飲料', '零食', '其他'];
let currentPage = 1;
let searchKeyword = '';
let searchCategory = '';

/**
 * 函式名稱：mount
 * 功能說明：掛載食物資料庫管理頁
 * @param {HTMLElement} container - 掛載目標
 */
const mount = (container) => {
  currentPage = 1;
  container.innerHTML = buildHTML();
  attachEvents(container);
  renderTable(container);
};

const buildHTML = () => `
  <div class="container-fluid p-3">
    <div class="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
      <h1 class="h5 fw-500 mb-0">食物資料庫管理</h1>
      <div class="d-flex gap-2 flex-wrap">
        <button class="btn btn-outline-secondary btn-sm" id="import-csv-btn">
          <i class="bi bi-upload me-1"></i>CSV 匯入
        </button>
        <button class="btn btn-success btn-sm" id="add-food-btn">
          <i class="bi bi-plus-circle me-1"></i>新增食物
        </button>
      </div>
    </div>

    <div class="card p-3 mb-3">
      <div class="row g-2">
        <div class="col-12 col-sm-6">
          <input type="text" id="food-search-admin" class="form-control form-control-sm"
                 placeholder="搜尋食物名稱...">
        </div>
        <div class="col-12 col-sm-4">
          <select id="cat-filter-admin" class="form-select form-select-sm">
            <option value="">全部類別</option>
            ${CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join('')}
          </select>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="table-responsive">
        <table class="table table-hover mb-0" id="foods-table">
          <caption class="visually-hidden">食物資料庫列表</caption>
          <thead class="table-light">
            <tr>
              <th scope="col">ID</th>
              <th scope="col">食物名稱</th>
              <th scope="col">類別</th>
              <th scope="col">份量單位</th>
              <th scope="col">熱量</th>
              <th scope="col" class="d-none d-md-table-cell">蛋白質</th>
              <th scope="col" class="d-none d-md-table-cell">脂肪</th>
              <th scope="col" class="d-none d-md-table-cell">碳水</th>
              <th scope="col">操作</th>
            </tr>
          </thead>
          <tbody id="foods-tbody"></tbody>
        </table>
      </div>
      <div class="card-footer" id="foods-pagination"></div>
    </div>
  </div>

  ${buildFoodModal()}
  ${buildDeleteModal()}
  ${buildCsvModal()}
`;

const buildFoodModal = () => `
  <div class="modal fade" id="food-modal" tabindex="-1" aria-labelledby="food-modal-title" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h2 class="modal-title h5" id="food-modal-title">新增食物</h2>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="關閉"></button>
        </div>
        <div class="modal-body">
          <form id="food-form" novalidate>
            <input type="hidden" id="edit-food-id">
            <div class="row g-2 mb-2">
              <div class="col-12 col-sm-8">
                <label for="f-name" class="form-label">食物名稱 <span class="text-danger">*</span></label>
                <input type="text" id="f-name" class="form-control form-control-sm" maxlength="50" required>
              </div>
              <div class="col-12 col-sm-4">
                <label for="f-cat" class="form-label">類別 <span class="text-danger">*</span></label>
                <select id="f-cat" class="form-select form-select-sm" required>
                  ${CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join('')}
                </select>
              </div>
            </div>
            <div class="row g-2 mb-2">
              <div class="col-6">
                <label for="f-size" class="form-label">份量大小</label>
                <input type="number" id="f-size" class="form-control form-control-sm" min="0" step="0.1" value="100">
              </div>
              <div class="col-6">
                <label for="f-unit" class="form-label">份量單位</label>
                <input type="text" id="f-unit" class="form-control form-control-sm" maxlength="20" placeholder="克（1 份）">
              </div>
            </div>
            <div class="row g-2">
              <div class="col-6 col-sm-3">
                <label for="f-cal" class="form-label">熱量(kcal) <span class="text-danger">*</span></label>
                <input type="number" id="f-cal" class="form-control form-control-sm" min="0" required>
              </div>
              <div class="col-6 col-sm-3">
                <label for="f-prot" class="form-label">蛋白質(g)</label>
                <input type="number" id="f-prot" class="form-control form-control-sm" min="0" step="0.1" value="0">
              </div>
              <div class="col-6 col-sm-3">
                <label for="f-fat" class="form-label">脂肪(g)</label>
                <input type="number" id="f-fat" class="form-control form-control-sm" min="0" step="0.1" value="0">
              </div>
              <div class="col-6 col-sm-3">
                <label for="f-carb" class="form-label">碳水(g)</label>
                <input type="number" id="f-carb" class="form-control form-control-sm" min="0" step="0.1" value="0">
              </div>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">取消</button>
          <button type="button" class="btn btn-success btn-sm" id="save-food-btn">儲存</button>
        </div>
      </div>
    </div>
  </div>
`;

const buildDeleteModal = () => `
  <div class="modal fade" id="delete-food-modal" tabindex="-1" aria-labelledby="del-food-title" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-sm">
      <div class="modal-content">
        <div class="modal-header">
          <h2 class="modal-title h5" id="del-food-title">確認刪除</h2>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="關閉"></button>
        </div>
        <div class="modal-body">確定要刪除這筆食物資料嗎？</div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">取消</button>
          <button type="button" class="btn btn-danger btn-sm" id="confirm-del-food-btn">確認刪除</button>
        </div>
      </div>
    </div>
  </div>
`;

const buildCsvModal = () => `
  <div class="modal fade" id="csv-modal" tabindex="-1" aria-labelledby="csv-modal-title" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h2 class="modal-title h5" id="csv-modal-title">CSV 批次匯入</h2>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="關閉"></button>
        </div>
        <div class="modal-body">
          <p class="small text-secondary">CSV 欄位順序（含標題行）：</p>
          <code class="small d-block bg-light p-2 rounded mb-3">foodName,category,servingSize,servingUnit,caloriesPerServing,proteinPerServing,fatPerServing,carbPerServing</code>
          <label for="csv-file" class="form-label">選擇 .csv 檔案</label>
          <input type="file" id="csv-file" class="form-control" accept=".csv">
          <div id="csv-result" class="mt-3 d-none"></div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">關閉</button>
          <button type="button" class="btn btn-success btn-sm" id="import-btn">匯入</button>
        </div>
      </div>
    </div>
  </div>
`;

const renderTable = (container) => {
  const { items, total, page, totalPages } = getFoods({
    keyword: searchKeyword, category: searchCategory, page: currentPage, limit: 20, minCal: 0, maxCal: 9999
  });

  const tbody = document.getElementById('foods-tbody');
  if (!tbody) return;

  tbody.innerHTML = items.length === 0
    ? `<tr><td colspan="9" class="text-center text-secondary py-4">找不到食物資料</td></tr>`
    : '';

  items.forEach(f => {
    const tr = document.createElement('tr');
    const cells = [
      f.foodId, f.foodName, f.category, f.servingUnit,
      `${f.caloriesPerServing} kcal`, `${f.proteinPerServing}g`, `${f.fatPerServing}g`, `${f.carbPerServing}g`
    ];
    cells.forEach((val, i) => {
      const td = document.createElement(i === 0 ? 'th' : 'td');
      if (i === 0) td.scope = 'row';
      if ([5, 6, 7].includes(i)) td.className = 'd-none d-md-table-cell';
      td.textContent = val; // textContent 防 XSS
      tr.appendChild(td);
    });

    const actionTd = document.createElement('td');
    const editBtn = document.createElement('button');
    editBtn.className = 'btn btn-sm btn-outline-secondary me-1';
    editBtn.setAttribute('aria-label', `編輯 ${f.foodId}`);
    editBtn.innerHTML = '<i class="bi bi-pencil"></i>';
    editBtn.addEventListener('click', () => openEditModal(f));

    const delBtn = document.createElement('button');
    delBtn.className = 'btn btn-sm btn-outline-danger';
    delBtn.setAttribute('aria-label', `刪除 ${f.foodId}`);
    delBtn.innerHTML = '<i class="bi bi-trash"></i>';
    delBtn.addEventListener('click', () => openDeleteModal(f.foodId));

    actionTd.append(editBtn, delBtn);
    tr.appendChild(actionTd);
    tbody.appendChild(tr);
  });

  renderPagination(page, totalPages, container);
};

const renderPagination = (page, totalPages, container) => {
  const el = document.getElementById('foods-pagination');
  if (!el || totalPages <= 1) { if (el) el.innerHTML = ''; return; }

  el.innerHTML = `
    <nav aria-label="食物資料庫分頁">
      <ul class="pagination pagination-sm mb-0 justify-content-center">
        <li class="page-item ${page === 1 ? 'disabled' : ''}">
          <button class="page-link" data-pg="${page - 1}">‹</button>
        </li>
        ${Array.from({ length: totalPages }, (_, i) => i + 1)
          .map(p => `<li class="page-item ${p === page ? 'active' : ''}">
            <button class="page-link" data-pg="${p}">${p}</button>
          </li>`).join('')}
        <li class="page-item ${page === totalPages ? 'disabled' : ''}">
          <button class="page-link" data-pg="${page + 1}">›</button>
        </li>
      </ul>
    </nav>
  `;
  el.querySelectorAll('[data-pg]').forEach(btn => {
    btn.addEventListener('click', () => { currentPage = parseInt(btn.dataset.pg, 10); renderTable(container); });
  });
};

const attachEvents = (container) => {
  const session = getCurrentSession();
  let timer;

  document.getElementById('food-search-admin')?.addEventListener('input', (e) => {
    clearTimeout(timer);
    timer = setTimeout(() => { searchKeyword = e.target.value.trim(); currentPage = 1; renderTable(container); }, 300);
  });
  document.getElementById('cat-filter-admin')?.addEventListener('change', (e) => {
    searchCategory = e.target.value; currentPage = 1; renderTable(container);
  });

  document.getElementById('add-food-btn')?.addEventListener('click', openAddModal);
  document.getElementById('import-csv-btn')?.addEventListener('click', () => {
    new window.bootstrap.Modal(document.getElementById('csv-modal')).show();
  });

  document.getElementById('save-food-btn')?.addEventListener('click', () => saveFood(container, session.userId));

  let pendingDeleteId = null;
  const delModal = new window.bootstrap.Modal(document.getElementById('delete-food-modal'));
  window._openDeleteFoodModal = (foodId) => { pendingDeleteId = foodId; delModal.show(); };
  document.getElementById('confirm-del-food-btn')?.addEventListener('click', () => {
    if (!pendingDeleteId) return;
    const result = deleteFood(pendingDeleteId);
    delModal.hide();
    if (result.success) { renderTable(container); showToast('食物已刪除', 'info'); }
    else showToast(result.message, 'danger');
    pendingDeleteId = null;
  });

  document.getElementById('import-btn')?.addEventListener('click', () => handleCsvImport(container, session.userId));
};

const openAddModal = () => {
  document.getElementById('edit-food-id').value = '';
  document.getElementById('food-modal-title').textContent = '新增食物';
  document.getElementById('food-form')?.reset();
  document.getElementById('f-cal').value = '';
  new window.bootstrap.Modal(document.getElementById('food-modal')).show();
};

const openEditModal = (food) => {
  document.getElementById('edit-food-id').value = food.foodId;
  document.getElementById('food-modal-title').textContent = '編輯食物';
  document.getElementById('f-name').value = food.foodName;
  document.getElementById('f-cat').value = food.category;
  document.getElementById('f-size').value = food.servingSize;
  document.getElementById('f-unit').value = food.servingUnit;
  document.getElementById('f-cal').value = food.caloriesPerServing;
  document.getElementById('f-prot').value = food.proteinPerServing;
  document.getElementById('f-fat').value = food.fatPerServing;
  document.getElementById('f-carb').value = food.carbPerServing;
  new window.bootstrap.Modal(document.getElementById('food-modal')).show();
};

const openDeleteModal = (foodId) => {
  window._openDeleteFoodModal(foodId);
};

const saveFood = (container, userId) => {
  const foodName = sanitizeInput(document.getElementById('f-name').value.trim());
  const category = document.getElementById('f-cat').value;
  const cal = parseInt(document.getElementById('f-cal').value, 10);
  if (!foodName) { showToast('請輸入食物名稱', 'warning'); return; }
  if (!category) { showToast('請選擇類別', 'warning'); return; }
  if (isNaN(cal) || cal < 0) { showToast('請輸入正確熱量', 'warning'); return; }

  const editId = document.getElementById('edit-food-id').value;
  const data = {
    foodId: editId || generateFoodId(),
    foodName,
    category,
    servingSize: parseFloat(document.getElementById('f-size').value) || 100,
    servingUnit: sanitizeInput(document.getElementById('f-unit').value.trim()) || '克',
    caloriesPerServing: cal,
    proteinPerServing: parseFloat(document.getElementById('f-prot').value) || 0,
    fatPerServing: parseFloat(document.getElementById('f-fat').value) || 0,
    carbPerServing: parseFloat(document.getElementById('f-carb').value) || 0
  };

  if (editId) {
    updateFood(editId, data);
    showToast('食物已更新', 'success');
  } else {
    const result = addFood(data, userId);
    if (!result.success) { showToast(result.message, 'danger'); return; }
    showToast('食物已新增', 'success');
  }

  window.bootstrap.Modal.getInstance(document.getElementById('food-modal'))?.hide();
  renderTable(container);
};

const handleCsvImport = async (container, userId) => {
  const file = document.getElementById('csv-file')?.files[0];
  if (!file) { showToast('請選擇 CSV 檔案', 'warning'); return; }
  if (!file.name.endsWith('.csv')) { showToast('請選擇 .csv 格式檔案', 'warning'); return; }

  const text = await file.text();
  const result = importFoodsFromCsv(text, userId);

  const el = document.getElementById('csv-result');
  el.classList.remove('d-none');
  el.className = `alert ${result.failed === 0 ? 'alert-success' : 'alert-warning'}`;
  el.textContent = `匯入完成：成功 ${result.success} 筆，失敗 ${result.failed} 筆${result.errors.length ? `（${result.errors.slice(0, 3).join('；')}）` : ''}`;

  renderTable(container);
};

export { mount };
