# Implementation Plan: Flow Checkbox Toggle Fix

**项目**: flow-checkbox-toggle-fix
**版本**: v1.0
**日期**: 2026-04-02
**状态**: ✅ 设计完成

---

## E1: Toggle 行为修复（0.5h）

### 步骤 1: 添加 toggleFlowNode

```typescript
// canvasStore.ts
toggleFlowNode: (nodeId) => {
  set(state => ({
    flowNodes: state.flowNodes.map(n =>
      n.nodeId === nodeId
        ? { ...n, status: n.status === 'confirmed' ? 'pending' : 'confirmed' }
        : n
    )
  }));
}
```

### 步骤 2: 修改 BusinessFlowTree checkbox onChange

```tsx
<input
  type="checkbox"
  checked={node.status === 'confirmed'}
  onChange={() => toggleFlowNode(node.nodeId)}
/>
```

---

## E2: 生成组件过滤修复（0.5h）

### 步骤 1: 修改 generateComponentFromFlow

```typescript
generateComponentFromFlow: (flowNodes) => {
  const confirmed = flowNodes.filter(n => n.status === 'confirmed');
  api.generateComponents(confirmed);
}
```

---

## 验收清单

- [ ] toggleFlowNode 双向切换
- [ ] BusinessFlowTree checkbox toggle 正常
- [ ] generateComponentFromFlow 只发送 confirmed 节点
- [ ] npm test 通过
