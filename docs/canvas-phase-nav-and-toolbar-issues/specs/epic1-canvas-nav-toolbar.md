# Spec: Epic1 — Canvas 导航与工具栏体验优化

## 影响文件

- `vibex-fronted/src/components/canvas/TabBar.tsx`
- `vibex-fronted/src/components/canvas/PhaseProgressBar.tsx`
- `vibex-fronted/src/components/canvas/PhaseIndicator.tsx`
- `vibex-fronted/src/components/canvas/CanvasPage.tsx`
- `vibex-fronted/src/components/canvas/canvas.module.css`

---

## Spec E1-F1: TabBar 与 PhaseProgressBar 状态同步

### 当前问题
- `TabBar` 使用 `contextStore.activeTree`
- `PhaseProgressBar` 使用 `contextStore.phase`
- 两者字段不同步，导致 Tab 切换后 Phase 导航不更新

### 修改点 1: TabBar 新增 onPhaseChange prop

**文件**: `TabBar.tsx`

```typescript
interface TabBarProps {
  // ... existing props
  onPhaseChange?: (phase: Phase) => void; // 新增
}

const TabBar: React.FC<TabBarProps> = ({ onPhaseChange, onTabChange }) => {
  const { activeTree, setActiveTree } = useContextStore();

  const phaseMap: Record<TreeType, Phase> = {
    context: 'context',
    flow: 'flow',
    component: 'component',
  };

  const handleTabClick = (tabId: TreeType) => {
    setActiveTree(tabId);
    onTabChange?.(tabId);
    
    // 同步更新 phase
    if (phaseMap[tabId]) {
      onPhaseChange?.(phaseMap[tabId]);
    }
  };
```

### 修改点 2: CanvasPage 传递 onPhaseChange

**文件**: `CanvasPage.tsx` (约 L649)

```typescript
<TabBar
  onTabChange={(tab) => setActiveTree(tab)}
  onPhaseChange={(phase) => setPhase(phase)}  // 新增：同步 phase
/>
```

### 验收测试

```typescript
// canvas-nav-sync.spec.ts
describe('TabBar ↔ PhaseProgressBar 同步', () => {
  it('TabBar 切换到 flow，PhaseProgressBar 高亮同步', async () => {
    render(<CanvasPage />);
    
    // 点击 TabBar 的 flow tab
    await userEvent.click(screen.getByTestId('tab-flow'));
    
    // PhaseProgressBar 的 step-flow 应有 active class
    const flowStep = screen.getByTestId('step-flow');
    expect(flowStep).toHaveClass(/phase_active/);
    
    // step-context 不应有 active class
    const contextStep = screen.getByTestId('step-context');
    expect(contextStep).not.toHaveClass(/phase_active/);
  });

  it('TabBar 切换到 component，PhaseProgressBar 高亮同步', async () => {
    render(<CanvasPage />);
    await userEvent.click(screen.getByTestId('tab-component'));
    
    const componentStep = screen.getByTestId('step-component');
    expect(componentStep).toHaveClass(/phase_active/);
  });
});
```

---

## Spec E1-F2: PhaseIndicator 传入 nodeCount

### 当前问题
`CanvasPage.tsx` 调用 `<PhaseIndicator nodeCount={undefined} />` 未传入节点数。

### 修改点

**文件**: `CanvasPage.tsx` (约 L679-681)

```typescript
// 从 canvasStore 获取各树节点数量
const contextNodes = useCanvasStore(s => s.boundedContextTree?.nodes ?? []);
const flowNodes = useCanvasStore(s => s.businessFlowTree?.nodes ?? []);
const componentNodes = useCanvasStore(s => s.componentTree?.nodes ?? []);

<PhaseIndicator
  phase={phase}
  onPhaseChange={setPhase}
  nodeCount={
    phase === 'context' ? contextNodes.length :
    phase === 'flow' ? flowNodes.length :
    phase === 'component' ? componentNodes.length :
    undefined
  }
/>
```

### PhaseIndicator 组件确认

确认 `PhaseIndicator.tsx` 已支持 nodeCount prop 显示：

```typescript
interface PhaseIndicatorProps {
  phase: Phase;
  onPhaseChange?: (phase: Phase) => void;
  nodeCount?: number;  // 新增
}

// 渲染逻辑应包含 nodeCount 显示
<span data-testid="phase-indicator">
  {phase === 'context' && `◇ 上下文 (${nodeCount ?? 0} 节点)`}
  {phase === 'flow' && `◆ 流程 (${nodeCount ?? 0} 步骤)`}
  {phase === 'component' && `■ 组件 (${nodeCount ?? 0} 节点)`}
</span>
```

### 验收测试

