import { test, expect } from '@playwright/test';

test.describe('Vibex E2E Tests', () => {
  test('首页加载', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Vibex/i);
  });

  test('登录功能', async ({ page }) => {
    await page.goto('/auth/');

    // 输入邮箱
    await page.fill(
      'input[type="email"], input[name="email"], input[placeholder*="email"]',
      'y760283407@outlook.com'
    );
    // 输入密码
    await page.fill(
      'input[type="password"], input[name="password"]',
      '12345678'
    );
    // 点击登录按钮
    await page.click(
      'button[type="submit"], button:has-text("登录"), button:has-text("Sign in")'
    );

    // 等待登录成功后跳转
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });

    // 验证登录成功
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('仪表盘页面', async ({ page }) => {
    // 先登录
    await page.goto('/auth/');
    await page.fill(
      'input[type="email"], input[name="email"], input[placeholder*="email"]',
      'y760283407@outlook.com'
    );
    await page.fill(
      'input[type="password"], input[name="password"]',
      '12345678'
    );
    await page.click(
      'button[type="submit"], button:has-text("登录"), button:has-text("Sign in")'
    );
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });

    // 检查仪表盘内容
    await expect(page.locator('h1')).toContainText(
      /我的项目|Dashboard|仪表盘|工作台/i,
      { timeout: 5000 }
    );
  });
});
