// @ci-blocking
import { test, expect } from '@playwright/test';
import { runAxe } from './helpers';

test.describe('Homepage Accessibility', () => {
  test('homepage has zero critical violations', async ({ page }) => {
    await page.goto('/');
    const result = await runAxe(page);

    if (!result.pass) {
      console.log(
        'Violations:',
        JSON.stringify(result.criticalViolations, null, 2)
      );
    }

    expect(
      result.criticalViolations,
      `Found ${result.criticalViolations.length} critical violations`
    ).toHaveLength(0);
  });
});
