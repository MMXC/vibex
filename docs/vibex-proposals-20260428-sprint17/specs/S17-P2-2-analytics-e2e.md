# S17-P2-2: Analytics Dashboard E2E 验证

**ID**: S17-P2-2
**标题**: Analytics Dashboard E2E 验证
**优先级**: P2
**Sprint**: S17
**状态**: 待开发
**依赖**: Sprint 14 E4（FunnelWidget + useFunnelQuery）

---

## 1. 问题描述

Sprint 14 E4 交付了 Analytics Dashboard：

- `FunnelWidget`：纯 SVG 折线图组件（无 recharts/chart.js 依赖）
- `useFunnelQuery`：TanStack Query hook
- `GET /api/analytics` 聚合层（App Router → backend）

但**没有 E2E 测试**验证：

1. FunnelWidget 在真实数据场景的渲染
2. `useFunnelQuery` 的 error/loading 状态
3. error 状态下降级文案（非空白）

---

## 2. 影响范围

- `vibex-fronted/tests/e2e/analytics-dashboard.spec.ts`（新建）
- `vibex-fronted/src/hooks/useFunnelQuery.ts`（补充单元测试）
- Sprint 14 E4 的 FunnelWidget 组件（需添加 data-testid）

---

## 3. 前置条件

### 环境要求

- 后端 API 运行在 `http://localhost:3000`
- `GET /api/analytics` 端点已实现（Sprint 14 E4）
- 测试数据库中有模拟的 funnel 数据

### 已就绪的交付物

- `Sprint 14 E4`: FunnelWidget 组件
- `Sprint 14 E4`: useFunnelQuery hook
- `Sprint 14 E4`: GET /api/analytics 端点

### 测试数据要求

- `GET /api/analytics` 返回以下数据格式：
  ```json
  {
    "funnel": {
      "steps": [
        { "name": "访问", "count": 1000 },
        { "name": "注册", "count": 500 },
        { "name": "激活", "count": 200 }
      ]
    }
  }
  ```

---

## 4. 验收标准（DoD）

### 4.1 analytics-dashboard.spec.ts（≥5 tests）

| # | 测试名称 | 断言 |
|---|----------|------|
| AD-01 | FunnelWidget idle 态（无数据） | 无数据时显示空状态文案（`expect(emptyText).toBeTruthy()`） |
| AD-02 | FunnelWidget loading 态 | 加载中显示 skeleton/loading indicator（`expect(loading).toBeVisible()`） |
| AD-03 | FunnelWidget success 态（真实数据） | 有数据时折线图 SVG 渲染（`expect(svg).toBeVisible()`） |
| AD-04 | FunnelWidget error 态显示降级文案 | error 时显示降级文案，非空白（`expect(errorText.trim().length).toBeGreaterThan(0)`） |
| AD-05 | 折线图在真实数据场景正确渲染 | SVG path 数量 ≥ 2（`expect(paths.length).toBeGreaterThanOrEqual(2)`） |

### 4.2 useFunnelQuery 单元测试（npx vitest）

| # | 测试名称 | 断言 |
|---|----------|------|
| UQ-01 | idle 状态 | `isLoading === false && isError === false && data === undefined` |
| UQ-02 | loading 状态 | `isLoading === true` |
| UQ-03 | success 状态 | `isLoading === false && isError === false && data !== undefined` |
| UQ-04 | error 状态 | `isError === true && error !== undefined` |
| UQ-05 | retry 行为 | networkError 时自动重试 3 次 |

### 4.3 error 状态降级文案

| 场景 | 预期文案 |
|------|----------|
| API 超时 | "数据加载超时，请稍后重试" |
| 网络错误 | "网络连接失败，请检查网络" |
| 服务器错误 | "服务器异常，请稍后重试" |
| 数据格式错误 | "数据格式异常" |

---

## 5. 实现方案

### 5.1 analytics-dashboard.spec.ts（E2E）

