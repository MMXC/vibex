# 需求分析：vibex-canvas-tree-bulk-ops-20260329

## 1. 当前组件树 UI 布局截图

> **截图路径**: `/tmp/vibex-canvas-overview.png`

### 布局结构（三栏画布）

```
┌─────────────────────────────────────────────────────────────────────┐
│  PhaseProgressBar (阶段进度条: input → context → flow → component)  │
├─────────────────────────────────────────────────────────────────────┤
│  ProjectBar (项目名 + 搜索 + 缩放 + 历史)                            │
├──────────────────┬──────────────────────┬───────────────────────────┤
│  ◇ 限界上下文树   │   → 业务流程树        │   ▣ 组件树 (0/5) [▼]      │
│  [折叠标题头]     │   [折叠标题头]        │   [折叠标题头]              │
│                  │                      │                            │
│  限界上下文节点   │   业务流程节点        │   ┌─ 📄 创建订单流程 (3) ─┐│
│  (卡片列表)       │   (带确认复选框)      │   │ 商品列表页 [✓确认] [编辑]│
│                  │                      │   │ 购物车页   [✓确认] [编辑]│
│                  │                      │   │ 结算页     [✓确认] [编辑]│
│                  │                      │   └──────────────────────┘ │
│                  │                      │   ┌─ 📄 用户认证流程 (1) ─┐│
│                  │                      │   │ 登录页     [✓确认] [编辑]│
│                  │                      │   └──────────────────────┘ │
│                  │                      │   [确认所有组件后解锁原型生成]│
│                  │                      │                            │
│  [继续→流程树]   │   [继续→组件树]       │   [◈ AI生成][🔄重新生成]   │
│  [🔄重新生成]    │                      │   [+ 手动新增]             │
└──────────────────┴──────────────────────┴───────────────────────────┘
```

### 组件树面板内部控件（当前）

**`.contextTreeControls` 区域**（组件树顶部工具栏）:
- `◈ AI 生成组件` — primaryButton
- `🔄 重新生成组件树` — secondaryButton（仅在 hasNodes 时显示）
- `继续 → 原型生成` — primaryButton（仅在 allConfirmed 时显示）
- `+ 手动新增` — secondaryButton

**现有批量操作**（`multiSelectControls` 区域，与 `.contextTreeControls` 在同一父容器）:
- 已选计数 `span`
- `取消选择` / `删除 (N)` — selectedCount > 0 时
- `全选` — selectedCount === 0 时

---

## 2. 需要修改的组件和 State

### 2.1 组件文件

| 文件路径 | 修改内容 |
|----------|----------|
| `src/components/canvas/ComponentTree.tsx` | 新增三个批量操作按钮 |
| `src/lib/canvas/canvasStore.ts` | 新增 `clearComponentCanvas` action |
| `src/components/canvas/canvas.module.css` | 新增批量工具栏 CSS 样式 |

### 2.2 State 变量

**canvasStore 中需要使用/新增的状态和方法**：

| 变量 | 位置 | 用途 |
|------|------|------|
| `componentNodes: ComponentNode[]` | canvasStore | 组件树节点列表 |
| `selectedNodeIds: Record<TreeType, string[]>` | canvasStore | 批量选中的节点 ID 列表 |
| `selectAllNodes: (tree: TreeType) => void` | canvasStore（已存在） | 全部勾选（选入 selectedNodeIds） |
| `clearNodeSelection: (tree: TreeType) => void` | canvasStore（已存在） | 取消全部勾选 |
| `setComponentNodes: (nodes: ComponentNode[]) => void` | canvasStore（已存在） | 设置组件节点（用于清空） |
| `clearComponentCanvas: () => void` | canvasStore（**需新增**） | 清空画布 |

---

## 3. 批量操作的 State 更新逻辑

### 3.1 全部勾选（选入批量选中列表）

**现有实现可复用** — `selectAllNodes('component')`：

