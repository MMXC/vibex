# Spec: Epic1 — TreeToolbar 集成到 TreePanel Header

## 影响文件
- `vibex-fronted/src/components/canvas/TreePanel.tsx`
- `vibex-fronted/src/components/canvas/TreeToolbar.tsx`
- `vibex-fronted/src/hooks/canvas/useTreeToolbarActions.ts`（新建）
- `vibex-fronted/src/app/canvas/CanvasPage.tsx`
- `vibex-fronted/src/components/canvas/canvas.module.css`

---

## Spec E1-F1: TreePanel 新增 headerActions slot

### 接口变更

**文件**: `TreePanel.tsx`

```typescript
interface TreePanelProps {
  // ... existing props
  /** 自定义操作按钮（渲染在面板 body 内） */
  actions?: React.ReactNode;
  /** 头部操作按钮（渲染在 header 右侧）【新增】 */
  headerActions?: React.ReactNode;
  /** 点击 MiniMap 节点时滚动到对应节点 */
  onNodeClick?: (nodeId: string) => void;
}
```

### 渲染逻辑

```tsx
<div data-testid={`tree-panel-${tree}`} className={styles.treePanel}>
  {/* Header */}
  <div
    data-testid={`tree-panel-header-${tree}`}
    className={styles.treePanelHeader}
    onClick={onToggleCollapse}
    role="button"
    aria-expanded={!collapsed}
  >
    <span data-testid={`tree-panel-icon-${tree}`} className={styles.treePanelIcon}>
      {TREE_ICONS[tree]}
    </span>
    <span className={styles.treePanelTitle}>{title}</span>
    <span className={styles.treePanelBadge}>{safeNodes.length} 个节点</span>
    
    {/* Header Actions【新增】 */}
    {!collapsed && headerActions && (
      <div
        data-testid={`tree-panel-header-actions`}
        className={styles.treePanelHeaderActions}
        onClick={(e) => e.stopPropagation()}  // 阻止冒泡到 Header 折叠
      >
        {headerActions}
      </div>
    )}
    
    <span
      data-testid={`tree-panel-toggle-${tree}`}
      className={styles.treePanelChevron}
    >
      {collapsed ? '▶' : '▼'}
    </span>
  </div>

  {/* Body */}
  {!collapsed && (
    <div
      data-testid={`tree-panel-body-${tree}`}
      ref={panelBodyRef}
      className={styles.treePanelBody}
    >
      {actions && (
        <div className={styles.treePanelActions}>
          {actions}
        </div>
      )}
      {children}
    </div>
  )}
</div>
```

### CSS

```css
.treePanelHeader {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  cursor: pointer;
  background: #f8f9fa;
  border-bottom: 1px solid #e5e7eb;
  position: relative;
}

.treePanelHeaderActions {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
  padding-right: 8px;
}

.treePanelHeaderActions button {
  padding: 4px 8px;
  font-size: 12px;
  min-height: 32px;
  min-width: 32px;
}
```

### 验收测试

```typescript
// tree-panel-header-actions.spec.ts
it('headerActions renders in header when panel is expanded', async () => {
  render(
    <TreePanel
      tree="context"
      title="上下文"
      nodes={[]}
      collapsed={false}
      isActive={true}
      onToggleCollapse={() => {}}
      headerActions={<button>全选</button>}
    />
  );
  
  const header = screen.getByTestId('tree-panel-header-context');
  const actions = within(header).getByTestId('tree-panel-header-actions');
  expect(actions).toBeVisible();
  expect(within(actions).getByRole('button', { name: '全选' })).toBeVisible();
});

it('headerActions hidden when panel is collapsed', async () => {
  render(
    <TreePanel
      tree="context"
      title="上下文"
      nodes={[]}
      collapsed={true}
      isActive={true}
      onToggleCollapse={() => {}}
      headerActions={<button>全选</button>}
    />
  );
  
  expect(screen.queryByTestId('tree-panel-header-actions')).not.toBeInTheDocument();
});
```

---

## Spec E1-F2: useTreeToolbarActions hook

### 实现

**文件**: `vibex-fronted/src/hooks/canvas/useTreeToolbarActions.ts`（新建）

```typescript
import { useCallback } from 'react';
import { useContextStore } from '@/stores/contextStore';
import { useCanvasStore } from '@/stores/canvasStore';
import type { TreeType } from '@/lib/canvas/types';

/**
 * 复用三树工具栏的事件绑定逻辑
 */
export function useTreeToolbarActions(treeType: TreeType) {
  return useCallback(() => {
    const store = useContextStore.getState();

    const onSelectAll = () => {
      store.selectAllNodes?.(treeType);
    };

    const onDeselectAll = () => {
      store.deselectAllNodes?.(treeType);
    };

    const onClear = () => {
      if (treeType === 'context') {
        useCanvasStore.getState().setContextNodes([]);
      } else if (treeType === 'flow') {
        useCanvasStore.getState().setFlowNodes([]);
      } else if (treeType === 'component') {
        useCanvasStore.getState().setComponentNodes([]);
      }
    };

    // onContinue 只在 context 树可用
    const onContinue = treeType === 'context'
      ? () => { /* trigger flow generation */ }
      : undefined;

    return { onSelectAll, onDeselectAll, onClear, onContinue };
  }, [treeType])();
}
```

### 验收测试

