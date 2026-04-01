/**
 * 业务流程分析测试 - Vibex
 * 
 * 核心流程：
 * 1. 需求录入 → 在文本框输入需求
 * 2. 选择模式 → PLAN 或 BUILD
 * 3. 点击分析 → 业务流程分析
 * 4. 监控过程 → 记录组件渲染状态 + 控制台 + API 请求响应
 */

import { test, expect } from '@playwright/test';

test.describe('Vibex 业务流程分析测试', () => {
  const consoleLogs: { type: string; text: string }[] = [];
  const consoleErrors: { type: string; text: string }[] = [];
  const apiRequests: { url: string; status: number; response?: string }[] = [];

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

    // 监听网络请求
    page.on('response', async (response) => {
      const url = response.url();
      const status = response.status();
      try {
        const body = await response.text();
        apiRequests.push({ url, status, response: body.substring(0, 500) });
      } catch {
        apiRequests.push({ url, status });
      }
    });
  });

  test.afterEach(async ({ page }) => {
    const testName = test.info().title.replace(/\s+/g, '_');
    await page.screenshot({
      path: `tests/e2e/screenshots/business-flow/${testName}_${Date.now()}.png`,
      fullPage: true,
    });
  });

  // TC-001: 首页结构检查
  test('TC-001: 首页结构检查', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    // 检查页面标题
    const title = await page.title();
    console.log('Page Title:', title);

    // 检查主要元素
    const textarea = page.locator('textarea').first();
    const hasTextarea = await textarea.count() > 0;
    console.log('需求录入框:', hasTextarea ? '✅ 存在' : '❌ 不存在');

    if (hasTextarea) {
      const placeholder = await textarea.getAttribute('placeholder');
      console.log('输入框 placeholder:', placeholder || '无');
    }

    // 检查 PLAN/BUILD 模式选择
    const planBtn = page.locator('button:has-text("PLAN"), [class*="plan"]').first();
    const buildBtn = page.locator('button:has-text("BUILD"), [class*="build"]').first();
    const hasPlan = await planBtn.count() > 0;
    const hasBuild = await buildBtn.count() > 0;
    console.log('PLAN 模式:', hasPlan ? '✅ 存在' : '❌ 不存在');
    console.log('BUILD 模式:', hasBuild ? '✅ 存在' : '❌ 不存在');

    // 检查业务流程分析按钮
    const analyzeBtn = page.locator('button:has-text("分析"), button:has-text("业务流程")').first();
    const hasAnalyze = await analyzeBtn.count() > 0;
    console.log('分析按钮:', hasAnalyze ? '✅ 存在' : '❌ 不存在');

    // 列出所有按钮文本
    const allButtons = await page.locator('button').all();
    console.log('\n=== 所有按钮 ===');
    for (const btn of allButtons) {
      const text = await btn.innerText();
      if (text.trim()) {
        console.log('-', text.trim());
      }
    }

    // 检查页面可见文本
    const visibleText = await page.locator('body').innerText();
    console.log('\n=== 页面关键词 ===');
    const keywords = ['需求', 'PLAN', 'BUILD', '分析', '流程', '项目', '模板', '开始'];
    keywords.forEach(kw => {
      console.log(`${kw}: ${visibleText.includes(kw) ? '✅' : '❌'}`);
    });

    // 控制台错误
    console.log('\n=== 控制台错误 ===');
    if (consoleErrors.length > 0) {
      consoleErrors.forEach(err => {
        console.log(`[${err.type}] ${err.text.substring(0, 200)}`);
      });
    } else {
      console.log('✅ 无错误');
    }
  });

  // TC-002: 输入需求文本
  test('TC-002: 输入需求文本', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    const textarea = page.locator('textarea').first();
    const hasTextarea = await textarea.count() > 0;
    
    if (hasTextarea) {
      await textarea.fill('用户可以注册登录、浏览商品、加入购物车、下单支付');
      const value = await textarea.inputValue();
      console.log('输入内容:', value);
      console.log('输入状态:', value.length > 0 ? '✅ 成功' : '❌ 失败');
    } else {
      console.log('❌ 未找到需求录入框');
    }
  });

  // TC-003: 选择模式并点击分析
  test('TC-003: 选择模式并点击分析', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    // 输入需求
    const textarea = page.locator('textarea').first();
    if (await textarea.count() > 0) {
      await textarea.fill('用户可以注册登录、浏览商品、加入购物车、下单支付');
    }

    // 查找并点击 PLAN 按钮
    const buttons = await page.locator('button').all();
    let planClicked = false;
    let analyzeClicked = false;

    for (const btn of buttons) {
      const text = await btn.innerText();
      const lowerText = text.toLowerCase();
      
      if (lowerText.includes('plan') && !planClicked) {
        await btn.click();
        planClicked = true;
        console.log('✅ 点击 PLAN 模式');
      }
      
      if ((lowerText.includes('分析') || lowerText.includes('process') || lowerText.includes('analyze')) && !analyzeClicked) {
        await btn.click();
        analyzeClicked = true;
        console.log('✅ 点击分析按钮:', text);
      }
    }

    if (!planClicked) {
      console.log('⚠️ 未找到 PLAN 按钮');
    }
    if (!analyzeClicked) {
      console.log('⚠️ 未找到分析按钮');
    }

    // 等待分析过程
    if (analyzeClicked) {
      console.log('\n等待分析结果...');
      // Wait for result content to appear instead of fixed timeout
      await page.waitForFunction(() => {
        const bodyText = document.body.innerText;
        const svgCount = document.querySelectorAll('svg').length;
        return svgCount > 0 || /下单|支付|审核|流程|flow/i.test(bodyText);
      }, { timeout: 15000 }).catch(() => {
        console.log('⚠️ 分析结果等待超时');
      });

      // 检查组件状态变化
      const loadingIndicator = page.locator('[class*="loading"], [class*="spinner"], [class*="progress"]');
      const isLoading = await loadingIndicator.count() > 0;
      console.log('加载状态:', isLoading ? '⚙️ 加载中' : '✅ 加载完成');

      // 检查是否有结果输出
      const resultArea = page.locator('[class*="result"], [class*="output"], [class*="flow"]');
      const hasResult = await resultArea.count() > 0;
      console.log('结果区域:', hasResult ? '✅ 存在' : '❌ 不存在');
    }

    // API 请求汇总
    console.log('\n=== API 请求汇总 ===');
    const apiCalls = apiRequests.filter(r => r.url.includes('/api/'));
    console.log(`总 API 调用: ${apiCalls.length}`);
    apiCalls.forEach((req, i) => {
      console.log(`${i + 1}. [${req.status}] ${req.url}`);
    });
  });
});
