# Spec: E3 - Phase 3 flowStore 独立

## 1. 概述

**工时**: 4 天（dev）+ 1 天（reviewer）| **优先级**: P0
**依赖**: E1（读取 confirmContextNode 状态）

## 2. 提取内容

```typescript
// flowStore.ts (~350 行)
interface FlowState {
  flowNodes: FlowNode[];
  flowDraft: Partial<FlowNode> | null;
  steps: Step[];
  autoGenerate: boolean;
}

interface FlowActions {
  setFlowNodes: (nodes: FlowNode[]) => void;
  addFlowNode: (node: FlowNode) => void;
  editFlowNode: (nodeId: string, updates: Partial<FlowNode>) => void;
  deleteFlowNode: (nodeId: string) => void;
  confirmFlowNode: (nodeId: string) => void;
  setSteps: (steps: Step[]) => void;
  addStep: (step: Step) => void;
  reorderSteps: (from: number, to: number) => void;
  setAutoGenerate: (enabled: boolean) => void;
}
```

## 3. CascadeUpdateManager 迁移

```typescript
// flowStore.ts 内
const cascadeManager = {
  markDownstreamPending: (contextNodeId: string) => {
    // 当 contextNode pending 时，标记相关 flowNode pending
    set((state) => ({
      flowNodes: state.flowNodes.map(node =>
        node.sourceContextId === contextNodeId
          ? { ...node, status: 'pending' }
          : node
      )
    }));
  }
};
```

## 4. 验收标准

| ID | Given | When | Then |
|----|-------|------|------|
| E3-AC1 | 检查文件 | wc -l flowStore.ts | ≤ 350 行 |
| E3-AC2 | CRUD | add/edit/delete/confirmFlowNode | 操作正常 |
| E3-AC3 | Steps | add/reorder steps | 顺序正确 |
| E3-AC4 | 级联 | context pending | flow 标记 pending |
| E3-AC5 | 测试覆盖 | vitest --coverage flowStore | ≥ 80% |

## 5. DoD

- [ ] flowStore.ts 存在且 ≤ 350 行
- [ ] CRUD + steps + autoGenerate 全部工作
- [ ] CascadeUpdateManager 迁移到 flowStore
- [ ] context → flow 级联正常
- [ ] flowStore.test.ts 覆盖率 ≥ 80%
