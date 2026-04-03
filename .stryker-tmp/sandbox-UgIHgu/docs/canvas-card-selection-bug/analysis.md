# Analysis: canvas-card-selection-bug

**Bug**: 卡片选择过滤器失效 — 已勾选的上下文/流程卡片，点击继续后请求体未过滤未选卡片，全量数据发送

**Priority**: P0  
**Date**: 2026-03-31  
**Analyst**: analyst

---

## 1. 执行摘要

多选机制 (`selectedNodeIds`) 与 API 请求体构造完全脱节。用户通过 Ctrl+Click 或批量勾选 deselect 某些卡片后，点击"继续"按钮时后端仍收到全部卡片数据，导致未确认/未选中的卡片被错误包含在请求中。

**根因**: API 调用点均使用 `.map()` 遍历全部节点，未按 `selectedNodeIds` 过滤。

**推荐方案**: 最小修复 — 在 `handleContinueToComponents` 中增加基于 `selectedNodeIds` 的过滤逻辑（~2h）。

---

## 2. 问题定义

### 2.1 现象
用户可以在画布上通过以下方式对上下文/流程卡片进行多选：
- **Ctrl/Cmd+Click** 切换单卡选中状态
- **拖选框** 批量选中多张卡片
- **全选/清空** 批量操作按钮

但选中部分卡片并点击"继续 → 流程树"或"继续 → 组件树"后，发送的请求体包含所有卡片数据，而非仅选中的卡片。

### 2.2 影响范围
| 阶段 | 入口 | 影响 |
|------|------|------|
| 上下文树 → 流程树 | `autoGenerateFlows` | 错误的 contexts 数组发送给 `generateFlows` API |
| 流程树 → 组件树 | `handleContinueToComponents` (CanvasPage) | 错误的 contexts + flows 发送给 `generateComponents` API |
| 流程树 → 组件树 | `handleContinueToComponents` (BusinessFlowTree) | 同上 |

### 2.3 根本原因：两套独立的状态体系

画布中存在**两套独立的状态**，但 API 调用**只用了其中一套**：

| 状态 | 用途 | 是否用于 API 过滤 |
|------|------|------------------|
| `node.confirmed` | 确认状态（决定是否参与 AI 生成） | ❌ handleConfirmAll 忽略选区 |
| `selectedNodeIds` | 多选状态（批量操作） | ❌ **完全未使用** |

---

## 3. 代码定位

### 3.1 Bug 1: `handleConfirmAll` 不尊重选区

**文件**: `BoundedContextTree.tsx:439`

```typescript
const handleConfirmAll = useCallback(() => {
  const unconfirmedIds = contextNodes  // ← ALL nodes, ignores selectedNodeIds
    .filter((n) => !n.confirmed)
    .map((n) => n.nodeId);

  unconfirmedIds.forEach((nodeId) => {
    confirmContextNode(nodeId);  // confirms ALL, not just selected
  });

  advancePhase();  // 无论选了什么，都推进阶段
}, [...]);
```

**问题**: 无论用户在多选区选择了什么，点击"确认所有 → 继续"都会确认**全部**未确认卡片。

### 3.2 Bug 2: `autoGenerateFlows` 发送所有上下文

**文件**: `canvasStore.ts:739`

```typescript
autoGenerateFlows: async (contexts) => {
  const mappedContexts = contexts.map((ctx) => ({  // ← 接收到的就是 ALL contexts
    id: ctx.nodeId,
    name: ctx.name,
    ...
  }));
  const result = await canvasApi.generateFlows({
    contexts: mappedContexts,  // ← 无过滤
    sessionId,
  });
}
```

当 `confirmContextNode` 将最后一个上下文标记为 confirmed 时，自动触发 `autoGenerateFlows`，传入**所有**上下文（而非用户选中的子集）。

### 3.3 Bug 3: `handleContinueToComponents` (CanvasPage) 忽略选区

**文件**: `CanvasPage.tsx:458`

