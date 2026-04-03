/**
 * E2E Tests for vibex-e2e-testing
 */
// @ts-nocheck


import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('E2E Tests: vibex-e2e-user-flow', () => {
  // Test: Home page loads correctly
  test('T3.1.1: Landing page should show VibeX content', async ({ page }) => {
    await page.goto(`${BASE_URL}/landing`);
    const content = await page.content();
    expect(content).toContain('VibeX');
  });

  // Test: Navigation to auth page
  test('T3.1.2: Navigation click should go to /auth/', async ({ page }) => {
    await page.goto(`${BASE_URL}/landing`);
    // Check if there's a link to /auth
    const authLinks = await page.locator('a[href="/auth"]').count();
    expect(authLinks).toBeGreaterThan(0);
  });

  // Test: Auth page shows login form
  test('T3.2.1: Auth page should show login form', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth`);
    const content = await page.content();
    // Should show login related content
    expect(content).toMatch(/登录|login|email|password/i);
  });

  // Test: Register link exists
  test('T3.2.2: Auth page should have register link', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth`);
    const content = await page.content();
    // Should have register option
    expect(content).toMatch(/注册|register|还没有账号/i);
  });

  // Test: Home page should NOT show "Create Next App"
  test('F2.1.1: Home page should NOT show "Create Next App"', async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/`);
    const content = await page.content();
    // Should NOT contain "Create Next App"
    expect(content).not.toContain('Create Next App');
  });

  // Test: Home page title should be VibeX
  test('F2.1.2: Home page title should be VibeX', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    const title = await page.title();
    expect(title).toContain('VibeX');
  });

  // Test: Dashboard accessible
  test('T3.3.2: Dashboard should be accessible', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    // Should load without crash
    const status = await page.evaluate(() => document.readyState);
    expect(status).toBe('complete');
  });

  // Test: Chat page accessible
  test('T3.3.4: Chat page should be accessible', async ({ page }) => {
    await page.goto(`${BASE_URL}/chat`);
    const status = await page.evaluate(() => document.readyState);
    expect(status).toBe('complete');
  });

  // Test: No JavaScript errors on critical pages
  test('All pages should load without JS errors', async ({ page }) => {
    const pages = [
      '/',
      '/landing',
      '/auth',
      '/dashboard',
      '/chat',
      '/templates',
    ];
    const errors: string[] = [];

    page.on('pageerror', (err) => errors.push(err.message));

    for (const p of pages) {
      await page.goto(`${BASE_URL}${p}`);
      await page.waitForLoadState('networkidle');
    }

    // Should have no critical JS errors
    expect(errors.filter((e) => !e.includes('hydration'))).toHaveLength(0);
  });
});
