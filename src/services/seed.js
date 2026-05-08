import bcrypt from 'bcryptjs'
import { setStorage, getStorage } from '@/services/storage'
import { generateUUID, formatISO } from '@/services/utils'

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
]

const initSeed = async () => {
  const existingUsers = getStorage('ddas_users')
  if (getStorage('ddas_foods') !== null && existingUsers !== null && existingUsers.length > 0) return

  const now = formatISO()
  const foods = SEED_FOODS.map(f => ({ ...f, isCustom: false, createdBy: 'system', createdAt: now, updatedAt: now }))
  setStorage('ddas_foods', foods)

  const [demoHash, adminHash] = await Promise.all([
    bcrypt.hash('Demo@123', 10),
    bcrypt.hash('Admin@123', 10)
  ])

  const users = [
    {
      userId: 'user-demo-001', displayName: 'Demo 使用者', email: 'demo@demo.com',
      passwordHash: demoHash, gender: 'male', age: 28, heightCm: 175, weightKg: 70.0,
      activityLevel: 'moderate', dietGoal: 'maintain', targetCalories: 2200,
      targetProtein: 140, targetFat: 73, targetCarb: 275, role: 'user',
      isActive: true, createdAt: now, updatedAt: now, lastLoginAt: null
    },
    {
      userId: 'user-admin-001', displayName: '系統管理員', email: 'admin@demo.com',
      passwordHash: adminHash, gender: 'male', age: 35, heightCm: 178, weightKg: 75.0,
      activityLevel: 'light', dietGoal: 'maintain', targetCalories: 2000,
      targetProtein: 120, targetFat: 67, targetCarb: 250, role: 'admin',
      isActive: true, createdAt: now, updatedAt: now, lastLoginAt: null
    }
  ]
  setStorage('ddas_users', users)
  setStorage('ddas_announcements', [])
}

export { initSeed }
