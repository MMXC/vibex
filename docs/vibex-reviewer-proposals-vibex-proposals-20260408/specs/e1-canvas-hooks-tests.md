# Spec: Epic E1 — Canvas Hooks 测试补全

## 1. useTreeToolbarActions 测试

```typescript
// tests/unit/hooks/canvas/useTreeToolbarActions.test.ts
describe('useTreeToolbarActions', () => {
  it('returns contextStore for treeType=context', () => {
    const result = renderHook(() => useTreeToolbarActions('context'));
    expect(result.current.store).toBe(contextStore);
  });
  it('returns flowStore for treeType=flow', () => {
    const result = renderHook(() => useTreeToolbarActions('flow'));
    expect(result.current.store).toBe(flowStore);
  });
  it('returns componentStore for treeType=component', () => {
    const result = renderHook(() => useTreeToolbarActions('component'));
    expect(result.current.store).toBe(componentStore);
  });
});
```

## 2. useCanvasPreview 测试

```typescript
// tests/unit/hooks/canvas/useCanvasPreview.test.ts
describe('useCanvasPreview', () => {
  it('canPreview is true when componentNodes > 0', () => {
    mockComponentNodes = [{ id: '1' }];
    const { result } = renderHook(() => useCanvasPreview());
    expect(result.current.canPreview).toBe(true);
  });
  it('canPreview is false when componentNodes is empty', () => {
    mockComponentNodes = [];
    const { result } = renderHook(() => useCanvasPreview());
    expect(result.current.canPreview).toBe(false);
  });
  it('isVisible is not hardcoded false', () => {
    const { result } = renderHook(() => useCanvasPreview());
    expect(result.current.isVisible).not.toBe(false);
  });
});
```

## 3. 验收标准

```bash
pnpm vitest run tests/unit/hooks/canvas/useTreeToolbarActions.test.ts
# 期望: 3 tests, 0 failures

pnpm vitest run tests/unit/hooks/canvas/useCanvasPreview.test.ts
# 期望: 3 tests, 0 failures
```
