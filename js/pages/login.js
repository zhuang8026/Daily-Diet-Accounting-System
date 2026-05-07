/**
 * 模組名稱：pages/login.js
 * 功能說明：登入頁面，驗證帳密、顯示錯誤訊息、處理鎖定狀態
 */

import { login } from '../auth.js';
import { showToast } from '../utils.js';

/**
 * 函式名稱：mount
 * 功能說明：渲染登入頁面並綁定表單事件
 * @param {HTMLElement} container - 掛載目標 DOM 元素
 */
const mount = (container) => {
  container.innerHTML = `
    <div class="auth-page d-flex align-items-center justify-content-center min-vh-100 py-4">
      <div class="auth-card card shadow-sm w-100" style="max-width:420px;">
        <div class="card-body p-4 p-md-5">
          <div class="text-center mb-4">
            <i class="bi bi-clipboard2-heart-fill text-success" style="font-size:2.5rem;"></i>
            <h1 class="h4 mt-2 fw-500">每日飲食記帳系統</h1>
            <p class="text-secondary small">請登入您的帳號</p>
          </div>

          <form id="login-form" novalidate>
            <div class="mb-3">
              <label for="login-email" class="form-label">電子郵件</label>
              <input type="email" id="login-email" name="email"
                     class="form-control" placeholder="請輸入 Email"
                     autocomplete="email" required
                     data-testid="login-email">
              <div class="invalid-feedback" id="email-error"></div>
            </div>

            <div class="mb-3">
              <label for="login-password" class="form-label">密碼</label>
              <div class="input-group">
                <input type="password" id="login-password" name="password"
                       class="form-control" placeholder="請輸入密碼"
                       autocomplete="current-password" required
                       data-testid="login-password">
                <button type="button" class="btn btn-outline-secondary" id="toggle-pwd" aria-label="顯示或隱藏密碼">
                  <i class="bi bi-eye" id="pwd-icon"></i>
                </button>
              </div>
              <div class="invalid-feedback" id="pwd-error"></div>
            </div>

            <div class="alert alert-danger d-none" id="login-alert" role="alert" aria-live="assertive"></div>

            <button type="submit" class="btn btn-success w-100 mt-2" id="login-btn"
                    data-testid="login-submit">
              <span id="login-spinner" class="spinner-border spinner-border-sm me-2 d-none" role="status"></span>
              登入
            </button>
          </form>

          <hr class="my-4">
          <p class="text-center text-secondary small mb-2">
            還沒有帳號？<a href="#/register" class="text-success">立即註冊</a>
          </p>
          <p class="text-center text-secondary small">
            <a href="#/about" class="text-secondary">關於本系統</a>
          </p>

          <div class="mt-4 p-3 bg-light rounded small text-secondary">
            <strong>Demo 帳號：</strong><br>
            一般使用者：demo@demo.com / Demo@123<br>
            管理員：admin@demo.com / Admin@123
          </div>
        </div>
      </div>
    </div>
  `;

  attachEvents();
};

/**
 * 函式名稱：attachEvents
 * 功能說明：綁定登入表單的送出、密碼顯示切換事件
 */
const attachEvents = () => {
  const form = document.getElementById('login-form');
  const emailInput = document.getElementById('login-email');
  const pwdInput = document.getElementById('login-password');
  const pwdToggle = document.getElementById('toggle-pwd');
  const alert = document.getElementById('login-alert');
  const spinner = document.getElementById('login-spinner');
  const submitBtn = document.getElementById('login-btn');

  // 密碼顯示/隱藏切換
  pwdToggle.addEventListener('click', () => {
    const isHidden = pwdInput.type === 'password';
    pwdInput.type = isHidden ? 'text' : 'password';
    document.getElementById('pwd-icon').className = isHidden ? 'bi bi-eye-slash' : 'bi bi-eye';
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();

    const email = emailInput.value.trim();
    const password = pwdInput.value;

    if (!email) { showFieldError('email-error', emailInput, 'Email 為必填欄位'); return; }
    if (!password) { showFieldError('pwd-error', pwdInput, '密碼為必填欄位'); return; }

    // 顯示載入中狀態
    submitBtn.disabled = true;
    spinner.classList.remove('d-none');

    try {
      const result = await login(email, password);
      if (result.success) {
        showToast('登入成功，歡迎回來！', 'success');
        window.location.hash = '#/dashboard';
      } else {
        showAlert(result.message, result.locked);
      }
    } catch {
      showAlert('登入時發生錯誤，請重新整理後再試');
    } finally {
      submitBtn.disabled = false;
      spinner.classList.add('d-none');
    }
  });
};

const showFieldError = (errorId, input, message) => {
  input.classList.add('is-invalid');
  const el = document.getElementById(errorId);
  if (el) el.textContent = message;
};

const showAlert = (message, isLocked = false) => {
  const alert = document.getElementById('login-alert');
  alert.classList.remove('d-none');
  alert.classList.toggle('alert-warning', isLocked);
  alert.classList.toggle('alert-danger', !isLocked);
  // 使用 textContent 防止 XSS
  alert.textContent = message;
};

const clearErrors = () => {
  ['login-email', 'login-password'].forEach(id => {
    document.getElementById(id)?.classList.remove('is-invalid');
  });
  document.getElementById('login-alert')?.classList.add('d-none');
};

export { mount };
