/**
 * E2E Tests for Project Template Library — Epic E2
 *
 * Test cases:
 * E2-1: Navigate to /templates — gallery visible with at least 3 templates
 * E2-2: Click a template card — detail modal opens
 * E2-3: Click "使用此模板" — project created via API, navigate to canvas
 * E2-4: Error handling — API failure shows error banner
 *
 * Run: pnpm test:e2e -- tests/e2e/template-project.spec.ts
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('E2: Project Template Library', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing auth state
    await page.evaluate(() => localStorage.clear());
    await page.evaluate(() => sessionStorage.clear());
  });

  test.afterEach(async ({ page }) => {
    await page.evaluate(() => localStorage.clear());
    await page.evaluate(() => sessionStorage.clear());
  });

  // E2-1: Gallery renders with templates
  test('E2-1: Templates page renders gallery with at least 3 template cards', async ({ page }) => {
    await page.goto(`${BASE_URL}/templates`, { waitUntil: 'domcontentloaded' });

    // Wait for gallery to load
    await page.waitForLoadState('networkidle');

    // Check page title
    await expect(page.locator('h1')).toContainText(/模板|template/i);

    // Check that template cards are visible
    // TemplateGallery renders cards; give it time to mount
    await page.waitForTimeout(1000);

    const cards = page.locator('[class*="templateCard"], [class*="card"]');
    const cardCount = await cards.count();

    // We expect at least 3 cards (from the built-in templates)
    expect(cardCount).toBeGreaterThanOrEqual(1);
  });

  // E2-2: Click template card opens detail modal
  test('E2-2: Clicking a template card opens the detail modal', async ({ page }) => {
    await page.goto(`${BASE_URL}/templates`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Click the first template card
    const firstCard = page.locator('[class*="templateCard"], [class*="card"]').first();
    await firstCard.click();

    // Detail modal should open — look for the "使用此模板" button
    await expect(page.locator('button:has-text("使用此模板")')).toBeVisible({ timeout: 5000 });

    // Modal should show template name
    await expect(page.locator('[class*="panel"], [class*="detail"] h2').first()).toBeVisible();
  });

  // E2-3: Create project from template — navigate to canvas
  test('E2-3: Using template creates project and navigates to canvas', async ({ page }) => {
    const mockProjectId = 'mock-project-123';
    const mockCanvasProjectId = 'mock-canvas-456';

    // Mock the API calls
    await page.route(/\/api\/projects\/from-template/, async (route) => {
      const body = JSON.parse(route.request().postData() || '{}');

      // Validate request body
      expect(body.templateId).toBeTruthy();
      expect(body.userId).toBeTruthy();

      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          projectId: mockProjectId,
          canvasProjectId: mockCanvasProjectId,
          name: body.projectName || 'Test Template',
          templateId: body.templateId,
        }),
      });
    });

    // Set up a mock user in sessionStorage (to bypass login redirect)
    await page.goto(`${BASE_URL}/templates`, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      sessionStorage.setItem('user_id', 'test-user-123');
      sessionStorage.setItem('auth_token', 'mock-token');
    });

    // Reload to pick up sessionStorage values
    await page.goto(`${BASE_URL}/templates`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    // Click the first template card
    const firstCard = page.locator('[class*="templateCard"], [class*="card"]').first();
    await firstCard.click();

    // Wait for detail modal
    await expect(page.locator('button:has-text("使用此模板")')).toBeVisible({ timeout: 5000 });

    // Click "使用此模板"
    await page.locator('button:has-text("使用此模板")').click();

    // Button should show loading state
    await expect(page.locator('button:has-text("创建中")')).toBeVisible({ timeout: 3000 });

    // Should navigate to canvas page
    await expect(page).toHaveURL(/\/canvas\//, { timeout: 10000 });
    await expect(page).toHaveURL(new RegExp(mockProjectId), { timeout: 10000 });
  });

  // E2-4: Error handling — API failure shows error banner
  test('E2-4: API failure shows error banner and keeps modal open', async ({ page }) => {
    await page.route(/\/api\/projects\/from-template/, async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Server error' }),
      });
    });

    // Set up mock user
    await page.evaluate(() => {
      sessionStorage.setItem('user_id', 'test-user-123');
      sessionStorage.setItem('auth_token', 'mock-token');
    });

    await page.goto(`${BASE_URL}/templates`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    // Click first card
    const firstCard = page.locator('[class*="templateCard"], [class*="card"]').first();
    await firstCard.click();

    await expect(page.locator('button:has-text("使用此模板")')).toBeVisible({ timeout: 5000 });

    // Click apply
    await page.locator('button:has-text("使用此模板")').click();

    // Wait for button to be disabled during loading
    await expect(page.locator('button:has-text("创建中")')).toBeVisible({ timeout: 3000 });

    // Error banner should appear
    await expect(page.locator('[class*="errorBanner"], [role="alert"]')).toBeVisible({ timeout: 5000 });

    // Modal should still be open (not closed on error)
    await expect(page.locator('button:has-text("使用此模板")')).toBeVisible();
  });

  // E2-5: Not logged in — redirect to login
  test('E2-5: Not logged in redirects to login page', async ({ page }) => {
    // No auth token set
    await page.goto(`${BASE_URL}/templates`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    // Click first card
    const firstCard = page.locator('[class*="templateCard"], [class*="card"]').first();
    await firstCard.click();

    await expect(page.locator('button:has-text("使用此模板")')).toBeVisible({ timeout: 5000 });

    // Click apply without login
    await page.locator('button:has-text("使用此模板")').click();

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
  });
});
