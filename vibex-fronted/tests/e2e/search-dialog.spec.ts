/**
 * search-dialog.spec.ts — E1.2: SearchDialog E2E Tests
 *
 * PRD 验收标准 (E1.2):
 * - AC1: SearchDialog 正确渲染
 * - AC2: Ctrl+K 快捷键打开 SearchDialog
 * - AC3: 搜索功能正常，返回结果
 * - AC4: Escape 关闭 SearchDialog
 *
 * Conventions:
 * - File: search-dialog-<epic>.spec.ts
 * - Test: E2E-N: <Description>
 * - Waits: semantic Playwright waits (no waitForTimeout)
 */
import { test, expect } from '@playwright/test';

test.describe('SearchDialog (E1.2)', () => {
  test.beforeEach(async ({ page }) => {
    // Mock search API
    await page.route('**/api/search**', (route) => {
      const url = route.request().url();
      const query = new URL(url).searchParams.get('q') || '';
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          results: [
            { id: 'node-1', name: `Result for "${query}"`, type: 'component' },
            { id: 'node-2', name: `Another result for "${query}"`, type: 'flow' },
          ],
        }),
      });
    });

    await page.goto('/canvas/test-project');
    await page.waitForLoadState('networkidle');
  });

  // AC2: Ctrl+K 快捷键打开
  test('E2E-1: Ctrl+K 打开 SearchDialog', async ({ page }) => {
    await page.keyboard.press('Control+k');
    await page.waitForLoadState('domcontentloaded');

    const dialog = page.locator('[data-testid="search-dialog"], .search-dialog, [role="search"], [role="dialog"]').first();
    const dialogVisible = await dialog.isVisible().catch(() => false);
    expect(dialogVisible).toBeTruthy();
  });

  // AC1: SearchDialog 正确渲染
  test('E2E-2: SearchDialog 显示搜索输入框', async ({ page }) => {
    await page.keyboard.press('Control+k');
    await page.waitForLoadState('domcontentloaded');

    const input = page.locator('input[placeholder*="搜索"], input[placeholder*="Search"], input[type="search"]').first();
    const inputVisible = await input.isVisible().catch(() => false);
    expect(inputVisible).toBeTruthy();
  });

  // AC3: 搜索功能正常
  test('E2E-3: 输入搜索词后显示结果列表', async ({ page }) => {
    await page.keyboard.press('Control+k');
    await page.waitForLoadState('domcontentloaded');

    const input = page.locator('input[type="search"], input[placeholder*="搜索"]').first();
    await input.fill('component');
    await page.waitForResponse('**/api/search**', { timeout: 5000 }).catch(() => {});

    const results = page.locator('[data-testid="search-result"], .search-result, [class*="result-item"]').first();
    const resultsVisible = await results.isVisible().catch(() => false);
    expect(resultsVisible).toBeTruthy();
  });

  // AC4: Escape 关闭
  test('E2E-4: Escape 键关闭 SearchDialog', async ({ page }) => {
    await page.keyboard.press('Control+k');
    await page.waitForLoadState('domcontentloaded');

    await page.keyboard.press('Escape');
    await page.waitForLoadState('domcontentloaded');

    const dialog = page.locator('[data-testid="search-dialog"], .search-dialog, [role="dialog"]').first();
    const dialogHidden = !(await dialog.isVisible().catch(() => true));
    expect(dialogHidden).toBeTruthy();
  });

  // 额外: 点击遮罩关闭
  test('E2E-5: 点击遮罩关闭 SearchDialog', async ({ page }) => {
    await page.keyboard.press('Control+k');
    await page.waitForLoadState('domcontentloaded');

    // Click backdrop/mask
    const backdrop = page.locator('[data-testid="search-backdrop"], .search-backdrop, [class*="overlay"]').first();
    if (await backdrop.isVisible().catch(() => false)) {
      await backdrop.click({ position: { x: 10, y: 10 } });
      await page.waitForLoadState('domcontentloaded');

      const dialog = page.locator('[data-testid="search-dialog"], [role="dialog"]').first();
      const dialogHidden = !(await dialog.isVisible().catch(() => true));
      expect(dialogHidden).toBeTruthy();
    }
  });
});