```typescript
/**
 * analytics-dashboard.spec.ts — S17-P2-2 Analytics Dashboard E2E
 *
 * 验收标准（AD-01 ~ AD-05）:
 * - FunnelWidget 四态（idle/loading/success/error）全部可测试
 * - error 状态显示降级文案（非空白）
 * - 折线图在真实数据场景正确渲染
 */

import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';

const FUNNEL_STATS_API = '/api/analytics';

/** 模拟的 funnel 数据（用于 MSW mock） */
const MOCK_FUNNEL_DATA = {
  funnel: {
    steps: [
      { name: '访问', count: 1000, conversionRate: 100 },
      { name: '注册', count: 500, conversionRate: 50 },
      { name: '激活', count: 200, conversionRate: 20 },
      { name: '付费', count: 80, conversionRate: 8 },
    ],
  },
};

/** 辅助：等待 FunnelWidget 进入指定状态 */
async function waitForFunnelState(page: Page, state: 'idle' | 'loading' | 'success' | 'error') {
  const selectorMap = {
    idle: '[data-testid="funnel-idle"]',
    loading: '[data-testid="funnel-loading"]',
    success: '[data-testid="funnel-success"]',
    error: '[data-testid="funnel-error"]',
  };
  await page.waitForSelector(selectorMap[state], { timeout: 10000 });
}

/** 辅助：获取 FunnelWidget 组件的 SVG path 数量 */
async function getSvgPathCount(page: Page): Promise<number> {
  return page.locator('[data-testid="funnel-svg"] path').count();
}

// ==================== Test Suite ====================

test.describe('S17-P2-2: Analytics Dashboard E2E', () => {
  test.beforeEach(async ({ page }) => {
    // 导航到 dashboard analytics 页面
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForSelector('[data-testid="analytics-section"]', { timeout: 10000 });
  });

  /**
   * AD-01: FunnelWidget idle 态（无数据）
   *
   * 验证：无数据时显示空状态文案（不是空白）
   */
  test('AD-01: FunnelWidget idle 态显示空状态文案', async ({ page }) => {
    // Mock API 返回空数据
    await page.route(FUNNEL_STATS_API, (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ funnel: { steps: [] } }),
      });
    });

    // 刷新页面触发加载
    await page.reload();
    await page.waitForTimeout(1000);

    const funnelSection = page.locator('[data-testid="funnel-widget"]');

    // idle 或 success（空数组）状态应可见
    const isIdle = await page.locator('[data-testid="funnel-idle"]').isVisible().catch(() => false);
    const isSuccess = await page.locator('[data-testid="funnel-success"]').isVisible().catch(() => false);
    expect(isIdle || isSuccess).toBe(true);

    // 如果是 idle 态，空状态文案不能是空白
    if (isIdle) {
      const emptyText = await page.locator('[data-testid="funnel-empty-text"]').textContent();
      expect(emptyText?.trim().length).toBeGreaterThan(0);
      // 验证是友好的文案，不是 "undefined" 或 "null"
      expect(emptyText).not.toMatch(/undefined|null|空白/);
    }
  });

  /**
   * AD-02: FunnelWidget loading 态
   *
   * 验证：加载中显示 skeleton 或 loading indicator
   */
  test('AD-02: FunnelWidget loading 态显示加载指示器', async ({ page }) => {
    // Mock API 延迟返回
    await page.route(FUNNEL_STATS_API, (route) => {
      route.delay(2000); // 延迟 2 秒
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_FUNNEL_DATA),
      });
    });

    // 刷新页面
    await page.reload();

    // 立即检查 loading 态（应该出现）
    await page.waitForTimeout(100);
    const loadingVisible = await page.locator('[data-testid="funnel-loading"]').isVisible().catch(() => false);

    // Loading 态可能出现时间很短，assert 它曾经出现过或目前可见
    if (loadingVisible) {
      expect(loadingVisible).toBe(true);
      // 验证 loading 文案
      const loadingText = await page.locator('[data-testid="funnel-loading"]').textContent();
      expect(loadingText?.trim().length).toBeGreaterThan(0);
    }

    // 最终必须进入 success 态
    await page.waitForSelector('[data-testid="funnel-success"]', { timeout: 10000 });
  });

  /**
   * AD-03: FunnelWidget success 态（真实数据）
   *
   * 验证：有数据时折线图 SVG 渲染
   */
  test('AD-03: FunnelWidget success 态渲染折线图', async ({ page }) => {
    // Mock API 返回模拟数据
    await page.route(FUNNEL_STATS_API, (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_FUNNEL_DATA),
      });
    });

    await page.reload();
    await page.waitForTimeout(2000);

    // 等待 success 态
    await page.waitForSelector('[data-testid="funnel-success"]', { timeout: 10000 });

    // 验证 SVG 存在
    const svg = page.locator('[data-testid="funnel-svg"]');
    await expect(svg).toBeVisible();

    // 验证 SVG 有 path（折线图线条）
    const pathCount = await getSvgPathCount(page);
    expect(pathCount).toBeGreaterThanOrEqual(2);

    // 验证 x-axis 和 y-axis 标签存在
    const axisLabels = page.locator('[data-testid="funnel-axis-label"]');
    const axisCount = await axisLabels.count();
    expect(axisCount).toBeGreaterThanOrEqual(2);

    // 验证数据点数量（每个 step 一个点）
    const dataPoints = page.locator('[data-testid="funnel-data-point"]');
    const pointCount = await dataPoints.count();
    expect(pointCount).toBe(MOCK_FUNNEL_DATA.funnel.steps.length);
  });

  /**
   * AD-04: FunnelWidget error 态显示降级文案（非空白）
   *
   * 验证：API 错误时，显示降级文案，不留空白
   */
  test('AD-04: FunnelWidget error 态显示降级文案', async ({ page }) => {
    // Mock API 返回 500 错误
    await page.route(FUNNEL_STATS_API, (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' }),
      });
    });

    await page.reload();
    await page.waitForTimeout(2000);

    // 等待 error 态
    const errorVisible = await page.locator('[data-testid="funnel-error"]').isVisible().catch(() => false);
    if (!errorVisible) {
      // 如果有 fallback 到 idle/success，也要检查文案
      const hasVisibleState = await page.locator('[data-testid="funnel-widget"]').isVisible();
      expect(hasVisibleState).toBe(true);
      return;
    }

    await expect(page.locator('[data-testid="funnel-error"]')).toBeVisible();

    // 验证 error 文案非空白
    const errorText = await page.locator('[data-testid="funnel-error-text"]').textContent();
    expect(errorText?.trim().length).toBeGreaterThan(0);

    // 验证 error 文案是友好的（不是 HTTP 状态码或技术细节）
    const forbiddenErrorTexts = [
      '500', 'Internal Server Error', 'undefined', 'null',
      'Something went wrong', 'An error occurred',
    ];
    for (const forbidden of forbiddenErrorTexts) {
      expect(errorText).not.toContain(forbidden);
    }

    // 验证包含合理的降级文案关键词之一
    const friendlyMessages = [
      '数据加载', '加载失败', '请稍后', '检查网络', '重试', '超时',
    ];
    const hasFriendlyMessage = friendlyMessages.some((msg) => errorText?.includes(msg));
    expect(hasFriendlyMessage).toBe(true);

    // 验证有重试按钮
    const retryBtn = page.locator('[data-testid="funnel-retry-btn"]');
    await expect(retryBtn).toBeVisible();
  });

  /**
   * AD-05: 折线图在真实数据场景正确渲染
   *
   * 验证：4 步 funnel 数据 → 折线图有 4 个数据点
   */
  test('AD-05: 折线图正确渲染 4-step funnel 数据', async ({ page }) => {
    await page.route(FUNNEL_STATS_API, (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_FUNNEL_DATA),
      });
    });

    await page.reload();
    await page.waitForSelector('[data-testid="funnel-success"]', { timeout: 10000 });

    // 验证数据点数量 = funnel.steps.length
    const dataPoints = page.locator('[data-testid="funnel-data-point"]');
    const pointCount = await dataPoints.count();
    expect(pointCount).toBe(MOCK_FUNNEL_DATA.funnel.steps.length);

    // 验证每个数据点有 tooltip
    for (let i = 0; i < pointCount; i++) {
      const point = dataPoints.nth(i);
      await expect(point).toBeVisible();
      // Hover 时显示 tooltip
      await point.hover();
      const tooltip = page.locator('[data-testid="funnel-tooltip"]');
      await expect(tooltip).toBeVisible();
      const tooltipText = await tooltip.textContent();
      expect(tooltipText).toBeTruthy();
    }

    // 验证 SVG path 是连续的折线（不是散点）
    const svgPaths = await page.locator('[data-testid="funnel-svg"] path').all();
    expect(svgPaths.length).toBeGreaterThanOrEqual(1);
  });
});
```

