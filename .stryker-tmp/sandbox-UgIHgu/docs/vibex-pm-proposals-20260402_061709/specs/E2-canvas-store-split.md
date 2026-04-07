# Epic 2: canvasStore 职责拆分 — Spec

**Epic ID**: E2
**优先级**: P0（Phase1）/ P2（Phase2-3）
**工时**: P0 Phase1: 3-4h；P2 Phase2-3: 6h
**页面集成**: BoundedContextTree / FlowTree / ComponentTree / Canvas 全局

---

## 功能点列表

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|-------|------|---------|---------|
| E2-S1 | 抽取 contextStore（Phase1） | 从 canvasStore 抽取 context 状态，创建 `contextStore.ts`（< 300 行） | `expect(linesOfCode('src/stores/contextStore.ts')).toBeLessThan(300)`；`BoundedContextTree` 渲染正常 | src/stores/contextStore.ts |
| E2-S2 | 抽取 flowStore（Phase2） | 创建 `flowStore.ts`，承载 Flow 相关状态 | `expect(flowStore.getState()).toHaveProperty('flows')`；FlowTree 渲染正常 | src/stores/flowStore.ts |
| E2-S3 | 抽取 componentStore（Phase2） | 创建 `componentStore.ts`，承载 Component 相关状态 | `expect(componentStore.getState()).toHaveProperty('components')`；ComponentTree 渲染正常 | src/stores/componentStore.ts |
| E2-S4 | 抽取 uiStore（Phase3） | 创建 `uiStore.ts`，承载 UI 状态（activeTab / drawerOpen / scrollTop 等） | `expect(uiStore.getState()).toHaveProperty('scrollTop')`；页面切换后 scrollTop = 0 | src/stores/uiStore.ts |
| E2-S5 | 迁移所有组件引用 | 将所有直接依赖 canvasStore 的组件改为依赖对应子 store | `expect(getComponentImports().filter(i => i.store === 'canvasStore').length).toBe(0)` | 所有引用 canvasStore 的组件 |

---

## 详细验收条件

### E2-S1: contextStore 抽取（Phase1）

- [ ] `src/stores/contextStore.ts` 文件存在
- [ ] 文件行数 < 300 行
- [ ] `contextStore` 使用 Zustand `create()` 创建
- [ ] 包含状态：`contexts[]` / `selectedContextId` / `confirmedContextIds[]`
- [ ] 原 `canvasStore.ts` 通过 `create(() => contextStore.getState())` 代理保持 API 兼容
- [ ] `BoundedContextTree` 组件渲染正常（无 breaking change）
- [ ] `npm test` 全部通过

### E2-S2: flowStore 抽取（Phase2）

- [ ] `src/stores/flowStore.ts` 文件存在
- [ ] 包含状态：`flows[]` / `selectedFlowId` / `flowNodes[]`
- [ ] `FlowTree` 组件渲染正常
- [ ] 拖拽流程节点功能正常

### E2-S3: componentStore 抽取（Phase2）

- [ ] `src/stores/componentStore.ts` 文件存在
- [ ] 包含状态：`components[]` / `selectedComponentId` / `componentTree`
- [ ] `ComponentTree` 组件渲染正常

### E2-S4: uiStore 抽取（Phase3）

- [ ] `src/stores/uiStore.ts` 文件存在
- [ ] 包含状态：`scrollTop` / `activeTab` / `drawerOpen` / `panelState`
- [ ] 页面切换后 `scrollTop = 0`（由 uiStore 管理）
- [ ] 面板切换时 `activeTab` 正确切换

### E2-S5: 引用迁移

- [ ] 所有组件通过对应子 store 访问状态（不再直接 import canvasStore）
- [ ] `grep -r "from.*canvasStore" src/` 返回 0 结果
- [ ] 原有 `canvasStore.ts` 保留为轻量包装（向后兼容），行数 < 200 行

---

## 实现注意事项

1. **API 兼容**：Phase1 拆分时必须通过代理模式保持 API 兼容，不引入 breaking change
2. **测试优先**：每个子 store 拆分前先写单元测试
3. **渐进迁移**：组件逐个迁移，不要求一次性全部完成
4. **保留原 store**：canvasStore.ts 保留为聚合层，便于后续移除
