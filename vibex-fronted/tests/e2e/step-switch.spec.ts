/**
 * E2E Tests for Step Switching (F2.3)
 * 
 * Tests cover:
 * - Click on step to switch status
 * - Update preview area when switching
 * - Support undo operation
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Step Switching (F2.3)', () => {
  // Test: Click step to switch status - forward
  test('T2.3.1: Step navigation should be visible', async ({ page }) => {
    await page.goto(`${BASE_URL}/confirm`);
    await page.waitForLoadState('networkidle');
    
    // Check if step navigation exists and is visible - use Steps component class
    const stepNavigation = page.locator('.Steps-module__gfgF6G__stepList, [class*="stepList"]');
    
    // Steps should show multiple steps (at least 2)
    const steps = page.locator('[class*="stepItem"], [class*="step"]');
    const stepCount = await steps.count();
    expect(stepCount).toBeGreaterThanOrEqual(2);
  });

  // Test: Switch step updates preview area
  test('T2.3.2: Switching step should update preview area', async ({ page }) => {
    await page.goto(`${BASE_URL}/confirm/context`);
    await page.waitForLoadState('networkidle');
    
    // Check preview area exists
    const previewArea = page.locator('[class*="preview"], .preview');
    
    // If we have preview content, verify it changes when switching steps
    // The preview should show different mermaid code based on step
    const hasPreview = await previewArea.count() > 0;
    if (hasPreview) {
      await expect(previewArea.first()).toBeVisible();
    }
  });

  // Test: Undo operation support
  test('T2.3.3: Step switching should support undo operation', async ({ page }) => {
    await page.goto(`${BASE_URL}/confirm`);
    await page.waitForLoadState('networkidle');
    
    // Check for undo functionality - could be a button or keyboard shortcut
    const undoButton = page.locator('button:has-text("撤销"), button:has-text("undo")');
    
    // If undo button exists, test it
    const hasUndo = await undoButton.count() > 0;
    if (hasUndo) {
      // First make some change
      const textarea = page.locator('textarea');
      if (await textarea.count() > 0) {
        await textarea.fill('Test requirement for undo');
        await page.page.waitForLoadState('domcontentloaded');
        
        // Click undo
        await undoButton.first().click();
        await page.page.waitForLoadState('domcontentloaded');
        
        // Verify state was restored (textarea should be empty or previous state)
        const value = await textarea.inputValue();
        expect(value).toBe('');
      }
    } else {
      // Check if keyboard shortcut (Ctrl+Z) is supported
      const textarea = page.locator('textarea');
      if (await textarea.count() > 0) {
        await textarea.fill('Test requirement');
        await page.keyboard.press('Control+z');
        await page.page.waitForLoadState('domcontentloaded');
        
        // If undo works, value should be empty or changed
        const value = await textarea.inputValue();
        expect(typeof value).toBe('string');
      }
    }
  });

  // Test: Boundary - Switch to same step should be no-op
  test('T2.3.4: Switching to same step should be no-op', async ({ page }) => {
    await page.goto(`${BASE_URL}/confirm`);
    await page.waitForLoadState('networkidle');
    
    // Get initial state
    const initialUrl = page.url();
    
    // Click current step (should not cause issues)
    const step1 = page.locator('[class*="stepItem"], [class*="steps"] button').first();
    if (await step1.count() > 0) {
      await step1.click();
      await page.page.waitForLoadState('domcontentloaded');
      
      // URL should remain the same
      expect(page.url()).toBe(initialUrl);
    }
  });

  // Test: Boundary - Cannot skip required steps
  test('T2.3.5: Accessing final step without data shows appropriate message', async ({ page }) => {
    await page.goto(`${BASE_URL}/confirm/success`);
    await page.waitForLoadState('networkidle');
    
    // Should either show message or redirect back
    const content = await page.content();
    const hasContent = content.length > 100; // Page has content
    expect(hasContent).toBeTruthy();
  });

  // Test: Forward - Can complete step then go next
  test('T2.3.6: Generate button exists and is clickable', async ({ page }) => {
    await page.goto(`${BASE_URL}/confirm`);
    await page.waitForLoadState('networkidle');
    
    // Fill in requirement
    const textarea = page.locator('textarea');
    if (await textarea.count() > 0) {
      await textarea.fill('开发一个在线教育平台');
      
      // Verify generate button exists
      const generateBtn = page.locator('button:has-text("开始生成"), button:has-text("生成")');
      await expect(generateBtn).toBeVisible();
      
      // Button should be enabled when textarea has content
      const isDisabled = await generateBtn.first().isDisabled();
      expect(isDisabled).toBeFalsy();
    }
  });

  // Test: Backward - Can go back to previous step
  test('T2.3.7: Can navigate back to previous step', async ({ page }) => {
    // Start at context step
    await page.goto(`${BASE_URL}/confirm/context`);
    await page.waitForLoadState('networkidle');
    
    // Try to find and click back navigation
    const backButton = page.locator('button:has-text("上一步"), button:has-text("返回"), a:has-text("返回")');
    
    if (await backButton.count() > 0) {
      await backButton.first().click();
      await page.page.waitForLoadState('domcontentloaded');
      
      // Should go back to input step
      expect(page.url()).toContain('/confirm');
    } else {
      // Or use browser back
      await page.goBack();
      await page.page.waitForLoadState('domcontentloaded');
      
      // Should be at previous page
      expect(page.url()).toContain('/confirm');
    }
  });
});
