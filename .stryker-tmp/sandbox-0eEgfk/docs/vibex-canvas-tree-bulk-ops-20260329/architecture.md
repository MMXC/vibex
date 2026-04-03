# 架构设计：vibex-canvas-tree-bulk-ops-20260329

**项目**: 三栏组件树批量操作工具栏
**作者**: architect (subagent)
**日期**: 2026-03-29
**状态**: 设计完成 → 待评审
**前置文档**: `analysis.md`, `prd.md`

---

## 1. 架构概览

### 1.1 功能范围

在右侧组件树面板（`.contextTreeControls`）新增三个批量操作按钮：

| 按钮 | 行为 | 复用已有 action |
|------|------|----------------|
| ⊞ 全选 | 勾选所有节点 | `selectAllNodes('component')` ✅ |
| ⊠ 取消全选 | 取消勾选所有节点 | `clearNodeSelection('component')` ✅ |
| 🗑 清空画布 | 删除所有节点 | 新增 `clearComponentCanvas()` |

### 1.2 架构决策

**单文件改动原则**：所有逻辑集中在 `canvasStore.ts` 和 `ComponentTree.tsx` 两个文件，CSS 扩展现有模块，零新增依赖。

```
ComponentTree.tsx (UI层)
  └─ useCanvasStore (Zustand store)
       └─ canvasStore.ts (状态层)
            ├─ selectAllNodes (已有)
            ├─ clearNodeSelection (已有)
            └─ clearComponentCanvas (新增) → historySlice (撤销支持)
```

---

## 2. canvasStore.ts 接口变更

### 2.1 新增 action: `clearComponentCanvas`

**文件**: `src/lib/canvas/canvasStore.ts`

**位置**: Component Slice Actions 区域（约 line 743，`setComponentNodes` 之后）

**签名**:
```typescript
clearComponentCanvas: () => void
```

**实现**:
```typescript
clearComponentCanvas: () => {
  const historyStore = getHistoryStore();
  const nodes = get().componentNodes;
  if (nodes.length === 0) return; // 无节点时跳过
  historyStore.recordSnapshot('component', nodes); // 撤销依赖
  set({ componentNodes: [] });
},
```

**依赖注入**:
- `getHistoryStore` — 从 `./historySlice` 导入（line 30 已导入）
- `get()` — Zustand `get` 函数，已在 `canvasStore` 内可用

**行为**:
1. 空节点保护：`nodes.length === 0` 时直接 return
2. 撤销快照：调用 `historyStore.recordSnapshot` 记录清空前状态
3. 状态更新：`set({ componentNodes: [] })` 触发 React 重渲染
4. 副作用：选中状态自然清空（`componentNodes` 为空后 `selectedNodeIds` 无意义）

### 2.2 已有 action 确认

| action | 文件位置 | 验证状态 |
|--------|----------|----------|
| `selectAllNodes` | `canvasStore.ts:334` | ✅ 已存在，参数 `tree: TreeType` |
| `clearNodeSelection` | `canvasStore.ts:325` | ✅ 已存在，参数 `tree: TreeType` |
| `setComponentNodes` | `canvasStore.ts:743` | ✅ 已存在，**不记录历史** |

---

## 3. ComponentTree.tsx 组件变更

### 3.1 新增按钮布局

**文件**: `src/components/canvas/ComponentTree.tsx`
**位置**: `.contextTreeControls` 容器内，`{hasNodes && (` 判断块之后

**结构**:
```
.contextTreeControls
├── <PrimaryButton> AI 生成组件
├── <SecondaryButton> 🔄 重新生成组件树  (hasNodes)
├── <PrimaryButton> 继续 → 原型生成      (allConfirmed)
├── <SecondaryButton> + 手动新增          (!readonly && !showAddForm)
│
├── [新增] <SecondaryButton> ⊞ 全选 / ⊠ 取消全选  (hasNodes)
├── [新增] <DangerButton>  🗑 清空画布       (hasNodes && !readonly)
│
└── .multiSelectControls
    ├── "N 已选" + 取消选择 + 删除(N)   (selectedCount > 0)
    └── 全选 (selectedCount === 0)
```

