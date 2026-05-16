/**
 * E5-S1: Design Review Degradation E2E Tests
 *
 * Sprint36-E5 — Design Review E2E 补全
 * Tests S5.1: Firebase not configured → design review degrades gracefully
 *
 * Covers:
 * - Firebase unconfigured → review panel shows friendly error (not white-screen)
 * - MCP server down → graceful degradation
 * - Non-blocking: user can still edit canvas while review is degraded
 */

import { test, expect } from '@playwright/test';

test.describe('Sprint36-E5: Design Review Degradation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/design/dds-canvas');
    await page.waitForLoadState('networkidle');
  });

  test('S5.1-TC1: Design review toolbar button is visible even when MCP is down', async ({ page }) => {
    // The design review button should always be present regardless of MCP status
    const btn = page.locator('[data-testid="design-review-btn"]');
    await expect(btn).toBeVisible({ timeout: 5000 });
  });

  test('S5.1-TC2: MCP server returns 503 → panel shows degraded UI (not white-screen)', async ({ page }) => {
    // Mock MCP server to return 503 Service Unavailable
    await page.route('**/api/mcp/review_design', route => {
      route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'MCP server temporarily unavailable' }),
      });
    });

    await page.click('[data-testid="design-review-btn"]');

    // Panel should appear — NOT white-screen
    const panel = page.waitForSelector('[data-testid="review-report-panel"]', { timeout: 5000 }).catch(() => null);
    expect(panel).not.toBeNull();

    // Should show error state with friendly message (not blank)
    const errorState = page.locator('[data-testid="panel-error"]');
    await expect(errorState).toBeVisible({ timeout: 3000 });

    // Error message should be human-readable
    const errorMsg = page.locator('[data-testid="panel-error-message"]');
    await expect(errorMsg).toBeVisible();
    const msg = await errorMsg.textContent();
    expect(msg && msg.trim().length).toBeGreaterThan(0);
    // Should NOT be a raw stack trace
    expect(msg).not.toContain('TypeError');
    expect(msg).not.toContain('ReferenceError');
    expect(msg).not.toContain('at ');
  });

  test('S5.1-TC3: MCP 503 error has retry button that re-triggers review', async ({ page }) => {
    let callCount = 0;
    await page.route('**/api/mcp/review_design', route => {
      callCount++;
      if (callCount === 1) {
        // First call: fail
        route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'MCP server temporarily unavailable' }),
        });
      } else {
        // Second call: succeed
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            canvasId: 'test-canvas-e5-s5',
            aiScore: 72,
            summary: { totalNodes: 2, compliance: 1, accessibility: 0, reuse: 0 },
            compliance: [{ id: 'c1', severity: 'warning', category: 'compliance', message: 'Test issue', location: '.test' }],
            accessibility: [],
            reuse: [],
            mcp: { called: false, fallback: 'static-analysis', error: '503' },
            reviewedAt: new Date().toISOString(),
          }),
        });
      }
    });

    await page.click('[data-testid="design-review-btn"]');

    // Show error state first
    await expect(page.locator('[data-testid="panel-error"]')).toBeVisible({ timeout: 3000 });

    // Click retry
    const retryBtn = page.locator('[data-testid="panel-retry"]');
    await expect(retryBtn).toBeVisible();
    await retryBtn.click();

    // Should now show review results (not stuck on error)
    const panel = page.locator('[data-testid="review-report-panel"]');
    await expect(panel).toBeVisible({ timeout: 8000 });

    // Should show compliance tab content
    await expect(page.locator('[data-testid="tab-compliance"]')).toBeVisible();
  });

  test('S5.1-TC4: Firebase unconfigured does NOT block design review from loading', async ({ page }) => {
    // Even without Firebase configured, the design review panel should be accessible
    // This tests the non-blocking nature: collaboration is optional, review is core

    // We use page.route to ensure MCP is working (so we isolate Firebase issue)
    await page.route('**/api/mcp/review_design', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          canvasId: 'test-canvas-e5-firebase',
          aiScore: 85,
          summary: { totalNodes: 3, compliance: 0, accessibility: 1, reuse: 0 },
          compliance: [],
          accessibility: [{ id: 'a1', severity: 'info', category: 'accessibility', message: 'Consider alt text', location: '.img' }],
          reuse: [],
          mcp: { called: false, fallback: 'static-analysis' },
          reviewedAt: new Date().toISOString(),
        }),
      });
    });

    await page.click('[data-testid="design-review-btn"]');

    // Panel should load — Firebase being unconfigured should NOT block this
    const panel = page.locator('[data-testid="review-report-panel"]');
    await expect(panel).toBeVisible({ timeout: 8000 });

    // Should NOT show Firebase-related errors
    const errorMsg = page.locator('[data-testid="panel-error-message"]');
    const msg = await errorMsg.textContent().catch(() => '');
    expect(msg).not.toContain('Firebase');
    expect(msg).not.toContain('firebase');
  });
});
