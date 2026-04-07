# Spec: E1 + E2 - Flow Checkbox Toggle Fix

## 1. 概述

**工时**: 1h | **优先级**: P0
**依赖**: 无

## 2. 修改文件

- `canvasStore.ts` (toggleFlowNode + generateComponentFromFlow)
- `BusinessFlowTree.tsx` (checkbox onChange)

## 3. 修改方案

### 3.1 添加 toggleFlowNode

```ts
// canvasStore.ts
toggleFlowNode: (nodeId) => {
  set((s) => {
    const node = s.flowNodes.find((n) => n.nodeId === nodeId);
    if (!node) return {};
    const isConfirmed = node.status === 'confirmed';
    const newNodes = s.flowNodes.map((n) =>
      n.nodeId === nodeId
        ? {
            ...n,
            isActive: isConfirmed ? false : true,
            status: isConfirmed ? ('pending' as const) : ('confirmed' as const),
          }
        : n
    );
    return { flowNodes: newNodes };
  });
},
```

### 3.2 修改 BusinessFlowTree checkbox onChange

```tsx
// BusinessFlowTree.tsx line 458
onChange={() => {
  if (node.status === 'confirmed') {
    toggleFlowNode(node.nodeId);  // 取消确认
  } else {
    confirmFlowNode(node.nodeId);  // 确认
  }
}}
```

### 3.3 过滤 generateComponentFromFlow

```ts
// canvasStore.ts generateComponentFromFlow
const confirmedFlows = flowNodes.filter(f => f.status === 'confirmed');
const mappedFlows = confirmedFlows.map((f) => ({
  name: f.name,
  contextId: f.contextId,
  steps: f.steps.map((s) => ({ name: s.name, actor: s.actor })),
}));
```

## 4. 验收标准

| ID | Given | When | Then |
|----|-------|------|------|
| E1-AC1 | 点击已确认 checkbox | toggle | status = 'pending' |
| E1-AC2 | 点击未确认 checkbox | toggle | status = 'confirmed' |
| E2-AC1 | API body | generateComponentFromFlow | 只有 confirmed flows |

## 5. DoD

- [ ] toggleFlowNode 存在且工作
- [ ] checkbox toggle confirmed/pending
- [ ] generateComponentFromFlow 只发送 confirmed flows
