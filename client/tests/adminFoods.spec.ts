/**
 * TC-006 後台食物資料庫管理
 */

import { test, expect, Page } from '@playwright/test';

const loginAsAdmin = async (page: Page) => {
  await page.goto('/#/login');
  await page.waitForSelector('#login-form', { timeout: 15000 });
  await page.fill('[data-testid="login-email"]', 'admin@demo.com');
  await page.fill('[data-testid="login-password"]', 'Admin@123');
  await page.click('[data-testid="login-submit"]');
  await page.waitForURL(/\#\/dashboard/, { timeout: 15000 });
};

test.describe('TC-006 後台食物管理', () => {

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/#/admin/foods');
    await page.waitForSelector('#foods-table', { timeout: 10000 });
  });

  test('新增一筆食物後出現在列表', async ({ page }) => {
    const foodName = `測試食物_${Date.now()}`;

    await page.click('#add-food-btn');
    await page.waitForSelector('#food-modal.show', { timeout: 5000 });

    await page.fill('#f-name', foodName);
    await page.selectOption('#f-cat', '肉類');
    await page.fill('#f-cal', '250');
    await page.click('#save-food-btn');

    // 等待 Modal 關閉
    await page.waitForSelector('#food-modal:not(.show)', { timeout: 5000 });

    // 搜尋新增的食物
    await page.fill('#food-search-admin', foodName);
    await page.waitForTimeout(500);

    const rows = page.locator('#foods-tbody tr');
    await expect(rows.first()).toContainText(foodName);
  });

  test('編輯食物名稱後列表即時更新', async ({ page }) => {
    // 找到白飯的編輯按鈕
    await page.fill('#food-search-admin', '白飯');
    await page.waitForTimeout(500);

    const editBtn = page.locator('#foods-tbody tr').first().locator('button[aria-label*="編輯"]');
    await editBtn.click();
    await page.waitForSelector('#food-modal.show', { timeout: 5000 });

    // 修改名稱
    await page.fill('#f-name', '白飯（大碗）');
    await page.click('#save-food-btn');

    await page.waitForSelector('#food-modal:not(.show)', { timeout: 5000 });

    // 確認列表更新
    const rows = page.locator('#foods-tbody');
    await expect(rows).toContainText('白飯（大碗）');
  });

  test('刪除未被引用的食物', async ({ page }) => {
    // 先新增一個不會被引用的食物
    const tempName = `刪除測試_${Date.now()}`;
    await page.click('#add-food-btn');
    await page.waitForSelector('#food-modal.show', { timeout: 5000 });
    await page.fill('#f-name', tempName);
    await page.selectOption('#f-cat', '其他');
    await page.fill('#f-cal', '1');
    await page.click('#save-food-btn');
    await page.waitForSelector('#food-modal:not(.show)', { timeout: 5000 });

    // 搜尋並刪除
    await page.fill('#food-search-admin', tempName);
    await page.waitForTimeout(500);

    const delBtn = page.locator('#foods-tbody tr').first().locator('button[aria-label^="刪除"]');
    await delBtn.click();

    // 確認對話框
    await page.waitForSelector('#delete-food-modal.show', { timeout: 5000 });
    await page.click('#confirm-del-food-btn');

    // 等待 Modal 關閉
    await page.waitForSelector('#delete-food-modal:not(.show)', { timeout: 5000 });

    // 確認食物消失
    await page.fill('#food-search-admin', tempName);
    await page.waitForTimeout(500);
    await expect(page.locator('#foods-tbody')).not.toContainText(tempName);
  });

});
