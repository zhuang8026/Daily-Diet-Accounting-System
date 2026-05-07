/**
 * 模組名稱：pages/settings.js
 * 功能說明：個人目標設定頁，包含生理資料輸入、Harris-Benedict 公式計算建議熱量、
 *           手動覆蓋目標值
 */

import { getCurrentSession } from '../auth.js';
import { getProfile, updateProfile } from '../profileService.js';
import { calculateBMR, showToast, sanitizeInput } from '../utils.js';

/**
 * 函式名稱：mount
 * 功能說明：掛載個人目標設定頁
 * @param {HTMLElement} container - 掛載目標
 */
const mount = (container) => {
  const session = getCurrentSession();
  const profile = getProfile(session.userId) || {};
  container.innerHTML = buildHTML(profile);
  attachEvents(container, session.userId, profile);
};

const buildHTML = (p) => `
  <div class="container py-4" style="max-width:680px;">
    <h1 class="h5 fw-500 mb-4">個人目標設定</h1>

    <form id="settings-form" novalidate>
      <div class="card p-4 mb-4">
        <h2 class="h6 mb-3 text-secondary">生理資料</h2>

        <div class="mb-3">
          <label class="form-label">性別 <span class="text-danger">*</span></label>
          <div class="d-flex gap-4">
            <div class="form-check">
              <input class="form-check-input" type="radio" name="gender" id="gender-male"
                     value="male" ${p.gender === 'male' || !p.gender ? 'checked' : ''}>
              <label class="form-check-label" for="gender-male">男</label>
            </div>
            <div class="form-check">
              <input class="form-check-input" type="radio" name="gender" id="gender-female"
                     value="female" ${p.gender === 'female' ? 'checked' : ''}>
              <label class="form-check-label" for="gender-female">女</label>
            </div>
          </div>
        </div>

        <div class="row g-3">
          <div class="col-6 col-sm-4">
            <label for="age-input" class="form-label">年齡 <span class="text-danger">*</span></label>
            <div class="input-group">
              <input type="number" id="age-input" name="age" class="form-control"
                     value="${p.age || ''}" min="10" max="120" required
                     data-testid="age-input">
              <span class="input-group-text">歲</span>
            </div>
            <div class="invalid-feedback">年齡需介於 10–120 歲</div>
          </div>
          <div class="col-6 col-sm-4">
            <label for="height-input" class="form-label">身高 <span class="text-danger">*</span></label>
            <div class="input-group">
              <input type="number" id="height-input" name="heightCm" class="form-control"
                     value="${p.heightCm || ''}" min="50" max="250" step="0.1" required
                     data-testid="height-input">
              <span class="input-group-text">cm</span>
            </div>
            <div class="invalid-feedback">身高需介於 50–250 cm</div>
          </div>
          <div class="col-6 col-sm-4">
            <label for="weight-input" class="form-label">體重 <span class="text-danger">*</span></label>
            <div class="input-group">
              <input type="number" id="weight-input" name="weightKg" class="form-control"
                     value="${p.weightKg || ''}" min="20" max="300" step="0.1" required
                     data-testid="weight-input">
              <span class="input-group-text">kg</span>
            </div>
            <div class="invalid-feedback">體重需介於 20–300 kg</div>
          </div>
        </div>

        <div class="mt-3">
          <label for="activity-select" class="form-label">活動量 <span class="text-danger">*</span></label>
          <select id="activity-select" name="activityLevel" class="form-select" required>
            <option value="sedentary" ${p.activityLevel === 'sedentary' ? 'selected' : ''}>久坐（幾乎不運動）</option>
            <option value="light" ${p.activityLevel === 'light' ? 'selected' : ''}>輕度（每週運動 1–3 天）</option>
            <option value="moderate" ${p.activityLevel === 'moderate' ? 'selected' : ''}>中度（每週運動 3–5 天）</option>
            <option value="active" ${p.activityLevel === 'active' ? 'selected' : ''}>高度（每週運動 6–7 天）</option>
            <option value="veryActive" ${p.activityLevel === 'veryActive' ? 'selected' : ''}>非常高度（體力勞動或每日訓練）</option>
          </select>
        </div>
      </div>

      <div class="card p-4 mb-4">
        <h2 class="h6 mb-3 text-secondary">飲食目標</h2>

        <div class="mb-3">
          <label class="form-label">目標 <span class="text-danger">*</span></label>
          <div class="row g-2">
            ${[['lose', '減重（降低攝取）'], ['maintain', '維持體重'], ['gain', '增肌（提高攝取）']].map(([val, label]) => `
            <div class="col-12 col-sm-4">
              <div class="form-check border rounded p-3 h-100 ${p.dietGoal === val || (!p.dietGoal && val === 'maintain') ? 'border-success' : ''}">
                <input class="form-check-input" type="radio" name="dietGoal" id="goal-${val}"
                       value="${val}" ${p.dietGoal === val || (!p.dietGoal && val === 'maintain') ? 'checked' : ''}>
                <label class="form-check-label fw-500" for="goal-${val}">${label}</label>
              </div>
            </div>`).join('')}
          </div>
        </div>

        <div class="alert alert-light border d-flex align-items-center justify-content-between mb-3" id="bmr-result">
          <div>
            <div class="small text-secondary">Harris-Benedict 建議熱量</div>
            <div class="fs-5 fw-bold text-success" id="suggested-cal">—</div>
          </div>
          <button type="button" class="btn btn-outline-success btn-sm" id="apply-suggested-btn"
                  data-testid="apply-suggested">套用建議值</button>
        </div>

        <div class="row g-3">
          <div class="col-6 col-sm-3">
            <label for="target-cal" class="form-label">熱量目標 <span class="text-danger">*</span></label>
            <div class="input-group">
              <input type="number" id="target-cal" name="targetCalories" class="form-control"
                     value="${p.targetCalories || 2000}" min="500" required
                     data-testid="target-cal">
              <span class="input-group-text">kcal</span>
            </div>
            <div class="invalid-feedback">熱量目標需 ≥ 500 kcal</div>
          </div>
          <div class="col-6 col-sm-3">
            <label for="target-protein" class="form-label">蛋白質目標</label>
            <div class="input-group">
              <input type="number" id="target-protein" class="form-control"
                     value="${p.targetProtein || 0}" min="0" step="0.1">
              <span class="input-group-text">g</span>
            </div>
          </div>
          <div class="col-6 col-sm-3">
            <label for="target-fat" class="form-label">脂肪目標</label>
            <div class="input-group">
              <input type="number" id="target-fat" class="form-control"
                     value="${p.targetFat || 0}" min="0" step="0.1">
              <span class="input-group-text">g</span>
            </div>
          </div>
          <div class="col-6 col-sm-3">
            <label for="target-carb" class="form-label">碳水目標</label>
            <div class="input-group">
              <input type="number" id="target-carb" class="form-control"
                     value="${p.targetCarb || 0}" min="0" step="0.1">
              <span class="input-group-text">g</span>
            </div>
          </div>
        </div>
      </div>

      <div class="card p-4 mb-4">
        <h2 class="h6 mb-3 text-secondary">帳號資訊</h2>
        <div class="mb-3">
          <label for="display-name-input" class="form-label">暱稱</label>
          <input type="text" id="display-name-input" class="form-control"
                 value="${p.displayName || ''}" maxlength="30">
        </div>
        <div class="text-secondary small">Email：${p.email || ''}</div>
      </div>

      <button type="submit" class="btn btn-success px-5" id="save-settings-btn">
        <span id="save-spinner" class="spinner-border spinner-border-sm me-2 d-none" role="status"></span>
        儲存設定
      </button>
    </form>
  </div>
`;

