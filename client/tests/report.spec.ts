/**
 * TC-005 趨勢報表
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

test.describe('TC-005 趨勢報表', () => {

  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page);
    await page.goto('/#/report');
    await page.waitForSelector('#trend-chart', { timeout: 10000 });
  });

  test('預設顯示 7 天趨勢，切換 30 天後更新', async ({ page }) => {
    // 預設應勾選 7 天
    const range7 = page.locator('[data-testid="range-7"]');
    await expect(range7).toBeChecked();

    // 圖表容器應可見
    await expect(page.locator('#trend-chart')).toBeVisible();

    // 切換 30 天
    await page.click('[data-testid="range-30"]');
    await page.waitForTimeout(800);

    // 30 天 radio 應被勾選
    const range30 = page.locator('[data-testid="range-30"]');
    await expect(range30).toBeChecked();

    // 圖表仍可見
    await expect(page.locator('#trend-chart')).toBeVisible();
  });

  test('趨勢圖與營養素圓餅圖同時存在', async ({ page }) => {
    await expect(page.locator('#trend-chart')).toBeVisible();
    await expect(page.locator('#nutrient-chart')).toBeVisible();
    await expect(page.locator('#summary-stats')).toBeVisible();
  });

});
