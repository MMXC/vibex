// @ci-blocking
/**
 * Conflict Resolution E2E Tests
 *
 * canvas-sync-protocol-complete / Epic 2 E2E Tests
 */
import { test, expect } from '@playwright/test';

test.describe('Conflict Resolution', () => {
  test.beforeEach(async ({ page }) => {
    // Intercept and seed conflict data
    await page.route('**/api/canvas/state', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          version: 6,
          nodes: {},
          detail: { saveStatus: 'conflict', conflictData: { localVersion: 5, serverVersion: 6 } },
        }),
      });
    });
    await page.goto('/canvas/test-project');
  });

  test('shows ConflictBubble when version mismatch detected', async ({ page }) => {
    await expect(page.locator('[data-testid="conflict-bubble"]')).toBeVisible({ timeout: 5000 });
  });

  test('clicking keep-local resolves conflict', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.canvas-container')).toBeVisible();
    const keepLocalBtn = '[data-testid="conflict-keep-local"]';
    await expect(page.locator(keepLocalBtn)).toBeVisible();
    await page.locator(keepLocalBtn).click();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-testid="conflict-bubble"]')).not.toBeVisible({ timeout: 3000 });
  });

  test('clicking use-server resolves conflict', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.canvas-container')).toBeVisible();
    const useServerBtn = '[data-testid="conflict-use-server"]';
    await expect(page.locator(useServerBtn)).toBeVisible();
    await page.locator(useServerBtn).click();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-testid="conflict-bubble"]')).not.toBeVisible({ timeout: 3000 });
  });
});

test.describe('Canvas with Conflict History', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/canvas/state', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          version: 10,
          nodes: {},
          detail: { saveStatus: 'conflict', conflictData: { localVersion: 9, serverVersion: 10 } },
        }),
      });
    });
    await page.goto('/canvas/test-project');
  });

  test('conflict dismissed after resolution persists', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.canvas-container')).toBeVisible();
    const confirmBtn = '[data-testid="conflict-use-server"]';
    await expect(page.locator(confirmBtn)).toBeVisible();
    await page.locator(confirmBtn).click();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-testid="conflict-bubble"]')).not.toBeVisible({ timeout: 3000 });
    // Verify no re-appearance
    await expect(page.locator('[data-testid="conflict-bubble"]')).not.toBeVisible({ timeout: 3000 });
  });
});
