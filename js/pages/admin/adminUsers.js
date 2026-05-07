/**
 * 模組名稱：pages/admin/adminUsers.js
 * 功能說明：後台使用者管理，支援啟用/停用、變更角色、重設密碼、刪除帳號（含二次確認）
 */

import { getStorage, setStorage } from '../../storage.js';
import { getCurrentSession } from '../../auth.js';
import { showToast, formatISO } from '../../utils.js';

/**
 * 函式名稱：mount
 * 功能說明：掛載後台使用者管理頁
 * @param {HTMLElement} container - 掛載目標
 */
const mount = (container) => {
  container.innerHTML = buildHTML();
  attachEvents(container);
  renderTable(container);
};

const buildHTML = () => `
  <div class="container-fluid p-3">
    <h1 class="h5 fw-500 mb-4">使用者管理</h1>
    <div class="card">
      <div class="table-responsive">
        <table class="table table-hover mb-0">
          <caption class="visually-hidden">使用者管理列表</caption>
          <thead class="table-light">
            <tr>
              <th scope="col">暱稱</th>
              <th scope="col">Email</th>
              <th scope="col">角色</th>
              <th scope="col">狀態</th>
              <th scope="col" class="d-none d-md-table-cell">最後登入</th>
              <th scope="col" class="d-none d-md-table-cell">建立時間</th>
              <th scope="col">操作</th>
            </tr>
          </thead>
          <tbody id="users-tbody"></tbody>
        </table>
      </div>
    </div>
  </div>

  <div class="modal fade" id="del-user-modal" tabindex="-1" aria-labelledby="del-user-title" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-sm">
      <div class="modal-content">
        <div class="modal-header">
          <h2 class="modal-title h5" id="del-user-title">確認刪除帳號</h2>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="關閉"></button>
        </div>
        <div class="modal-body">
          <p>確定要刪除此帳號嗎？<strong>所有相關飲食紀錄將一併刪除，且無法復原。</strong></p>
          <div id="del-user-info" class="alert alert-light small"></div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">取消</button>
          <button type="button" class="btn btn-danger btn-sm" id="confirm-del-user-btn">確認刪除</button>
        </div>
      </div>
    </div>
  </div>

  <div class="modal fade" id="reset-pwd-modal" tabindex="-1" aria-labelledby="reset-pwd-title" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-sm">
      <div class="modal-content">
        <div class="modal-header">
          <h2 class="modal-title h5" id="reset-pwd-title">強制重設密碼</h2>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="關閉"></button>
        </div>
        <div class="modal-body">
          <p class="text-secondary small">以下為系統產生的臨時密碼，請複製並通知使用者：</p>
          <div class="alert alert-success d-flex align-items-center justify-content-between">
            <code id="temp-pwd-display" class="fs-6 fw-bold"></code>
            <button class="btn btn-sm btn-outline-secondary ms-2" id="copy-pwd-btn" aria-label="複製臨時密碼">
              <i class="bi bi-clipboard"></i>
            </button>
          </div>
          <p class="text-danger small">⚠️ 此臨時密碼僅顯示一次，請立即複製</p>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-primary btn-sm" id="apply-reset-btn">套用重設</button>
          <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">取消</button>
        </div>
      </div>
    </div>
  </div>
`;

const renderTable = (container) => {
  const users = getStorage('ddas_users') || [];
  const session = getCurrentSession();
  const tbody = document.getElementById('users-tbody');
  if (!tbody) return;

  tbody.innerHTML = '';
  users.forEach(u => {
    const tr = document.createElement('tr');
    const isSelf = u.userId === session?.userId;

    // 使用 textContent 安全插入資料
    const cells = [
      { val: u.displayName, tag: 'th', attr: { scope: 'row' } },
      { val: u.email },
      { val: u.role === 'admin' ? '管理員' : '一般使用者' },
      { val: u.isActive ? '啟用' : '停用', cls: u.isActive ? 'text-success' : 'text-danger fw-bold' },
      { val: u.lastLoginAt ? u.lastLoginAt.slice(0, 10) : '從未', cls: 'd-none d-md-table-cell' },
      { val: u.createdAt.slice(0, 10), cls: 'd-none d-md-table-cell' }
    ];

    cells.forEach(({ val, tag = 'td', attr = {}, cls = '' }) => {
      const el = document.createElement(tag);
      Object.entries(attr).forEach(([k, v]) => el.setAttribute(k, v));
      if (cls) el.className = cls;
      el.textContent = val;
      tr.appendChild(el);
    });

    const actionTd = document.createElement('td');
    actionTd.className = 'd-flex gap-1 flex-wrap';

    // 啟用/停用按鈕
    if (!isSelf) {
      const toggleBtn = document.createElement('button');
      toggleBtn.className = `btn btn-xs btn-outline-${u.isActive ? 'warning' : 'success'} btn-sm`;
      toggleBtn.title = u.isActive ? '停用帳號' : '啟用帳號';
      toggleBtn.innerHTML = `<i class="bi bi-${u.isActive ? 'pause-circle' : 'play-circle'}"></i>`;
      toggleBtn.addEventListener('click', () => toggleActive(u.userId, !u.isActive, container));
      actionTd.appendChild(toggleBtn);

      // 變更角色按鈕
      const roleBtn = document.createElement('button');
      roleBtn.className = 'btn btn-sm btn-outline-secondary';
      roleBtn.title = u.role === 'admin' ? '降為一般使用者' : '提升為管理員';
      roleBtn.innerHTML = `<i class="bi bi-${u.role === 'admin' ? 'person-down' : 'person-up'}"></i>`;
      roleBtn.addEventListener('click', () => toggleRole(u.userId, u.role === 'admin' ? 'user' : 'admin', container));
      actionTd.appendChild(roleBtn);

      // 刪除按鈕
      const delBtn = document.createElement('button');
      delBtn.className = 'btn btn-sm btn-outline-danger';
      delBtn.title = '刪除帳號';
      delBtn.innerHTML = '<i class="bi bi-trash"></i>';
      delBtn.addEventListener('click', () => openDeleteModal(u));
      actionTd.appendChild(delBtn);
    }

    // 重設密碼按鈕
    const resetBtn = document.createElement('button');
    resetBtn.className = 'btn btn-sm btn-outline-info';
    resetBtn.title = '強制重設密碼';
    resetBtn.innerHTML = '<i class="bi bi-key"></i>';
    resetBtn.addEventListener('click', () => openResetPwdModal(u.userId));
    actionTd.appendChild(resetBtn);

    if (isSelf) {
      const selfBadge = document.createElement('span');
      selfBadge.className = 'badge bg-secondary align-self-center';
      selfBadge.textContent = '（自己）';
      actionTd.appendChild(selfBadge);
    }

    tr.appendChild(actionTd);
    tbody.appendChild(tr);
  });
};

