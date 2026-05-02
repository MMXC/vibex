import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false, // Disable parallel to avoid resource competition
  forbidOnly: !!process.env.CI,
  retries: 3, // E4 Flaky governance: retries = 3 (CI config at playwright.ci.config.ts)
  workers: 1, // Single worker for stability
  reporter: process.env.CI ? [['list'], ['json', { outputFile: './playwright-report/results.json' }]] : 'html',
  timeout: 60000, // Increase test timeout
  expect: {
    timeout: 30000, // F1.3: CI expect timeout >= 30000ms
  },
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15000, // Increase action timeout
    headless: true, // E3: Explicit headless mode for CI
    viewport: { width: 1280, height: 720 }, // E3: Standard viewport for consistent tests
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Canvas expand E2E — separate testDir
    {
      name: 'canvas-e2e',
      testDir: './e2e',
      use: { ...devices['Desktop Chrome'] },
    },
    // E4 Contract tests — tests API response schemas against Zod
    {
      name: 'contract',
      testDir: './tests/contract',
      use: { ...devices['Desktop Chrome'] },
    },
    // E1 iPhone12 (390×844) — responsive design validation
    {
      name: 'iPhone12',
      use: {
        ...devices['iPhone 12'],
      },
    },
  ],
  webServer: {
    command: 'NEXT_OUTPUT_MODE=standalone pnpm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 180000, // Increase server startup timeout
    stdout: 'pipe',
    stderr: 'pipe',
  },
});