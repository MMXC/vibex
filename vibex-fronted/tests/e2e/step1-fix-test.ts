import { chromium } from 'playwright';

const TEST_URL = 'https://fix-step1-click.vibex-frontend.pages.dev';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('🚀 测试 Step 1 点击修复...\n');
  
  try {
    await page.goto(TEST_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // 关闭引导弹窗
    const skipBtn = await page.$('button:has-text("跳过")');
    if (skipBtn) {
      await skipBtn.click();
      await page.waitForTimeout(1000);
    }
    
    // 输入需求
    const textarea = await page.waitForSelector('textarea');
    await textarea.click();
    await page.keyboard.type('开发一个在线教育平台');
    await page.waitForTimeout(500);
    
    // 点击业务流程分析按钮
    const button = await page.waitForSelector('button:has-text("业务流程分析")');
    console.log('点击「业务流程分析」...');
    await button.click();
    
    // 等待并观察
    console.log('等待分析（15秒）...');
    for (let i = 0; i < 15; i++) {
      await page.waitForTimeout(1000);
      
      // 检查预览区
      const previewText = await page.textContent('body') || '';
      const hasData = /用户模块|课程|订单|下单|支付/.test(previewText);
      const svgCount = await page.$$eval('svg', els => els.length);
      
      console.log(`  ${i+1}s - SVG: ${svgCount}, 有数据: ${hasData ? '✅' : '❌'}`);
      
      if (hasData && svgCount > 0) {
        console.log('\n🎉 成功！找到数据！');
        break;
      }
    }
    
    // 最终截图
    await page.screenshot({ path: '/tmp/vibex-step1-fix.png', fullPage: true });
    console.log('\n截图已保存');
    
  } catch (e: any) {
    console.error('错误:', e.message);
    await page.screenshot({ path: '/tmp/vibex-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
