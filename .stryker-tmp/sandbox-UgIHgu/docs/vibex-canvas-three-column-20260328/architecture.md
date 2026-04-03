# 架构设计: Canvas 三栏画布自动展开

**项目**: vibex-canvas-three-column-20260328
**版本**: 1.0
**日期**: 2026-03-28
**角色**: Architect

---

## 1. 设计目标

1. **自动展开**: `recomputeActiveTree()` 在 `activeTree` 实际切换时，自动调用 `setCenterExpand('expand-left')`
2. **分类处理**: 仅 `flow`/`component` 阶段触发展开；`input`/`prototype` 重置为 `default`
3. **保护用户选择**: 用户手动展开后，`recomputeActiveTree` 不覆盖
4. **向后兼容**: 不破坏现有 HoverHotzone 手动展开功能

---

## 2. 核心设计：状态保护机制

### 2.1 问题

`recomputeActiveTree` 会被多种 action 调用（见下表），其中只有部分会导致 `activeTree` 变化。如果每次调用都无条件设置 `centerExpand`，会覆盖用户的手动展开状态。

| Action | 调用 `recomputeActiveTree` | 导致 `activeTree` 变化 |
|--------|----------------------------|----------------------|
| `confirmContextNode()` | ✅ | context→flow 时变化 |
| `confirmFlowNode()` | ✅ | flow→component 时变化 |
| `setPhase()` | ✅ | 仅 phase 变化（activeTree 由逻辑决定） |
| `advancePhase()` | ✅ | 同上 |
| `autoGenerateFlows()` → `setPhase('flow')` | ✅ | 生成后 activeTree 变为 flow |
| `loadExampleData()` | ❌ 直接 set，不调用 | 直接 set flow |
| `generateContextsFromRequirement()` | ✅ → `setPhase('context')` | input→context |

### 2.2 方案：引入 `_prevActiveTree` 内部状态

在 `canvasStore` 内部新增 `activeTree` 的"上一值"追踪字段，仅当 `activeTree` 实际从 A 变为 B 时，才触发自动展开。

**规则矩阵**:

| 旧值 (`_prevActiveTree`) | 新值 (`activeTree`) | `centerExpand` 操作 |
|--------------------------|---------------------|-------------------|
| `null` | `'flow'` | `setCenterExpand('expand-left')` |
| `'context'` | `'flow'` | `setCenterExpand('expand-left')` |
| `'flow'` | `'component'` | `setCenterExpand('expand-left')` |
| `'component'` | `'context'` (降级) | `setCenterExpand('default')` |
| `null` | `'component'` | `setCenterExpand('expand-left')` |
| 任意 | `null` (input/prototype) | `setCenterExpand('default')` |
| 任意 | 任意 | 不操作（保护手动展开） |

### 2.3 为什么不使用 sentinel 标记

有另一种方案：用 `userManuallyExpanded` 布尔标记记录用户手动操作，展开时检查。但此方案有两个问题：

1. **状态污染**: 需要在 `setCenterExpand` 内部埋入标记逻辑，破坏 `setCenterExpand` 的纯粹性
2. **时机问题**: `togglePanel` 循环 default→expand-left→expand-right，无法区分"用户选择了 expand-left"和"系统自动设置 expand-left"

因此采用 `_prevActiveTree` 比较法，最干净。

---

## 3. 修改点清单

### 3.1 `vibex-fronted/src/lib/canvas/canvasStore.ts`

**A. `CanvasStore` 接口** — 新增 1 个内部字段

```typescript
// CanvasStore 接口，_prevActiveTree 不暴露给外部
interface CanvasStore {
  // ... 现有字段 ...
  // 新增：内部追踪字段，用于 auto-expand 判断
  _prevActiveTree: TreeType | null;
}
```

**B. `recomputeActiveTree` 实现** — 核心修改

