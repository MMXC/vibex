/**
 * E2E — Component Tree JSON Preview
 *
 * Tests for the JSON tree preview feature (Phase 4):
 * - JSON preview button visible in component tree toolbar
 * - Clicking button opens modal
 * - Modal shows correct data structure (pageId, pageName, componentCount)
 * - Close button and overlay click close the modal
 *
 * Run: pnpm playwright test tests/e2e/component-tree-json.spec.ts
 */

import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const CANVAS_URL = `${BASE_URL}/canvas`;

/**
 * Navigate to canvas with example data loaded.
 * The JSON preview button only appears after entering context/input phase.
 */
async function goToCanvasWithData(page: Page) {
  await page.goto(CANVAS_URL);
  await page.waitForLoadState('domcontentloaded');

  // Skip onboarding if present
  const skipBtn = page
    .locator('button:has-text("跳过"), button:has-text("Skip"), button:has-text("开始使用"), button:has-text("Got it")')
    .first();
  if (await skipBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await skipBtn.click();
    await page.waitForLoadState('networkidle').catch(() => {});
  }

  // Click "导入示例" to get into context phase (component tree + JSON button only show after input phase)
  const importBtn = page.locator('button:has-text("导入示例")');
  if (await importBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await importBtn.click();
    await page.waitForLoadState('networkidle').catch(() => {});
  }

  // Wait for component tree to be ready
  await page.waitForLoadState('networkidle').catch(() => {});
}

test.describe('Component Tree JSON Preview', () => {
  test.beforeEach(async ({ page }) => {
    await goToCanvasWithData(page);
  });

  test.afterEach(async ({ page }) => {
    await page.evaluate(() => localStorage.clear());
  });

  test('JSON preview button is visible in component tree toolbar', async ({ page }) => {
    // Wait for component tree to load
    await page.waitForSelector('[data-testid="component-tree"]', { timeout: 10000 });

    // Verify JSON preview button is present and visible
    const jsonButton = page.getByTestId('json-preview-button');
    await expect(jsonButton).toBeVisible();
  });

  test('clicking JSON button opens the preview modal', async ({ page }) => {
    await page.waitForSelector('[data-testid="component-tree"]', { timeout: 10000 });

    // Modal should not be visible initially
    const modal = page.getByTestId('json-tree-preview-modal');
    await expect(modal).not.toBeVisible();

    // Click JSON preview button
    const jsonButton = page.getByTestId('json-preview-button');
    await jsonButton.click();

    // Modal should now be visible
    await expect(modal).toBeVisible({ timeout: 5000 });
  });

  test('modal shows correct data structure fields (pageId, pageName, componentCount)', async ({ page }) => {
    await page.waitForSelector('[data-testid="component-tree"]', { timeout: 10000 });

    // Open modal
    const jsonButton = page.getByTestId('json-preview-button');
    await jsonButton.click();

    const modal = page.getByTestId('json-tree-preview-modal');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Verify expected data structure fields appear in the modal
    // pageId and pageName come from ComponentGroup metadata
    // componentCount comes from ComponentGroup.componentCount
    await expect(page.getByText(/pageId/).first()).toBeVisible();
    await expect(page.getByText(/pageName/).first()).toBeVisible();
    await expect(page.getByText(/componentCount/).first()).toBeVisible();
  });

  test('close button closes the modal', async ({ page }) => {
    await page.waitForSelector('[data-testid="component-tree"]', { timeout: 10000 });

    // Open modal
    const jsonButton = page.getByTestId('json-preview-button');
    await jsonButton.click();

    const modal = page.getByTestId('json-tree-preview-modal');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Click close button
    const closeButton = page.getByTestId('json-tree-modal-close');
    await closeButton.click();

    // Modal should be gone
    await expect(modal).not.toBeVisible({ timeout: 3000 });
  });

  test('clicking overlay closes the modal', async ({ page }) => {
    await page.waitForSelector('[data-testid="component-tree"]', { timeout: 10000 });

    // Open modal
    const jsonButton = page.getByTestId('json-preview-button');
    await jsonButton.click();

    const modal = page.getByTestId('json-tree-preview-modal');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Click outside the modal (on the overlay)
    await page.mouse.click(10, 10);

    // Modal should be gone
    await expect(modal).not.toBeVisible({ timeout: 3000 });
  });
});
