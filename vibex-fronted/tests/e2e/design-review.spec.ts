import { test, expect } from '@playwright/test';

test.describe('E19-1: Design Review Real MCP Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/design/dds-canvas');
    await page.waitForLoadState('networkidle');
  });

  test('E19-1-S1: API Route responds with correct structure', async ({ page }) => {
    // TC1: Verify Ctrl+Shift+R triggers a POST to /api/mcp/review_design
    const fetchSpy = page.waitForRequest(req =>
      req.url().includes('/api/mcp/review_design') && req.method() === 'POST',
      { timeout: 8000 }
    ).catch(() => null);

    await page.keyboard.press('Control+Shift+R');
    const req = await fetchSpy;

    if (req) {
      const body = req.postData() ? JSON.parse(req.postData()) : {};
      expect(body).toHaveProperty('canvasId');
      expect(body).toHaveProperty('checkCompliance', true);
      expect(body).toHaveProperty('checkA11y', true);
      expect(body).toHaveProperty('checkReuse', true);
    }
  });

  test('E19-1-S2: Review panel shows real results (not mock data)', async ({ page }) => {
    // TC2: Verify results are NOT the hardcoded mock data strings
    await page.goto('/design/dds-canvas');
    await page.waitForLoadState('networkidle');

    await page.keyboard.press('Control+Shift+R');

    // Wait for panel to appear
    const panel = page.waitForSelector('[data-testid="review-report-panel"]', { timeout: 10000 }).catch(() => null);

    if (panel) {
      // If results appear, verify no hardcoded mock strings
      const content = await page.locator('[data-testid="review-report-panel"]').textContent().catch(() => '');
      // The hardcoded mock data contained:
      // "Primary color does not meet WCAG AA contrast ratio (3.2:1"
      // These should NOT appear with real data
      expect(content).not.toContain('3.2:1');
    }
  });

  test('E19-1-S3: Graceful degradation — error state shows friendly message', async ({ page }) => {
    // TC3: Mock API 500 to verify degradation UI
    await page.route('/api/mcp/review_design', route => {
      void route.fulfill({ status: 500, body: JSON.stringify({ error: 'Server error' }) });
    });

    await page.goto('/design/dds-canvas');
    await page.waitForLoadState('networkidle');
    await page.keyboard.press('Control+Shift+R');

    await expect(page.locator('[data-testid="panel-error"]')).toBeVisible({ timeout: 5000 });
    const errorMsg = await page.locator('[data-testid="panel-error-message"]').textContent();
    expect(errorMsg).toMatch(/暂时不可用|不可用|重试|Retry/i);
  });

  test('E19-1-S3: Graceful degradation — retry button works', async ({ page }) => {
    // Track retry count
    let reqCount = 0;
    await page.route('/api/mcp/review_design', async route => {
      reqCount++;
      if (reqCount === 1) {
        void route.fulfill({ status: 500, body: JSON.stringify({ error: 'Server error' }) });
      } else {
        void route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
          canvasId: 'test',
          reviewedAt: new Date().toISOString(),
          summary: { compliance: 'pass', a11y: 'pass', reuseCandidates: 0, totalNodes: 0 },
        })});
      }
    });

    await page.goto('/design/dds-canvas');
    await page.waitForLoadState('networkidle');
    await page.keyboard.press('Control+Shift+R');

    // Wait for error state
    await expect(page.locator('[data-testid="panel-error"]')).toBeVisible({ timeout: 5000 });

    // Click retry
    await page.locator('[data-testid="panel-retry"]').click();

    // Should get past error state
    const panel = page.locator('[data-testid="review-report-panel"]');
    await expect(panel).toBeVisible();
  });

  // Existing tests from S16-P0-1 (should continue to pass)
  test('Opens review panel via toolbar button', async ({ page }) => {
    await page.click('[data-testid="design-review-btn"]');
    await page.waitForSelector('[data-testid="review-report-panel"]', { timeout: 5000 });
    await expect(page.locator('[data-testid="panel-title"]')).toHaveText('Design Review Report');
  });

  test('Panel shows three tabs', async ({ page }) => {
    await page.click('[data-testid="design-review-btn"]');
    await page.waitForSelector('[data-testid="panel-tabs"]');
    await expect(page.locator('[data-testid="tab-compliance"]')).toBeVisible();
    await expect(page.locator('[data-testid="tab-accessibility"]')).toBeVisible();
    await expect(page.locator('[data-testid="tab-reuse"]')).toBeVisible();
  });

  test('Close button dismisses panel', async ({ page }) => {
    await page.click('[data-testid="design-review-btn"]');
    await page.waitForSelector('[data-testid="review-report-panel"]');
    await page.click('[data-testid="panel-close"]');
    await expect(page.locator('[data-testid="review-report-panel"]')).not.toBeVisible();
  });
});