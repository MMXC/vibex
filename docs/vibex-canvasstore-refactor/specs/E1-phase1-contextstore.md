# Spec: E1 - Phase 1 contextStore 独立

## 1. 概述

**工时**: 3 天（dev）+ 0.5 天（reviewer）| **优先级**: P0
**依赖**: 无

## 2. 架构设计

```
src/lib/canvas/stores/
├── contextStore.ts   # 新建，~180 行
├── canvasStore.ts    # 修改，添加 re-export
└── (其他 store 待后续 phase)
```

## 3. 提取内容

```typescript
// contextStore.ts
interface ContextState {
  contextNodes: BoundedContextNode[];
  contextDraft: Partial<BoundedContextNode> | null;
}

interface ContextActions {
  setContextNodes: (nodes: BoundedContextNode[]) => void;
  addContextNode: (node: BoundedContextNode) => void;
  editContextNode: (nodeId: string, updates: Partial<BoundedContextNode>) => void;
  deleteContextNode: (nodeId: string) => void;
  confirmContextNode: (nodeId: string) => void;
  setContextDraft: (draft: Partial<BoundedContextNode> | null) => void;
}

export const useContextStore = create<ContextState & ContextActions>()(
  devtools((set) => ({
    contextNodes: [],
    contextDraft: null,
    setContextNodes: (nodes) => set({ contextNodes: nodes }),
    addContextNode: (node) => set((state) => ({
      contextNodes: [...state.contextNodes, node]
    })),
    // ... 其他 actions
  }))
);
```

## 4. 向后兼容

```typescript
// canvasStore.ts 保留 re-export（临时兼容层）
export const {
  contextNodes,
  contextDraft,
  setContextNodes,
  addContextNode,
  editContextNode,
  deleteContextNode,
  confirmContextNode,
  setContextDraft,
} = useContextStore.getState();
```

## 5. 验收标准

| ID | Given | When | Then |
|----|-------|------|------|
| E1-AC1 | 检查文件 | wc -l contextStore.ts | ≤ 180 行 |
| E1-AC2 | TypeScript | tsc --noEmit | 0 error |
| E1-AC3 | 运行测试 | vitest --coverage contextStore | coverage ≥ 80% |
| E1-AC4 | 现有测试 | vitest canvas/ | 17/17 通过 |
| E1-AC5 | 功能验证 | addContextNode + deleteContextNode | 操作正常 |

## 6. DoD

- [ ] contextStore.ts 存在且 ≤ 180 行
- [ ] CRUD + setContextDraft 全部工作
- [ ] contextStore.test.ts 覆盖率 ≥ 80%
- [ ] canvasStore 保留 context re-export
- [ ] 17 个现有测试全部通过
