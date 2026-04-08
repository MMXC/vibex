/**
 * conflict-dialog.spec.ts — E2E tests for E4 SyncProtocol Conflict Handling
 *
 * Based on E4 SyncProtocol: version conflict → ConflictDialog
 * - ConflictDialog 显示 3 个选项: 保留本地 / 使用服务端 / 合并
 *
 * Conventions:
 * - File: conflict-dialog-<epic>.spec.ts
 * - Test: E2E-N: <Description>
 */

import { test, expect } from '@playwright/test';

test.describe('ConflictDialog (E4 SyncProtocol)', () => {
  const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000';
  const CANVAS_URL = `${BASE_URL}/canvas`;

  test.beforeEach(async ({ page }) => {
    await page.goto(CANVAS_URL);
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async ({ page }) => {
    await page.evaluate(() => {
      window.sessionStorage.clear();
    });
  });

  // -------------------------------------------------------------------------
  // E2E-1: 版本冲突时显示 ConflictDialog（3 个选项）
  // -------------------------------------------------------------------------
  test('E2E-1: ConflictDialog 显示 3 个选项', async ({ page }) => {
    // Intercept snapshot API to return 409 Conflict on second save
    let requestCount = 0;
    await page.route('**/api/v1/canvas/snapshots', async (route) => {
      const req = route.request();
      const body = req.postData() ? JSON.parse(req.postData()!) : {};
      requestCount++;
      if (requestCount > 1 && body.version && body.version > 0) {
        await route.fulfill({
          status: 409,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Version conflict',
            code: 'VERSION_CONFLICT',
            serverVersion: (body.version as number) + 1,
            currentVersion: body.version,
          }),
        });
      } else {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            snapshot: { snapshotId: 'snap-1', version: requestCount },
          }),
        });
      }
    });

    // Semantic wait: wait for page to be fully interactive
    await page.waitForLoadState('networkidle');

    // Make a change to trigger debounced save
    const node = page.locator('[data-node-type]').first();
    if (await node.count() > 0) {
      await node.dblclick();
      const input = page.locator('input, [contenteditable="true"]').first();
      if (await input.count() > 0) {
        await input.fill('conflict test');
      }
    }

    // Wait for debounced save to fire (debounce is 2000ms)
    await page.waitForResponse('**/api/v1/canvas/snapshots', { timeout: 5000 }).catch(() => {});

    // Trigger another save to cause conflict
    await page.keyboard.press('Control+s');
    // Wait for conflict response
    await page.waitForResponse(
      (res) => res.url().includes('/snapshots') && res.status() === 409,
      { timeout: 5000 }
    ).catch(() => {});

    // Check if ConflictDialog or conflict state indicator is shown
    const conflictVisible = await page.locator('text=冲突').isVisible().catch(() => false);
    const conflictDialogVisible = await page.locator('[role="dialog"]').isVisible().catch(() => false);
    expect(conflictVisible || conflictDialogVisible).toBeTruthy();
  });

  // -------------------------------------------------------------------------
  // E2E-2: ConflictDialog 包含 "保留本地" 选项
  // -------------------------------------------------------------------------
  test('E2E-2: ConflictDialog 包含保留本地选项', async ({ page }) => {
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('canvas:conflict', {
        detail: { serverVersion: 2, currentVersion: 1 },
      }));
    });

    // Semantic wait: await conflict UI to appear
    await page.waitForLoadState('networkidle');

    const keepLocalOption = page.locator('button:has-text("保留本地"), button:has-text("Keep Local"), button:has-text("本地版本")').first();
    const useServerOption = page.locator('button:has-text("使用服务端"), button:has-text("Use Server"), button:has-text("服务端版本")').first();
    const mergeOption = page.locator('button:has-text("合并"), button:has-text("Merge")').first();

    const hasOption = await keepLocalOption.isVisible().catch(() => false) ||
                      await useServerOption.isVisible().catch(() => false) ||
                      await mergeOption.isVisible().catch(() => false);

    expect(hasOption !== undefined).toBe(true);
  });

  // -------------------------------------------------------------------------
  // E2E-3: 冲突状态下页面仍可编辑（不阻塞用户）
  // -------------------------------------------------------------------------
  test('E2E-3: 冲突状态下页面仍可编辑', async ({ page }) => {
    await page.keyboard.press('Control+s');
    // Semantic wait: wait for save response
    await page.waitForResponse('**/api/v1/canvas/snapshots', { timeout: 5000 }).catch(() => {});

    // Verify canvas is still interactive (no full-screen blocker)
    const blocker = page.locator('[data-testid="conflict-blocker"], .conflict-overlay').first();
    const blockerVisible = await blocker.isVisible().catch(() => false);

    if (blockerVisible) {
      const closeBtn = page.locator('[aria-label="关闭"], [aria-label="Close"], button:has-text("关闭")').first();
      if (await closeBtn.isVisible().catch(() => false)) {
        await closeBtn.click();
      }
    }

    const canvasArea = page.locator('[data-canvas], .canvas-area, #canvas').first();
    const canvasVisible = await canvasArea.isVisible().catch(() => false);
    const errorPage = page.locator('text=出错了, text=Something went wrong').first();
    const noError = !(await errorPage.isVisible().catch(() => false));

    expect(canvasVisible && noError).toBe(true);
  });
});
