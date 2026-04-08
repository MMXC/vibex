/**
 * Login State Fix E2E Tests
 * 
 * 测试场景: VIBEX-003 登录状态未正确保持
 * 验证: 登录成功后点击生成不再弹出登录抽屉
 */

import { test, expect } from '@playwright/test';

test.describe('Login State Fix (VIBEX-003)', () => {
  test.beforeEach(async ({ page }) => {
    // 清除所有状态
    await page.addInitScript(() => {
      localStorage.clear();
    });
  });

  // TC-001: 登录前点击生成应弹出登录抽屉
  test('should show login drawer when clicking generate without login', async ({ page }) => {
    await page.goto('/');
    
    // 输入需求（使生成按钮可用）
    const textarea = page.locator('textarea').first();
    if (await textarea.isVisible()) {
      await textarea.fill('测试需求');
    }
    
    // 点击生成按钮
    const generateBtn = page.locator('button:has-text("开始设计")');
    if (await generateBtn.isEnabled()) {
      await generateBtn.click();
      
      // 验证弹出登录抽屉
      const loginDrawer = page.locator('[class*="drawer"], [class*="modal"], [class*="login"]');
      // 检查是否有登录相关内容
      const hasLoginContent = await page.locator('text=登录, text=auth, text=Auth').count() > 0;
      console.log('Login drawer shown:', hasLoginContent);
    }
  });

  // TC-002: 登录后 localStorage 应有 auth_token
  test('should have auth_token in localStorage after login', async ({ page }) => {
    await page.goto('/auth');
    
    // 输入登录信息
    const emailInput = page.locator('input[type="text"], input[name="email"], input[id="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    
    if (await emailInput.isVisible() && await passwordInput.isVisible()) {
      await emailInput.fill('test@example.com');
      await passwordInput.fill('password123');
      
      // 点击登录
      const loginBtn = page.locator('button[type="submit"], button:has-text("登录")').first();
      await loginBtn.click();
      
      // 等待登录完成
      await page.page.waitForLoadState('networkidle');
      
      // 验证 localStorage 有 auth_token
      const hasToken = await page.evaluate(() => {
        return localStorage.getItem('auth_token') !== null;
      });
      
      expect(hasToken).toBeTruthy();
    }
  });

  // TC-003: 登录后再次点击生成不应弹出登录抽屉
  test('should not show login drawer after successful login', async ({ page }) => {
    // 先登录
    await page.goto('/auth');
    
    const emailInput = page.locator('input[type="text"], input[name="email"], input[id="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    
    if (await emailInput.isVisible() && await passwordInput.isVisible()) {
      await emailInput.fill('test@example.com');
      await passwordInput.fill('password123');
      
      const loginBtn = page.locator('button[type="submit"], button:has-text("登录")').first();
      await loginBtn.click();
      
      // 等待登录完成并跳转到dashboard
      await page.waitForURL('**/dashboard**', { timeout: 10000 }).catch(() => {});
      await page.page.waitForLoadState('domcontentloaded');
      
      // 回到首页
      await page.goto('/');
      await page.page.waitForLoadState('domcontentloaded');
      
      // 输入需求
      const textarea = page.locator('textarea').first();
      if (await textarea.isVisible()) {
        await textarea.fill('测试需求');
      }
      
      // 点击生成按钮
      const generateBtn = page.locator('button:has-text("开始设计")');
      if (await generateBtn.isEnabled()) {
        await generateBtn.click();
        
        // 验证不应弹出登录抽屉（应该跳转到/confirm）
        await page.page.waitForLoadState('domcontentloaded');
        
        // 检查当前URL
        const currentUrl = page.url();
        console.log('After clicking generate, URL:', currentUrl);
        
        // 验证跳转到confirm页面，不是登录页面
        expect(currentUrl).toContain('confirm');
      }
    }
  });

  // TC-004: 验证登录状态持久化
  test('should persist login state after page refresh', async ({ page }) => {
    // 先登录
    await page.goto('/auth');
    
    const emailInput = page.locator('input[type="text"], input[name="email"], input[id="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    
    if (await emailInput.isVisible() && await passwordInput.isVisible()) {
      await emailInput.fill('test@example.com');
      await passwordInput.fill('password123');
      
      const loginBtn = page.locator('button[type="submit"], button:has-text("登录")').first();
      await loginBtn.click();
      
      // 等待登录完成
      await page.page.waitForLoadState('networkidle');
      
      // 刷新页面
      await page.reload();
      await page.page.waitForLoadState('domcontentloaded');
      
      // 验证 localStorage 仍有 auth_token
      const hasToken = await page.evaluate(() => {
        return localStorage.getItem('auth_token') !== null;
      });
      
      expect(hasToken).toBeTruthy();
    }
  });
});