```typescript
// useTreeToolbarActions.spec.ts
import { renderHook } from '@testing-library/react';
import { useTreeToolbarActions } from '@/hooks/canvas/useTreeToolbarActions';

describe('useTreeToolbarActions', () => {
  it('returns 4 action functions for context tree', () => {
    const { result } = renderHook(() => useTreeToolbarActions('context'));
    expect(typeof result.current.onSelectAll).toBe('function');
    expect(typeof result.current.onDeselectAll).toBe('function');
    expect(typeof result.current.onClear).toBe('function');
    expect(typeof result.current.onContinue).toBe('function');  // context 有 continue
  });

  it('onContinue is undefined for flow tree', () => {
    const { result } = renderHook(() => useTreeToolbarActions('flow'));
    expect(result.current.onContinue).toBeUndefined();
  });

  it('onClear empties context nodes', () => {
    const { result } = renderHook(() => useTreeToolbarActions('context'));
    result.current.onClear();
    expect(useCanvasStore.getState().contextNodes).toEqual([]);
  });
});
```

---

## Spec E1-F3: CanvasPage 三处调用迁移

### 迁移前（当前）

```tsx
<TreePanel
  tree="context"
  // ...
  actions={
    <TreeToolbar
      treeType="context"
      nodeCount={contextNodes.length}
      onSelectAll={() => useContextStore.getState().selectAllNodes?.('context')}
      onDeselectAll={() => useContextStore.getState().deselectAllNodes?.('context')}
      onClear={() => useCanvasStore.getState().setContextNodes([])}
      onContinue={handleContextContinue}
    />
  }
>
```

### 迁移后

```tsx
const contextActions = useTreeToolbarActions('context');

<TreePanel
  tree="context"
  // ...
  headerActions={
    <TreeToolbar
      treeType="context"
      nodeCount={contextNodes.length}
      {...contextActions}
      onContinue={handleContextContinue}
    />
  }
>
```

### 验收测试

```typescript
// canvas-toolbar-consolidation.spec.ts
it('context tree header shows toolbar buttons', async () => {
  await page.goto('/canvas');
  
  const contextHeader = screen.getByTestId('tree-panel-header-context');
  const actions = within(contextHeader).getByTestId('tree-panel-header-actions');
  
  expect(within(actions).getByRole('button', { name: /全选/ })).toBeVisible();
  expect(within(actions).getByRole('button', { name: /取消/ })).toBeVisible();
  expect(within(actions).getByRole('button', { name: /清空/ })).toBeVisible();
  expect(within(actions).getByRole('button', { name: /继续/ })).toBeVisible();
});

it('flow tree header has no continue button', async () => {
  const flowHeader = screen.getByTestId('tree-panel-header-flow');
  const flowActions = within(flowHeader).getByTestId('tree-panel-header-actions');
  
  expect(within(flowActions).getByRole('button', { name: /全选/ })).toBeVisible();
  expect(within(flowActions).queryByRole('button', { name: /继续/ })).not.toBeInTheDocument();
});

it('toolbar buttons in header are functional', async () => {
  const contextHeader = screen.getByTestId('tree-panel-header-context');
  const actions = within(contextHeader).getByTestId('tree-panel-header-actions');
  
  // 全选
  await userEvent.click(within(actions).getByRole('button', { name: /全选/ }));
  const selected = useContextStore.getState().contextNodes.filter(n => n.isActive);
  expect(selected.length).toBeGreaterThan(0);
  
  // 清空
  await userEvent.click(within(actions).getByRole('button', { name: /清空/ }));
  expect(useCanvasStore.getState().contextNodes.length).toBe(0);
});
```

---

## Spec E1-F4: 样式调整

### CSS 修改

```css
/* Header 工具栏按钮尺寸 */
.treePanelHeaderActions button {
  padding: 4px 8px;
  min-height: 36px;
  min-width: 36px;
  font-size: 12px;
  border-radius: 4px;
  border: 1px solid #d1d5db;
  background: #fff;
  cursor: pointer;
  transition: all 0.15s ease;
}

.treePanelHeaderActions button:active {
  transform: scale(0.95);
  background: #f3f4f6;
}

.treePanelHeaderActions button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 移动端折叠菜单 */
@media (max-width: 768px) {
  .treePanelHeaderActions {
    display: none;  /* 默认隐藏，用折叠菜单替代 */
  }
  
  .treePanelMoreActions {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 36px;
    min-height: 36px;
    margin-left: auto;
    padding: 4px;
    background: #fff;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .treePanelMoreMenu {
    position: absolute;
    top: 100%;
    right: 0;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    z-index: 100;
    min-width: 120px;
  }
}
```

---

## 工时汇总

| 功能 | 工时 | 风险 |
|------|------|------|
| E1-F1 headerActions slot | 1h | 低 |
| E1-F2 useTreeToolbarActions hook | 1h | 低 |
| E1-F3 三树迁移 | 1.5h | 低 |
| E1-F4 样式调整 | 0.5h | 低 |
| **总计** | **4h** | — |

---

## 测试文件清单

- `vibex-fronted/tests/e2e/tree-panel-header-actions.spec.ts` — E1-F1
- `vibex-fronted/tests/unit/useTreeToolbarActions.spec.ts` — E1-F2
- `vibex-fronted/tests/e2e/canvas-toolbar-consolidation.spec.ts` — E1-F3
- `vibex-fronted/tests/e2e/canvas-toolbar-responsive.spec.ts` — E1-F4
