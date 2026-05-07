/**
 * 模組名稱：auth.js
 * 功能說明：使用者認證服務，提供註冊、登入、登出、Session 讀取等功能
 *           密碼使用 bcryptjs（cost=12）雜湊儲存，登入失敗 5 次鎖定 15 分鐘
 */

import { setStorage, getStorage, removeStorage } from './storage.js';
import { generateUUID, validateEmail, validatePassword, formatISO } from './utils.js';

/** bcryptjs 全域物件捷徑 */
const getBcrypt = () => window.dcodeIO?.bcrypt;

/**
 * 函式名稱：register
 * 功能說明：註冊新使用者帳號，驗證 Email 唯一性與密碼強度後寫入儲存
 * @param {string} email - 電子郵件
 * @param {string} password - 密碼（明文）
 * @param {string} displayName - 顯示名稱
 * @returns {Promise<{success: boolean, message: string}>}
 */
const register = async (email, password, displayName) => {
  const trimEmail = email.trim().toLowerCase();

  if (!validateEmail(trimEmail)) return { success: false, message: 'Email 格式不正確' };

  const { isValid } = validatePassword(password);
  if (!isValid) return { success: false, message: '密碼強度不足，需至少 6 字元且包含大寫、小寫、數字、符號中的 3 種' };

  if (!displayName || displayName.trim().length < 1 || displayName.trim().length > 30) {
    return { success: false, message: '暱稱長度需為 1–30 字' };
  }

  const users = getStorage('ddas_users') || [];
  // 檢查 Email 是否已被使用
  const exists = users.some(u => u.email === trimEmail);
  if (exists) return { success: false, message: '此 Email 已被使用' };

  const bcrypt = getBcrypt();
  if (!bcrypt) return { success: false, message: '密碼服務未就緒，請重新整理頁面' };

  // 使用 cost=12 雜湊密碼（符合規格書 SEC-02）
  const passwordHash = await new Promise((res, rej) =>
    bcrypt.hash(password, 12, (err, h) => err ? rej(err) : res(h))
  );

  const now = formatISO();
  const newUser = {
    userId: generateUUID(),
    displayName: displayName.trim(),
    email: trimEmail,
    passwordHash,
    gender: null,
    age: null,
    heightCm: null,
    weightKg: null,
    activityLevel: 'sedentary',
    dietGoal: 'maintain',
    targetCalories: 2000,
    targetProtein: 0,
    targetFat: 0,
    targetCarb: 0,
    role: 'user',
    isActive: true,
    createdAt: now,
    updatedAt: now,
    lastLoginAt: null
  };

  setStorage('ddas_users', [...users, newUser]);
  return { success: true, message: '註冊成功，請登入' };
};

/**
 * 函式名稱：login
 * 功能說明：驗證帳密，成功後寫入 Session；失敗超過 5 次則鎖定帳號 15 分鐘
 * @param {string} email - 電子郵件
 * @param {string} password - 密碼（明文）
 * @returns {Promise<{success: boolean, message: string, locked?: boolean}>}
 */
const login = async (email, password) => {
  const trimEmail = email.trim().toLowerCase();
  const attemptsKey = `ddas_login_attempts_${trimEmail}`;

  // 檢查帳號是否處於鎖定狀態
  const attemptsData = getStorage(attemptsKey);
  if (attemptsData) {
    const { count, lockedUntil } = attemptsData;
    if (count >= 5 && lockedUntil && new Date() < new Date(lockedUntil)) {
      const remaining = Math.ceil((new Date(lockedUntil) - new Date()) / 60000);
      return { success: false, locked: true, message: `帳號已鎖定，請於 ${remaining} 分鐘後再試` };
    }
  }

  const users = getStorage('ddas_users') || [];
  const user = users.find(u => u.email === trimEmail);

  if (!user) {
    recordFailedAttempt(attemptsKey);
    return { success: false, message: '帳號或密碼錯誤' };
  }

  if (!user.isActive) return { success: false, message: '帳號已停用，請聯繫管理員' };

  const bcrypt = getBcrypt();
  if (!bcrypt) return { success: false, message: '密碼服務未就緒，請重新整理頁面' };

  const isMatch = await new Promise((res, rej) =>
    bcrypt.compare(password, user.passwordHash, (err, r) => err ? rej(err) : res(r))
  );

  if (!isMatch) {
    recordFailedAttempt(attemptsKey);
    const remaining = getRemainingAttempts(attemptsKey);
    return { success: false, message: `帳號或密碼錯誤（剩餘 ${remaining} 次機會）` };
  }

  // 登入成功：清除失敗紀錄、更新最後登入時間、寫入 Session
  removeStorage(attemptsKey);
  const updatedUsers = users.map(u =>
    u.userId === user.userId ? { ...u, lastLoginAt: formatISO() } : u
  );
  setStorage('ddas_users', updatedUsers);

  const session = {
    userId: user.userId,
    displayName: user.displayName,
    email: user.email,
    role: user.role
  };
  setStorage('ddas_session', session);

  return { success: true, message: '登入成功' };
};

/**
 * 函式名稱：recordFailedAttempt
 * 功能說明：記錄登入失敗次數，達 5 次時設定 15 分鐘鎖定時間
 * @param {string} key - 儲存鍵名
 */
const recordFailedAttempt = (key) => {
  const raw = getStorage(key) || { count: 0, lockedUntil: null };
  const newCount = raw.count + 1;
  const lockedUntil = newCount >= 5
    ? new Date(Date.now() + 15 * 60 * 1000).toISOString()
    : null;
  setStorage(key, { count: newCount, lockedUntil });
};

/**
 * 函式名稱：getRemainingAttempts
 * 功能說明：回傳剩餘可嘗試次數
 * @param {string} key - 儲存鍵名
 * @returns {number} 剩餘次數
 */
const getRemainingAttempts = (key) => {
  const data = getStorage(key);
  return Math.max(0, 5 - (data?.count || 0));
};

/**
 * 函式名稱：logout
 * 功能說明：清除登入 Session，導向登入頁
 */
const logout = () => {
  removeStorage('ddas_session');
  window.location.hash = '#/login';
};

/**
 * 函式名稱：getCurrentSession
 * 功能說明：讀取目前登入的 Session 資料
 * @returns {{userId, displayName, email, role}|null} Session 物件或 null
 */
const getCurrentSession = () => getStorage('ddas_session');

/**
 * 函式名稱：isAuthenticated
 * 功能說明：判斷目前是否已登入
 * @returns {boolean}
 */
const isAuthenticated = () => Boolean(getCurrentSession());

/**
 * 函式名稱：isAdmin
 * 功能說明：判斷目前登入使用者是否為管理員
 * @returns {boolean}
 */
const isAdmin = () => getCurrentSession()?.role === 'admin';

export { register, login, logout, getCurrentSession, isAuthenticated, isAdmin };
