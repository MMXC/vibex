# Implementation Plan: Architect Proposals — 2026-04-12 Sprint

**Project**: vibex-architect-proposals-vibex-proposals-20260412
**Stage**: implementation-plan
**Date**: 2026-04-07
**Status**: Proposed

---

## Overview

| 属性 | 值 |
|------|-----|
| 总工时 | 10.5h |
| 优先级 | P1 (A-P1-*), P2 (A-P2-*) |
| 风险等级 | 低（增量修改） |

---

## Phase 1: A-P1-2 Canvas ErrorBoundary (1h)

### 1.1 目标
三栏（ContextTree / FlowTree / ComponentTree）各自独立 ErrorBoundary，隔离崩溃。

### 1.2 文件
- `vibex-fronted/src/components/canvas/panels/ContextTreePanel.tsx`（新建）
- `vibex-fronted/src/components/canvas/panels/FlowTreePanel.tsx`（新建）
- `vibex-fronted/src/components/canvas/panels/ComponentTreePanel.tsx`（新建）

### 1.3 步骤
```bash
# Step 1: 创建 ContextTreePanel.tsx（包裹 ContextTree）
# Step 2: 创建 FlowTreePanel.tsx（包裹 FlowTree）
# Step 3: 创建 ComponentTreePanel.tsx（包裹 ComponentTree）
# Step 4: 修改 CanvasPage 使用 Panel 组件替代直接渲染
```

### 1.4 验收标准
- [ ] 任意一栏崩溃时，其他两栏正常渲染
- [ ] 崩溃栏显示 fallback UI（含重试按钮）
- [ ] canvasLogger 记录崩溃错误

---

## Phase 2: A-P1-1 packages/types API Schema 落地 (2h)

### 2.1 目标
backend/frontend 统一引用 `@vibex/types`，消除手动断言。

### 2.2 文件
- `packages/types/src/api/canvas.ts`（扩展）
- `packages/types/src/api/canvasSchema.ts`（扩展）
- `vibex-backend/src/app/api/v1/canvas/*/route.ts`（引用）
- `vibex-fronted/src/hooks/canvas/useCanvasPreview.ts`（引用）

### 2.3 步骤
```bash
# Step 1: 扫描 backend 所有独立类型定义
grep -rn "interface.*Response\|type.*Response" vibex-backend/src/app/api/

# Step 2: 迁移到 packages/types
# Step 3: backend 路由替换为 import from '@vibex/types'
# Step 4: frontend fetch 返回类型安全
```

### 2.4 验收标准
- [ ] backend 所有 v1 API 路由引用 `@vibex/types`
- [ ] frontend fetch 不再返回 `unknown`
- [ ] `pnpm tsc --noEmit` → 0 error

---

## Phase 3: A-P1-3 v0→v1 迁移收尾 (2h)

### 3.1 目标
所有 v0 路由添加 Deprecation Header，frontend 调用方迁移到 v1。

### 3.2 文件
- `vibex-backend/src/middleware/deprecation.ts`（新建）
- `vibex-backend/src/app.ts`（注册中间件）
- `vibex-fronted/src/**/*route*.ts`（更新调用方）

### 3.3 步骤
```bash
# Step 1: 创建 deprecation.ts 中间件
# Step 2: 注册到 app.ts: app.use('/api/*', withDeprecation)
# Step 3: 扫描 frontend v0 调用方
grep -rn "/api/projects\|/api/plan/analyze" vibex-fronted/src/
# Step 4: 更新为 /api/v1/* 路径
```

### 3.4 验收标准
- [ ] curl -I `/api/projects` 返回 Deprecation/Sunset Header
- [ ] curl -I `/api/v1/projects` 不返回 Deprecation Header
- [ ] frontend 无 `/api/` 调用（全部迁移到 `/api/v1/`）

---

## Phase 4: A-P2-1 frontend types 对齐 (3h)

### 4.1 目标
`vibex-fronted/src/lib/canvas/types.ts` 改为 re-export，消除与 `@vibex/types` 的重复定义。

### 4.2 文件
- `vibex-fronted/src/lib/canvas/types.ts`（重构）

### 4.3 步骤
```bash
# Step 1: 备份 types.ts
cp src/lib/canvas/types.ts src/lib/canvas/types.ts.bak

# Step 2: 重构为 re-export
# Step 3: 验证无 TS 错误
pnpm tsc --noEmit

# Step 4: 运行全量测试
pnpm test
```

### 4.4 验收标准
- [ ] `types.ts` 无重复类型定义
- [ ] `pnpm tsc --noEmit` → 0 error
- [ ] 所有测试 pass

---

## Phase 5: A-P2-2 flowNodeIndex 记忆化优化 (1.5h)

### 5.1 目标
`getPageLabel` 从 O(n) 优化为 O(1)。

### 5.2 文件
- `vibex-fronted/src/components/canvas/ComponentTree.tsx`

### 5.3 步骤
```bash
# Step 1: 添加 useFlowNodeIndex hook
# Step 2: 修改 getPageLabel 支持 index 参数
# Step 3: ComponentTree 中创建并传入 index
# Step 4: Vitest 性能测试验证
```

### 5.4 验收标准
- [ ] 1000 个 flowNodes: getPageLabel < 1ms
- [ ] 现有 29 tests 仍然 pass
- [ ] 行为与原有逻辑完全一致

---

## Phase 6: A-P2-3 sessionStore localStorage 容量警戒 (1h)

### 6.1 目标
防止 localStorage 膨胀到 5MB 上限。

### 6.2 文件
- `vibex-fronted/src/lib/canvas/stores/sessionStore.ts`

### 6.3 步骤
```bash
# Step 1: 添加 safeLocalStorage middleware
# Step 2: 配置 MAX_MESSAGES=500, MAX_QUEUE=50
# Step 3: Vitest 单元测试验证截断逻辑
```

### 6.4 验收标准
- [ ] 4MB+ 时控制台警告
- [ ] messages 超过 500 条自动截断
- [ ] prototypeQueue 超过 50 条自动截断
- [ ] 最新消息优先保留

---

## Rollback Plan

| 问题 | 回滚方案 |
|------|----------|
| @vibex/types 变更 break build | `git checkout -- packages/types/` |
| ErrorBoundary 不工作 | 注释掉 Panel 组件，恢复直接渲染 |
| v0 迁移遗漏调用方 | `git checkout -- vibex-fronted/src/` |
| types.ts 重构 TS 错误 | `cp types.ts.bak types.ts` |
| flowNodeIndex 破坏原有逻辑 | 恢复原 getPageLabel 逻辑 |
| localStorage 截断丢失数据 | 注释掉 safeLocalStorage |

---

## 并行执行建议

```
Phase 1 (ErrorBoundary) ──→ Phase 4 (types 对齐，依赖 Phase 2)
         │
         └──→ Phase 3 (v0迁移)
         │
         └──→ Phase 5 (flowNodeIndex)
         │
         └──→ Phase 6 (localStorage)

Phase 2 (types 落地) ──→ Phase 4 (types 对齐)
```

**可并行**: Phase 1 + 2 + 3 + 5 + 6（无互相依赖）
**串行**: Phase 4 必须在 Phase 2 之后

