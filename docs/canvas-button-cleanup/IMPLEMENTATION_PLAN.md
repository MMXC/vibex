# Canvas 按钮系统清理实施计划

> **项目**: canvas-button-cleanup  
> **作者**: architect  
> **日期**: 2026-04-06  
> **版本**: v1.0

---

## 概述

本文档定义 E1-E4 共 4 个 Epic 的详细实施步骤、部署清单、回滚方案和成功标准。总工时 **2h**。

---

## E1: BoundedContextTree History 修复

### 详细步骤

**Step 1: 定位 BoundedContextTree.tsx 中的操作点**
```bash
grep -n "deleteContextNode\|editContextNode\|addContextNode" \
  /root/.openclaw/vibex/vibex-fronted/src/components/canvas/BoundedContextTree.tsx | head -20
```

**Step 2: 在删除操作后插入 recordSnapshot**
```typescript
// 找到 handleDelete 或对应的删除 handler
// 在 deleteContextNode 调用之前添加：
getHistoryStore().getState().recordSnapshot()
```

**Step 3: 在编辑确认后插入 recordSnapshot**
```typescript
// handleEditSave 或 handleConfirmEdit 中
getHistoryStore().getState().recordSnapshot()
editContextNode(nodeId, updates)
```

**Step 4: 在新增操作后插入 recordSnapshot**
```typescript
// handleAdd 或 handleSaveNew 中
getHistoryStore().getState().recordSnapshot()
addContextNode(newNode)
```

**Step 5: 验证**
```bash
pnpm test -- --testPathPattern="BoundedContextTree" --verbose
```

---

## E2: TreeToolbar 按钮逻辑修复

### 详细步骤

**Step 1: 确认 flowStore 已具备 selectAllNodes 等方法（E4 先完成）**
```bash
grep -n "selectAllNodes\|clearNodeSelection\|deleteSelectedNodes\|resetFlowCanvas" \
  /root/.openclaw/vibex/vibex-fronted/src/lib/canvas/stores/flowStore.ts
```

**Step 2: 修正 CanvasPage.tsx 中 Context 栏的 onDeselectAll**
```typescript
// 修复前（错误）
onDeselectAll={() => useContextStore.getState().selectAllNodes?.('context')}

// 修复后（正确）
onDeselectAll={() => useContextStore.getState().clearNodeSelection?.('context')}
```

**Step 3: 修正 Flow 栏的映射**
```typescript
// 修复前（空函数）
onSelectAll={() => {}}
onDeselectAll={() => {}}

// 修复后
onSelectAll={() => useFlowStore.getState().selectAllNodes()}
onDeselectAll={() => useFlowStore.getState().clearNodeSelection()}
onDelete={() => useFlowStore.getState().deleteSelectedNodes()}
onReset={() => {
  getHistoryStore().getState().recordSnapshot()
  useFlowStore.getState().resetFlowCanvas()
}}
```

**Step 4: 修正 Component 栏的映射**
```typescript
// 修复前
onSelectAll={() => {}}
onDeselectAll={() => {}}

// 修复后
onSelectAll={() => useComponentStore.getState().selectAllNodes?.()}
onDeselectAll={() => useComponentStore.getState().clearNodeSelection?.()}
```

**Step 5: 手动测试**
1. Flow 栏点击「全选」→ 所有节点应被选中
2. Flow 栏点击「取消」→ 所有节点应取消选中
3. Flow 栏点击「删除 (N)」→ 选中的节点应被删除

---

## E3: 删除操作 Snapshot 统一

### 详细步骤

**Step 1: 定位 BusinessFlowTree.tsx 的删除 handler**
```bash
grep -n "deleteSelectedNodes\|handleDelete\|flowStore.delete" \
  /root/.openclaw/vibex/vibex-fronted/src/components/canvas/BusinessFlowTree.tsx | head -10
```

**Step 2: 在删除前插入 recordSnapshot**
```typescript
// handleDeleteSelectedNodes 或类似函数中
getHistoryStore().getState().recordSnapshot()
flowStore.deleteSelectedNodes()
```

**Step 3: 定位 ComponentTree.tsx 的删除 handler**
```bash
grep -n "deleteSelectedNodes\|handleDelete\|componentStore.delete" \
  /root/.openclaw/vibex/vibex-fronted/src/components/canvas/ComponentTree.tsx | head -10
```

**Step 4: 在删除前插入 recordSnapshot**
```typescript
// handleDeleteSelectedNodes 中
getHistoryStore().getState().recordSnapshot()
componentStore.deleteSelectedNodes()
```

**Step 5: 验证 Ctrl+Z 撤销**
1. 删除 Flow 节点后按 Ctrl+Z → 节点恢复
2. 删除 Component 节点后按 Ctrl+Z → 节点恢复

---

## E4: Store Batch Delete 方法

### 详细步骤

