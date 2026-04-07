# PRD — 三栏组件树批量操作工具栏

**项目**: vibex-canvas-tree-bulk-ops-20260329
**作者**: subagent (PRD 细化)
**日期**: 2026-03-29
**状态**: Draft → 待评审
**分析文档**: `./analysis.md`

---

## 1. 功能 ID 列表

| 功能 ID | 功能名称 | 类型 | 优先级 |
|---------|----------|------|--------|
| F001 | 全选按钮 | Feature | P1 |
| F002 | 取消全选按钮 | Feature | P1 |
| F003 | 清空画布按钮 | Feature | P1 |

---

## 2. 背景与目标

当前组件树（右侧面板）已具备多选 checkbox 机制和 `multiSelectControls` 工具栏，但缺少批量全选/取消全选/清空画布的快捷入口。用户需逐个点击 checkbox 或依赖框选，操作效率低。

本 PRD 目标：在 `.contextTreeControls` 区域内新增三个批量操作按钮，提升组件树操作效率，同时保持现有 `.multiSelectControls` 机制完整。

---

## 3. 功能详细规格

### F001 — 全选按钮

**功能描述**: 点击后勾选组件树所有节点，调用已有 `selectAllNodes('component')`。

**行为**:
1. 仅在 `hasNodes === true` 时显示
2. 点击后调用 `selectAllNodes('component')`，将所有 `componentNodes` 的 `nodeId` 存入 `selectedNodeIds.component`
3. 所有组件卡片的 checkbox 变为 checked 状态
4. `.multiSelectControls` 自动切换为"已选 N" + "取消选择" + "删除(N)" 模式

**UI 规格**:
- 位置：`.contextTreeControls` 容器末尾，`.multiSelectControls` 之前
- 样式：复用 `.secondaryButton`
- 图标/文案：`⊞ 全选` 或 `☐ 全选`
- aria-label: `全选所有组件`

**验收标准**:
```
expect(screen.getByRole('button', { name: /全选/ })).toBeVisible();
userEvent.click(screen.getByRole('button', { name: /全选/ }));
expect(screen.getByText('N 已选')).toBeInTheDocument(); // N = componentNodes.length
const checkboxes = screen.getAllByRole('checkbox');
checkboxes.forEach(cb => expect(cb).toBeChecked());
```

---

### F002 — 取消全选按钮

**功能描述**: 点击后取消勾选所有节点，调用已有 `clearNodeSelection('component')`。

**行为**:
1. 仅在 `selectedCount > 0` 且 `multiSelectControls` 内无"全选"时显示
2. 点击后调用 `clearNodeSelection('component')`，将 `selectedNodeIds.component` 设为 `[]`
3. 所有组件卡片的 checkbox 取消勾选
4. `.multiSelectControls` 自动切换回"全选"模式

**UI 规格**:
- 位置：与 F001 同一位置（替换"全选"按钮），或与 F001 共存
- **推荐实现**：将 F001 和 F002 合并为一个条件按钮，逻辑与现有 `multiSelectControls` 一致：
  - `selectedCount === 0` → 显示"全选"
  - `selectedCount > 0` → 显示"取消全选"
- 样式：`.secondaryButton`
- 图标/文案：`⊠ 取消全选`
- aria-label: `取消全选所有组件`

**验收标准**:
```
// After F001 is clicked
expect(screen.getByRole('button', { name: /取消全选/ })).toBeVisible();
userEvent.click(screen.getByRole('button', { name: /取消全选/ }));
expect(screen.queryByText(/\d+ 已选/)).not.toBeInTheDocument();
const checkboxes = screen.getAllByRole('checkbox');
checkboxes.forEach(cb => expect(cb).not.toBeChecked());
```

---

### F003 — 清空画布按钮

**功能描述**: 清空右侧组件树画布所有节点，调用新增的 `clearComponentCanvas()` action。

**行为**:
1. 仅在 `hasNodes === true` 时显示
2. 点击后弹出 `window.confirm('确定清空画布？所有组件将被删除。')`
3. 用户确认后：
   - 调用 `clearComponentCanvas()` → 记录 undo snapshot + 清空 `componentNodes`
   - 画布显示空状态（已有 `.contextTreeEmpty`）
4. 用户取消或关闭对话框 → 无操作

**UI 规格**:
- 位置：`.contextTreeControls` 容器末尾，与 F001/F002 并排
- 样式：`.dangerButton`（红色警告色，与删除语义一致）
  - 如果 `.dangerButton` 不存在，使用 `.secondaryButton` + 红色文字/边框
- 图标/文案：`🗑 清空画布`
- aria-label: `清空画布`

**撤销能力**:
- `clearComponentCanvas` 必须记录 undo snapshot 至 historyStore
- 用户可通过 Ctrl+Z 或历史面板恢复已清空的节点

