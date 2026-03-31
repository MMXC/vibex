/**
 * Canvas Quality CI — E5
 *
 * 5 个 CI-blocking 测试用例，覆盖 canvas 三树核心质量验证：
 * E2E-1: Canvas page loads without console errors
 * E2E-2: Context tree nodes render with data
 * E2E-3: Flow tree nodes render with data
 * E2E-4: Component tree nodes render with data
 * E2E-5: Node selection works in context tree
 * E2E-6: Navigation between tabs works
 *
 * Run: pnpm test:e2e -- tests/e2e/canvas-quality-ci.spec.ts
 */

import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const CANVAS_URL = `${BASE_URL}/canvas`;

async function goToCanvas(page: Page) {
  await page.goto(CANVAS_URL);
  await page.waitForLoadState('domcontentloaded');

  // Skip onboarding if present
  const skipBtn = page
    .locator('button:has-text("跳过"), button:has-text("Skip"), button:has-text("开始使用"), button:has-text("Got it")')
    .first();
  if (await skipBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await skipBtn.click();
    await page.waitForLoadState('networkidle');
  }

  // Import example data so trees have content
  const importBtn = page.locator('[data-testid="import-example-btn"]');
  if (await importBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await importBtn.click();
    await page.waitForTimeout(2000);
  }
}

