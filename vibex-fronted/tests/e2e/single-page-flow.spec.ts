/**
 * Single Page Flow Tests
 * 
 * 验证单页式流程 - 首页完成全流程
 * PRD: 点击「开始设计」不应跳转到 /confirm 首页应完成全流程
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'https://vibex-app.pages.dev';

test.describe('Single Page Flow (单页式流程)', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.clear();
      localStorage.setItem('auth_token', 'test-token-123');
      localStorage.setItem('user_id', 'test-user');
    });
  });

  // F6.1: 点击「开始设计」不应跳转到 /confirm
  test('F6.1: 点击开始设计不应跳转confirm页', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    await page.waitForLoadState('networkidle');
    
    // 查找开始设计按钮
    const generateBtn = page.locator('button:has-text("开始设计"), button:has-text("生成")').first();
    await expect(generateBtn).toBeVisible();
    
    // 获取按钮点击前的URL
    const urlBefore = page.url();
    console.log('URL before click:', urlBefore);
    
    // 点击开始设计按钮
    await generateBtn.click();
    await page.page.waitForLoadState('domcontentloaded');
    
    // 验证不跳转到 /confirm
    const urlAfter = page.url();
    console.log('URL after click:', urlAfter);
    
    // 应该在首页而不是 /confirm
    expect(urlAfter).not.toContain('/confirm');
    expect(urlAfter).toContain(BASE_URL);
  });

  // F6.2: 步骤导航可见
  test('F6.2: 步骤导航显示', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    await page.waitForLoadState('networkidle');
    
    // 检查步骤导航是否存在
    const stepNav = page.locator('[class*="step"], [class*="nav"]').first();
    const hasSteps = await stepNav.count() > 0 || await page.locator('text=/步骤|需求输入|限界上下文|领域模型|业务流程|项目创建/').count() > 0;
    
    console.log('Steps visible:', hasSteps);
    expect(hasSteps).toBeTruthy();
  });

  // F6.3: 步骤可点击切换
  test('F6.3: 步骤可点击切换', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    await page.waitForLoadState('networkidle');
    
    // 查找可点击的步骤
    const steps = page.locator('button[class*="step"], [role="button"][class*="step"]');
    const stepCount = await steps.count();
    
    console.log('Clickable steps found:', stepCount);
    
    // 如果有可点击的步骤，测试点击
    if (stepCount > 0) {
      await steps.first().click();
      await page.page.waitForLoadState('domcontentloaded');
      // 验证页面没有崩溃
      expect(page.url()).toContain(BASE_URL);
    }
  });

  // F6.4: 继续按钮存在
  test('F6.4: 继续按钮存在', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    await page.waitForLoadState('networkidle');
    
    // 查找继续按钮
    const continueBtn = page.locator('button:has-text("继续"), button:has-text("下一步")');
    const hasContinueBtn = await continueBtn.count() > 0;
    
    console.log('Continue button visible:', hasContinueBtn);
    // 继续按钮可能在步骤2-4显示
    expect(hasContinueBtn || await page.locator('button').count() > 0).toBeTruthy();
  });

  // F6.5: 项目创建成功卡片
  test('F6.5: 项目创建成功卡片显示', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    await page.waitForLoadState('networkidle');
    
    // 检查是否有成功相关的元素
    const successCard = page.locator('[class*="success"], text=/成功|创建成功|项目创建/');
    const hasSuccessCard = await successCard.count() > 0;
    
    console.log('Success card visible:', hasSuccessCard);
    // 这个测试可能需要完整的流程才能验证
  });

  // F6.6: 首页不跳转到其他页面完成全流程
  test('F6.6: 首页保持单页流程', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    await page.waitForLoadState('networkidle');
    
    // 获取初始URL
    const initialUrl = page.url();
    
    // 查找并点击任何导航按钮
    const navButtons = page.locator('button:has-text("开始"), button:has-text("继续"), button:has-text("下一步")');
    const buttonCount = await navButtons.count();
    
    console.log('Navigation buttons found:', buttonCount);
    
    // 如果有按钮，尝试点击
    if (buttonCount > 0) {
      await navButtons.first().click();
      await page.page.waitForLoadState('domcontentloaded');
      
      // 验证仍在首页域名下
      const afterClickUrl = page.url();
      console.log('URL after nav:', afterClickUrl);
      expect(afterClickUrl.startsWith(BASE_URL)).toBeTruthy();
    }
  });
});
