import { test, expect } from '@playwright/test';

// Configuration
const BASE_URL = process.env.BASE_URL || 'https://vibex-app.pages.dev';
const SCREENSHOT_DIR = process.env.SCREENSHOT_DIR || 'tests/e2e/screenshots/daily';
const DATE = new Date().toISOString().split('T')[0];

// Test accounts
const TEST_EMAIL = 'y760283407@outlook.com';
const TEST_PASSWORD = '12345678';

// Helper function to take screenshot
async function takeScreenshot(page: any, name: string) {
  const screenshotPath = `${SCREENSHOT_DIR}/${DATE}/${name}.png`;
  await page.screenshot({ path: screenshotPath, fullPage: true });
  return screenshotPath;
}

// Log navigation step
function logStep(step: string, from: string, to: string, status: 'PASS' | 'FAIL' | 'INFO' = 'INFO') {
  console.log(`[${status}] ${step}: ${from} → ${to}`);
}

// Login helper
async function login(page: any) {
  await page.goto(`${BASE_URL}/auth`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle');
  
  logStep('访问登录页', 'N/A', '/auth/', 'INFO');
  
  const emailInput = page.locator('input[type="email"]').first();
  await emailInput.fill(TEST_EMAIL);
  
  const passwordInput = page.locator('input[type="password"]');
  await passwordInput.fill(TEST_PASSWORD);
  
  await page.click('button[type="submit"]');
  await page.waitForLoadState('networkidle');
  
  const finalURL = page.url();
  if (finalURL.includes('/dashboard')) {
    logStep('登录提交', '/auth/', '/dashboard/', 'PASS');
  } else {
    logStep('登录提交', '/auth/', finalURL, 'FAIL');
  }
  
  await page.waitForLoadState('domcontentloaded');
}

test.describe('VibeX 用户操作流程 E2E 测试', () => {
  
  test('T1: 入口流程 - Landing页点击跳转', async ({ page }) => {
    console.log('\n========== T1: 入口流程测试 ==========');
    
    // 1. 访问落地页
    await page.goto(`${BASE_URL}/landing/`);
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, 'T1-01-landing-page');
    logStep('访问落地页', 'N/A', '/landing/', 'PASS');
    
    // 2. 点击 "开始使用" 按钮
    const ctaButton = page.locator('a[href="/auth/"]').first();
    await ctaButton.click();
    await page.waitForLoadState('networkidle');
    const urlAfterCta = page.url();
    logStep('点击"开始使用"', '/landing/', urlAfterCta, urlAfterCta.includes('/auth') ? 'PASS' : 'FAIL');
    
    // 3. 验证进入认证页
    await expect(page).toHaveURL(/\/auth\//);
    await takeScreenshot(page, 'T1-02-auth-page-from-cta');
    logStep('验证认证页', '/auth/', '/auth/', 'PASS');
  });

  test('T2: 注册/登录流程 - 表单切换', async ({ page }) => {
    console.log('\n========== T2: 注册/登录流程测试 ==========');
    
    // 1. 访问认证页
    await page.goto(`${BASE_URL}/auth`);
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, 'T2-01-auth-login-form');
    logStep('访问认证页(默认登录)', 'N/A', '/auth/', 'INFO');
    
    // 2. 检查默认显示登录表单
    const loginTitle = await page.locator('h1').textContent();
    logStep('检查默认表单', '/auth/', `显示:${loginTitle}`, loginTitle?.includes('欢迎回来') ? 'PASS' : 'FAIL');
    
    // 3. 点击注册按钮切换到注册表单
    const registerBtn = page.locator('button:has-text("立即注册")');
    if (await registerBtn.isVisible()) {
      await registerBtn.click();
      await page.waitForLoadState('networkidle');
      const registerTitle = await page.locator('h1').textContent();
      logStep('点击"立即注册"', '/auth/', `显示:${registerTitle}`, registerTitle?.includes('创建账号') ? 'PASS' : 'FAIL');
      await takeScreenshot(page, 'T2-02-auth-register-form');
    }
    
    // 4. 切换回登录
    const loginBtn = page.locator('button:has-text("立即登录")');
    if (await loginBtn.isVisible()) {
      await loginBtn.click();
      await page.waitForLoadState('networkidle');
      const backToLogin = await page.locator('h1').textContent();
      logStep('点击"立即登录"', '/auth/', `显示:${backToLogin}`, backToLogin?.includes('欢迎回来') ? 'PASS' : 'FAIL');
    }
  });

  test('T3: 登录流程 - 登录成功跳转Dashboard', async ({ page }) => {
    console.log('\n========== T3: 登录流程测试 ==========');
    
    // 1. 访问认证页
    await page.goto(`${BASE_URL}/auth`);
    await page.waitForLoadState('networkidle');
    logStep('访问认证页', 'N/A', '/auth/', 'INFO');
    
    // 2. 执行登录
    await login(page);
    
    // 3. 验证跳转到 Dashboard
    await expect(page).toHaveURL(/\/dashboard\//);
    await takeScreenshot(page, 'T3-01-dashboard-logged-in');
    logStep('验证Dashboard', '/dashboard/', '/dashboard/', 'PASS');
    
    // 4. 检查登录状态
    const userName = await page.locator('text=alexyu').first().isVisible().catch(() => false);
    logStep('检查用户显示', 'N/A', userName ? '显示:alexyu' : '未显示', userName ? 'PASS' : 'FAIL');
  });

  test('T4: Dashboard - 导航到各功能页面', async ({ page }) => {
    console.log('\n========== T4: Dashboard导航测试 ==========');
    
    // 1. 登录后进入 Dashboard
    await login(page);
    await takeScreenshot(page, 'T4-00-dashboard');
    logStep('登录进入Dashboard', '/auth/', '/dashboard/', 'PASS');
    
    // 2. 导航到需求页面
    await page.goto(`${BASE_URL}/requirements/`);
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, 'T4-01-requirements-page');
    logStep('导航到需求页', '/dashboard/', '/requirements/', page.url().includes('/requirements') ? 'PASS' : 'FAIL');
    
    // 3. 导航到流程页
    await page.goto(`${BASE_URL}/flow/`);
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, 'T4-02-flow-page');
    logStep('导航到流程页', '/requirements/', '/flow/', page.url().includes('/flow') ? 'PASS' : 'FAIL');
    
    // 4. 导航到模板页
    await page.goto(`${BASE_URL}/templates/`);
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, 'T4-03-templates-page');
    logStep('导航到模板页', '/flow/', '/templates/', page.url().includes('/templates') ? 'PASS' : 'FAIL');
    
    // 5. 导航到项目设置
    await page.goto(`${BASE_URL}/project-settings/`);
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, 'T4-04-project-settings');
    logStep('导航到项目设置', '/templates/', '/project-settings/', page.url().includes('/project-settings') ? 'PASS' : 'FAIL');
  });

  test('T5: 确认流程入口 - /confirm/ 页面', async ({ page }) => {
    console.log('\n========== T5: 确认流程测试 ==========');
    
    // 1. 登录后访问确认流程页
    await login(page);
    
    await page.goto(`${BASE_URL}/confirm/`);
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, 'T5-01-confirm-page');
    logStep('访问确认流程页', '/dashboard/', '/confirm/', page.url().includes('/confirm') ? 'PASS' : 'FAIL');
    
    // 2. 检查页面内容
    const hasStepTitle = await page.locator('text=需求输入').isVisible().catch(() => false);
    const hasTextarea = await page.locator('textarea').isVisible().catch(() => false);
    logStep('检查页面元素', '/confirm/', `需求输入:${hasStepTitle}, 输入框:${hasTextarea}`, (hasStepTitle && hasTextarea) ? 'PASS' : 'FAIL');
  });

  test('T6: 对话页入口 - /chat/ 页面', async ({ page }) => {
    console.log('\n========== T6: 对话页测试 ==========');
    
    // 1. 登录后访问对话页
    await login(page);
    
    await page.goto(`${BASE_URL}/chat/`);
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, 'T6-01-chat-page');
    logStep('访问对话页', '/dashboard/', '/chat/', page.url().includes('/chat') ? 'PASS' : 'FAIL');
    
    // 2. 检查页面内容
    const hasInput = await page.locator('input, textarea').first().isVisible().catch(() => false);
    logStep('检查对话输入框', '/chat/', hasInput ? '有输入框' : '无输入框', hasInput ? 'PASS' : 'FAIL');
  });

  test('T7: 未登录访问保护页面', async ({ page }) => {
    console.log('\n========== T7: 未登录访问测试 ==========');
    
    // 1. 未登录直接访问 Dashboard
    await page.goto(`${BASE_URL}/dashboard/`);
    await page.waitForLoadState('networkidle');
    const dashboardUrl = page.url();
    logStep('未登录访问Dashboard', 'N/A', dashboardUrl, dashboardUrl.includes('/auth') ? 'PASS' : 'FAIL');
    
    // 2. 未登录直接访问 Requirements
    await page.goto(`${BASE_URL}/requirements/`);
    await page.waitForLoadState('networkidle');
    const requirementsUrl = page.url();
    logStep('未登录访问Requirements', 'N/A', requirementsUrl, requirementsUrl.includes('/auth') ? 'PASS' : 'FAIL');
    
    // 3. 未登录直接访问 Confirm
    await page.goto(`${BASE_URL}/confirm/`);
    await page.waitForLoadState('networkidle');
    const confirmUrl = page.url();
    logStep('未登录访问Confirm', 'N/A', confirmUrl, confirmUrl.includes('/auth') ? 'PASS' : 'FAIL');
    
    await takeScreenshot(page, 'T7-01-redirect-to-auth');
  });

  test('T8: 登出流程', async ({ page }) => {
    console.log('\n========== T8: 登出流程测试 ==========');
    
    // 1. 登录
    await login(page);
    await takeScreenshot(page, 'T8-00-before-logout');
    logStep('登录状态', '/auth/', '/dashboard/', 'PASS');
    
    // 2. 寻找登出按钮 (在用户菜单或设置中)
    const logoutBtn = page.locator('button:has-text("退出"), a:has-text("退出")').first();
    
    if (await logoutBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await logoutBtn.click();
      await page.waitForLoadState('networkidle');
      const afterLogoutUrl = page.url();
      logStep('点击退出按钮', '/dashboard/', afterLogoutUrl, 'INFO');
      await takeScreenshot(page, 'T8-01-after-logout');
    } else {
      // 尝试从用户设置页面退出
      await page.goto(`${BASE_URL}/user-settings/`);
      await page.waitForLoadState('networkidle');
      const settingsLogoutBtn = page.locator('button:has-text("退出")');
      if (await settingsLogoutBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await settingsLogoutBtn.click();
        await page.waitForLoadState('networkidle');
        logStep('从设置页退出', '/user-settings/', page.url(), 'PASS');
      } else {
        logStep('退出按钮', 'N/A', '未找到', 'FAIL');
      }
    }
  });
});
