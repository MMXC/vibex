# Architecture: Flow Step Check Fix

**项目**: flow-step-check-fix
**版本**: v1.0
**日期**: 2026-04-02
**架构师**: architect
**状态**: ✅ 设计完成

---

## 执行摘要

修复 `confirmFlowNode` 级联确认逻辑：勾选流程卡片时，父节点和所有子步骤同步 confirmed。

**总工时**: 0.5h

---

## 1. 问题分析

**Before**:
```typescript
// confirmFlowNode 只设置父节点
confirmFlowNode: (nodeId) => {
  set(state => ({
    flowNodes: state.flowNodes.map(n =>
      n.nodeId === nodeId ? { ...n, status: 'confirmed', isActive: true } : n
    )
  }));
  // ❌ steps 数组未处理
}
```

**After**:
```typescript
confirmFlowNode: (nodeId) => {
  set(state => ({
    flowNodes: state.flowNodes.map(n =>
      n.nodeId === nodeId
        ? { ...n, status: 'confirmed', isActive: true,
            steps: n.steps?.map(s => ({ ...s, status: 'confirmed' })) }
        : n
    )
  }));
}
```

---

## 2. 性能影响

无性能影响，仅增加一步数组遍历。

---

## ADR-001: 级联确认到 steps

**状态**: Accepted

**决策**: confirmFlowNode 时同步更新 steps 数组。

---

## 执行决策

- **决策**: 已采纳
- **执行项目**: flow-step-check-fix
- **执行日期**: 2026-04-02
