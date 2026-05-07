/**
 * TC-004 個人目標設定
 */

import { test, expect, Page } from '@playwright/test';

const loginAsDemo = async (page: Page) => {
  await page.goto('/#/login');
  await page.waitForSelector('#login-form', { timeout: 15000 });
  await page.fill('[data-testid="login-email"]', 'demo@demo.com');
  await page.fill('[data-testid="login-password"]', 'Demo@123');
  await page.click('[data-testid="login-submit"]');
  await page.waitForURL(/\#\/dashboard/, { timeout: 15000 });
};

test.describe('TC-004 個人目標設定', () => {

  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page);
    await page.goto('/#/settings');
    await page.waitForSelector('#settings-form', { timeout: 10000 });
  });

  test('填入生理資料後顯示建議熱量', async ({ page }) => {
    // 選擇性別男
    await page.click('input[name="gender"][value="male"]');
    // 填入生理資料
    await page.fill('[data-testid="age-input"]', '28');
    await page.fill('[data-testid="height-input"]', '175');
    await page.fill('[data-testid="weight-input"]', '70');
    await page.selectOption('#activity-select', 'moderate');
    await page.click('input[name="dietGoal"][value="maintain"]');

    // 等待建議熱量計算顯示
    const suggestedCal = page.locator('#suggested-cal');
    await expect(suggestedCal).not.toHaveText('—', { timeout: 3000 });
    const text = await suggestedCal.textContent();
    // Harris-Benedict 男性 28歲 175cm 70kg moderate maintain 應約 2782 kcal
    expect(parseInt(text || '0')).toBeGreaterThan(2000);
  });

  test('手動覆蓋目標熱量後儲存成功', async ({ page }) => {
    // 先套用建議值
    await page.fill('[data-testid="age-input"]', '28');
    await page.fill('[data-testid="height-input"]', '175');
    await page.fill('[data-testid="weight-input"]', '70');
    await page.click('[data-testid="apply-suggested"]');

    // 手動覆蓋為 2000
    await page.fill('[data-testid="target-cal"]', '2000');

    // 儲存
    await page.click('#save-settings-btn');

    // 確認 Toast 成功
    const toast = page.locator('[data-testid="toast-success"]');
    await expect(toast).toBeVisible({ timeout: 5000 });
    await expect(toast).toContainText('設定已儲存');
  });

});
