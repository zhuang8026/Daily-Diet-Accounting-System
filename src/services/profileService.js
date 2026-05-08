/**
 * 模組名稱：profileService.js
 * 功能說明：使用者個人設定（生理資料、飲食目標）的讀寫服務
 */

import { setStorage, getStorage } from '@/services/storage';
import { formatISO } from '@/services/utils';

/**
 * 函式名稱：getProfile
 * 功能說明：取得指定使用者的個人設定，若無設定則從使用者帳號資料取得
 * @param {string} userId - 使用者識別碼
 * @returns {Object|null} 個人設定物件
 */
const getProfile = (userId) => {
  // 優先從 profile 儲存取得，否則從使用者列表取得
  const stored = getStorage(`ddas_profile_${userId}`);
  if (stored) return stored;

  const users = getStorage('ddas_users') || [];
  const user = users.find(u => u.userId === userId);
  if (!user) return null;

  // 從使用者帳號中提取設定欄位
  const profile = {
    userId: user.userId,
    displayName: user.displayName,
    email: user.email,
    gender: user.gender,
    age: user.age,
    heightCm: user.heightCm,
    weightKg: user.weightKg,
    activityLevel: user.activityLevel,
    dietGoal: user.dietGoal,
    targetCalories: user.targetCalories,
    targetProtein: user.targetProtein,
    targetFat: user.targetFat,
    targetCarb: user.targetCarb
  };
  return profile;
};

/**
 * 函式名稱：updateProfile
 * 功能說明：更新使用者個人設定，同步更新使用者帳號列表中的相關欄位
 * @param {string} userId - 使用者識別碼
 * @param {Object} updates - 更新欄位
 * @returns {boolean} 是否成功
 */
const updateProfile = (userId, updates) => {
  const users = getStorage('ddas_users') || [];
  const exists = users.some(u => u.userId === userId);
  if (!exists) return false;

  const now = formatISO();
  // 同步更新使用者帳號列表
  const updatedUsers = users.map(u =>
    u.userId === userId ? { ...u, ...updates, updatedAt: now } : u
  );
  setStorage('ddas_users', updatedUsers);

  // 同步更新個人設定快取
  const currentProfile = getProfile(userId) || {};
  setStorage(`ddas_profile_${userId}`, { ...currentProfile, ...updates, updatedAt: now });

  return true;
};

/**
 * 函式名稱：getTargets
 * 功能說明：取得使用者的每日目標值（熱量與三大營養素）
 * @param {string} userId - 使用者識別碼
 * @returns {{targetCalories, targetProtein, targetFat, targetCarb}}
 */
const getTargets = (userId) => {
  const profile = getProfile(userId);
  return {
    targetCalories: profile?.targetCalories || 2000,
    targetProtein: profile?.targetProtein || 0,
    targetFat: profile?.targetFat || 0,
    targetCarb: profile?.targetCarb || 0
  };
};

export { getProfile, updateProfile, getTargets };