### 3.2 按钮条件渲染逻辑

```tsx
{/* === F001 + F002: 全选 / 取消全选 === */}
{hasNodes && (
  selectedCount === 0 ? (
    <button
      type="button"
      className={styles.secondaryButton}
      onClick={() => selectAllNodes('component')}
      aria-label="全选所有组件"
    >
      ⊞ 全选
    </button>
  ) : (
    <button
      type="button"
      className={styles.secondaryButton}
      onClick={() => clearNodeSelection('component')}
      aria-label="取消全选所有组件"
    >
      ⊠ 取消全选
    </button>
  )
)}

{/* === F003: 清空画布 === */}
{hasNodes && !readonly && (
  <button
    type="button"
    className={styles.dangerButton}
    onClick={handleClearCanvas}
    aria-label="清空画布"
    title="清空画布（可撤销）"
  >
    🗑 清空画布
  </button>
)}
```

### 3.3 `handleClearCanvas` 事件处理器

**建议在 `ComponentTree` 组件顶部或 `useCallback` 区域新增**：

```typescript
const handleClearCanvas = useCallback(() => {
  if (window.confirm('确定清空画布？所有组件将被删除。')) {
    useCanvasStore.getState().clearComponentCanvas();
  }
}, []);
```

> **注意**: 使用 `useCanvasStore.getState()` 而非 `useCanvasStore` hook，避免在事件处理器中违反 React hooks 调用规则。

### 3.4 已有 import 确认

```typescript
// 以下 import 在 ComponentTree.tsx 中已存在
import { useCanvasStore } from '@/lib/canvas/canvasStore';  // ✅ 已导入
import { getHistoryStore } from '@/lib/canvas/historySlice'; // ✅ 已导入

// 新增 import（如果 handleClearCanvas 放在组件外部）
// 不需要新增 import，因为 useCanvasStore 已包含 clearComponentCanvas
```

---

## 4. CSS 样式变更

### 4.1 `.dangerButton` 样式

**文件**: `src/components/canvas/canvas.module.css`
**位置**: `.deleteButton` (line 813) 之后

**设计原则**:
- 红色边框 + 透明背景 + 红色文字（默认态）
- 红色背景 + 白色文字（hover 态）
- 与 `.deleteButton` 视觉一致，但独立类名避免样式耦合

```css
.dangerButton {
  padding: 0.3rem 0.6rem;
  border: 1px solid var(--color-danger, #ef4444);
  border-radius: 6px;
  background: transparent;
  color: var(--color-danger, #ef4444);
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.dangerButton:hover {
  background: var(--color-danger, #ef4444);
  color: #fff;
}

.dangerButton:focus-visible {
  outline: 2px solid var(--color-danger, #ef4444);
  outline-offset: 2px;
}
```

**已有变量确认**:
- `--color-danger` — 通过 `grep -r "color-danger" canvas.module.css` 验证为 `#ef4444`

---

## 5. 数据流

### 5.1 全选（selectAllNodes）

```
[用户点击"⊞ 全选"]
        ↓
[selectAllNodes('component')]
        ↓
[提取 componentNodes.map(n => n.nodeId)]
        ↓
[set({ selectedNodeIds: { ...s.selectedNodeIds, component: allIds } })]
        ↓
[React 重渲染 → 所有 checkbox 变为 checked]
        ↓
[multiSelectControls 自动切换 → "N 已选" + 取消选择 + 删除]
```

### 5.2 清空画布（clearComponentCanvas）

```
[用户点击"🗑 清空画布"]
        ↓
[window.confirm('确定清空画布？')]
    确认 ──────────────────┐  取消
        ↓                      ↓
[getHistoryStore().recordSnapshot]  [无操作]
        ↓
[set({ componentNodes: [] })]
        ↓
[React 重渲染 → 空状态 ".contextTreeEmpty"]
        ↓
[用户按 Ctrl+Z]
        ↓
[historyStore.revert('component')]
        ↓
[componentNodes 恢复]
```

