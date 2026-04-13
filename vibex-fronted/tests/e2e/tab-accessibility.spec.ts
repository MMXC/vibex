/**
 * tab-accessibility.spec.ts — Epic3 S3.1/S3.2/S3.3
 *
 * S3.1: prototype tab 完全解锁验证 — Epic1 移除了 locked 逻辑后，所有 tab 均无 disabled
 * S3.2: Tab active 状态验证 — 点击 tab 后 aria-selected 正确切换
 * S3.3: E2E 完整 tab 切换路径
 *
 * Conentions:
 * - test: E2E-<N>: <description>
 * - Auth: cookies (middleware reads cookies, not sessionStorage)
 * - No networkidle (canvas has SSE)
 */
import { test, expect } from '@playwright/test';

test.describe('TabBar Accessibility & Tab Switching (Epic3)', () => {
  test.beforeEach(async ({ page, context }) => {
    // Bypass auth — middleware reads cookies
    await context.addCookies([
      { name: 'auth_token', value: 'mock-e2e-token', domain: 'localhost', path: '/' },
    ]);
    await page.goto('/canvas');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500); // React hydration
  });

  // S3.1: prototype tab is always accessible (no locked behavior)
  test('E2E-S3.1-1: All 4 tabs have no disabled attribute (S1.1 no-lock verification)', async ({ page }) => {
    const tabs = page.locator('[role="tab"]');
    const count = await tabs.count();
    expect(count).toBeGreaterThanOrEqual(3);

    for (const tab of await tabs.all()) {
      await expect(tab).not.toHaveAttribute('disabled', '');
      await expect(tab).not.toHaveAttribute('aria-disabled', 'true');
    }
  });

  // S3.1: prototype tab is always accessible
  test('E2E-S3.1-2: prototype tab exists and is clickable', async ({ page }) => {
    const prototypeTab = page.locator('[role="tab"]', { hasText: /原型|prototype/i }).first();
    await expect(prototypeTab).toBeVisible({ timeout: 5000 });
    await prototypeTab.click();
    await page.waitForTimeout(500);
    // prototype tab should now be aria-selected=true
    await expect(prototypeTab).toHaveAttribute('aria-selected', 'true');
  });

  // S3.2: Tab active state verification — clicking tab updates aria-selected
  test('E2E-S3.2-1: clicking flow tab makes it aria-selected=true', async ({ page }) => {
    const tabs = page.locator('[role="tab"]');
    // Click flow tab (index 1)
    await (await tabs.all())[1].click();
    await page.waitForTimeout(300);
    const flowTab = (await tabs.all())[1];
    await expect(flowTab).toHaveAttribute('aria-selected', 'true');
  });

  test('E2E-S3.2-2: clicking component tab makes it aria-selected=true', async ({ page }) => {
    const tabs = page.locator('[role="tab"]');
    // Click component tab (index 2)
    await (await tabs.all())[2].click();
    await page.waitForTimeout(300);
    const componentTab = (await tabs.all())[2];
    await expect(componentTab).toHaveAttribute('aria-selected', 'true');
  });

  // S3.3: E2E tab switching flow
  test('E2E-S3.3: complete tab switching flow', async ({ page }) => {
    const tabs = page.locator('[role="tab"]');
    const allTabs = await tabs.all();
    const tabCount = allTabs.length;

    // Start at context tab (default)
    await expect(allTabs[0]).toHaveAttribute('aria-selected', 'true');

    // Switch through all tabs
    for (let i = 1; i < tabCount; i++) {
      await allTabs[i].click();
      await page.waitForTimeout(300);
      await expect(allTabs[i]).toHaveAttribute('aria-selected', 'true');
      // Previous tab should no longer be selected
      if (i > 0) {
        await expect(allTabs[i - 1]).toHaveAttribute('aria-selected', 'false');
      }
    }
  });

  // S3.3: no networkidle required (canvas has SSE)
  test('E2E-S3.3-alt: tab switching works without waiting for networkidle', async ({ page }) => {
    const tabs = page.locator('[role="tab"]');
    const allTabs = await tabs.all();

    // Switch tabs without networkidle — should work
    await allTabs[1].click();
    await page.waitForTimeout(200);
    await expect(allTabs[1]).toHaveAttribute('aria-selected', 'true');

    await allTabs[2].click();
    await page.waitForTimeout(200);
    await expect(allTabs[2]).toHaveAttribute('aria-selected', 'true');
  });
});
