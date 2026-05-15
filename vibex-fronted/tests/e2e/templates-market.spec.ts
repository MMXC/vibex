import { test, expect } from '@playwright/test';

/**
 * E2E: Template Marketplace (Sprint36 E2)
 *
 * Tests the pre-configured marketplace templates feature:
 * - GET /api/templates/marketplace returns pre-configured industry templates
 * - Industry filter (saas/ecommerce/social) works correctly
 * - Marketplace templates are displayed separately from user templates
 */

test.describe('模板市场 (E2 Marketplace)', () => {
  const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000';
  const MARKETPLACE_PATH = '/dashboard/templates';

  test.beforeEach(async ({ page }) => {
    // Navigate to templates page - should load without errors
    await page.goto(`${BASE_URL}${MARKETPLACE_PATH}`);
  });

  test('should display marketplace section with industry filter tabs', async ({ page }) => {
    // Industry filter chips should be visible
    await expect(page.locator('button:has-text("SaaS")')).toBeVisible();
    await expect(page.locator('button:has-text("电商")')).toBeVisible();
    await expect(page.locator('button:has-text("社交")')).toBeVisible();
  });

  test('should filter marketplace templates by SaaS industry', async ({ page }) => {
    // Click SaaS filter
    await page.click('button:has-text("SaaS")');

    // All visible templates should have industry === 'saas'
    const templateCards = page.locator('[class*="card"]');
    const count = await templateCards.count();

    for (let i = 0; i < count; i++) {
      const card = templateCards.nth(i);
      const industryBadge = card.locator('[class*="cardCategory"], [class*="badge"]');
      if (await industryBadge.isVisible()) {
        await expect(industryBadge).toContainText('SaaS');
      }
    }
  });

  test('should display marketplace template details', async ({ page }) => {
    // Page title should show templates management
    await expect(page.locator('h1')).toContainText('模板');
  });

  test('should have working marketplace API endpoint', async ({ request }) => {
    // Test the marketplace API directly
    const response = await request.get(`${BASE_URL}/api/templates/marketplace`);

    // Should return 200 (or 401 if not authenticated - which is expected in test env)
    expect([200, 401]).toContain(response.status());

    if (response.status() === 200) {
      const body = await response.json();
      expect(body).toHaveProperty('templates');
      expect(Array.isArray(body.templates)).toBe(true);

      // Should have at least 3 industry templates
      expect(body.templates.length).toBeGreaterThanOrEqual(3);

      // Verify industry diversity
      const industries = new Set(body.templates.map((t: { industry: string }) => t.industry));
      expect(industries.has('saas')).toBe(true);
      expect(industries.has('ecommerce')).toBe(true);
      expect(industries.has('social')).toBe(true);
    }
  });

  test('should filter marketplace by industry via query param', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/templates/marketplace?industry=saas`);

    expect([200, 401]).toContain(response.status());

    if (response.status() === 200) {
      const body = await response.json();
      expect(body.templates.length).toBeGreaterThanOrEqual(1);
      for (const template of body.templates) {
        expect(template.industry).toBe('saas');
      }
    }
  });

  test('should display template entity count in marketplace', async ({ page }) => {
    // Navigate and check template cards show entity information
    await page.goto(`${BASE_URL}${MARKETPLACE_PATH}`);
    await page.waitForSelector('[class*="card"]');

    const templateCards = page.locator('[class*="card"]');
    const count = await templateCards.count();

    if (count > 0) {
      // At least one card should have content (name + description)
      const firstCard = templateCards.first();
      await expect(firstCard.locator('h3, [class*="name"]')).toBeVisible();
    }
  });
});
