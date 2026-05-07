/**
 * TC-007 RWD 響應式設計測試
 * 使用 Playwright 模擬不同視窗寬度驗證版面切換
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

test.describe('TC-007 RWD 響應式設計', () => {

  test('375px 手機版：顯示底部導覽列，側邊欄隱藏', async ({ page }) => {
    // 設定 iPhone SE 寬度（375px）
    await page.setViewportSize({ width: 375, height: 667 });
    await loginAsDemo(page);
    await page.waitForTimeout(500);

    // 底部導覽列應顯示
    const bottomNav = page.locator('#app-bottom-nav');
    await expect(bottomNav).toBeVisible({ timeout: 5000 });

    // 側邊欄應隱藏（CSS display: none）
    const sidebar = page.locator('#app-sidebar');
    await expect(sidebar).toBeHidden();
  });

  test('1440px 桌機版：顯示左側側邊欄，底部導覽列隱藏', async ({ page }) => {
    // 設定桌機寬度（1440px）
    await page.setViewportSize({ width: 1440, height: 900 });
    await loginAsDemo(page);
    await page.waitForTimeout(500);

    // 側邊欄應顯示
    const sidebar = page.locator('#app-sidebar');
    await expect(sidebar).toBeVisible({ timeout: 5000 });

    // 底部導覽列應隱藏
    const bottomNav = page.locator('#app-bottom-nav');
    await expect(bottomNav).toBeHidden();
  });

  test('320px 最窄手機版頁面無水平卷軸', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await loginAsDemo(page);
    await page.waitForTimeout(500);

    // 確認沒有水平溢出（body 寬度不超過 viewport）
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(320);
  });

  test('2560px 超寬螢幕頁面正常顯示', async ({ page }) => {
    await page.setViewportSize({ width: 2560, height: 1440 });
    await loginAsDemo(page);
    await page.waitForTimeout(500);

    // 側邊欄應顯示
    await expect(page.locator('#app-sidebar')).toBeVisible({ timeout: 5000 });
    // 主要內容應存在
    await expect(page.locator('#app')).toBeVisible();
  });

});