```typescript
it('PhaseIndicator 显示 context phase 节点数', async () => {
  render(<CanvasPage />);
  
  const indicator = screen.getByTestId('phase-indicator');
  // 应包含 "上下文" 和数字
  expect(indicator.textContent).toMatch(/上下文.*\d+.*节点/);
});

it('PhaseIndicator 在 flow phase 显示流程步骤数', async () => {
  render(<CanvasPage />);
  await userEvent.click(screen.getByTestId('step-flow'));
  
  const indicator = screen.getByTestId('phase-indicator');
  expect(indicator.textContent).toMatch(/流程.*\d+.*步骤/);
});
```

---

## Spec E1-F3: 工具栏按钮点击区域 ≥44px

### 当前问题
`.toolbarButton { min-height: 32px }` 不符合 iOS 可访问性标准。

### 修改点

**文件**: `canvas.module.css`

```css
/* 工具栏按钮最小高度 */
.toolbarButton,
.zoomBtn {
  min-height: 44px !important;
  min-width: 44px !important;
  padding: 10px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Tab 按钮移动端优化 */
@media (max-width: 768px) {
  .tab {
    padding: 10px 16px;
    min-height: 44px;
  }
  
  .toolbarButton {
    min-height: 44px;
    min-width: 44px;
  }
}
```

### 验收测试

```typescript
it('undo 按钮高度 >= 44px', async () => {
  const undoBtn = screen.getByTestId('undo-btn');
  const box = await undoBtn.boundingBox();
  expect(box.height).toBeGreaterThanOrEqual(44);
  expect(box.width).toBeGreaterThanOrEqual(44);
});

it('移动端 undo 按钮高度 >= 44px', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  const undoBtn = page.locator('[data-testid="undo-btn"]');
  const box = await undoBtn.boundingBox();
  expect(box.height).toBeGreaterThanOrEqual(44);
});
```

---

## Spec E1-F4: Phase 切换动画反馈

### 当前问题
点击 PhaseProgressBar 无视觉反馈，用户不确定是否点击成功。

### 修改点

**文件**: `canvas.module.css`

```css
/* Phase 按钮过渡动画 */
.phaseItem {
  transition: all 0.2s ease-out;
  cursor: pointer;
  border-radius: 6px;
  padding: 8px 16px;
}

.phaseItem:active {
  transform: scale(0.95);
  background: rgba(99, 179, 237, 0.3);
}

/* Active 状态高亮 */
.phaseActive {
  background: rgba(59, 130, 246, 0.15);
  border: 1.5px solid rgba(59, 130, 246, 0.5);
}

/* Tab 切换动画 */
.tabItem {
  transition: all 0.15s ease-out;
}

.tabItem:active {
  transform: scale(0.96);
}
```

**文件**: `PhaseProgressBar.tsx`

```tsx
// 添加 data-testid 给每个 step
<div
  data-testid={`step-${phase.key}`}
  className={cn('phaseItem', { 'phaseActive': phase.key === currentPhase })}
  onClick={isClickable ? () => onPhaseClick?.(phase.key) : undefined}
>
```

### 验收测试

```typescript
it('Phase 按钮点击时有 scale(0.95) 按压动画', async () => {
  const contextStep = screen.getByTestId('step-context');
  
  // mousedown 时 scale 缩小
  await contextStep.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
  expect(contextStep).toHaveStyle({ transform: 'scale(0.95)' });
  
  // mouseup 后恢复
  await contextStep.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
  await waitFor(() => {
    expect(contextStep).toHaveStyle({ transform: 'scale(1)' });
  });
});

it('Phase 按钮有 transition 过渡', async () => {
  const contextStep = screen.getByTestId('step-context');
  const transition = await contextStep.evaluate(
    el => window.getComputedStyle(el).transition
  );
  // transition 不应为 none
  expect(transition.split(' ')[0]).not.toBe('0');
});
```

---

## 工时汇总

| 功能 | 工时 | 风险 |
|------|------|------|
| E1-F1 TabBar 同步 | 1h | 低 |
| E1-F2 nodeCount 传入 | 0.5h | 低 |
| E1-F3 点击区域 | 0.5h | 低 |
| E1-F4 切换动画 | 0.5h | 低 |
| **总计** | **2.5h** | — |

---

## 测试文件清单

- `vibex-fronted/tests/e2e/canvas-nav-sync.spec.ts` — E1-F1
- `vibex-fronted/tests/e2e/canvas-phase-indicator.spec.ts` — E1-F2
- `vibex-fronted/tests/e2e/canvas-toolbar-accessibility.spec.ts` — E1-F3
- `vibex-fronted/tests/e2e/canvas-phase-animation.spec.ts` — E1-F4
