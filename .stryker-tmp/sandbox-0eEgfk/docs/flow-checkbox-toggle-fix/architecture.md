# Architecture: Flow Checkbox Toggle Fix

**项目**: flow-checkbox-toggle-fix
**版本**: v1.0
**日期**: 2026-04-02
**架构师**: architect
**状态**: ✅ 设计完成

---

## 执行摘要

修复 BusinessFlowTree：添加 toggle 行为 + 生成组件时过滤未确认节点。

**总工时**: 1h

---

## 1. 问题分析

### E1: 无 Toggle

```typescript
// Before: confirmFlowNode 单向
confirmFlowNode: (nodeId) => {
  set(state => ({ flowNodes: flowNodes.map(n => ({ ...n, status: 'confirmed' })) }));
}
// ❌ 无反向操作

// After: toggleFlowNode 双向
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

### E2: 无过滤

```typescript
// Before
generateComponentFromFlow: (flowNodes) => api.sendAll(flowNodes);

// After
generateComponentFromFlow: (flowNodes) => {
  const confirmed = flowNodes.filter(n => n.status === 'confirmed');
  api.sendAll(confirmed);
};
```

---

## 2. 性能影响

无风险，仅增加 filter 遍历。

---

## ADR-001: toggleFlowNode 双向切换

**状态**: Accepted

---

## ADR-002: confirmed 过滤

**状态**: Accepted

---

## 执行决策

- **决策**: 已采纳
- **执行项目**: flow-checkbox-toggle-fix
- **执行日期**: 2026-04-02
