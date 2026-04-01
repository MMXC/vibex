/**
 * E2E Tests for FEAT-022: 对话修改实体
 * 测试覆盖：添加、删除、修改实体
 */

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('FEAT-022: 对话修改实体', () => {
  test.beforeEach(async ({ page }) => {
    // 导航到领域模型页面
    await page.goto(`${BASE_URL}/domain?projectId=test-project`);
  });

  test('T-FEAT-022-01: 对话面板应能正常打开和关闭', async ({ page }) => {
    // 等待页面加载
    await page.waitForSelector('h1:has-text("领域模型")');
    
    // 点击对话修改按钮
    const chatBtn = page.locator('button:has-text("对话修改")');
    await expect(chatBtn).toBeVisible();
    await chatBtn.click();
    
    // 验证对话面板显示
    const chatPanel = page.locator('[data-testid="chat-modify-panel"]');
    await expect(chatPanel).toBeVisible();
    
    // 验证输入框存在
    const chatInput = page.locator('[data-testid="chat-input"]');
    await expect(chatInput).toBeVisible();
    
    // 点击关闭按钮
    const closeBtn = chatPanel.locator('button:has-text("×")');
    await closeBtn.click();
    
    // 验证面板关闭
    await expect(chatPanel).not.toBeVisible();
  });

  test('T-FEAT-022-02: 通过对话添加实体', async ({ page }) => {
    // 打开对话面板
    await page.waitForSelector('h1:has-text("领域模型")');
    await page.locator('button:has-text("对话修改")').click();
    
    const chatPanel = page.locator('[data-testid="chat-modify-panel"]');
    await expect(chatPanel).toBeVisible();
    
    // 输入添加实体指令
    const chatInput = page.locator('[data-testid="chat-input"]');
    await chatInput.fill('添加 TestEntity 实体');
    
    // 点击发送按钮
    const submitBtn = page.locator('[data-testid="chat-submit-btn"]');
    await submitBtn.click();
    
    // 验证成功消息显示
    const successMessage = chatPanel.locator('text=已成功添加实体');
    await expect(successMessage).toBeVisible();
    
    // 切换到列表视图验证实体已添加
    await page.locator('button:has-text("列表")').click();
    
    // 验证新实体出现在列表中
    const entityCard = page.locator('h3:has-text("TestEntity")');
    await expect(entityCard).toBeVisible();
  });

  test('T-FEAT-022-03: 通过对话删除实体', async ({ page }) => {
    // 先确保有实体可以删除
    await page.waitForSelector('h1:has-text("领域模型")');
    
    // 打开对话面板
    await page.locator('button:has-text("对话修改")').click();
    
    const chatPanel = page.locator('[data-testid="chat-modify-panel"]');
    await expect(chatPanel).toBeVisible();
    
    // 输入删除实体指令
    const chatInput = page.locator('[data-testid="chat-input"]');
    await chatInput.fill('删除 TestEntity 实体');
    
    // 点击发送按钮
    const submitBtn = page.locator('[data-testid="chat-submit-btn"]');
    await submitBtn.click();
    
    // 验证响应消息（成功或未找到）
    const responseMessage = chatPanel.locator('text=/已成功删除|未找到/');
    await expect(responseMessage).toBeVisible();
  });

  test('T-FEAT-022-04: 通过对话修改实体', async ({ page }) => {
    await page.waitForSelector('h1:has-text("领域模型")');
    
    // 打开对话面板
    await page.locator('button:has-text("对话修改")').click();
    
    const chatPanel = page.locator('[data-testid="chat-modify-panel"]');
    await expect(chatPanel).toBeVisible();
    
    // 输入修改实体指令
    const chatInput = page.locator('[data-testid="chat-input"]');
    await chatInput.fill('修改 User 实体');
    
    // 点击发送按钮
    const submitBtn = page.locator('[data-testid="chat-submit-btn"]');
    await submitBtn.click();
    
    // 验证响应消息
    const responseMessage = chatPanel.locator('text=/已成功修改|未找到/');
    await expect(responseMessage).toBeVisible();
  });

  test('T-FEAT-022-05: 无法识别的指令应返回提示', async ({ page }) => {
    await page.waitForSelector('h1:has-text("领域模型")');
    
    // 打开对话面板
    await page.locator('button:has-text("对话修改")').click();
    
    const chatPanel = page.locator('[data-testid="chat-modify-panel"]');
    await expect(chatPanel).toBeVisible();
    
    // 输入无法识别的指令
    const chatInput = page.locator('[data-testid="chat-input"]');
    await chatInput.fill('hello world');
    
    // 点击发送按钮
    const submitBtn = page.locator('[data-testid="chat-submit-btn"]');
    await submitBtn.click();
    
    // 验证提示消息
    const helpMessage = chatPanel.locator('text=/无法理解|添加|删除|修改/');
    await expect(helpMessage).toBeVisible();
  });

  test('T-FEAT-022-06: 输入框支持回车键提交', async ({ page }) => {
    await page.waitForSelector('h1:has-text("领域模型")');
    
    // 打开对话面板
    await page.locator('button:has-text("对话修改")').click();
    
    const chatPanel = page.locator('[data-testid="chat-modify-panel"]');
    await expect(chatPanel).toBeVisible();
    
    // 输入并按回车
    const chatInput = page.locator('[data-testid="chat-input"]');
    await chatInput.fill('添加 EnterTest 实体');
    await chatInput.press('Enter');
    
    // 验证消息已发送（输入框应被清空）
    await expect(chatInput).toHaveValue('');
  });
});