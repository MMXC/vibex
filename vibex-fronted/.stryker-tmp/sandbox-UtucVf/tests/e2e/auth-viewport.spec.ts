// @ts-nocheck
import { test, expect } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL || 'https://vibex-app.pages.dev';

// 多视口测试
const viewports = [
  { name: 'mobile', width: 375, height: 667 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1920, height: 1080 },
];

for (const viewport of viewports) {
  test.describe(`Auth页面 - ${viewport.name} (${viewport.width}px)`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test(`登录表单 - ${viewport.name}`, async ({ page }) => {
      await page.goto(`${BASE_URL}/auth`);

      // 截图：准备阶段
      await page.screenshot({
        path: `tests/e2e/screenshots/auth-login-${viewport.name}.png`,
        fullPage: true,
      });

      // 验证标题
      await expect(page.locator('h1')).toContainText('欢迎回来');
    });

    test(`注册表单 - ${viewport.name}`, async ({ page }) => {
      await page.goto(`${BASE_URL}/auth`);

      // 点击切换到注册
      await page.click('button:has-text("立即注册")');
      await page.waitForLoadState('networkidle');

      // 截图：结果
      await page.screenshot({
        path: `tests/e2e/screenshots/auth-register-${viewport.name}.png`,
        fullPage: true,
      });

      // 验证标题
      await expect(page.locator('h1')).toContainText('创建账号');
    });

    test(`Hover效果验证 - ${viewport.name}`, async ({ page }) => {
      await page.goto(`${BASE_URL}/auth`);

      const registerBtn = page.locator('button:has-text("立即注册")');
      await expect(registerBtn).toBeVisible();

      // Hover
      await registerBtn.hover();
      await page.waitForLoadState('networkidle');

      // 截图：Hover状态
      await page.screenshot({
        path: `tests/e2e/screenshots/auth-hover-${viewport.name}.png`,
        fullPage: true,
      });
    });
  });
}
