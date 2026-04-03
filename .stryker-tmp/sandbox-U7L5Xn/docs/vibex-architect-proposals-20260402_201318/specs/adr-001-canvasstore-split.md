# Spec: ADR-001 canvasStore 拆分架构

**ADR**: ADR-001  
**状态**: 待实施  
**Sprint**: Sprint 1  
**预计工时**: 20-25h

---

## 1. 拆分目标

将 `canvasStore` (1433行, 17个职责) 拆分为 5 个单一职责的 Zustand store。

---

## 2. 拆分方案

### 2.1 拆分结构

```
canvasStore (入口 < 150行)
├── contextStore    (~180行): contextNodes CRUD + persist
├── flowStore      (~350行): flowNodes + cascadeUpdate
├── componentStore (~180行): componentNodes + generation
├── uiStore        (~280行): panel/expand/scroll state
└── sessionStore   (~150行): SSE/messages/queue
```

### 2.2 依赖方向

```
componentStore → flowStore → contextStore
                    ↓
                 uiStore
                    ↓
              sessionStore
```

**规则**: 单向依赖，禁止循环依赖。

### 2.3 命名规范

| Store | 文件路径 | 命名空间 |
|-------|---------|---------|
| contextStore | `stores/contextStore.ts` | `useContextStore` |
| flowStore | `stores/flowStore.ts` | `useFlowStore` |
| componentStore | `stores/componentStore.ts` | `useComponentStore` |
| uiStore | `stores/uiStore.ts` | `useUIStore` |
| sessionStore | `stores/sessionStore.ts` | `useSessionStore` |

---

## 3. 迁移策略

### Phase 1: contextStore 拆分 (4h, 验证可行性)
1. 创建 `stores/contextStore.ts`
2. 从 `canvasStore` 迁移 contextNodes 相关逻辑
3. 验证独立运行
4. `canvasStore` re-export contextStore（向后兼容）

### Phase 2: 其余4个store拆分
1. flowStore（依赖 contextStore）
2. componentStore（依赖 flowStore）
3. uiStore（独立）
4. sessionStore（独立）
5. canvasStore 降为入口文件（仅 re-export）

---

## 4. 向后兼容策略

```typescript
// canvasStore.ts - 临时向后兼容层
import { contextStore } from './contextStore';
import { flowStore } from './flowStore';
// ... 其他导入

// Re-export 所有新 store
export const useCanvasStore = {
  ...contextStore,
  ...flowStore,
  // 保持原有 API 不变
};

export type CanvasStore = ReturnType<typeof useCanvasStore>;
```

---

## 5. 验收标准

- [ ] Phase 1 contextStore 拆分在 4h 内完成
- [ ] 无循环依赖（通过 `tsc --noEmit` 或 `madge` 验证）
- [ ] `npm run build` 和 `npm run dev` 均通过
- [ ] 3 个核心用户旅程 E2E 测试通过
- [ ] canvasStore 入口文件 < 150行

---

## 6. 消费者迁移清单

| Consumer | 当前引用 | 迁移目标 |
|---------|---------|---------|
| Canvas 页面 | canvasStore | 逐步切换到具体 store |
| Drawer 组件 | canvasStore | uiStore + contextStore |
| SSE 连接 | canvasStore | sessionStore |
| 节点生成 | canvasStore | componentStore |

---

## 7. 风险

- 迁移过程中 consumer 需同步更新
- 建议 Phase 1 只拆分 contextStore，验证后再继续
- 所有迁移需在 CI 中验证

---

## 8. DoD

- [ ] 5 个 store 文件独立存在
- [ ] canvasStore 入口 < 150行
- [ ] 所有 consumer 迁移完成
- [ ] TypeScript 类型检查通过
- [ ] E2E 核心旅程测试通过
- [ ] 代码审查通过
