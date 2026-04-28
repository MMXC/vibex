# S17-P1-2: Firebase 真实集成验证

**ID**: S17-P1-2
**标题**: Firebase 真实集成验证
**优先级**: P1
**Sprint**: S17
**状态**: 待开发
**依赖**: S16-P1-1（Firebase Mock）

---

## 1. 问题描述

S16-P1-1 交付了 Firebase Mock（`useFirebase` hook + `ConflictBubble`），但从未在真实 Firebase 配置下验证。当前状态：

- `useFirebase` 的 `connect()` 调用 mock 实现
- `isFirebaseConfigured()` guard 在未配置时返回 false，PresenceAvatars 不渲染
- 5 用户并发延迟未知
- Firebase 冷启动时间未测量

真实 Firebase 集成的性能表现直接决定 Presence 功能是否可用。

---

## 2. 影响范围

- `vibex-fronted/src/lib/firebase/presence.ts`
- `vibex-fronted/src/hooks/useFirebase.ts`
- `vibex-fronted/src/components/presence/PresenceAvatars.tsx`
- `vibex-fronted/tests/e2e/firebase-presence.spec.ts`（已存在，需补充）
- `vibex-fronted/tests/benchmarks/firebase-benchmark.ts`（新建）

---

## 3. 前置条件

### 环境要求

- Firebase 项目配置（`firebase.json` 或环境变量）
- `VITE_FIREBASE_API_KEY`、`VITE_FIREBASE_AUTH_DOMAIN`、`VITE_FIREBASE_PROJECT_ID` 等
- Firebase Emulator（本地测试用）或真实 Firebase 项目
- Playwright 已安装

### 已就绪的交付物

- `S16-P1-1`: `useFirebase` hook、mock 实现、`isFirebaseConfigured()` guard
- `S16-P1-1`: `ConflictBubble` 组件（Firebase 冲突气泡）
- `S16-P1-1`: `firebase-presence.spec.ts`（存在，mock 模式）

### 测试数据

- 至少 1 个测试 canvas/project（用于 PresenceAvatars 渲染测试）
- Firebase Emulator 中预置的测试数据（或使用 Firebase Test Lab）

---

## 4. 验收标准（DoD）

### 4.1 Firebase 冷启动 benchmark 报告

| 指标 | 目标 | 测量方式 |
|------|------|----------|
| Firebase Admin SDK 初始化时间 | < 500ms | Jest benchmark: `measure(() => initializeAdmin())` |
| Firebase Client SDK 初始化时间 | < 500ms | Playwright: 首次 PresenceAvatars 渲染时间 |
| RTDB 连接建立时间 | < 300ms | Playwright network timing |

**benchmark 报告格式**：

```json
{
  "timestamp": "2026-04-29T00:00:00Z",
  "environment": "production",
  "results": {
    "adminInit": { "mean": 245, "p50": 230, "p95": 480, "p99": 495, "unit": "ms", "n": 20 },
    "clientInit": { "mean": 310, "p50": 290, "p95": 490, "p99": 499, "unit": "ms", "n": 20 },
    "rtdbConnect": { "mean": 180, "p50": 160, "p95": 290, "p99": 298, "unit": "ms", "n": 20 }
  },
  "pass": true
}
```

### 4.2 5 用户并发 presence 更新延迟 < 3s

| 用户数 | 操作 | 目标延迟 | 实测延迟（p95） |
|--------|------|----------|----------------|
| 5 | setPresence() | < 3000ms | < 3000ms |
| 5 | onValue() 回调 | < 1000ms | < 1000ms |

**Playwright 并发测试断言**：

```typescript
expect(stats.p95SetPresence).toBeLessThan(3000);
expect(stats.p95OnValue).toBeLessThan(1000);
```

### 4.3 isFirebaseConfigured() === false 时 PresenceAvatars 不渲染