---

## 6. 性能影响评估

| 维度 | 影响 | 评估 |
|------|------|------|
| **全选** | 遍历 `componentNodes` 提取 nodeId | O(n)，n 通常 < 100，影响可忽略 |
| **取消全选** | 重置数组引用 | O(1)，影响可忽略 |
| **清空画布** | `set({ componentNodes: [] })` + history snapshot | O(n) 序列化，历史记录通常 < 50 条，影响可忽略 |
| **重新渲染** | Zustand 状态更新触发 React 重新渲染 | React 虚拟 DOM diff，n < 100 时 < 16ms |
| **bundle size** | `.dangerButton` CSS 约 5 行 | < 200 bytes，零新增 JS bundle |

**结论**: 所有操作性能影响均为 O(n) 且 n 极小（组件树节点数通常 < 100），用户无感知。

---

## 7. 边界条件与错误处理

| 场景 | 处理方式 |
|------|----------|
| `componentNodes.length === 0` | `hasNodes = false` → 三个按钮均不渲染 |
| `readonly === true` | "清空画布"按钮不显示（`!readonly` 条件） |
| `clearComponentCanvas()` 空调用 | `nodes.length === 0` 时直接 return，不弹 confirm |
| historyStore 不可用 | `getHistoryStore()` 在模块初始化时已实例化，不会失败 |
| 快速连续点击清空 | 无防抖，第二次调用时 nodes 已为空 → return |
| 多窗口同时编辑 | Zustand 单例状态，无并发问题 |

---

## 8. 测试接口

### 8.1 `clearComponentCanvas` 单元测试

```typescript
// canvasStore.spec.ts
describe('clearComponentCanvas', () => {
  it('清空后 componentNodes 为空数组', () => {
    store.setState({ componentNodes: [mockNode1, mockNode2] });
    useCanvasStore.getState().clearComponentCanvas();
    expect(useCanvasStore.getState().componentNodes).toEqual([]);
  });

  it('清空前记录 history snapshot', () => {
    store.setState({ componentNodes: [mockNode] });
    const recordSpy = jest.spyOn(getHistoryStore(), 'recordSnapshot');
    useCanvasStore.getState().clearComponentCanvas();
    expect(recordSpy).toHaveBeenCalledWith('component', [mockNode]);
  });

  it('空节点时无操作', () => {
    store.setState({ componentNodes: [] });
    const recordSpy = jest.spyOn(getHistoryStore(), 'recordSnapshot');
    useCanvasStore.getState().clearComponentCanvas();
    expect(recordSpy).not.toHaveBeenCalled();
    expect(useCanvasStore.getState().componentNodes).toEqual([]);
  });
});
```

### 8.2 集成测试接口

```typescript
// ComponentTreeBulkOps.test.tsx
const clearCanvasButton = () =>
  screen.getByRole('button', { name: /清空画布/ });
const selectAllButton = () =>
  screen.getByRole('button', { name: /全选所有组件/ });
const deselectAllButton = () =>
  screen.getByRole('button', { name: /取消全选所有组件/ });
```

---

## 9. 风险与缓解

| 风险 | 等级 | 缓解措施 |
|------|------|----------|
| `handleClearCanvas` 放在 `.onClick` 内导致 React hooks 违规 | 低 | 提取为 `useCallback` 函数，使用 `getState()` |
| `.dangerButton` 与 `.deleteButton` 样式重复 | 低 | `.dangerButton` 独立类名，不继承 `.deleteButton` |
| 清空后未正确显示空状态 | 低 | 验证 `.contextTreeEmpty` 在 `componentNodes.length === 0` 时渲染 |
| 历史记录无限增长 | 低 | `historyStore` 有 maxSize 限制，历史快照通常 < 50 条 |

---

*架构设计完成时间：2026-03-29 12:50 GMT+8*
*architect subagent: heartbeat-spawn-architect-bulkops*
