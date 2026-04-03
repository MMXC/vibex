# E3 Spec: 提取 `generateId()` 为公共函数

## src/lib/canvas/utils/id.ts

```typescript
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function generateNodeId(): string {
  return `node-${generateId()}`;
}

export function generateFlowId(): string {
  return `flow-${generateId()}`;
}
```

## 替换清单

| 文件 | 替换 |
|------|------|
| `flowStore.ts` | `import { generateId } from '@/lib/canvas/utils/id'` |
| `contextStore.ts` | `import { generateId } from '@/lib/canvas/utils/id'` |
| `componentStore.ts` | `import { generateId } from '@/lib/canvas/utils/id'` |
| `requirementHistoryStore.ts` | `import { generateId } from '@/lib/canvas/utils/id'` |
| `useCanvasSnapshot.ts` | `import { generateId } from '@/lib/canvas/utils/id'` |
| `useHomeState.ts` | `import { generateId } from '@/lib/canvas/utils/id'` |

## 不需要替换的临时 ID 模式

以下模式带前缀语义，保留原位：
```typescript
`ctx-gen-${Date.now()}-${i}`   // CanvasPage 内联 mock 数据
```
