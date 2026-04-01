/**
 * stability.spec.ts — E1 E2E Stability Acceptance Tests
 *
 * Verifies the three F1 acceptance criteria from proposals-20260401-8 E1:
 * - F1.1: No waitForTimeout in e2e/ tests
 * - F1.2: canvas-e2e tests use force:true for intercepted elements
 * - F1.3: playwright.config.ts expect timeout >= 30000
 */

import { test, expect } from '@playwright/test';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const E2E_DIR = resolve(__dirname, '../../e2e');

test.describe('E2E Stability — F1 Acceptance Tests', () => {
  test('F1.1: no waitForTimeout in e2e tests', () => {
    const { globSync } = require('glob');
    const testFiles = globSync('e2e/**/*.spec.ts', { cwd: resolve(__dirname, '../..') });
    const failures: string[] = [];

    for (const f of testFiles) {
      const content = readFileSync(f, 'utf-8');
      // Allow intentional short waits (<=50ms) for debounce/retry loops
      const lines = content.split('\n');
      for (const line of lines) {
        const match = line.match(/waitForTimeout\s*\(\s*(\d+)\s*\)/);
        if (match && parseInt(match[1]) > 50) {
          failures.push(`${f}: ${line.trim()}`);
        }
      }
    }

    expect(failures, `waitForTimeout found in:\n${failures.join('\n')}`).toHaveLength(0);
  });

  test('F1.2: canvas-e2e tests use force:true for intercepted elements', () => {
    // Check that canvas-e2e tests have force:true for elements that may be
    // covered by overlays (e.g., floating panels, tooltips)
    const canvasSpec = resolve(__dirname, '../../e2e/canvas-phase2.spec.ts');
    if (existsSync(canvasSpec)) {
      const content = readFileSync(canvasSpec, 'utf-8');
      const hasForceTrue = /force:\s*true/.test(content);
      expect(
        hasForceTrue,
        'canvas-e2e tests should use force:true for elements that may be intercepted by overlays'
      ).toBeTruthy();
    }
  });

  test('F1.3: playwright.config.ts expect timeout >= 30000', () => {
    const configPath = resolve(__dirname, '../../playwright.config.ts');
    const content = readFileSync(configPath, 'utf-8');

    // Extract expect.timeout value
    const match = content.match(/expect\s*:\s*\{[^}]*timeout:\s*(\d+)/);
    expect(match, 'expect.timeout should be defined in playwright.config.ts').not.toBeNull();

    const timeout = parseInt(match![1], 10);
    expect(
      timeout,
      `expect.timeout should be >= 30000, got ${timeout}`
    ).toBeGreaterThanOrEqual(30000);
  });
});
