# ADR: vibex-canvas-expand-dir-20260328 架构设计

## Status
Accepted

## Context
三栏画布布局中，中间面板只支持单向展开（expand-left），无法向右侧展开。需扩展 canvasStore 状态支持 expand-both，并修改 CSS grid 实现双向展开。

## Decision

### Tech Stack
- **Framework**: React 19 + TypeScript（现有）
- **State**: Zustand canvasStore（现有）
- **Styling**: CSS Custom Properties + Grid（现有）
- **Test**: Vitest + Testing Library（现有）

### Architecture

```
canvasStore.ts
  │
  ├─ 类型扩展: PanelExpandState += 'expand-both'
  │             centerExpand += 'expand-both'
  │
  ├─ expandDirection 字段: { left, center, right }
  │
  └─ togglePanel(panel, direction?) 签名变更
         │
         ▼
CanvasLayout.tsx
  │
  ├─ 监听 expandDirection.center
  └─ 渲染 data-expand 属性
         │
         ▼
CanvasLayout.css
  │
  └─ CSS grid-template-columns 按 data-expand 动态切换
```

### State Model

```typescript
// src/stores/canvasStore.ts

// 新增 expand-both 状态
type PanelExpandState = 'default' | 'expand-left' | 'expand-right' | 'expand-both';

// 新增 expandDirection 追踪
interface ExpandDirection {
  left: 'left' | 'right' | null;
  center: 'left' | 'right' | 'both' | null;
  right: 'left' | null;
}

interface CanvasState {
  // 修改: centerExpand 增加 'expand-both'
  centerExpand: 'default' | 'expand-left' | 'expand-right' | 'expand-both';
  
  // 新增: 追踪展开方向
  expandDirection: ExpandDirection;
  
  // 新增: 快捷方法
  expandToBoth: () => void;
  
  // 修改: togglePanel 签名
  togglePanel: (panel: 'left' | 'center' | 'right', direction?: 'left' | 'right') => void;
}
```

### CSS Architecture

```css
/* CanvasLayout.css */
.canvas-grid {
  display: grid;
  grid-template-columns: 
    var(--left-panel-width, 1fr) 
    var(--canvas-width, 1fr) 
    var(--right-panel-width, 1fr);
  transition: grid-template-columns 0.3s ease;
  height: 100vh;
}

/* 状态驱动变量切换 */
.canvas-grid[data-expand="default"] {
  --left-panel-width: 1fr;
  --canvas-width: 1fr;
  --right-panel-width: 1fr;
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

.canvas-grid[data-expand="expand-both"] {
  --left-panel-width: 0fr;
  --canvas-width: 3fr;
  --right-panel-width: 0fr;
}
```

### Component Integration

```tsx
// CanvasLayout.tsx
const expand = useCanvasStore(s => s.centerExpand);

return (
  <div 
    className={styles['canvas-grid']}
    data-expand={expand}
  >
    <LeftPanel />
    <CenterCanvas />
    <RightPanel />
  </div>
);

// HoverHotzone.tsx — 中间面板双向热区
<HoverHotzone panel="center" direction="left"  onClick={() => togglePanel('center', 'left')} />
<HoverHotzone panel="center" direction="right" onClick={() => togglePanel('center', 'right')} />
```

### Backward Compatibility
- `togglePanel('center')` 无 direction 参数时 → `expand-both`（默认行为）
- 现有调用 `togglePanel('center')` 无需修改，自动升级为 expand-both

## Consequences

### Positive
- 中间面板获得完整的双向展开能力
- CSS grid 动态变量切换，动画流畅（0.3s ease）
- expandDirection 字段提供调试能力
- 响应式布局断点下可禁用 expand-both

### Risks
- **风险**: expandDirection 与 centerExpand 状态可能不一致 → **缓解**: 始终通过 action 更新两个字段
- **风险**: 移动端 expand-both 体验差 → **缓解**: 响应式断点（< 768px）禁用 expand-both，默认 1fr
- **风险**: 快速连续点击热区导致状态抖动 → **缓解**: 防抖 300ms

## Testing Strategy

| 测试类型 | 工具 | 覆盖点 |
|----------|------|--------|
| 状态机测试 | Vitest | 4种 expand 状态切换 |
| CSS 变量测试 | Jest DOM | grid-template-columns 值 |
| 交互测试 | Testing Library | 热区点击触发展开 |
| 动画测试 | Visual diff | expand-both 平滑过渡 |
| 响应式测试 | Playwright | 移动端禁用验证 |