**验收标准**:
```
expect(screen.getByRole('button', { name: /清空画布/ })).toBeVisible();
const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);
userEvent.click(screen.getByRole('button', { name: /清空画布/ }));
expect(confirmSpy).toHaveBeenCalledWith(expect.stringContaining('清空画布'));
expect(screen.getByText('暂无组件')).toBeInTheDocument(); // not cleared

confirmSpy.mockReturnValue(true);
userEvent.click(screen.getByRole('button', { name: /清空画布/ }));
expect(screen.getByText('暂无组件')).toBeInTheDocument();

// Undo
expect(screen.getByRole('button', { name: /撤销/ })).toBeEnabled();
```

---

## 4. 页面集成标注

### 4.1 修改文件列表

| # | 文件路径 | 修改内容 |
|---|----------|----------|
| 1 | `src/lib/canvas/canvasStore.ts` | 新增 `clearComponentCanvas` action |
| 2 | `src/components/canvas/ComponentTree.tsx` | 在 `.contextTreeControls` 内新增三个按钮 |
| 3 | `src/components/canvas/canvas.module.css` | 新增批量工具栏 CSS（如需） |

### 4.2 canvasStore.ts 改动

**位置**: `src/lib/canvas/canvasStore.ts`

**新增 action**:
```typescript
clearComponentCanvas: () => {
  const historyStore = getHistoryStore();
  const nodes = get().componentNodes;
  if (nodes.length === 0) return;
  // Record undo snapshot before clearing
  historyStore.recordSnapshot('component', nodes);
  set({ componentNodes: [] });
},
```

**依赖**:
- `getHistoryStore` — 已有，从 `@/lib/canvas/historySlice` 导入
- `get()` — 已有，用于获取当前 `componentNodes`
- `set({ componentNodes: [] })` — 已有 `setComponentNodes`，可直接调用

### 4.3 ComponentTree.tsx 改动

**位置**: `src/components/canvas/ComponentTree.tsx`，函数组件 `ComponentTree` 内

**现有 `.contextTreeControls` 结构**（line ~509）:
```tsx
<div className={styles.contextTreeControls}>
  <button ...>◈ AI 生成组件</button>
  {hasNodes && <button ...>🔄 重新生成组件树</button>}
  {allConfirmed && <button ...>继续 → 原型生成</button>}
  {!readonly && !showAddForm && <button ...>+ 手动新增</button>}

  {/* E3-F2: Multi-select controls — already in contextTreeControls */}
  {hasNodes && (
    <div className={styles.multiSelectControls}>
      {selectedCount > 0 ? (
        <>
          <span className={styles.selectionCount}>{selectedCount} 已选</span>
          <button ...>取消选择</button>
          {!readonly && <button ...>删除 ({selectedCount})</button>}
        </>
      ) : (
        <button ... onClick={() => selectAllNodes('component')}>全选</button>
      )}
    </div>
  )}
</div>
```

**新增改动**:

在 `ComponentTree` 组件的 `div.className={styles.contextTreeControls}` 容器内，`{hasNodes &&` 判断块之后，新增三个按钮：

```tsx
{/* F001+F002: 全选 / 取消全选 — 替换现有的 "全选" 单按钮 */}
{hasNodes && (
  <>
    {selectedCount === 0 ? (
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
    )}
  </>
)}

{/* F003: 清空画布 */}
{hasNodes && !readonly && (
  <button
    type="button"
    className={styles.dangerButton}
    onClick={() => {
      if (window.confirm('确定清空画布？所有组件将被删除。')) {
        const { clearComponentCanvas } = useCanvasStore.getState();
        clearComponentCanvas();
      }
    }}
    aria-label="清空画布"
    title="清空画布（可撤销）"
  >
    🗑 清空画布
  </button>
)}
```

**注意**:
- `clearComponentCanvas` 需要从 `canvasStore.ts` 导出
- `useCanvasStore.getState()` 用于在事件处理器中获取 store 状态（避免 React hooks 违规调用）
- F001/F002 可以与现有 `multiSelectControls` 中的"全选"/"取消选择"共存，或替换该按钮以减少重复

### 4.4 canvas.module.css 改动（如需要）

**位置**: `src/components/canvas/canvas.module.css`

如果 `.dangerButton` 已存在，跳过此步骤。否则新增：

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
}

