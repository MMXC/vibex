import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';

export async function runAxe(page: Page, context?: string) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();

  const critical = results.violations.filter(
    (v: { impact: string | null }) =>
      v.impact === 'critical' || v.impact === 'serious'
  );

  return {
    violations: results.violations,
    criticalViolations: critical,
    pass: critical.length === 0,
  };
}
