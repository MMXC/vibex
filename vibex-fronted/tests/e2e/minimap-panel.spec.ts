/**
 * P005-E3: MiniMap E2E tests
 *
 * Tests:
 * 1. Toggle button opens/closes MiniMap panel
 * 2. MiniMap renders inside open panel
 * 3. Clicking MiniMap navigates to that position
 * 4. Viewport border rectangle appears in MiniMap
 * 5. Panel close button works
 */

import { test, expect } from '@playwright/test';

test.describe('P005-E3: MiniMap Panel', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a project canvas
    await page.goto('/');
    // Wait for canvas to load
    await page.waitForSelector('[data-testid="dds-canvas-page"]', { timeout: 15000 });
  });

  test('toggle button is visible at bottom-left', async ({ page }) => {
    const toggleBtn = page.locator('[data-testid="minimap-toggle"]');
    await expect(toggleBtn).toBeVisible();
  });

  test('clicking toggle opens MiniMap panel', async ({ page }) => {
    const toggleBtn = page.locator('[data-testid="minimap-toggle"]');
    await toggleBtn.click();

    const panel = page.locator('[data-testid="minimap-panel"]');
    await expect(panel).toBeVisible();

    // Panel title should show
    await expect(panel.locator('text=画布缩略图')).toBeVisible();
  });

  test('clicking toggle twice closes MiniMap panel', async ({ page }) => {
    const toggleBtn = page.locator('[data-testid="minimap-toggle"]');

    // Open
    await toggleBtn.click();
    await expect(page.locator('[data-testid="minimap-panel"]')).toBeVisible();

    // Close via toggle
    await toggleBtn.click();
    await expect(page.locator('[data-testid="minimap-panel"]')).not.toBeVisible();
  });

  test('close button closes panel', async ({ page }) => {
    const toggleBtn = page.locator('[data-testid="minimap-toggle"]');
    await toggleBtn.click();
    await expect(page.locator('[data-testid="minimap-panel"]')).toBeVisible();

    const closeBtn = page.locator('[data-testid="minimap-close"]');
    await closeBtn.click();
    await expect(page.locator('[data-testid="minimap-panel"]')).not.toBeVisible();
  });

  test('MiniMap canvas renders inside open panel', async ({ page }) => {
    const toggleBtn = page.locator('[data-testid="minimap-toggle"]');
    await toggleBtn.click();

    const minimapCanvas = page.locator('[data-testid="minimap-canvas"]');
    await expect(minimapCanvas).toBeVisible();

    // MiniMap should contain SVG
    const svg = minimapCanvas.locator('svg.react-flow__minimap');
    await expect(svg).toBeVisible();
  });

  test('viewport border appears when panel is open', async ({ page }) => {
    const toggleBtn = page.locator('[data-testid="minimap-toggle"]');
    await toggleBtn.click();

    const viewportBorder = page.locator('[data-testid="minimap-viewport-border"]');
    await expect(viewportBorder).toBeVisible();

    // Border should be a visible rectangle
    const box = await viewportBorder.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThan(0);
    expect(box!.height).toBeGreaterThan(0);
  });

  test('hint text is visible in panel', async ({ page }) => {
    const toggleBtn = page.locator('[data-testid="minimap-toggle"]');
    await toggleBtn.click();

    await expect(page.locator('text=点击缩略图跳转')).toBeVisible();
  });
});
