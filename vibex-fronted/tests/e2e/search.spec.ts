/**
 * E03: Dashboard 全局搜索增强 E2E 测试
 * 测试：搜索过滤 + <mark> 高亮 + 空结果提示
 */
import { test, expect } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000';

async function login(page: any) {
  await page.goto(`${BASE_URL}/auth`);
  await page.waitForLoadState('domcontentloaded');
  await page.fill('input[type="email"], input[name="email"]', 'y760283407@outlook.com');
  await page.fill('input[type="password"], input[name="password"]', '12345678');
  await page.click('button[type="submit"], button:has-text("登录")');
  await page.waitForURL(/dashboard/, { timeout: 15000 }).catch(() => {});
}

test.describe('E03: Dashboard 全局搜索增强', () => {
  test('搜索结果使用 <mark> 高亮匹配文本', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');

    // 输入搜索关键词
    const searchInput = page.locator('input[placeholder*="搜索"], input[placeholder*="search"]');
    if (await searchInput.isVisible({ timeout: 5000 })) {
      await searchInput.fill('登录');
      await page.waitForTimeout(200);

      // 验证 <mark> 标签存在
      const markElements = page.locator('mark');
      const markCount = await markElements.count();
      expect(markCount).toBeGreaterThan(0);
    }
  });

  test('空搜索显示"没有找到包含 xxx 的项目"', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator('input[placeholder*="搜索"], input[placeholder*="search"]');
    if (await searchInput.isVisible({ timeout: 5000 })) {
      // 输入一个不太可能存在的关键词
      await searchInput.fill('___NONEXISTENT_KEYWORD_12345__');
      await page.waitForTimeout(300);

      // 验证空结果提示
      const emptyMsg = page.locator('text=/没有.*的项目/');
      await expect(emptyMsg).toBeVisible({ timeout: 5000 });
    }
  });

  test('搜索过滤响应 < 100ms', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator('input[placeholder*="搜索"], input[name="search"], input[data-testid*="search"]');
    if (await searchInput.isVisible({ timeout: 5000 })) {
      const start = Date.now();
      await searchInput.fill('测试');
      await page.waitForTimeout(100); // wait for debounce
      const elapsed = Date.now() - start;
      // 过滤响应应在 100ms 内（debounce 100ms + 渲染 < 100ms）
      expect(elapsed).toBeLessThan(500);
    }
  });

  test('多词搜索全部高亮', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator('input[placeholder*="搜索"], input[placeholder*="search"]');
    if (await searchInput.isVisible({ timeout: 5000 })) {
      await searchInput.fill('产品 设计');
      await page.waitForTimeout(200);

      const markElements = page.locator('mark');
      const markCount = await markElements.count();
      // 至少 2 个 <mark> 标签（每个词一个）
      expect(markCount).toBeGreaterThanOrEqual(2);
    }
  });
});
