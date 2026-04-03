// @ts-nocheck
// @ci-blocking
import { test, expect } from '@playwright/test';
import { runAxe } from './helpers';

test.describe('Canvas Accessibility', () => {
  test('canvas page has zero critical violations', async ({ page }) => {
    await page.goto('/canvas');
    await page.waitForLoadState('networkidle');

    const result = await runAxe(page);

    expect(
      result.criticalViolations,
      `Found ${result.criticalViolations.length} critical violations`
    ).toHaveLength(0);
  });
});
