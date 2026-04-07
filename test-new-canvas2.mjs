import { chromium } from 'playwright';

async function run() {
  let browser;
  try {
    console.log('🔍 Testing NEW CANVAS full flow: Onboarding → Requirements → Create');
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
    const page = await context.newPage();
    
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    
    console.log('\n📍 Step 1: Load app...');
    await page.goto('https://vibex-app.pages.dev/', { waitUntil: 'networkidle', timeout: 30000 });
    await page.screenshot({ path: 'nc2-1-loaded.png', fullPage: true });
    
    console.log('\n📍 Step 2: Close any modal...');
    const closeBtn = page.locator('button:has-text("×"), button:has-text("✕")').first();
    if (await closeBtn.isVisible().catch(() => false)) {
      await closeBtn.click({ timeout: 2000 });
      await page.waitForTimeout(500);
    }
    
    console.log('\n📍 Step 3: Click "新画布"...');
    const newCanvasBtn = page.locator('button:has-text("新画布")').first();
    await newCanvasBtn.click({ force: true });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'nc2-2-modal.png', fullPage: true });
    
    console.log('\n📍 Step 4: Choose "从零开始"...');
    const fromScratch = page.locator('button:has-text("从零开始"), div:has-text("从零开始")').first();
    const fsVisible = await fromScratch.isVisible().catch(() => false);
    console.log('✅ "从零开始" visible:', fsVisible);
    
    if (fsVisible) {
      await fromScratch.click({ force: true });
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'nc2-3-from-scratch.png', fullPage: true });
    }
    
    console.log('\n📍 Step 5: Click "开始" to launch canvas...');
    // Look for the main "开始" button in the onboarding modal
    const allBtns = await page.locator('button').all();
    for (const btn of allBtns) {
      const text = await btn.textContent().catch(() => '');
      const visible = await btn.isVisible().catch(() => false);
      if (visible && text.trim()) {
        console.log('  Button:', text.trim().slice(0, 40));
      }
    }
    
    // Try to find "开始" button
    const startBtn = page.locator('button:has-text("开始")').first();
    const startVisible = await startBtn.isVisible().catch(() => false);
    console.log('✅ "开始" button visible:', startVisible);
    
    if (startVisible) {
      await startBtn.click({ force: true });
      await page.waitForTimeout(3000);
      await page.screenshot({ path: 'nc2-4-canvas-launched.png', fullPage: true });
      console.log('✅ Canvas launched, URL:', page.url());
    }
    
    console.log('\n📍 Step 6: Enter requirements in canvas...');
    const body = await page.textContent('body');
    console.log('✅ Body length:', body?.trim().length);
    
    // Look for textarea or input
    const textarea = page.locator('textarea').first();
    const taVisible = await textarea.isVisible().catch(() => false);
    console.log('✅ Textarea visible:', taVisible);
    
    if (taVisible) {
      await textarea.click({ force: true });
      await textarea.fill('我想开发一个用户管理系统，包含用户注册、登录、个人资料管理功能');
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'nc2-5-filled.png', fullPage: true });
      console.log('✅ Requirements entered');
      
      // Try to find send/submit
      const sendBtn = page.locator('button:has-text("发送"), button:has-text("提交"), button:has-text("➤")').first();
      const sendVisible = await sendBtn.isVisible().catch(() => false);
      console.log('✅ Send button visible:', sendVisible);
      
      if (sendVisible) {
        await sendBtn.click({ force: true });
        await page.waitForTimeout(5000);
        await page.screenshot({ path: 'nc2-6-after-send.png', fullPage: true });
        console.log('✅ Sent requirements');
      }
    } else {
      // Check for input
      const input = page.locator('input').first();
      const inVisible = await input.isVisible().catch(() => false);
      console.log('✅ Input visible:', inVisible);
    }
    
    console.log('\n📍 Step 7: Check for navigation or creation...');
    await page.waitForTimeout(2000);
    
    const nextBtn = page.locator('button:has-text("下一步"), button:has-text("创建项目"), button:has-text("提交")').first();
    const nextVisible = await nextBtn.isVisible().catch(() => false);
    const nextText = nextVisible ? await nextBtn.textContent().catch(() => '') : '';
    console.log('✅ Navigation button visible:', nextVisible, '-', nextText.trim());
    
    if (nextVisible) {
      await nextBtn.click({ force: true });
      await page.waitForTimeout(5000);
      await page.screenshot({ path: 'nc2-7-next.png', fullPage: true });
      console.log('✅ Clicked, URL:', page.url());
    }
    
    console.log('\n📍 Console errors:', errors.length);
    errors.slice(0, 5).forEach(e => console.log('  ❌', e.slice(0, 200)));
    
    await browser.close();
    console.log('\n✅ New canvas flow test complete!');
    
  } catch(e) {
    console.error('❌ Error:', e.message);
    if (browser) await browser.close().catch(() => {});
    process.exit(1);
  }
}

run();
