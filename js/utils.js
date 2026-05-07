/**
 * 模組名稱：utils.js
 * 功能說明：提供全系統共用的工具函式，包含 Toast 通知、日期格式化、
 *           輸入清理、驗證工具、Harris-Benedict 公式計算等
 */

/**
 * 函式名稱：generateUUID
 * 功能說明：產生符合 RFC 4122 v4 的 UUID 字串
 * @returns {string} UUID 字串
 */
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * 函式名稱：getTodayISO
 * 功能說明：回傳今日日期的 YYYY-MM-DD 格式字串（本地時間）
 * @returns {string} 日期字串
 */
const getTodayISO = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/**
 * 函式名稱：formatDateDisplay
 * 功能說明：將 YYYY-MM-DD 格式轉為繁體中文顯示（如 2026年05月07日）
 * @param {string} dateStr - YYYY-MM-DD 格式日期字串
 * @returns {string} 中文日期字串
 */
const formatDateDisplay = (dateStr) => {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  const today = getTodayISO();
  const yesterday = offsetDate(today, -1);
  if (dateStr === today) return `${y}年${m}月${d}日（今天）`;
  if (dateStr === yesterday) return `${y}年${m}月${d}日（昨天）`;
  return `${y}年${m}月${d}日`;
};

/**
 * 函式名稱：offsetDate
 * 功能說明：對 YYYY-MM-DD 日期做天數偏移
 * @param {string} dateStr - 基準日期
 * @param {number} days - 偏移天數（正數為未來，負數為過去）
 * @returns {string} 偏移後日期
 */
const offsetDate = (dateStr, days) => {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

/**
 * 函式名稱：sanitizeInput
 * 功能說明：移除字串中的 HTML 標籤，防止 XSS 注入
 * @param {string} str - 原始輸入字串
 * @returns {string} 清理後的字串
 */
const sanitizeInput = (str) => {
  if (typeof str !== 'string') return '';
  // 移除所有 HTML 標籤與 script 相關字元
  return str.replace(/<[^>]*>/g, '').replace(/[<>]/g, '');
};

/**
 * 函式名稱：validateEmail
 * 功能說明：驗證 Email 格式是否合法
 * @param {string} email - Email 字串
 * @returns {boolean} 是否合法
 */
const validateEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

/**
 * 函式名稱：validatePassword
 * 功能說明：驗證密碼強度，需滿足最短 6 字元且包含大寫/小寫/數字/符號中的至少 3 種
 * @param {string} pwd - 密碼字串
 * @returns {{ isValid: boolean, typeCount: number }} 驗證結果
 */
const validatePassword = (pwd) => {
  const hasUpper  = /[A-Z]/.test(pwd);
  const hasLower  = /[a-z]/.test(pwd);
  const hasNumber = /[0-9]/.test(pwd);
  const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':,./<>?]/.test(pwd);
  const typeCount = [hasUpper, hasLower, hasNumber, hasSymbol].filter(Boolean).length;
  const isValid   = pwd.length >= 6 && typeCount >= 3;
  return { isValid, typeCount };
};

/**
 * 函式名稱：calculateBMR
 * 功能說明：使用 Harris-Benedict 公式計算每日建議熱量
 * @param {Object} p - 使用者生理資料
 * @param {string} p.gender - 性別 male/female
 * @param {number} p.age - 年齡
 * @param {number} p.heightCm - 身高（cm）
 * @param {number} p.weightKg - 體重（kg）
 * @param {string} p.activityLevel - 活動量等級
 * @param {string} p.dietGoal - 飲食目標 lose/maintain/gain
 * @returns {number} 建議每日熱量（kcal，四捨五入至整數）
 */
const calculateBMR = ({ gender, age, heightCm, weightKg, activityLevel, dietGoal }) => {
  // 依性別套用 Harris-Benedict 公式
  const bmr = gender === 'male'
    ? 88.362 + (13.397 * weightKg) + (4.799 * heightCm) - (5.677 * age)
    : 447.593 + (9.247 * weightKg) + (3.098 * heightCm) - (4.330 * age);

  // 活動量乘數對照表
  const activityMap = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    veryActive: 1.9
  };

  // 飲食目標調整倍數
  const goalMap = { lose: 0.8, maintain: 1.0, gain: 1.15 };

  const tdee = bmr * (activityMap[activityLevel] || 1.2);
  return Math.round(tdee * (goalMap[dietGoal] || 1.0));
};

