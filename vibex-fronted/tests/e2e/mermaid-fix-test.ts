import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('🚀 测试首页 Mermaid 渲染...');
  
  try {
    // 1. 访问首页
    await page.goto('https://vibex-app.pages.dev/', { waitUntil: 'networkidle' });
    
    // 2. 关闭引导弹窗
    const skipBtn = await page.$('button:has-text("跳过")');
    if (skipBtn) {
      await skipBtn.click({ force: true });
      await page.waitForSelector('button:has-text("跳过")', { state: 'hidden', timeout: 5000 }).catch(() => {});
    }
    
    // 3. 输入需求
    const textarea = await page.waitForSelector('textarea');
    await textarea.fill('开发一个在线教育平台，支持课程管理、用户学习进度跟踪');
    
    // 4. 点击分析
    const analyzeBtn = await page.waitForSelector('button:has-text("业务流程分析")');
    await analyzeBtn.click({ force: true });
    
    // 5. 等待分析完成 - poll for SVG or text content
    console.log('等待分析完成（最多15秒）...');
    const startTime = Date.now();
    
    const done = await page.waitForFunction(() => {
      const bodyText = document.body.innerText;
      const svgCount = document.querySelectorAll('svg').length;
      return svgCount > 0 || /下单|支付|审核|打包|发货|收货/.test(bodyText);
    }, { timeout: 15000 }).then(() => {
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      console.log(`  ✅ 分析在 ${elapsed}s 完成`);
      return true;
    }).catch(() => {
      console.log('  ⚠️ 15秒内未检测到分析完成，使用最终状态');
      return false;
    });
    
    // 6. 截图
    await page.screenshot({ path: '/tmp/vibex-mermaid-fix-test.png', fullPage: true });
    
    // 7. 检查预览区内容
    const previewText = await page.textContent('body') || '';
    
    const hasMermaid = /下单|支付|审核|打包|发货|收货|flowchart/i.test(previewText);
    const svgCount = await page.$$eval('svg', els => els.length);
    
    console.log('预览区包含流程图内容:', hasMermaid ? '✅ YES' : '❌ NO');
    console.log('SVG 元素数量:', svgCount);
    
  } catch (e: any) {
    console.error('测试错误:', e.message);
  } finally {
    await browser.close();
  }
})();
