import { test, expect } from '@playwright/test';
import { PrototypePage } from './pages';

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000';

// 登录辅助函数
async function login(page: any) {
  const maxRetries = 3;
  for (let i = 0; i < maxRetries; i++) {
    try {
      await page.goto(`${BASE_URL}/auth`);
      await page.waitForLoadState('domcontentloaded');

      // 检查是否有网络错误
      const errorMsg = page.locator('text=网络错误');
      if (await errorMsg.isVisible()) {
        console.log(`网络错误，重试 ${i + 1}/${maxRetries}`);
        await page.reload();
        await page.waitForTimeout(2000);
        continue;
      }

      await page.fill(
        'input[type="email"], input[name="email"], input[placeholder*="email" i]',
        'y760283407@outlook.com'
      );
      await page.fill(
        'input[type="password"], input[name="password"]',
        '12345678'
      );
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/dashboard/, { timeout: 60000 });
      return true;
    } catch (e) {
      console.log(`登录失败，重试 ${i + 1}/${maxRetries}`);
      if (i === maxRetries - 1) throw e;
      await page.waitForTimeout(3000);
    }
  }
  return false;
}

test.describe('原型预览 - 预览渲染', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('原型预览页面加载', async ({ page }) => {
    const prototypePage = new PrototypePage(page);
    await prototypePage.navigate();
    await prototypePage.waitForLoad();
    
    // 验证页面加载成功
    await expect(page).toHaveURL(/\/prototype/);
  });

  test('原型预览 - 设备切换（桌面端）', async ({ page }) => {
    const prototypePage = new PrototypePage(page);
    await prototypePage.navigate();
    await prototypePage.waitForLoad();
    
    // 切换到桌面端
    await prototypePage.selectDevice('desktop');
    
    // 验证预览区域宽度
    const width = await prototypePage.getPreviewWidth();
    expect(width).toBeGreaterThan(800); // 桌面端应该很宽
  });

  test('原型预览 - 设备切换（平板）', async ({ page }) => {
    const prototypePage = new PrototypePage(page);
    await prototypePage.navigate();
    await prototypePage.waitForLoad();
    
    // 切换到平板
    await prototypePage.selectDevice('tablet');
    
    // 验证预览区域宽度
    const width = await prototypePage.getPreviewWidth();
    expect(width).toBeLessThanOrEqual(768);
  });

  test('原型预览 - 设备切换（手机）', async ({ page }) => {
    const prototypePage = new PrototypePage(page);
    await prototypePage.navigate();
    await prototypePage.waitForLoad();
    
    // 切换到手机
    await prototypePage.selectDevice('mobile');
    
    // 验证预览区域宽度
    const width = await prototypePage.getPreviewWidth();
    expect(width).toBeLessThanOrEqual(375);
  });

  test('原型预览 - 缩放功能', async ({ page }) => {
    const prototypePage = new PrototypePage(page);
    await prototypePage.navigate();
    await prototypePage.waitForLoad();
    
    // 获取初始缩放级别
    const initialZoom = await prototypePage.getCurrentZoom();
    
    // 放大
    await prototypePage.zoomIn();
    let newZoom = await prototypePage.getCurrentZoom();
    expect(newZoom).toBeGreaterThan(initialZoom);
    
    // 缩小
    await prototypePage.zoomOut();
    await prototypePage.zoomOut();
    newZoom = await prototypePage.getCurrentZoom();
    expect(newZoom).toBeLessThan(initialZoom + 20);
  });

  test('原型预览 - 预览区域可见', async ({ page }) => {
    const prototypePage = new PrototypePage(page);
    await prototypePage.navigate();
    await prototypePage.waitForLoad();
    
    // 验证预览区域可见
    const isVisible = await prototypePage.isPreviewVisible();
    expect(isVisible).toBe(true);
  });
});

test.describe('原型预览 - 交互响应', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('原型预览 - 页面列表切换', async ({ page }) => {
    const prototypePage = new PrototypePage(page);
    await prototypePage.navigate();
    await prototypePage.waitForLoad();
    
    // 检查页面列表是否存在
    const pageList = page.locator('[data-testid="page-list"], .page-list, .pageList');
    const isVisible = await pageList.isVisible().catch(() => false);
    
    // 如果有页面列表，验证可以切换
    if (isVisible) {
      const pageItems = pageList.locator('button, [role="button"], a');
      const count = await pageItems.count();
      if (count > 1) {
        await pageItems.nth(1).click();
        await page.waitForTimeout(500);
      }
    }
  });

  test('原型预览 - 侧边栏显示', async ({ page }) => {
    const prototypePage = new PrototypePage(page);
    await prototypePage.navigate();
    await prototypePage.waitForLoad();
    
    // 验证侧边栏可见
    const sidebar = page.locator('[data-testid="prototype-sidebar"], .sidebar, .prototype-sidebar');
    const isVisible = await sidebar.isVisible().catch(() => false);
    expect(isVisible).toBe(true);
  });

  test('原型预览 - 设备按钮可点击', async ({ page }) => {
    const prototypePage = new PrototypePage(page);
    await prototypePage.navigate();
    await prototypePage.waitForLoad();
    
    // 验证设备切换按钮存在且可点击
    await prototypePage.desktopButton.click();
    await prototypePage.tabletButton.click();
    await prototypePage.mobileButton.click();
    
    // 验证没有错误
    const errorMsg = page.locator('text=Error, text=错误');
    expect(await errorMsg.isVisible()).toBe(false);
  });

  test('原型预览 - 缩放按钮可点击', async ({ page }) => {
    const prototypePage = new PrototypePage(page);
    await prototypePage.navigate();
    await prototypePage.waitForLoad();
    
    // 点击缩放按钮
    await prototypePage.zoomIn();
    await prototypePage.zoomOut();
    
    // 验证没有错误
    const errorMsg = page.locator('text=Error, text=错误');
    expect(await errorMsg.isVisible()).toBe(false);
  });

  test('原型预览 - 页面无崩溃', async ({ page }) => {
    const prototypePage = new PrototypePage(page);
    await prototypePage.navigate();
    await prototypePage.waitForLoad();
    
    // 验证页面没有崩溃（没有错误边界）
    const crashError = page.locator('text=页面崩溃, text=Something went wrong');
    expect(await crashError.isVisible()).toBe(false);
  });
});

test.describe('原型预览 - 空状态', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('无项目时显示空状态', async ({ page }) => {
    const prototypePage = new PrototypePage(page);
    // 访问原型页面但不传项目ID
    await prototypePage.navigate();
    await prototypePage.waitForLoad();
    
    // 页面应该正常加载，即使没有数据
    await expect(page).toHaveURL(/\/prototype/);
  });
});