```typescript
// 真实测试断言
const avatars = page.locator('[data-testid="presence-avatars"]');
await expect(avatars).not.toBeVisible();
```

### 4.4 降级策略在 mock 和真实环境均可触发

| 场景 | 预期行为 |
|------|----------|
| Firebase not configured | `isFirebaseConfigured()` → false，console.warn，不渲染 PresenceAvatars |
| Firebase configured but network error | 重试 3 次后降级到 polling 模式（每 30s 轮询） |
| RTDB permission denied | 降级到只读模式（显示本地缓存头像） |
| Cold start > 2s | 延迟激活，优先显示降级 UI |

### 4.5 firebase-presence.spec.ts 全通过

| # | 测试名称 | 断言 |
|---|----------|------|
| FP-01 | 真实 Firebase 配置下 PresenceAvatars 渲染 | `expect(avatars).toBeVisible()` |
| FP-02 | 5 用户并发 setPresence 延迟 < 3s | `expect(maxLatency).toBeLessThan(3000)` |
| FP-03 | Firebase 未配置时 PresenceAvatars 不渲染 | `expect(avatars).not.toBeVisible()` |
| FP-04 | 降级策略：网络错误时降级到 polling | `expect(page.locator('[data-testid="presence-polling-mode"]')).toBeVisible()` |
| FP-05 | Firebase Emulator 支持本地开发 | `expect(isUsingEmulator).toBe(true)` |

---

## 5. 实现方案

### 5.1 Firebase Benchmark（vibex-fronted/tests/benchmarks/firebase-benchmark.ts）

```typescript
/**
 * tests/benchmarks/firebase-benchmark.ts
 * S17-P1-2: Firebase 真实集成验证 — 冷启动 benchmark
 *
 * 运行：
 *   pnpm benchmark:firebase
 *   npx tsx tests/benchmarks/firebase-benchmark.ts
 */

import { isFirebaseConfigured, initializeFirebase, getFirebaseApp } from '@/lib/firebase/client';
import { initializeAdmin } from '@/lib/firebase/admin';

interface BenchmarkResult {
  mean: number;
  p50: number;
  p95: number;
  p99: number;
  unit: string;
  n: number;
}

interface BenchmarkReport {
  timestamp: string;
  environment: string;
  results: {
    adminInit: BenchmarkResult;
    clientInit: BenchmarkResult;
    rtdbConnect: BenchmarkResult;
  };
  pass: boolean;
}

/** 统计计算 */
function computeStats(samples: number[]): BenchmarkResult {
  const sorted = [...samples].sort((a, b) => a - b);
  const n = sorted.length;
  const mean = samples.reduce((a, b) => a + b, 0) / n;
  return {
    mean: Math.round(mean),
    p50: sorted[Math.floor(n * 0.5)],
    p95: sorted[Math.floor(n * 0.95)],
    p99: sorted[Math.floor(n * 0.99)],
    unit: 'ms',
    n,
  };
}

/** 测量 Firebase Admin SDK 初始化时间 */
async function benchmarkAdminInit(iterations = 20): Promise<BenchmarkResult> {
  const samples: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await initializeAdmin();
    const end = performance.now();
    samples.push(Math.round(end - start));
    // 重置模块缓存（下次重新初始化）
    // 注：在 Jest 环境中需要 jest.resetModules()
  }

  return computeStats(samples);
}

/** 测量 Firebase Client SDK 初始化时间 */
async function benchmarkClientInit(iterations = 20): Promise<BenchmarkResult> {
  if (!isFirebaseConfigured()) {
    console.warn('Firebase not configured, skipping client benchmark');
    return { mean: -1, p50: -1, p95: -1, p99: -1, unit: 'ms', n: 0 };
  }

  const samples: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    const app = getFirebaseApp();
    // 等待 app ready
    await app;
    const end = performance.now();
    samples.push(Math.round(end - start));
  }

  return computeStats(samples);
}

async function main() {
  console.log('🏃 Firebase Cold Start Benchmark\n');

  const report: BenchmarkReport = {
    timestamp: new Date().toISOString(),
    environment: isFirebaseConfigured() ? 'production' : 'mock',
    results: {
      adminInit: { mean: 0, p50: 0, p95: 0, p99: 0, unit: 'ms', n: 0 },
      clientInit: { mean: 0, p50: 0, p95: 0, p99: 0, unit: 'ms', n: 0 },
      rtdbConnect: { mean: 0, p50: 0, p95: 0, p99: 0, unit: 'ms', n: 0 },
    },
    pass: false,
  };

  // 1. Admin SDK benchmark
  console.log('📊 Benchmarking Admin SDK init...');
  report.results.adminInit = await benchmarkAdminInit(20);
  console.log(`   mean=${report.results.adminInit.mean}ms, p95=${report.results.adminInit.p95}ms`);

  // 2. Client SDK benchmark
  console.log('📊 Benchmarking Client SDK init...');
  report.results.clientInit = await benchmarkClientInit(20);
  console.log(`   mean=${report.results.clientInit.mean}ms, p95=${report.results.clientInit.p95}ms`);

  // 3. 判断是否通过
  const adminPass = report.results.adminInit.p95 < 500;
  const clientPass = report.results.clientInit.p95 < 500;
  report.pass = adminPass && clientPass;

  console.log('\n' + '='.repeat(50));
  console.log(`✅ Admin SDK: ${adminPass ? 'PASS' : 'FAIL'} (target: <500ms p95)`);
  console.log(`✅ Client SDK: ${clientPass ? 'PASS' : 'FAIL'} (target: <500ms p95)`);
  console.log(`Overall: ${report.pass ? '✅ PASS' : '❌ FAIL'}`);
  console.log('='.repeat(50));

  // 输出 JSON 报告
  console.log('\n📄 JSON Report:');
  console.log(JSON.stringify(report, null, 2));

  process.exit(report.pass ? 0 : 1);
}

main().catch((err) => {
  console.error('Benchmark failed:', err);
  process.exit(1);
});
```