test.describe('Canvas Quality CI — E5', () => {
  test.beforeEach(async ({ page }) => {
    await goToCanvas(page);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // E2E-1: Canvas page loads without console errors
  // ─────────────────────────────────────────────────────────────────────────
  test('@ci-blocking E2E-1: Canvas page loads without console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    page.on('pageerror', (err) => {
      errors.push(err.message);
    });

    await page.goto(CANVAS_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Filter out known benign errors (e.g., third-party favicon 404s)
    const criticalErrors = errors.filter(
      (e) =>
        !e.includes('favicon') &&
        !e.includes('net::ERR_') &&
        !e.includes('chrome-extension')
    );

    expect(criticalErrors, `Unexpected console errors: ${criticalErrors.join('\n')}`).toHaveLength(0);

    // Page should have rendered canvas structure
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // E2E-2: Context tree nodes render with data
  // ─────────────────────────────────────────────────────────────────────────
  test('@ci-blocking E2E-2: Context tree nodes render with data', async ({ page }) => {
    // In desktop mode all 3 panels are visible in the grid
    const treePanels = page.locator('[class*="treePanelsGrid"] > [class*="treePanel"]');
    const panelCount = await treePanels.count();
    expect(panelCount, 'Expected 3 tree panels (context + flow + component)').toBe(3);

    // Context tree panel should contain tree nodes (cards/list items with text content)
    // Look for nodes inside the first tree panel (context = leftmost)
    const firstPanel = treePanels.first();
    const panelHeader = firstPanel.locator('[class*="panelHeader"], [class*="treeHeader"]').first();

    // If panel is collapsed, expand it
    const collapseBtn = firstPanel.locator('button[aria-label*="展开"][aria-label*="面板"]').first();
    if (await collapseBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await collapseBtn.click();
      await page.waitForTimeout(500);
    }

    // Check for tree nodes — they appear as interactive items inside the panel
    const contextNodes = firstPanel.locator('[class*="treeNode"], [class*="nodeItem"], [class*="card"]');
    const nodeCount = await contextNodes.count();
    expect(nodeCount, `Context tree should have nodes after import, found ${nodeCount}`).toBeGreaterThan(0);

    // Node labels should be visible (non-empty text)
    const firstNodeText = await contextNodes.first().textContent();
    expect(firstNodeText && firstNodeText.trim().length > 0, 'First node should have non-empty text').toBeTruthy();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // E2E-3: Flow tree nodes render with data
  // ─────────────────────────────────────────────────────────────────────────
  test('@ci-blocking E2E-3: Flow tree nodes render with data', async ({ page }) => {
    // Flow tree is the second panel in the grid
    const treePanels = page.locator('[class*="treePanelsGrid"] > [class*="treePanel"]');
    const panelCount = await treePanels.count();
    expect(panelCount, 'Expected 3 tree panels').toBe(3);

    const flowPanel = treePanels.nth(1);

    // Expand if collapsed
    const expandBtn = flowPanel.locator('button[aria-label*="展开"][aria-label*="面板"]').first();
    if (await expandBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expandBtn.click();
      await page.waitForTimeout(500);
    }

    // Flow tree nodes should exist
    const flowNodes = flowPanel.locator('[class*="treeNode"], [class*="nodeItem"], [class*="card"]');
    const nodeCount = await flowNodes.count();
    expect(nodeCount, `Flow tree should have nodes after import, found ${nodeCount}`).toBeGreaterThan(0);

    const firstNodeText = await flowNodes.first().textContent();
    expect(firstNodeText && firstNodeText.trim().length > 0, 'First flow node should have non-empty text').toBeTruthy();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // E2E-4: Component tree nodes render with data
  // ─────────────────────────────────────────────────────────────────────────
  test('@ci-blocking E2E-4: Component tree nodes render with data', async ({ page }) => {
    const treePanels = page.locator('[class*="treePanelsGrid"] > [class*="treePanel"]');
    const panelCount = await treePanels.count();
    expect(panelCount, 'Expected 3 tree panels').toBe(3);

    const componentPanel = treePanels.nth(2);

    // Expand if collapsed
    const expandBtn = componentPanel.locator('button[aria-label*="展开"][aria-label*="面板"]').first();
    if (await expandBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expandBtn.click();
      await page.waitForTimeout(500);
    }

    // Component tree nodes should exist
    const componentNodes = componentPanel.locator('[class*="treeNode"], [class*="nodeItem"], [class*="card"]');
    const nodeCount = await componentNodes.count();
    expect(nodeCount, `Component tree should have nodes after import, found ${nodeCount}`).toBeGreaterThan(0);

    const firstNodeText = await componentNodes.first().textContent();
    expect(firstNodeText && firstNodeText.trim().length > 0, 'First component node should have non-empty text').toBeTruthy();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // E2E-5: Node selection works in context tree
  // ─────────────────────────────────────────────────────────────────────────
  test('@ci-blocking E2E-5: Node selection works in context tree', async ({ page }) => {
    // Expand context panel if collapsed
    const treePanels = page.locator('[class*="treePanelsGrid"] > [class*="treePanel"]');
    const contextPanel = treePanels.first();

    const expandBtn = contextPanel.locator('button[aria-label*="展开"][aria-label*="面板"]').first();
    if (await expandBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expandBtn.click();
      await page.waitForTimeout(500);
    }

    // Get first tree node
    const contextNodes = contextPanel.locator('[class*="treeNode"], [class*="nodeItem"], [class*="card"]');
    const nodeCount = await contextNodes.count();
    expect(nodeCount, 'Context tree should have at least 1 node').toBeGreaterThan(0);

    // Click first node — should trigger selection
    await contextNodes.first().click();
    await page.waitForTimeout(500);

    // The node should now have a selected state (class or attribute indicating selection)
    // Check either via class containing 'selected' or via aria-selected attribute
    const firstNode = contextNodes.first();
    const nodeClass = await firstNode.getAttribute('class') || '';
    const ariaSelected = await firstNode.getAttribute('aria-selected');

    const isSelected = nodeClass.includes('selected') || ariaSelected === 'true';
    expect(isSelected, `Node should be selected after click. class="${nodeClass}" aria-selected="${ariaSelected}"`).toBeTruthy();

    // Click again — should deselect
    await firstNode.click();
    await page.waitForTimeout(300);

    const nodeClassAfter = await firstNode.getAttribute('class') || '';
    const ariaSelectedAfter = await firstNode.getAttribute('aria-selected');
    const isDeselected = !nodeClassAfter.includes('selected') || ariaSelectedAfter === 'false';
    expect(isDeselected, 'Node should be deselected after second click').toBeTruthy();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // E2E-6: Navigation between tabs works
  // ─────────────────────────────────────────────────────────────────────────
  test('@ci-blocking E2E-6: Navigation between tabs works', async ({ page }) => {
    // Find the tab bar / tab list
    const tabList = page.locator('[role="tablist"], [class*="tabList"], [class*="tabBar"]').first();

    // Wait for tabs to be visible
    await expect(tabList).toBeVisible({ timeout: 5000 });

    // Get all tabs
    const tabs = tabList.locator('[role="tab"]');
    const tabCount = await tabs.count();
    expect(tabCount, `Expected at least 3 tabs (context, flow, component), found ${tabCount}`).toBeGreaterThanOrEqual(3);

    // Click each tab and verify it becomes active
    for (let i = 0; i < tabCount; i++) {
      const tab = tabs.nth(i);
      const tabLabel = (await tab.textContent()) || `tab-${i}`;

      await tab.click();
      await page.waitForTimeout(300);

      // The clicked tab should have aria-selected="true" or active class
      const ariaSelected = await tab.getAttribute('aria-selected');
      const tabClass = await tab.getAttribute('class') || '';
      const isActive = ariaSelected === 'true' || tabClass.includes('active');

      expect(isActive, `Tab "${tabLabel}" (index ${i}) should be active after click`).toBeTruthy();
    }

    // After clicking all tabs, the last one should still be selected
    const lastTab = tabs.last();
    const lastSelected = await lastTab.getAttribute('aria-selected');
    const lastClass = await lastTab.getAttribute('class') || '';
    const lastActive = lastSelected === 'true' || lastClass.includes('active');
    expect(lastActive, 'Last tab should remain active after cycling through all tabs').toBeTruthy();
  });
});
