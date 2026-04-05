# Canvas 按钮系统清理开发规范

> **项目**: canvas-button-cleanup  
> **作者**: architect  
> **日期**: 2026-04-06  
> **版本**: v1.0

---

## 概述

本文档为 E1-E4 修复项定义强制规范、代码风格、测试要求和审查清单。

---

## 强制规范

### 变更范围

- **E1**: 仅在 `BoundedContextTree.tsx` 的 delete/edit/add 操作处添加 `recordSnapshot()` 调用
- **E2**: 仅修改 `CanvasPage.tsx` 中 TreeToolbar 的 prop 映射，不动 TreeToolbar 组件本身
- **E3**: 仅在 `BusinessFlowTree.tsx` 和 `ComponentTree.tsx` 的删除 handler 前添加 `recordSnapshot()`
- **E4**: 仅在 `flowStore.ts` 新增方法，`contextStore.ts` 新增 `deleteAllNodes`，替换 `BoundedContextTree.tsx` 中的 forEach

### Snapshot 调用规范

```typescript
// ✅ 正确：在操作状态变更之前调用 recordSnapshot
getHistoryStore().getState().recordSnapshot()
deleteContextNode(nodeId)

// ❌ 错误：在操作之后调用（时序错误）
deleteContextNode(nodeId)
getHistoryStore().getState().recordSnapshot()

// ❌ 错误：批量删除前不在循环内调用（应批量调用一次）
contextNodes.forEach(n => {
  getHistoryStore().getState().recordSnapshot()  // 每删除一个就记录一次 → 历史记录混乱
  deleteContextNode(n.nodeId)
})
```

### 禁止事项

| 禁止项 | 原因 | 替代方案 |
|--------|------|----------|
| 在 E1 中修改 Flow/Component 组件 | 范围守卫 | 仅修改 BoundedContextTree.tsx |
| 在 E2 中修改 TreeToolbar 组件 | 应改绑定而非改组件 | 修改 CanvasPage.tsx 的 prop 映射 |
| 在 E3 中修改 BoundedContextTree | E3 仅针对 Flow/Component | 不动 BoundedContextTree.tsx |
| 在 E4 中用 forEach 逐个删除 | N 次副作用 | 使用 store 的批量方法 |
| recordSnapshot 放在操作之后 | 历史时序错误 | 必须在操作状态变更之前 |

---

## 代码风格

### TypeScript

- **严格模式**: `strict: true` 必须开启
- **禁止 `any`**: 使用 `unknown` + 类型守卫
- **禁止内联类型**: 使用 `interface` 或 `type` 定义

### Snapshot 命名

```typescript
// ✅ 正确：操作描述 + Snapshot
getHistoryStore().getState().recordSnapshot()  // 在删除前调用

// ❌ 错误：模糊的命名
snapshot()  // 什么 snapshot？
```

### 导入顺序

```typescript
// 1. React / Next.js
import React from 'react'

// 2. Zustand store
import { useContextStore } from '@/lib/canvas/stores/contextStore'
import { useFlowStore } from '@/lib/canvas/stores/flowStore'

// 3. 历史记录
import { getHistoryStore } from '@/lib/canvas/stores/historyStore'

// 4. 组件
import TreeToolbar from '@/components/canvas/TreeToolbar'
```

---

## 测试要求

### 覆盖率门槛

| Epic | 覆盖率目标 | 核心断言 |
|------|-----------|----------|
| E1 | 100% | recordSnapshot 在每种操作后 canUndo |
| E2 | 90% | onSelectAll/onDeselectAll 绑定正确 |
| E3 | 100% | 删除后 canUndo |
| E4 | 90% | deleteAllNodes 原子性 |

### Jest 测试规范

```typescript
describe('E1: BoundedContextTree history', () => {
  beforeEach(() => {
    // 每个测试前清空 store 和 history
    contextStore.setState({ contextNodes: [], selectedNodeIds: { context: [], flow: [], component: [] } })
    getHistoryStore().setState({ past: [], future: [] })
  })

  it('records snapshot before delete', () => {
    const historyBefore = getHistoryStore().getState().past.length
    getHistoryStore().getState().recordSnapshot()
    deleteContextNode('node-1')
    expect(getHistoryStore().getState().past.length).toBe(historyBefore + 1)
  })

  it('can undo after delete', () => {
    getHistoryStore().getState().recordSnapshot()
    deleteContextNode('node-1')
    expect(getHistoryStore().getState().canUndo()).toBe(true)
    getHistoryStore().getState().undo()
    expect(contextStore.getState().contextNodes.find(n => n.nodeId === 'node-1')).toBeDefined()
  })
})

describe('E2: TreeToolbar mapping', () => {
  it('Flow selectAll selects all nodes', () => {
    flowStore.setState({ flowNodes: [{ nodeId: '1' }, { nodeId: '2' }] })
    flowStore.selectAllNodes()
    expect(flowStore.getState().selectedNodeIds.flow).toEqual(['1', '2'])
  })

  it('Flow clearNodeSelection deselects all', () => {
    flowStore.setState({ flowNodes: [{ nodeId: '1' }], selectedNodeIds: { context: [], flow: ['1'], component: [] } })
    flowStore.clearNodeSelection()
    expect(flowStore.getState().selectedNodeIds.flow).toEqual([])
  })
})

describe('E4: batch delete', () => {
  it('deleteAllNodes clears all in one operation', () => {
    contextStore.setState({ contextNodes: [{ nodeId: '1' }, { nodeId: '2' }] })
    getHistoryStore().getState().recordSnapshot()
    contextStore.deleteAllNodes()
    expect(contextStore.getState().contextNodes).toHaveLength(0)
  })
})
```

---

## 审查清单

### PR 提交前自检

| # | 检查项 | E1 | E2 | E3 | E4 |
|---|--------|----|----|----|----|
| 1 | 改动文件不超过规定范围 | ☐ | ☐ | ☐ | ☐ |
| 2 | recordSnapshot 在操作之前调用 | ☐ | ☐ | ☐ | ☐ |
| 3 | 无 forEach 逐个删除 | ☐ | ☐ | ☐ | ☐ |
| 4 | TypeScript 编译通过 | ☐ | ☐ | ☐ | ☐ |
| 5 | Jest 测试通过 | ☐ | ☐ | ☐ | ☐ |
| 6 | 手动 Ctrl+Z 测试通过 | ☐ | ☐ | ☐ | ☐ |

### Reviewer 审查点

#### E1: BoundedContextTree History
- [ ] delete/edit/add 三处操作全部添加了 `recordSnapshot()`
- [ ] `recordSnapshot()` 在操作状态变更**之前**，非之后
- [ ] 测试用例覆盖三种操作

#### E2: TreeToolbar 按钮逻辑
- [ ] `CanvasPage.tsx` 中 Flow 栏的 `onSelectAll` 不再是空函数
- [ ] `CanvasPage.tsx` 中 Context 栏的 `onDeselectAll` 不再调用 `selectAllNodes`
- [ ] `flowStore` 的 `selectAllNodes` / `clearNodeSelection` / `deleteSelectedNodes` 已实现

#### E3: 删除 Snapshot 统一
- [ ] BusinessFlowTree.tsx 的删除操作前有 `recordSnapshot()`
- [ ] ComponentTree.tsx 的删除操作前有 `recordSnapshot()`
- [ ] 不在 forEach 循环内重复调用 snapshot

#### E4: Store Batch Delete
- [ ] flowStore 有完整的 selectAll/clear/delete/reset 方法
- [ ] contextStore 有 `deleteAllNodes` 方法
- [ ] BoundedContextTree 不再使用 forEach 逐个删除
