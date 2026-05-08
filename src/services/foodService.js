/**
 * 模組名稱：foodService.js
 * 功能說明：食物資料庫的查詢、新增、修改、刪除服務
 *           資料存於 ddas_foods（全使用者共用）
 */

import { setStorage, getStorage } from './storage';
import { formatISO } from './utils';

/**
 * 函式名稱：getFoods
 * 功能說明：取得食物清單，支援關鍵字搜尋、類別篩選、熱量範圍與分頁
 * @param {Object} options - 篩選選項
 * @param {string} options.keyword - 關鍵字（模糊比對食物名稱）
 * @param {string} options.category - 類別
 * @param {number} options.minCal - 最低熱量
 * @param {number} options.maxCal - 最高熱量
 * @param {number} options.page - 頁碼（從 1 開始）
 * @param {number} options.limit - 每頁筆數
 * @returns {{items: Array, total: number, page: number, totalPages: number}}
 */
const getFoods = ({ keyword = '', category = '', minCal = 0, maxCal = 1000, page = 1, limit = 12 } = {}) => {
  const all = getStorage('ddas_foods') || [];

  const filtered = all.filter(f => {
    // 模糊比對食物名稱
    if (keyword && !f.foodName.includes(keyword)) return false;
    if (category && category !== '全部' && f.category !== category) return false;
    if (f.caloriesPerServing < minCal || f.caloriesPerServing > maxCal) return false;
    return true;
  });

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const items = filtered.slice((safePage - 1) * limit, safePage * limit);

  return { items, total, page: safePage, totalPages };
};

/**
 * 函式名稱：getFoodById
 * 功能說明：依 foodId 取得單筆食物資料
 * @param {string} foodId - 食物識別碼
 * @returns {Object|null} 食物資料或 null
 */
const getFoodById = (foodId) => {
  const all = getStorage('ddas_foods') || [];
  return all.find(f => f.foodId === foodId) || null;
};

/**
 * 函式名稱：searchFoods
 * 功能說明：關鍵字模糊搜尋，回傳前 5 筆用於自動補全下拉清單
 * @param {string} keyword - 搜尋關鍵字（至少 1 字元）
 * @returns {Array} 最多 5 筆食物資料
 */
const searchFoods = (keyword) => {
  if (!keyword || keyword.length < 1) return [];
  const all = getStorage('ddas_foods') || [];
  return all.filter(f => f.foodName.includes(keyword)).slice(0, 5);
};

/**
 * 函式名稱：addFood
 * 功能說明：新增一筆食物資料（需管理員，由呼叫端確認權限）
 * @param {Object} food - 食物資料（不含 createdAt / updatedAt）
 * @param {string} createdBy - 建立者 userId
 * @returns {{success: boolean, message: string, food?: Object}}
 */
const addFood = (food, createdBy = 'system') => {
  const all = getStorage('ddas_foods') || [];
  // 確保 foodId 唯一
  if (all.some(f => f.foodId === food.foodId)) {
    return { success: false, message: `食物 ID ${food.foodId} 已存在` };
  }
  const now = formatISO();
  const newFood = {
    ...food,
    caloriesPerServing: Math.round(Number(food.caloriesPerServing)),
    proteinPerServing: Number(Number(food.proteinPerServing).toFixed(1)),
    fatPerServing: Number(Number(food.fatPerServing).toFixed(1)),
    carbPerServing: Number(Number(food.carbPerServing).toFixed(1)),
    isCustom: food.isCustom ?? false,
    createdBy,
    createdAt: now,
    updatedAt: now
  };
  setStorage('ddas_foods', [...all, newFood]);
  return { success: true, message: '食物已新增', food: newFood };
};

/**
 * 函式名稱：updateFood
 * 功能說明：修改食物資料
 * @param {string} foodId - 食物識別碼
 * @param {Object} updates - 更新欄位
 * @returns {boolean} 是否成功
 */
const updateFood = (foodId, updates) => {
  const all = getStorage('ddas_foods') || [];
  const idx = all.findIndex(f => f.foodId === foodId);
  if (idx === -1) return false;

  const updated = all.map(f =>
    f.foodId === foodId ? { ...f, ...updates, updatedAt: formatISO() } : f
  );
  setStorage('ddas_foods', updated);
  return true;
};

/**
 * 函式名稱：deleteFood
 * 功能說明：刪除食物，若有使用者飲食紀錄引用則拒絕刪除
 * @param {string} foodId - 食物識別碼
 * @returns {{success: boolean, message: string}}
 */
const deleteFood = (foodId) => {
  const users = getStorage('ddas_users') || [];
  // 檢查是否有任何使用者紀錄引用此 foodId
  const isReferenced = users.some(user => {
    const records = getStorage(`ddas_records_${user.userId}`) || [];
    return records.some(r => r.foodId === foodId);
  });

  if (isReferenced) {
    return { success: false, message: '此食物已被使用者飲食紀錄引用，無法刪除' };
  }

  const all = getStorage('ddas_foods') || [];
  setStorage('ddas_foods', all.filter(f => f.foodId !== foodId));
  return { success: true, message: '食物已刪除' };
};

/**
 * 函式名稱：generateFoodId
 * 功能說明：依現有食物數量自動產生下一個食物 ID（格式 F{3位數字}）
 * @returns {string} 新食物 ID
 */
const generateFoodId = () => {
  const all = getStorage('ddas_foods') || [];
  const ids = all.map(f => f.foodId).filter(id => /^F\d+$/.test(id)).map(id => parseInt(id.slice(1), 10));
  const max = ids.length ? Math.max(...ids) : 0;
  return `F${String(max + 1).padStart(3, '0')}`;
};

/**
 * 函式名稱：importFoodsFromCsv
 * 功能說明：從 CSV 文字逐筆驗證並匯入食物資料
 * @param {string} csvText - CSV 文字內容
 * @param {string} createdBy - 建立者 userId
 * @returns {{success: number, failed: number, errors: string[]}}
 */
const importFoodsFromCsv = (csvText, createdBy) => {
  const lines = csvText.split('\n').filter(l => l.trim());
  if (lines.length < 2) return { success: 0, failed: 0, errors: ['CSV 格式錯誤或無資料行'] };

  // 略過標題行
  const dataLines = lines.slice(1);
  let successCount = 0;
  const errors = [];

  dataLines.forEach((line, i) => {
    const cols = line.split(',').map(c => c.trim());
    const [foodName, category, servingSize, servingUnit, caloriesPerServing, proteinPerServing, fatPerServing, carbPerServing] = cols;

    if (!foodName || !category || !caloriesPerServing) {
      errors.push(`第 ${i + 2} 行：缺少必要欄位`);
      return;
    }

    const result = addFood({
      foodId: generateFoodId(),
      foodName,
      category,
      servingSize: Number(servingSize) || 100,
      servingUnit: servingUnit || '克',
      caloriesPerServing: Number(caloriesPerServing),
      proteinPerServing: Number(proteinPerServing) || 0,
      fatPerServing: Number(fatPerServing) || 0,
      carbPerServing: Number(carbPerServing) || 0,
      isCustom: false
    }, createdBy);

    if (result.success) successCount++;
    else errors.push(`第 ${i + 2} 行：${result.message}`);
  });

  return { success: successCount, failed: errors.length, errors };
};

export { getFoods, getFoodById, searchFoods, addFood, updateFood, deleteFood, generateFoodId, importFoodsFromCsv };
