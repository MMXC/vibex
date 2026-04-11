/**
 * canvas-queue-styles.spec.ts
 *
 * E4-S2: End-to-end test for canvas queue item styles.
 *
 * Validates that:
 * 1. Canvas page loads without undefined class names
 * 2. PrototypeQueuePanel renders with valid queueItem class names
 * 3. No runtime CSS class name errors appear in the console
 *
 * Reference: docs/vibex-css-architecture/IMPLEMENTATION.md § E4-S2
 */

import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';

type UndefinedClassInfo = {
  tag: string;
  className: string;
  text: string;
};

/**
 * Extract all undefined class names from the page DOM.
 */
async function getUndefinedClasses(page: Page): Promise<UndefinedClassInfo[]> {
  return page.evaluate(() => {
    const results: UndefinedClassInfo[] = [];
    for (const el of document.querySelectorAll('[class]')) {
      const cn = el.className.toString();
      if (cn.includes('undefined') || cn === 'undefined') {
        results.push({
          tag: el.tagName,
          className: cn.substring(0, 120),
          text: el.textContent?.trim().substring(0, 60) ?? '',
        });
      }
    }
    return results;
  });
}

/**
 * Extract all class names used on the page that look like queueItem variants.
 */
async function getQueueItemClasses(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const classes = new Set<string>();
    for (const el of document.querySelectorAll('[class]')) {
      const cn = el.className.toString();
      if (cn.includes('queueItem') || cn.includes('QueueItem')) {
        cn.split(/\s+/).forEach((c) => classes.add(c));
      }
    }
    return Array.from(classes).sort();
  });
}

test.describe('E4-S2: Canvas Queue Item Styles', () => {
  test('Canvas page loads with zero undefined class names', async ({ page }) => {
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
      waitUntil: 'networkidle',
      timeout: 20000,
    });

    // Page must load successfully
    expect(response?.status()).toBeLessThan(400);

    // No JS runtime errors
    expect(errors, `JS errors: ${errors.join('; ')}`).toHaveLength(0);

    // No undefined class names in the DOM
    const undefinedClasses = await getUndefinedClasses(page);
    expect(
      undefinedClasses.length,
      `Undefined class names found:\n${undefinedClasses.map((u) => `  ${u.tag}: ${u.className}`).join('\n')}`
    ).toBe(0);
  });

  test('PrototypeQueuePanel renders with valid queue item classes', async ({ page }) => {
    await page.goto(`${BASE_URL}/canvas`, {
      waitUntil: 'networkidle',
      timeout: 20000,
    });

    // Wait for queue panel to appear (if user has a session with queue items)
    // or show empty state
    const queuePanel = page.locator('[class*="prototypeQueuePanel"]').or(
      page.locator('[class*="queuePanel"]')
    );

    // Panel should be present (either with items or empty state)
    const panelCount = await queuePanel.count();
    expect(panelCount).toBeGreaterThan(0);

    const queueItemClasses = await getQueueItemClasses(page);

    // If there are queue items rendered, validate each class name
    const undefinedQueueClasses = queueItemClasses.filter(
      (c) => c.includes('undefined') || c === 'undefined'
    );

    expect(
      undefinedQueueClasses.length,
      `Undefined queueItem classes: ${undefinedQueueClasses.join(', ')}`
    ).toBe(0);

    // Known valid queue item state classes (from canvas.export.module.css)
    const knownQueueClasses = [
      'queueItem',
      'queueItemQueued',
      'queueItemGenerating',
      'queueItemDone',
      'queueItemError',
      'queueItemActions',
      'queueItemInfo',
      'queueItemMeta',
      'queueItemName',
      'queueItemProgress',
      'queueItemRetry',
      'queueList',
    ];

    const hasValidQueueClasses = queueItemClasses.some((c) =>
      knownQueueClasses.some((known) => c.includes(known))
    );

    // Either queue is empty (no queue classes found) or has valid queue classes
    if (queueItemClasses.length > 0) {
      expect(
        hasValidQueueClasses,
        `No recognized queue item classes found. Got: ${queueItemClasses.slice(0, 10).join(', ')}`
      ).toBe(true);
    }
  });

  test('No undefined classes on queue items during prototype generation (if visible)', async ({ page }) => {
    await page.goto(`${BASE_URL}/canvas`, {
      waitUntil: 'networkidle',
      timeout: 20000,
    });

    // Wait a moment for any deferred rendering
    await page.waitForTimeout(2000);

    // Check for any elements with queue-related classes that have undefined
    const undefinedQueue = await page.evaluate(() => {
      const results: string[] = [];
      for (const el of document.querySelectorAll('[class*="queueItem"], [class*="queue"]')) {
        const cn = el.className.toString();
        if (cn.includes('undefined') || cn === 'undefined') {
          results.push(`${el.tagName}: ${cn.substring(0, 100)}`);
        }
      }
      return results;
    });

    expect(
      undefinedQueue.length,
      `Undefined queue classes found:\n${undefinedQueue.join('\n')}`
    ).toBe(0);
  });

  test('Queue panel state classes (Queued/Generating/Done/Error) are defined', async ({ page }) => {
    await page.goto(`${BASE_URL}/canvas`, {
      waitUntil: 'networkidle',
      timeout: 20000,
    });

    // Check that all rendered class names on the page are non-undefined
    const allUndefined = await getUndefinedClasses(page);

    // Filter to queue-related undefined classes only
    const queueUndefined = allUndefined.filter((u) =>
      u.className.includes('queueItem') ||
      u.className.includes('queue') ||
      u.className.includes('Queue')
    );

    expect(
      queueUndefined.length,
      `Queue-related undefined classes:\n${queueUndefined.map((u) => `  ${u.tag}: ${u.className}`).join('\n')}`
    ).toBe(0);
  });
});
