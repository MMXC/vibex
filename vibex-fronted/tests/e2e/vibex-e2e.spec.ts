import { test, expect } from '@playwright/test';

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const SCREENSHOT_DIR = process.env.SCREENSHOT_DIR || 'tests/e2e/screenshots/daily';
const DATE = new Date().toISOString().split('T')[0];

// Test accounts
const TEST_EMAIL = 'y760283407@outlook.com';
const TEST_PASSWORD = '12345678';

// Helper function to take screenshot
async function takeScreenshot(page: any, name: string) {
  const screenshotPath = `${SCREENSHOT_DIR}/${DATE}/${name}.png`;
  await page.screenshot({ path: screenshotPath, fullPage: true });
  return screenshotPath;
}

test.describe('VibeX E2E Tests', () => {
  test('01-landing-page', async ({ page }) => {
    await page.goto(`${BASE_URL}/landing`);
    await takeScreenshot(page, 'landing-page');
  });

  test('02-homepage', async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page).toHaveTitle(/VibeX/i);
    await takeScreenshot(page, 'homepage');
  });

  test('03-login-page', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth`);
    await expect(page.locator('input[type="email"], input[name="email"], input[type="text"]').first()).toBeVisible();
    await takeScreenshot(page, 'login-page');
  });

  test('04-dashboard', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await takeScreenshot(page, 'dashboard');
  });

  test('05-requirements', async ({ page }) => {
    await page.goto(`${BASE_URL}/requirements`);
    await takeScreenshot(page, 'requirements');
  });

  test('06-flow', async ({ page }) => {
    await page.goto(`${BASE_URL}/flow`);
    await takeScreenshot(page, 'flow');
  });

  test('07-project-settings', async ({ page }) => {
    await page.goto(`${BASE_URL}/project-settings`);
    await takeScreenshot(page, 'project-settings');
  });

  test('08-templates', async ({ page }) => {
    await page.goto(`${BASE_URL}/templates`);
    await takeScreenshot(page, 'templates');
  });
});
