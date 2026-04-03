// @ts-nocheck
// @ci-blocking
import { test, expect } from '@playwright/test';
import { runAxe } from './helpers';

test.describe('Export Page Accessibility', () => {
  test('export page has zero critical violations', async ({ page }) => {
    await page.goto('/canvas/export');
    await page.waitForLoadState('networkidle');

    const result = await runAxe(page);

    expect(
      result.criticalViolations,
      `Found ${result.criticalViolations.length} critical violations`
    ).toHaveLength(0);
  });
});
