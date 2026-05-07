/**
 * 模組名稱：seed.js
 * 功能說明：系統初始化資料，首次載入時寫入食物資料庫（F001–F010）
 *           與兩個 Demo 帳號（一般使用者、管理員）
 */

import { setStorage, getStorage } from './storage.js';
import { generateUUID, formatISO } from './utils.js';

/** 系統預設食物資料（規格書第 05 節） */
const SEED_FOODS = [
  { foodId: 'F001', foodName: '白飯', category: '主食', servingSize: 200, servingUnit: '克（1 碗）', caloriesPerServing: 280, proteinPerServing: 5.0, fatPerServing: 0.5, carbPerServing: 62.0 },
  { foodId: 'F002', foodName: '雞胸肉（水煮）', category: '肉類', servingSize: 100, servingUnit: '克（1 份）', caloriesPerServing: 165, proteinPerServing: 31.0, fatPerServing: 3.6, carbPerServing: 0.0 },
  { foodId: 'F003', foodName: '全脂牛奶', category: '乳製品', servingSize: 240, servingUnit: '毫升（1 杯）', caloriesPerServing: 150, proteinPerServing: 8.0, fatPerServing: 8.0, carbPerServing: 12.0 },
  { foodId: 'F004', foodName: '花椰菜（燙熟）', category: '蔬菜', servingSize: 100, servingUnit: '克（1 碗）', caloriesPerServing: 35, proteinPerServing: 2.5, fatPerServing: 0.4, carbPerServing: 7.0 },
  { foodId: 'F005', foodName: '香蕉', category: '水果', servingSize: 120, servingUnit: '克（1 根）', caloriesPerServing: 105, proteinPerServing: 1.3, fatPerServing: 0.4, carbPerServing: 27.0 },
  { foodId: 'F006', foodName: '水煮蛋', category: '蛋類', servingSize: 50, servingUnit: '克（1 顆）', caloriesPerServing: 78, proteinPerServing: 6.0, fatPerServing: 5.0, carbPerServing: 0.6 },
  { foodId: 'F007', foodName: '地瓜（烤）', category: '主食', servingSize: 130, servingUnit: '克（1 份）', caloriesPerServing: 112, proteinPerServing: 2.0, fatPerServing: 0.1, carbPerServing: 26.0 },
  { foodId: 'F008', foodName: '無糖豆漿', category: '飲料', servingSize: 250, servingUnit: '毫升（1 杯）', caloriesPerServing: 80, proteinPerServing: 7.0, fatPerServing: 4.0, carbPerServing: 3.0 },
  { foodId: 'F009', foodName: '鮭魚（烤）', category: '肉類', servingSize: 100, servingUnit: '克（1 份）', caloriesPerServing: 208, proteinPerServing: 20.0, fatPerServing: 13.0, carbPerServing: 0.0 },
  { foodId: 'F010', foodName: '洋芋片', category: '零食', servingSize: 30, servingUnit: '克（1 包）', caloriesPerServing: 160, proteinPerServing: 2.0, fatPerServing: 10.0, carbPerServing: 15.0 }
];

/**
 * 函式名稱：initSeed
 * 功能說明：初始化系統資料，若已初始化則跳過；使用 bcryptjs 非同步雜湊 Demo 帳號密碼
 *           種子帳號使用 cost=10（比生產環境的 cost=12 略快，適合 Demo 首次載入）
 */
const initSeed = async () => {
  // 若食物與使用者資料皆已存在，代表已完整初始化，直接跳過
  const existingUsers = getStorage('ddas_users');
  if (getStorage('ddas_foods') !== null && existingUsers !== null && existingUsers.length > 0) return;

  // 初始化食物資料庫（附加必要欄位）
  const foods = SEED_FOODS.map(f => ({
    ...f,
    isCustom: false,
    createdBy: 'system',
    createdAt: formatISO(),
    updatedAt: formatISO()
  }));
  setStorage('ddas_foods', foods);

  // 取得 bcryptjs 全域物件
  const bcrypt = window.dcodeIO?.bcrypt;
  if (!bcrypt) {
    console.error('bcryptjs 未載入，無法建立 Demo 帳號');
    setStorage('ddas_users', []);
    return;
  }

  // 並行雜湊兩個 Demo 帳號密碼（cost=10 適合 Demo 首次載入速度）
  const [demoHash, adminHash] = await Promise.all([
    new Promise((res, rej) => bcrypt.hash('Demo@123', 10, (err, h) => err ? rej(err) : res(h))),
    new Promise((res, rej) => bcrypt.hash('Admin@123', 10, (err, h) => err ? rej(err) : res(h)))
  ]);

  const now = formatISO();
  const users = [
    {
      userId: 'user-demo-001',
      displayName: 'Demo 使用者',
      email: 'demo@demo.com',
      passwordHash: demoHash,
      gender: 'male',
      age: 28,
      heightCm: 175,
      weightKg: 70.0,
      activityLevel: 'moderate',
      dietGoal: 'maintain',
      targetCalories: 2200,
      targetProtein: 140,
      targetFat: 73,
      targetCarb: 275,
      role: 'user',
      isActive: true,
      createdAt: now,
      updatedAt: now,
      lastLoginAt: null
    },
    {
      userId: 'user-admin-001',
      displayName: '系統管理員',
      email: 'admin@demo.com',
      passwordHash: adminHash,
      gender: 'male',
      age: 35,
      heightCm: 178,
      weightKg: 75.0,
      activityLevel: 'light',
      dietGoal: 'maintain',
      targetCalories: 2000,
      targetProtein: 120,
      targetFat: 67,
      targetCarb: 250,
      role: 'admin',
      isActive: true,
      createdAt: now,
      updatedAt: now,
      lastLoginAt: null
    }
  ];

  setStorage('ddas_users', users);
  // 初始化公告陣列
  setStorage('ddas_announcements', []);
};

export { initSeed };
