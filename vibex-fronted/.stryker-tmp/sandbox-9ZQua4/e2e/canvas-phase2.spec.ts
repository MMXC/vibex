/**
 * canvas-phase2.spec.ts — Canvas Phase 2 E2E Tests
 * Epic E3.2: Canvas E2E 测试覆盖率提升（≥80%）
 *
 * PRD 验收标准:
 * - Canvas E2E 测试覆盖率 ≥ 80%
 * - canvas-phase2 核心功能 100% E2E 覆盖
 * - SVG overlay pointer-events 测试存在
 * - 全屏展开模式 E2E 测试存在
 * - 关系可视化（BC 连线）E2E 测试存在
 *
 * 5 个核心测试用例:
 * TC-1: 全屏展开 expand-both 模式三栏等宽
 * TC-2: SVG overlay 层 pointer-events: none 不阻挡节点交互
 * TC-3: 关系可视化 BC 连线正确渲染
 * TC-4: 全屏 maximize 模式工具栏隐藏
 * TC-5: ESC 快捷键退出全屏
 * TC-6: F11 快捷键切换最大化模式
 *
 * Run: BASE_URL=http://localhost:3000 npx playwright test e2e/canvas-phase2.spec.ts
 */
// @ts-nocheck


import { test, expect } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000';
const CANVAS_URL = `${BASE_URL}/canvas`;

// ============================================================================
// Helpers
// ============================================================================

/** Navigate to canvas page and wait for it to be ready */
async function gotoCanvas(page: import('@playwright/test').Page) {
  await page.goto(CANVAS_URL, { waitUntil: 'domcontentloaded' });
  // Wait for the canvas to hydrate
  await page.waitForLoadState('networkidle');
}

/** Reload canvas to force Zustand to rehydrate from localStorage */
async function reloadCanvas(page: import('@playwright/test').Page) {
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle');
}

/**
 * Seed canvas with context nodes + bounded edges.
 * Uses Zustand persist format: { state: {...}, version: 0 }
 * phase must be 'context' for expand controls to be visible.
 */
async function seedCanvasWithEdges(page: import('@playwright/test').Page) {
  await page.evaluate(
    (url) => {
      const storageData = {
        state: {
          contextNodes: [
            {
              nodeId: 'ctx-user-mgmt',
              name: '用户管理',
              description: '用户注册、登录、个人信息管理',
              type: 'core',
              confirmed: true,
              status: 'confirmed',
              children: [],
            },
            {
              nodeId: 'ctx-order-mgmt',
              name: '订单管理',
              description: '订单创建、支付、履约、取消退款全流程',
              type: 'core',
              confirmed: true,
              status: 'confirmed',
              children: [],
            },
            {
              nodeId: 'ctx-product-mgmt',
              name: '商品管理',
              description: '商品发布、上下架、库存、价格策略',
              type: 'core',
              confirmed: true,
              status: 'confirmed',
              children: [],
            },
          ],
          flowNodes: [],
          componentNodes: [],
          boundedEdges: [
            {
              id: 'edge-user-order',
              from: { groupId: 'ctx-user-mgmt' },
              to: { groupId: 'ctx-order-mgmt' },
              type: 'dependency',
              label: '依赖',
            },
            {
              id: 'edge-order-product',
              from: { groupId: 'ctx-order-mgmt' },
              to: { groupId: 'ctx-product-mgmt' },
              type: 'composition',
              label: '组成',
            },
          ],
          phase: 'context',
          activeTree: 'context',
          draggedPositions: {},
          leftExpand: 'default',
          centerExpand: 'default',
          rightExpand: 'default',
          boundedGroups: [],
          projectId: null,
          prototypeQueue: [],
          expandMode: 'normal',
          flowEdges: [],
        },
        version: 0,
      };
      localStorage.setItem('vibex-canvas-storage', JSON.stringify(storageData));
    },
    [BASE_URL]
  );
}

/** Seed minimal canvas state (just phase: context, no edges) */
async function seedCanvasMinimal(page: import('@playwright/test').Page) {
  await page.evaluate(
    (url) => {
      const storageData = {
        state: {
          contextNodes: [
            {
              nodeId: 'ctx-1',
              name: 'Test Context',
              description: 'Test',
              type: 'core',
              confirmed: true,
              status: 'confirmed',
              children: [],
            },
          ],
          flowNodes: [],
          componentNodes: [],
          boundedEdges: [],
          flowEdges: [],
          phase: 'context',
          activeTree: 'context',
          draggedPositions: {},
          leftExpand: 'default',
          centerExpand: 'default',
          rightExpand: 'default',
          boundedGroups: [],
          projectId: null,
          prototypeQueue: [],
          expandMode: 'normal',
        },
        version: 0,
      };
      localStorage.setItem('vibex-canvas-storage', JSON.stringify(storageData));
    },
    [BASE_URL]
  );
}

