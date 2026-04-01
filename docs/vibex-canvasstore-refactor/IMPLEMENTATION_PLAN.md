# Implementation Plan: VibeX canvasStore 职责拆分重构

**项目**: vibex-canvasstore-refactor
**版本**: v1.0
**日期**: 2026-04-02
**状态**: ✅ 设计完成

---

## Phase 排期

| Phase | Store | 工时 | 优先级 |
|--------|--------|------|--------|
| Phase 1 | contextStore | 3.5 天 | P0 |
| Phase 2 | uiStore | 4.5 天 | P0 |
| Phase 3 | flowStore | 5 天 | P0 |
| Phase 4 | componentStore | 3.5 天 | P1 |
| Phase 5 | sessionStore + 清理 | 2.75 天 | P1 |
| **总计** | | **19.25 天** | |

---

## Phase 1: contextStore（3.5 天）

### 步骤 1.1: 创建 contextStore.ts

```bash
mkdir -p src/lib/canvas/stores
touch src/lib/canvas/stores/contextStore.ts
```

### 步骤 1.2: 提取 contextNodes 状态和 actions

从 canvasStore.ts 提取：
- `contextNodes` 状态
- `addContextNode` / `updateContextNode` / `deleteContextNode`
- `confirmContextNode` / `selectContextNode`
- `editingNodeId`

### 步骤 1.3: 添加 persist + devtools

```typescript
export const useContextStore = create<ContextStore>()(
  devtools(
    persist((set, get) => ({ /* ... */ }), { name: 'vibex-context-store' })
  )
);
```

### 步骤 1.4: canvasStore re-export（向后兼容）

```typescript
// canvasStore.ts — 添加
export const useCanvasStore = () => ({
  contextNodes: useContextStore(s => s.contextNodes),
  addContextNode: useContextStore(s => s.addContextNode),
  // ...
});
```

### 步骤 1.5: 编写 contextStore.test.ts

覆盖率目标 ≥ 80%。

### 步骤 1.6: 运行 17 个现有测试

```bash
npm test -- --testPathPattern="BoundedContextTree|ComponentTree|BusinessFlowTree"
# 期望: 全部通过
```

---

## Phase 2: uiStore（4.5 天）

### 步骤 2.1: 创建 uiStore.ts

提取 UI 相关状态：
- `contextPanelCollapsed` / `flowPanelCollapsed` / `componentPanelCollapsed`
- `expandMode`
- `scrollTop`
- `isDragging` / `dragTarget`

### 步骤 2.2: 更新订阅组件（~20 个）

组件包括：ProjectBar、TreePanel、CardTreeRenderer 等。

```typescript
// Before
const { contextPanelCollapsed } = useCanvasStore();

// After
const contextPanelCollapsed = useUIStore(s => s.contextPanelCollapsed);
```

### 步骤 2.3: 编写 uiStore.test.ts

覆盖率目标 ≥ 80%。

### 步骤 2.4: 回归测试

所有涉及 UI 状态的组件渲染正常。

---

## Phase 3: flowStore（5 天）

### 步骤 3.1: 创建 flowStore.ts

提取：
- `flowNodes`
- `selectedNodeId`
- `addFlowNode` / `updateFlowNode` / `deleteFlowNode`
- `confirmFlowNode`
- `cascadeUpdate`（级联更新逻辑）

### 步骤 3.2: 迁移 CascadeUpdateManager

将级联逻辑从 canvasStore 迁移到 flowStore。

### 步骤 3.3: 编写 flowStore.test.ts

覆盖率目标 ≥ 80%，包含 cascadeUpdate 测试。

### 步骤 3.4: E2E 级联验证

```typescript
it('should update flow nodes when context node status changes', async () => {
  // 修改 context 节点
  // 验证关联的 flow 节点自动变为 pending
});
```

---

## Phase 4: componentStore（3.5 天）

### 步骤 4.1: 创建 componentStore.ts

提取：
- `componentNodes`
- `selectedNodeIds`
- `addComponentNode` / `updateComponentNode` / `deleteComponentNode`
- `toggleSelect`
- `generateComponents`

### 步骤 4.2: 单向依赖 flowStore

```typescript
// componentStore 需要读取 flowNodes
const flowNodes = useFlowStore(s => s.flowNodes);
```

### 步骤 4.3: 编写 componentStore.test.ts

覆盖率目标 ≥ 80%。

---

## Phase 5: sessionStore + 清理（2.75 天）

### 步骤 5.1: 创建 sessionStore.ts

提取：
- `sseStatus`
- `aiThinking`
- `queue`
- `messages`

### 步骤 5.2: 创建 stores/index.ts

```typescript
// src/lib/canvas/stores/index.ts
export { useContextStore } from './contextStore';
export { useUIStore } from './uiStore';
export { useFlowStore } from './flowStore';
export { useComponentStore } from './componentStore';
export { useSessionStore } from './sessionStore';
```

### 步骤 5.3: 压缩 canvasStore.ts 至 ≤150 行

移除所有 re-export，仅保留必要的组合逻辑。

### 步骤 5.4: localStorage 迁移验证

```typescript
it('should persist all stores independently', async () => {
  // 清除缓存
  localStorage.clear();
  // 刷新页面
  await page.reload();
  // 验证数据恢复
  expect(useContextStore.getState().contextNodes.length).toBeGreaterThan(0);
});
```

---

## 回滚计划

| Phase | 回滚方式 |
|--------|---------|
| Phase 1-4 | `git checkout` 恢复 canvasStore.ts |
| UI 组件更新 | `git checkout` 恢复组件文件 |

---

## 验收清单

### Phase 1
- [x] contextStore.ts < 180 行 ✅ (99行)
- [ ] contextStore 覆盖率 ≥ 80%
- [x] canvasStore re-export 正常 ✅
- [ ] 17 个现有测试全部通过

### Phase 2
- [ ] uiStore.ts < 280 行
- [ ] uiStore 覆盖率 ≥ 80%
- [ ] ~20 个组件更新到 uiStore
- [ ] UI 状态渲染正常

### Phase 3
- [ ] flowStore.ts < 350 行
- [ ] flowStore 覆盖率 ≥ 80%
- [ ] cascadeUpdate 正常工作
- [ ] E2E 级联验证通过

### Phase 4
- [ ] componentStore.ts < 180 行
- [ ] componentStore 覆盖率 ≥ 80%
- [ ] 无循环依赖

### Phase 5
- [ ] stores/index.ts 导出 5 个 store
- [ ] canvasStore.ts < 150 行
- [ ] localStorage 迁移无数据丢失
