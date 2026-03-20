import { chromium } from 'playwright';

const TEST_URL = 'https://fix-mermaid-render.vibex-frontend.pages.dev';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('🚀 测试 Mermaid 渲染...');
  console.log('URL:', TEST_URL);
  
  try {
    await page.goto(TEST_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    
    // 关闭引导弹窗
    const skipBtn = await page.$('button:has-text("跳过")');
    if (skipBtn) {
      console.log('关闭引导弹窗');
      await skipBtn.click();
      await page.waitForTimeout(500);
    }
    
    // 输入需求
    console.log('输入需求...');
    const textarea = await page.waitForSelector('textarea');
    await textarea.fill('开发一个在线教育平台');
    await page.waitForTimeout(1000);
    
    // 检查按钮状态
    const button = await page.waitForSelector('button:has-text("业务流程分析")');
    const isDisabled = await button.isDisabled();
    console.log('分析按钮禁用:', isDisabled);
    
    if (!isDisabled) {
      console.log('点击分析按钮...');
      await button.click({ force: true });
      await page.waitForTimeout(5000);
      
      // 截图
      await page.screenshot({ path: '/tmp/vibex-debug.png', fullPage: true });
      
      // 检查结果
      const bodyText = await page.textContent('body') || '';
      const hasResult = /下单|支付|审核|flowchart|限界上下文/i.test(bodyText);
      const svgCount = await page.$$eval('svg', els => els.length);
      
      console.log('\n结果检查:');
      console.log('包含流程图关键词:', hasResult ? '✅' : '❌');
      console.log('SVG数量:', svgCount);
      
      if (hasResult || svgCount > 0) {
        console.log('\n🎉 Mermaid 渲染成功！');
      } else {
        console.log('\n❌ Mermaid 未渲染');
        console.log('页面文本片段:', bodyText.substring(0, 500));
      }
    } else {
      console.log('按钮仍禁用，无法测试');
      await page.screenshot({ path: '/tmp/vibex-debug.png', fullPage: true });
    }
    
  } catch (e: any) {
    console.error('错误:', e.message);
    await page.screenshot({ path: '/tmp/vibex-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
