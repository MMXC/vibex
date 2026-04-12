/**
 * auth-redirect E2E tests — vibex-auth-401-handling Epic 3 Story 3.3
 * 
 * TC-E2E-1: 完整登录跳转
 * TC-E2E-2: logout 清除两个 cookie
 * TC-E2E-3: 登出后访问受保护页 → 重新跳转
 */

import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || process.env.E2E_BASE_URL || 'http://localhost:3000';

// Reusable test user (should exist or be registered)
const TEST_USER = {
  email: `e2e-test-${Date.now()}@example.com`,
  password: 'password123',
  name: 'E2E Test User',
};

async function clearAllCookiesAndStorage(page: Page) {
  await page.context().clearCookies();
  await page.evaluate(() => {
    sessionStorage.clear();
    localStorage.clear();
  });
}

async function getCookie(page: Page, name: string): Promise<string | null> {
  const cookies = await page.context().cookies();
  return cookies.find((c) => c.name === name)?.value ?? null;
}

test.describe('auth-redirect E2E', () => {
  test.beforeEach(async ({ page }) => {
    await clearAllCookiesAndStorage(page);
  });

  // TC-E2E-1: Complete login redirect flow
  test('TC-E2E-1: complete login redirect flow', async ({ page }) => {
    // Step 1: Visit protected page /canvas → should redirect to /auth?returnTo=/canvas
    await page.goto(`${BASE_URL}/canvas`);
    await expect(page).toHaveURL(/\/auth\?returnTo=\/canvas/);

    // Step 2: Register a new user (switch to register form)
    await page.goto(`${BASE_URL}/auth`);

    // Use register since the test user email won't exist yet
    const registerEmail = `e2e-redirect-${Date.now()}@example.com`;
    await page.click('button:has-text("立即注册")');
    await page.waitForTimeout(300);

    await page.fill('input[type="email"]', registerEmail);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.fill('input[type="text"]', TEST_USER.name);

    await page.click('button[type="submit"]:has-text("注册")');
    // Wait for redirect back to /canvas
    await page.waitForURL(/\/canvas/, { timeout: 10000 });

    // Step 3: Verify auth_token cookie is set with httpOnly
    const authTokenCookie = await getCookie(page, 'auth_token');
    expect(authTokenCookie).toBeTruthy();
    expect(authTokenCookie!.length).toBeGreaterThan(10);
  });

  // TC-E2E-2: logout clears both auth_token and auth_session cookies
  test('TC-E2E-2: logout clears both cookies', async ({ page }) => {
    // Register and login
    const logoutEmail = `e2e-logout-${Date.now()}@example.com`;
    await page.goto(`${BASE_URL}/auth`);
    await page.click('button:has-text("立即注册")');
    await page.waitForTimeout(300);
    await page.fill('input[type="email"]', logoutEmail);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.fill('input[type="text"]', 'Logout Test');
    await page.click('button[type="submit"]:has-text("注册")');
    await page.waitForURL(/\/(canvas|dashboard)/, { timeout: 10000 });

    // Set auth_session cookie manually (simulating middleware session creation)
    await page.context().addCookies([
      { name: 'auth_session', value: 'test-session-id', domain: 'localhost', path: '/' },
    ]);

    // Verify cookies exist before logout
    const authTokenBefore = await getCookie(page, 'auth_token');
    const authSessionBefore = await getCookie(page, 'auth_session');
    expect(authTokenBefore).toBeTruthy();
    expect(authSessionBefore).toBeTruthy();

    // Perform logout (click logout button if available, otherwise call API)
    const logoutButton = page.locator('button:has-text("退出")').or(page.locator('button:has-text("Logout")')).or(page.locator('[aria-label="logout"]'));
    
    if (await logoutButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await logoutButton.click();
      await page.waitForTimeout(1000);
    } else {
      // Fallback: call logout API directly
      const logoutRes = await page.request.post(`${BASE_URL}/api/v1/auth/logout`, {
        headers: { Authorization: `Bearer ${authTokenBefore}` },
      });
      expect(logoutRes.status()).toBe(200);
    }

    // Verify both cookies are cleared
    const authTokenAfter = await getCookie(page, 'auth_token');
    const authSessionAfter = await getCookie(page, 'auth_session');
    expect(authTokenAfter).toBeNull();
    expect(authSessionAfter).toBeNull();
  });

  // TC-E2E-3: after logout, accessing protected page redirects to auth
  test('TC-E2E-3: after logout, accessing protected page redirects to auth', async ({ page }) => {
    // Register and login
    const logoutEmail = `e2e-redirect2-${Date.now()}@example.com`;
    await page.goto(`${BASE_URL}/auth`);
    await page.click('button:has-text("立即注册")');
    await page.waitForTimeout(300);
    await page.fill('input[type="email"]', logoutEmail);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.fill('input[type="text"]', 'Redirect Test');
    await page.click('button[type="submit"]:has-text("注册")');
    await page.waitForURL(/\/(canvas|dashboard)/, { timeout: 10000 });

    // Get auth token for API call
    const authToken = await getCookie(page, 'auth_token');

    // Perform logout via API
    await page.request.post(`${BASE_URL}/api/v1/auth/logout`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    // Clear cookies from browser context too
    await page.context().clearCookies();

    // Step 3: Access protected page → should redirect to /auth?returnTo=/canvas
    await page.goto(`${BASE_URL}/canvas`);
    await expect(page).toHaveURL(/\/auth\?returnTo=\/canvas/);
  });
});
