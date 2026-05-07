/**
 * 模組名稱：pages/register.js
 * 功能說明：使用者註冊頁面，驗證 Email 格式、密碼強度、確認密碼一致性
 */

import { register } from '../auth.js';
import { validateEmail, validatePassword, showToast } from '../utils.js';

/**
 * 函式名稱：mount
 * 功能說明：渲染註冊頁面並綁定事件
 * @param {HTMLElement} container - 掛載目標 DOM 元素
 */
const mount = (container) => {
  container.innerHTML = `
    <div class="auth-page d-flex align-items-center justify-content-center min-vh-100 py-4">
      <div class="auth-card card shadow-sm w-100" style="max-width:440px;">
        <div class="card-body p-4 p-md-5">
          <div class="text-center mb-4">
            <i class="bi bi-person-plus-fill text-success" style="font-size:2.5rem;"></i>
            <h1 class="h4 mt-2 fw-500">建立帳號</h1>
          </div>

          <form id="register-form" novalidate>
            <div class="mb-3">
              <label for="reg-name" class="form-label">暱稱</label>
              <input type="text" id="reg-name" name="displayName"
                     class="form-control" placeholder="1–30 個字"
                     maxlength="30" required data-testid="reg-name">
              <div class="invalid-feedback" id="name-error"></div>
            </div>

            <div class="mb-3">
              <label for="reg-email" class="form-label">電子郵件</label>
              <input type="email" id="reg-email" name="email"
                     class="form-control" placeholder="請輸入 Email"
                     autocomplete="email" required data-testid="reg-email">
              <div class="invalid-feedback" id="email-error"></div>
            </div>

            <div class="mb-3">
              <label for="reg-password" class="form-label">密碼</label>
              <div class="input-group">
                <input type="password" id="reg-password" name="password"
                       class="form-control" placeholder="至少 6 字元"
                       autocomplete="new-password" required data-testid="reg-password">
                <button type="button" class="btn btn-outline-secondary" id="toggle-pwd" aria-label="顯示或隱藏密碼">
                  <i class="bi bi-eye" id="pwd-icon"></i>
                </button>
              </div>
              <div class="form-text text-secondary small" id="pwd-hint">需包含大寫、小寫、數字、符號中至少 3 種，且至少 6 字元</div>
              <div class="invalid-feedback" id="pwd-error"></div>
              <div id="pwd-strength" class="mt-1"></div>
            </div>

            <div class="mb-4">
              <label for="reg-confirm" class="form-label">確認密碼</label>
              <input type="password" id="reg-confirm" name="confirmPassword"
                     class="form-control" placeholder="再次輸入密碼"
                     autocomplete="new-password" required data-testid="reg-confirm">
              <div class="invalid-feedback" id="confirm-error"></div>
            </div>

            <div class="alert alert-danger d-none" id="reg-alert" role="alert" aria-live="assertive"></div>

            <button type="submit" class="btn btn-success w-100" id="reg-btn" data-testid="reg-submit">
              <span id="reg-spinner" class="spinner-border spinner-border-sm me-2 d-none" role="status"></span>
              建立帳號
            </button>
          </form>

          <hr class="my-4">
          <p class="text-center text-secondary small">
            已有帳號？<a href="#/login" class="text-success">立即登入</a>
          </p>
        </div>
      </div>
    </div>
  `;

  attachEvents();
};

/**
 * 函式名稱：attachEvents
 * 功能說明：綁定表單事件，包含密碼強度即時顯示與送出驗證
 */
const attachEvents = () => {
  const form = document.getElementById('register-form');
  const pwdInput = document.getElementById('reg-password');
  const pwdToggle = document.getElementById('toggle-pwd');

  // 密碼顯示/隱藏切換
  pwdToggle.addEventListener('click', () => {
    const isHidden = pwdInput.type === 'password';
    pwdInput.type = isHidden ? 'text' : 'password';
    document.getElementById('pwd-icon').className = isHidden ? 'bi bi-eye-slash' : 'bi bi-eye';
  });

  // 密碼強度即時顯示
  pwdInput.addEventListener('input', () => {
    const { isValid, typeCount } = validatePassword(pwdInput.value);
    const strengthEl = document.getElementById('pwd-strength');
    const labels = ['弱', '弱', '尚可', '強', '非常強'];
    const colors = ['danger', 'danger', 'warning', 'success', 'success'];
    if (pwdInput.value.length > 0) {
      strengthEl.innerHTML = `<span class="badge text-bg-${colors[typeCount] || 'danger'}">密碼強度：${labels[typeCount] || '弱'}</span>`;
    } else {
      strengthEl.innerHTML = '';
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();

    const displayName = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = pwdInput.value;
    const confirm = document.getElementById('reg-confirm').value;

    let hasError = false;

    if (!displayName || displayName.length < 1) {
      showFieldError('name-error', 'reg-name', '請輸入暱稱');
      hasError = true;
    }
    if (!validateEmail(email)) {
      showFieldError('email-error', 'reg-email', 'Email 格式不正確');
      hasError = true;
    }
    const { isValid } = validatePassword(password);
    if (!isValid) {
      showFieldError('pwd-error', 'reg-password', '密碼強度不足，需至少 6 字元且包含 3 種字元類型');
      hasError = true;
    }
    if (password !== confirm) {
      showFieldError('confirm-error', 'reg-confirm', '兩次輸入的密碼不一致');
      hasError = true;
    }
    if (hasError) return;

    const btn = document.getElementById('reg-btn');
    const spinner = document.getElementById('reg-spinner');
    btn.disabled = true;
    spinner.classList.remove('d-none');

    try {
      const result = await register(email, password, displayName);
      if (result.success) {
        showToast('註冊成功，請登入', 'success');
        window.location.hash = '#/login';
      } else {
        const alert = document.getElementById('reg-alert');
        alert.classList.remove('d-none');
        alert.textContent = result.message;
      }
    } catch {
      document.getElementById('reg-alert').classList.remove('d-none');
      document.getElementById('reg-alert').textContent = '系統錯誤，請稍後再試';
    } finally {
      btn.disabled = false;
      spinner.classList.add('d-none');
    }
  });
};

const showFieldError = (errorId, inputId, message) => {
  document.getElementById(inputId)?.classList.add('is-invalid');
  const el = document.getElementById(errorId);
  if (el) el.textContent = message;
};

const clearErrors = () => {
  ['reg-name', 'reg-email', 'reg-password', 'reg-confirm'].forEach(id => {
    document.getElementById(id)?.classList.remove('is-invalid');
  });
  document.getElementById('reg-alert')?.classList.add('d-none');
};

export { mount };
