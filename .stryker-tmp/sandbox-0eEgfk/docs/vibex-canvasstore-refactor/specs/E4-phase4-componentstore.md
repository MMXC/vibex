# Spec: E4 - Phase 4 componentStore 独立

## 1. 概述

**工时**: 3 天（dev）+ 0.5 天（reviewer）| **优先级**: P1
**依赖**: E2 + E3（flowNodes + contextNodes）

## 2. 提取内容

```typescript
// componentStore.ts (~180 行)
interface ComponentState {
  componentNodes: ComponentNode[];
  componentDraft: Partial<ComponentNode> | null;
}

interface ComponentActions {
  setComponentNodes: (nodes: ComponentNode[]) => void;
  addComponentNode: (node: ComponentNode) => void;
  editComponentNode: (nodeId: string, updates: Partial<ComponentNode>) => void;
  deleteComponentNode: (nodeId: string) => void;
  confirmComponentNode: (nodeId: string) => void;
  generateComponentFromFlow: (flowNodeId: string) => void;
}
```

## 3. 单向依赖

```typescript
// componentStore.ts
const generateComponentFromFlow = (flowNodeId: string) => {
  const flowNodes = useFlowStore.getState().flowNodes;
  const flowNode = flowNodes.find(n => n.id === flowNodeId);
  // 生成 component
};
```

## 4. 验收标准

| ID | Given | When | Then |
|----|-------|------|------|
| E4-AC1 | 检查文件 | wc -l componentStore.ts | ≤ 180 行 |
| E4-AC2 | CRUD | add/edit/delete/confirmComponentNode | 操作正常 |
| E4-AC3 | 生成 | generateComponentFromFlow | component 生成 |
| E4-AC4 | 依赖 | flowNodes 读取 | 单向依赖，无循环 |
| E4-AC5 | 测试覆盖 | vitest --coverage componentStore | ≥ 80% |

## 5. DoD

- [ ] componentStore.ts 存在且 ≤ 180 行
- [ ] CRUD + generate 全部工作
- [ ] 单向依赖 flowStore，无循环
- [ ] componentStore.test.ts 覆盖率 ≥ 80%
