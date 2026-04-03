# SPEC-001: 统一 NodeState 枚举定义

**文件名**: `types/nodeState.ts`
**Epic**: Epic-1 / Feature-1.1
**优先级**: P0
**状态**: Draft

---

## 1. 概述

为三树组件（ContextTree / FlowTree / ComponentTree）定义统一的节点状态机，消除实现差异。

---

## 2. 状态枚举

```ts
// types/nodeState.ts

export enum NodeState {
  IDLE = 'idle',
  SELECTED = 'selected',
  CONFIRMED = 'confirmed',
  ERROR = 'error',
}

export const NODE_STATE_LABELS: Record<NodeState, string> = {
  [NodeState.IDLE]: '未选择',
  [NodeState.SELECTED]: '已选择',
  [NodeState.CONFIRMED]: '已确认',
  [NodeState.ERROR]: '错误',
};

export const NODE_STATE_TRANSITIONS: Record<NodeState, NodeState[]> = {
  [NodeState.IDLE]: [NodeState.SELECTED, NodeState.ERROR],
  [NodeState.SELECTED]: [NodeState.IDLE, NodeState.CONFIRMED, NodeState.ERROR],
  [NodeState.CONFIRMED]: [NodeState.SELECTED, NodeState.ERROR],
  [NodeState.ERROR]: [NodeState.IDLE, NodeState.SELECTED],
};
```

---

## 3. 视觉规范

| State | Checkbox | Badge | Border | Icon |
|-------|----------|-------|--------|------|
| IDLE | ☐ 空 | 灰底 | 无 | 无 |
| SELECTED | ☑ 选中 | 蓝底 | 无 | 无 |
| CONFIRMED | ✓ 绿勾 | 绿底 | 无 | 绿色对勾 |
| ERROR | ⊠ 红叉 | 红底 | 红色边框 | 红色错误图标 |

**关键变更**:
- 移除 `nodeUnconfirmed` 黄色边框
- 统一 checkbox 位置：始终在 type badge **左侧**
- CONFIRMED 状态使用绿色 ✓ 勾选图标

---

## 4. 状态转换规则

```
IDLE ──点击──▶ SELECTED ──确认──▶ CONFIRMED
  ▲                │                │
  └──取消选择───────┘                │
  └──错误──▶ ERROR ──────────────▶ IDLE/SELECTED
```

---

## 5. 测试用例

```ts
describe('NodeState transitions', () => {
  it('IDLE → SELECTED on checkbox click', () => {
    const next = NODE_STATE_TRANSITIONS[NodeState.IDLE];
    expect(next).toContain(NodeState.SELECTED);
  });

  it('SELECTED → CONFIRMED on confirm action', () => {
    const next = NODE_STATE_TRANSITIONS[NodeState.SELECTED];
    expect(next).toContain(NodeState.CONFIRMED);
  });

  it('SELECTED → IDLE on deselect', () => {
    const next = NODE_STATE_TRANSITIONS[NodeState.SELECTED];
    expect(next).toContain(NodeState.IDLE);
  });
});
```

---

## 6. 影响范围

- [ ] `BoundedContextTree.tsx`
- [ ] `FlowTree.tsx`
- [ ] `ComponentTree.tsx`
- [ ] 所有使用节点状态的 store 方法
