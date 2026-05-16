/**
 * E5-S2: Design Review Tabs E2E Tests
 *
 * Sprint36-E5 — Design Review E2E 补全
 * Tests S5.2: Review results three-tab switching (Comments / Suggestions / Approved)
 *
 * PRD success metric: "E5 E2E 三 Tab — compliance/accessibility/reuse 可切换且数据正确"
 * PRD tab names: Comments (compliance), Suggestions (accessibility), Approved (reuse)
 *
 * Covers:
 * - Three tabs render with correct content
 * - Tab switching updates displayed content
 * - Tab counts are accurate
 * - Empty state shows when a tab has no data
 */

import { test, expect } from '@playwright/test';

test.describe('Sprint36-E5: Design Review Three Tabs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/design/dds-canvas');
    await page.waitForLoadState('networkidle');
  });

  test('S5.2-TC1: All three tabs are present when review completes', async ({ page }) => {
    // Mock API to return results with all three categories populated
    await page.route('**/api/mcp/review_design', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          canvasId: 'test-canvas-e5-tabs',
          aiScore: 78,
          summary: { totalNodes: 5, compliance: 2, accessibility: 1, reuse: 1 },
          compliance: [
            { id: 'c1', severity: 'warning', category: 'compliance', message: 'Primary color does not meet WCAG AA contrast ratio', location: '.header' },
            { id: 'c2', severity: 'critical', category: 'compliance', message: 'Missing alt text on decorative image', location: '.hero-img' },
          ],
          accessibility: [
            { id: 'a1', severity: 'info', category: 'accessibility', message: 'Consider adding aria-label to icon button', location: '.icon-btn' },
          ],
          reuse: [
            { id: 'r1', severity: 'info', category: 'reuse', message: 'Similar component exists in design system', location: '.custom-btn' },
          ],
          mcp: { called: true, fallback: null },
          reviewedAt: new Date().toISOString(),
        }),
      });
    });

    await page.click('[data-testid="design-review-btn"]');

    // Wait for panel to load
    await expect(page.locator('[data-testid="review-report-panel"]')).toBeVisible({ timeout: 8000 });

    // All three tabs should be visible
    await expect(page.locator('[data-testid="tab-compliance"]')).toBeVisible();
    await expect(page.locator('[data-testid="tab-accessibility"]')).toBeVisible();
    await expect(page.locator('[data-testid="tab-reuse"]')).toBeVisible();

    // Active tab should be compliance by default
    await expect(page.locator('[data-testid="tab-compliance"]')).toHaveAttribute('aria-selected', 'true');
  });

  test('S5.2-TC2: Switching tabs updates displayed content', async ({ page }) => {
    await page.route('**/api/mcp/review_design', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          canvasId: 'test-canvas-e5-tabs2',
          aiScore: 65,
          summary: { totalNodes: 3, compliance: 1, accessibility: 2, reuse: 0 },
          compliance: [
            { id: 'c1', severity: 'warning', category: 'compliance', message: 'Color contrast issue', location: '.title' },
          ],
          accessibility: [
            { id: 'a1', severity: 'info', category: 'accessibility', message: 'Low contrast text', location: '.subtitle' },
            { id: 'a2', severity: 'critical', category: 'accessibility', message: 'Missing focus indicator', location: '.input-field' },
          ],
          reuse: [],
          mcp: { called: true, fallback: null },
          reviewedAt: new Date().toISOString(),
        }),
      });
    });

    await page.click('[data-testid="design-review-btn"]');
    await expect(page.locator('[data-testid="review-report-panel"]')).toBeVisible({ timeout: 8000 });

    // Compliance tab: should show c1
    await expect(page.locator('[data-testid="tab-compliance"]')).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('[data-testid="message-c1"]')).toBeVisible();

    // Switch to accessibility tab: should show a1 and a2
    await page.locator('[data-testid="tab-accessibility"]').click();
    await expect(page.locator('[data-testid="tab-accessibility"]')).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('[data-testid="message-a1"]')).toBeVisible();
    await expect(page.locator('[data-testid="message-a2"]')).toBeVisible();

    // Switch to reuse tab: should be empty
    await page.locator('[data-testid="tab-reuse"]').click();
    await expect(page.locator('[data-testid="tab-reuse"]')).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('[data-testid="empty-reuse"]')).toBeVisible();
  });

  test('S5.2-TC3: Tab badges show correct counts', async ({ page }) => {
    await page.route('**/api/mcp/review_design', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          canvasId: 'test-canvas-e5-counts',
          aiScore: 88,
          summary: { totalNodes: 4, compliance: 3, accessibility: 1, reuse: 2 },
          compliance: [
            { id: 'c1', severity: 'warning', category: 'compliance', message: 'Issue 1', location: '.a' },
            { id: 'c2', severity: 'critical', category: 'compliance', message: 'Issue 2', location: '.b' },
            { id: 'c3', severity: 'info', category: 'compliance', message: 'Issue 3', location: '.c' },
          ],
          accessibility: [
            { id: 'a1', severity: 'info', category: 'accessibility', message: 'A11y issue', location: '.d' },
          ],
          reuse: [
            { id: 'r1', severity: 'info', category: 'reuse', message: 'Reuse 1', location: '.e' },
            { id: 'r2', severity: 'info', category: 'reuse', message: 'Reuse 2', location: '.f' },
          ],
          mcp: { called: true, fallback: null },
          reviewedAt: new Date().toISOString(),
        }),
      });
    });

    await page.click('[data-testid="design-review-btn"]');
    await expect(page.locator('[data-testid="review-report-panel"]')).toBeVisible({ timeout: 8000 });

    // Tab labels should contain count numbers
    const complianceTab = page.locator('[data-testid="tab-compliance"]');
    const accessibilityTab = page.locator('[data-testid="tab-accessibility"]');
    const reuseTab = page.locator('[data-testid="tab-reuse"]');

    const complianceText = await complianceTab.textContent();
    const accessibilityText = await accessibilityTab.textContent();
    const reuseText = await reuseTab.textContent();

    // Tab text should include the count (e.g., "Compliance (3)" or badge with "3")
    expect(complianceText).toMatch(/3/);
    expect(accessibilityText).toMatch(/1/);
    expect(reuseText).toMatch(/2/);
  });

  test('S5.2-TC4: Each tab has correct issue type — compliance shows severity badges', async ({ page }) => {
    await page.route('**/api/mcp/review_design', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          canvasId: 'test-canvas-e5-severity',
          aiScore: 70,
          summary: { totalNodes: 2, compliance: 2, accessibility: 0, reuse: 0 },
          compliance: [
            { id: 'c1', severity: 'critical', category: 'compliance', message: 'Critical compliance issue', location: '.btn' },
            { id: 'c2', severity: 'warning', category: 'compliance', message: 'Warning compliance issue', location: '.link' },
          ],
          accessibility: [],
          reuse: [],
          mcp: { called: true, fallback: null },
          reviewedAt: new Date().toISOString(),
        }),
      });
    });

    await page.click('[data-testid="design-review-btn"]');
    await expect(page.locator('[data-testid="review-report-panel"]')).toBeVisible({ timeout: 8000 });

    // Issue cards should show severity badges
    await expect(page.locator('[data-testid="badge-critical"]')).toBeVisible();
    await expect(page.locator('[data-testid="badge-warning"]')).toBeVisible();

    // Issue message should be visible
    await expect(page.locator('[data-testid="message-c1"]')).toContainText('Critical compliance issue');
    await expect(page.locator('[data-testid="message-c2"]')).toContainText('Warning compliance issue');

    // Location should be visible
    await expect(page.locator('[data-testid="location-c1"]')).toContainText('.btn');
    await expect(page.locator('[data-testid="location-c2"]')).toContainText('.link');
  });

  test('S5.2-TC5: Panel close button dismisses review panel', async ({ page }) => {
    await page.route('**/api/mcp/review_design', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          canvasId: 'test-canvas-e5-close',
          aiScore: 90,
          summary: { totalNodes: 1, compliance: 0, accessibility: 0, reuse: 0 },
          compliance: [],
          accessibility: [],
          reuse: [],
          mcp: { called: true, fallback: null },
          reviewedAt: new Date().toISOString(),
        }),
      });
    });

    await page.click('[data-testid="design-review-btn"]');
    await expect(page.locator('[data-testid="review-report-panel"]')).toBeVisible({ timeout: 8000 });

    // Close the panel
    await page.locator('[data-testid="panel-close"]').click();

    // Panel should be gone
    await expect(page.locator('[data-testid="review-report-panel"]')).not.toBeVisible();
  });
});
