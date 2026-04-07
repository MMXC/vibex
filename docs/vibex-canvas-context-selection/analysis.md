# Canvas Context Selection Bug 分析报告

> **分析日期**: 2026-04-05
> **分析者**: analyst agent
> **项目**: vibex-canvas-context-selection

---

## 1. 执行摘要

| 项目 | 值 |
|------|-----|
| **Bug 描述** | 用户勾选上下文后点击"继续组件树"，请求中 contexts 数组为空 |
| **严重度** | P0 — 用户无法选择性发送上下文到组件生成 |
| **根因** | `BusinessFlowTree.tsx` 发送 ALL `contextNodes`，未读取 `selectedNodeIds` |
| **影响** | 多选上下文后继续，API 收到空数组；或发送了非预期的全部上下文 |
| **修复工时** | ~0.5h（最小修复）/ 1h（完整修复）|

---

## 2. 问题复现路径

```
1. 用户在上下文树 Ctrl+Click 勾选若干上下文（selectedNodeIds.context 更新）
2. 用户点击"继续到流程树" → 正常（autoGenerateFlows 发送 ALL 上下文）
3. 用户在流程树点击"继续到组件树" → ❌
   → BusinessFlowTree.tsx 读取 contextNodes（可能为空）
   → 请求 contexts: [] → API 返回错误或无数据
```

---

## 3. 根因分析

### 3.1 代码对比

**错误代码** — `BusinessFlowTree.tsx`（第 766-771 行）:
```typescript
// 发送 ALL contextNodes，无 selection 检查
const mappedContexts = contextNodes.map((ctx) => ({
  id: ctx.nodeId,
  name: ctx.name,
  description: ctx.description ?? '',
  type: ctx.type,
}));
```

**正确代码** — `CanvasPage.tsx`（第 345-350 行）:
```typescript
// 读取 selectedNodeIds，优先发送选中项
const activeContexts = contextNodes.filter((ctx) => ctx.isActive !== false);
const selectedContextSet = new Set(selectedNodeIds.context);
const contextsToSend = selectedContextSet.size > 0
  ? activeContexts.filter((ctx) => selectedContextSet.has(ctx.nodeId))
  : activeContexts;
```

**差异**: `BusinessFlowTree.tsx` 没有 `selectedNodeIds` 读取逻辑，直接发送全部上下文。

### 3.2 两种失败模式

| 模式 | 场景 | 结果 |
|------|------|------|
| **A: contextNodes 为空** | 用户在流程树阶段，未生成上下文 | `mappedContexts = []` → API 空请求 |
| **B: 发送全部而非选中** | 用户只选了部分上下文，想只发送选中的 | 发送了 ALL 上下文（行为不一致）|

### 3.3 历史演变

| 日期 | 变更 | 影响 |
|------|------|------|
| Epic 3 (2026-03-28) | 确认 checkbox 移除 selection 逻辑 | 分离了"确认状态"和"选中状态" |
| Epic 3 (2026-03-31) | Cascade 手动触发移除 | context → flow 不再自动同步 selection |
| Epic 4 (2026-04-xx) | BusinessFlowTree.tsx 独立 | `handleContinueToComponents` 未引入 selection 检查 |

---

## 4. 修复方案

### 方案 A：最小修复（~0.5h，推荐 P0 立即执行）

在 `BusinessFlowTree.tsx` 中引入 `selectedNodeIds` 检查：

```typescript
import { useContextStore } from '@/lib/canvas/stores/contextStore';

// 在 handleContinueToComponents 中添加:
const selectedContextSet = new Set(selectedNodeIds.context);
const activeContexts = contextNodes.filter((ctx) => ctx.isActive !== false);
const contextsToSend = selectedContextSet.size > 0
  ? activeContexts.filter((ctx) => selectedContextSet.has(ctx.nodeId))
  : activeContexts;

// 如果为空，降级为全部（避免 API 报错）
const mappedContexts = contextsToSend.length > 0
  ? contextsToSend.map(...)
  : contextNodes.map(...);  // fallback: 全部
```

**优点**: 与 `CanvasPage.tsx` 行为一致，改动小
**缺点**: 如果用户未选择任何上下文，仍会发送全部（fallback 行为）

### 方案 B：完整修复（~1h）

统一 FlowTree 的 `handleContinueToComponents` 和 CanvasPage 的行为，并增加错误提示：

```typescript
// 新增：未选中任何上下文时的警告
const contextsToSend = selectedContextSet.size > 0
  ? activeContexts.filter((ctx) => selectedContextSet.has(ctx.nodeId))
  : activeContexts;

// 如果仍为空（contextNodes 也为空），给出明确错误
if (contextsToSend.length === 0 && contextNodes.length === 0) {
  toast.showToast('请先生成上下文树', 'error');
  setComponentGenerating(false);
  return;
}

// 如果未选中但有上下文，询问用户意图
if (contextsToSend.length === 0 && contextNodes.length > 0 && selectedContextSet.size === 0) {
  toast.showToast('请先勾选要发送的上下文，或 Ctrl+Click 选择', 'info');
  setComponentGenerating(false);
  return;
}
```

**优点**: 行为清晰，有错误提示
**缺点**: 需要更多 UX 设计

---

## 5. 验收标准

| ID | 标准 | 验证方法 |
|----|------|----------|
| AC1 | 选中上下文后继续，发送选中的上下文 | Ctrl+Click 选中 → 继续 → 检查 API 请求 bodies |
| AC2 | 未选中时继续，fallback 发送全部 | 未选择 → 继续 → bodies 包含全部 contexts |
| AC3 | contextNodes 为空时点击继续，显示错误提示 | 清除上下文 → 继续 → toast 提示 |
| AC4 | 与 CanvasPage 行为一致 | 对比两个入口的 API bodies |

---

## 6. 相关文件

| 文件 | 修改类型 |
|------|----------|
| `src/components/canvas/BusinessFlowTree.tsx` | 修复（添加 selectedNodeIds 检查）|

---

## 7. 下一步

1. **方案选择**: 推荐方案 A（0.5h），快速对齐两个入口的行为
2. **实现**: 在 `BusinessFlowTree.tsx` 中引入 `useContextStore` 的 `selectedNodeIds`
3. **测试**: 验证选中/未选中/fallback 三种场景

---

**结论**: 根因是 `BusinessFlowTree.tsx` 的 `handleContinueToComponents` 直接发送全部 `contextNodes`，未读取 `selectedNodeIds`。最小修复 0.5h，与 `CanvasPage.tsx` 行为对齐即可解决。