```typescript
// canvasStore.ts（已存在，line 334）
selectAllNodes: (tree) => {
  set((s) => {
    const nodeIds = s[`${tree}Nodes`].map((n) => n.nodeId);
    return {
      selectedNodeIds: {
        ...s.selectedNodeIds,
        [tree]: nodeIds,
      },
    };
  });
},
```

**逻辑**：将 `componentNodes` 数组中所有节点的 `nodeId` 提取为数组，存入 `selectedNodeIds.component`。

### 3.2 取消全部勾选

**现有实现可复用** — `clearNodeSelection('component')`：

```typescript
// canvasStore.ts（已存在，line 325）
clearNodeSelection: (tree) => {
  set((s) => ({
    selectedNodeIds: {
      ...s.selectedNodeIds,
      [tree]: [],
    },
  }));
},
```

**逻辑**：将 `selectedNodeIds.component` 设为空数组 `[]`。

### 3.3 清空画布

**需新增 action** — `clearComponentCanvas`：

```typescript
// canvasStore.ts（需新增）
clearComponentCanvas: () => {
  const historyStore = getHistoryStore();
  historyStore.recordSnapshot('component', get().componentNodes);
  set({ componentNodes: [] });
},
```

**逻辑**：
1. 记录 undo snapshot（保持撤销能力）
2. 调用 `setComponentNodes([])` 将右侧画布清空

> ⚠️ 注意：`setComponentNodes` 目前**不记录历史**（line 743 直接 `set`），建议在新增 `clearComponentCanvas` 时主动补录 history。

---

## 4. 清空画布的 API / 函数

| 函数 | 文件 | 签名 | 行为 |
|------|------|------|------|
| `setComponentNodes([])` | `canvasStore.ts:743` | `(nodes: ComponentNode[]) => void` | 直接将 `componentNodes` 设为空数组 |
| `clearComponentCanvas`（新增） | `canvasStore.ts` | `() => void` | 记录历史 + 清空（推荐） |

**无独立"清空画布"API**：目前清空右侧组件树只能通过 `setComponentNodes([])` 实现。建议封装为独立 action 并记录历史。

---

## 5. 修复方案（至少 2 个可选方案）

### 方案 A：最小化改动 — 复用现有 state + 新增 action（推荐）

**思路**：利用现有 `selectedNodeIds` 和 `multiSelectControls` 机制，新增一个 `clearComponentCanvas` action，在 `ComponentTree` 的 `.contextTreeControls` 中添加三个按钮。

**改动点**：

1. **canvasStore.ts**：新增 `clearComponentCanvas` action
2. **ComponentTree.tsx**：在 `.contextTreeControls` 中添加三个按钮
3. **canvas.module.css**：新增 `.bulkOpsToolbar` 样式

**优点**：
- 利用已有 checkbox UI，交互一致
- 代码量最小，风险低
- 与现有 `multiSelectControls` 布局兼容

**缺点**：
- 需要理解多选 checkbox 机制，用户可能混淆"全部勾选"与"确认"

---

### 方案 B：新增独立确认状态 — 增加 `confirmed` 批量操作

**思路**：不依赖现有的多选 checkbox，而是在每个组件卡片的"确认"按钮基础上，增加批量确认/取消确认功能。

**改动点**：

1. **canvasStore.ts**：新增 `confirmAllComponents` 和 `unconfirmAllComponents` actions
2. **ComponentTree.tsx**：在 `.contextTreeControls` 中添加批量确认/取消按钮
3. 新增 `BulkOpsToolbar` 子组件（独立工具栏）

**优点**：
- 操作语义清晰（"确认"与"取消确认"与已有卡片按钮一致）
- 不涉及 checkbox 概念，用户认知成本低

**缺点**：
- 代码改动更大（需新增 confirmAll/unconfirmAll actions）
- 需要遍历所有节点，性能开销略大（但 componentNodes 通常 < 100 个，影响可忽略）

