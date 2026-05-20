/**
 * TC-003 新增飲食紀錄
 * 對應規格書第 13 節 OTHER-03 UAT 測試案例
 */

import { test, expect, Page } from '@playwright/test';

// 登入輔助函式
const loginAsDemo = async (page: Page) => {
  await page.goto('/#/login');
  await page.waitForSelector('#login-form', { timeout: 15000 });
  await page.fill('[data-testid="login-email"]', 'demo@demo.com');
  await page.fill('[data-testid="login-password"]', 'Demo@123');
  await page.click('[data-testid="login-submit"]');
  await page.waitForURL(/\#\/dashboard/, { timeout: 15000 });
};

test.describe('TC-003 新增飲食紀錄', () => {

  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page);
  });

  test('成功新增雞胸肉午餐紀錄並顯示 Toast', async ({ page }) => {
    // 點擊新增飲食按鈕（FAB）
    await page.click('[data-testid="add-record-btn"]');

    // 等待 Modal 出現
    await page.waitForSelector('#record-modal.show', { timeout: 5000 });

    // 搜尋食物
    await page.fill('[data-testid="food-search"]', '雞胸肉');
    await page.waitForTimeout(500);

    // 選擇自動補全第一個結果（雞胸肉 F002）
    const foodItem = page.locator('[data-testid="food-item-F002"]');
    await expect(foodItem).toBeVisible({ timeout: 5000 });
    await foodItem.click();

    // 選擇餐別為午餐
    await page.selectOption('[id="meal-type-select"]', 'lunch');

    // 輸入份量
    await page.fill('[data-testid="serving-amount"]', '1.0');

    // 點擊儲存
    await page.click('[data-testid="save-record-btn"]');

    // 驗證 Toast 出現並包含正確訊息（使用 filter 避免與登入 Toast 衝突）
    const toast = page.locator('[data-testid="toast-success"]').filter({ hasText: '飲食紀錄已儲存' });
    await expect(toast).toBeVisible({ timeout: 5000 });
    await expect(toast).toContainText('kcal');
  });

  test('不輸入份量直接送出顯示警告', async ({ page }) => {
    await page.click('[data-testid="add-record-btn"]');
    await page.waitForSelector('#record-modal.show', { timeout: 5000 });

    // 輸入食物名稱
    await page.fill('[data-testid="food-search"]', '白飯');
    await page.waitForTimeout(500);
    const foodItem = page.locator('[data-testid="food-item-F001"]');
    if (await foodItem.isVisible()) await foodItem.click();

    // 清空份量欄位
    await page.fill('[data-testid="serving-amount"]', '');

    // 點擊儲存
    await page.click('[data-testid="save-record-btn"]');

    // 應顯示警告 Toast
    const warningToast = page.locator('[data-testid="toast-warning"]');
    await expect(warningToast).toBeVisible({ timeout: 5000 });

    // Modal 應保持開啟
    await expect(page.locator('#record-modal.show')).toBeVisible();
  });

});
