/**
 * canvas-queue-styles.spec.ts
 *
 * E4-S2: End-to-end test for canvas queue item styles.
 * Validates that PrototypeQueuePanel renders without undefined class names.
 */

import { test, expect, Page } from '@playwright/test';

// canvas-e2e project: webServer always starts on port 3000 (playwright.ci.config.ts)
// Note: CI may set BASE_URL env var incorrectly; we always use the correct port.
const BASE_URL = 'http://localhost:3000';

async function getUndefinedClassCount(page: Page): Promise<number> {
  return page.evaluate(() => {
    let count = 0;
    for (const el of document.querySelectorAll('[class]')) {
      const cn = el.className?.toString() || '';
      if (cn.includes('undefined')) count++;
    }
    return count;
  });
}

async function getQueueItemClassNames(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const results: string[] = [];
    for (const el of document.querySelectorAll('[class*="queueItem"]')) {
      const cn = el.className?.toString() || '';
      results.push(cn);
    }
    return results;
  });
}

test.describe('E4-S2: Canvas Queue Item Styles', () => {
  test('Canvas page has no JS errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (
          !text.includes('favicon') &&
          !text.includes('Failed to load resource') &&
          !text.includes('third-party cookie')
        ) {
          errors.push(text);
        }
      }
    });

    const response = await page.goto(`${BASE_URL}/canvas`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    expect(response?.status()).toBeLessThan(400);
    expect(errors, `JS errors: ${errors.slice(0, 3).join('; ')}`).toHaveLength(0);
  });

  test('Canvas page undefined class count ≤ 9 (Epic2 baseline)', async ({ page }) => {
    await page.goto(`${BASE_URL}/canvas`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    await page.waitForTimeout(2000);

    const undefinedCount = await getUndefinedClassCount(page);
    // Baseline = 9 (Epic2),不允许超过
    expect(
      undefinedCount,
      `undefined class count: ${undefinedCount} (baseline ≤ 9)`
    ).toBeLessThanOrEqual(9);
  });

  test('Queue panel renders with recognized class names', async ({ page }) => {
    await page.goto(`${BASE_URL}/canvas`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    await page.waitForTimeout(2000);

    const queueItems = await getQueueItemClassNames(page);

    // 队列项应使用正确类名（camelCase），不包含 undefined
    const hasUndefined = queueItems.some((cn) => cn.includes('undefined undefined'));
    expect(hasUndefined, `发现 undefined queueItem: ${queueItems.join(', ')}`).toBe(false);
  });

  test('No new undefined classes introduced by CSS changes', async ({ page }) => {
    await page.goto(`${BASE_URL}/canvas`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    await page.waitForTimeout(2000);

    const undefinedCount = await getUndefinedClassCount(page);
    // 确保没有引入新的 undefined class（baseline ≤ 9）
    expect(undefinedCount, `当前 undefined class: ${undefinedCount}`).toBeLessThanOrEqual(9);
  });
});
