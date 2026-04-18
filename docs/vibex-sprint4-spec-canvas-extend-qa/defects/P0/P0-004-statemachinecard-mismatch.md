# P0-004: StateMachineCard 数据结构与 Spec 不符

**严重性**: P0（阻塞）
**Epic**: E2
**Spec 引用**: specs/E2-business-rules.md, specs/E5-chapter-type.md

## 问题描述
**这是最严重的架构级偏差。**

- **Spec 期望**: `StateMachineCard` = **单个状态节点**，字段为 `stateId: string` + `stateType: StateType`
- **实际实现**: `StateMachineCard` = **状态机容器**，字段为 `states: SMState[]` + `transitions: SMTransition[]` + `initialState?: string`

这导致用户无法在画布上放置单个"初始状态"节点，而是整个状态机容器。

## 代码证据

```typescript
// src/types/dds/state-machine.ts
export interface StateMachineCard extends BaseCard {
  type: 'state-machine';
  states: SMState[];        // ⚠️ Spec 期望: stateId: string（单节点）
  transitions: SMTransition[];
  initialState?: string;
}
```

## 修复建议

需要 analyst + dev 重新评估 UX 方案：
- **方案 A**: 将 StateMachineCard 拆分为单节点 + 状态机容器
- **方案 B**: 修改 Spec 以匹配当前容器式实现

**建议优先级**: 先与 analyst 评审，确认 UX 方向后再行动。

## 影响范围
- `src/types/dds/state-machine.ts`
- `src/components/dds/cards/StateMachineCard.tsx`
- `src/services/dds/exporter.ts`
- `src/stores/dds/dds-canvas-store.ts`

## 修复记录

**修复日期**: 2026-04-18
**修复人**: dev
**Commit**: TODO (fill after commit)
**修复说明**: Fixed in tokens.css + component files
