# Spec: E1 - 级联确认逻辑修复

## 1. 概述

**工时**: 0.5h | **优先级**: P0
**依赖**: 无

## 2. 修改文件

`canvasStore.ts` lines 827-834

## 3. 修改方案

### 3.1 当前代码

```ts
confirmFlowNode: (nodeId) => {
  set((s) => {
    const newNodes = s.flowNodes.map((n) =>
      n.nodeId === nodeId
        ? { ...n, isActive: true, status: 'confirmed' as const }
        : n
    );
    return { flowNodes: newNodes };
  });
},
```

### 3.2 修改为

```ts
confirmFlowNode: (nodeId) => {
  set((s) => {
    const newNodes = s.flowNodes.map((n) =>
      n.nodeId === nodeId
        ? {
            ...n,
            isActive: true,
            status: 'confirmed' as const,
            steps: (n.steps || []).map(step => ({
              ...step,
              isActive: true,
              status: 'confirmed' as const,
            })),
          }
        : n
    );
    return { flowNodes: newNodes };
  });
},
```

## 4. 验收标准

| ID | Given | When | Then |
|----|-------|------|------|
| E1-AC1 | 勾选流程卡片 | 点击 checkbox | 父节点 status = 'confirmed' |
| E1-AC2 | 勾选流程卡片 | 点击 checkbox | 所有子步骤 status = 'confirmed' |
| E1-AC3 | 展开步骤 | 勾选后 | 步骤边框绿色 |
| E1-AC4 | 操作其他树 | 无修改 | 功能正常 |

## 5. DoD

- [ ] `confirmFlowNode` 级联修改 steps
- [ ] 父节点 confirmed
- [ ] 所有子步骤 confirmed
- [ ] 无 regression
