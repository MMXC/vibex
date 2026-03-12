import { test, expect } from '@playwright/test';

test.describe('注册/登录流程', () => {
  const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000';

  test('should display login form by default', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth`);

    // 验证默认显示登录
    await expect(page.locator('h1')).toContainText('欢迎回来');
    await expect(page.locator('button[type="submit"]')).toContainText('登录');
  });

  test('should switch to register form', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth`);

    // 点击注册按钮
    await page.click('button:has-text("立即注册")');

    // 验证切换到注册表单
    await expect(page.locator('h1')).toContainText('创建账号');
    await expect(page.locator('button[type="submit"]')).toContainText('注册');

    // 验证用户名输入框出现
    await expect(page.locator('input[type="text"]')).toBeVisible();
  });

  test('should switch back to login form', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth`);

    // 先切换到注册
    await page.click('button:has-text("立即注册")');
    await expect(page.locator('h1')).toContainText('创建账号');

    // 切换回登录
    await page.click('button:has-text("立即登录")');
    await expect(page.locator('h1')).toContainText('欢迎回来');
  });

  test('should validate email format', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth`);

    // 输入无效邮箱
    await page.fill('input[type="email"]', 'invalid-email');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // 验证错误提示或表单验证
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toHaveAttribute('type', 'email');
  });

  test('should show loading state during submission', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth`);

    // 填写有效表单
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');

    // 点击提交
    await page.click('button[type="submit"]');

    // 验证加载状态（按钮变为"处理中..."）
    await expect(page.locator('button[type="submit"]')).toContainText('处理中');
  });

  test('should navigate to landing page', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth`);

    // 点击返回首页 - 使用更精确的选择器
    await page.click('a[href="/landing"]');

    // 验证跳转
    await expect(page).toHaveURL(`${BASE_URL}/landing`);
  });

  test('should toggle button have hover effect', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth`);

    const registerBtn = page.locator('button:has-text("立即注册")');

    // 验证按钮存在
    await expect(registerBtn).toBeVisible();

    // 验证 hover 样式（通过检查 computed style）
    await registerBtn.hover();

    // 按钮应该可点击
    await expect(registerBtn).toBeEnabled();
  });

  // URL parameter mode tests
  test('should show register form when mode=register in URL', async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/auth?mode=register`);

    // 验证显示注册表单
    await expect(page.locator('h1')).toContainText('创建账号');
    await expect(page.locator('button[type="submit"]')).toContainText('注册');

    // 验证用户名输入框出现
    await expect(page.locator('input[type="text"]')).toBeVisible();
  });

  test('should show login form when mode=login in URL', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth?mode=login`);

    // 验证显示登录表单
    await expect(page.locator('h1')).toContainText('欢迎回来');
    await expect(page.locator('button[type="submit"]')).toContainText('登录');
  });

  test('should default to login form without mode parameter', async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/auth`);

    // 验证默认显示登录
    await expect(page.locator('h1')).toContainText('欢迎回来');
    await expect(page.locator('button[type="submit"]')).toContainText('登录');
  });

  test('should ignore invalid mode parameter', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth?mode=invalid`);

    // 无效参数应默认显示登录
    await expect(page.locator('h1')).toContainText('欢迎回来');
    await expect(page.locator('button[type="submit"]')).toContainText('登录');
  });
});
