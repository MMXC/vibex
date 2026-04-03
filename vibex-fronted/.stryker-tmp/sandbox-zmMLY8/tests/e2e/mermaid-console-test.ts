// @ts-nocheck
import { chromium } from 'playwright';

const TEST_URL = 'https://fix-mermaid-render.vibex-frontend.pages.dev';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // 监听控制台消息
  const logs: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      logs.push(`[ERROR] ${msg.text()}`);
    }
  });
  
  console.log('🚀 测试 Mermaid 渲染...\n');
  
  try {
    await page.goto(TEST_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // 关闭引导弹窗
    const skipBtn = await page.$('button:has-text("跳过")');
    if (skipBtn) {
      await skipBtn.click();
      await page.waitForTimeout(1000);
    }
    
    // 输入
    const textarea = await page.waitForSelector('textarea');
    await textarea.click();
    await page.keyboard.type('开发一个在线教育平台');
    await page.waitForTimeout(500);
    
    // 点击
    const button = await page.waitForSelector('button:has-text("业务流程分析")');
    console.log('点击分析按钮...');
    await button.click();
    
    // 等待更长时间
    console.log('等待分析（8秒）...');
    await page.waitForTimeout(8000);
    
    // 截图
    await page.screenshot({ path: '/tmp/vibex-console-test.png', fullPage: true });
    
    // 检查结果
    const bodyText = await page.textContent('body') || '';
    const hasFlow = /下单|支付|审核|打包|发货|收货/.test(bodyText);
    const svgCount = await page.$$eval('svg', els => els.length);
    
    console.log('\n========== 结果 ==========');
    console.log('SVG数量:', svgCount);
    console.log('包含流程图:', hasFlow ? '✅' : '❌');
    
    if (logs.length > 0) {
      console.log('\n控制台错误:');
      logs.forEach(log => console.log(log));
    } else {
      console.log('\n无控制台错误');
    }
    
    // 输出页面关键文本
    const previewMatch = bodyText.match(/.{0,50}输入需求后.{0,50}/);
    if (previewMatch) {
      console.log('\n预览区文本:', previewMatch[0]);
    }
    
  } catch (e: any) {
    console.error('错误:', e.message);
  } finally {
    await browser.close();
  }
})();
