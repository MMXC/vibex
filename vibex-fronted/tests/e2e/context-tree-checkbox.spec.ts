/**
 * Canvas Context Tree Checkbox E2E Tests
 * F1.1-F1.4: Selection checkbox in context tree cards
 */

import { test, expect } from '@playwright/test';

test.describe('Context Tree Selection Checkbox', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/canvas');
    await page.waitForLoadState('networkidle');
  });

  test('F1.1: checkbox visible in card header', async ({ page }) => {
    // Find any context card with checkbox
    const card = page.locator('[data-testid^="context-card-"]').first();
    await expect(card).toBeVisible();
    
    const checkbox = card.locator('input[type="checkbox"]').first();
    await expect(checkbox).toBeVisible();
  });

  test('F1.2: clicking checkbox toggles selected state', async ({ page }) => {
    const card = page.locator('[data-testid^="context-card-"]').first();
    await card.waitFor({ state: 'visible', timeout: 5000 });
    
    // Get the card's nodeId from data attribute
    const nodeId = await card.getAttribute('data-node-id');
    const checkbox = page.locator(`[data-testid="context-card-checkbox-${nodeId}"]`);
    
    // Initially may or may not be selected
    await checkbox.click();
    await page.waitForTimeout(100);
    
    // Card should now have selected class or be visually highlighted
    await expect(card).toHaveClass(/nodeCardSelected/);
    
    // Click again to deselect
    await checkbox.click();
    await page.waitForTimeout(100);
  });

  test('F1.3: Ctrl+click on card body toggles selection', async ({ page }) => {
    const card = page.locator('[data-testid^="context-card-"]').first();
    await card.waitFor({ state: 'visible', timeout: 5000 });
    
    // Ctrl+click on card body
    await card.click({ modifiers: ['Control'] });
    await page.waitForTimeout(100);
    
    // Card should be selected
    await expect(card).toHaveClass(/nodeCardSelected/);
    
    // Ctrl+click again to deselect
    await card.click({ modifiers: ['Control'] });
    await page.waitForTimeout(100);
  });

  test('F1.4: selected card has highlight style', async ({ page }) => {
    const card = page.locator('[data-testid^="context-card-"]').first();
    await card.waitFor({ state: 'visible', timeout: 5000 });
    
    // Get the card's nodeId
    const nodeId = await card.getAttribute('data-node-id');
    const checkbox = page.locator(`[data-testid="context-card-checkbox-${nodeId}"]`);
    
    // Click checkbox to select
    await checkbox.click();
    await page.waitForTimeout(200);
    
    // Verify selected class is applied (CSS: border-color + box-shadow)
    await expect(card).toHaveClass(/nodeCardSelected/);
    
    // Click again to deselect
    await checkbox.click();
    await page.waitForTimeout(200);
    
    // Verify class is removed
    await expect(card).not.toHaveClass(/nodeCardSelected/);
  });
});
