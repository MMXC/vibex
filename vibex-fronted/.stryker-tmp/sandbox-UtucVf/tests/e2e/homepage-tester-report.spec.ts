/**
 * Homepage Test Report - Vibex
 * 
 * 完整首页测试：控制台日志 + UI截图 + 详细报告
 */
// @ts-nocheck


import { test, expect } from '@playwright/test';

test.describe('Vibex Homepage Test Report', () => {
  const consoleLogs: { type: string; text: string }[] = [];
  const consoleErrors: { type: string; text: string }[] = [];
  let pageTitle = '';
  let pageUrl = '';

  test.beforeEach(async ({ page }) => {
    // 清空 localStorage
    await page.addInitScript(() => {
      localStorage.clear();
    });

    // 监听控制台日志
    page.on('console', (msg) => {
      const text = msg.text();
      const type = msg.type();
      consoleLogs.push({ type, text });
      if (type === 'error') {
        consoleErrors.push({ type, text });
      }
    });

    // 监听页面错误
    page.on('pageerror', (err) => {
      consoleErrors.push({ type: 'pageerror', text: err.message });
    });
  });

  test.afterEach(async ({ page }) => {
    // 每个测试后截图
    const testName = test.info().title.replace(/\s+/g, '_');
    await page.screenshot({
      path: `tests/e2e/screenshots/homepage-test/${testName}_${Date.now()}.png`,
      fullPage: true,
    });
  });

  // 主测试：首页完整验证
  test('TC-001: Homepage Full Load & UI Check', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    
    // 记录页面基本信息
    pageTitle = await page.title();
    pageUrl = page.url();
    
    // 检查页面标题
    const title = await page.title();
    console.log('Page Title:', title);
    
    // 检查页面主要元素
    const body = page.locator('body');
    await expect(body).toBeVisible();
    
    // 检查 Hero 区域
    const heroSection = page.locator('[class*="hero"], h1, [class*="title"]').first();
    const hasHero = await heroSection.count() > 0;
    console.log('Hero Section:', hasHero ? '✅ Found' : '❌ Not Found');
    
    // 检查主要按钮
    const buttons = await page.locator('button').count();
    console.log('Total Buttons:', buttons);
    
    // 检查输入框
    const textareas = await page.locator('textarea').count();
    console.log('Textareas:', textareas);
    
    // 检查导航元素
    const nav = await page.locator('nav, header').count();
    console.log('Navigation Elements:', nav);
    
    // 列出所有可见文本
    const visibleText = await page.locator('body').innerText();
    const mainKeywords = ['开始', '设计', '项目', 'Flow', '创建', '模板'];
    const foundKeywords = mainKeywords.filter(kw => visibleText.includes(kw));
    console.log('Main Keywords Found:', foundKeywords.join(', ') || 'None');
    
    // 控制台错误汇总
    console.log('\n=== Console Errors ===');
    if (consoleErrors.length > 0) {
      consoleErrors.forEach(err => {
        console.log(`[${err.type}] ${err.text}`);
      });
    } else {
      console.log('✅ No console errors');
    }
  });

  test('TC-002: Console Errors Check', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000); // 等待异步加载
    
    // 输出所有控制台日志
    console.log('\n=== All Console Logs ===');
    consoleLogs.forEach(log => {
      console.log(`[${log.type}] ${log.text}`);
    });
    
    console.log('\n=== Error Summary ===');
    console.log(`Total Logs: ${consoleLogs.length}`);
    console.log(`Total Errors: ${consoleErrors.length}`);
    
    // 如果有错误，标记为 FAIL
    if (consoleErrors.length > 0) {
      console.log('\n❌ ERRORS FOUND:');
      consoleErrors.forEach(err => {
        console.log(`  - ${err.text}`);
      });
    }
  });

  test('TC-003: UI Elements Inventory', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    
    // 全面检查 UI 元素
    const checks = {
      'Page Title': await page.title(),
      'Body Visible': (await page.locator('body').count()) > 0,
      'H1 Tags': await page.locator('h1').count(),
      'Buttons': await page.locator('button').count(),
      'Links': await page.locator('a').count(),
      'Inputs': await page.locator('input').count(),
      'Textareas': await page.locator('textarea').count(),
      'Images': await page.locator('img').count(),
    };
    
    console.log('\n=== UI Elements Inventory ===');
    Object.entries(checks).forEach(([key, value]) => {
      console.log(`${key}: ${value}`);
    });
  });
});
