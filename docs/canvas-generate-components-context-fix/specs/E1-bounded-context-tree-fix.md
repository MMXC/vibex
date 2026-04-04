# E1: BoundedContextTree checkbox 修复 - 详细规格

## S1.1 checkbox onChange 修复

### 目标
修复 `BoundedContextTree.tsx` checkbox 的 `onChange`，调用 `onToggleSelect` 而非 `toggleContextNode`。

### 现状问题
```tsx
// BoundedContextTree.tsx - 问题代码（约第 233 行）
<Checkbox
  checked={isSelected}
  onChange={() => {
    toggleContextNode(node.nodeId); // ❌ 调用确认函数
  }}
/>
```

### 实施方案
```tsx
// BoundedContextTree.tsx - 修复后
<Checkbox
  checked={isSelected}
  onChange={() => {
    onToggleSelect?.(node.nodeId); // ✅ 调用多选函数
  }}
/>
```

### 验收断言
```typescript
// __tests__/BoundedContextTree.test.tsx

describe('Context checkbox selection', () => {
  it('should call onToggleSelect when checkbox is clicked', async () => {
    const onToggleSelect = vi.fn();
    renderWithStore(
      <BoundedContextTree onToggleSelect={onToggleSelect} />
    );
    
    const checkbox = screen.getByRole('checkbox');
    await userEvent.click(checkbox);
    
    expect(onToggleSelect).toHaveBeenCalledWith(node.nodeId);
  });

  it('should NOT call toggleContextNode', async () => {
    const toggleContextNode = vi.fn();
    renderWithStore(
      <BoundedContextTree toggleContextNode={toggleContextNode} />
    );
    
    const checkbox = screen.getByRole('checkbox');
    await userEvent.click(checkbox);
    
    expect(toggleContextNode).not.toHaveBeenCalled();
  });

  it('should update selectedNodeIds when checkbox is clicked', async () => {
    const { result } = renderHook(() => useContextStore());
    
    renderWithStore(
      <BoundedContextTree onToggleSelect={(id) => {
        result.current.onToggleSelect(id);
      }} />
    );
    
    const checkbox = screen.getByRole('checkbox');
    await userEvent.click(checkbox);
    
    expect(result.current.selectedNodeIds.context).toContain(node.nodeId);
  });
});
```

### DoD Checklist
- [ ] `BoundedContextTree.tsx` checkbox `onChange` 改为 `onToggleSelect`
- [ ] jest 测试通过
- [ ] 手动测试验证 checkbox 选择功能
- [ ] 与 BusinessFlowTree checkbox 行为一致
