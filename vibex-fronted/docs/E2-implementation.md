# E2 实现方案：CanvasExpandState

## 影响范围

- `src/lib/canvas/canvasStore.ts` — 新增 ExpandState slice
- `src/components/canvas/canvas.module.css` — CSS Variable 动态列宽
- `src/components/canvas/HoverHotzone.tsx` — 新增
- `src/components/canvas/CanvasPage.tsx` — 集成热区和状态

## 实现细节

### 1. canvasStore.ts — ExpandState Slice

```typescript
// PanelExpandState: 三栏展开状态
export type PanelExpandState = 'default' | 'expand-left' | 'expand-right';

// Default widths (fr units)
const DEFAULT_LEFT = 1;
const DEFAULT_CENTER = 1;
const DEFAULT_RIGHT = 1;

// Expanded widths
const EXPANDED_WIDTH = 1.5;
const COLLAPSED_WIDTH = 0;

export interface ExpandSlice {
  leftExpand: PanelExpandState;
  centerExpand: PanelExpandState;
  rightExpand: PanelExpandState;
  // Actions
  setLeftExpand: (state: PanelExpandState) => void;
  setCenterExpand: (state: PanelExpandState) => void;
  setRightExpand: (state: PanelExpandState) => void;
  togglePanel: (panel: 'left' | 'center' | 'right') => void;
  getGridTemplate: () => string;
}

// Grid template computation:
// leftExpand=default → left=1fr
// leftExpand=expand-right → left=1.5fr
// leftExpand=expand-left → left=0fr
// centerExpand=default → center=1fr
// centerExpand=expand-left → center=1.5fr
// centerExpand=expand-right → center=0fr
// rightExpand=default → right=1fr
// rightExpand=expand-right → right=1.5fr
// rightExpand=expand-left → right=0fr
```

### 2. CSS Variables

```css
.treePanelsGrid {
  display: grid;
  /* Use CSS custom properties, set by JS */
  grid-template-columns: var(--grid-left, 1fr) var(--grid-center, 1fr) var(--grid-right, 1fr);
  transition: grid-template-columns 0.3s ease;
}
```

### 3. HoverHotzone.tsx

- 8px 宽悬停区域
- 位于每栏左右边缘
- 悬停时显示展开箭头 SVG
- 双击恢复默认

### 4. CanvasPage.tsx

- 从 store 读取 expand 状态
- 计算 gridTemplate，设置为 CSS 变量
- 在每栏边缘渲染 HoverHotzone
