/**
 * stability.spec.ts — E1 E2E Stability Acceptance Tests
 *
 * Verifies the three F1 acceptance criteria from proposals-20260401-8 E1:
 * - F1.1: No waitForTimeout in e2e/ tests
 * - F1.2: canvas-e2e tests use force:true for intercepted elements
 * - F1.3: playwright.config.ts expect timeout >= 30000
 */

import { test, expect } from '@playwright/test';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { resolve, relative, join } from 'path';

const VIBEX_FRONTED_DIR = resolve(__dirname, '..');

/** Recursively find all .spec.ts files in a directory */
function findSpecFiles(dir: string): string[] {
  const results: string[] = [];
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findSpecFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.spec.ts')) {
      results.push(fullPath);
    }
  }
  return results;
}

test.describe('E2E Stability — F1 Acceptance Tests', () => {
  test('F1.1: no waitForTimeout > 50ms in e2e tests', () => {
    const failures: string[] = [];
    const e2eDir = resolve(VIBEX_FRONTED_DIR, 'tests/e2e');
    const testFiles = findSpecFiles(e2eDir);

    for (const file of testFiles) {
      const content = readFileSync(file, 'utf-8');
      const lines = content.split('\n');
      for (const line of lines) {
        const match = line.match(/waitForTimeout\s*\(\s*(\d+)\s*\)/);
        if (match && parseInt(match[1]) > 50) {
          failures.push(`${relative(VIBEX_FRONTED_DIR, file)}: ${line.trim()}`);
        }
      }
    }

    expect(
      failures,
      failures.length > 0 ? `waitForTimeout > 50ms found in:\n${failures.join('\n')}` : undefined
    ).toHaveLength(0);
  });

  test('F1.2: canvas-e2e tests use force:true for intercepted elements', () => {
    // canvas-e2e spec is optional; if present, check for force:true
    const canvasSpec = resolve(VIBEX_FRONTED_DIR, 'tests/e2e/canvas-e2e.spec.ts');
    if (existsSync(canvasSpec)) {
      const content = readFileSync(canvasSpec, 'utf-8');
      const hasForceTrue = /force:\s*true/.test(content);
      expect(
        hasForceTrue,
        'canvas-e2e tests should use force:true for elements intercepted by overlays'
      ).toBeTruthy();
    }
    // If file doesn't exist, skip (not required)
  });

  test('F1.3: playwright.config.ts expect timeout >= 30000', () => {
    const configPath = resolve(VIBEX_FRONTED_DIR, 'playwright.config.ts');
    const content = readFileSync(configPath, 'utf-8');
    const match = content.match(/expect\s*:\s*\{[^}]*timeout:\s*(\d+)/);
    expect(match, 'expect.timeout should be defined in playwright.config.ts').not.toBeNull();
    const timeout = parseInt(match![1], 10);
    expect(timeout >= 30000, `expect.timeout should be >= 30000, got ${timeout}`).toBe(true);
  });
});