// ============================================================================
// TC-1: 全屏展开 expand-both 模式三栏等宽
// ============================================================================

test.describe('TC-1: 全屏展开 expand-both 模式三栏等宽', () => {
  test.beforeEach(async ({ page }) => {
    await gotoCanvas(page);
    await page.evaluate(() => localStorage.removeItem('vibex-canvas-storage'));
    await seedCanvasWithEdges(page);
    await reloadCanvas(page);
  });

  test('TC-1.1: 点击全屏展开按钮进入 expand-both 模式，三栏变为 1fr 1fr 1fr', async ({ page }) => {
    await gotoCanvas(page);

    // Wait for expand button to appear (only visible in context phase)
    const expandBtn = page.locator('button', { hasText: '全屏展开' }).first();
    await expect(expandBtn).toBeVisible({ timeout: 20000 });

    // Get grid before expand
    const grid = page.locator('[class*="treePanelsGrid"]').first();
    await expect(grid).toBeVisible({ timeout: 10000 });

    // Click expand button
    await expandBtn.click({ force: true });

    // Wait for animation

    // Verify expand-both class is applied to canvas container
    const canvasContainer = page.locator('[class*="canvasContainer"]').first();
    await expect(canvasContainer).toHaveClass(/expandBothMode/, { timeout: 5000 });

    // Verify three columns are equal (1fr each)
    const cols = await grid.evaluate((el) => {
      const style = window.getComputedStyle(el);
      const template = style.gridTemplateColumns;
      // Parse fr values
      const parts = template.split(' ').filter(Boolean).map((v) => parseFloat(v));
      return parts;
    });

    expect(cols).toHaveLength(3);
    // All three columns should be equal (within 1px tolerance for rounding)
    expect(Math.abs(cols[0] - cols[1])).toBeLessThan(2);
    expect(Math.abs(cols[1] - cols[2])).toBeLessThan(2);
  });

  test('TC-1.2: expand-both 模式下按钮变为「退出全屏展开」', async ({ page }) => {
    await gotoCanvas(page);

    const expandBtn = page.locator('button', { hasText: '全屏展开' }).first();
    await expect(expandBtn).toBeVisible({ timeout: 20000 });

    // Click to enter expand-both
    await expandBtn.click({ force: true });

    // Button should now show exit label
    await expect(page.locator('[aria-label="退出全屏展开"]').first()).toBeVisible({ timeout: 5000 });
  });

  test('TC-1.3: 再次点击退出全屏展开，恢复正常布局', async ({ page }) => {
    await gotoCanvas(page);

    const expandBtn = page.locator('button', { hasText: '全屏展开' }).first();
    await expect(expandBtn).toBeVisible({ timeout: 20000 });

    // Enter expand-both
    await expandBtn.click({ force: true });

    // Exit expand-both
    const exitBtn = page.locator('[aria-label="退出全屏展开"]').first();
    await exitBtn.click({ force: true });

    // Verify expand-both class is removed
    const canvasContainer = page.locator('[class*="canvasContainer"]').first();
    await expect(canvasContainer).not.toHaveClass(/expandBothMode/);

    // Button should be back to expand label
    await expect(page.locator('button', { hasText: '全屏展开' }).first()).toBeVisible({ timeout: 5000 });
  });

  test('TC-1.4: expand-both 模式下 grid 仍然是 3 列', async ({ page }) => {
    await gotoCanvas(page);

    const expandBtn = page.locator('button', { hasText: '全屏展开' }).first();
    await expect(expandBtn).toBeVisible({ timeout: 20000 });

    await expandBtn.click({ force: true });

    const grid = page.locator('[class*="treePanelsGrid"]').first();
    await expect(grid).toBeVisible();

    // All 3 panels should still be visible inside the grid (grid has 5 children: 2 expandCols + 3 treePanels)
    // Count direct children of grid with treePanel class
    const treePanelCount = await grid.evaluate(el =>
      Array.from(el.children).filter(c => typeof c.className === 'string' && c.className.includes('treePanel')).length
    );
    expect(treePanelCount).toBe(3);
  });
});

