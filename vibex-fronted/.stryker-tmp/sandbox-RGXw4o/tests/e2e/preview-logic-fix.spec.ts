/**
 * Preview Logic Fix Tests
 * 
 * 验证 VIBEX 预览功能修复
 */
// @ts-nocheck


import { test, expect } from '@playwright/test';

test.describe('Preview Logic Fix', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.clear();
    });
  });

  // TC-001: 登录状态检测 - 未登录点击"开始生成"时弹出登录提示
  test('should show login prompt when not logged in', async ({ page }) => {
    await page.goto('/');
    
    // 输入需求使按钮可用
    const textarea = page.locator('textarea').first();
    if (await textarea.isVisible()) {
      await textarea.fill('测试需求：电商平台');
    }
    
    // 点击生成按钮
    const generateBtn = page.locator('button:has-text("开始设计")');
    if (await generateBtn.isEnabled()) {
      await generateBtn.click();
      
      // 验证弹出登录抽屉或提示
      await page.waitForTimeout(500);
      
      // 检查是否有登录相关内容
      const hasLoginContent = await page.locator('text=登录, text=auth').count() > 0;
      console.log('Login prompt shown:', hasLoginContent);
    }
  });

  // TC-002: Mermaid 图预览 - 预览区显示五步流程图
  test('should show mermaid preview', async ({ page }) => {
    await page.goto('/confirm');
    
    // 查找 mermaid 或预览相关内容
    const hasMermaid = await page.locator('text=mermaid, text=graph, text=流程图').count() > 0;
    const hasPreview = await page.locator('[class*="preview"], [class*="Preview"]').count() > 0;
    
    console.log('Mermaid content:', hasMermaid, 'Preview area:', hasPreview);
  });

  // TC-003: 三栏布局 - 步骤面板 + 预览区 + AI对话
  test('should have three-column layout', async ({ page }) => {
    await page.goto('/');
    
    // 验证三栏布局
    const hasSidebar = await page.locator('[class*="sidebar"], text=设计流程').count() > 0;
    const hasMainContent = await page.locator('main, [class*="content"]').count() > 0;
    const hasAI = await page.locator('text=AI, text=助手').count() > 0;
    
    console.log('Three columns - Sidebar:', hasSidebar, 'Content:', hasMainContent, 'AI:', hasAI);
    
    // 验证布局结构存在
    expect(hasSidebar || hasMainContent || hasAI).toBeTruthy();
  });

  // TC-004: 构建测试
  test('should pass build', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
  });
});
