# 需求分析报告: flow-step-check-fix

**任务**: 修复流程树卡片勾选后子流程步骤未同步确认的 bug
**分析师**: analyst
**日期**: 2026-04-02

---

## 执行摘要

**Bug**: 勾选流程树卡片时，父节点状态变为 confirmed，但子步骤仍保持 pending。

**根因**: `confirmFlowNode` 只设置 `flowNodes[].isActive` 和 `flowNodes[].status`，不级联到 `steps` 数组。

---

## 问题分析

### 现状代码

**文件**: `canvasStore.ts` lines 827-834

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

**问题**: 只更新节点自身 `isActive` + `status`，**不修改 `steps` 数组**。

### 预期行为

勾选流程卡片 → 父节点 confirmed + **所有子步骤 confirmed**

### 用户体验

用户勾选流程卡片后，看到父节点边框变绿（confirmed），但展开步骤发现所有步骤仍是 pending 状态（黄色边框）。**认知不一致**。

---

## 技术方案

### 方案 A: 级联确认（推荐）

在 `confirmFlowNode` 中增加级联逻辑：

```ts
confirmFlowNode: (nodeId) => {
  set((s) => {
    const newNodes = s.flowNodes.map((n) =>
      n.nodeId === nodeId
        ? {
            ...n,
            isActive: true,
            status: 'confirmed' as const,
            steps: n.steps.map(step => ({
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

**优点**: 行为直观，一次确认全部完成
**缺点**: 无反向操作（取消确认时步骤是否回退？）

### 方案 B: 两步确认

保持现状不变，确认卡片只确认节点，确认步骤需要单独点击。

**优点**: 灵活，用户可部分确认
**缺点**: 与用户期望不符（勾选 = 全部完成）

### 方案 C: toggle 行为

改为 toggle，支持反向操作：

```ts
confirmFlowNode: (nodeId) => {
  set((s) => {
    const node = s.flowNodes.find(n => n.nodeId === nodeId);
    const newStatus = node.status === 'confirmed' ? 'pending' : 'confirmed';
    const newActive = node.status === 'confirmed' ? false : true;
    // cascade to steps
  });
},
```

---

## 决策建议

**推荐方案 A（级联确认）**，理由：
1. 符合用户心智：勾选 = 完成
2. 实现简单，改动最小
3. 符合其他树的确认行为（ContextTree 确认节点后子内容也进入已确认状态）

---

## 验收标准

1. [ ] 勾选流程卡片 → 父节点 `status === 'confirmed'`
2. [ ] 勾选流程卡片 → 所有子步骤 `status === 'confirmed'`
3. [ ] 步骤确认 checkbox 点击 → 该步骤 `status === 'confirmed'`
4. [ ] UI：确认卡片绿色边框 + 步骤也是绿色/已确认状态
5. [ ] 无 regression（其他树功能正常）

---

## 风险

| 风险 | 影响 | 缓解 |
|------|------|------|
| 取消确认逻辑缺失 | 低 | 可后续迭代添加 |
| 步骤过多时批量更新性能 | 极低 | 通常 steps < 20 |

---

## 工作量估算

| 任务 | 估算 |
|------|------|
| 修改 `confirmFlowNode` 级联逻辑 | 15min |
| 测试验证 | 15min |
| **总计** | **30min** |
