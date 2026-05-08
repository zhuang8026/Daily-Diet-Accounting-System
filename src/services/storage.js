/**
 * 模組名稱：storage.js
 * 功能說明：封裝 localStorage 的讀寫操作，所有資料自動附加 7 天過期時間
 */

/**
 * 函式名稱：setStorage
 * 功能說明：將資料寫入 localStorage，自動附加 7 天後的到期時間
 * @param {string} key - 儲存鍵名
 * @param {*} data - 要儲存的資料
 */
const setStorage = (key, data) => {
  const item = {
    data,
    // 計算 7 天後的 ISO 時間字串作為到期時間
    expiredAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  };
  localStorage.setItem(key, JSON.stringify(item));
};

/**
 * 函式名稱：getStorage
 * 功能說明：從 localStorage 讀取資料，若已過期則自動清除並回傳 null
 * @param {string} key - 儲存鍵名
 * @returns {*} 儲存的資料，若不存在或已過期則回傳 null
 */
const getStorage = (key) => {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    const item = JSON.parse(raw);
    // 若已超過到期時間，清除並回傳 null
    if (new Date() > new Date(item.expiredAt)) {
      localStorage.removeItem(key);
      return null;
    }
    return item.data;
  } catch {
    localStorage.removeItem(key);
    return null;
  }
};

/**
 * 函式名稱：removeStorage
 * 功能說明：移除指定 localStorage 鍵值
 * @param {string} key - 儲存鍵名
 */
const removeStorage = (key) => {
  localStorage.removeItem(key);
};

/**
 * 函式名稱：clearUserStorage
 * 功能說明：清除指定使用者的所有個人資料（紀錄、設定），保留食物資料庫
 * @param {string} userId - 使用者識別碼
 */
const clearUserStorage = (userId) => {
  [`ddas_records_${userId}`, `ddas_profile_${userId}`].forEach(key => {
    localStorage.removeItem(key);
  });
};

export { setStorage, getStorage, removeStorage, clearUserStorage };
