# E1-Analytics API修复+Dashboard Widget — Reviewer 验证报告

**Agent**: tester (reviewer-e1 任务)
**Epic**: E1
**项目**: vibex-proposals-20260425-143000
**验证时间**: 2026-04-25 17:39 GMT+8
**验证人**: TESTER

---

## 一、Reviewer 验收结果

**任务**: reviewer-e1（Reviewer 驳回后重新验收）

**驳回原因（来自 reviewer-e1 下游失败）**:
- B1: API contract mismatch — GET /api/v1/analytics returns `{ events:[], count:N }` but AnalyticsWidget expects `{ metrics:{page_view:[],...}, period:{...} }`. Widget.json.metrics is always undefined.
- B2: Production API returns 500.
- S1: Missing E2E tests for AnalyticsWidget.

---

## 二、代码层面验证

### B1: API Contract Mismatch

**Widget 期望** (`AnalyticsWidget.tsx:24-30`):
```typescript
interface AnalyticsData {
  metrics: MetricData;
  period: { start: string; end: string };
}
// MetricData = { page_view: MetricPoint[], component_create: MetricPoint[], chat_message: MetricPoint[], api_call: MetricPoint[] }
```

**API 返回** (`analytics.ts`):
```json
{
  "status": "healthy",
  "latency": { "p50": N, "p95": N, "p99": N },
  "events": [...],
  "count": N,
  "total_size": N
}
```

**验证结果**: 🔴 BUG CONFIRMED

| 检查项 | 期望 | 实际 | 结果 |
|--------|------|------|------|
| `json.metrics` 存在 | `{ metrics, period }` | `{ status, events, count }` | 🔴 FAIL |
| `json.period` 存在 | `{ start, end }` | 不存在 | 🔴 FAIL |
| `json.status` 返回 | 未定义 | "healthy" | ⚠️ 不匹配 |

**证据**:
```typescript
// Widget line 341-343:
const hasData = json.metrics &&
  (Object.keys(json.metrics) as Array<keyof MetricData>).some(
    (k) => (json.metrics[k]?.length ?? 0) > 0
  );
// json.metrics === undefined → hasData = false → always 'empty' state

// API response never has 'metrics' field
```

**修复建议**: Backend analytics.ts 需重构返回格式以匹配 Widget 期望：
```typescript
// 期望格式
{
  "metrics": {
    "page_view": [{ "time": "2026-04-25", "value": 42 }, ...],
    "component_create": [...],
    "chat_message": [...],
    "api_call": [...]
  },
  "period": { "start": "2026-04-24", "end": "2026-04-25" }
}
```

### B2: Production API 返回 500

**Widget 访问的端点** (`AnalyticsWidget.tsx:309`):
```typescript
const ANALYTICS_ENDPOINT = 'https://api.vibex.top/api/v1/analytics';
```

**验证结果**: ⚠️ 无法在本地验证（需 staging/production 环境）

**修复建议**: 配置 `NEXT_PUBLIC_ANALYTICS_API_URL` 环境变量，staging 指向测试 API，确保 CI 环境下 `/api/v1/analytics` 返回正确格式。

### S1: Missing E2E Tests

| 检查项 | 期望 | 实际 | 结果 |
|--------|------|------|------|
| AnalyticsWidget E2E 测试 | `tests/e2e/analytics-widget.spec.ts` 存在 | 不存在 | 🔴 FAIL |
| Analytics API E2E 测试 | `tests/e2e/analytics-api.spec.ts` 存在 | 不存在 | 🔴 FAIL |

**修复建议**: 添加 `tests/e2e/analytics-widget.spec.ts`：
```typescript
test('E1-S1.1: widget renders success state with mock API', async ({ page }) => {
  await page.route('https://api.vibex.top/api/v1/analytics', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        metrics: { page_view: [{ time: '2026-04-25', value: 42 }] },
        period: { start: '2026-04-24', end: '2026-04-25' }
      })
    });
  });
  await page.goto('/dashboard');
  await expect(page.locator('[data-testid="analytics-widget"]')).toBeVisible();
});

test('E1-S1.2: widget renders empty state when no metrics', async ({ page }) => {
  await page.route('https://api.vibex.top/api/v1/analytics', (route) => {
    route.fulfill({ status: 200, contentType: 'application/json', body: '{"metrics":{},"period":{}}' });
  });
  // ...
});
```

---

## 三、结论

| Bug ID | 严重度 | 状态 | 说明 |
|--------|--------|------|------|
| B1: API contract mismatch | P0 | 🔴 未修复 | Backend 返回格式与 Widget 期望不匹配 |
| B2: Production API 500 | P0 | ⚠️ 未验证 | 需 staging 环境验证 |
| S1: Missing E2E tests | P1 | 🔴 未修复 | 无 analytics widget E2E 测试 |

**Reviewer 结论**: 🔴 rejected

**修复优先级**:
1. **P0 - 立即修复**: 重构 analytics.ts 返回格式匹配 `{ metrics, period }`
2. **P0 - 立即修复**: 配置环境变量使 staging API 返回正确格式
3. **P1**: 添加 E2E 测试覆盖 Widget

---

## 四、修复后验收 Checklist

- [ ] Backend `/api/v1/analytics` 返回 `{ metrics: {...}, period: {...} }`
- [ ] Widget 访问 API 后进入 `success` 状态（不是 `empty` 或 `error`）
- [ ] E2E 测试 `tests/e2e/analytics-widget.spec.ts` 存在且通过
- [ ] Staging 环境 `https://api.vibex.top/api/v1/analytics` 返回 200 且格式正确