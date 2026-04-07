# E3 Spec: 废弃 store 删除与 deprecated.ts

## canvasHistoryStore.ts 删除

```typescript
// src/stores/canvasHistoryStore.ts — 待删除
// 状态：仅做 re-export，无消费者
// 替代品：src/lib/canvas/historySlice.ts
```

## deprecated.ts 设计

```typescript
// src/lib/canvas/deprecated.ts
/**
 * @deprecated 请从 src/lib/canvas/stores/ 导入对应 store
 * 此文件将在未来版本中移除
 */
export const useCanvasStore = {
  /** @deprecated use useContextStore from stores/ */
  getState: () => useContextStore.getState(),
};

/**
 * @deprecated 使用 loadExampleData from '@/lib/canvas/loadExampleData'
 */
export function setContextNodes(nodes: any) {
  console.warn('[deprecated] setContextNodes is deprecated');
  return useContextStore.getState().setContextNodes(nodes);
}
```

## DDD 文件确认清单

| 文件 | 确认结果 | 原因 |
|------|---------|------|
| `src/stores/contextSlice.ts` | ✅ 保留 | DDD bounded contexts 状态 |
| `src/stores/modelSlice.ts` | ✅ 保留 | DDD domain models 状态 |
| `src/stores/ddd/` | ✅ 保留 | DDD 中间件和初始化 |

## grep 验证命令

```bash
# 删除 canvasHistoryStore 前执行
grep -rn "canvasHistoryStore" src/ --include="*.ts" --include="*.tsx"
# 预期：无输出
```
