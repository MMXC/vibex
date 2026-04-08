# dev-E1-S4: SSE 数据写入 Query 缓存

**项目**: vibex-third
**阶段**: dev
**日期**: 2026-04-09
**Epic**: E1 TanStack Query 统一 API Client
**依赖**: E1-S1, E1-S2

---

## 产出

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/lib/api/sseToQueryBridge.ts` | 新建 | SSE → Query 缓存桥接 |
| `docs/vibex-third/dev-E1-S4.md` | 新建 | 本文档 |

---

## 实现内容

### src/lib/api/sseToQueryBridge.ts

SSE → TanStack Query 缓存桥接，防止 SSE 数据绕过 Query 缓存层：

- `createSseBridge(qc)` — 工厂函数，输入 QueryClient
- `stepContextHandlers()` — SSE 步骤到达时 `setQueryData()`
- `doneHandlers()` — SSE 完成时 `invalidateQueries()`
- `errorHandlers()` — SSE 错误时 `cancelQueries()`

**使用方式**：
```typescript
import { createSseBridge } from '@/lib/api/sseToQueryBridge';

const bridge = createSseBridge(queryClient);
await canvasSseAnalyze(requirement, {
  ...bridge.stepContextHandlers(),
  ...bridge.doneHandlers(),
  ...bridge.errorHandlers(),
});
```

---

## E1-S4 验收

- [x] `sseToQueryBridge.ts` 存在且可导入
- [x] `setQueryData` 在 SSE 步骤到达时调用
- [x] `invalidateQueries` 在 SSE 完成时调用
- [x] `cancelQueries` 在 SSE 错误时调用

---

## 关联

- E1-S1: TanStack Query API Client — `src/lib/api/client.ts`
- E1-S2: TanStack Query Hooks — `src/hooks/queries/`
- E1-S3: 消除散落 axios — stores 已合规
- E1-S4: SSE → Query 桥接 — `src/lib/api/sseToQueryBridge.ts`