.dangerButton:hover {
  background: var(--color-danger, #ef4444);
  color: #fff;
}
```

---

## 5. 数据流

```
[用户点击"清空画布"]
        ↓
[window.confirm 弹窗]
    确认 / 取消
        ↓ (确认)
[canvasStore.clearComponentCanvas()]
        ↓
[historyStore.recordSnapshot('component', nodes)] ← 撤销依赖
        ↓
[set({ componentNodes: [] })] ← React 重新渲染
        ↓
[ComponentTree 渲染空状态 .contextTreeEmpty]
```

---

## 6. 边界条件

| 场景 | 预期行为 |
|------|----------|
| `componentNodes.length === 0` | 三个按钮均不显示 |
| 清空后立即按 Ctrl+Z | 恢复所有节点（historyStore 快照） |
| 清空前有多选选中项 | 清空后选中状态自然清除 |
| readonly 模式下 | "清空画布"按钮不显示（已有 `!readonly` 条件） |
| 多窗口同时编辑 | 无特殊处理，依赖 Zustand 单例状态 |

---

## 7. DoD（Done Definition）

### 功能验收（所有条目必须通过）

- [ ] **F001**: 有节点时显示"全选"按钮，点击后所有 checkbox 变为 checked
- [ ] **F001**: `multiSelectControls` 正确切换为"已选 N"模式
- [ ] **F002**: 有选中项时显示"取消全选"按钮，点击后所有 checkbox 取消勾选
- [ ] **F002**: `multiSelectControls` 正确切换回"全选"模式
- [ ] **F003**: 有节点时显示"清空画布"按钮（红色/danger 样式）
- [ ] **F003**: 点击后弹出 confirm 对话框，内容包含"清空画布"
- [ ] **F003**: 确认后画布显示"暂无组件"空状态
- [ ] **F003**: 确认后按 Ctrl+Z 可恢复已清空的节点

### 回归验收（确保不破坏现有功能）

- [ ] AI 生成组件功能正常
- [ ] 重新生成组件树功能正常
- [ ] 手动新增组件功能正常
- [ ] 节点确认功能正常
- [ ] 多选 checkbox 单个勾选/取消正常
- [ ] 框选（drag selection）功能正常
- [ ] Ctrl+Z 撤销功能正常
- [ ] 历史面板正常显示快照

### 代码验收

- [ ] TypeScript 编译通过（`tsc --noEmit`）
- [ ] ESLint 无 error（`eslint src/components/canvas/ComponentTree.tsx src/lib/canvas/canvasStore.ts`）
- [ ] 新增 `clearComponentCanvas` action 已导出
- [ ] CSS 类名符合 BEM 规范（`.dangerButton` 或扩展 `.multiSelectControls`）

---

## 8. 测试策略

### 单元测试（Jest）

```typescript
// src/components/canvas/__tests__/ComponentTreeBulkOps.test.tsx

describe('批量操作工具栏', () => {
  it('F001: 全选按钮在有节点时可见', () => { ... });
  it('F001: 点击全选后所有 checkbox 变为 checked', () => { ... });
  it('F002: 有选中项时显示取消全选按钮', () => { ... });
  it('F002: 点击取消全选后所有 checkbox 取消勾选', () => { ... });
  it('F003: 清空画布按钮在有节点时可见', () => { ... });
  it('F003: 点击清空画布触发 confirm', () => { ... });
  it('F003: confirm 取消后画布不变', () => { ... });
  it('F003: confirm 确认后画布清空', () => { ... });
  it('F003: 清空后可撤销恢复', () => { ... });
  it('边界: 节点为空时三个按钮均不显示', () => { ... });
});
```

### E2E 测试（Playwright）

```typescript
// e2e/canvas-bulk-ops.spec.ts
test('F001+F002+F003: 批量操作完整流程', async ({ page }) => {
  await page.goto('/canvas');
  // Generate some nodes
  await page.click('button:has-text("AI 生成组件")');
  await page.waitForSelector('[data-testid^="component-node-"]');
  // F001
  await page.click('button[aria-label="全选所有组件"]');
  await expect(page.locator('text=/\\d+ 已选/')).toBeVisible();
  // F002
  await page.click('button[aria-label="取消全选所有组件"]');
  await expect(page.locator('button[aria-label="全选所有组件"]')).toBeVisible();
  // F003
  page.on('dialog', dialog => dialog.accept());
  await page.click('button[aria-label="清空画布"]');
  await expect(page.locator('text=暂无组件')).toBeVisible();
  // Undo
  await page.keyboard.press('Control+z');
  await expect(page.locator('[data-testid^="component-node-"]').first()).toBeVisible();
});
```

---

## 9. 排期估算

| 任务 | 估算 |
|------|------|
| canvasStore 新增 `clearComponentCanvas` | 0.5h |
| ComponentTree 新增按钮（F001+F002+F003） | 1h |
| CSS 样式（dangerButton 或扩展） | 0.5h |
| 单元测试 | 1h |
| E2E 测试 | 1h |
| **合计** | **4h** |

---

## 10. 参考文档

- 分析文档: `./analysis.md`
- 现有 `selectAllNodes`: `canvasStore.ts:line ~334`
- 现有 `clearNodeSelection`: `canvasStore.ts:line ~325`
- 现有 `.contextTreeControls`: `canvas.module.css:line 709`
- 现有 `.multiSelectControls`: `canvas.module.css:line 837`
- `historyStore.recordSnapshot`: `historySlice.ts`

---

*PRD 完成时间：2026-03-29 11:25 GMT+8*
