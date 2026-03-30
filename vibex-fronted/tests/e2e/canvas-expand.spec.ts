/**
 * Canvas E2E — Epic 3.2: Canvas 状态与质量
 * 
 * 5 个测试用例，覆盖 Canvas expand/mode 状态管理：
 * E3.2-1: expand-both 模式下三栏等宽
 * E3.2-2: SVG overlay pointer-events: none 不阻挡节点交互
 * E3.2-3: maximize 模式下 ProjectBar/PhaseLabelBar 隐藏
 * E3.2-4: F11 快捷键触发 maximize 模式
 * E3.2-5: 退出 maximize 恢复正常布局
 * 
 * 覆盖率目标: ≥80%
 * Run: pnpm test:e2e -- tests/e2e/canvas-expand.spec.ts
 */

import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const CANVAS_URL = `${BASE_URL}/canvas`;

// Helper: skip onboarding and navigate to canvas with example data loaded
async function goToCanvasWithData(page: Page) {
  await page.goto(CANVAS_URL);
  await page.waitForLoadState('domcontentloaded');

  // Skip onboarding if present
  const skipBtn = page.locator('button:has-text("跳过"), button:has-text("Skip"), button:has-text("开始使用"), button:has-text("Got it")').first();
  if (await skipBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await skipBtn.click();
    await page.waitForLoadState('networkidle');
  }

  // Click "导入示例" to get into context phase (expand controls only show after input phase)
  const importBtn = page.locator('button:has-text("导入示例")');
  if (await importBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await importBtn.click();
    await page.waitForTimeout(2000);
  }
}

