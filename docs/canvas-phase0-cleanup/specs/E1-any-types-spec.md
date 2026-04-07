# E1 Spec: 消除 `as any` 类型断言

## 类型守卫函数

```typescript
// src/lib/canvas/utils/type-guards.ts

export function isValidContextNodes(data: unknown): data is BoundedContextNode[] {
  return Array.isArray(data) && data.every(
    (n) => typeof n === 'object' && n !== null && 'nodeId' in n && 'name' in n
  );
}

export function isValidFlowNodes(data: unknown): data is BusinessFlowNode[] {
  return Array.isArray(data) && data.every(
    (n) => typeof n === 'object' && n !== null && 'nodeId' in n && 'steps' in n
  );
}

export function isValidComponentNodes(data: unknown): data is ComponentNode[] {
  return Array.isArray(data) && data.every(
    (n) => typeof n === 'object' && n !== null && 'nodeId' in n
  );
}
```

## Group A 修复（冲突处理器）

```typescript
// Before (CanvasPage.tsx L362)
canvasSetContextNodes(serverData.contexts as any);

// After
if (isValidContextNodes(serverData.contexts)) {
  canvasSetContextNodes(serverData.contexts);
} else {
  console.error('[CanvasPage] Invalid contexts data from server');
}
```

## Group B 修复（undo/redo）

```typescript
// 定义联合类型
type HistorySnapshot = BoundedContextNode[] | BusinessFlowNode[] | ComponentNode[];

// historyStore.undo 返回类型
undo(phase: 'context' | 'flow' | 'component'): HistorySnapshot | null;

// 使用类型守卫
const prev = historyStore.undo('context');
if (prev && isValidContextNodes(prev)) {
  canvasSetContextNodes(prev);
}
```
