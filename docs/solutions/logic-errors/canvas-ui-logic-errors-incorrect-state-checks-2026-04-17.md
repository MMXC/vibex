---
title: Canvas Tree 按钮启用状态错误 — isActive vs status 语义混淆
date: "2026-04-17"
category: docs/solutions/logic-errors/
module: vibex-canvas
problem_type: logic_error
component: frontend_stimulus
severity: medium
symptoms:
  - "E1-F1.1: 后端 400 错误信息显示为通用 'API 请求失败: 400'，无法透传后端错误描述"
  - "E2-F2.1: 所有 flows 均为 deactive 时，'Generate Components' 按钮仍错误 enabled"
  - "E2-F2.2: 组件生成期间导航离开后返回，按钮永久 disabled（unmount 状态泄漏）"
  - "F3.1: 存在 deactive 节点时，'Show Diff' 按钮仍错误 enabled"
  - "F4.1: 节点未勾选时，'Continue' 按钮已 enabled（status 非 'confirmed'）"
  - "F4.2: 'Confirm All' 点击后 allConfirmed 状态不正确"
  - "F4.3: Panel lock (inactivePanel) 永不显示（prop 未从 CanvasPage 传入）"
root_cause:
  - async_timing
  - logic_error
  - scope_issue
resolution_type: code_fix
related_components:
  - BusinessFlowTree.tsx
  - BoundedContextTree.tsx
  - ProjectBar.tsx
  - canvasApi.ts
tags:
  - react-tsx
  - canvas-ui
  - conditional-logic
  - async-await
  - component-state
  - isactive-vs-status
---

# Canvas Tree 按钮启用状态错误 — isActive vs status 语义混淆

## Problem

7 个 UI 状态/逻辑 Bug，涉及三个 React 树组件（BusinessFlowTree、BoundedContextTree、ProjectBar），导致按钮 enabled/disabled 状态在特定状态组合下行为错误，以及后端错误信息无法透传到前端。

## Symptoms

1. **E1-F1.1** — 后端 400 错误显示为通用 "API 请求失败: 400" 而非后端返回的描述性信息
2. **E2-F2.1** — 所有 flows 均为 deactive 时，"Generate Components" 按钮仍错误 enabled
3. **E2-F2.2** — 组件生成期间导航离开再返回，按钮永久 disabled（unmount 状态泄漏）
4. **F3.1** — 存在 deactive 节点时，"Show Diff" 按钮仍错误 enabled
5. **F4.1** — 节点未勾选时，"Continue" 按钮已 enabled（status 非 'confirmed'）
6. **F4.2** — "Confirm All" 点击后 allConfirmed 状态不正确（advancePhase 不更新 status/isActive）
7. **F4.3** — Panel lock (inactivePanel) 永不显示（prop 未从 CanvasPage 传入）

## What Didn't Work

- **E1-F1.1**: 在非 async 函数中 return Promise — 调用方 await 的是同步返回值而非 Promise
- **F4.2**: `advancePhase()` 只推进 phase，不更新节点的 `status`/`isActive` 状态。`allConfirmed` 基于 status 计算，所以看不到确认操作

## Solution

### E1-F1.1 — `handleResponseError` async/await

**Before:**
```typescript
// canvasApi.ts
function handleResponseError(res: Response): Error {
  return res.json().then(data => {
    const msg = data.error || data.message || data.details || res.statusText;
    return new Error(`API 请求失败: ${res.status} — ${msg}`);
  });
}
// 调用方:
.catch(handleResponseError) // Promise 未被 await!
```

**After:**
```typescript
async function handleResponseError(res: Response): Promise<Error> {
  let data: any;
  try { data = await res.json(); } catch { data = {}; }
  const msg = data.error || data.message || data.details || res.statusText;
  return new Error(`API 请求失败: ${res.status} — ${msg}`);
}
// 调用方: await handleResponseError(res) 或 .catch(e => handleResponseError(e).then(err => { throw err; }))
```

### E2-F2.1 — `canGenerateComponents` flowsToSend 校验

**Before:**
```typescript
const canGenerateComponents = flowNodes.length > 0;
```

**After:**
```typescript
function computeTreePayload(nodes: FlowNode[]): TreePayload {
  const contextsToSend = nodes.filter(n => n.isActive !== false);
  const flowsToSend = contextsToSend.flatMap(c => c.flows || []).filter(f => f.isActive !== false);
  return { contextsToSend, flowsToSend };
}
const canGenerateComponents = contextsToSend.length > 0 && flowsToSend.length > 0;
```

### E2-F2.2 — `componentGenerating` unmount cleanup

**Before:**
```typescript
useEffect(() => {
  if (generateError) { setComponentGenerating(false); }
}, [generateError]);
```