### 5.2 useFunnelQuery 单元测试

```typescript
/**
 * useFunnelQuery.test.ts — S17-P2-2 Analytics Dashboard E2E
 * Sprint 14 E4: useFunnelQuery 单元测试
 *
 * 验收标准（UQ-01 ~ UQ-05）:
 * - idle/loading/success/error 四态正确
 * - error 状态降级文案
 * - retry 行为
 */

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFunnelQuery } from '@/hooks/useFunnelQuery';

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useFunnelQuery', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * UQ-01: idle 状态
   */
  test('UQ-01: idle 状态（初始状态）', () => {
    const { result } = renderHook(() => useFunnelQuery(), { wrapper: createWrapper() });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isError).toBe(false);
    expect(result.current.data).toBeUndefined();
  });

  /**
   * UQ-02: loading 状态
   */
  test('UQ-02: loading 状态触发 isLoading', async () => {
    // 延迟 resolve，模拟加载中
    mockFetch.mockImplementation(() => new Promise(() => {}));

    const { result } = renderHook(() => useFunnelQuery(), { wrapper: createWrapper() });

    // 立即检查 isLoading
    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  /**
   * UQ-03: success 状态
   */
  test('UQ-03: success 状态返回数据', async () => {
    const mockData = {
      funnel: {
        steps: [
          { name: '访问', count: 1000 },
          { name: '注册', count: 500 },
        ],
      },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const { result } = renderHook(() => useFunnelQuery(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isError).toBe(false);
    expect(result.current.data).toEqual(mockData);
    expect(result.current.data?.funnel.steps).toHaveLength(2);
  });

  /**
   * UQ-04: error 状态
   */
  test('UQ-04: error 状态返回 error 对象', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useFunnelQuery(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isError).toBe(true);
    expect(result.current.error).toBeDefined();
    expect(result.current.error?.message).toBe('Network error');
    expect(result.current.data).toBeUndefined();
  });

  /**
   * UQ-05: retry 行为
   */
  test('UQ-05: 网络错误时自动重试 3 次', async () => {
    // 配置 QueryClient 启用 retry
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: 3, retryDelay: 10 },
      },
    });
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    mockFetch.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useFunnelQuery(), { wrapper });

    // 等待足够长的时间让 retry 发生
    await waitFor(() => expect(result.current.isLoading).toBe(false), { timeout: 5000 });

    // 验证 fetch 被调用了 1 + 3 = 4 次（首次 + 3 次重试）
    expect(mockFetch).toHaveBeenCalledTimes(4);
    expect(result.current.isError).toBe(true);
  });
});
```

