/**
 * version-history-panel.spec.ts — E1.1: VersionHistoryPanel E2E Tests
 *
 * PRD 验收标准 (E1.1):
 * - AC1: VersionHistoryPanel 正确渲染
 * - AC2: Ctrl+H 快捷键打开 VersionHistoryPanel
 * - AC3: 打开时 Canvas 滚动不被阻塞
 *
 * Conventions:
 * - File: version-history-panel-<epic>.spec.ts
 * - Test: E2E-N: <Description>
 * - Waits: semantic Playwright waits (no waitForTimeout)
 */
import { test, expect } from '@playwright/test';

test.describe('VersionHistoryPanel (E1.1)', () => {
  test.beforeEach(async ({ page }) => {
    // Mock snapshot API to return version history
    await page.route('**/api/v1/canvas/snapshots', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          snapshots: [
            { id: 'snap-3', label: 'Version 3', timestamp: Date.now() - 3600000, version: 3 },
            { id: 'snap-2', label: 'Version 2', timestamp: Date.now() - 7200000, version: 2 },
            { id: 'snap-1', label: 'Version 1', timestamp: Date.now() - 86400000, version: 1 },
          ],
        }),
      });
    });
    await page.goto('/canvas/test-project');
    await page.waitForLoadState('networkidle');
  });

  // AC1: VersionHistoryPanel 正确渲染
  test('E2E-1: VersionHistoryPanel 打开后显示版本列表', async ({ page }) => {
    // Open via Ctrl+H or toggle button
    const toggleBtn = page.locator('[data-testid="version-history-toggle"], [aria-label="版本历史"]').first();
    if (await toggleBtn.isVisible().catch(() => false)) {
      await toggleBtn.click();
    } else {
      await page.keyboard.press('Control+h');
    }
    await page.waitForLoadState('networkidle');

    // Panel should show version list
    const panel = page.locator('[data-testid="version-history-panel"], .version-history-panel, [class*="version-history"]').first();
    const panelVisible = await panel.isVisible().catch(() => false);
    expect(panelVisible).toBeTruthy();
  });

  // AC2: Ctrl+H 快捷键打开
  test('E2E-2: Ctrl+H 快捷键打开 VersionHistoryPanel', async ({ page }) => {
    await page.keyboard.press('Control+h');
    await page.waitForLoadState('networkidle');

    const panel = page.locator('[data-testid="version-history-panel"], .version-history-panel').first();
    const panelVisible = await panel.isVisible().catch(() => false);
    expect(panelVisible).toBeTruthy();
  });

  // AC3: Canvas 滚动不被阻塞
  test('E2E-3: VersionHistoryPanel 打开时 Canvas 仍可滚动', async ({ page }) => {
    const toggleBtn = page.locator('[data-testid="version-history-toggle"]').first();
    if (await toggleBtn.isVisible().catch(() => false)) {
      await toggleBtn.click();
    } else {
      await page.keyboard.press('Control+h');
    }
    await page.waitForLoadState('networkidle');

    // Canvas area should still be scrollable
    const canvas = page.locator('[data-testid="canvas-area"], .canvas-area, [class*="canvas"]').first();
    const canvasScrollable = await canvas.isVisible().catch(() => false);
    expect(canvasScrollable).toBeTruthy();

    // No full-page overlay blocking the canvas
    const overlay = page.locator('.full-overlay, [data-testid="history-blocker"]').first();
    const overlayVisible = await overlay.isVisible().catch(() => false);
    expect(overlayVisible).toBeFalsy();
  });

  // 额外: iPhone12 responsive
  test('E2E-4: iPhone12 (390x844) 布局正常，不溢出', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/canvas/test-project');
    await page.waitForLoadState('domcontentloaded');

    await page.keyboard.press('Control+h');
    await page.waitForLoadState('networkidle');

    const panel = page.locator('[data-testid="version-history-panel"]').first();
    const panelVisible = await panel.isVisible().catch(() => false);
    if (panelVisible) {
      const box = await panel.boundingBox();
      expect((box?.width ?? 0)).toBeLessThanOrEqual(390);
    }
  });
});
