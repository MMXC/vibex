// @ts-nocheck
const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({
  testDir: './vibex-fronted/tests/a11y',
  fullyParallel: false,
  forbidOnly: false,
  retries: 0,
  workers: 1,
  reporter: [['list']],
  timeout: 60000,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    actionTimeout: 15000,
    launchOptions: {
      executablePath: '/root/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome',
    },
  },
  projects: [{ name: 'chromium', use: { channel: undefined } }],
});
