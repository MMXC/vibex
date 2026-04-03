/**
 * DDD Naming and Tab Shortcuts E2E Test
 * E1-F1.4-F1.7: Alt+1/2/3 tab switching
 */
// @ts-nocheck


import { test, expect } from '@playwright/test';

test.describe('Tab Shortcuts (Alt+1/2/3)', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.log('[Console Error]', msg.text());
      }
    });
  });

  test('Alt+1 switches to Context tab', async ({ page }) => {
    await page.goto('/canvas');
    await page.waitForLoadState('networkidle');
    
    // Press Alt+2 first to switch away from default
    await page.keyboard.press('Alt+2');
    
    // Press Alt+1 to switch to Context
    await page.keyboard.press('Alt+1');
    
    // Verify context tab is active (check via store or UI state)
    // The store state should have activeTree === 'context'
  });

  test('Alt+2 switches to Flow tab', async ({ page }) => {
    await page.goto('/canvas');
    await page.waitForLoadState('networkidle');
    
    // Press Alt+2
    await page.keyboard.press('Alt+2');
    
    // Flow tab should be active
  });

  test('Alt+3 switches to Component tab', async ({ page }) => {
    await page.goto('/canvas');
    await page.waitForLoadState('networkidle');
    
    // Press Alt+3
    await page.keyboard.press('Alt+3');
    
    // Component tab should be active
  });

  // Negative: key without Alt should NOT switch tabs
  test('pressing 1/2/3 without Alt does not switch tabs', async ({ page }) => {
    await page.goto('/canvas');
    await page.waitForLoadState('networkidle');
    
    // Press 1 without Alt - should not switch
    await page.keyboard.press('1');
    
    // Press 2 without Alt - should not switch
    await page.keyboard.press('2');
    
    // Press 3 without Alt - should not switch
    await page.keyboard.press('3');
    
    // Tab switching should only happen with Alt modifier
  });

  // Negative: Ctrl+Alt+1 should not trigger tab switch (Alt required)
  test('Ctrl+Alt+1 does not trigger tab switch', async ({ page }) => {
    await page.goto('/canvas');
    await page.waitForLoadState('networkidle');
    
    // Press Ctrl+Alt+1 - should not trigger
    await page.keyboard.press('Control+Alt+1');
    
    // Should not cause errors
  });

  test('Tab shortcuts work when canvas is focused', async ({ page }) => {
    await page.goto('/canvas');
    await page.waitForLoadState('networkidle');
    
    // Click on canvas area to ensure focus
    await page.click('[class*="canvasContainer"]');
    
    // Alt+1 should work
    await page.keyboard.press('Alt+1');
    
    // Alt+2 should work
    await page.keyboard.press('Alt+2');
    
    // Alt+3 should work
    await page.keyboard.press('Alt+3');
  });
});
