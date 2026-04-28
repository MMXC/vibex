import { test, expect } from '@playwright/test';

test.describe('S16-P1-1: Firebase Mock + Config', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dds');
    await page.waitForLoadState('networkidle');
  });

  test('ConflictBubble shows "Offline" when disconnected', async ({
    page,
  }) => {
    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent('firebase-mock:state-change', {
          detail: { state: 'DISCONNECTED' },
        })
      );
    });
    await page.waitForSelector('[data-testid="conflict-bubble"]', {
      timeout: 3000,
    });
    await expect(
      page.locator('[data-testid="bubble-message"]')
    ).toContainText('Offline');
    await expect(
      page.locator('[data-testid="conflict-bubble"]')
    ).toHaveAttribute('data-state', 'DISCONNECTED');
  });

  test('ConflictBubble shows "Reconnecting" when reconnecting', async ({
    page,
  }) => {
    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent('firebase-mock:state-change', {
          detail: { state: 'RECONNECTING' },
        })
      );
    });
    await page.waitForSelector('[data-testid="conflict-bubble"]');
    await expect(
      page.locator('[data-testid="bubble-message"]')
    ).toContainText('Reconnecting');
  });

  test('ConflictBubble auto-dismisses after 2s when connected', async ({
    page,
  }) => {
    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent('firebase-mock:state-change', {
          detail: { state: 'CONNECTED' },
        })
      );
    });
    await page.waitForSelector('[data-testid="conflict-bubble"]', {
      timeout: 3000,
    });
    await expect(
      page.locator('[data-testid="bubble-message"]')
    ).toContainText('Synced');
    await page.waitForSelector('[data-testid="conflict-bubble"]', {
      state: 'hidden',
      timeout: 4000,
    });
  });

  test('ConflictBubble dismiss button works', async ({ page }) => {
    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent('firebase-mock:state-change', {
          detail: { state: 'DISCONNECTED' },
        })
      );
    });
    await page.waitForSelector('[data-testid="conflict-bubble"]');
    await page.click('[data-testid="bubble-dismiss"]');
    await expect(
      page.locator('[data-testid="conflict-bubble"]')
    ).not.toBeVisible();
  });

  test('ConflictBubble shows degraded message', async ({ page }) => {
    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent('firebase-mock:state-change', {
          detail: { state: 'DEGRADED' },
        })
      );
    });
    await page.waitForSelector('[data-testid="conflict-bubble"]');
    await expect(
      page.locator('[data-testid="bubble-message"]')
    ).toContainText('Slow connection');
  });
});
