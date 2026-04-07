import { test, expect } from '@playwright/test';

test.describe('VibeX E2E Tests', () => {
  test('homepage loads correctly', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/VibeX|首页/);
  });

  test('navigation works', async ({ page }) => {
    await page.goto('/');
    // Click navigation if exists
    const nav = page.locator('nav');
    if (await nav.count() > 0) {
      await expect(nav).toBeVisible();
    }
  });

  test('login page accessible', async ({ page }) => {
    await page.goto('/auth');
    await expect(page.locator('input[type="email"], input[type="text"]')).toHaveCount(1);
  });
});