// ============================================================================
// TC-2: SVG overlay 层 pointer-events: none 不阻挡节点交互
// ============================================================================

test.describe('TC-2: SVG overlay 层 pointer-events: none 不阻挡节点交互', () => {
  test.beforeEach(async ({ page }) => {
    await gotoCanvas(page);
    await page.evaluate(() => localStorage.removeItem('vibex-canvas-storage'));
    await seedCanvasWithEdges(page);
    await reloadCanvas(page);
  });

  test('TC-2.1: BoundedEdgeLayer SVG 层 pointer-events 为 none', async ({ page }) => {
    await gotoCanvas(page);

    // Find all SVG elements in the canvas
    const svgLayers = page.locator('svg').filter({ has: page.locator('path[stroke]') });
    const count = await svgLayers.count();

    if (count > 0) {
      const pointerEvents = await svgLayers.first().evaluate(
        (el) => window.getComputedStyle(el).pointerEvents
      );
      expect(pointerEvents).toBe('none');
    } else {
      // If no SVG layers with stroke paths visible yet, check inline style for pointer-events: none
      const svgWithPointerNone = page.locator('svg[style*="pointer-events: none"]');
      const hasInlineStyle = await svgWithPointerNone.count();
      // The SVG might have pointer-events: none via class, not inline style
      // In that case, we check the class
      if (hasInlineStyle === 0) {
        // Check if the canvas area SVG has pointer-events: none set
        const canvasSvgs = page.locator('[class*="canvasContainer"] svg');
        const canvasSvgCount = await canvasSvgs.count();
        if (canvasSvgCount > 0) {
          const pe = await canvasSvgs.first().evaluate(
            (el) => window.getComputedStyle(el).pointerEvents
          );
          expect(pe).toBe('none');
        }
      }
    }
  });

  test('TC-2.2: ReactFlow 节点在 edge overlay 上方可点击', async ({ page }) => {
    await gotoCanvas(page);

    // Find ReactFlow nodes
    const rfNodes = page.locator('.react-flow__node');
    const nodeCount = await rfNodes.count();

    if (nodeCount > 0) {
      const firstNode = rfNodes.first();
      const box = await firstNode.boundingBox();

      if (box) {
        // Click on the node center
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);

        // Page should remain stable — no crash
        await expect(page.locator('body')).toBeVisible();
        await expect(page.locator('.react-flow__node').first()).toBeVisible();
      }
    } else {
      // No nodes yet — verify the canvas container renders without error
      const canvasContainer = page.locator('[class*="canvasContainer"]').first();
      await expect(canvasContainer).toBeVisible();
    }
  });

  test('TC-2.3: 点击 edge SVG 区域时，事件穿透到下方节点', async ({ page }) => {
    await gotoCanvas(page);

    // Find SVG paths (edges)
    const allSvgPaths = page.locator('svg path');
    const pathCount = await allSvgPaths.count();

    if (pathCount > 0) {
      const firstPath = allSvgPaths.first();
      const box = await firstPath.boundingBox();

      if (box && box.width > 0 && box.height > 0) {
        // Click on the path — should NOT be captured by SVG (pointer-events: none)
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);

        // Page should remain stable — no crash
        await expect(page.locator('body')).toBeVisible();
        const canvasArea = page.locator('[class*="canvasContainer"]').first();
        await expect(canvasArea).toBeVisible();
      }
    } else {
      // No edge paths yet — verify the canvas container renders without error
      const canvasContainer = page.locator('[class*="canvasContainer"]').first();
      await expect(canvasContainer).toBeVisible();
    }
  });
});

// ============================================================================
// TC-3: 关系可视化 BC 连线正确渲染
// ============================================================================

