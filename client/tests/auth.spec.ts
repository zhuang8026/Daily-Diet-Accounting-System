/**
 * TC-001 使用者註冊 / TC-002 使用者登入
 * 對應規格書第 13 節 OTHER-03 UAT 測試案例
 */

import { test, expect, Page } from '@playwright/test';

// 每個測試前清除 localStorage，確保乾淨狀態
test.beforeEach(async ({ page }) => {
  await page.goto('/#/login');
  // 等待系統初始化完成（bcrypt seed 約需數秒）
  await page.waitForSelector('#login-form', { timeout: 15000 });
});

// ──────────────────────────────────────────────
// TC-001 使用者註冊
// ──────────────────────────────────────────────

test.describe('TC-001 使用者註冊', () => {

  test('以有效資料成功建立帳號', async ({ page }) => {
    await page.goto('/#/register');
    await page.waitForSelector('#register-form', { timeout: 10000 });

    await page.fill('[data-testid="reg-name"]', 'Playwright測試用戶');
    await page.fill('[data-testid="reg-email"]', `pw_test_${Date.now()}@test.com`);
    await page.fill('[data-testid="reg-password"]', 'Test@1234');
    await page.fill('[data-testid="reg-confirm"]', 'Test@1234');
    await page.click('[data-testid="reg-submit"]');

    // 等待 Toast 或導向登入頁
    await page.waitForURL(/\#\/login/, { timeout: 10000 });
    const toast = page.locator('[data-testid="toast-success"]');
    await expect(toast).toBeVisible({ timeout: 5000 });
    await expect(toast).toContainText('註冊成功');
  });

  test('使用重複 Email 顯示錯誤訊息', async ({ page }) => {
    await page.goto('/#/register');
    await page.waitForSelector('#register-form', { timeout: 10000 });

    await page.fill('[data-testid="reg-name"]', '測試用戶');
    await page.fill('[data-testid="reg-email"]', 'demo@demo.com');
    await page.fill('[data-testid="reg-password"]', 'Demo@1234');
    await page.fill('[data-testid="reg-confirm"]', 'Demo@1234');
    await page.click('[data-testid="reg-submit"]');

    // 等待錯誤訊息顯示
    const alertEl = page.locator('#reg-alert');
    await expect(alertEl).toBeVisible({ timeout: 10000 });
    await expect(alertEl).toContainText('此 Email 已被使用');

    // 確認仍在註冊頁
    await expect(page).toHaveURL(/\#\/register/);
  });

  test('密碼強度不足顯示錯誤訊息', async ({ page }) => {
    await page.goto('/#/register');
    await page.waitForSelector('#register-form', { timeout: 10000 });

    await page.fill('[data-testid="reg-name"]', '測試用戶');
    await page.fill('[data-testid="reg-email"]', 'weak@test.com');
    await page.fill('[data-testid="reg-password"]', 'abc');   // 強度不足
    await page.fill('[data-testid="reg-confirm"]', 'abc');
    await page.click('[data-testid="reg-submit"]');

    // 確認密碼欄位有錯誤狀態
    const pwdInput = page.locator('[data-testid="reg-password"]');
    await expect(pwdInput).toHaveClass(/is-invalid/, { timeout: 3000 });

    // 確認錯誤說明可見
    const errorMsg = page.locator('#pwd-error');
    await expect(errorMsg).toBeVisible();
  });

});

// ──────────────────────────────────────────────
// TC-002 使用者登入
// ──────────────────────────────────────────────

test.describe('TC-002 使用者登入', () => {

  test('以正確帳密登入成功後導向 /dashboard', async ({ page }) => {
    await page.goto('/#/login');
    await page.waitForSelector('#login-form', { timeout: 15000 });

    await page.fill('[data-testid="login-email"]', 'demo@demo.com');
    await page.fill('[data-testid="login-password"]', 'Demo@123');
    await page.click('[data-testid="login-submit"]');

    await page.waitForURL(/\#\/dashboard/, { timeout: 15000 });
    await expect(page).toHaveURL(/\#\/dashboard/);
  });

  test('輸入錯誤密碼顯示錯誤訊息', async ({ page }) => {
    await page.goto('/#/login');
    await page.waitForSelector('#login-form', { timeout: 15000 });

    await page.fill('[data-testid="login-email"]', 'demo@demo.com');
    await page.fill('[data-testid="login-password"]', 'WrongPassword1!');
    await page.click('[data-testid="login-submit"]');

    const alertEl = page.locator('#login-alert');
    await expect(alertEl).toBeVisible({ timeout: 10000 });
    await expect(alertEl).toContainText('帳號或密碼錯誤');
  });

  test('連續錯誤 5 次後帳號被鎖定', async ({ page }) => {
    // 先註冊一個唯一帳號，確保每次測試都有獨立的 lockout 計數
    const lockEmail = `locktest_${Date.now()}@demo.com`;
    await page.goto('/#/register');
    await page.waitForSelector('#register-form', { timeout: 10000 });
    await page.fill('[data-testid="reg-name"]', 'Lock Test');
    await page.fill('[data-testid="reg-email"]', lockEmail);
    await page.fill('[data-testid="reg-password"]', 'LockTest@123');
    await page.fill('[data-testid="reg-confirm"]', 'LockTest@123');
    await page.click('[data-testid="reg-submit"]');
    await page.waitForURL(/\#\/login/, { timeout: 10000 });

    await page.waitForSelector('#login-form', { timeout: 15000 });

    // 連續送出 5 次錯誤密碼
    for (let i = 0; i < 5; i++) {
      await page.fill('[data-testid="login-email"]', lockEmail);
      await page.fill('[data-testid="login-password"]', 'WrongPwd@123');
      await page.click('[data-testid="login-submit"]');
      await page.waitForTimeout(500);
    }

    const alertEl = page.locator('#login-alert');
    await expect(alertEl).toBeVisible({ timeout: 10000 });
    await expect(alertEl).toContainText(/鎖定|locked/);
  });

});
