// @ts-nocheck
import { chromium } from 'playwright';

const TEST_URL = 'https://fix-mermaid-render.vibex-frontend.pages.dev';

(async () => {
  const startTime = Date.now();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('🚀 完整 E2E 测试...\n');
  
  try {
    // 步骤1: 访问首页
    console.log('1️⃣ 访问首页');
    await page.goto(TEST_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // 关闭引导弹窗
    const skipBtn = await page.$('button:has-text("跳过")');
    if (skipBtn) {
      console.log('关闭引导弹窗');
      await skipBtn.click();
      await page.waitForTimeout(1000);
    }
    
    // 步骤2: 输入需求
    console.log('2️⃣ 输入需求文本');
    const textarea = await page.waitForSelector('textarea');
    
    // 使用 fill 并等待状态更新
    await textarea.click();
    await page.keyboard.type('开发一个在线教育平台，支持课程管理、用户学习进度跟踪');
    await page.waitForTimeout(1000);
    
    // 检查字符数
    const charCount = await page.$eval('span:has-text("字符")', el => el.textContent);
    console.log('字符计数:', charCount);
    
    // 步骤3: 检查并点击分析
    console.log('3️⃣ 点击「业务流程分析」');
    const button = await page.waitForSelector('button:has-text("业务流程分析")');
    const isDisabled = await button.isDisabled();
    console.log('按钮状态:', isDisabled ? '禁用' : '可用');
    
    if (!isDisabled) {
      await button.click({ force: true });
      console.log('4️⃣ 等待分析完成（4秒）...');
      await page.waitForTimeout(5000);
    }
    
    // 截图
    await page.screenshot({ path: '/tmp/vibex-final-test.png', fullPage: true });
    
    // 检查页面结构
    const bodyText = await page.textContent('body') || '';
    const svgCount = await page.$$eval('svg', els => els.length);
    
    // 检查各模块
    const hasBoundedContext = /用户模块|商品目录|销售订单|库存管理|物流系统|支付网关/.test(bodyText);
    const hasDomainModel = /User|Product|Order|Inventory|Logistics|Payment/.test(bodyText);
    const hasFlow = /下单|支付|审核|打包|发货|收货/.test(bodyText);
    
    const totalDuration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    console.log('\n========== 测试报告 ==========');
    console.log('URL:', TEST_URL);
    console.log('总耗时:', totalDuration + '秒');
    console.log('SVG元素:', svgCount + '个');
    console.log('\n页面结构:');
    console.log('  限界上下文:', hasBoundedContext ? '✅' : '❌');
    console.log('  领域模型:', hasDomainModel ? '✅' : '❌');
    console.log('  业务流程:', hasFlow ? '✅' : '❌');
    console.log('================================\n');
    
    return { 
      success: hasBoundedContext && hasDomainModel && hasFlow, 
      svgCount,
      hasBoundedContext,
      hasDomainModel,
      hasFlow
    };
    
  } catch (e: any) {
    console.error('错误:', e.message);
    await page.screenshot({ path: '/tmp/vibex-error.png', fullPage: true });
    return { success: false, error: e.message };
  } finally {
    await browser.close();
  }
})();
