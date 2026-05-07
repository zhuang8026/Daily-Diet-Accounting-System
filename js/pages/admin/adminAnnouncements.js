/**
 * 模組名稱：pages/admin/adminAnnouncements.js
 * 功能說明：後台系統公告管理，支援新增、編輯、刪除，最多 1 則有效公告同時顯示於前台
 */

import { getAnnouncements, addAnnouncement, updateAnnouncement, deleteAnnouncement } from '../../announcementService.js';
import { showToast, getTodayISO, sanitizeInput } from '../../utils.js';

/**
 * 函式名稱：mount
 * 功能說明：掛載系統公告管理頁
 * @param {HTMLElement} container - 掛載目標
 */
const mount = (container) => {
  container.innerHTML = buildHTML();
  attachEvents(container);
  renderList(container);
};

const buildHTML = () => `
  <div class="container-fluid p-3">
    <div class="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
      <h1 class="h5 fw-500 mb-0">系統公告管理</h1>
      <button class="btn btn-success btn-sm" id="add-ann-btn">
        <i class="bi bi-megaphone-fill me-1"></i>新增公告
      </button>
    </div>

    <div class="alert alert-info small">
      <i class="bi bi-info-circle-fill me-1"></i>
      最多 1 則有效公告同時顯示於前台首頁頂端，超過 1 則啟用時僅顯示第一則符合的公告。
    </div>

    <div id="ann-list" class="row g-3"></div>
  </div>

  <div class="modal fade" id="ann-modal" tabindex="-1" aria-labelledby="ann-modal-title" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h2 class="modal-title h5" id="ann-modal-title">新增公告</h2>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="關閉"></button>
        </div>
        <div class="modal-body">
          <form id="ann-form" novalidate>
            <input type="hidden" id="edit-ann-id">
            <div class="mb-3">
              <label for="ann-title-input" class="form-label">公告標題 <span class="text-danger">*</span></label>
              <input type="text" id="ann-title-input" class="form-control" maxlength="50" required>
              <div class="form-text">最多 50 字</div>
            </div>
            <div class="mb-3">
              <label for="ann-content-input" class="form-label">公告內容 <span class="text-danger">*</span></label>
              <textarea id="ann-content-input" class="form-control" rows="4" maxlength="500" required></textarea>
              <div class="form-text">最多 500 字</div>
            </div>
            <div class="row g-2 mb-3">
              <div class="col-6">
                <label for="ann-start" class="form-label">生效日期 <span class="text-danger">*</span></label>
                <input type="date" id="ann-start" class="form-control" required>
              </div>
              <div class="col-6">
                <label for="ann-end" class="form-label">到期日期 <span class="text-danger">*</span></label>
                <input type="date" id="ann-end" class="form-control" required>
              </div>
            </div>
            <div class="form-check">
              <input class="form-check-input" type="checkbox" id="ann-active" checked>
              <label class="form-check-label" for="ann-active">啟用此公告</label>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">取消</button>
          <button type="button" class="btn btn-success btn-sm" id="save-ann-btn">儲存</button>
        </div>
      </div>
    </div>
  </div>

  <div class="modal fade" id="del-ann-modal" tabindex="-1" aria-labelledby="del-ann-title" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-sm">
      <div class="modal-content">
        <div class="modal-header">
          <h2 class="modal-title h5" id="del-ann-title">確認刪除公告</h2>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="關閉"></button>
        </div>
        <div class="modal-body">確定要刪除此公告嗎？</div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">取消</button>
          <button type="button" class="btn btn-danger btn-sm" id="confirm-del-ann-btn">確認刪除</button>
        </div>
      </div>
    </div>
  </div>
`;

