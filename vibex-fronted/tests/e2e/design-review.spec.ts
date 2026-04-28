import { test, expect } from '@playwright/test';

test.describe('S16-P0-1: Design Review UI', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to DDS canvas
    await page.goto('/dds');
    await page.waitForLoadState('networkidle');
  });

  test('Opens review panel via toolbar button', async ({ page }) => {
    await page.click('[data-testid="design-review-btn"]');
    await page.waitForSelector('[data-testid="review-report-panel"]', { timeout: 5000 });
    await expect(page.locator('[data-testid="panel-title"]')).toHaveText('Design Review Report');
  });

  test('Ctrl+Shift+R triggers review panel', async ({ page }) => {
    await page.keyboard.press('Control+Shift+R');
    await page.waitForSelector('[data-testid="review-report-panel"]', { timeout: 5000 });
  });

  test('Panel shows three tabs', async ({ page }) => {
    await page.click('[data-testid="design-review-btn"]');
    await page.waitForSelector('[data-testid="panel-tabs"]');
    await expect(page.locator('[data-testid="tab-compliance"]')).toBeVisible();
    await expect(page.locator('[data-testid="tab-accessibility"]')).toBeVisible();
    await expect(page.locator('[data-testid="tab-reuse"]')).toBeVisible();
  });

  test('Clicking tab shows filtered issues', async ({ page }) => {
    await page.click('[data-testid="design-review-btn"]');
    await page.waitForSelector('[data-testid="tab-content"]');
    await page.click('[data-testid="tab-accessibility"]');
    await expect(page.locator('[data-testid="tab-accessibility"]')).toHaveAttribute('aria-selected', 'true');
    await page.click('[data-testid="tab-reuse"]');
    await expect(page.locator('[data-testid="tab-reuse"]')).toHaveAttribute('aria-selected', 'true');
  });

  test('Close button dismisses panel', async ({ page }) => {
    await page.click('[data-testid="design-review-btn"]');
    await page.waitForSelector('[data-testid="review-report-panel"]');
    await page.click('[data-testid="panel-close"]');
    await expect(page.locator('[data-testid="review-report-panel"]')).not.toBeVisible();
  });

  test('Shows loading state while reviewing', async ({ page }) => {
    await page.click('[data-testid="design-review-btn"]');
    await page.waitForSelector('[data-testid="panel-loading"]', { timeout: 2000 });
  });

  test('Design review button has correct aria-label', async ({ page }) => {
    const btn = page.locator('[data-testid="design-review-btn"]');
    await expect(btn).toHaveAttribute('aria-label', 'Design Review');
  });
});
