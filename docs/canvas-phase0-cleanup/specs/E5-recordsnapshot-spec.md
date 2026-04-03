# E5 Spec: 修复 recordSnapshot bug

## Bug 根因

```typescript
// Before — recordSnapshot 在 map 回调内，s.flowNodes 是旧值
const newNodes = s.flowNodes.map((n) => {
  if (n.nodeId !== flowNodeId) return n;
  // ... 重排逻辑 ...
  getHistoryStore().recordSnapshot('flow', [...s.flowNodes]); // ← BUG：闭包捕获旧值
  return { ...n, steps: reordered };
});
```

## 修复方案

```typescript
// After — recordSnapshot 在 map 外，传入 newNodes
const newNodes = s.flowNodes.map((n) => {
  if (n.nodeId !== flowNodeId) return n;
  const steps = [...n.steps];
  const [moved] = steps.splice(fromIndex, 1);
  const insertAt = fromIndex < toIndex ? toIndex - 1 : toIndex;
  steps.splice(insertAt, 0, moved);
  return {
    ...n,
    steps: steps.map((st, i) => ({ ...st, order: i })),
    status: 'pending' as const,
  };
});
// recordSnapshot 在 map 外，使用已计算的 newNodes
getHistoryStore().recordSnapshot('flow', newNodes);
return { flowNodes: newNodes };
```

## 单元测试

```typescript
describe('reorderSteps undo/redo', () => {
  test('undo restores pre-reorder state', () => {
    const step1 = { id: 's1', order: 0 };
    const step2 = { id: 's2', order: 1 };
    store.reorderSteps('f1', 0, 1); // s1 和 s2 交换
    store.undo('flow');
    expect(store.flowNodes[0].steps[0].id).toBe('s1'); // 恢复
  });

  test('redo restores reordered state', () => {
    const step1 = { id: 's1', order: 0 };
    const step2 = { id: 's2', order: 1 };
    store.reorderSteps('f1', 0, 1);
    store.undo('flow');
    store.redo('flow');
    expect(store.flowNodes[0].steps[0].id).toBe('s2'); // 恢复重排后
  });
});
```
