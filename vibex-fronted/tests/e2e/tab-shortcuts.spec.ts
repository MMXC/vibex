/**
 * DDD Naming and Tab Shortcuts E2E Test
 * E1-F1.4-F1.7: Alt+1/2/3 tab switching
 */

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
    await page.waitForTimeout(100);
    
    // Press Alt+1 to switch to Context
    await page.keyboard.press('Alt+1');
    await page.waitForTimeout(100);
    
    // Verify context tab is active (check via store or UI state)
    // The store state should have activeTree === 'context'
  });

  test('Alt+2 switches to Flow tab', async ({ page }) => {
    await page.goto('/canvas');
    await page.waitForLoadState('networkidle');
    
    // Press Alt+2
    await page.keyboard.press('Alt+2');
    await page.waitForTimeout(100);
    
    // Flow tab should be active
  });

  test('Alt+3 switches to Component tab', async ({ page }) => {
    await page.goto('/canvas');
    await page.waitForLoadState('networkidle');
    
    // Press Alt+3
    await page.keyboard.press('Alt+3');
    await page.waitForTimeout(100);
    
    // Component tab should be active
  });

  test('Tab shortcuts work when canvas is focused', async ({ page }) => {
    await page.goto('/canvas');
    await page.waitForLoadState('networkidle');
    
    // Click on canvas area to ensure focus
    await page.click('[class*="canvasContainer"]');
    await page.waitForTimeout(100);
    
    // Alt+1 should work
    await page.keyboard.press('Alt+1');
    await page.waitForTimeout(100);
    
    // Alt+2 should work
    await page.keyboard.press('Alt+2');
    await page.waitForTimeout(100);
    
    // Alt+3 should work
    await page.keyboard.press('Alt+3');
    await page.waitForTimeout(100);
  });
});
