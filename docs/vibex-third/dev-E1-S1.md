# dev-E1-S1: TanStack Query 统一 API Client

**项目**: vibex-third
**阶段**: dev
**日期**: 2026-04-08
**Epic**: E1 TanStack Query 统一 API Client

---

## 产出

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/lib/api/client.ts` | 新建 | TanStack Query API Client |
| `src/services/api/client.ts` | 修改 | 补充 metrics/logRequest 接口 |
| `docs/vibex-third/dev-E1-S1.md` | 新建 | 本文档 |

---

## 实现内容

### src/lib/api/client.ts（新建）

TanStack Query 层，与现有 `src/services/api/client.ts`（axios 层）互补：

- `queryClient` — 全局 QueryClient 实例（staleTime=1m, gcTime=5m）
- `apiMetrics` — API 指标（requests/failures/latency P50/P95/P99）
- `recordLatency()` / `recordFailure()` — 指标记录（1000条滚动窗口）
- `apiRequest()` — 统一请求包装，自动跟踪延迟和失败
- `logRequest` 回调支持

### src/services/api/client.ts（修改）

补充 E1-S1 接口定义：

- `Percentiles` / `ApiMetrics` 接口
- `HttpClientConfig.logRequest` 配置项
- `HttpClient.metrics` 属性（requests/failures/latency P50/P95/P99）

---

## 验收

- [x] `src/lib/api/client.ts` 存在且可导入
- [x] `apiMetrics.latency` 包含 p50/p95/p99
- [x] `logRequest` 回调可注册
- [x] 1000条滚动窗口，不超过内存上限
- [x] npm run build 通过

---

## 提交记录

- `b22c5277` — feat(api): 统一 API Client 指标跟踪 (vibex-third E1-S1)
- `f3a819dd` — docs(vibex-third): E1-S1 标记完成
