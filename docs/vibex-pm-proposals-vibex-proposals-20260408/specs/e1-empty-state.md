# Spec: Epic E1 — 组件生成空数据兜底

## 1. flowId 空值校验

```typescript
// CanvasPage.tsx
const isContinueDisabled = !selectedFlowIds || selectedFlowIds.length === 0 || !flowId;

<Button
  disabled={isContinueDisabled}
  onClick={handleContinueToComponents}
>
  继续·组件树
</Button>
```

## 2. EmptyState 组件

```typescript
// handleContinueToComponents 中
if (!result.success || !result.components || result.components.length === 0) {
  toast.error('组件生成失败，请重试');
  return;
}
```

## 3. 验收标准

```typescript
expect(screen.getByRole('button', { name: /继续·组件树/i })).toBeDisabled();
expect(screen.getByText(/组件生成失败/i)).toBeInTheDocument();
expect(screen.getByRole('button', { name: /重试/i })).toBeInTheDocument();
```