**After:**
```typescript
useEffect(() => {
  return () => setComponentGenerating(false); // unmount 时清理
}, []);
```

### F3.1 — `hasAllNodes` isActive !== false

**Before:**
```typescript
const hasAllNodes = nodes.length > 0;
```

**After:**
```typescript
const hasAllNodes = nodes.every(n => n.isActive !== false);
```

### F4.1 — `allConfirmed` status === 'confirmed'

**Before:**
```typescript
const allConfirmed = contextNodes.every(n => n.isActive !== false);
```

**After:**
```typescript
const allConfirmed = contextNodes.every(n => n.status === 'confirmed');
```

### F4.2 — `handleConfirmAll` 原子性状态更新

**Before:**
```typescript
const handleConfirmAll = () => advancePhase();
```

**After:**
```typescript
const handleConfirmAll = () => {
  contextNodes.forEach((n) => confirmContextNode(n.nodeId));
};
```

### F4.3 — Panel lock 审计结论

**发现:** `inactivePanel` 使用 `isActive` prop，CanvasPage 未传入该 prop → inactivePanel 永不显示
**处理:** 无需代码修改，记录为已知限制

## Why This Works

所有 Bug 的根本原因：**计算状态与用户操作语义不匹配**：
- `isActive !== false` 是展示 prop，不是交互状态。用它来控制需要反映用户确认（`status === 'confirmed'`）或数据可用性（`flowsToSend.length`）的按钮，必然泄漏错误状态
- async bug（E1-F1.1）失败原因：非 async 函数返回 Promise，等价于返回同步值 — 10 处调用点全部 await 了个寂寞
- unmount 泄漏（E2-F2.2）：异步操作期间的状态变更在组件卸载时无清理路径

## Prevention

1. **Bool gate 必须反映操作语义，而非数据存在性。** 如果按钮需要用户确认步骤，用 `status === 'confirmed'` 而非 `isActive !== false`
2. **Async 错误处理器必须是 `async` 函数返回 `Promise<Error>`**，而非返回 Promise 的同步函数。Lint 规则：enforce `async` on functions returning `Promise`
3. **异步操作期间的状态变更需要清理路径** — AbortController 或 useEffect cleanup
4. **测试所有状态组合**：`canGenerateComponents` 需覆盖（flows=[], flows=allDeactive, flows=partial, flows=allActive）。`allConfirmed` 需覆盖（0 节点、部分 confirmed、全 confirmed）
5. **最小单元测试覆盖**：canvasApi 8 个、BusinessFlowTree 4+4+2 个、ProjectBar 4 个、BoundedContextTree 3+3 个

## Related Docs

本 sprint 的问题与以下已有 docs 高度重叠（重复犯同类错误）：

- `vibex-tab-consolidation.md` — **"禁用状态掩盖了真实访问路径" / disabled 是静默拒绝**
- `vibex-canvas-implementation-fix-20260411.md` — **OQ-1 isActive 字段语义未澄清**（精确命中本次 root cause）
- `vibex-canvas-qa-fix.md` — TabBar phase guard 读取错误 store 的问题
- `vibex-canvas-auth-fix.md` — API hook unmount cleanup 模式
- `canvas-flowtree-guard-fix.md` — guard 与 active 状态必须同步

> ⚠️ **历史重复问题**：`isActive vs status` 语义混淆已在上游 4+ 个 canvas 项目中重复出现。预防规则已存在于 `vibex-tab-consolidation.md` 和 `vibex-canvas-implementation-fix-20260411.md`，但执行落地不足。建议：添加 pre-commit hook 或 linter 规则，专门检测树按钮启用逻辑引用 `isActive` 而非 `status` 的代码模式。

## Commits

| Epic | 描述 | Commit |
|------|------|--------|
| E1-F1.1 | handleResponseError 添加 async/await | `2a10b064` |
| E2-F2.1 | computeTreePayload flowsToSend 校验 | `3f8a8b52` |
| E2-F2.2 | componentGenerating unmount cleanup | `4d2d73b9` |
| F3.1 | hasAllNodes every(isActive !== false) | `a38f79be` |
| F4.1 | allConfirmed status === 'confirmed' | `4ca97fd6` |
| F4.2 | handleConfirmAll 原子性 confirmContextNode | `1085762e` |
| F4.3 | Panel lock 审计（无需代码修改） | `2edb5eb1` |

## Metadata

- **Sprint**: vibex-canvas-ux-fix
- **Epic 数量**: 4
- **Story/Fix 数量**: 7
- **测试新增**: BusinessFlowTree 10 个、ProjectBar 4 个、BoundedContextTree 6 个、canvasApi 8 个
- **Changelog**: CHANGELOG.md 已更新 7 条记录
