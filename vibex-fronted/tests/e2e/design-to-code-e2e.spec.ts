import { test, expect } from '@playwright/test';

test.describe('S16-P0-2: Design-to-Code Bidirectional Sync', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dds');
    await page.waitForLoadState('networkidle');
  });

  test('opens ConflictResolutionDialog when drift is detected', async ({ page }) => {
    // Dispatch a mock drift event
    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent('design-sync:drift-detected', {
          detail: {
            hasDrift: true,
            changes: [
              {
                tokenId: 't1',
                type: 'modified',
                oldValue: '#ff0000',
                newValue: '#00ffff',
                location: 'primary-color',
              },
            ],
          },
        })
      );
    });
    await page.waitForSelector('[data-testid="conflict-resolution-dialog"]', { timeout: 3000 });
    await expect(page.locator('[data-testid="dialog-title"]')).toHaveText('Design-to-Code Conflict');
  });

  test('dialog shows three panels', async ({ page }) => {
    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent('design-sync:drift-detected', {
          detail: {
            hasDrift: true,
            changes: [{ tokenId: 't1', type: 'added', newValue: '#00ffff' }],
          },
        })
      );
    });
    await page.waitForSelector('[data-testid="three-panels"]');
    await expect(page.locator('[data-testid="three-panels"]')).toBeVisible();
  });

  test('change count is displayed', async ({ page }) => {
    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent('design-sync:drift-detected', {
          detail: {
            hasDrift: true,
            changes: [
              { tokenId: 't1', type: 'modified' },
              { tokenId: 't2', type: 'added' },
            ],
          },
        })
      );
    });
    await page.waitForSelector('[data-testid="change-count"]');
    await expect(page.locator('[data-testid="change-count"]')).toContainText('2 change');
  });

  test('all action buttons are present', async ({ page }) => {
    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent('design-sync:drift-detected', {
          detail: {
            hasDrift: true,
            changes: [{ tokenId: 't1', type: 'modified' }],
          },
        })
      );
    });
    await page.waitForSelector('[data-testid="btn-accept-design"]');
    await expect(page.locator('[data-testid="btn-accept-design"]')).toBeEnabled();
    await expect(page.locator('[data-testid="btn-accept-code"]')).toBeEnabled();
    await expect(page.locator('[data-testid="btn-accept-token"]')).toBeEnabled();
    await expect(page.locator('[data-testid="btn-merge-all"]')).toBeEnabled();
  });

  test('close button dismisses dialog', async ({ page }) => {
    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent('design-sync:drift-detected', {
          detail: {
            hasDrift: true,
            changes: [{ tokenId: 't1', type: 'modified' }],
          },
        })
      );
    });
    await page.waitForSelector('[data-testid="conflict-resolution-dialog"]');
    await page.click('[data-testid="dialog-close"]');
    await expect(page.locator('[data-testid="conflict-resolution-dialog"]')).not.toBeVisible();
  });

  test('shows no conflict state when no changes', async ({ page }) => {
    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent('design-sync:drift-detected', {
          detail: { hasDrift: false, changes: [] },
        })
      );
    });
    await page.waitForSelector('[data-testid="no-conflict"]', { timeout: 3000 });
    await expect(page.locator('[data-testid="no-conflict"]')).toBeVisible();
  });
});
