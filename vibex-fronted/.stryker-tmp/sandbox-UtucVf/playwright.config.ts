// @ts-nocheck
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false, // Disable parallel to avoid resource competition
  forbidOnly: !!process.env.CI,
  retries: 2, // Increase retries for stability
  workers: 1, // Single worker for stability
  reporter: process.env.CI ? 'list' : 'html',
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
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 180000, // Increase server startup timeout
    stdout: 'pipe',
    stderr: 'pipe',
  },
});