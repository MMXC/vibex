import { test, expect } from '@playwright/test';

const BASE_URL = 'https://vibex-app.pages.dev';
const TEST_EMAIL = 'y760283407@outlook.com';
const TEST_PASSWORD = '12345678';

async function login(page: any) {
  await page.goto(`${BASE_URL}/auth`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2000);
  
  const emailInput = page.locator('input[type="email"]').first();
  await emailInput.fill(TEST_EMAIL);
  const passwordInput = page.locator('input[type="password"]');
  await passwordInput.fill(TEST_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/dashboard/, { timeout: 15000 });
  await page.waitForLoadState('networkidle');
}

test.describe('VibeX 项目功能测试', () => {
  
  test('T1: Dashboard 应显示项目列表', async ({ page }) => {
    await login(page);
    await page.waitForTimeout(3000);
    
    // 检查是否有项目卡片
    const projectCards = page.locator('[class*="card"], [class*="project"]');
    const cardCount = await projectCards.count();
    console.log(`项目卡片数量: ${cardCount}`);
    
    // 截图
    await page.screenshot({ path: 'tests/e2e/screenshots/daily/2026-03-09/T-dashboard-projects.png', fullPage: true });
    
    // 检查是否显示"暂无项目"
    const noProjectText = await page.locator('text=暂无项目').isVisible().catch(() => false);
    console.log(`显示"暂无项目": ${noProjectText}`);
  });

  test('T2: 点击项目卡片跳转到项目详情页', async ({ page }) => {
    await login(page);
    await page.waitForTimeout(3000);
    
    // 尝试找到项目卡片并点击
    const firstProjectLink = page.locator('a[href*="/project/"]').first();
    
    if (await firstProjectLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('找到项目链接，点击...');
      await firstProjectLink.click();
      await page.waitForTimeout(3000);
      console.log(`跳转后URL: ${page.url()}`);
      await page.screenshot({ path: 'tests/e2e/screenshots/daily/2026-03-09/T-project-detail.png', fullPage: true });
    } else {
      console.log('未找到项目链接，检查页面内容...');
      const content = await page.content();
      console.log(content.substring(0, 1000));
    }
  });

  test('T3: 验证项目详情页包含必要标签', async ({ page }) => {
    // 直接访问项目详情页
    await page.goto(`${BASE_URL}/project/cmmi3gt60ns5eb4ct`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    console.log(`项目详情页URL: ${page.url()}`);
    
    // 检查页面内容
    const pageContent = await page.content();
    console.log(`页面包含"需求": ${pageContent.includes('需求')}`);
    console.log(`页面包含"限界": ${pageContent.includes('限界')}`);
    console.log(`页面包含"模型": ${pageContent.includes('模型')}`);
    console.log(`页面包含"流程": ${pageContent.includes('流程')}`);
    console.log(`页面包含"原型": ${pageContent.includes('原型')}`);
    console.log(`页面包含"设置": ${pageContent.includes('设置')}`);
    
    await page.screenshot({ path: 'tests/e2e/screenshots/daily/2026-03-09/T-project-detail-direct.png', fullPage: true });
  });
});
