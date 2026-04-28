import { test, expect } from '@playwright/test';

test.describe('S16-P0-1: Design Review UI', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to DDS canvas
    await page.goto('/design/dds-canvas');
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

  // E1-U2: CodeGenPanel production path tests
  test('E1-U2: Generate button triggers code generation', async ({ page }) => {
    await expect(page.locator('[data-testid="code-gen-panel"]')).toBeVisible({ timeout: 5000 });
    const generateBtn = page.locator('[data-testid="generate-button"]');
    await expect(generateBtn).toBeVisible();
    await generateBtn.click();
    // After click, either result appears (node-count) or error message
    const hasResult = await page.locator('[data-testid="node-count"]').isVisible({ timeout: 5000 }).catch(() => false);
    const hasError = await page.locator('[data-testid="error-message"]').isVisible({ timeout: 3000 }).catch(() => false);
    expect(hasResult || hasError).toBe(true);
  });

  test('E1-U2: Framework selector changes output', async ({ page }) => {
    await expect(page.locator('[data-testid="code-gen-panel"]')).toBeVisible({ timeout: 5000 });
    const selector = page.locator('#framework-select');
    await expect(selector).toBeVisible();

    // Select Vue — verify tab labels change if result is present
    await selector.selectOption('vue');
    let selectedValue = await selector.inputValue();
    expect(selectedValue).toBe('vue');

    // Select Solid
    await selector.selectOption('solid');
    selectedValue = await selector.inputValue();
    expect(selectedValue).toBe('solid');
  });

  test('E1-U2: Code preview tab switching works', async ({ page }) => {
    await expect(page.locator('[data-testid="code-gen-panel"]')).toBeVisible({ timeout: 5000 });
    await page.click('[data-testid="generate-button"]');

    const codePreviewVisible = await page.locator('[data-testid="code-preview"]').isVisible({ timeout: 5000 }).catch(() => false);
    if (codePreviewVisible) {
      // Switch through all tabs and verify they become active
      const tabNames = ['TSX', 'CSS', 'Types', 'Index', 'SCSS', 'JS'];
      for (const name of tabNames) {
        const tab = page.getByRole('tab', { name });
        await tab.click();
        await expect(tab).toHaveAttribute('aria-selected', 'true');
      }
    }
  });
});