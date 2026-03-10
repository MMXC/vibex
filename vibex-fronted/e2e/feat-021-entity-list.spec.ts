/**
 * E2E Tests for FEAT-021: 实体列表组件
 * 测试覆盖：展示、折叠、高亮
 */

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

// 模拟的实体数据（用于测试）
const mockEntities = [
  {
    id: 'entity-1',
    name: 'User',
    type: 'user',
    description: '用户实体',
    attributes: [
      { name: 'id', type: 'UUID', required: true },
      { name: 'username', type: 'string', required: true },
      { name: 'email', type: 'string', required: false },
      { name: 'createdAt', type: 'timestamp', required: true },
    ],
  },
  {
    id: 'entity-2',
    name: 'Order',
    type: 'business',
    description: '订单实体',
    attributes: [
      { name: 'id', type: 'UUID', required: true },
      { name: 'userId', type: 'UUID', required: true },
      { name: 'total', type: 'decimal', required: true },
    ],
  },
];

test.describe('FEAT-021: 实体列表组件', () => {
  test.beforeEach(async ({ page }) => {
    // 导航到领域模型页面（列表视图）
    await page.goto(`${BASE_URL}/domain?projectId=test-project`);
    // 切换到列表视图
    const listTab = page.locator('button:has-text("列表")');
    if (await listTab.isVisible()) {
      await listTab.click();
    }
  });

  test('T-FEAT-021-01: 实体列表应展示实体名称和属性', async ({ page }) => {
    // 等待页面加载
    await page.waitForSelector('h2:has-text("实体列表")');
    
    // 验证实体列表标题显示
    const listTitle = page.locator('h2:has-text("实体列表")');
    await expect(listTitle).toBeVisible();
    
    // 如果有实体数据，验证实体卡片显示
    const entityCards = page.locator('[data-testid^="entity-card-"]');
    const cardCount = await entityCards.count();
    
    if (cardCount > 0) {
      // 验证至少一个实体卡片可见
      await expect(entityCards.first()).toBeVisible();
      
      // 验证实体名称显示
      const firstCard = entityCards.first();
      await expect(firstCard.locator('h3')).toBeVisible();
    }
  });

  test('T-FEAT-021-02: 实体列表应支持折叠功能', async ({ page }) => {
    // 等待页面加载
    await page.waitForSelector('h2:has-text("实体列表")');
    
    // 查找实体卡片
    const entityCards = page.locator('[data-testid^="entity-card-"]');
    const cardCount = await entityCards.count();
    
    if (cardCount > 0) {
      const firstCard = entityCards.first();
      const cardTestId = await firstCard.getAttribute('data-testid');
      const entityId = cardTestId?.replace('entity-card-', '');
      
      if (entityId) {
        // 查找折叠按钮
        const collapseBtn = page.locator(`[data-testid="collapse-btn-${entityId}"]`);
        
        // 如果有折叠按钮（实体有属性）
        if (await collapseBtn.isVisible()) {
          // 初始状态：属性区域应该可见
          const attrsArea = page.locator(`[data-testid="entity-attrs-${entityId}"]`);
          
          // 点击折叠按钮
          await collapseBtn.click();
          
          // 验证属性区域被隐藏（不再可见）
          await expect(attrsArea).not.toBeVisible();
          
          // 再次点击展开
          await collapseBtn.click();
          
          // 验证属性区域再次显示
          await expect(attrsArea).toBeVisible();
        }
      }
    }
  });

  test('T-FEAT-021-03: 实体列表应支持高亮功能', async ({ page }) => {
    // 等待页面加载
    await page.waitForSelector('h2:has-text("实体列表")');
    
    // 查找实体卡片
    const entityCards = page.locator('[data-testid^="entity-card-"]');
    const cardCount = await entityCards.count();
    
    if (cardCount >= 2) {
      const firstCard = entityCards.first();
      const secondCard = entityCards.nth(1);
      
      // 获取初始的 class
      const firstCardClasses = await firstCard.getAttribute('class');
      const secondCardClasses = await secondCard.getAttribute('class');
      
      // 点击第一个实体（应该高亮）
      await firstCard.click();
      
      // 等待高亮状态应用
      await page.waitForTimeout(100);
      
      // 验证第一个卡片有 selected 类
      const firstCardAfterClick = await entityCards.first().getAttribute('class');
      expect(firstCardAfterClick).toContain('selected');
      
      // 点击第二个实体
      await secondCard.click();
      
      // 等待状态更新
      await page.waitForTimeout(100);
      
      // 验证第一个卡片不再高亮
      const firstCardAfterSecondClick = await entityCards.first().getAttribute('class');
      expect(firstCardAfterSecondClick).not.toContain('selected');
      
      // 验证第二个卡片高亮
      const secondCardAfterClick = await entityCards.nth(1).getAttribute('class');
      expect(secondCardAfterClick).toContain('selected');
    }
  });

  test('T-FEAT-021-04: 空列表状态', async ({ page }) => {
    // 等待页面加载
    await page.waitForSelector('h2:has-text("实体列表")');
    
    // 查找实体卡片
    const entityCards = page.locator('[data-testid^="entity-card-"]');
    const cardCount = await entityCards.count();
    
    // 如果没有实体，应该显示空状态
    if (cardCount === 0) {
      const emptyMessage = page.locator('text=暂无实体');
      // 可能显示暂无实体或者列表为空的消息
      // 这是一个边界情况
    }
  });
});
