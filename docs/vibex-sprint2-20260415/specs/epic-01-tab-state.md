# Spec: Epic 1 — Tab State 残留修复

**Epic ID**: E1
**优先级**: P1
**工时**: 1h
**负责人**: Frontend Dev

---

## 1. Overview

用户切换 Canvas tab 时，phase 状态未重置，导致 Prototype accordion 在离开 tab 后仍保持展开状态。

## 2. Technical Approach

**方案一（推荐）**：useEffect 扩展

```typescript
// CanvasPage.tsx
useEffect(() => {
  resetPanelState();
  setPhase('input'); // 新增：重置 phase，关闭 prototype accordion
}, [activeTab, resetPanelState]);
```

## 3. Acceptance Criteria

```typescript
// E1-S1
describe('Tab State Reset', () => {
  it('should reset phase to input when switching from prototype to context', () => {
    const { result } = renderHook(() => ({
      phase: useCanvasStore(s => s.phase),
      setPhase: useCanvasStore(s => s.setPhase),
    }))
    act(() => { result.current.setPhase('prototype') })
    expect(result.current.phase).toBe('prototype')
    act(() => { result.current.setPhase('input') }) // 模拟 tab 切换
    expect(result.current.phase).toBe('input')
  })

  it('should close prototype accordion when leaving prototype tab', () => {
    // UI 测试：验证 accordion 在 phase !== 'prototype' 时关闭
    const { getByTestId } = render(<CanvasPage />)
    fireEvent.click(getByTestId('tab-prototype'))
    expect(getByTestId('prototype-accordion')).toBeVisible()
    fireEvent.click(getByTestId('tab-context'))
    expect(getByTestId('prototype-accordion')).not.toBeVisible()
  })
})

// E1-S2: 回归测试
it('should not regress other tab behaviors', () => {
  const { getByTestId } = render(<CanvasPage />)
  fireEvent.click(getByTestId('tab-flow'))
  expect(getByTestId('flow-canvas')).toBeVisible()
  fireEvent.click(getByTestId('tab-context'))
  expect(getByTestId('context-tree')).toBeVisible()
})
```

## 4. File Changes

```
Modified:
  vibex-frontend/src/pages/CanvasPage.tsx  (useEffect 中添加 setPhase('input'))
```

## 5. DoD

- [ ] E1-S1 验收标准通过
- [ ] E1-S2 回归测试通过
- [ ] useCanvasRenderer 测试套件全通过
- [ ] Code review 通过
