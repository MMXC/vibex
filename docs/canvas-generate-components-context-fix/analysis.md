# Canvas Generate Components Context Fix 分析报告

> **分析日期**: 2026-04-05
> **分析者**: analyst agent
> **项目**: canvas-generate-components-context-fix

---

## 1. 执行摘要

**⚠️ 注意**: 此分析与 `vibex-canvas-context-selection`（同时进行）是**同一 Bug**，问题描述相同：用户勾选上下文后点击"继续组件树"，API 请求中 contexts 数组为空。

**参考**: 详细分析见 `/root/.openclaw/vibex/docs/vibex-canvas-context-selection/analysis.md`

---

## 2. Bug 概述

| 项目 | 值 |
|------|-----|
| **Bug 描述** | 上下文树勾选后未传入 contexts 参数 |
| **严重度** | P0 |
| **根因** | BoundedContextTree checkbox 调用 `toggleContextNode`（确认）而非 `onToggleSelect`（多选）|
| **修复工时** | ~0.3h |

---

## 3. 与 vibex-canvas-context-selection 的关系

| 项目 | 描述 | 差异 |
|------|------|------|
| vibex-canvas-context-selection | 同一 Bug，coord 先派发 | ✅ 完整分析已产出 |
| canvas-generate-components-context-fix | 同一 Bug，coord 后派发 | 可合并到上一个分析 |

**合并建议**: 后续 PRD 只需引用 `vibex-canvas-context-selection/analysis.md`，无需重复分析。

---

## 4. 核心发现

### 4.1 根因

BoundedContextTree checkbox 调用了错误的函数：
```typescript
// 错误（当前）
onChange={() => { toggleContextNode(node.nodeId); }}

// 正确（应该）
onChange={() => { onToggleSelect?.(node.nodeId); }}
```

### 4.2 修复方案

**方案 A（推荐，0.3h）**: 修改 `BoundedContextTree.tsx` 第 233 行，让 checkbox 调用 `onToggleSelect`

### 4.3 验收标准

| ID | 标准 |
|----|------|
| AC1 | 点击 checkbox 添加到 selectedNodeIds |
| AC2 | 与 BusinessFlowTree checkbox 行为一致 |

---

## 5. 结论

此任务与 `vibex-canvas-context-selection` 是同一 Bug，建议合并后续工作。完整分析见上方参考文档。
