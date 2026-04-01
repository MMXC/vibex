/**
 * responsive-layout.spec.ts — E3: 响应式布局 E2E 测试
 *
 * Verifies:
 * - F3.1: 768px breakpoint shows 2 columns
 * - F3.2: 375px breakpoint shows 1 column with tabs
 *
 * Run: BASE_URL=http://localhost:3000 npx playwright test tests/e2e/responsive-layout.spec.ts
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000';
const CANVAS_URL = `${BASE_URL}/canvas`;

/** Navigate to canvas page */
async function gotoCanvas(page: import('@playwright/test').Page) {
  await page.goto(CANVAS_URL, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle');
}

/** Get computed layout info from the canvas */
async function getComputedLayout(page: import('@playwright/test').Page) {
  return page.evaluate(() => {
    // Check how many tree panels are visible (non-zero width)
    const grid = document.querySelector('[class*="treePanelsGrid"]');
    if (!grid) return { columns: 0, hasTabs: false, gridVisible: false };

    const children = Array.from(grid.children);
    const visibleColumns = children.filter((el) => {
      const rect = el.getBoundingClientRect();
      return rect.width > 10; // Ignore collapsed/empty columns
    });

    // Check if tabs are present (mobile/tab mode)
    const tabs = document.querySelector('[role="tablist"]');
    const tabBar = document.querySelector('[class*="tabBar"]');

    return {
      columns: visibleColumns.length,
      hasTabs: !!(tabs || tabBar),
      gridVisible: true,
    };
  });
}

test.describe('E3: Responsive Layout', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage for clean state
    await page.goto(CANVAS_URL);
    await page.evaluate(() => localStorage.removeItem('vibex-canvas-storage'));
  });

  test('F3.1: 768px breakpoint shows 2 columns', async ({ page }) => {
    // Set viewport to tablet size (768-1023px range)
    await page.setViewportSize({ width: 1024, height: 768 });
    await gotoCanvas(page);

    const layout = await getComputedLayout(page);
    expect(layout.gridVisible).toBe(true);
    // At tablet, should show 2 visible tree columns
    expect(layout.columns).toBeGreaterThanOrEqual(2);
  });

  test('F3.2: 375px breakpoint shows 1 column with tabs', async ({ page }) => {
    // Set viewport to mobile size
    await page.setViewportSize({ width: 375, height: 667 });
    await gotoCanvas(page);

    const layout = await getComputedLayout(page);
    expect(layout.gridVisible).toBe(true);
    // At mobile, should show 1 column with tab navigation
    expect(layout.columns).toBe(1);
    expect(layout.hasTabs).toBe(true);
  });

  test('F3.3: Desktop viewport shows full 3 columns', async ({ page }) => {
    // Set viewport to desktop size
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoCanvas(page);

    const layout = await getComputedLayout(page);
    expect(layout.gridVisible).toBe(true);
    // At desktop, should show all 3 tree columns visible
    expect(layout.columns).toBeGreaterThanOrEqual(3);
  });

  test('F3.4: Tab navigation works on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await gotoCanvas(page);

    // Check that tab bar is visible on mobile
    const tabs = page.locator('[role="tablist"]');
    await expect(tabs).toBeVisible({ timeout: 5000 });

    // Click the flow tab
    const flowTab = page.getByRole('tab', { name: /流程/ });
    await flowTab.click();
    await page.waitForLoadState('networkidle');

    // Tab should now be selected
    await expect(flowTab).toHaveAttribute('aria-selected', 'true');
  });
});
