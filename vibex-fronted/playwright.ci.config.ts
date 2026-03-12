import { defineConfig, devices } from '@playwright/test';

/**
 * CI-specific Playwright Configuration
 * Optimized for continuous integration environments
 * 
 * Usage:
 *   pnpm playwright test --config=playwright.ci.config.ts
 */

export default defineConfig({
  testDir: './tests/e2e',
  
  // CI optimizations
  fullyParallel: true, // Enable parallel execution in CI for speed
  forbidOnly: true, // Fail if .only() is left in tests
  
  // Retry configuration for CI stability
  retries: process.env.CI ? 3 : 1,
  workers: process.env.CI ? undefined : 1, // Use all available CPUs in CI
  
  // Reporter
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'playwright-report/results.json' }],
  ],
  
  // Timeout configuration
  timeout: 60000,
  expect: {
    timeout: 10000,
  },
  
  // CI environment variables
  use: {
    // Use CI-specific base URL
    baseURL: process.env.CI_E2E_BASE_URL || process.env.BASE_URL || 'http://localhost:3000',
    
    // Trace and screenshot for debugging
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    
    // Timeouts
    actionTimeout: 15000,
    navigationTimeout: 30000,
    
    // CI-specific settings
    ...(process.env.CI && {
      launchOptions: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      },
    }),
  },
  
  // Projects - run on all browsers in CI
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    ...(process.env.CI ? [
      {
        name: 'firefox',
        use: { ...devices['Desktop Firefox'] },
      },
      {
        name: 'webkit',
        use: { ...devices['Desktop Safari'] },
      },
    ] : []),
  ],
  
  // Web server configuration
  webServer: {
    command: process.env.CI ? 'npm run start' : 'npm run dev',
    url: process.env.CI_E2E_BASE_URL || 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 180000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
  
  // Output configuration
  outputDir: 'test-results',
});
