/**
 * Tree Panel Scroll Reset E2E Test
 * E1-F1.1: Verify scrollTop resets when tree panel expands
 * 
 * Tests the fix for: tree panel scroll position not reset when collapsed → expanded
 */

import { test, expect } from '@playwright/test';

test.describe('Tree Panel Scroll Reset (E1)', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.log('[Console Error]', msg.text());
      }
    });
  });

  test('scrollTop resets when panel expands', async ({ page }) => {
    await page.goto('/canvas');
    await page.waitForLoadState('networkidle');
    
    // Find a tree panel body element
    const panelBody = page.locator('[class*="treePanelBody"]').first();
    
    // Scroll the panel
    await panelBody.evaluate((el) => {
      el.scrollTop = 200;
    });
    
    // Get current scrollTop
    const scrollBefore = await panelBody.evaluate((el) => el.scrollTop);
    expect(scrollBefore).toBe(200);
    
    // Collapse the panel using force:true to bypass intercept
    const toggleBtn = page.locator('[class*="treePanelChevron"]').first();
    await toggleBtn.click({ force: true });
    
    // Expand the panel and wait for scroll reset
    await toggleBtn.click({ force: true });
    await page.waitForFunction(() => {
      const el = document.querySelector('[class*="treePanelBody"]');
      return el && el.scrollTop === 0;
    }, { timeout: 3000 });
    
    // Verify scrollTop is reset to 0
    const scrollAfter = await panelBody.evaluate((el) => el.scrollTop);
    expect(scrollAfter).toBe(0);
  });

  test('scrollTop resets for multiple tree panels', async ({ page }) => {
    await page.goto('/canvas');
    await page.waitForLoadState('networkidle');
    
    // Test context tree panel
    const contextPanel = page.locator('[class*="boundedContextTree"]').first();
    if (await contextPanel.count() > 0) {
      await contextPanel.evaluate((el) => {
        el.scrollTop = 150;
      });
      
      const toggleBtn = page.locator('[class*="treePanelChevron"]').first();
      await toggleBtn.click({ force: true });
      await toggleBtn.click({ force: true });
      await page.waitForFunction(() => {
        const el = document.querySelector('[class*="boundedContextTree"]');
        return el && el.scrollTop === 0;
      }, { timeout: 3000 });
      
      const scrollAfter = await contextPanel.evaluate((el) => el.scrollTop);
      expect(scrollAfter).toBe(0);
    }
  });

  test('no flicker on expand', async ({ page }) => {
    await page.goto('/canvas');
    await page.waitForLoadState('networkidle');
    
    const panelBody = page.locator('[class*="treePanelBody"]').first();
    const toggleBtn = page.locator('[class*="treePanelChevron"]').first();
    
    // Scroll first
    await panelBody.evaluate((el) => {
      el.scrollTop = 200;
    });
    
    // Collapse using force
    await toggleBtn.click({ force: true });
    
    // Expand and wait for animation
    await toggleBtn.click({ force: true });
    await page.waitForFunction(() => {
      const el = document.querySelector('[class*="treePanelBody"]');
      return el && el.scrollTop === 0;
    }, { timeout: 5000 });
    
    // Final state should be 0
    const finalScroll = await panelBody.evaluate((el) => el.scrollTop);
    expect(finalScroll).toBe(0);
  });
});
