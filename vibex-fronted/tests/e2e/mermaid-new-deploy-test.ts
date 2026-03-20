import { chromium } from 'playwright';

const TEST_URL = 'https://fix-mermaid-render.vibex-frontend.pages.dev';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('🚀 测试 Mermaid 渲染 (新部署)...');
  console.log('URL:', TEST_URL);
  
  try {
    await page.goto(TEST_URL, { waitUntil: 'networkidle' });
    
    const skipBtn = await page.$('button:has-text("跳过")');
    if (skipBtn) {
      await skipBtn.click();
      await page.waitForTimeout(500);
    }
    
    const textarea = await page.waitForSelector('textarea');
    await textarea.fill('开发一个在线教育平台，支持课程管理、用户学习进度跟踪');
    
    const analyzeBtn = await page.waitForSelector('button:has-text("业务流程分析")');
    await analyzeBtn.click({ force: true });
    
    console.log('等待分析完成...');
    await page.waitForTimeout(4000);
    
    await page.screenshot({ path: '/tmp/vibex-new-deploy-test.png', fullPage: true });
    
    const previewText = await page.textContent('body') || '';
    const hasMermaid = /下单|支付|审核|打包|发货|收货|flowchart/i.test(previewText);
    const svgCount = await page.$$eval('svg', els => els.length);
    
    console.log('\n========== 测试结果 ==========');
    console.log('预览区包含流程图:', hasMermaid ? '✅ YES' : '❌ NO');
    console.log('SVG 元素数量:', svgCount);
    console.log('================================\n');
    
    if (hasMermaid || svgCount > 0) {
      console.log('🎉 Mermaid 渲染成功！');
    } else {
      console.log('❌ Mermaid 仍未渲染');
    }
    
  } catch (e: any) {
    console.error('测试错误:', e.message);
  } finally {
    await browser.close();
  }
})();
