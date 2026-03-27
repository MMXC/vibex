import { chromium } from 'playwright';

async function run() {
  let browser;
  try {
    console.log('🔍 Testing NEW CANVAS (三树画布)');
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
    const page = await context.newPage();
    
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    
    console.log('\n📍 Step 1: Load homepage...');
    await page.goto('https://vibex-app.pages.dev/', { waitUntil: 'networkidle', timeout: 30000 });
    await page.screenshot({ path: 'nc-1-home.png', fullPage: true });
    console.log('✅ Homepage loaded');
    
    console.log('\n📍 Step 2: Click "新画布" button...');
    // The "新画布" button is in the navbar
    const newCanvasBtn = page.locator('button:has-text("新画布")').first();
    const btnVisible = await newCanvasBtn.isVisible().catch(() => false);
    console.log('✅ "新画布" button visible:', btnVisible);
    
    if (btnVisible) {
      await newCanvasBtn.click({ force: true });
      await page.waitForTimeout(3000);
      await page.screenshot({ path: 'nc-2-new-canvas.png', fullPage: true });
      console.log('✅ Clicked "新画布"');
      console.log('✅ URL:', page.url());
    }
    
    console.log('\n📍 Step 3: Check canvas page...');
    const body = await page.textContent('body');
    console.log('✅ Page length:', body?.trim().length, 'chars');
    
    // Look for canvas elements
    const canvas = await page.locator('canvas, [data-testid*="canvas"], .canvas').count();
    console.log('✅ Canvas elements:', canvas);
    
    // Check for step navigator or sidebar
    const hasStepNav = body.includes('步骤') || body.includes('流程') || body.includes('Step');
    console.log('✅ Has step navigation:', hasStepNav);
    
    // Check console errors
    console.log('\n📍 Console errors:', errors.length);
    errors.slice(0, 5).forEach(e => console.log('  ❌', e.slice(0, 200)));
    
    // Take full page screenshot
    await page.screenshot({ path: 'nc-3-full.png', fullPage: true });
    console.log('✅ Screenshots saved: nc-1-home.png, nc-2-new-canvas.png, nc-3-full.png');
    
    await browser.close();
    console.log('\n✅ New canvas test complete!');
    
  } catch(e) {
    console.error('❌ Error:', e.message);
    if (browser) await browser.close().catch(() => {});
    process.exit(1);
  }
}

run();
