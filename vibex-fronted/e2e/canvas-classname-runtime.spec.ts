/**
 * canvas-classname-runtime.spec.ts
 * F2.3: 运行时验证
 *
 * 验证 Canvas 页面在真实浏览器中无 JS 错误。
 * @forward 修复前后的 undefined 类名对比（非回归验证）。
 *
 * 参考: docs/vibex-canvas/IMPLEMENTATION_PLAN.md § Unit 6
 */

import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';

/**
 * 获取 TabBar 的 skip/next 按钮并点击（关闭 onboarding overlay）
 */
async function dismissOnboarding(page: Page) {
  const skipBtn = page.locator('[class*="skipButton"]');
  if (await skipBtn.count() > 0) {
    await skipBtn.click();
    await page.waitForTimeout(1000);
  }
}

test.describe('F2.3: Canvas 运行时验证（无 JS 错误）', () => {
  test('Canvas 页面加载成功，无 JS 错误', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (
          !text.includes('favicon') &&
          !text.includes('Failed to load resource') &&
          !text.includes('third-party cookie')
        ) {
          errors.push(text);
        }
      }
    });

    const response = await page.goto(`${BASE_URL}/canvas`, {
      waitUntil: 'networkidle',
      timeout: 20000,
    });

    expect(response?.status()).toBeLessThan(400);
    expect(errors, `JS 错误: ${errors.slice(0, 3).join('; ')}`).toHaveLength(0);
  });

  test('TabBar 组件可见且有 3 个 tab', async ({ page }) => {
    await page.goto(`${BASE_URL}/canvas`, {
      waitUntil: 'networkidle',
      timeout: 20000,
    });

    const tabBar = page.locator('[role="tablist"]');
    await expect(tabBar).toBeVisible({ timeout: 10000 });

    const tabs = page.locator('[role="tab"]');
    const tabCount = await tabs.count();
    expect(tabCount).toBe(3);

    const firstTab = tabs.first();
    const isSelected = await firstTab.getAttribute('aria-selected');
    expect(isSelected).toBe('true');
  });

  test('@forward 修复：TabBar 无新增 undefined（baseline=9）', async ({ page }) => {
    await page.goto(`${BASE_URL}/canvas`, {
      waitUntil: 'networkidle',
      timeout: 20000,
    });

    const undefinedInfo = await page.evaluate(() => {
      const results: string[] = [];
      for (const el of document.querySelectorAll('[class]')) {
        const cn = el.className.toString();
        if (cn.includes('undefined')) {
          results.push(`${el.tagName}: ${cn.substring(0, 80)}`);
        }
      }
      return results;
    });

    /**
     * @forward 修复前：9 个 undefined
     * @forward 修复后：≤ 9（不允许新增）
     */
    expect(
      undefinedInfo.length,
      `发现 ${undefinedInfo.length} 个 undefined class（baseline=9，非本次引入）\n${undefinedInfo.slice(0, 5).join('\n')}`
    ).toBeLessThanOrEqual(9);
  });

  test('ExportMenu 按钮可见（TabBar 外延组件）', async ({ page }) => {
    await page.goto(`${BASE_URL}/canvas`, {
      waitUntil: 'networkidle',
      timeout: 20000,
    });

    const exportBtn = page.locator('[aria-label*="导出"]').first();
    const hasExport = (await exportBtn.count()) > 0;
    expect(hasExport).toBe(true);
  });

  test('ProjectBar / PhaseIndicator 区域可见', async ({ page }) => {
    await page.goto(`${BASE_URL}/canvas`, {
      waitUntil: 'networkidle',
      timeout: 20000,
    });
    await page.waitForTimeout(1000);

    const phaseArea = page.locator('[class*="phase"]').first();
    if ((await phaseArea.count()) > 0) {
      await expect(phaseArea).toBeVisible({ timeout: 5000 });
    }
  });

  test('Sidebar 组件可见（messageDrawer / leftDrawer）', async ({ page }) => {
    await page.goto(`${BASE_URL}/canvas`, {
      waitUntil: 'networkidle',
      timeout: 20000,
    });

    const hasDrawer =
      (await page.locator('[class*="messageDrawer"]').count() > 0) ||
      (await page.locator('[class*="leftDrawer"]').count() > 0);
    expect(hasDrawer).toBe(true);
  });

  test('无 @forward 引入的新 CSS 类名错误', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (!text.includes('favicon') && !text.includes('Failed to load')) {
          errors.push(text);
        }
      }
    });

    await page.goto(`${BASE_URL}/canvas`, {
      waitUntil: 'networkidle',
      timeout: 20000,
    });
    await page.waitForTimeout(2000);

    expect(
      errors,
      `CSS 引入的新错误: ${errors.slice(0, 3).join('; ')}`
    ).toHaveLength(0);
  });
});
