# Spec: Epic E2 — 删除按钮绑定

## 1. 三树绑定

```typescript
// CanvasPage.tsx - 三树统一删除处理
const handleDeleteSelected = useCallback((treeType: 'context' | 'flow' | 'component') => {
  if (treeType === 'context') useContextStore.getState().deleteSelectedNodes?.('context');
  if (treeType === 'flow') useFlowStore.getState().deleteSelectedNodes?.();
  if (treeType === 'component') useComponentStore.getState().deleteSelectedNodes?.();
}, []);

// TreeToolbar onDelete
<TreeToolbar onDelete={() => handleDeleteSelected('context')} />
```

## 2. 验收标准

```typescript
// 有选中节点时
expect(screen.getByLabelText('删除')).toBeEnabled();

// 无选中节点时
expect(screen.getByLabelText('删除')).toBeDisabled();

// 删除操作
await userEvent.click(screen.getByLabelText('删除'));
expect(screen.getByText(/确认删除 \d+ 个节点/i)).toBeInTheDocument();
```