```typescript
const handleContinueToComponents = useCallback(async () => {
  // Bug: maps ALL contextNodes, ignores selectedNodeIds
  const mappedContexts = contextNodes.map((ctx) => ({  // ← ALL nodes
    id: ctx.nodeId,
    name: ctx.name,
    description: ctx.description ?? '',
    type: ctx.type,
  }));

  const mappedFlows = flowNodes.map((f) => ({  // ← ALL nodes
    name: f.name,
    contextId: f.contextId,
    steps: f.steps.map((step) => ({ name: step.name, actor: step.actor })),
  }));

  const result = await canvasApi.generateComponents({
    contexts: mappedContexts,  // ← 无过滤
    flows: mappedFlows,       // ← 无过滤
    sessionId,
  });
}, [...]);
```

### 3.4 Bug 4: `handleContinueToComponents` (BusinessFlowTree) 同样的问题

**文件**: `BusinessFlowTree.tsx:761`

```typescript
const mappedContexts = contextNodes.map((ctx) => ({  // ← ALL nodes
  id: ctx.nodeId,
  name: ctx.name,
  description: ctx.description ?? '',
  type: ctx.type,
}));

const mappedFlows = flowNodes.map((f) => ({  // ← ALL nodes
  name: f.name,
  contextId: f.contextId,
  steps: f.steps.map((step) => ({
    name: step.name,
    actor: step.actor,
  })),
}));
```

---

## 4. 现状分析

### 4.1 选区状态管理

**文件**: `canvasStore.ts` Multi-Select Slice

```typescript
selectedNodeIds: { context: [], flow: [], component: [] },

toggleNodeSelect: (tree, nodeId) => { /* updates selectedNodeIds */ },
selectAllNodes: (tree) => { /* selects ALL nodes */ },
clearNodeSelection: (tree) => { /* clears selection */ },
deleteSelectedNodes: (tree) => { /* bulk delete - DOES use selection */ },
```

关键发现：`deleteSelectedNodes` **正确使用了 `selectedNodeIds`** 进行过滤，但 API 生成函数均未使用。

### 4.2 UI 控件现状

| 控件 | 位置 | 行为 |
|------|------|------|
| Ctrl+Click 卡牌 | BoundedContextTree.tsx:161 | 调用 `toggleNodeSelect`，更新 `selectedNodeIds` |
| 拖选框 | BoundedContextTree.tsx:461 | 批量添加到 `selectedNodeIds` |
| 确认 Checkbox | BoundedContextTree.tsx:246 | 调用 `confirmContextNode`，仅更新 `node.confirmed` |
| 删除选中 (N) | BoundedContextTree.tsx:538 | 调用 `deleteSelectedNodes('context')` — **正确过滤** |
| 确认所有 → 继续 | BoundedContextTree.tsx:439 | 调用 `confirmContextNode` for ALL — **忽略选区** |
| 继续 → 组件树 | CanvasPage.tsx:450 | 发送 ALL nodes — **忽略选区** |

---

## 5. 方案对比

### 方案 A: 最小修复 — 在 API 调用层过滤（推荐）

**思路**: 不改变确认逻辑，在 `handleContinueToComponents` 中增加基于 `selectedNodeIds` 的过滤。

**修改点**:
1. `CanvasPage.tsx` — `handleContinueToComponents`: 若 `selectedNodeIds.context.length > 0`，过滤 contextNodes；若 `selectedNodeIds.flow.length > 0`，过滤 flowNodes
2. `BusinessFlowTree.tsx` — `handleContinueToComponents`: 同上

**优点**: 改动最小，不影响现有确认流程，用户操作习惯不变  
**缺点**: `handleConfirmAll` 仍会确认全部卡片（但 API 层已过滤，结果正确）

**工时**: 1-2h

### 方案 B: 中等修复 — 增加"确认选中项"按钮

**思路**: 在多选控件区增加"确认选中 (N)"按钮，替换"确认所有"，点击后仅确认选中的卡片。

