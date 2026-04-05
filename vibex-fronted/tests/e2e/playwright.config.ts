/**
 * tests/e2e/playwright.config.ts — E2E Test Infrastructure Config
 *
 * E1: Playwright 隔离
 * - 独立配置，消除 Jest/Playwright 框架冲突
 * - BASE_URL 环境变量支持
 * - @ci-blocking 测试 CI 跳过（需在测试名中加 @ci-blocking 前缀）
 *
 * Usage:
 *   pnpm run test:e2e          — 本地运行（使用 .env.local）
 *   pnpm run test:e2e:ci       — CI 运行（自动跳过 @ci-blocking）
 *   pnpm run test:e2e:local     — 本地 + 本地 URL
 */
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // 测试目录 = 配置文件所在目录
  testDir: '.',

  // 进程隔离
  fullyParallel: false,
  forbidOnly: !!process.env.CI,

  // CI: 重试 3 次；本地: 不重试（快速反馈）
  retries: process.env.CI ? 3 : 0,
  workers: 1,

  // 报告
  reporter: process.env.CI
    ? [['list'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],

  // 超时控制
  timeout: 60000,
  expect: { timeout: 10000 },


  use: {
    // BASE_URL 环境变量优先
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',

    // CI 环境中跳过 @ci-blocking 标记的测试
    grepInvert: process.env.CI ? /@ci-blocking/ : undefined,

    launchOptions: {
      args: ['--disable-dev-shm-usage'],
    },
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: process.env.CI
    ? undefined
    : {
        command: 'pnpm run dev',
        url: 'http://localhost:3000',
        reuseExistingServer: true,
        timeout: 120000,
      },
});
