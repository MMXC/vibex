# Architecture: canvas-node-deselect-fix

**Agent**: Architect
**日期**: 2026-04-01
**版本**: v1.0

---

## 1. Tech Stack

| 组件 | 选择 | 理由 |
|------|------|------|
| State Store | Zustand (`useCanvasStore`) | 现有依赖，无需引入新库 |
| Event System | Vanilla JS `document.addEventListener` | 原生 API，轻量无依赖 |
| Testing | Playwright E2E | 已有测试基础设施 |
| Target Detection | `Element.closest('[data-node-id]')` | CSS 属性选择器，无需额外标记逻辑 |

---

## 2. Architecture Diagram

```mermaid
flowchart LR
    subgraph CanvasPage["Canvas Page (React)"]
        useEffect["useEffect\n(document click listener)"]
        handler["handleClickOutside\ne: MouseEvent"]
        detect["isNodeArea?\ntarget.closest('[data-node-id]')"]
    end

    subgraph Store["Zustand Store (useCanvasStore)"]
        state_context["selectedNodes: context"]
        state_flow["selectedNodes: flow"]
        state_component["selectedNodes: component"]
        clear["clearNodeSelection(storeKey)"]
    end

    useEffect --> handler
    handler --> detect
    detect --"yes (inside node)"--> "[no-op]"
    detect --"no (outside node)"--> clear
    clear --> state_context
    clear --> state_flow
    clear --> state_component
```

**执行路径**：
1. Canvas 页面挂载时，`useEffect` 注册 `document` 级 click 监听器
2. 用户点击任意位置，`handleClickOutside` 接收 `MouseEvent`
3. 通过 `target.closest('[data-node-id]')` 判断点击目标是否为节点元素
4. 若不在节点内，依次调用 `clearNodeSelection` 清空 context / flow / component 三个树
5. `useEffect` cleanup 返回 `removeEventListener` 防止内存泄漏

---

## 3. API Definitions

### `clearNodeSelection(storeKey: 'context' | 'flow' | 'component'): void`

清空指定树的选中节点。

```typescript
// Declaration
clearNodeSelection(storeKey: 'context' | 'flow' | 'component'): void;

// Usage
const store = useCanvasStore.getState();
store.clearNodeSelection('context');
store.clearNodeSelection('flow');
store.clearNodeSelection('component');
```

### `isNodeArea(target: HTMLElement): boolean`

判断点击目标是否在节点区域内。

```typescript
// Implementation
const isNodeArea = (target: HTMLElement): boolean => {
  return target.closest('[data-node-id]') !== null;
};

// Usage
const handleClickOutside = (e: MouseEvent) => {
  const target = e.target as HTMLElement;
  if (!isNodeArea(target)) {
    // clear selections
  }
};
```

---

## 4. Data Model

### SelectedNodeState

```typescript
// Node selection per tree
type SelectedNodeState = {
  selectedNodes: {
    context: string[];   // array of selected node IDs
    flow: string[];
    component: string[];
  };
};
```

各树独立存储选中节点 ID 数组。清空时将数组置为 `[]`。

---

## 5. Testing Strategy

### Test Framework: Playwright E2E

**测试用例**: `点击空白区域清空所有树的选中节点`

```
Test: canvas-deselect-on-click-outside
Steps:
  1. Navigate to canvas page
  2. Click a node → node is selected
  3. Click blank canvas area (non-node area)
  4. Assert: all tree selections cleared
  5. Assert: selected node count = 0

Assertions:
  - Page has no visible node selection highlight
  - Store state reflects cleared selections
```

**覆盖率目标**:
- 点击节点内区域 → 不触发清空
- 点击节点外区域 → 触发清空
- 连续点击多次空白区域 → 幂等，状态不变

---

## 6. ADR: document click vs overlay div

### Decision

选择 **document 级别 click 监听器**，而非覆盖层 `<div>` 拦截。

### Options Compared

| 选项 | 实现方式 | 优点 | 缺点 |
|------|----------|------|------|
| **A: document click listener** | `document.addEventListener('click')` | 简单，无需修改 DOM 结构，全局有效 | 可能与第三方监听器冲突 |
| B: overlay div | 在节点上层放置 `pointer-events: all` 的透明 div | 视觉层隔离 | 需修改布局，可能遮挡交互 |

### Rationale

- 改动最小：仅需在现有 Canvas 页面增加一个 `useEffect`
- 行为与 Esc 键一致：均为全局清除选中
- 无副作用：检测 `[data-node-id]` 属性确保只忽略节点点击
- 推荐方案已在 PRD 中验证可行性

### Consequences

- ✅ 实现成本低（<1h）
- ✅ 不引入新组件或 DOM 结构变更
- ⚠️ 需要确保 `[data-node-id]` 在所有节点元素上正确设置

---

## 7. Performance

- **运行时开销**: 极低。单个 document 级别 click 监听器，O(1) 每次点击
- **内存泄漏风险**: 已通过 `useEffect` cleanup 中的 `removeEventListener` 消除
- **重排/重绘**: 无。纯状态操作，不涉及 DOM 变更

---

## 执行决策

- **决策**: 已采纳
- **执行项目**: canvas-node-deselect-fix
- **执行日期**: 2026-04-01
