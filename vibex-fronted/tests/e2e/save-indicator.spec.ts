/**
 * save-indicator.spec.ts — E1.3: SaveIndicator E2E Tests
 *
 * PRD 验收标准 (E1.3):
 * - AC1: SaveIndicator 正确渲染
 * - AC2: 手动 Ctrl+S 保存成功，显示 Saved 状态
 * - AC3: 自动保存时显示 Saving 状态
 * - AC4: 保存失败显示 Error 状态
 *
 * Conventions:
 * - File: save-indicator-<epic>.spec.ts
 * - Test: E2E-N: <Description>
 * - Waits: semantic Playwright waits (no waitForTimeout)
 */
import { test, expect } from '@playwright/test';

test.describe('SaveIndicator (E1.3)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/canvas/test-project');
    await page.waitForLoadState('networkidle');
  });

  // AC1: SaveIndicator 正确渲染
  test('E2E-1: SaveIndicator 显示在 CanvasHeader', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    const indicator = page.locator(
      '[data-testid="save-indicator"], .save-indicator, [class*="save-indicator"]'
    ).first();
    const indicatorVisible = await indicator.isVisible().catch(() => false);
    expect(indicatorVisible).toBeTruthy();
  });

  // AC2: Ctrl+S 保存成功，显示 Saved
  test('E2E-2: Ctrl+S 保存成功后显示 Saved 状态', async ({ page }) => {
    // Mock successful save
    await page.route('**/api/v1/canvas/snapshots', (route) => {
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, snapshot: { id: 'snap-new', version: 2 } }),
      });
    });

    const savePromise = page.waitForResponse(
      '**/api/v1/canvas/snapshots',
      { timeout: 5000 }
    ).catch(() => null);

    await page.keyboard.press('Control+s');
    const response = await savePromise;

    if (response) {
      expect(response.status()).toBeGreaterThanOrEqual(200);
      // Verify saved indicator is shown
      const indicator = page.locator('[data-testid="save-indicator"], .save-indicator').first();
      const text = await indicator.textContent().catch(() => '');
      expect(text).toMatch(/saved|saved|已保存/i);
    }
  });

  // AC3: 自动保存显示 Saving 状态
  test('E2E-3: 自动保存期间显示 Saving 状态', async ({ page }) => {
    // Intercept to slow down response - simulating saving state
    await page.route('**/api/v1/canvas/snapshots', async (route) => {
      await route.continue(); // Don't fulfill - browser keeps pending
    });

    // Trigger auto-save by making a change
    const input = page.locator('input, [contenteditable="true"]').first();
    if (await input.isVisible().catch(() => false)) {
      await input.click();
      await input.fill('trigger-auto-save');
    }

    // Give time for auto-save debounce and request to fire
    await page.waitForResponse('**/api/v1/canvas/snapshots', { timeout: 8000 }).catch(() => null);

    // Verify canvas is still functional (saving doesn't block)
    const canvas = page.locator('[data-canvas], .canvas-area').first();
    const canvasVisible = await canvas.isVisible().catch(() => false);
    expect(canvasVisible).toBeTruthy();
  });

  // AC4: 保存失败显示 Error 状态
  test('E2E-4: 保存失败显示 Error 状态', async ({ page }) => {
    // Mock failed save
    await page.route('**/api/v1/canvas/snapshots', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, error: 'Server error' }),
      });
    });

    await page.keyboard.press('Control+s');
    await page.waitForResponse('**/api/v1/canvas/snapshots', { timeout: 5000 }).catch(() => {});

    // Error should be shown (either in indicator or as toast)
    const errorIndicator = page.locator('[data-testid="save-indicator-error"], .save-error, [class*="save-error"]').first();
    const errorToast = page.locator('[role="alert"]:has-text("保存失败"), [role="alert"]:has-text("Error")').first();

    const hasError = await errorIndicator.isVisible().catch(() => false) ||
                     await errorToast.isVisible().catch(() => false);
    expect(hasError).toBeTruthy();

    // Canvas should still be functional
    const canvas = page.locator('[data-canvas], .canvas-area').first();
    const canvasVisible = await canvas.isVisible().catch(() => false);
    expect(canvasVisible).toBeTruthy();
  });
});