---

### 方案对比

| 维度 | 方案 A（复用多选） | 方案 B（新增确认 action） |
|------|-------------------|-------------------------|
| 代码改动量 | 小 | 中 |
| UI 组件新增 | 按钮复用 | 独立 BulkOpsToolbar |
| 用户认知 | 需理解多选 checkbox | 与卡片按钮语义一致 |
| 可复用性 | 复用现有 state | 需新增 action |
| 风险 | 低 | 中 |

**推荐方案 A**（复用多选），理由：现有 checkbox 机制已完整，只需添加按钮；`清空画布` 可通过 `setComponentNodes([])` 实现。

---

## 6. 验收标准（具体可测试）

### 6.1 全部勾选
- [ ] 在组件树有节点时（hasNodes = true），显示"全部勾选"按钮
- [ ] 点击后，`selectedNodeIds.component` 包含所有 `componentNodes` 的 nodeId
- [ ] 所有节点卡片的 checkbox 显示为 checked 状态
- [ ] `multiSelectControls` 显示已选 N 项

### 6.2 取消全部勾选
- [ ] 在有选中项时（selectedCount > 0），显示"取消全部勾选"按钮
- [ ] 点击后，`selectedNodeIds.component` 为空数组
- [ ] 所有节点卡片的 checkbox 取消勾选
- [ ] `multiSelectControls` 切换回"全选"按钮

### 6.3 清空画布
- [ ] 在组件树有节点时，显示"清空画布"按钮（建议红色或警告色）
- [ ] 点击后，弹出确认对话框（`confirm('确定清空画布？')`）
- [ ] 确认后，`componentNodes` 变为空数组，右侧画布显示空状态
- [ ] 撤销（Ctrl+Z）可恢复已清空的节点

### 6.4 按钮布局
- [ ] 三个按钮在 `.contextTreeControls` 区域（或新增 `.bulkOpsToolbar`）中
- [ ] 按钮之间有适当间距
- [ ] 样式与现有 `.secondaryButton` / `.dangerButton` 一致

### 6.5 边界条件
- [ ] 组件树为空时（componentNodes.length === 0），不显示三个按钮
- [ ] 清空画布后，面板显示"暂无组件"空状态
- [ ] 批量操作不触发其他面板（如限界上下文树、业务流程树）

---

## 附录：关键代码引用

### A. ComponentTree.tsx 中的批量操作控件位置

```tsx
// ComponentTree.tsx — 批量操作控件（在 .contextTreeControls 内）
{hasNodes && (
  <div className={styles.multiSelectControls}>
    {selectedCount > 0 ? (
      <>
        <span className={styles.selectionCount}>{selectedCount} 已选</span>
        <button ... onClick={() => clearNodeSelection('component')}>取消选择</button>
        {!readonly && <button ... onClick={() => deleteSelectedNodes('component')}>删除 ({selectedCount})</button>}
      </>
    ) : (
      <button ... onClick={() => selectAllNodes('component')}>全选</button>
    )}
  </div>
)}
```

### B. canvasStore 关键 state 切片

```typescript
// canvasStore.ts — selectedNodeIds 切片
selectedNodeIds: Record<TreeType, string[]>  // { context: [], flow: [], component: [] }
componentNodes: ComponentNode[]
```

### C. canvas.module.css 中的现有样式

```css
/* canvas.module.css:709 */
.contextTreeControls { ... }
/* canvas.module.css:837 */
.multiSelectControls { display: flex; align-items: center; gap: 0.375rem; flex-wrap: wrap; }
/* canvas.module.css:844 */
.selectionCount { padding: 0.25rem 0.5rem; background: rgba(124, 58, 237, 0.15); ... }
```

---

*分析完成时间：2026-03-29 11:10 GMT+8*
*分析人：subagent (vibex-canvas-tree-bulk-ops-analyze)*
