# PRD: VibeX Canvas Three-Panel Expand Direction Fix

**Project**: vibex-canvas-expand-dir-20260328  
**Author**: PM  
**Date**: 2026-03-28  
**Status**: Draft  

---

## 1. Executive Summary

### 1.1 Background

VibeX 的三栏画布布局（左侧面板 + 中间画布 + 右侧面板）当前只支持单向展开：
- 左侧面板：点击右边缘 → 向右展开 ✅
- **中间面板：点击左边缘 → 向左展开 ❌（期望：同时支持向右展开）**
- 右侧面板：点击左边缘 → 向左展开 ✅

`canvasStore.ts` 的 `togglePanel` 只定义了 `expand-left` / `expand-right` 两种状态，中间面板无法向两侧展开。

### 1.2 Goal

修复中间面板展开方向，实现三栏面板均支持双向边缘热区展开能力。

### 1.3 Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| 中间面板双向展开覆盖率 | 100% | 交互测试覆盖 |
| 展开动画流畅度 | 0.3s ease, no jank | 视觉验证 |
| 布局恢复一致性 | 双击热区恢复三等分布局 | 回归测试 |
| 代码改动范围 | 仅影响 canvasStore + layout CSS | diff review |

---

## 2. Epic 1: 面板展开方向修复

**Priority**: P0  
**Owner**: Engineering  
**Effort**: 4h  

---

### Feature 1.1: canvasStore 扩展 expand 状态

**File**: `src/stores/canvasStore.ts`

**Current State**:
```typescript
type PanelExpandState = 'default' | 'expand-left' | 'expand-right';
```

**Expected State**:
```typescript
type PanelExpandState = 'default' | 'expand-left' | 'expand-right' | 'expand-both';
```

**Changes**:
1. 扩展 `PanelExpandState` 类型，增加 `expand-both` 枚举值
2. `centerExpand` 字段类型从 `'default' | 'expand-left' | 'expand-right'` 改为 `'default' | 'expand-left' | 'expand-right' | 'expand-both'`
3. 增加 `expandDirection` 字段记录当前展开方向：`{ left: 'left' | 'right' | null, center: 'left' | 'right' | 'both' | null, right: 'left' | null }`

**Acceptance Tests**:
```typescript
// canvasStore.spec.ts
describe('canvasStore panel expand states', () => {
  it('should support expand-both state for center panel', () => {
    const store = createCanvasStore();
    expect(store.centerExpand).toBe('default');
    
    store.expandToBoth();
    expect(store.centerExpand).toBe('expand-both');
  });

  it('should track expand direction separately', () => {
    const store = createCanvasStore();
    store.expandToBoth();
    expect(store.expandDirection.center).toBe('both');
  });
});
```

---

### Feature 1.2: togglePanel 逻辑修改（中间面板 → expand-both）

**File**: `src/stores/canvasStore.ts`

**Current Logic** (`togglePanel` L327-346):
```typescript
togglePanel: (panel) => {
  if (panel === 'center') {
    const { centerExpand } = get();
    if (centerExpand === 'default') {
      set({ centerExpand: 'expand-left' });
    } else {
      set({ centerExpand: 'default' });
    }
  }
}
```

**Expected Logic**:
```typescript
togglePanel: (panel, direction?: 'left' | 'right') => {
  if (panel === 'center') {
    const { centerExpand, expandDirection } = get();
    if (direction === 'left') {
      // 向左展开
      set({ 
        centerExpand: centerExpand === 'expand-left' ? 'default' : 'expand-left',
        expandDirection: { ...expandDirection, center: 'left' }
      });
    } else if (direction === 'right') {
      // 向右展开
      set({ 
        centerExpand: centerExpand === 'expand-right' ? 'default' : 'expand-right',
        expandDirection: { ...expandDirection, center: 'right' }
      });
    } else {
      // 双向展开（默认行为）
      set({ 
        centerExpand: centerExpand === 'expand-both' ? 'default' : 'expand-both',
        expandDirection: { ...expandDirection, center: 'both' }
      });
    }
  }
}
```

**New Method**:
```typescript
expandToBoth: () => {
  set({ 
    centerExpand: 'expand-both',
    expandDirection: { ...get().expandDirection, center: 'both' }
  });
}
```

**Acceptance Tests**:
```typescript
// canvasStore.spec.ts
describe('togglePanel for center panel', () => {
  it('should toggle expand-left when triggered from left edge', () => {
    const store = createCanvasStore();
    store.togglePanel('center', 'left');
    expect(store.centerExpand).toBe('expand-left');
    
    store.togglePanel('center', 'left');
    expect(store.centerExpand).toBe('default');
  });

  it('should toggle expand-right when triggered from right edge', () => {
    const store = createCanvasStore();
    store.togglePanel('center', 'right');
    expect(store.centerExpand).toBe('expand-right');
    
    store.togglePanel('center', 'right');
    expect(store.centerExpand).toBe('default');
  });

  it('should toggle expand-both when triggered without direction', () => {
    const store = createCanvasStore();
    store.togglePanel('center');
    expect(store.centerExpand).toBe('expand-both');
    expect(store.expandDirection.center).toBe('both');
    
    store.togglePanel('center');
    expect(store.centerExpand).toBe('default');
  });
});
```

---

### Feature 1.3: CSS 布局调整（中间展开时占满）

**File**: `src/components/layout/CanvasLayout.css`（或对应样式文件）