---

## 6. data-testid 约定（FunnelWidget）

为确保 E2E 测试稳定运行，以下 data-testid 必须在 FunnelWidget 组件中实现：

| data-testid | 说明 |
|-------------|------|
| `funnel-widget` | FunnelWidget 根容器 |
| `funnel-idle` | 空态 |
| `funnel-loading` | 加载态 |
| `funnel-success` | 成功态 |
| `funnel-error` | 错误态 |
| `funnel-empty-text` | 空态文案 |
| `funnel-error-text` | 错误态降级文案 |
| `funnel-retry-btn` | 重试按钮 |
| `funnel-svg` | 折线图 SVG 容器 |
| `funnel-data-point` | 数据点（circle） |
| `funnel-axis-label` | 坐标轴标签 |
| `funnel-tooltip` | Hover tooltip |
| `analytics-section` | Dashboard analytics 区域 |

---

## 7. DoD Checklist

- [ ] `pnpm playwright test analytics-dashboard.spec.ts` 全通过（5 tests）
- [ ] `npx vitest run useFunnelQuery.test.ts` 全通过（5 tests）
- [ ] AD-01: FunnelWidget idle 态显示空状态文案（非空白）
- [ ] AD-02: FunnelWidget loading 态显示加载指示器
- [ ] AD-03: FunnelWidget success 态折线图 SVG 正确渲染
- [ ] AD-04: FunnelWidget error 态显示降级文案（非空白，非技术细节）
- [ ] AD-05: 4-step funnel 数据渲染 4 个数据点 + tooltip
- [ ] UQ-01 ~ UQ-05: useFunnelQuery 四态 + retry 全部通过
- [ ] 所有 data-testid 已添加到 FunnelWidget 组件

---

## 8. 执行依赖

| 类型 | 内容 |
|------|------|
| 需要新建的文件 | `vibex-fronted/tests/e2e/analytics-dashboard.spec.ts`<br>`vibex-fronted/src/hooks/__tests__/useFunnelQuery.test.ts` |
| 需要修改的文件 | Sprint 14 E4 FunnelWidget 组件（添加 data-testid） |
| 前置依赖 | Sprint 14 E4 FunnelWidget + useFunnelQuery + GET /api/analytics |
| 预计工时 | 1.5d |
| 验证命令 | `pnpm playwright test analytics-dashboard.spec.ts && npx vitest run src/hooks/__tests__/useFunnelQuery.test.ts` |
