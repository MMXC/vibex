# SPEC: E2 — TreeToolbar 删除按钮全绑定

**Epic:** E2 — P0 止血：核心交互  
**Stories:** S2.1, S2.2, S2.3, S2.4  
**Owner:** dev  
**Estimated:** 1h

---

## 1. 概述

三树（Context Tree / Flow Tree / Component Tree）的 `TreeToolbar` 组件均有删除按钮，但仅 Flow Tree 正确绑定了 `onDelete`。本 Epic 将 `onDelete` 绑定补全至 Context Tree 和 Component Tree，并添加确认对话框。

---

## 2. 现状分析

Git history `canvas-button-consolidation` commit 添加了 TreeToolbar 的 `onDelete` / `onReset` 按钮，但绑定仅在 Flow Tree 实现。

**目标文件:**
- `src/components/BoundedContextTree/index.tsx` — `onDelete` 缺失
- `src/components/ComponentTree/index.tsx` — `onDelete` 缺失
- `src/components/BusinessFlowTree/index.tsx` — 已正确绑定（参考实现）

---

## 3. Story S2.1: BoundedContextTree onDelete 绑定

### 3.1 实现方案

**文件:** `src/components/BoundedContextTree/index.tsx`

```typescript
import { useContextStore } from '@/stores/contextStore';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';

// TreeToolbar props
const selectedCount = useContextStore((s) => s.selectedNodeIds?.length ?? 0);
const deleteSelectedNodes = useContextStore((s) => s.deleteSelectedNodes);

// 删除处理
const handleDelete = useCallback(() => {
  if (selectedCount === 0) return;
  setShowDeleteConfirm(true);
}, [selectedCount]);

const confirmDelete = useCallback(() => {
  deleteSelectedNodes?.('context');
  setShowDeleteConfirm(false);
}, [deleteSelectedNodes]);

// JSX
<TreeToolbar
  title="限界上下文"
  onDelete={handleDelete}
  deleteDisabled={selectedCount === 0}
/>

{showDeleteConfirm && (
  <ConfirmDialog
    open={showDeleteConfirm}
    title="确认删除"
    message={`确认删除 ${selectedCount} 个上下文节点？`}
    confirmLabel="确认"
    cancelLabel="取消"
    onConfirm={confirmDelete}
    onCancel={() => setShowDeleteConfirm(false)}
  />
)}
```

### 3.2 验收标准

```typescript
// S2.1
fireEvent.click(screen.getByTestId('context-tree-node').firstChild); // 选中节点
expect(screen.getByTestId('tree-toolbar-delete-btn')).toBeEnabled();

fireEvent.click(screen.getByTestId('tree-toolbar-delete-btn'));
expect(screen.getByText('确认删除 1 个上下文节点？')).toBeInTheDocument();

fireEvent.click(screen.getByText('确认'));
expect(screen.queryByText('确认删除 1 个上下文节点？')).not.toBeInTheDocument();
```

---

## 4. Story S2.2: ComponentTree onDelete 绑定

### 4.1 实现方案

**文件:** `src/components/ComponentTree/index.tsx`

```typescript
const selectedCount = useComponentStore((s) => s.selectedNodeIds?.length ?? 0);
const deleteSelectedNodes = useComponentStore((s) => s.deleteSelectedNodes);

const handleDelete = useCallback(() => {
  if (selectedCount === 0) return;
  setShowDeleteConfirm(true);
}, [selectedCount]);

const confirmDelete = useCallback(() => {
  deleteSelectedNodes?.();
  setShowDeleteConfirm(false);
  // 同步触发 snapshot
  useSnapshotStore.getState().recordSnapshot({ type: 'component_delete', count: selectedCount });
}, [deleteSelectedNodes, selectedCount]);
```

### 4.2 验收标准

```typescript
// S2.2
fireEvent.click(screen.getByTestId('component-tree-node').firstChild);
fireEvent.click(screen.getByTestId('tree-toolbar-delete-btn'));
expect(screen.getByText('确认删除 1 个组件节点？')).toBeInTheDocument();

fireEvent.click(screen.getByText('确认'));
expect(screen.queryByText('组件节点')).toBeNull(); // 节点已删除
```

---

## 5. Story S2.3: 无选中时按钮禁用

### 5.1 实现方案

所有 TreeToolbar 实例的删除按钮均依赖 `selectedCount === 0` 判断：

```typescript
<TreeToolbar
  onDelete={handleDelete}
  deleteDisabled={selectedCount === 0}
/>
```

### 5.2 验收标准

```typescript
// 三个树均验证
expect(screen.getByTestId('context-tree-toolbar-delete')).toBeDisabled();
expect(screen.getByTestId('flow-tree-toolbar-delete')).toBeDisabled();
expect(screen.getByTestId('component-tree-toolbar-delete')).toBeDisabled();
```

---

## 6. Story S2.4: E2E 验证删除链路

### 6.1 测试文件

**文件:** `e2e/canvas/tree-toolbar-delete.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('TreeToolbar Delete', () => {
  test('Context Tree: delete selected nodes with confirmation', async ({ page }) => {
    await page.goto('/canvas');
    // 选中 2 个 Context 节点
    await page.click('[data-testid="context-tree-node"]:nth-child(1)');
    await page.click('[data-testid="context-tree-node"]:nth-child(2)', { modifiers: ['Shift'] });
    // 点击删除
    await page.click('[data-testid="context-tree-toolbar-delete"]');
    // 确认对话框出现
    await expect(page.getByText('确认删除 2 个上下文节点？')).toBeVisible();
    await page.click('[data-testid="confirm-dialog-confirm"]');
    // 节点消失
    await expect(page.getByText('确认删除 2 个上下文节点？')).not.toBeVisible();
  });

  test('Component Tree: delete selected nodes with confirmation', async ({ page }) => {
    await page.goto('/canvas');
    // 进入组件树阶段（先完成 context + flow）
    await generateContextTree(page);
    await generateFlowTree(page);
    await page.click('[data-testid="continue-to-components-btn"]');
    // 选中组件节点
    await page.click('[data-testid="component-tree-node"]:nth-child(1)');
    await page.click('[data-testid="component-tree-toolbar-delete"]');
    await expect(page.getByText('确认删除 1 个组件节点？')).toBeVisible();
    await page.click('[data-testid="confirm-dialog-confirm"]');
  });

  test('All trees: delete button disabled when no selection', async ({ page }) => {
    await page.goto('/canvas');
    await expect(page.getByTestId('context-tree-toolbar-delete')).toBeDisabled();
    await expect(page.getByTestId('flow-tree-toolbar-delete')).toBeDisabled();
    await expect(page.getByTestId('component-tree-toolbar-delete')).toBeDisabled();
  });
});
```

---

## 7. 依赖与风险

| 项目 | 说明 |
|------|------|
| 依赖 | `ConfirmDialog` 组件（需确认已存在）；`deleteSelectedNodes` 方法签名需验证 |
| 风险 | Context Store 的 `deleteSelectedNodes` 可能签名不一致（需传 `treeType` 参数）|
| 回滚方案 | 注释掉 `onDelete` prop，降级为删除按钮不响应 |

---

## 8. ConfirmDialog 组件规格

**文件:** `src/components/common/ConfirmDialog/index.tsx`

Props:
```typescript
interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  destructive?: boolean; // 破坏性操作用红色确认按钮
}
```

- `open=true` 时渲染 Portal（body）
- 背景遮罩 `rgba(0,0,0,0.4)`
- 确认按钮：默认蓝色，`destructive=true` 时红色
- 键盘: Esc 触发 `onCancel`，Enter 触发 `onConfirm`