test.describe('Canvas E2E — Epic 3.2: Canvas 状态与质量', () => {

  test.beforeEach(async ({ page }) => {
    await goToCanvasWithData(page);
  });

  test('E3.2-1: expand-both 模式下三栏等宽', async ({ page }) => {
    // Verify expand button is visible in context phase
    const expandBtn = page.locator('button[aria-label="均分视口"]');
    await expect(expandBtn).toBeVisible({ timeout: 5000 });

    // Get tree panels before expand
    const treePanels = page.locator('[class*="treePanelsGrid"] > [class*="treePanel"]');
    const beforeCount = await treePanels.count();
    expect(beforeCount).toBe(3); // context + flow + component

    const beforeWidths = await treePanels.evaluateAll((els) =>
      els.map((el) => (el as HTMLElement).getBoundingClientRect().width)
    );

    // Click expand-both
    await expandBtn.click();
    await page.waitForTimeout(500);

    // Verify expand button changed to "退出均分"
    const exitBtn = page.locator('button[aria-label="退出均分"]');
    await expect(exitBtn).toBeVisible({ timeout: 3000 });

    // Verify 3 tree panels still present
    const afterCount = await treePanels.count();
    expect(afterCount).toBe(3);

    // Verify 3 tree panels are roughly equal width (within 10%)
    const afterWidths = await treePanels.evaluateAll((els) =>
      els.map((el) => (el as HTMLElement).getBoundingClientRect().width)
    );

    const totalWidth = afterWidths.reduce((sum, w) => sum + w, 0);
    const avgWidth = totalWidth / afterWidths.length;
    const allEqual = afterWidths.every((w) => Math.abs(w - avgWidth) / avgWidth < 0.1);

    expect(allEqual).toBe(true);
    expect(avgWidth).toBeGreaterThan(300); // panels should be reasonably wide

    // Screenshot for evidence
    await page.screenshot({ path: 'tests/e2e/screenshots/canvas-e2e/e3.2-1-expand-both.png', fullPage: true });

    // Exit expand-both
    await exitBtn.click();
    await page.waitForTimeout(500);
    await expect(expandBtn).toBeVisible({ timeout: 3000 });
  });

  test('E3.2-2: SVG edge overlay pointer-events: none 不阻挡节点交互', async ({ page }) => {
    // After loading example data, there should be edge layers
    // Verify edge layer SVGs exist
    const edgeLayers = page.locator('svg[class*="layer"]');
    const edgeCount = await edgeLayers.count();

    // If there are edges, verify pointer-events: none
    if (edgeCount > 0) {
      const firstPointerEvents = await edgeLayers.first().evaluate(
        (el) => window.getComputedStyle(el).pointerEvents
      );
      expect(firstPointerEvents).toBe('none');

      // Verify second edge layer also has pointer-events: none
      if (edgeCount > 1) {
        const secondPointerEvents = await edgeLayers.nth(1).evaluate(
          (el) => window.getComputedStyle(el).pointerEvents
        );
        expect(secondPointerEvents).toBe('none');
      }
    }

    // Screenshot for evidence
    await page.screenshot({ path: 'tests/e2e/screenshots/canvas-e2e/e3.2-2-edge-layer.png', fullPage: true });

    // Verify clicking a tree panel action button works (not blocked by SVG overlay)
    // Use a button in the tree panel toolbar (not inside a scrollable tree node area)
    const expandBtn = page.locator('button[aria-label="均分视口"]');
    if (await expandBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expandBtn.click();
      await page.waitForTimeout(300);
      // Verify expand mode changed (button should now say "退出均分")
      const exitBtn = page.locator('button[aria-label="退出均分"]');
      const expandChanged = await exitBtn.isVisible({ timeout: 3000 }).catch(() => false);
      expect(expandChanged).toBe(true);
      // Page should still be functional (no crash)
      const pageStillOk = await page.locator('body').isVisible();
      expect(pageStillOk).toBe(true);
    }
  });

  test('E3.2-3: maximize 模式下 ProjectBar/PhaseLabelBar 隐藏', async ({ page }) => {
    // Click maximize button
    const maximizeBtn = page.locator('button[aria-label="最大化"]');
    await expect(maximizeBtn).toBeVisible({ timeout: 5000 });
    await maximizeBtn.click();
    await page.waitForTimeout(500);

    // Verify maximize button changed to "退出最大化"
    const exitMaxBtn = page.locator('button[aria-label="退出最大化"]');
    await expect(exitMaxBtn).toBeVisible({ timeout: 3000 });

    // Verify ProjectBar is hidden (display: none)
    const projectBar = page.locator('[class*="projectBarWrapper"]').first();
    if (await projectBar.count() > 0) {
      const pbDisplay = await projectBar.evaluate((el) => window.getComputedStyle(el).display);
      expect(pbDisplay).toBe('none');
    }

    // Verify PhaseLabelBar is hidden
    const phaseLabel = page.locator('[class*="phaseLabelBar"]').first();
    if (await phaseLabel.count() > 0) {
      const plDisplay = await phaseLabel.evaluate((el) => window.getComputedStyle(el).display);
      expect(plDisplay).toBe('none');
    }

    // Screenshot for evidence
    await page.screenshot({ path: 'tests/e2e/screenshots/canvas-e2e/e3.2-3-maximize-mode.png', fullPage: true });

    // Exit maximize
    await exitMaxBtn.click();
    await page.waitForTimeout(500);
    await expect(maximizeBtn).toBeVisible({ timeout: 3000 });
  });

  test('E3.2-4: F11 快捷键触发 maximize 模式', async ({ page }) => {
    // Verify expand controls are visible in context phase
    const expandControls = page.locator('[class*="expandControls"]').first();
    await expect(expandControls).toBeVisible({ timeout: 5000 });

    // Press F11 to toggle maximize
    await page.keyboard.press('F11');
    await page.waitForTimeout(500);

    // Verify maximize mode is active (expand controls should still be visible in maximize)
    const ecDisplay = await expandControls.evaluate((el) => window.getComputedStyle(el).display);
    expect(ecDisplay).toBe('flex');

    // Verify exit maximize button is visible
    const exitMaxBtn = page.locator('button[aria-label="退出最大化"]');
    await expect(exitMaxBtn).toBeVisible({ timeout: 3000 });

    // Screenshot for evidence
    await page.screenshot({ path: 'tests/e2e/screenshots/canvas-e2e/e3.2-4-f11-maximize.png', fullPage: true });
  });

  test('E3.2-5: 退出 maximize 恢复正常布局', async ({ page }) => {
    // Enter maximize via button
    const maximizeBtn = page.locator('button[aria-label="最大化"]');
    await expect(maximizeBtn).toBeVisible({ timeout: 5000 });
    await maximizeBtn.click();
    await page.waitForTimeout(500);

    // Exit via Escape key
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    // Verify maximize button is back
    await expect(maximizeBtn).toBeVisible({ timeout: 3000 });

    // Verify expand button is visible
    const expandBtn = page.locator('button[aria-label="均分视口"]');
    await expect(expandBtn).toBeVisible({ timeout: 3000 });

    // Verify tree panels are visible and have content
    const treePanels = page.locator('[class*="treePanelsGrid"] > [class*="treePanel"]');
    const panelCount = await treePanels.count();
    expect(panelCount).toBe(3);

    // Verify ProjectBar is visible again
    const projectBar = page.locator('[class*="projectBarWrapper"]').first();
    if (await projectBar.count() > 0) {
      const pbDisplay = await projectBar.evaluate((el) => window.getComputedStyle(el).display);
      expect(pbDisplay).not.toBe('none');
    }

    // Screenshot for evidence
    await page.screenshot({ path: 'tests/e2e/screenshots/canvas-e2e/e3.2-5-exit-maximize.png', fullPage: true });
  });

});
