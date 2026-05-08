/**
 * 模組名稱：recordService.js
 * 功能說明：飲食紀錄的新增、讀取、修改、刪除（CRUD）服務
 *           所有操作以 userId 為範圍，資料存於 ddas_records_{userId}
 */

import { setStorage, getStorage } from '@/services/storage';
import { generateUUID, formatISO, getTodayISO } from '@/services/utils';

/**
 * 函式名稱：getRecords
 * 功能說明：取得指定使用者的飲食紀錄，可依日期與餐別篩選
 * @param {string} userId - 使用者識別碼
 * @param {string|null} date - 日期（YYYY-MM-DD），null 表示取全部
 * @param {string|null} mealType - 餐別，null 表示取全部
 * @returns {Array} 飲食紀錄陣列
 */
const getRecords = (userId, date = null, mealType = null) => {
  const all = getStorage(`ddas_records_${userId}`) || [];
  return all.filter(r =>
    (!date || r.recordDate === date) &&
    (!mealType || r.mealType === mealType)
  );
};

/**
 * 函式名稱：addRecord
 * 功能說明：新增一筆飲食紀錄，自動產生 UUID 與時間戳記
 * @param {string} userId - 使用者識別碼
 * @param {Object} record - 紀錄資料（不含 recordId / createdAt / updatedAt）
 * @returns {Object} 已儲存的完整紀錄物件
 */
const addRecord = (userId, record) => {
  const all = getStorage(`ddas_records_${userId}`) || [];
  const now = formatISO();
  const newRecord = {
    recordId: generateUUID(),
    userId,
    mealType: record.mealType,
    recordDate: record.recordDate || getTodayISO(),
    foodName: record.foodName,
    foodId: record.foodId || null,
    servingAmount: Number(record.servingAmount),
    calories: Math.round(Number(record.calories)),
    protein: Number(Number(record.protein || 0).toFixed(1)),
    fat: Number(Number(record.fat || 0).toFixed(1)),
    carbohydrate: Number(Number(record.carbohydrate || 0).toFixed(1)),
    note: record.note || '',
    createdAt: now,
    updatedAt: now
  };
  setStorage(`ddas_records_${userId}`, [...all, newRecord]);
  return newRecord;
};

/**
 * 函式名稱：updateRecord
 * 功能說明：修改指定紀錄的欄位值，自動更新 updatedAt
 * @param {string} userId - 使用者識別碼
 * @param {string} recordId - 紀錄識別碼
 * @param {Object} updates - 要更新的欄位
 * @returns {boolean} 是否成功
 */
const updateRecord = (userId, recordId, updates) => {
  const all = getStorage(`ddas_records_${userId}`) || [];
  const idx = all.findIndex(r => r.recordId === recordId);
  if (idx === -1) return false;

  const updated = all.map(r =>
    r.recordId === recordId
      ? {
          ...r,
          ...updates,
          calories: Math.round(Number(updates.calories ?? r.calories)),
          protein: Number(Number(updates.protein ?? r.protein).toFixed(1)),
          fat: Number(Number(updates.fat ?? r.fat).toFixed(1)),
          carbohydrate: Number(Number(updates.carbohydrate ?? r.carbohydrate).toFixed(1)),
          updatedAt: formatISO()
        }
      : r
  );
  setStorage(`ddas_records_${userId}`, updated);
  return true;
};

/**
 * 函式名稱：deleteRecord
 * 功能說明：刪除指定飲食紀錄
 * @param {string} userId - 使用者識別碼
 * @param {string} recordId - 紀錄識別碼
 * @returns {boolean} 是否成功
 */
const deleteRecord = (userId, recordId) => {
  const all = getStorage(`ddas_records_${userId}`) || [];
  const filtered = all.filter(r => r.recordId !== recordId);
  if (filtered.length === all.length) return false;
  setStorage(`ddas_records_${userId}`, filtered);
  return true;
};

/**
 * 函式名稱：getDailySummary
 * 功能說明：計算指定日期的熱量與三大營養素合計
 * @param {string} userId - 使用者識別碼
 * @param {string} date - 日期（YYYY-MM-DD）
 * @returns {{totalCalories, totalProtein, totalFat, totalCarb}} 當日合計
 */
const getDailySummary = (userId, date) => {
  const records = getRecords(userId, date);
  return {
    totalCalories: records.reduce((sum, r) => sum + r.calories, 0),
    totalProtein: Number(records.reduce((sum, r) => sum + r.protein, 0).toFixed(1)),
    totalFat: Number(records.reduce((sum, r) => sum + r.fat, 0).toFixed(1)),
    totalCarb: Number(records.reduce((sum, r) => sum + r.carbohydrate, 0).toFixed(1))
  };
};

/**
 * 函式名稱：getDateRangeSummary
 * 功能說明：取得日期範圍內每日熱量摘要，用於趨勢報表
 * @param {string} userId - 使用者識別碼
 * @param {string} startDate - 起始日期
 * @param {string} endDate - 結束日期
 * @returns {Array<{date, totalCalories, totalProtein, totalFat, totalCarb}>}
 */
const getDateRangeSummary = (userId, startDate, endDate) => {
  const all = getStorage(`ddas_records_${userId}`) || [];
  // 產生日期區間的每一天
  const days = [];
  let current = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T00:00:00');
  const pad = n => String(n).padStart(2, '0')
  const toLocalISO = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  while (current <= end) {
    days.push(toLocalISO(current));
    current.setDate(current.getDate() + 1);
  }

  return days.map(date => {
    const dayRecords = all.filter(r => r.recordDate === date);
    return {
      date,
      totalCalories: dayRecords.reduce((sum, r) => sum + r.calories, 0),
      totalProtein: Number(dayRecords.reduce((sum, r) => sum + r.protein, 0).toFixed(1)),
      totalFat: Number(dayRecords.reduce((sum, r) => sum + r.fat, 0).toFixed(1)),
      totalCarb: Number(dayRecords.reduce((sum, r) => sum + r.carbohydrate, 0).toFixed(1)),
      hasData: dayRecords.length > 0
    };
  });
};

/**
 * 函式名稱：getAllRecordsForAdmin
 * 功能說明：取得所有使用者的飲食紀錄（後台管理員使用）
 * @param {Object} filters - 篩選條件（date range、mealType、userId）
 * @returns {Array} 飲食紀錄陣列（含使用者資訊）
 */
const getAllRecordsForAdmin = (filters = {}) => {
  const { startDate, endDate, mealType, userId } = filters;
  const users = getStorage('ddas_users') || [];

  // 合併所有使用者的紀錄並附加使用者名稱
  return users.flatMap(user => {
    const records = getStorage(`ddas_records_${user.userId}`) || [];
    return records.map(r => ({ ...r, displayName: user.displayName, userEmail: user.email }));
  }).filter(r => {
    if (userId && r.userId !== userId) return false;
    if (startDate && r.recordDate < startDate) return false;
    if (endDate && r.recordDate > endDate) return false;
    if (mealType && r.mealType !== mealType) return false;
    return true;
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
};

export { getRecords, addRecord, updateRecord, deleteRecord, getDailySummary, getDateRangeSummary, getAllRecordsForAdmin };
