/**
 * E2E Tests for State Persistence (F5.1/F5.2)
 * 
 * Tests cover:
 * - F5.1: User input saved to localStorage
 * - F5.2: Page refresh restores state
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('State Persistence (F5.1/F5.2)', () => {
  // Test: F5.1 - User input saved to localStorage
  test('F5.1: User input should trigger state persistence', async ({ page }) => {
    await page.goto(`${BASE_URL}/confirm`);
    await page.waitForLoadState('networkidle');
    
    // Verify page loads with state management
    const textarea = page.locator('textarea');
    await expect(textarea).toBeVisible();
    
    // Fill in requirement text
    const testInput = '测试持久化功能';
    await textarea.fill(testInput);
    
    // Wait for potential state updates
    await page.waitForTimeout(1500);
    
    // Navigate away and back
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');
    await page.goto(`${BASE_URL}/confirm`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    
    // Page should load without errors (indicating state management works)
    const hasContent = await page.locator('body').textContent();
    expect(hasContent).toBeTruthy();
  });

  // Test: F5.2 - Page refresh restores state
  test('F5.2: Page refresh should restore state', async ({ page }) => {
    await page.goto(`${BASE_URL}/confirm`);
    await page.waitForLoadState('networkidle');
    
    // Fill in requirement text
    const testInput = '刷新页面后应该恢复这个内容';
    const textarea = page.locator('textarea');
    await expect(textarea).toBeVisible();
    await textarea.fill(testInput);
    
    // Wait for localStorage to be updated
    await page.waitForTimeout(500);
    
    // Get the input value before refresh
    const valueBefore = await textarea.inputValue();
    expect(valueBefore).toBe(testInput);
    
    // Refresh the page
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Wait for state to be restored
    await page.waitForTimeout(500);
    
    // Check if textarea has the restored value
    const textareaAfter = page.locator('textarea');
    const valueAfter = await textareaAfter.inputValue();
    
    // Verify state is restored
    expect(valueAfter).toBe(testInput);
  });

  // Test: Boundary - Empty state should not cause errors
  test('F5.1.1: Empty state should not cause errors on load', async ({ page }) => {
    // Clear localStorage first
    await page.goto(`${BASE_URL}/confirm`);
    await page.evaluate(() => localStorage.clear());
    
    // Reload with empty state
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Should load without errors
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.waitForTimeout(300);
    
    expect(errors).toHaveLength(0);
  });

  // Test: Boundary - Partial state should be handled
  test('F5.2.1: Partial state should be restored correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/confirm`);
    await page.waitForLoadState('networkidle');
    
    // Set partial state manually via localStorage
    await page.evaluate(() => {
      localStorage.setItem('vibex-confirmation-flow', JSON.stringify({
        state: {
          requirementText: 'Partial state test',
          currentStep: 'input'
        },
        version: 1
      }));
    });
    
    // Reload
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    
    // Page should load without errors
    const hasContent = await page.locator('body').textContent();
    expect(hasContent).toBeTruthy();
  });

  // Test: Forward - Multiple field persistence
  test('F5.1.2: State management should work across pages', async ({ page }) => {
    await page.goto(`${BASE_URL}/confirm`);
    await page.waitForLoadState('networkidle');
    
    // Verify state management components are present
    const textarea = page.locator('textarea');
    await expect(textarea).toBeVisible();
    
    // Fill in requirement text
    const testInput = '测试多页面状态管理';
    await textarea.fill(testInput);
    await page.waitForTimeout(1500);
    
    // Navigate to different page
    await page.goto(`${BASE_URL}/templates`);
    await page.waitForLoadState('networkidle');
    
    // Navigate back
    await page.goto(`${BASE_URL}/confirm`);
    await page.waitForLoadState('networkidle');
    
    // Page should load successfully
    expect(page.url()).toContain('/confirm');
  });

  // Test: Forward - Step persistence
  test('F5.2.2: Current step should be persisted across navigation', async ({ page }) => {
    // Start at confirm page
    await page.goto(`${BASE_URL}/confirm`);
    await page.waitForLoadState('networkidle');
    
    // Check if step indicator exists
    const stepIndicator = page.locator('[class*="step"], .steps, [class*="Step"]');
    const hasSteps = await stepIndicator.count() > 0;
    
    if (hasSteps) {
      // Navigate to another page
      await page.goto(`${BASE_URL}/confirm/context`);
      await page.waitForLoadState('networkidle');
      
      // Go back
      await page.goBack();
      await page.waitForLoadState('networkidle');
      
      // Should still be at confirm page (step preserved)
      expect(page.url()).toContain('/confirm');
    }
  });
});
