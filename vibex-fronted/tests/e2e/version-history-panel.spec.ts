/**
 * version-history-panel.spec.ts — F11: VersionHistoryPanel E2E Tests
 *
 * F11 PRD 验收:
 * - AC1: VersionHistoryPanel 正确渲染
 * - AC2: 点击 ProjectBar 历史按钮打开面板
 * - AC3: 打开时 Canvas 不被阻塞
 * - AC4: 关闭按钮工作
 * - AC5: 未登录用户看到 401 错误 banner
 *
 * Fixes:
 * - Auth: middleware reads cookies, not sessionStorage → use context.addCookies
 * - URL: /canvas is correct (no dynamic segment)
 * - Selectors: role="dialog" for panel, aria-label="版本历史" for toggle
 * - Removed networkidle (SSE never goes idle)
 *
 * Conventions:
 * - Test: E2E-N: <Description>
 * - Waits: explicit timeouts (no networkidle — canvas has SSE)
 */
import { test, expect } from '@playwright/test';

test.describe('VersionHistoryPanel (F11)', () => {
  test.beforeEach(async ({ page, context }) => {
    // Bypass auth — middleware reads cookies
    await context.addCookies([
      { name: 'auth_token', value: 'mock-e2e-token', domain: 'localhost', path: '/' },
    ]);
    await page.goto('/canvas');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500); // Wait for React hydration
  });

  // AC2: ProjectBar 历史按钮打开面板
  test('E2E-1: 历史按钮打开 VersionHistoryPanel', async ({ page }) => {
    const historyBtn = page.locator('[aria-label="版本历史"]').first();
    await expect(historyBtn).toBeVisible({ timeout: 10000 });
    await historyBtn.click();
    await page.waitForTimeout(800);

    const panel = page.locator('[role="dialog"][aria-label="版本历史"]');
    await expect(panel).toBeVisible({ timeout: 5000 });
  });

  // AC4: 关闭按钮关闭面板
  test('E2E-2: 关闭按钮关闭面板', async ({ page }) => {
    const historyBtn = page.locator('[aria-label="版本历史"]').first();
    await historyBtn.click();
    await page.waitForTimeout(800);

    const closeBtn = page.locator('[data-testid="close-history-btn"]');
    await expect(closeBtn).toBeVisible({ timeout: 5000 });
    await closeBtn.click();
    await page.waitForTimeout(500);

    const panel = page.locator('[role="dialog"][aria-label="版本历史"]');
    await expect(panel).not.toBeVisible({ timeout: 5000 });
  });

  // AC3: 面板打开时 Canvas 仍可见
  test('E2E-3: 面板打开时 Canvas 区域仍可见', async ({ page }) => {
    const historyBtn = page.locator('[aria-label="版本历史"]').first();
    await historyBtn.click();
    await page.waitForTimeout(800);

    // Canvas is a side-drawer, main area should still be in DOM
    const mainArea = page.locator('main, [class*="mainContainer"], [class*="canvasWrapper"]').first();
    await expect(mainArea).toBeVisible({ timeout: 5000 });
  });

  // AC5: 未登录用户看到错误 banner
  test('E2E-4: 未登录用户看到 401 错误 banner', async ({ page }) => {
    // Clear auth and mock 401
    await page.context().clearCookies();
    await page.route('**/v1/canvas/snapshots', (route) => {
      route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ error: 'Unauthorized' }) });
    });

    const historyBtn = page.locator('[aria-label="版本历史"]').first();
    await historyBtn.click();
    await page.waitForTimeout(1500);

    const errorBanner = page.locator('[role="alert"]');
    await expect(errorBanner).toBeVisible({ timeout: 5000 });
    await expect(errorBanner).toContainText('登录');
  });

  // 创建快照按钮存在
  test('E2E-5: 保存当前版本按钮存在', async ({ page }) => {
    const historyBtn = page.locator('[aria-label="版本历史"]').first();
    await historyBtn.click();
    await page.waitForTimeout(800);

    const createBtn = page.locator('[data-testid="create-snapshot-btn"]');
    await expect(createBtn).toBeVisible({ timeout: 5000 });
  });

  // 快照列表区域存在（即使为空）
  test('E2E-6: 快照列表区域存在', async ({ page }) => {
    const historyBtn = page.locator('[aria-label="版本历史"]').first();
    await historyBtn.click();
    await page.waitForTimeout(800);

    // List container exists (empty state or populated)
    const listArea = page.locator('[role="dialog"] > div > div').last();
    await expect(listArea).toBeVisible({ timeout: 5000 });
  });
});