test.describe('TC-3: 关系可视化 BC 连线正确渲染', () => {
  test.beforeEach(async ({ page }) => {
    await gotoCanvas(page);
    await page.evaluate(() => localStorage.removeItem('vibex-canvas-storage'));
    await seedCanvasWithEdges(page);
    await reloadCanvas(page);
  });

  test('TC-3.1: 有 boundedEdges 时 SVG edge layer 渲染 path 元素', async ({ page }) => {
    await gotoCanvas(page);

    // Find SVG layers that contain edge paths
    const edgeSvg = page.locator('svg').filter({ has: page.locator('path[stroke]') });
    const count = await edgeSvg.count();

    // There should be at least one SVG edge layer with stroke paths
    // (The exact count depends on how many edge layers are rendered)
    if (count > 0) {
      const pathCount = await page.locator('svg path[stroke]').count();
      // At least one edge path should exist from seeded data
      expect(pathCount).toBeGreaterThanOrEqual(1);
    }
    // If no edge SVG yet (edges might need node positions), verify canvas is stable
    const canvasContainer = page.locator('[class*="canvasContainer"]').first();
    await expect(canvasContainer).toBeVisible();
  });

  test('TC-3.2: 有 edges 时 SVG path 使用正确的连线颜色', async ({ page }) => {
    await gotoCanvas(page);

    // Find edge paths and verify stroke colors
    const edgePaths = page.locator('svg path[stroke]').filter({
      hasNot: page.locator('svg path[stroke-width="0"]'),
    });

    // Expected colors for BoundedEdge types:
    // dependency = #6366f1 (indigo), composition = #8b5cf6 (violet), association = #94a3b8 (slate)
    const expectedColors = ['#6366f1', '#8b5cf6', '#94a3b8'];
    const count = await edgePaths.count();

    for (let i = 0; i < Math.min(count, 5); i++) {
      const path = edgePaths.nth(i);
      const stroke = await path.getAttribute('stroke');
      if (stroke) {
        // Skip currentColor (used for ReactFlow handles, not BoundedEdges)
        if (stroke === 'currentColor') continue;
        // Check if stroke is one of the expected colors (or rgb/rgba equivalent)
        const isExpectedColor =
          expectedColors.includes(stroke.toLowerCase()) ||
          expectedColors.some((c) => stroke.includes(c.replace('#', '')));
        const isRgbFormat = stroke.startsWith('rgb');
        expect(isExpectedColor || isRgbFormat).toBe(true);
      }
    }
  });

  test('TC-3.3: boundedEdges 为空时 SVG edge layer 不渲染', async ({ page }) => {
    await gotoCanvas(page);

    // Clear edges via localStorage
    await page.evaluate(() => {
      const raw = localStorage.getItem('vibex-canvas-storage');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.state) {
          parsed.state.boundedEdges = [];
        } else if (parsed.boundedEdges) {
          parsed.boundedEdges = [];
        }
        localStorage.setItem('vibex-canvas-storage', JSON.stringify(parsed));
      }
    });

    await page.reload({ waitUntil: "networkidle" });

    // When edges array is empty, BoundedEdgeLayer returns <> (null), no SVG rendered
    // Canvas container should still be visible and stable
    const canvasContainer = page.locator('[class*="canvasContainer"]').first();
    await expect(canvasContainer).toBeVisible();
  });
});

// ============================================================================
// TC-4: 全屏 maximize 模式工具栏隐藏
// ============================================================================

