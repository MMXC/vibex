// @ts-nocheck
import { chromium } from 'playwright';

async function run() {
  let browser;
  try {
    console.log('🔍 Testing NEW CANVAS (三树画布) - Requirements → AI Generate');
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
    const page = await context.newPage();
    
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    
    console.log('\n📍 Step 1: Navigate to new canvas directly...');
    await page.goto('https://vibex-app.pages.dev/canvas', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'nc3-1-canvas-url.png', fullPage: true });
    console.log('✅ Canvas page loaded, URL:', page.url());
    
    const body = await page.textContent('body');
    const hasThreeTrees = body.includes('意图树') && body.includes('流程树') && body.includes('组件树');
    console.log('✅ Has 三树 layout:', hasThreeTrees);
    
    if (!hasThreeTrees) {
      // Try homepage → new canvas button
      console.log('\n📍 Trying via homepage...');
      await page.goto('https://vibex-app.pages.dev/', { waitUntil: 'networkidle', timeout: 30000 });
      
      // Close any modal
      const closeBtn = page.locator('button:has-text("×"), button:has-text("✕")').first();
      if (await closeBtn.isVisible().catch(() => false)) {
        await closeBtn.click({ timeout: 2000 });
        await page.waitForTimeout(500);
      }
      
      // Click "新画布"
      const ncBtn = page.locator('button:has-text("新画布")').first();
      await ncBtn.click({ force: true });
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'nc3-2-modal.png', fullPage: true });
      
      // The modal has tabs - click "新画布" tab
      const tabBtn = page.locator('button:has-text("新画布"), [role="tab"]:has-text("新画布")').first();
      if (await tabBtn.isVisible().catch(() => false)) {
        await tabBtn.click({ force: true });
        await page.waitForTimeout(1000);
      }
      
      // Click "从零开始"
      const fromScratch = page.locator('button:has-text("从零开始")').first();
      console.log('✅ "从零开始" visible:', await fromScratch.isVisible().catch(() => false));
      if (await fromScratch.isVisible().catch(() => false)) {
        await fromScratch.click({ force: true });
        await page.waitForTimeout(500);
      }
      
      // Now click "开始"
      const startBtn = page.locator('button:has-text("开始")').first();
      if (await startBtn.isVisible().catch(() => false)) {
        await startBtn.click({ force: true });
        await page.waitForTimeout(3000);
        await page.screenshot({ path: 'nc3-3-launched.png', fullPage: true });
      }
    }
    
    console.log('\n📍 Step 2: Verify 三树 layout...');
    const body2 = await page.textContent('body');
    const hasTrees = body2.includes('意图树') && body2.includes('流程树') && body2.includes('组件树');
    console.log('✅ 三树 layout:', hasTrees);
    
    const hasMermaid = body2.includes('graph') || body2.includes('TD') || body2.includes('意图');
    console.log('✅ Has mermaid/content:', hasMermaid);
    
    console.log('\n📍 Step 3: Check for AI generate button...');
    const aiGenBtn = page.locator('button:has-text("AI 生成"), button:has-text("生成")').first();
    const aiGenVisible = await aiGenBtn.isVisible().catch(() => false);
    console.log('✅ "AI 生成" button visible:', aiGenVisible);
    
    // Check for any input fields
    const textarea = page.locator('textarea').first();
    const taVisible = await textarea.isVisible().catch(() => false);
    console.log('✅ Textarea visible:', taVisible);
    
    if (taVisible) {
      const placeholder = await textarea.getAttribute('placeholder').catch(() => '');
      console.log('✅ Placeholder:', placeholder);
      
      await textarea.click({ force: true });
      await textarea.fill('用户管理系统：注册、登录、个人资料管理');
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'nc3-4-filled.png', fullPage: true });
      console.log('✅ Filled requirements');
      
      // Try AI generate
      if (aiGenVisible) {
        await aiGenBtn.click({ force: true });
        await page.waitForTimeout(5000);
        await page.screenshot({ path: 'nc3-5-after-generate.png', fullPage: true });
        console.log('✅ Clicked AI generate');
      }
    }
    
    console.log('\n📍 Console errors:', errors.length);
    errors.slice(0, 5).forEach(e => console.log('  ❌', e.slice(0, 200)));
    
    await page.screenshot({ path: 'nc3-final.png', fullPage: true });
    
    await browser.close();
    console.log('\n✅ Test complete!');
    
  } catch(e) {
    console.error('❌ Error:', e.message);
    if (browser) await browser.close().catch(() => {});
    process.exit(1);
  }
}

run();
