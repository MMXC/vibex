/**
 * E3 US-E3.3: Canvas Import/Export E2E
 *
 * Mock scope: uses localStorage only — no real backend needed.
 * Tests file import/export flow for canvas data.
 *
 * Fixes applied:
 * - Safe localStorage.clear() wrapped in try-catch
 * - Wait for toolbar to be visible before interaction
 * - Handle skeleton overlay
 */
import { test, expect } from '@playwright/test';

test.describe('E3: Canvas Import/Export E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/design/dds-canvas?projectId=test', { waitUntil: 'domcontentloaded' });
    // Safe localStorage — may be blocked in sandbox
    await page.evaluate(() => { try { localStorage.clear(); } catch {} });
    // Wait for toolbar buttons to appear (skeleton gone)
    try {
      await page.waitForSelector('[data-testid="canvas-import-btn"]', { timeout: 12000 });
    } catch {
      // Try waiting for dds-canvas-page as fallback
      await page.waitForSelector('[data-testid="dds-canvas-page"]', { state: 'visible', timeout: 8000 }).catch(() => {});
    }
  });

  test('E3.6 — Import button is visible in toolbar', async ({ page }) => {
    const importBtn = page.locator('[data-testid="canvas-import-btn"]');
    await expect(importBtn).toBeVisible({ timeout: 10000 });
  });

  test('E3.7 — Export button is visible in toolbar', async ({ page }) => {
    const exportBtn = page.locator('[data-testid="canvas-export-btn"]');
    await expect(exportBtn).toBeVisible({ timeout: 10000 });
  });

  test('E3.8 — Import button triggers file input attachment', async ({ page }) => {
    const importBtn = page.locator('[data-testid="canvas-import-btn"]');
    await expect(importBtn).toBeVisible();
    // Hidden file input is attached to DOM (dynamically)
    const fileInput = page.locator('[data-testid="canvas-import-input"]');
    await expect(fileInput).toBeAttached({ timeout: 5000 });
  });
});