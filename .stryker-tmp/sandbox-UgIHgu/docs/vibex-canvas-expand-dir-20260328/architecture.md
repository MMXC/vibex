# Architecture: vibex-canvas-expand-dir-20260328

**Project**: 三栏画布展开方向修复（中间面板双向展开）
**Architect**: Architect Agent | **Date**: 2026-03-28 | **Status**: ✅

---

## 1. Tech Stack

| 组件 | 说明 |
|------|------|
| Zustand | canvasStore 扩展 |
| CSS Grid | 动态 grid-template-columns |

---

## 2. Root Cause

`canvasStore.ts` 的 `ExpandDirection` 只支持 `expand-left` | `expand-right`，中间面板无法向两侧展开。

---

## 3. Module Design

### 3.1 ExpandDirection Type Extension

**文件**: `src/lib/canvas/canvasStore.ts`

```typescript
// 扩展方向类型
type PanelSide = 'left' | 'center' | 'right';

interface PanelExpandState {
  leftExpand: 'none' | 'expand-right';
  rightExpand: 'none' | 'expand-left';
  centerExpand: 'none' | 'expand-left' | 'expand-right'; // 新增
  activePanel: PanelSide | null;
}

// Action: toggleCenterPanel
toggleCenterPanel(direction: 'expand-left' | 'expand-right' | 'none'): void
```

### 3.2 CSS Grid Dynamic Columns

```css
/* 中间面板展开时 */
.treePanelsGrid[data-center-expand="expand-left"] {
  grid-template-columns: 1.5fr 1.5fr 0fr; /* 右栏折叠 */
}

.treePanelsGrid[data-center-expand="expand-right"] {
  grid-template-columns: 0fr 1.5fr 1.5fr; /* 左栏折叠 */
}
```

---

## 4. Hotzone Expansion

**文件**: `HoverHotzone.tsx` (修改)

- 中间面板左右边缘均添加热区
- 左热区 → centerExpand = 'expand-left'
- 右热区 → centerExpand = 'expand-right'
- 再次点击 → centerExpand = 'none'（恢复等分）

---

## 5. Implementation Plan

| 任务 | 工时 |
|------|------|
| 扩展 `ExpandDirection` 类型 | 0.5h |
| 实现 `toggleCenterPanel` | 1h |
| CSS Grid 中间展开规则 | 1h |
| 中间面板热区双侧添加 | 1h |
| 最小宽度保护（200px）| 0.5h |
| 动画流畅度验证 | 0.5h |
| **总计** | **~4.5h** |

---

## 6. Key Files

```
src/lib/canvas/canvasStore.ts          [修改]
src/components/canvas/canvas.module.css [修改]
src/components/canvas/HoverHotzone.tsx [修改]
```