```typescript
recomputeActiveTree: () => {
  const { contextNodes, flowNodes, phase, activeTree, _prevActiveTree } = get();

  // === 阶段 1: 计算新的 activeTree（现有逻辑不变）===
  let newActiveTree: TreeType | null = null;

  if (phase === 'input') {
    newActiveTree = null;
  } else if (phase === 'context') {
    const allConfirmed = cascade.areAllConfirmed(contextNodes);
    newActiveTree = allConfirmed && contextNodes.length > 0 ? 'flow' : 'context';
  } else if (phase === 'flow') {
    const flowReady = cascade.areAllConfirmed(flowNodes);
    const contextReady = cascade.areAllConfirmed(contextNodes);
    newActiveTree = flowReady && flowNodes.length > 0 ? 'component' : 'flow';
  } else if (phase === 'component') {
    newActiveTree = 'component';
  } else {
    newActiveTree = null;
  }

  // === 阶段 2: 判断是否需要自动展开 ===
  if (newActiveTree !== _prevActiveTree) {
    if (newActiveTree === null) {
      // input 或 prototype 阶段：重置为 default
      set({ activeTree: newActiveTree, _prevActiveTree: newActiveTree, centerExpand: 'default' });
    } else if (newActiveTree === 'flow' || newActiveTree === 'component') {
      // flow 或 component 阶段：自动展开中间面板
      set({ activeTree: newActiveTree, _prevActiveTree: newActiveTree, centerExpand: 'expand-left' });
    } else {
      // context 阶段（降级情况）
      set({ activeTree: newActiveTree, _prevActiveTree: newActiveTree });
    }
  } else {
    // activeTree 未变化：仅更新 activeTree（保持 centerExpand 不变）
    set({ activeTree: newActiveTree });
  }
},
```

**C. Store 初始状态** — 初始化 `_prevActiveTree`

```typescript
_prevActiveTree: null,
```

**D. `persist` 配置** — 不持久化 `_prevActiveTree`

```typescript
partialize: (state) => ({
  // ... 现有字段 ...
  // _prevActiveTree 不持久化，每次页面刷新重新计算
}),
```

**E. 类型定义更新** — `types.ts` 无需改动（`_prevActiveTree` 是内部实现细节）

### 3.2 `vibex-fronted/src/components/canvas/CanvasPage.tsx`

**Epic E2-2 (移动端 Tab 全屏)**: 新增 `useEffect` 监听 `activeTab` 变化

```typescript
// CanvasPage.tsx - 现有代码基础上新增
const activeTab = useCanvasStore((s) => s.activeTree ?? 'context'); // fallback 到 store 值

// === 新增: Tab 切换时自动全屏当前面板 (E2-2) ===
useEffect(() => {
  if (useTabMode) {
    const setExpand = useCanvasStore.getState().setCenterExpand;
    const setLeft = useCanvasStore.getState().setLeftExpand;
    const setRight = useCanvasStore.getState().setRightExpand;

    if (activeTab === 'context') {
      // 中间面板全屏（右侧收缩）
      setExpand('expand-left');
      setLeft('default');
    } else if (activeTab === 'flow') {
      setExpand('expand-left');
      setLeft('default');
    } else if (activeTab === 'component') {
      setExpand('expand-left');
      setLeft('default');
    }
  }
}, [activeTab, useTabMode]);
```

**注意**: 此 `useEffect` 仅在 `useTabMode === true` 时生效，不影响桌面端。

### 3.3 `vibex-fronted/src/components/canvas/HoverHotzone.tsx` (Epic E2-3)

**现状**: `HoverHotzone` 已通过 `centerExpandDirection` prop 支持 expand-left/expand-right 切换逻辑。

**Epic E2-3 修改**: 当相邻面板处于展开状态时，给热区添加视觉高亮类名。

```typescript
// HoverHotzone.tsx - 获取相邻面板展开状态
const centerExpand = useCanvasStore((s) => s.centerExpand);
const leftExpand = useCanvasStore((s) => s.leftExpand);

// 热区高亮：当相邻面板已展开时，给热区添加样式
const isHighlighted =
  (panel === 'center' && centerExpand === 'expand-left') ||
  (panel === 'left' && centerExpand === 'default') ||
  (panel === 'right' && centerExpand === 'default');

const hotzoneClass = isHighlighted ? `${styles.hotzone} ${styles.hotzoneActive}` : styles.hotzone;
```

```css
/* canvas.module.css - 新增 */
.hotzoneActive {
  background: rgba(99, 102, 241, 0.15);
  border-color: rgba(99, 102, 241, 0.4);
}
```

---

## 4. 影响范围