/**
 * 函式名稱：attachEvents
 * 功能說明：綁定表單事件、Harris-Benedict 即時計算、套用建議值
 */
const attachEvents = (container, userId, initialProfile) => {
  const calcBMRDisplay = () => {
    const gender = document.querySelector('input[name="gender"]:checked')?.value;
    const age = parseInt(document.getElementById('age-input').value, 10);
    const heightCm = parseFloat(document.getElementById('height-input').value);
    const weightKg = parseFloat(document.getElementById('weight-input').value);
    const activityLevel = document.getElementById('activity-select').value;
    const dietGoal = document.querySelector('input[name="dietGoal"]:checked')?.value;

    if (gender && age >= 10 && heightCm >= 50 && weightKg >= 20) {
      const suggested = calculateBMR({ gender, age, heightCm, weightKg, activityLevel, dietGoal: dietGoal || 'maintain' });
      const el = document.getElementById('suggested-cal');
      if (el) el.textContent = `${suggested} kcal`;
      return suggested;
    }
    return null;
  };

  // 監聽所有影響 BMR 的欄位變化
  ['age-input', 'height-input', 'weight-input', 'activity-select'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', calcBMRDisplay);
  });
  document.querySelectorAll('input[name="gender"], input[name="dietGoal"]').forEach(el => {
    el.addEventListener('change', calcBMRDisplay);
  });

  // 套用建議值按鈕
  document.getElementById('apply-suggested-btn')?.addEventListener('click', () => {
    const suggested = calcBMRDisplay();
    if (suggested) {
      document.getElementById('target-cal').value = suggested;
      showToast(`已套用建議熱量 ${suggested} kcal`, 'info');
    } else {
      showToast('請先填寫完整生理資料', 'warning');
    }
  });

  // 初始計算一次
  calcBMRDisplay();

  // 表單送出
  document.getElementById('settings-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const btn = document.getElementById('save-settings-btn');
    const spinner = document.getElementById('save-spinner');
    btn.disabled = true;
    spinner.classList.remove('d-none');

    try {
      const updates = {
        displayName: sanitizeInput(document.getElementById('display-name-input').value.trim()) || initialProfile.displayName,
        gender: document.querySelector('input[name="gender"]:checked')?.value,
        age: parseInt(document.getElementById('age-input').value, 10),
        heightCm: parseFloat(document.getElementById('height-input').value),
        weightKg: parseFloat(document.getElementById('weight-input').value),
        activityLevel: document.getElementById('activity-select').value,
        dietGoal: document.querySelector('input[name="dietGoal"]:checked')?.value,
        targetCalories: parseInt(document.getElementById('target-cal').value, 10),
        targetProtein: parseFloat(document.getElementById('target-protein').value) || 0,
        targetFat: parseFloat(document.getElementById('target-fat').value) || 0,
        targetCarb: parseFloat(document.getElementById('target-carb').value) || 0
      };

      updateProfile(userId, updates);
      showToast('設定已儲存', 'success');
    } catch {
      showToast('儲存失敗，請再試一次', 'danger');
    } finally {
      btn.disabled = false;
      spinner.classList.add('d-none');
    }
  });
};

const validateForm = () => {
  let isValid = true;
  const checks = [
    { id: 'age-input', test: v => v >= 10 && v <= 120, msg: '年齡需介於 10–120 歲' },
    { id: 'height-input', test: v => v >= 50 && v <= 250, msg: '身高需介於 50–250 cm' },
    { id: 'weight-input', test: v => v >= 20 && v <= 300, msg: '體重需介於 20–300 kg' },
    { id: 'target-cal', test: v => v >= 500, msg: '熱量目標需 ≥ 500 kcal' }
  ];

  checks.forEach(({ id, test, msg }) => {
    const el = document.getElementById(id);
    const val = parseFloat(el.value);
    if (!test(val)) {
      el.classList.add('is-invalid');
      isValid = false;
    } else {
      el.classList.remove('is-invalid');
    }
  });

  return isValid;
};

export { mount };
