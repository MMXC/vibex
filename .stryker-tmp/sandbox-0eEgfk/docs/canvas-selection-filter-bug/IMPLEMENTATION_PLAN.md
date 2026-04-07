# Implementation Plan: Canvas Selection Filter Bug Fix

> **项目**: canvas-selection-filter-bug
> **阶段**: dev-epic1
> **版本**: 1.0.0
> **日期**: 2026-03-31
> **Architect**: Architect Agent
> **工作目录**: /root/.openclaw/vibex/vibex-fronted

---

## 1. 概述

### Bug 描述
已勾选上下文卡片和流程卡片，点击继续后请求体未过滤未选卡片，全量数据发送。

### 修复方案
使用 `node.confirmed` 属性过滤已确认的节点，而不是 `selectedNodeIds`。

**关键决策**: `selectedNodeIds` (Ctrl+click card body multi-select) 用于批量删除操作；`node.confirmed` (绿色勾选框) 用于确认节点并进入下一阶段。本修复使用 `confirmed` 过滤，因为"继续"按钮的语义是处理已确认的节点。

---

## 2. 代码修改

### 2.1 handleContinueToComponents 修复

**文件**: `src/components/canvas/CanvasPage.tsx`

```typescript
// Before (Bug): 发送所有节点
const mappedContexts = contextNodes.map(...)
const mappedFlows = flowNodes.map(...)

// After (Fix): 只发送已确认节点
const mappedContexts = contextNodes
  .filter((ctx) => ctx.confirmed)
  .map(...)
const mappedFlows = flowNodes
  .filter((f) => f.confirmed)
  .map(...)
```

### 2.2 autoGenerateFlows 修复

**文件**: `src/components/canvas/CanvasPage.tsx`

```typescript
// Before (Bug): 传递所有 contextNodes
onClick={() => autoGenerateFlows(contextNodes)}

// After (Fix): 只传递已确认的 contextNodes
onClick={() => autoGenerateFlows(contextNodes.filter((c) => c.confirmed))}
```

**影响 2 处调用**:
- Phase=input 时显示的"生成流程树"按钮
- Phase=context 时显示的"继续到流程树"按钮

---

## 3. 变更文件

```
src/components/canvas/
└── CanvasPage.tsx    # 3处修改 (handleContinueToComponents + 2处 autoGenerateFlows 调用)
```

---

## 4. 验证

### 4.1 构建验证
```bash
npm run build  # 必须通过
```

### 4.2 类型检查
```bash
npx tsc --noEmit  # 必须通过
```

### 4.3 单元测试
```bash
npx jest canvasStore.test.ts  # 63+ tests pass
npx jest --testPathPatterns="canvas"  # 31 suites, 535 tests
```

### 4.4 E2E 测试
```bash
BASE_URL=http://localhost:3000 npx playwright test tests/e2e/canvas-expand.spec.ts
# 预期: 5/5 pass
```

---

## 5. 验收检查清单

- [x] handleContinueToComponents 过滤 confirmed=false 的 contextNodes
- [x] handleContinueToComponents 过滤 confirmed=false 的 flowNodes
- [x] autoGenerateFlows 调用只传递 confirmed=true 的 contextNodes (2处)
- [x] TypeScript 编译通过
- [x] 构建通过
- [x] 单元测试通过 (535 tests)
- [x] E2E 测试通过 (5 tests)
- [x] Commit 已推送

---

## 6. 与 Architecture 差异说明

Architecture 文档描述使用 `selectedNodeIds: Set<string>` 过滤，但实际分析发现:

1. `selectedNodeIds` 是 `Record<TreeType, string[]>` 类型，用于 Ctrl+click card body 批量选择
2. `node.confirmed` 是节点确认状态，通过绿色勾选框设置
3. "继续"按钮的语义是处理已确认的节点 → 应使用 `confirmed` 过滤

Architecture 描述的 `filterSelectedCards(selectedNodeIds)` 适用于批量删除场景，不适用于 phase continue 场景。

---

*本文档由 Dev Agent 生成*