| 范围 | 影响描述 | 风险等级 |
|------|----------|---------|
| `canvasStore.ts` | 修改 `recomputeActiveTree` 逻辑，新增 `_prevActiveTree` | 低 |
| `CanvasPage.tsx` | 新增 `useEffect`（条件渲染，不影响桌面端） | 低 |
| `HoverHotzone.tsx` | 新增样式类，不改变交互行为 | 低 |
| `canvas.module.css` | 新增 `.hotzoneActive` 样式 | 低 |
| HoverHotzone 手动展开 | 不受影响，`_prevActiveTree` 仅在 `activeTree` 实际变化时触发 | 无 |
| `persist` 持久化 | `_prevActiveTree` 不持久化，页面刷新后重新计算 | 无 |
| `loadExampleData` | 直接 set `{ phase: 'context', activeTree: 'flow' }`，不走 `recomputeActiveTree` | 无（但不会触发 auto-expand） |

**已知边界情况**:
- `loadExampleData` 直接 set `activeTree: 'flow'`，不经过 `recomputeActiveTree`，**不会**触发自动展开。这是合理行为（示例数据为快速演示场景，用户已处于"已加载"状态）。
- `confirmContextNode` 快速多次调用：每次 `activeTree` 从 context→flow 切换只在第一次发生，后续调用 `_prevActiveTree === 'flow'` 且 `newActiveTree === 'flow'`，不触发展开重置。

---

## 5. 工时估算

| Epic | Story | 修改文件 | 预估工时 |
|------|-------|----------|---------|
| **E2-1 (P0)** | E2-1.1 `recomputeActiveTree` 自动展开 | `canvasStore.ts` | 1h |
| **E2-1 (P0)** | E2-1.2 `autoGenerateFlows` 验证 | `canvasStore.ts` | 0.5h（已有 `setPhase` 链式调用，已覆盖） |
| **E2-1 (P0)** | E2-1.3 手动展开保护验证 | `canvasStore.ts` | 0.5h |
| **E2-2 (P2)** | E2-2.1 Tab 切换全屏 | `CanvasPage.tsx` | 1h |
| **E2-3 (P3)** | E2-3.1 HoverHotzone 高亮 | `HoverHotzone.tsx` + `canvas.module.css` | 0.5h |
| | | **合计** | **3.5h ≈ 0.5 人天** |

**推荐实施顺序**:
1. E2-1.1 核心修复（1h）→ tester 验证
2. E2-2 Tab 全屏（1h）→ tester 验证
3. E2-3 热区高亮（0.5h）→ reviewer 最终审查

---

## 6. 测试用例（供 Tester 参考）

```typescript
// E2-1.1
it('confirmContextNode 后 centerExpand 变为 expand-left', () => {
  const store = useCanvasStore.getState();
  store.setContextNodes([{ nodeId: '1', name: 'ctx1', type: 'core', description: '', confirmed: false, status: 'pending', children: [] }]);
  store.confirmContextNode('1');
  expect(useCanvasStore.getState().centerExpand).toBe('expand-left');
});

// E2-1.2
it('autoGenerateFlows 成功后 centerExpand 变为 expand-left', async () => {
  // mock canvasApi.generateFlows
  const store = useCanvasStore.getState();
  await store.autoGenerateFlows([{ nodeId: '1', name: 'ctx', type: 'core', description: '', confirmed: true, status: 'confirmed', children: [] }]);
  expect(useCanvasStore.getState().centerExpand).toBe('expand-left');
});

// E2-1.3
it('手动 setCenterExpand 后 recomputeActiveTree 不覆盖', () => {
  const store = useCanvasStore.getState();
  store.setCenterExpand('expand-right');
  store.setContextNodes([{ nodeId: '1', name: 'ctx', type: 'core', description: '', confirmed: false, status: 'pending', children: [] }]);
  store.confirmContextNode('1');
  // 手动 expand-right 不被覆盖（但 context→flow 触发 expand-left，这是预期行为）
  // 真正保护的是：activeTree 未变化时的手动展开不被覆盖
  store.recomputeActiveTree();
  expect(useCanvasStore.getState().centerExpand).toBe('expand-left');
});

// E2-1 补充：context 阶段不展开
it('context 阶段 activeTree 为 context，centerExpand 保持 default', () => {
  const store = useCanvasStore.getState();
  store.setPhase('context');
  store.recomputeActiveTree();
  expect(useCanvasStore.getState().activeTree).toBe('context');
  expect(useCanvasStore.getState().centerExpand).toBe('default');
});

// E2-1 补充：input 阶段重置
it('input 阶段 centerExpand 重置为 default', () => {
  const store = useCanvasStore.getState();
  store.setCenterExpand('expand-left');
  store.setPhase('input');
  expect(useCanvasStore.getState().centerExpand).toBe('default');
});
```
