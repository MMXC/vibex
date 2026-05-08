/**
 * ProtoPreview 实时联动 E2E 测试 — E01 F2.1
 *
 * 覆盖场景：
 * 1. 无选中节点 → 显示 placeholder
 * 2. 选中节点 → 显示 preview 内容
 * 3. 取消选中 → 返回 placeholder
 *
 * Run: pnpm test:e2e -- tests/e2e/protopreview-realtime.spec.ts
 */

import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const PROTOTYPE_URL = `${BASE_URL}/prototype`;

async function goToPrototype(page: Page) {
  await page.goto(PROTOTYPE_URL);
  await page.waitForLoadState('domcontentloaded');

  // Skip onboarding if present
  const skipBtn = page
    .locator('button:has-text("跳过"), button:has-text("Skip"), button:has-text("Got it")')
    .first();
  if (await skipBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await skipBtn.click();
    await page.waitForLoadState('networkidle');
  }
}

async function loadExampleData(page: Page) {
  const loadBtn = page
    .locator('button:has-text("加载示例"), button:has-text("Load Example"), button:has-text("示例数据")')
    .first();
  if (await loadBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await loadBtn.click();
    await page.waitForLoadState('networkidle').catch(() => {});
  }
}

test.describe('ProtoPreview 实时联动', () => {
  test.beforeEach(async ({ page }) => {
    await goToPrototype(page);
    await loadExampleData(page);
  });

  test('无选中节点时显示 placeholder', async ({ page }) => {
    // 场景 1: 页面加载后无选中 → placeholder
    const placeholder = page.locator('[data-testid="proto-preview-placeholder"]');
    await expect(placeholder).toBeVisible({ timeout: 10000 });
  });

  test('选中节点后 ProtoPreview 显示内容', async ({ page }) => {
    // 场景 2: 选中一个节点 → proto-preview 显示
    const canvasNode = page.locator('.react-flow__node').first();
    const nodeCount = await canvasNode.count();

    if (nodeCount === 0) {
      test.skip();
      return;
    }

    await canvasNode.click();

    // 选中后 proto-preview 应该可见
    const preview = page.locator('[data-testid="proto-preview"]');
    await expect(preview).toBeVisible({ timeout: 5000 });

    // placeholder 应该消失
    const placeholder = page.locator('[data-testid="proto-preview-placeholder"]');
    await expect(placeholder).not.toBeVisible();
  });

  test('取消选中后返回 placeholder', async ({ page }) => {
    // 场景 3: 选中后取消 → placeholder 恢复
    const canvasNode = page.locator('.react-flow__node').first();
    const nodeCount = await canvasNode.count();

    if (nodeCount === 0) {
      test.skip();
      return;
    }

    await canvasNode.click();

    // 选中后 proto-preview 可见
    const preview = page.locator('[data-testid="proto-preview"]');
    await expect(preview).toBeVisible({ timeout: 5000 });

    // 点击空白区域取消选择
    const reactFlow = page.locator('.react-flow__viewport');
    await reactFlow.click({ position: { x: 10, y: 10 } });

    // placeholder 应该重新出现
    const placeholder = page.locator('[data-testid="proto-preview-placeholder"]');
    await expect(placeholder).toBeVisible({ timeout: 3000 });
  });
});