**修改点**:
1. `BoundedContextTree.tsx` — 将"确认所有"替换为条件渲染：
   - 选中 N 项时: 显示"确认选中 (N)"
   - 未选中时: 显示"确认所有"
2. API 层同上（方案 A）

**优点**: 用户可以只确认部分卡片，更符合 mental model  
**缺点**: 增加了 UI 分支

**工时**: 3-4h

### 方案 C: 完整重构 — 确认状态由选区驱动

**思路**: 废止独立的 `confirmed` 状态，改为由 `selectedNodeIds` 驱动确认流程。

**修改点**:
1. 重构 `confirmContextNode` → 使用 `toggleNodeSelect` 的语义
2. 移除所有"确认所有"逻辑
3. 统一选区和确认的概念

**优点**: 概念清晰，代码简化  
**缺点**: 改动大，可能影响其他依赖 `confirmed` 的逻辑

**工时**: 8-12h

---

## 6. 推荐方案

**方案 A (最小修复)** — 理由：

1. **风险最低**: 不改变确认流程和 UI，仅在 API 层增加过滤
2. **工期最短**: 1-2h，可立即上线
3. **效果等价**: 用户选中的卡片会进入 API 请求，未选中卡片被过滤
4. **向后兼容**: 不影响现有单卡确认操作

### 具体修改

#### 6.1 CanvasPage.tsx — handleContinueToComponents

```typescript
// 在 const mappedContexts 前增加:
const selectedContextIds = new Set(selectedNodeIds.context);
const filteredContextNodes = selectedContextIds.size > 0
  ? contextNodes.filter(n => selectedContextIds.has(n.nodeId))
  : contextNodes;

const selectedFlowIds = new Set(selectedNodeIds.flow);
const filteredFlowNodes = selectedFlowIds.size > 0
  ? flowNodes.filter(n => selectedFlowIds.has(n.nodeId))
  : flowNodes;

// 替换:
const mappedContexts = filteredContextNodes.map((ctx) => ({...}));
const mappedFlows = filteredFlowNodes.map((f) => ({...}));
```

注意：需要从 canvasStore 获取 `selectedNodeIds`:
```typescript
const selectedNodeIds = useCanvasStore((s) => s.selectedNodeIds);
```

#### 6.2 BusinessFlowTree.tsx — handleContinueToComponents

同上，在 `mappedContexts` 和 `mappedFlows` 构造前增加过滤逻辑。

---

## 7. 验收标准

| # | 标准 | 验证方法 |
|---|------|----------|
| 1 | 选中部分上下文卡片后点击继续，请求体仅包含选中的卡片 | 手动测试 + 网络拦截 |
| 2 | 未选中任何卡片时，点击继续发送全部卡片（向后兼容） | 手动测试 |
| 3 | 选中部分流程卡片后点击继续，请求体仅包含选中的流程 | 手动测试 |
| 4 | 单卡确认不受影响 | 回归测试 |
| 5 | 批量删除选中的卡片功能正常 | 手动测试 |
| 6 | handleConfirmAll 仍能确认所有未确认卡片 | 手动测试 |

---

## 8. 风险评估

| 风险 | 影响 | 缓解 |
|------|------|------|
| 遗漏其他 API 调用点 | 中 | 全局搜索 `contextNodes.map` 和 `flowNodes.map` |
| selectedNodeIds 为空 Set 时行为变更 | 低 | 显式判断 `size > 0` 再过滤 |
| 回归影响确认流程 | 低 | 方案 A 不修改确认逻辑 |

---

## 9. 相关文件

```
vibex-fronted/src/
├── components/canvas/
│   ├── BoundedContextTree.tsx      # handleConfirmAll (Bug 1)
│   ├── BusinessFlowTree.tsx        # handleContinueToComponents (Bug 4)
│   └── CanvasPage.tsx             # handleContinueToComponents (Bug 3)
└── lib/canvas/
    └── canvasStore.ts              # confirmContextNode + autoGenerateFlows (Bug 2)
```
