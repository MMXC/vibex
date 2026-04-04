/**
 * playwright.ci.config.ts — CI-specific Playwright configuration
 *
 * Key differences from base config:
 * - retries: 3 (flaky test governance: retries = 3 in CI per IMPLEMENTATION_PLAN)
 * - reporter: list (concise CI-friendly output)
 * - fullyParallel: false (avoid resource competition)
 * - workers: 1 (deterministic ordering for flaky tracking)
 *
 * Usage:
 *   npx playwright test --config=playwright.ci.config.ts
 *
 * Flaky test governance rules (per IMPLEMENTATION_PLAN):
 * - retries = 3 in CI (base config: 2, CI: 3)
 * - pass rate < 80% → test written to flaky-tests.json
 * - Flaky tests: skip, never delete
 * - Consecutive 5 CI runs without flaky failure → can remove skip
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: true,
  retries: 3, // E4 Flaky governance: CI retries = 3
  workers: 1,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report' }],
    ['@playwright/test/reporter', 'blob'], // Blob for CI reporting
  ],
  timeout: 60000,
  expect: {
    timeout: 30000,
  },
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'canvas-e2e',
      testDir: './e2e',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'contract',
      testDir: './tests/contract',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'iPhone12',
      use: {
        ...devices['iPhone 12'],
      },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: false, // Always start fresh in CI
    timeout: 180000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