**Step 1: 补充 flowStore 方法**
```typescript
// flowStore.ts 新增以下方法
selectAllNodes: () => set(s => ({
  selectedNodeIds: { ...s.selectedNodeIds, flow: s.flowNodes.map(n => n.nodeId) }
})),

clearNodeSelection: () => set(s => ({
  selectedNodeIds: { ...s.selectedNodeIds, flow: [] }
})),

deleteSelectedNodes: () => {
  getHistoryStore().getState().recordSnapshot()
  set(s => ({
    flowNodes: s.flowNodes.filter(n => !s.selectedNodeIds.flow.includes(n.nodeId)),
    selectedNodeIds: { ...s.selectedNodeIds, flow: [] }
  }))
},

resetFlowCanvas: () => {
  getHistoryStore().getState().recordSnapshot()
  set({ flowNodes: [], selectedNodeIds: { context: [], flow: [], component: [] } })
},
```

**Step 2: 补充 contextStore.deleteAllNodes**
```typescript
// contextStore.ts 新增
deleteAllNodes: () => {
  getHistoryStore().getState().recordSnapshot()
  set({ contextNodes: [], selectedNodeIds: { ...get().selectedNodeIds, context: [] } })
},
```

**Step 3: 替换 BoundedContextTree 中的 forEach 删除**
```typescript
// 修复前
contextNodes.forEach(n => deleteContextNode(n.nodeId))

// 修复后
contextStore.getState().deleteAllNodes()
```

**Step 4: Jest 测试**
```bash
pnpm test -- --testPathPattern="flowStore|contextStore" --verbose
```

---

## 部署清单

| # | 检查项 | 状态 | 备注 |
|---|--------|------|------|
| 1 | flowStore 新增 selectAllNodes/clearNodeSelection/deleteSelectedNodes/resetFlowCanvas | ✅ | E4 先完成 |
| 2 | contextStore 新增 deleteAllNodes | ✅ | E4 |
| 3 | CanvasPage.tsx Context 栏 onDeselectAll 修正 | ☐ | E2 |
| 4 | CanvasPage.tsx Flow 栏全映射修正 | ☐ | E2 |
| 5 | CanvasPage.tsx Component 栏全映射修正 | ☐ | E2 |
| 6 | BoundedContextTree.tsx 三处 snapshot 补充 | ☐ | E1 |
| 7 | BusinessFlowTree.tsx 删除 snapshot 补充 | ✅ | E3 |
| 8 | ComponentTree.tsx 删除 snapshot 补充 | ✅ | E3 |
| 9 | BoundedContextTree forEach 替换为 deleteAllNodes | ✅ | E4 |
| 10 | Ctrl+Z 撤销测试通过（Context/Flow/Component）| ☐ | 手动 |
| 11 | TreeToolbar 三栏按钮功能测试通过 | ☐ | 手动 |
| 12 | ESLint 检查通过 | ☐ | `pnpm lint` |

---

## 回滚方案

### E1 回滚
```bash
git checkout HEAD -- vibex-fronted/src/components/canvas/BoundedContextTree.tsx
```

### E2 回滚
```bash
git checkout HEAD -- \
  vibex-fronted/src/lib/canvas/stores/flowStore.ts \
  vibex-fronted/src/app/canvas/page.tsx
```

### E3 回滚
```bash
git checkout HEAD -- \
  vibex-fronted/src/components/canvas/BusinessFlowTree.tsx \
  vibex-fronted/src/components/canvas/ComponentTree.tsx
```

### E4 回滚
```bash
git checkout HEAD -- \
  vibex-fronted/src/lib/canvas/stores/flowStore.ts \
  vibex-fronted/src/lib/canvas/stores/contextStore.ts
```

### 紧急回滚触发条件

| 条件 | 触发动作 |
|------|----------|
| Ctrl+Z 撤销完全失效 | 立即回滚 E1 |
| Flow 栏全选/取消无响应 | 立即回滚 E2 |
| Flow/Component 删除后无法撤销 | 立即回滚 E3 |
| 批量删除导致节点丢失 | 立即回滚 E4 |

---

## 成功标准

| Epic | 成功条件 | 验证方法 |
|------|----------|----------|
| E1 | Context 树操作后可撤销 | 手动 Ctrl+Z |
| E2 | Flow/Component 全选/取消按钮有响应 | 手动点击 |
| E3 | Flow/Component 删除后可撤销 | 手动 Ctrl+Z |
| E4 | 批量删除只触发一次副作用 | Jest spy 计数 |

---

## 时间线

```
Day 1 (2026-04-06)
├── E4: Store Batch Delete (0.5h) ← 先做
├── E2: TreeToolbar 按钮逻辑 (0.5h) ← 依赖 E4
├── E1: BoundedContextTree History (0.5h)
├── E3: 删除 Snapshot 统一 (0.5h)
└── 验证与回归测试
```