### 5.2 5 用户并发 presence 测试（Playwright E2E）

```typescript
/**
 * firebase-presence.spec.ts — S17-P1-2 Firebase 真实集成验证
 * 在 existing firebase-presence.spec.ts 基础上补充以下测试
 */

import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';
const TEST_CANVAS = 'test-canvas-firebase-presence';

interface LatencyStats {
  min: number;
  max: number;
  mean: number;
  p95: number;
}

/**
 * 测量多次 presence 更新的延迟统计
 */
async function measureSetPresenceLatency(
  page: Page,
  userIds: string[],
  iterations = 10
): Promise<{ setLatencies: number[]; callbackLatencies: number[] }> {
  const setLatencies: number[] = [];
  const callbackLatencies: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const timestamp = Date.now();
    const promises = userIds.map((userId) =>
      page.evaluate(
        async ({ uid, ts }) => {
          const start = performance.now();
          // 调用真实的 Firebase setPresence
          await (window as Window & { __setPresence?: (uid: string) => Promise<void> }).__setPresence?.(uid);
          const end = performance.now();
          return Math.round(end - start);
        },
        { uid: userId, ts: timestamp }
      )
    );

    const results = await Promise.all(promises);
    setLatencies.push(...results);
  }

  return { setLatencies, callbackLatencies };
}

/**
 * 清理所有用户的 presence
 */
async function cleanupAllPresence(page: Page, userIds: string[]) {
  for (const userId of userIds) {
    await page.evaluate((uid) => {
      (window as Window & { __removePresence?: (uid: string) => Promise<void> }).__removePresence?.(uid);
    }, userId);
  }
}

// ==================== Incremental Tests ====================

test.describe('S17-P1-2: Firebase Real Integration', () => {
  const TEST_USERS = ['user-1', 'user-2', 'user-3', 'user-4', 'user-5'];

  test.afterEach(async ({ page }) => {
    await cleanupAllPresence(page, TEST_USERS);
  });

  /**
   * FP-01: 真实 Firebase 配置下 PresenceAvatars 渲染
   *
   * 验证：Firebase configured = true 时，PresenceAvatars 组件可见
   */
  test('FP-01: PresenceAvatars renders when Firebase is configured', async ({ page }) => {
    // 注入 Firebase 配置（模拟真实配置）
    await page.addInitScript(() => {
      window.sessionStorage.setItem('firebase_configured', 'true');
    });

    await page.goto(`${BASE_URL}/canvas/${TEST_CANVAS}`);
    await page.waitForTimeout(1000); // 等待 Firebase 初始化

    const avatars = page.locator('[data-testid="presence-avatars"]');

    // Firebase 已配置时，组件必须可见
    const isConfigured = await page.evaluate(() =>
      (window as Window & { __isFirebaseConfigured?: () => boolean }).__isFirebaseConfigured?.() ?? false
    );

    if (isConfigured) {
      await expect(avatars).toBeVisible({ timeout: 5000 });
    }
  });

  /**
   * FP-02: 5 用户并发 presence 更新延迟 < 3s
   *
   * 验证：5 个用户同时 setPresence，p95 延迟 < 3000ms
   */
  test('FP-02: 5 users concurrent presence update latency < 3s', async ({ page }) => {
    await page.goto(`${BASE_URL}/canvas/${TEST_CANVAS}`);
    await page.waitForTimeout(2000);

    const { setLatencies } = await measureSetPresenceLatency(page, TEST_USERS, 10);

    const maxLatency = Math.max(...setLatencies);
    const sorted = [...setLatencies].sort((a, b) => a - b);
    const p95 = sorted[Math.floor(sorted.length * 0.95)];

    console.log(`Presence set latency: max=${maxLatency}ms, p95=${p95}ms`);

    expect(p95).toBeLessThan(3000);
    expect(maxLatency).toBeLessThan(5000);
  });

  /**
   * FP-03: Firebase 未配置时 PresenceAvatars 不渲染
   *
   * 验证：isFirebaseConfigured() === false 时，组件不挂载
   */
  test('FP-03: PresenceAvatars does not render when Firebase not configured', async ({ page }) => {
    // 强制 mock 模式
    await page.addInitScript(() => {
      window.sessionStorage.setItem('firebase_configured', 'false');
    });

    await page.goto(`${BASE_URL}/canvas/${TEST_CANVAS}`);
    await page.waitForTimeout(1000);

    const avatars = page.locator('[data-testid="presence-avatars"]');

    // 验证 isFirebaseConfigured() 返回 false
    const isConfigured = await page.evaluate(() =>
      (window as Window & { __isFirebaseConfigured?: () => boolean }).__isFirebaseConfigured?.() ?? false
    );
    expect(isConfigured).toBe(false);

    // PresenceAvatars 必须不渲染（不可见或不存在）
    await expect(avatars).not.toBeVisible();
  });

  /**
   * FP-04: 降级策略：网络错误时降级到 polling 模式
   *
   * 验证：模拟 Firebase 连接失败时，UI 显示 polling 模式提示
   */
  test('FP-04: Degradation to polling mode on network error', async ({ page }) => {
    // 注入 Firebase 配置（使组件渲染）
    await page.addInitScript(() => {
      window.sessionStorage.setItem('firebase_configured', 'true');
    });

    // 注入网络错误模拟（第一次 Firebase 调用失败）
    await page.route('**/firebaseio.com/**', (route) => {
      // 第一次调用返回错误，模拟网络问题
      route.abort('failed');
    });

    await page.goto(`${BASE_URL}/canvas/${TEST_CANVAS}`);
    await page.waitForTimeout(3000); // 等待降级策略触发

    // 验证降级到 polling 模式
    const pollingIndicator = page.locator('[data-testid="presence-polling-mode"]');
    const isPolling = await pollingIndicator.isVisible().catch(() => false);

    // polling 模式应该显示，或至少应该有降级文案
    if (isPolling) {
      await expect(pollingIndicator).toBeVisible();
    } else {
      // 检查降级文案（不应该是空白）
      const statusText = await page.locator('[data-testid="presence-status"]').textContent();
      expect(statusText?.trim().length).toBeGreaterThan(0);
    }
  });

  /**
   * FP-05: Firebase Emulator 支持本地开发
   *
   * 验证：FIREBASE_EMULATOR 环境变量下，connect、使用 emulator host
   */
  test('FP-05: Firebase Emulator mode for local development', async ({ page }) => {
    await page.addInitScript(() => {
      window.sessionStorage.setItem('firebase_emulator', 'true');
    });

    await page.goto(`${BASE_URL}/canvas/${TEST_CANVAS}`);
    await page.waitForTimeout(2000);

    // 验证是否使用 emulator host
    const isUsingEmulator = await page.evaluate(() =>
      (window as Window & { __isUsingFirebaseEmulator?: () => boolean }).__isUsingFirebaseEmulator?.() ?? false
    );

    expect(isUsingEmulator).toBe(true);
  });
});
```