/**
 * 函式名稱：showToast
 * 功能說明：在頁面右上角顯示 Bootstrap Toast 通知，3 秒後自動消失
 * @param {string} message - 通知訊息
 * @param {'success'|'danger'|'warning'|'info'} type - Toast 類型
 */
const showToast = (message, type = 'success') => {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const id = `toast-${Date.now()}`;
  const iconMap = { success: 'bi-check-circle-fill', danger: 'bi-x-circle-fill', warning: 'bi-exclamation-triangle-fill', info: 'bi-info-circle-fill' };
  const bgMap = { success: 'text-bg-success', danger: 'text-bg-danger', warning: 'text-bg-warning', info: 'text-bg-info' };

  const div = document.createElement('div');
  div.id = id;
  div.className = `toast align-items-center ${bgMap[type] || 'text-bg-success'} border-0`;
  div.setAttribute('role', 'alert');
  div.setAttribute('aria-live', 'assertive');
  div.setAttribute('aria-atomic', 'true');
  div.setAttribute('data-testid', type === 'success' ? 'toast-success' : `toast-${type}`);

  // 建立 toast 結構，訊息透過 textContent 插入防止 XSS
  const inner = document.createElement('div');
  inner.className = 'd-flex';

  const body = document.createElement('div');
  body.className = 'toast-body d-flex align-items-center gap-2';

  const icon = document.createElement('i');
  icon.className = `bi ${iconMap[type] || iconMap.success}`;

  const text = document.createElement('span');
  // 使用 textContent 防止 XSS
  text.textContent = message;

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'btn-close btn-close-white me-2 m-auto ms-auto';
  closeBtn.setAttribute('data-bs-dismiss', 'toast');
  closeBtn.setAttribute('aria-label', '關閉通知');

  body.append(icon, text);
  inner.append(body, closeBtn);
  div.appendChild(inner);
  container.appendChild(div);

  const toast = new window.bootstrap.Toast(div, { delay: 3000 });
  toast.show();
  // Toast 隱藏後移除 DOM
  div.addEventListener('hidden.bs.toast', () => div.remove());
};

/**
 * 函式名稱：getMealLabel
 * 功能說明：將餐別英文 Enum 轉為中文標籤
 * @param {string} mealType - 餐別 Enum
 * @returns {string} 中文標籤
 */
const getMealLabel = (mealType) => {
  const map = { breakfast: '早餐', lunch: '午餐', dinner: '晚餐', snack: '點心' };
  return map[mealType] || mealType;
};

/**
 * 函式名稱：getCategoryLabel
 * 功能說明：將食物類別 Enum 轉為中文標籤
 * @param {string} category - 類別 Enum
 * @returns {string} 中文標籤
 */
const getCategoryLabel = (category) => {
  const map = {
    主食: '主食', 蔬菜: '蔬菜', 水果: '水果', 肉類: '肉類',
    蛋類: '蛋類', 乳製品: '乳製品', 飲料: '飲料', 零食: '零食', 其他: '其他'
  };
  return map[category] || category;
};

/**
 * 函式名稱：formatISO
 * 功能說明：回傳目前時間的 UTC ISO 字串
 * @returns {string} ISO 時間字串
 */
const formatISO = () => new Date().toISOString();

export {
  generateUUID, getTodayISO, formatDateDisplay, offsetDate,
  sanitizeInput, validateEmail, validatePassword,
  calculateBMR, showToast, getMealLabel, getCategoryLabel, formatISO
};
