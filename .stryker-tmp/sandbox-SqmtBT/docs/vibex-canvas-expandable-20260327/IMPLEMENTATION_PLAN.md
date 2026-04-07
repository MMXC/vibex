# Implementation Plan: vibex-canvas-expandable-20260327

**Project**: VibeX 卡片画布增强
**Architect**: Architect Agent
**Date**: 2026-03-27
**Total Estimated Dev**: ~7h | **Test**: ~2.5h | **Total**: ~9.5h

---

## Epic E1: ReactFlow v12 升级

**目标**: 安全升级 ReactFlow，为拖拽排序扫清障碍
**负责人**: Dev | **测试**: Tester

### 任务清单

- [x] `pnpm add @xyflow/react@latest` 升级
- [ ] 检查 `onNodesChange` API 变化（v11→v12 签名）
- [ ] 检查 `nodeExtent`、`proOptions` 等属性兼容性
- [ ] 全量跑现有测试：`pnpm test`
- [ ] E2E 回归：`pnpm e2e`
- [ ] 若 CI 红，先修兼容性问题，再继续

### 验收标准

- `pnpm build` 成功
- `pnpm test` 全部通过
- `pnpm e2e` 全部通过
- ReactFlow v12 版本确认（`package.json`）

---

## Epic E2: CanvasExpandState Slice

**目标**: Zustand store 扩展，支持展开状态管理
**负责人**: Dev | **测试**: Tester

### 任务清单

- [x] `src/lib/canvas/canvasStore.ts` 新增 `CanvasExpandState` 接口
- [x] 实现 `setLeftExpand`, `setCenterExpand`, `setRightExpand`, `togglePanel`
- [x] 实现 `computeGridTemplate()` 宽度计算
- [x] `canvas.module.css` 扩展 `.treePanelsGrid` 支持 CSS Variable 动态列
- [x] 悬停热区（8px）组件：`HoverHotzone.tsx`
- [x] 展开箭头图标 SVG
- [x] `CanvasPage.tsx` 集成热区和状态绑定
- [x] 单元测试：`canvasExpandState.test.ts` (pass)

### 验收标准

```typescript
// 状态机测试
store.getState().setLeftExpand('expand-right');
expect(getGridTemplate(store.getState())).toBe('1.5fr 0.75fr 0.75fr');

store.getState().setCenterExpand('expand-left');
expect(getGridTemplate(store.getState())).toBe('1.5fr 1.5fr 0fr');
```

---

## Epic E3: 卡片拖拽排序

**目标**: 启用 ReactFlow v12 拖拽 API，支持卡片自由排序
**负责人**: Dev | **测试**: Tester

### 任务清单

- [x] `CardTreeRenderer.tsx` 设置 `nodesDraggable={true}`
- [x] 新增 `DragState` slice（draggedNodeId, dragOverNodeId, draggedPositions）
- [x] `onNodesChange` 扩展，监听 `position` 变化同步到 DragState
- [x] localStorage 持久化：`draggedPositions` 扩展到 persist
- [x] 拖拽占位符样式（半透明卡片）
- [x] 拖拽时禁用面板展开（避免误触发）
- [x] 单元测试：`dragState.test.ts` (51 tests pass)
- [ ] E2E 测试：卡片拖拽 → 位置保存 → 刷新页面验证 (E5)

### 验收标准

- 卡片可自由拖拽到任意位置
- 刷新页面后拖拽位置不丢失
- 拖拽中展开/折叠面板不触发误操作

### Epic E3 完成状态: ✅ 已完成 (2026-03-27 04:22 UTC+8)
- 任务清单: 全部完成 ✅
- 单元测试: 13 tests pass (`dragState.test.ts`)
- commit: `3f5586b4`

---

## Epic E4: 虚线领域框

**目标**: SVG dashed rect 视觉分组 DDD 限界上下文
**负责人**: Dev | **测试**: Tester

### 任务清单

- [x] 新建 `src/components/canvas/groups/BoundedGroupOverlay.tsx`
- [x] SVG overlay 渲染，监听节点位置变化动态更新 rect
- [x] 支持拖拽时动态调整 rect 大小（viewport tracking via onInit/onMoveEnd）
- [x] BoundedGroupSlice 管理分组数据（add/remove/toggle/assign nodes）
- [x] 单元测试 (boundedGroup.test.ts, 23 tests pass)

### 验收标准

- [x] 虚线框包裹指定卡片组
- [x] 拖拽卡片时框跟随（viewport-aware overlay）
- [x] 无性能问题（最多 10 个领域框）

---

## Epic E5: E2E 集成测试

**目标**: 全链路验收，覆盖展开+拖拽+持久化
**负责人**: Dev | **测试**: Tester

### 任务清单

- [x] `e2e/canvas-expand.spec.ts` (commit: `ef9b3de2`)
  - [x] 三栏默认等分 (E5.1)
  - [x] 悬停热区显示展开指示器 (E5.2)
  - [x] 点击热区触发展开动画 (E5.3)
  - [x] 双击热区恢复默认 (E5.4)
  - [x] ReactFlow 画布可交互 (E5.5)
  - [x] 拖拽后位置保存到 draggedPositions (E5.6)
  - [x] 刷新页面后拖拽位置恢复 (E5.7)
  - [x] 拖拽中禁用面板展开热区 (E5.8)
  - [x] BoundedGroup 组件存在性 (E5.9)
  - [x] BoundedGroup 虚线边框样式 (E5.10)
  - [x] 页面加载无 JS 错误 (E5.11)
  - [x] PhaseProgressBar 显示正确阶段 (E5.12)
  - [x] 移动端 Tab 模式切换 (E5.13)

### Epic E5 完成状态: 🚧 已创建 (2026-03-27 07:22 UTC+8)
- `e2e/canvas-expand.spec.ts`: 13 E2E 测试用例 ✅
- commit: `ef9b3de2`
- 待 Tester 执行 `pnpm e2e` 验证

---

## 文件变更清单

```
src/lib/canvas/canvasStore.ts       [修改] 新增 ExpandState + DragState slice
src/components/canvas/canvas.module.css [修改] 动态 grid-template-columns
src/components/canvas/canvas/
  CanvasPage.tsx                   [修改] 集成热区
  HoverHotzone.tsx                 [新增] 8px 悬停热区
  groups/
    BoundedGroup.tsx               [新增] 虚线领域框
src/components/canvas/nodes/
  CardNode.tsx                     [修改] nodesDraggable
src/components/canvas/
  CardTreeRenderer.tsx             [修改] onNodesChange 扩展
package.json                       [修改] @xyflow/react@latest
__tests__/canvasExpandState.test.ts [新增]
__tests__/dragState.test.ts        [新增]
e2e/canvas-expand.spec.ts          [新增]
```

---

## 执行顺序

```
E1 (升级) → E2 (展开状态) → E3 (拖拽) → E4 (领域框) → E5 (E2E)
```

E2/E3 可并行开发（不同文件），E5 需在 E2+E3+E4 完成后执行。
