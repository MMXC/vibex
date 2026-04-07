# Canvas 按钮体系整合开发规范

> **项目**: canvas-button-consolidation  
> **作者**: architect  
> **日期**: 2026-04-06  
> **版本**: v1.0

---

## 概述

本文档为 E1-E6 定义强制规范、代码风格、测试要求和审查清单。

---

## 强制规范

### 变更范围

| Epic | 改动文件 |
|------|----------|
| E1 | TreeToolbar.tsx, BoundedContextTree.tsx, BusinessFlowTree.tsx, ComponentTree.tsx, CanvasPage.tsx |
| E2 | contextStore.ts |
| E3 | flowStore.ts |
| E4 | CanvasPage.tsx, componentStore.ts |
| E5 | CanvasPage.tsx |
| E6 | __tests__/*.test.ts |

### Snapshot 调用规范

```typescript
// ✅ 正确：在操作状态变更之前调用 recordSnapshot
getHistoryStore().getState().recordSnapshot()
deleteContextNode(nodeId)

// ❌ 错误：在 forEach 循环内每项调用一次
contextNodes.forEach(n => {
  getHistoryStore().getState().recordSnapshot()  // N 次调用 → 历史记录混乱
  deleteContextNode(n.nodeId)
})
```

### 禁止事项

| 禁止项 | 原因 | 替代 |
|--------|------|------|
| 在 E1 中修改 TreeToolbar 组件结构 | 保持 TreeToolbar 组件不变 | 修改 CanvasPage.tsx prop 绑定 |
| 在 E3 中修改 contextStore | E3 只改 flowStore | 只在 flowStore.ts 新增方法 |
| 清空操作不调用 snapshot | 无法撤销 | 统一在 onReset 中调用 recordSnapshot |
| 使用 mock 数据替代真实 AI 调用 | E5 修复目标 | 使用 canvasApi.generateContexts |
| forEach 循环内调用 recordSnapshot | N 次历史记录 | 批量操作前调用一次 |

---

## 代码风格

### TypeScript

- **禁止 `any`**：使用 `unknown` + 类型守卫
- **禁止内联类型**：使用 `interface` 或 `type`
- **显式导出**：所有新增 store 方法必须导出

### 导入顺序

```typescript
// 1. React / Next.js
import React from 'react'

// 2. Store
import { useContextStore } from '@/lib/canvas/stores/contextStore'
import { useFlowStore } from '@/lib/canvas/stores/flowStore'

// 3. 历史记录
import { getHistoryStore } from '@/lib/canvas/stores/historyStore'

// 4. API
import { canvasApi } from '@/lib/canvas/api'
```

---

## 测试要求

### 覆盖率门槛

| Epic | 覆盖率目标 | 核心断言 |
|------|-----------|----------|
| E2 | 100% | flow 分支三个方法正确处理 |
| E3 | 100% | flowStore 三个批量方法 |
| E4 | 90% | recordSnapshot 在清空前调用 |
| E5 | 100% | AI API 被调用（非 mock）|
| E6 | 80% | E2E 三栏按钮流程 |

### Jest 测试规范

```typescript
describe('flowStore 批量操作', () => {
  beforeEach(() => {
    flowStore.setState({ flowNodes: [], selectedNodeIds: { context: [], flow: [], component: [] } })
  })

  it('selectAllNodes 选中所有节点', () => {
    flowStore.setFlowNodes([{ nodeId: '1' }, { nodeId: '2' }])
    flowStore.selectAllNodes()
    expect(flowStore.getState().selectedNodeIds.flow).toEqual(['1', '2'])
  })

  it('clearNodeSelection 清空选择', () => {
    flowStore.setState({ selectedNodeIds: { context: [], flow: ['1', '2'], component: [] } })
    flowStore.clearNodeSelection()
    expect(flowStore.getState().selectedNodeIds.flow).toEqual([])
  })

  it('deleteSelectedNodes 批量删除', () => {
    flowStore.setState({
      flowNodes: [{ nodeId: '1' }, { nodeId: '2' }],
      selectedNodeIds: { context: [], flow: ['1'], component: [] }
    })
    flowStore.deleteSelectedNodes()
    expect(flowStore.getState().flowNodes.map(n => n.nodeId)).toEqual(['2'])
    expect(flowStore.getState().selectedNodeIds.flow).toEqual([])
  })

  it('resetFlowCanvas 带 history 快照', () => {
    const recordSpy = jest.spyOn(getHistoryStore().getState(), 'recordSnapshot')
    flowStore.resetFlowCanvas()
    expect(recordSpy).toHaveBeenCalled()
    expect(flowStore.getState().flowNodes).toEqual([])
  })
})
```

---

## 审查清单

### PR 提交前自检

| # | 检查项 | E1 | E2 | E3 | E4 | E5 |
|---|--------|----|----|----|----|----|
| 1 | 改动文件不超过规定范围 | ☐ | ☐ | ☐ | ☐ | ☐ |
| 2 | 无 forEach 内重复 snapshot | ☐ | ☐ | ☐ | ☐ | ☐ |
| 3 | TypeScript 编译通过 | ☐ | ☐ | ☐ | ☐ | ☐ |
| 4 | Jest 测试通过 | ☐ | ☐ | ☐ | ☐ | ☐ |
| 5 | 手动 Ctrl+Z 测试通过 | ☐ | ☐ | ☐ | ☐ | ☐ |

### Reviewer 审查点

#### E1: TreeToolbar 标准化
- [ ] 组件内硬编码按钮（contextTreeControls/treeHeader/multiSelectControls）已删除
- [ ] extraButtons 中的 mock 按钮已删除
- [ ] 三栏共用同一 TreeToolbar 实例

#### E2: contextStore flow 分支
- [ ] `selectAllNodes` flow 分支不再是 `return s`
- [ ] `clearNodeSelection` flow 分支不再是 `return s`
- [ ] `deleteSelectedNodes` flow 分支已实现

#### E3: flowStore 批量方法
- [ ] `selectAllNodes`、`clearNodeSelection`、`deleteSelectedNodes` 全部存在
- [ ] `resetFlowCanvas` 带 history 快照

#### E4: 清空 history
- [ ] 三栏 onReset 统一调用 `recordSnapshot`
- [ ] Component 栏调用 `clearComponentCanvas()` 而非 `setComponentNodes([])`

#### E5: 重新生成 mock 修复
- [ ] 不再使用硬编码 mock 数据
- [ ] 调用 `canvasApi.generateContexts` 或等价 AI API
