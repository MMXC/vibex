# 需求分析报告: flow-checkbox-toggle-fix

**任务**: 修复流程树卡片 checkbox toggle 行为，并确保只传输勾选的流程给组件树
**分析师**: analyst
**日期**: 2026-04-02

---

## 问题分析

### 问题 1: checkbox toggle 行为

**现状**: `confirmFlowNode` 只设置 `isActive: true, status: 'confirmed'`，无反向操作。

**代码位置**: `canvasStore.ts` lines 837-844

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

**根因**: 无 `toggleFlowNode` 函数，checkbox `checked` 绑定到 `node.status === 'confirmed'` 但 onChange 只调用 `confirmFlowNode`（单向设置）。

**注意**: `toggleContextNode` 已存在于 contextStore 中，但 flowStore 没有对应实现。

### 问题 2: 只传输勾选的流程

**现状**: `generateComponentFromFlow` 发送**所有** flowNodes 给 API：

```ts
// canvasStore.ts line 1018
const mappedFlows = flowNodes.map((f) => ({
  name: f.name,
  contextId: f.contextId,
  steps: f.steps.map((s) => ({ name: s.name, actor: s.actor })),
}));
```

**根因**: 缺少 `status === 'confirmed'` 过滤

---

## 技术方案

### 方案 A: toggle 行为 + 过滤（推荐）

#### 修复 1: 添加 toggleFlowNode

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

#### 修复 2: 修改 confirmFlowNode 为 toggle

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

#### 修复 3: 过滤未确认的 flowNodes

```ts
// canvasStore.ts generateComponentFromFlow
const confirmedFlows = flowNodes.filter(f => f.status === 'confirmed');
const mappedFlows = confirmedFlows.map((f) => ({
  name: f.name,
  contextId: f.contextId,
  steps: f.steps.map((s) => ({ name: s.name, actor: s.actor })),
}));
```

---

## 工作量估算

| 任务 | 估算 |
|------|------|
| 添加 `toggleFlowNode` 到 store | 15min |
| 修改 BusinessFlowTree checkbox 行为 | 15min |
| 修改 `generateComponentFromFlow` 过滤 | 10min |
| 验收测试 | 20min |
| **总计** | **1h** |

---

## 验收标准

1. [ ] 勾选流程卡片 → 边框变绿色 + 状态 confirmed
2. [ ] 再次点击已确认卡片 → 取消确认（toggle 行为）
3. [ ] 点击「生成组件」→ 只发送 `status === 'confirmed'` 的流程节点
4. [ ] UI：未确认流程的 checkbox 不选中
5. [ ] 无 regression（其他树功能正常）