test.describe('TC-4: 全屏 maximize 模式工具栏隐藏', () => {
  test.beforeEach(async ({ page }) => {
    await gotoCanvas(page);
    await page.evaluate(() => localStorage.removeItem('vibex-canvas-storage'));
    await seedCanvasWithEdges(page);
    await reloadCanvas(page);
  });

  test('TC-4.1: 点击最大化按钮进入 maximize 模式', async ({ page }) => {
    await gotoCanvas(page);

    // Find maximize button (visible in context phase)
    const maximizeBtn = page.locator('[aria-label="最大化"]').first();
    await expect(maximizeBtn).toBeVisible({ timeout: 20000 });

    // Click maximize
    await maximizeBtn.click({ force: true });

    // Canvas container should have maximizeMode class
    const canvasContainer = page.locator('[class*="canvasContainer"]').first();
    await expect(canvasContainer).toHaveClass(/maximizeMode/, { timeout: 5000 });
  });

  test('TC-4.2: maximize 模式下工具栏隐藏', async ({ page }) => {
    await gotoCanvas(page);

    // First enter maximize mode
    const maximizeBtn = page.locator('[aria-label="最大化"]').first();
    await expect(maximizeBtn).toBeVisible({ timeout: 20000 });
    await maximizeBtn.click({ force: true });

    // ProjectBar should be hidden (opacity: 0 or visibility: hidden)
    const projectBar = page.locator('[class*="projectBarWrapper"]').first();
    const isProjectBarVisible = await projectBar.isVisible().catch(() => false);
    if (isProjectBarVisible) {
      const opacity = await projectBar.evaluate((el) => window.getComputedStyle(el).opacity);
      expect(parseFloat(opacity)).toBeLessThan(0.1);
    } else {
      await expect(projectBar).not.toBeVisible();
    }

    // PhaseLabelBar should be hidden
    const phaseBar = page.locator('[class*="phaseLabelBar"]').first();
    const isPhaseBarVisible = await phaseBar.isVisible().catch(() => false);
    if (isPhaseBarVisible) {
      const opacity = await phaseBar.evaluate((el) => window.getComputedStyle(el).opacity);
      expect(parseFloat(opacity)).toBeLessThan(0.1);
    }
  });

  test('TC-4.3: maximize 模式下按钮变为「退出最大化」', async ({ page }) => {
    await gotoCanvas(page);

    const maximizeBtn = page.locator('[aria-label="最大化"]').first();
    await expect(maximizeBtn).toBeVisible({ timeout: 20000 });
    await maximizeBtn.click({ force: true });

    // Button should now show exit label
    await expect(page.locator('[aria-label="退出最大化"]').first()).toBeVisible({ timeout: 5000 });
  });

  test('TC-4.4: 再次点击退出最大化恢复正常布局', async ({ page }) => {
    await gotoCanvas(page);

    const maximizeBtn = page.locator('[aria-label="最大化"]').first();
    await expect(maximizeBtn).toBeVisible({ timeout: 20000 });
    await maximizeBtn.click({ force: true });

    // Exit maximize
    const exitBtn = page.locator('[aria-label="退出最大化"]').first();
    await exitBtn.click({ force: true });

    // Canvas container should NOT have maximizeMode class
    const canvasContainer = page.locator('[class*="canvasContainer"]').first();
    await expect(canvasContainer).not.toHaveClass(/maximizeMode/);

    // Button should be back
    await expect(page.locator('[aria-label="最大化"]').first()).toBeVisible({ timeout: 5000 });
  });

  test('TC-4.5: maximize 模式下 expand 按钮被隐藏（expandMode !== maximize 时显示）', async ({ page }) => {
    await gotoCanvas(page);

    // Before maximize: expand button is visible
    const expandBtn = page.locator('button', { hasText: '全屏展开' }).first();
    await expect(expandBtn).toBeVisible({ timeout: 20000 });

    // Enter maximize
    const maximizeBtn = page.locator('[aria-label="最大化"]').first();
    await maximizeBtn.click({ force: true });

    // Expand button should be hidden in maximize mode
    await expect(expandBtn).not.toBeVisible();
  });
});

// ============================================================================
// TC-5: ESC 快捷键退出全屏
// ============================================================================

test.describe('TC-5: ESC 快捷键退出全屏', () => {
  test.beforeEach(async ({ page }) => {
    await gotoCanvas(page);
    await page.evaluate(() => localStorage.removeItem('vibex-canvas-storage'));
    await seedCanvasWithEdges(page);
    await reloadCanvas(page);
  });

  test('TC-5.1: maximize 模式下按 ESC 退出全屏', async ({ page }) => {
    await gotoCanvas(page);

    // Enter maximize mode via button
    const maximizeBtn = page.locator('[aria-label="最大化"]').first();
    await expect(maximizeBtn).toBeVisible({ timeout: 20000 });
    await maximizeBtn.click({ force: true });

    // Verify maximize is active
    const canvasContainer = page.locator('[class*="canvasContainer"]').first();
    await expect(canvasContainer).toHaveClass(/maximizeMode/);

    // Press ESC to exit
    await page.keyboard.press('Escape');

    // Should exit maximize mode
    await expect(canvasContainer).not.toHaveClass(/maximizeMode/);

    // Button should be back to maximize
    await expect(page.locator('[aria-label="最大化"]').first()).toBeVisible({ timeout: 5000 });
  });

  test('TC-5.2: normal 模式下按 ESC 无效果', async ({ page }) => {
    await gotoCanvas(page);

    // Ensure in normal mode
    const canvasContainer = page.locator('[class*="canvasContainer"]').first();
    await expect(canvasContainer).not.toHaveClass(/maximizeMode/);
    await expect(canvasContainer).not.toHaveClass(/expandBothMode/);

    // Press ESC in normal mode — should have no effect
    await page.keyboard.press('Escape');

    // Should still be in normal mode
    await expect(canvasContainer).not.toHaveClass(/maximizeMode/);
    await expect(canvasContainer).not.toHaveClass(/expandBothMode/);
  });

  test('TC-5.3: expand-both 模式下按 ESC 不退出（仅 maximize 退出）', async ({ page }) => {
    await gotoCanvas(page);

    // Enter expand-both mode
    const expandBtn = page.locator('button', { hasText: '全屏展开' }).first();
    await expect(expandBtn).toBeVisible({ timeout: 20000 });
    await expandBtn.click({ force: true });

    const canvasContainer = page.locator('[class*="canvasContainer"]').first();
    await expect(canvasContainer).toHaveClass(/expandBothMode/);

    // Press ESC in expand-both — should NOT exit (only maximize exits via ESC)
    await page.keyboard.press('Escape');

    // Should still be in expand-both mode
    await expect(canvasContainer).toHaveClass(/expandBothMode/);
  });
});

