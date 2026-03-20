import { chromium } from 'playwright';

async function testHomepageFlow() {
  console.log('🚀 开始首页流程分析 E2E 测试...');
  const startTime = Date.now();
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    // 1. 访问首页
    console.log('📍 步骤1: 访问首页...');
    await page.goto('https://vibex-app.pages.dev/', { waitUntil: 'networkidle' });
    
    // 检查并关闭 onboarding modal
    console.log('📍 检查引导弹窗...');
    const modalClose = await page.$('button:has-text("跳过"), button:has-text("关闭"), [aria-label="关闭"]');
    if (modalClose) {
      console.log('发现引导弹窗，关闭中...');
      await modalClose.click();
      await page.waitForTimeout(500);
    }
    
    // 2. 输入需求
    console.log('📍 步骤2: 输入需求...');
    const textarea = await page.waitForSelector('textarea', { timeout: 5000 });
    await textarea.fill('开发一个在线教育平台，支持课程管理、用户学习进度跟踪、在线测验');
    
    // 等待字符计数更新
    await page.waitForTimeout(500);
    
    // 3. 检查分析按钮状态
    console.log('📍 步骤3: 检查按钮状态...');
    const button = await page.waitForSelector('button:has-text("业务流程分析")');
    const isDisabled = await button.isDisabled();
    console.log(`分析按钮状态: ${isDisabled ? '禁用' : '可用'}`);
    
    if (isDisabled) {
      throw new Error('输入需求后，分析按钮仍为禁用状态');
    }
    
    // 4. 点击分析按钮
    console.log('📍 步骤4: 点击开始分析...');
    
    // 使用 force: true 绕过拦截
    await button.click({ force: true });
    
    // 5. 等待分析完成
    console.log('📍 步骤5: 等待分析完成...');
    const analyzeStartTime = Date.now();
    
    let attempts = 0;
    const maxAttempts = 180; // 最多等待3分钟
    
    while (attempts < maxAttempts) {
      const buttonText = await page.textContent('button:has-text("业务流程分析")').catch(() => '');
      console.log(`等待中... (${attempts + 1}/${maxAttempts})`);
      
      // 检查是否有结果
      const previewContent = await page.$('text=/限界上下文|领域模型|业务流程|步骤|模块/i');
      if (previewContent) {
        console.log('✅ 检测到分析结果！');
        break;
      }
      
      if (attempts === maxAttempts - 1) {
        throw new Error('分析超时，未在预期时间内完成');
      }
      
      await page.waitForTimeout(1000);
      attempts++;
    }
    
    // 等待额外时间确保渲染完成
    await page.waitForTimeout(3000);
    
    const analyzeDuration = (Date.now() - analyzeStartTime) / 1000;
    console.log(`⏱️ 分析耗时: ${analyzeDuration.toFixed(1)}秒`);
    
    // 6. 截图
    console.log('📍 步骤6: 截图保存...');
    await page.screenshot({ 
      path: '/tmp/vibex-analysis-result.png', 
      fullPage: true 
    });
    
    // 7. 检查结果
    const errorText = await page.$('text=/错误|失败|出错了|network error/i');
    const success = !errorText;
    
    const totalDuration = (Date.now() - startTime) / 1000;
    
    console.log('\n========== 测试结果 ==========');
    console.log(`总耗时: ${totalDuration.toFixed(1)}秒`);
    console.log(`分析耗时: ${analyzeDuration.toFixed(1)}秒`);
    console.log(`状态: ${success ? '✅ 成功' : '❌ 失败'}`);
    console.log('================================\n');
    
    return {
      success,
      totalDuration,
      analyzeDuration,
      screenshot: '/tmp/vibex-analysis-result.png'
    };
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    await page.screenshot({ path: '/tmp/vibex-analysis-error.png', fullPage: true });
    return {
      success: false,
      error: error.message,
      screenshot: '/tmp/vibex-analysis-error.png'
    };
  } finally {
    await browser.close();
  }
}

testHomepageFlow().then(result => {
  if (result.success) {
    console.log('🎉 E2E 测试通过！');
    process.exit(0);
  } else {
    console.log('💥 E2E 测试失败！');
    process.exit(1);
  }
});