const toggleActive = (userId, newState, container) => {
  const users = getStorage('ddas_users') || [];
  setStorage('ddas_users', users.map(u =>
    u.userId === userId ? { ...u, isActive: newState, updatedAt: formatISO() } : u
  ));
  renderTable(container);
  showToast(`帳號已${newState ? '啟用' : '停用'}`, newState ? 'success' : 'warning');
};

const toggleRole = (userId, newRole, container) => {
  const users = getStorage('ddas_users') || [];
  setStorage('ddas_users', users.map(u =>
    u.userId === userId ? { ...u, role: newRole, updatedAt: formatISO() } : u
  ));
  renderTable(container);
  showToast(`角色已變更為${newRole === 'admin' ? '管理員' : '一般使用者'}`, 'success');
};

let pendingDeleteUser = null;
const openDeleteModal = (user) => {
  pendingDeleteUser = user;
  const infoEl = document.getElementById('del-user-info');
  infoEl.textContent = `${user.displayName}（${user.email}）`;
  new window.bootstrap.Modal(document.getElementById('del-user-modal')).show();
};

let pendingResetUserId = null;
let tempPwd = null;

const openResetPwdModal = (userId) => {
  pendingResetUserId = userId;
  // 產生隨機臨時密碼（大寫+小寫+數字+符號，符合密碼規則）
  tempPwd = `Tmp@${Math.random().toString(36).slice(2, 8)}${Math.floor(Math.random() * 90 + 10)}`;
  const el = document.getElementById('temp-pwd-display');
  if (el) el.textContent = tempPwd;
  new window.bootstrap.Modal(document.getElementById('reset-pwd-modal')).show();
};

const attachEvents = (container) => {
  document.getElementById('confirm-del-user-btn')?.addEventListener('click', async () => {
    if (!pendingDeleteUser) return;
    const users = getStorage('ddas_users') || [];
    setStorage('ddas_users', users.filter(u => u.userId !== pendingDeleteUser.userId));
    // 清除使用者的飲食紀錄與設定
    localStorage.removeItem(`ddas_records_${pendingDeleteUser.userId}`);
    localStorage.removeItem(`ddas_profile_${pendingDeleteUser.userId}`);
    window.bootstrap.Modal.getInstance(document.getElementById('del-user-modal'))?.hide();
    renderTable(container);
    showToast('帳號已刪除', 'info');
    pendingDeleteUser = null;
  });

  document.getElementById('copy-pwd-btn')?.addEventListener('click', () => {
    if (tempPwd) {
      navigator.clipboard.writeText(tempPwd).then(() => showToast('已複製臨時密碼', 'success'));
    }
  });

  document.getElementById('apply-reset-btn')?.addEventListener('click', async () => {
    if (!pendingResetUserId || !tempPwd) return;
    const bcrypt = window.dcodeIO?.bcrypt;
    if (!bcrypt) { showToast('密碼服務未就緒', 'danger'); return; }

    const hash = await new Promise((res, rej) =>
      bcrypt.hash(tempPwd, 12, (err, h) => err ? rej(err) : res(h))
    );
    const users = getStorage('ddas_users') || [];
    setStorage('ddas_users', users.map(u =>
      u.userId === pendingResetUserId ? { ...u, passwordHash: hash, updatedAt: formatISO() } : u
    ));
    window.bootstrap.Modal.getInstance(document.getElementById('reset-pwd-modal'))?.hide();
    showToast('密碼已重設', 'success');
    pendingResetUserId = null;
    tempPwd = null;
  });
};

export { mount };