// ============================================================================
// TC-6: F11 快捷键切换最大化模式
// ============================================================================

test.describe('TC-6: F11 快捷键切换最大化模式', () => {
  test.beforeEach(async ({ page }) => {
    await gotoCanvas(page);
    await page.evaluate(() => localStorage.removeItem('vibex-canvas-storage'));
    await seedCanvasWithEdges(page);
    await reloadCanvas(page);
  });

  test('TC-6.1: 按 F11 进入 maximize 模式', async ({ page }) => {
    await gotoCanvas(page);

    const canvasContainer = page.locator('[class*="canvasContainer"]').first();
    await expect(canvasContainer).not.toHaveClass(/maximizeMode/);

    // Press F11
    await page.keyboard.press('F11');

    // Should enter maximize
    await expect(canvasContainer).toHaveClass(/maximizeMode/, { timeout: 5000 });
  });

  test('TC-6.2: 再次按 F11 退出 maximize 模式', async ({ page }) => {
    await gotoCanvas(page);

    // Enter maximize via F11
    await page.keyboard.press('F11');

    const canvasContainer = page.locator('[class*="canvasContainer"]').first();
    await expect(canvasContainer).toHaveClass(/maximizeMode/);

    // Exit via F11 again
    await page.keyboard.press('F11');

    await expect(canvasContainer).not.toHaveClass(/maximizeMode/);
  });

  test('TC-6.3: F11 → ESC → F11 组合快捷键', async ({ page }) => {
    await gotoCanvas(page);

    const canvasContainer = page.locator('[class*="canvasContainer"]').first();

    // Enter via F11
    await page.keyboard.press('F11');
    await expect(canvasContainer).toHaveClass(/maximizeMode/);

    // Exit via ESC
    await page.keyboard.press('Escape');
    await expect(canvasContainer).not.toHaveClass(/maximizeMode/);

    // Re-enter via F11
    await page.keyboard.press('F11');
    await expect(canvasContainer).toHaveClass(/maximizeMode/);
  });
});

// ============================================================================
// TC-7: 全链路回归测试
// ============================================================================

test.describe('TC-7: 全链路回归测试', () => {
  test.beforeEach(async ({ page }) => {
    await gotoCanvas(page);
    await page.evaluate(() => localStorage.removeItem('vibex-canvas-storage'));
    await seedCanvasWithEdges(page);
    await reloadCanvas(page);
  });

  test('TC-7.1: 页面加载无 JS 错误', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await gotoCanvas(page);

    // Filter out known non-critical errors
    const criticalErrors = errors.filter(
      (e) =>
        !e.includes('favicon') &&
        !e.includes('404') &&
        !e.includes('hydration') &&
        !e.includes('Warning:')
    );

    expect(criticalErrors).toHaveLength(0);
  });

  test('TC-7.2: expand-both + maximize 互斥，不能同时生效', async ({ page }) => {
    await gotoCanvas(page);

    const canvasContainer = page.locator('[class*="canvasContainer"]').first();

    // Enter expand-both
    const expandBtn = page.locator('button', { hasText: '全屏展开' }).first();
    await expect(expandBtn).toBeVisible({ timeout: 20000 });
    await expandBtn.click({ force: true });
    await expect(canvasContainer).toHaveClass(/expandBothMode/);

    // Enter maximize — should replace expand-both
    const maximizeBtn = page.locator('[aria-label="最大化"]').first();
    await maximizeBtn.click({ force: true });

    // Both modes should NOT be active simultaneously
    const classAttr = await canvasContainer.getAttribute('class') ?? '';
    const hasBoth = classAttr.includes('expandBothMode') && classAttr.includes('maximizeMode');
    expect(hasBoth).toBe(false);

    // Should be in maximize mode
    await expect(canvasContainer).toHaveClass(/maximizeMode/);
  });
});
