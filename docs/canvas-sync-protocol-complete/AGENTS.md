# AGENTS.md: canvas-sync-protocol-complete

**项目**: canvas-sync-protocol-complete
**日期**: 2026-04-03

---

## 开发约束

### ADR 遵守（强制）

| ADR | 内容 | 约束方 |
|-----|------|--------|
| ADR-003 | API 统一前缀 `/api/v1/canvas/` | 所有 API 调用必须使用此前缀 |
| E1 约束 | `debounceMs = 2000`（不变） | useAutoSave 不得修改 debounce 延迟 |
| E3 约束 | Beacon 保存 beforeunload 时必须触发 | useAutoSave saveBeacon 不变 |
| ADR-001 | 不重写 CardTreeRenderer，只扩展 adapter | 前端不得修改 TreePanel 渲染逻辑 |

### 前端约束

1. **不修改** `SaveIndicator.tsx` 的现有 idle/saving/saved/error 状态 UI，只扩展 conflict 分支
2. **不修改** `useAutoSave.ts` 的 debounce 逻辑（2s 不可改）
3. **ConflictDialog** 作为独立组件，挂载在 `canvas/page.tsx`，不侵入已有组件
4. **版本轮询** 在 `useAutoSave.ts` 的独立 `useEffect` 中实现，不影响现有保存流程
5. **canvasApi.ts** 新增 `getLatestVersion()` 方法，不修改现有方法签名

### 后端约束

1. **乐观锁** 版本比较使用 `<=`（小于等于即冲突）
2. **409 响应体** 必须包含 `serverSnapshot.data`（全量三树数据），否则前端无法恢复
3. **Restore** 不删除原快照，创建新版本快照实现恢复
4. **轻量检测** `/latest` 端点不返回 data 字段
5. **Prisma transaction** 用于 version 检查 + 插入的原子性

### 测试约束

1. **覆盖率**: 行 ≥ 65%，分支 ≥ 50%
2. **E2E 测试**: 必须在真实浏览器（Chromium）通过，不用 jsdom 模拟
3. **Flaky 测试**: retries=3，连续 5 次 CI 无 flaky 才算完成
4. **Snapshot 测试**: UI 组件测试用 jest-dom，不截图 diff

---

## 开发限制

### 禁止事项

- ❌ 禁止在 `canvasStore` 外部修改三树状态（除非通过 ConflictDialog）
- ❌ 禁止删除或修改已有的 snapshot 数据（restore 必须创建新版本）
- ❌ 禁止缩短轮询间隔至 < 15s（避免服务端压力）
- ❌ 禁止在 ConflictDialog 之外手动触发 conflict 状态

### 强制事项

- ✅ 所有 API 路径必须通过 `canvasApi.ts` 封装，不直接 fetch
- ✅ 409 响应必须包含 `serverSnapshot.data`，否则需要更新 API 类型定义
- ✅ E2E 测试必须在 headless Chromium 中通过
- ✅ 每次 merge 前必须通过所有单元测试 + E2E 测试

---

## 文件路径约定

```
后端:
  src/app/api/v1/canvas/snapshots/route.ts       ← POST + GET 列表 + GET latest
  src/app/api/v1/canvas/snapshots/[id]/route.ts ← GET 单个
  src/app/api/v1/canvas/snapshots/[id]/restore/route.ts ← POST restore

前端:
  src/components/canvas/features/ConflictDialog.tsx  ← 新建
  src/hooks/canvas/useAutoSave.ts                ← 修改
  src/lib/canvas/api/canvasApi.ts                ← 修改
  src/components/canvas/features/SaveIndicator.tsx ← 修改
  app/canvas/page.tsx                              ← 修改

测试:
  vibex-backend/src/app/api/v1/canvas/snapshots/route.test.ts
  vibex-fronted/src/hooks/canvas/__tests__/useAutoSave.test.ts
  tests/e2e/conflict-resolution.spec.ts
```

---

## 协作接口

### Dev ← Architect

| 接口 | 方向 | 内容 |
|------|------|------|
| `canvasApi.createSnapshot()` | 前端→后端 | 携带 version 乐观锁 |
| `canvasApi.getLatestVersion()` | 前端→后端 | 轮询检测（新增） |
| `canvasApi.restoreSnapshot()` | 前端→后端 | 恢复指定快照 |
| `useAutoSave.conflictData` | 后端→前端 | 传递 serverSnapshot |
| `ConflictDialogProps` | architect→dev | 组件接口定义 |

### Coord → Dev

- phase2 开发任务派发
- 阻塞时打回重做