const renderList = (container) => {
  const list = getAnnouncements();
  const el = document.getElementById('ann-list');
  if (!el) return;

  if (list.length === 0) {
    el.innerHTML = `<div class="col-12 text-center text-secondary py-5">
      <i class="bi bi-megaphone fs-2 d-block mb-2"></i>尚無公告
    </div>`;
    return;
  }

  el.innerHTML = '';
  const today = getTodayISO();

  list.forEach(ann => {
    const isEffective = ann.isActive && ann.startDate <= today && ann.endDate >= today;
    const card = document.createElement('div');
    card.className = 'col-12 col-md-6';

    const inner = document.createElement('div');
    inner.className = `card h-100 ${isEffective ? 'border-success' : ''}`;

    const body = document.createElement('div');
    body.className = 'card-body';

    const headerRow = document.createElement('div');
    headerRow.className = 'd-flex justify-content-between align-items-start mb-2';

    const titleEl = document.createElement('h3');
    titleEl.className = 'h6 mb-0 fw-bold';
    titleEl.textContent = ann.title; // textContent 防 XSS

    const badges = document.createElement('div');
    badges.className = 'd-flex gap-1 flex-wrap';

    const activeBadge = document.createElement('span');
    activeBadge.className = `badge ${ann.isActive ? 'text-bg-success' : 'text-bg-secondary'}`;
    activeBadge.textContent = ann.isActive ? '啟用' : '停用';

    if (isEffective) {
      const effBadge = document.createElement('span');
      effBadge.className = 'badge text-bg-warning';
      effBadge.textContent = '生效中';
      badges.appendChild(effBadge);
    }
    badges.appendChild(activeBadge);
    headerRow.append(titleEl, badges);

    const contentEl = document.createElement('p');
    contentEl.className = 'small text-secondary mb-2';
    contentEl.textContent = ann.content; // textContent 防 XSS

    const dateEl = document.createElement('p');
    dateEl.className = 'small text-muted mb-0';
    dateEl.textContent = `生效：${ann.startDate} ~ ${ann.endDate}`;

    body.append(headerRow, contentEl, dateEl);

    const footer = document.createElement('div');
    footer.className = 'card-footer d-flex gap-2 justify-content-end';

    const toggleBtn = document.createElement('button');
    toggleBtn.className = `btn btn-sm btn-outline-${ann.isActive ? 'warning' : 'success'}`;
    toggleBtn.textContent = ann.isActive ? '停用' : '啟用';
    toggleBtn.addEventListener('click', () => {
      updateAnnouncement(ann.id, { isActive: !ann.isActive });
      renderList(container);
      showToast(`公告已${ann.isActive ? '停用' : '啟用'}`, ann.isActive ? 'warning' : 'success');
    });

    const editBtn = document.createElement('button');
    editBtn.className = 'btn btn-sm btn-outline-secondary';
    editBtn.innerHTML = '<i class="bi bi-pencil"></i> 編輯';
    editBtn.addEventListener('click', () => openEditModal(ann));

    const delBtn = document.createElement('button');
    delBtn.className = 'btn btn-sm btn-outline-danger';
    delBtn.innerHTML = '<i class="bi bi-trash"></i>';
    delBtn.addEventListener('click', () => { pendingDeleteId = ann.id; delModal.show(); });

    footer.append(toggleBtn, editBtn, delBtn);
    inner.append(body, footer);
    card.appendChild(inner);
    el.appendChild(card);
  });
};

let pendingDeleteId = null;
let delModal;

const attachEvents = (container) => {
  delModal = new window.bootstrap.Modal(document.getElementById('del-ann-modal'));

  document.getElementById('add-ann-btn')?.addEventListener('click', () => {
    document.getElementById('edit-ann-id').value = '';
    document.getElementById('ann-modal-title').textContent = '新增公告';
    document.getElementById('ann-form')?.reset();
    document.getElementById('ann-start').value = getTodayISO();
    document.getElementById('ann-end').value = getTodayISO();
    document.getElementById('ann-active').checked = true;
    new window.bootstrap.Modal(document.getElementById('ann-modal')).show();
  });

  document.getElementById('save-ann-btn')?.addEventListener('click', () => saveAnnouncement(container));

  document.getElementById('confirm-del-ann-btn')?.addEventListener('click', () => {
    if (!pendingDeleteId) return;
    deleteAnnouncement(pendingDeleteId);
    delModal.hide();
    renderList(container);
    showToast('公告已刪除', 'info');
    pendingDeleteId = null;
  });
};

const openEditModal = (ann) => {
  document.getElementById('edit-ann-id').value = ann.id;
  document.getElementById('ann-modal-title').textContent = '編輯公告';
  document.getElementById('ann-title-input').value = ann.title;
  document.getElementById('ann-content-input').value = ann.content;
  document.getElementById('ann-start').value = ann.startDate;
  document.getElementById('ann-end').value = ann.endDate;
  document.getElementById('ann-active').checked = ann.isActive;
  new window.bootstrap.Modal(document.getElementById('ann-modal')).show();
};

const saveAnnouncement = (container) => {
  const title = sanitizeInput(document.getElementById('ann-title-input').value.trim());
  const content = sanitizeInput(document.getElementById('ann-content-input').value.trim());
  const startDate = document.getElementById('ann-start').value;
  const endDate = document.getElementById('ann-end').value;
  const isActive = document.getElementById('ann-active').checked;
  const editId = document.getElementById('edit-ann-id').value;

  if (!title) { showToast('請輸入公告標題', 'warning'); return; }
  if (!content) { showToast('請輸入公告內容', 'warning'); return; }
  if (!startDate || !endDate) { showToast('請選擇生效日期與到期日期', 'warning'); return; }
  if (startDate > endDate) { showToast('到期日期需晚於或等於生效日期', 'warning'); return; }

  if (editId) {
    updateAnnouncement(editId, { title, content, startDate, endDate, isActive });
    showToast('公告已更新', 'success');
  } else {
    addAnnouncement({ title, content, startDate, endDate, isActive });
    showToast('公告已新增', 'success');
  }

  window.bootstrap.Modal.getInstance(document.getElementById('ann-modal'))?.hide();
  renderList(container);
};

export { mount };
