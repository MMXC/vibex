# Spec: E2 - Phase 2 uiStore 独立

## 1. 概述

**工时**: 4 天（dev）+ 0.5 天（reviewer）| **优先级**: P0
**依赖**: E1（无隐式依赖，可并行）

## 2. 提取内容

```typescript
// uiStore.ts (~280 行)
interface UIState {
  // Panels
  contextPanelCollapsed: boolean;
  flowPanelCollapsed: boolean;
  componentPanelCollapsed: boolean;
  // Drawers
  leftDrawerOpen: boolean;
  rightDrawerOpen: boolean;
  // Selection
  selectedNodeIds: Set<string>;
  // Drag
  isDragging: boolean;
  draggedNodeId: string | null;
  // Expand
  gridTemplate: string;
}

interface UIActions {
  setContextPanelCollapsed: (collapsed: boolean) => void;
  toggleLeftDrawer: () => void;
  toggleRightDrawer: () => void;
  setSelectedNodeIds: (ids: Set<string>) => void;
  toggleNodeSelect: (nodeId: string) => void;
  // ...
}
```

## 3. 组件更新

需更新的组件（约 20 个）：
- `ProjectBar.tsx`
- `TreePanel.tsx`
- `CardTreeRenderer.tsx`
- `CanvasToolbar.tsx`
- `LeftDrawer.tsx`
- `RightDrawer.tsx`
- 等

## 4. 验收标准

| ID | Given | When | Then |
|----|-------|------|------|
| E2-AC1 | 检查文件 | wc -l uiStore.ts | ≤ 280 行 |
| E2-AC2 | 面板操作 | collapse/expand | 动画正常 |
| E2-AC3 | 拖拽 | 节点拖拽 | 无卡顿 |
| E2-AC4 | Drawer | 左右抽屉开关 | 正常显示 |
| E2-AC5 | 测试覆盖 | vitest --coverage uiStore | ≥ 80% |

## 5. DoD

- [ ] uiStore.ts 存在且 ≤ 280 行
- [ ] 面板折叠/展开正常
- [ ] 拖拽功能正常
- [ ] 抽屉开关正常
- [ ] ~20 个组件渲染正常
- [ ] uiStore.test.ts 覆盖率 ≥ 80%
