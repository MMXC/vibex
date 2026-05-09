/**
 * lighthouserc.js — Lighthouse CI configuration
 *
 * P002: U2-P002
 *
 * 配置说明：
 * - collect: 使用 standalone 模式启动 Next.js 服务
 * - assert: Core Web Vitals 使用 warn 级别（避免网络波动阻断 PR）
 * - numberOfRuns: 3 次取中位数，减少波动
 */

export default {
  ci: {
    collect: {
      // Start Next.js in standalone mode for LHCI testing
      startServerCommand: 'pnpm start',
      startServerReadyPattern: 'Ready',
      startServerReadyTimeout: 30000,
      url: [
        'http://localhost:3000',
        'http://localhost:3000/canvas',
      ],
      numberOfRuns: 3,
      settings: {
        preset: 'desktop',
        // Skip upload to LHCI server (optional, for trend storage)
        skipAutodiscover: true,
      },
    },
    assert: {
      assertions: {
        // Core Web Vitals — warn level (non-blocking)
        'categories:performance': ['warn', { minScore: 0.8 }],
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 2500 }],
        'total-blocking-time': ['warn', { maxNumericValue: 200 }],
        'cumulative-layout-shift': ['warn', { maxNumericValue: 0.1 }],
        'speed-index': ['warn', { maxNumericValue: 3000 }],
        // Accessibility
        'categories:accessibility': ['warn', { minScore: 0.9 }],
        // Best practices
        'categories:best-practices': ['warn', { minScore: 0.9 }],
      },
    },
    upload: {
      // Disable upload (no LHCI server configured yet)
      target: 'temporary',
    },
  },
};