### 5.3 降级策略实现要点

```typescript
// vibex-fronted/src/lib/firebase/presence.ts

export interface PresenceConfig {
  /** Firebase 初始化超时（ms），超时后降级 */
  initTimeout: number; // 默认: 2000
  /** 是否使用 polling 降级模式 */
  fallbackToPolling: boolean;
  /** Polling 间隔（ms） */
  pollingInterval: number; // 默认: 30000
}

/** 降级决策函数 */
export function shouldDegrade(config: PresenceConfig, error?: Error): DegradeStrategy {
  if (!isFirebaseConfigured()) {
    return 'mock'; // 完全不连接
  }

  if (error?.message?.includes('PERMISSION_DENIED')) {
    return 'readonly'; // 只读模式（本地缓存）
  }

  if (config.initTime > config.initTimeout) {
    return 'lazy'; // 延迟激活
  }

  if (error) {
    return config.fallbackToPolling ? 'polling' : 'error'; // polling 或 error
  }

  return 'live'; // 正常实时连接
}
```

---

## 6. DoD Checklist

- [ ] Firebase 冷启动 benchmark 报告产出（admin + client SDK 均 < 500ms p95）
- [ ] 5 用户并发 presence 更新延迟 p95 < 3s
- [ ] `isFirebaseConfigured() === false` 时 PresenceAvatars 不渲染（Playwright 断言通过）
- [ ] 降级策略在 mock 和真实环境均可触发（至少 3 种降级路径已测试）
- [ ] `pnpm playwright test firebase-presence.spec.ts` 全通过（5 tests）
- [ ] Firebase Emulator 支持本地开发测试
- [ ] Benchmark 报告已保存至 `docs/benchmarks/firebase-benchmark-*.json`

---

## 7. 执行依赖

| 类型 | 内容 |
|------|------|
| 需要修改的文件 | `vibex-fronted/src/lib/firebase/presence.ts`（降级策略实现）<br>`vibex-fronted/tests/benchmarks/firebase-benchmark.ts`（新建） |
| 需要修改的文件（E2E） | `vibex-fronted/tests/e2e/firebase-presence.spec.ts`（补充 3 个新测试） |
| 前置依赖 | S16-P1-1 Firebase mock（已就绪） |
| 环境变量 | `VITE_FIREBASE_*`（真实配置）或 `FIREBASE_EMULATOR=true` |
| 预计工时 | 2d |
| 验证命令 | `pnpm playwright test firebase-presence.spec.ts && pnpm benchmark:firebase` |
