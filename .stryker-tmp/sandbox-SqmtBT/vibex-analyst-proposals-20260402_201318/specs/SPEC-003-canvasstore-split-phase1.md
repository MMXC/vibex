# SPEC-003: canvasStore 拆分 Phase 1 (contextStore)

**文件名**: `canvasStore.ts` → `contextStore.ts`
**Epic**: Epic-1 / Feature-1.2 / Story-1.2.1
**优先级**: P0
**状态**: Draft

---

## 1. 目标

将 `canvasStore.ts` (1433行) 按领域拆分为独立 store，Phase 1 仅抽取 `contextStore`。

---

## 2. 拆分架构

```
canvasStore.ts (入口, <300行)
├── contextStore.ts      (~180行) ← Phase 1
├── flowStore.ts         (~350行) ← Phase 2
├── componentStore.ts   (~180行) ← Phase 3
└── uiStore.ts          (~280行)  ← Phase 4
```

---

## 3. contextStore 职责

| 职责 | 行数估算 | 说明 |
|------|----------|------|
| 上下文节点 CRUD | ~60行 | 添加/删除/更新限界上下文节点 |
| 上下文选择状态 | ~40行 | selectedNodes, isAllSelected |
| 上下文确认状态 | ~30行 | confirmedNodes, confirmContextNode() |
| 上下文搜索/过滤 | ~30行 | searchQuery, filteredNodes |
| 上下文树扁平化 | ~20行 | toFlatList, toTree |

---

## 4. API 设计

```ts
// contextStore.ts
interface ContextStore {
  // State
  nodes: BoundedContext[];
  selectedIds: Set<string>;
  confirmedIds: Set<string>;
  searchQuery: string;
  
  // Actions
  addContext(node: BoundedContext): void;
  removeContext(id: string): void;
  selectContext(id: string): void;
  deselectContext(id: string): void;
  confirmContext(id: string): void;
  setSearchQuery(q: string): void;
  
  // Computed
  filteredNodes: BoundedContext[];
  selectedNodes: BoundedContext[];
  confirmedCount: number;
}
```

---

## 5. 迁移策略

1. **新建** `contextStore.ts`，复制相关代码
2. **重导出**: `canvasStore.ts` 从 `contextStore.ts` 导入，保持向后兼容
3. **逐调用点验证**: 250+ 调用点逐个确认无断裂
4. **自动化验证**: 运行 E2E 测试套件

---

## 6. 验收标准

| ID | Given | When | Then |
|----|-------|------|------|
| AC1 | contextStore.ts 抽取完成 | 统计行数 | ≤ 200 行 |
| AC2 | canvasStore.ts 重构完成 | 统计行数 | < 300 行 |
| AC3 | 现有功能 | 在 canvas 页操作上下文树 | 所有行为与拆分前完全一致 |
| AC4 | 编译 | 运行 `pnpm build` | 无 TypeScript 错误 |

---

## 7. 风险缓解

- **回归风险**: git worktree 隔离，每完成一个拆分步骤运行 E2E 测试
- **时间风险**: Phase 1 预计 8-12h，超时则拆分为两阶段