**Current Grid**:
```css
.canvas-grid {
  grid-template-columns: var(--left-panel-width, 1fr) 
                        var(--canvas-width, 1fr) 
                        var(--right-panel-width, 1fr);
}
```

**Expected Grid with expand-both**:
```css
.canvas-grid {
  /* expand-both: center takes full width, sides collapse */
  --left-panel-width: 0.1fr;
  --canvas-width: 2.8fr;  /* 3 - 0.1 - 0.1 */
  --right-panel-width: 0.1fr;
  
  /* expand-left: center expands left, right collapses */
  --left-panel-width: 0.1fr;
  --canvas-width: 2.8fr;
  --right-panel-width: 0.1fr;
  
  /* expand-right: center expands right, left collapses */
  --left-panel-width: 0.1fr;
  --canvas-width: 2.8fr;
  --right-panel-width: 0.1fr;
  
  /* default: equal thirds */
  --left-panel-width: 1fr;
  --canvas-width: 1fr;
  --right-panel-width: 1fr;
  
  grid-template-columns: var(--left-panel-width, 1fr) 
                        var(--canvas-width, 1fr) 
                        var(--right-panel-width, 1fr);
  transition: grid-template-columns 0.3s ease;
}
```

**CSS Custom Properties for Each State**:
```css
.canvas-grid[data-expand="expand-both"] {
  --left-panel-width: 0fr;
  --canvas-width: 3fr;
  --right-panel-width: 0fr;
}

.canvas-grid[data-expand="expand-left"] {
  --left-panel-width: 0fr;
  --canvas-width: 2fr;
  --right-panel-width: 1fr;
}

.canvas-grid[data-expand="expand-right"] {
  --left-panel-width: 1fr;
  --canvas-width: 2fr;
  --right-panel-width: 0fr;
}

.canvas-grid[data-expand="default"] {
  --left-panel-width: 1fr;
  --canvas-width: 1fr;
  --right-panel-width: 1fr;
}
```

**Acceptance Tests**:
```typescript
// CanvasLayout.spec.tsx
describe('CanvasLayout grid states', () => {
  it('should render expand-both with center panel full width', () => {
    render(<CanvasLayout expand="expand-both" />);
    const grid = screen.getByTestId('canvas-grid');
    expect(grid).toHaveStyle({ '--canvas-width: 3fr' });
    expect(grid).toHaveStyle({ '--left-panel-width: 0fr' });
    expect(grid).toHaveStyle({ '--right-panel-width: 0fr' });
  });

  it('should animate grid transition', () => {
    render(<CanvasLayout expand="default" />);
    const grid = screen.getByTestId('canvas-grid');
    expect(getComputedStyle(grid).transition).toContain('grid-template-columns');
  });
});
```

---

## 3. Component Integration Map

### 3.1 Affected Components

| Component | File | Change |
|-----------|------|--------|
| `canvasStore` | `src/stores/canvasStore.ts` | 扩展状态 + 新增方法 |
| `HoverHotzone` | `src/components/layout/HoverHotzone.tsx` | 传递 direction prop |
| `CanvasLayout` | `src/components/layout/CanvasLayout.tsx` | 监听 expandDirection |
| `CanvasLayout.css` | `src/components/layout/CanvasLayout.css` | grid-template-columns 变量 |

### 3.2 HoverHotzone Direction Prop

```typescript
// HoverHotzone.tsx
interface HoverHotzoneProps {
  panel: 'left' | 'center' | 'right';
  direction?: 'left' | 'right';  // NEW: for center panel edge distinction
  onClick: () => void;
}

// Usage in CanvasLayout
<HoverHotzone 
  panel="center" 
  direction="left"   // left edge
  onClick={() => canvasStore.togglePanel('center', 'left')}
/>
<HoverHotzone 
  panel="center" 
  direction="right"  // right edge
  onClick={() => canvasStore.togglePanel('center', 'right')}
/>
```

---

## 4. Edge Cases

| Case | Handling |
|------|----------|
| 中间面板已展开时点击另一侧 | 平滑切换展开方向 |
| 快速连续点击热区 | 防抖处理，忽略 300ms 内的重复点击 |
| 响应式布局断点 | 移动端禁用 expand-both，默认三等分 |
| 展开时另一侧已有内容 | grid 动态计算，内容自动适应 |

---

## 5. Out of Scope

- 修改左侧/右侧面板的单向展开行为（已正确）
- 修改其他非面板区域的布局
- 修改面板内容的渲染逻辑

---

## 6. Dependencies

| Dependency | Owner | Status |
|------------|-------|--------|
| canvasStore 测试覆盖 | QA | Pending |
| HoverHotzone 组件 | Frontend | Ready |
| CSS 变量系统 | Frontend | Ready |

---

## 7. File Manifest

```
src/
├── stores/
│   └── canvasStore.ts          [MODIFY] expand state + togglePanel
├── components/
│   └── layout/
│       ├── CanvasLayout.tsx    [MODIFY] integrate expandDirection
│       ├── CanvasLayout.css    [MODIFY] grid-template-columns
│       └── HoverHotzone.tsx    [MODIFY] direction prop
docs/
└── vibex-canvas-expand-dir-20260328/
    ├── analysis.md             [EXISTING]
    ├── prd.md                   [THIS FILE]
    └── specs/                   [EXISTING - DO NOT CREATE]
        └── canvas-expand.spec.ts
```
