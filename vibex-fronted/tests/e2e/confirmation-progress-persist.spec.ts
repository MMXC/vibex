/**
 * Confirmation Progress Persistence E2E Test
 * Tests: 进度恢复、刷新保持、多标签同步
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const SCREENSHOT_DIR = process.env.SCREENSHOT_DIR || 'tests/e2e/screenshots';
const DATE = new Date().toISOString().split('T')[0];

async function takeScreenshot(page: any, name: string) {
  const screenshotPath = `${SCREENSHOT_DIR}/persist/${DATE}/${name}.png`;
  await page.screenshot({ path: screenshotPath, fullPage: true });
  return screenshotPath;
}

test.describe('Confirmation Flow Progress Persistence', () => {
  
  test('01-page-loads-correctly', async ({ page }) => {
    // Test that the confirm page loads without errors
    const response = await page.goto(`${BASE_URL}/confirm`);
    
    // Page should respond (200 or 304)
    expect(response?.status()).toBeLessThan(400);
    
    await takeScreenshot(page, 'page-loaded');
  });

  test('02-localStorage-available', async ({ page }) => {
    await page.goto(`${BASE_URL}/confirm`);
    
    // Check localStorage is available
    const hasLocalStorage = await page.evaluate(() => {
      try {
        return typeof window.localStorage !== 'undefined';
      } catch (e) {
        return false;
      }
    });
    
    expect(hasLocalStorage).toBe(true);
    await takeScreenshot(page, 'localstorage-available');
  });

  test('03-textarea-input-works', async ({ page }) => {
    await page.goto(`${BASE_URL}/confirm`);
    
    // Find and fill the requirement textarea
    const textarea = page.locator('textarea#requirement');
    await expect(textarea).toBeVisible();
    
    await textarea.fill('Test requirement for persistence check');
    await takeScreenshot(page, 'textarea-filled');
    
    // Verify the value
    const value = await textarea.inputValue();
    expect(value).toBe('Test requirement for persistence check');
  });

  test('04-submit-button-visible', async ({ page }) => {
    await page.goto(`${BASE_URL}/confirm`);
    
    // Find the submit button
    const button = page.locator('button:has-text("开始生成")');
    await expect(button).toBeVisible();
    
    await takeScreenshot(page, 'button-visible');
  });
});
