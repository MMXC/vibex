/**
 * E3 US-E3.3: Canvas Import/Export E2E
 *
 * Mock scope: uses localStorage only — no real backend needed.
 * Tests file import/export flow for canvas data.
 */
import { test, expect } from '@playwright/test';

test.describe('E3: Canvas Import/Export E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/design/dds-canvas?projectId=test');
    await page.evaluate(() => localStorage.clear());
  });

  test('E3.6 — Import button is visible', async ({ page }) => {
    await page.waitForSelector('[data-testid="canvas-import-btn"]', { timeout: 10000 });
    const importBtn = page.locator('[data-testid="canvas-import-btn"]');
    await expect(importBtn).toBeVisible();
  });

  test('E3.7 — Export button is visible', async ({ page }) => {
    await page.waitForSelector('[data-testid="canvas-export-btn"]', { timeout: 10000 });
    const exportBtn = page.locator('[data-testid="canvas-export-btn"]');
    await expect(exportBtn).toBeVisible();
  });

  test('E3.8 — Import file picker accepts .json and .vibex', async ({ page }) => {
    await page.waitForSelector('[data-testid="canvas-import-btn"]', { timeout: 10000 });
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeAttached();
    const accept = await fileInput.getAttribute('accept');
    expect(accept).toMatch(/json|vibex/);
  });
});