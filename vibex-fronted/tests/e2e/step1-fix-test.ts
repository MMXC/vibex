import { chromium } from 'playwright';

const TEST_URL = 'https://fix-step1-click.vibex-frontend.pages.dev';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('🚀 测试 Step 1 点击修复...\n');
  
  try {
    await page.goto(TEST_URL, { waitUntil: 'networkidle' });
    await page.waitForLoadState('domcontentloaded');
    
    // 关闭引导弹窗
    const skipBtn = await page.$('button:has-text("跳过")');
    if (skipBtn) {
      await skipBtn.click();
      await page.waitForSelector('button:has-text("跳过")', { state: 'hidden', timeout: 5000 }).catch(() => {});
    }
    
    // 输入需求
    const textarea = await page.waitForSelector('textarea');
    await textarea.click();
    await page.keyboard.type('开发一个在线教育平台');
    
    // 点击业务流程分析按钮
    const button = await page.waitForSelector('button:has-text("业务流程分析")');
    console.log('点击「业务流程分析」...');
    await button.click();
    
    // 等待并观察 - poll for data to appear
    console.log('等待分析完成...');
    
    const found = await page.waitForFunction(() => {
      const bodyText = document.body.innerText;
      const svgCount = document.querySelectorAll('svg').length;
      return /用户模块|课程|订单|下单|支付/.test(bodyText) && svgCount > 0;
    }, { timeout: 15000 }).then(() => {
      console.log('\n🎉 成功！找到数据！');
      return true;
    }).catch(() => {
      console.log('\n⚠️ 15秒内未找到数据，但仍记录结果');
      return false;
    });
    
    // 记录最终状态
    const svgCount = await page.$$eval('svg', els => els.length);
    console.log(`最终 SVG 数量: ${svgCount}`);
    
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
