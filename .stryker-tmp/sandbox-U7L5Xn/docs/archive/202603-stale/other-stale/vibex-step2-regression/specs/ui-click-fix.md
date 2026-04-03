# Spec: UI 组件点击修复 (Epic 1)

## ST-01: UI组件点击响应

### 验收标准

```typescript
// ComponentAnalysis.spec.tsx
expect(screen.getByRole('button', {name: /component.*analysis/i})).not.toBeDisabled();
expect(screen.getByRole('button', {name: /component.*analysis/i})).toHaveAttribute('data-state', 'enabled');
```

### 实现要点

1. 检查按钮是否有 `disabled` 属性
2. 确认 `onClick` handler 已绑定
3. 验证点击后状态变更

### 页面集成

- **文件**: `vibex-fronted/src/components/ComponentAnalysis.tsx`
- **测试文件**: `vibex-fronted/src/__tests__/ComponentAnalysis.spec.tsx`

---

## ST-02: 点击事件绑定验证

### 验收标准

```typescript
const mockHandler = jest.fn();
render(<ComponentAnalysis onClick={mockHandler} />);
fireEvent.click(screen.getByRole('button'));
expect(mockHandler).toHaveBeenCalledTimes(1);
expect(mockHandler).toHaveBeenCalledWith(expect.objectContaining({type: 'ANALYZE_COMPONENTS'}));
```

### DoD

- [ ] 事件监听器已正确绑定
- [ ] 事件处理函数被调用
- [ ] 单元测试覆盖
