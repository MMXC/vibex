/**
 * Canvas Initial Scroll Reset E2E Test
 * E1: scrollTop resets on canvas mount (rAF × 2)
 * 
 * Tests: rAF-based scroll reset after navigation to canvas
 */

import { test, expect } from '@playwright/test';

test.describe('Canvas Initial Scroll Reset (E1)', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.log('[Console Error]', msg.text());
      }
    });
  });

  test('scrollTop is 0 after direct navigation to canvas', async ({ page }) => {
    await page.goto('/canvas');
    await page.waitForLoadState('networkidle');
    
    // Wait for rAF × 2 to execute
    await page.waitForFunction(() => {
      const container = document.querySelector('[class*="canvasContainer"]');
      return container?.scrollTop === 0;
    }, { timeout: 3000 });
    
    const scrollTop = await page.evaluate(() => {
      const container = document.querySelector('[class*="canvasContainer"]');
      return container?.scrollTop ?? -1;
    });
    
    expect(scrollTop).toBe(0);
  });

  test('scrollTop is 0 after navigation from homepage', async ({ page }) => {
    // Start from homepage
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Navigate to canvas
    await page.goto('/canvas');
    await page.waitForLoadState('networkidle');
    
    // Wait for rAF × 2 to execute
    await page.waitForFunction(() => {
      const container = document.querySelector('[class*="canvasContainer"]');
      return container?.scrollTop === 0;
    }, { timeout: 3000 });
    
    const scrollTop = await page.evaluate(() => {
      const container = document.querySelector('[class*="canvasContainer"]');
      return container?.scrollTop ?? -1;
    });
    
    expect(scrollTop).toBe(0);
  });

  test('scrollTop stays 0 after refresh', async ({ page }) => {
    await page.goto('/canvas');
    await page.waitForLoadState('networkidle');
    
    // Refresh
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Wait for rAF × 2 to execute
    await page.waitForFunction(() => {
      const container = document.querySelector('[class*="canvasContainer"]');
      return container?.scrollTop === 0;
    }, { timeout: 3000 });
    
    const scrollTop = await page.evaluate(() => {
      const container = document.querySelector('[class*="canvasContainer"]');
      return container?.scrollTop ?? -1;
    });
    
    expect(scrollTop).toBe(0);
  });
});
