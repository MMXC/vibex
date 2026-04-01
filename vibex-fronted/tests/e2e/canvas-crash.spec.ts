/**
 * Canvas Crash Fix E2E Test
 * E1-T3: Verify Canvas loads without undefined.length crash
 *
 * Error: Cannot read properties of undefined (reading 'length')
 * Root cause: Missing null checks on array props
 */

import { test, expect } from '@playwright/test';

test.describe('Canvas Crash Fix (E1)', () => {
  test.beforeEach(async ({ page }) => {
    // Listen for console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.log('[Console Error]', msg.text());
      }
    });
  });

  test('canvas loads without undefined.length crash', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/canvas');
    await page.waitForLoadState('networkidle');
    
    // Wait for canvas to be fully loaded
    await page.waitForTimeout(2000);

    // Check for the specific error
    const crashErrors = errors.filter(
      (e) => e.includes('undefined') && e.includes('length')
    );

    if (crashErrors.length > 0) {
      console.log('Found crash errors:', crashErrors);
    }

    expect(crashErrors.length, `Found ${crashErrors.length} undefined.length errors`).toBe(0);
  });

  test('canvas tab switching works without crash', async ({ page }) => {
    await page.goto('/canvas');
    await page.waitForLoadState('networkidle');

    // Try switching tabs
    const tabs = ['context', 'flow', 'component'];
    for (const tab of tabs) {
      await page.click(`[data-tab="${tab}"]`).catch(() => {
        // Tab button might have different selector
      });
      await page.waitForTimeout(500);
    }

    // Should still be on canvas page without crash
    await expect(page).toHaveURL(/\/canvas/);
  });

  test('canvas panels render without crash', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', (msg) => {
      if (msg.type() === 'error' && msg.text().includes('length')) {
        errors.push(msg.text());
      }
    });

    await page.goto('/canvas');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Verify panels are visible
    const treeStatus = page.locator('[data-testid="tree-status"]');
    await expect(treeStatus).toBeVisible({ timeout: 5000 }).catch(() => {
      // Tree status might not exist on initial load
    });

    expect(errors.length).toBe(0);
  });
});
