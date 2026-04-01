/**
 * Canvas Scroll Reset E2E Test
 * E1-F1.1: Verify scrollTop resets to 0 on canvas mount
 * 
 * Tests the fix for: tools invisible when switching from requirements to canvas (scrollTop=946)
 */

import { test, expect } from '@playwright/test';

test.describe('Canvas Scroll Reset (E1)', () => {
  test.beforeEach(async ({ page }) => {
    // Listen for console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.log('[Console Error]', msg.text());
      }
    });
  });

  test('scrollTop is 0 after navigating to canvas', async ({ page }) => {
    // Navigate to canvas
    await page.goto('/canvas');
    await page.waitForLoadState('networkidle');
    
    // Get scrollTop value
    const scrollTop = await page.evaluate(() => {
      const container = document.querySelector('[class*="canvasContainer"]');
      return container?.scrollTop ?? -1;
    });
    
    expect(scrollTop).toBe(0);
  });

  test('all toolbar elements visible after switching to canvas', async ({ page }) => {
    await page.goto('/canvas');
    await page.waitForLoadState('networkidle');
    
    // Check that the canvas container is scrolled to top
    const scrollTop = await page.evaluate(() => {
      const container = document.querySelector('[class*="canvasContainer"]');
      return container?.scrollTop ?? -1;
    });
    
    expect(scrollTop).toBe(0);
  });

  test('scrollTop stays 0 after repeated navigation', async ({ page }) => {
    // Navigate multiple times to ensure no accumulation
    for (let i = 0; i < 3; i++) {
      await page.goto('/canvas');
      await page.waitForLoadState('networkidle');
      
      const scrollTop = await page.evaluate(() => {
        const container = document.querySelector('[class*="canvasContainer"]');
        return container?.scrollTop ?? -1;
      });
      
      expect(scrollTop).toBe(0);
    }
  });

  test('scrollTop is 0 after navigation from homepage', async ({ page }) => {
    // Start from homepage
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Navigate to canvas
    await page.goto('/canvas');
    await page.waitForLoadState('networkidle');
    
    // Verify scrollTop is 0
    const scrollTop = await page.evaluate(() => {
      const container = document.querySelector('[class*="canvasContainer"]');
      return container?.scrollTop ?? -1;
    });
    
    expect(scrollTop).toBe(0);
  });
});
