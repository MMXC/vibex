# P1-001: exportToStateMachine 输出含 smVersion 字段，不符合 Spec

**严重性**: P1（影响功能）
**Epic**: E4
**Spec 引用**: specs/E4-export.md

## 问题描述
- **Spec E4-export.md**: StateMachine JSON 格式为 `{ initial: string; states: Record<string, {type?, on?}> }`
- **实际实现**: 输出为 `{ smVersion: string; states: SMStateExport[]; initial: string }`

额外字段 `smVersion` 不在 Spec 中，且 `states` 是数组而非 `Record<string, {...}>`，导致消费者无法用标准状态机解析器处理。

## 代码证据

```typescript
// src/services/dds/exporter.ts 第 161-200 行
export function exportToStateMachine(cards: StateMachineCard[]): string {
  // ...
  const doc: SMExportData = {
    smVersion: '1.0.0',    // ⚠️ Spec 中不存在
    states: allStates,      // ⚠️ 数组 vs Spec 的 Record<string, {...}>
    initial: initialState,
  };
  return JSON.stringify(doc, null, 2);
}

// 输出示例
{
  "smVersion": "1.0.0",    // ← 非标准字段
  "states": [              // ← 数组，非 Record
    { "id": "s1", "name": "s1", "type": "initial", "on": {} }
  ],
  "initial": "s1"
}

// Spec 期望格式
{
  "initial": "s1",
  "states": {
    "s1": { "type": "initial", "on": {} }
  }
}
```

## 修复建议

```typescript
// 修改 exportToStateMachine 输出格式
export function exportToStateMachine(cards: StateMachineCard[]): string {
  // ...
  const doc = {
    initial: initialState,
    states: allStates.reduce((acc, s) => {
      acc[s.id] = { type: s.type, on: s.on };
      return acc;
    }, {} as Record<string, { type: string; on: Record<string, string> }>),
  };
  return JSON.stringify(doc, null, 2);
}
```

## 影响范围
- `src/services/dds/exporter.ts`
- `src/components/dds/toolbar/DDSToolbar.tsx`（调用方）
- 依赖标准状态机 JSON 格式的下游消费者
