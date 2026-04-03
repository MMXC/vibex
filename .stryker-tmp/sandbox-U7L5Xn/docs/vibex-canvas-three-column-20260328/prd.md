# PRD: Canvas 三栏画布自动展开

**项目**: vibex-canvas-three-column-20260328
**版本**: 1.0
**日期**: 2026-03-28
**角色**: PM

---

## 1. 背景与目标

### 问题

Canvas 三栏画布的展开机制（`leftExpand`/`centerExpand`/`rightExpand` + `HoverHotzone`）已在代码中完整实现，但用户确认限界上下文树后，**展开状态不会自动触发**，导致用户不清楚当前哪个面板处于激活状态。

### 根因

`recomputeActiveTree()` 仅切换 `activeTree`，**不触发展开状态**。

### 目标

在用户完成阶段性操作后（如确认上下文节点、确认流程节点），**自动展开对应的工作面板**，无需用户手动操作 HoverHotzone。

---

## 2. Epic 拆分

### Epic E2-1: 核心展开逻辑自动化
> **必须修改** | 优先级: P0 | 2h

`recomputeActiveTree` 在切换 `activeTree` 时，自动触发 `centerExpand` 状态。

### Epic E2-2: 移动端展开入口
> **建议修改** | 优先级: P2 | 2h

在 `useTabMode`（移动端）下，Tab 切换时自动全屏当前面板。

### Epic E2-3: 展开热区视觉增强
> **建议修改** | 优先级: P3 | 1h

优化 HoverHotzone 视觉提示，降低发现门槛。

---

## 3. Story 拆分与验收标准

### Epic E2-1: 核心展开逻辑自动化

#### Story E2-1.1: recomputeActiveTree 自动展开中间面板
- **文件**: `vibex-fronted/src/lib/canvas/canvasStore.ts`
- **修改函数**: `recomputeActiveTree`
- **行为**:
  - 当 `activeTree` 切换为 `'flow'` 时 → `set({ centerExpand: 'expand-left' })`
  - 当 `activeTree` 切换为 `'component'` 时 → `set({ centerExpand: 'expand-left' })`
  - 当 `activeTree` 为 `null` 时 → `set({ centerExpand: 'default' })`
- **验收标准**:
  ```typescript
  // 1. 确认全部 context 节点后，activeTree 变为 'flow'，centerExpand 变为 'expand-left'
  const store = useCanvasStore.getState();
  store.setContextNodes(contextNodes.map(n => ({ ...n, confirmed: true })));
  store.recomputeActiveTree();
  expect(useCanvasStore.getState().centerExpand).toBe('expand-left');

  // 2. 确认全部 flow 节点后，activeTree 变为 'component'，centerExpand 保持 'expand-left'
  const store2 = useCanvasStore.getState();
  store2.setFlowNodes(flowNodes.map(n => ({ ...n, confirmed: true })));
  store2.recomputeActiveTree();
  expect(useCanvasStore.getState().activeTree).toBe('component');
  expect(useCanvasStore.getState().centerExpand).toBe('expand-left');

  // 3. 切换到 input/prototype 阶段，activeTree 为 null，centerExpand 重置为 'default'
  store2.setPhase('input');
  store2.recomputeActiveTree();
  expect(useCanvasStore.getState().centerExpand).toBe('default');
  ```

#### Story E2-1.2: autoGenerateFlows 触发后自动展开
- **文件**: `vibex-fronted/src/lib/canvas/canvasStore.ts`
- **修改函数**: `autoGenerateFlows`
- **行为**: AI 生成流程树成功后，`setPhase('flow')` → `recomputeActiveTree()` → 自动展开中间面板
- **验收标准**:
  ```typescript
  // 4. autoGenerateFlows 成功后，phase 变为 'flow'，centerExpand 变为 'expand-left'
  const store3 = useCanvasStore.getState();
  // mock canvasApi.generateFlows 返回成功结果
  await store3.autoGenerateFlows(confirmedContexts);
  expect(useCanvasStore.getState().centerExpand).toBe('expand-left');
  ```

#### Story E2-1.3: 手动展开后不覆盖
- **文件**: `vibex-fronted/src/lib/canvas/canvasStore.ts`
- **行为**: 如果用户手动设置了展开状态，`recomputeActiveTree` 不应无条件覆盖用户的选择
- **验收标准**:
  ```typescript
  // 5. 用户手动展开左侧面板后，确认 context 节点不应重置左侧展开状态
  store.setLeftExpand('expand-right');
  store.setContextNodes(contextNodes.map(n => ({ ...n, confirmed: true })));
  store.recomputeActiveTree();
  expect(useCanvasStore.getState().leftExpand).toBe('expand-right');
  ```

---

### Epic E2-2: 移动端展开入口

#### Story E2-2.1: Tab 切换时自动全屏
- **文件**: `vibex-fronted/src/components/canvas/CanvasPage.tsx`
- **行为**: 移动端 Tab 切换激活时，设置对应面板的展开状态（left/center/right → 'expand-left'/'expand-right'）
- **验收标准**:
  ```typescript
  // 6. Tab 切换到中间面板后，中间面板全屏展示（centerExpand: 'expand-left', 左右: 'default'）
  // 注意：此行为仅在移动端触发，可通过 isMobile 状态条件判断
  ```

---

### Epic E2-3: 展开热区视觉增强

#### Story E2-3.1: HoverHotzone 高亮激活状态
- **文件**: `vibex-fronted/src/components/canvas/HoverHotzone.tsx`
- **行为**: 当相邻面板处于展开状态时，热区显示高亮或箭头更明显
- **验收标准**:
  ```typescript
  // 7. centerExpand === 'expand-left' 时，热区有可见的视觉提示（类名、颜色等）
  ```

---

## 4. 技术约束

| 约束 | 说明 |
|------|------|
| 不新增 Zustand store | 仅在现有 `canvasStore` 中修改 |
| 不破坏手动展开热区 | 自动展开为增强，不覆盖 HoverHotzone 功能 |
| 不引入新依赖 | 仅修改现有代码 |
| 移动端向后兼容 | `useTabMode` 切换路径独立，不影响桌面端 |

---

## 5. 实施计划

| 阶段 | 内容 | 负责 |
|------|------|------|
| Phase 1 | 修改 `recomputeActiveTree` + `autoGenerateFlows`（E2-1） | dev |
| Phase 2 | 移动端 Tab 全屏支持（E2-2） | dev |
| Phase 3 | HoverHotzone 视觉增强（E2-3） | dev |
| Phase 4 | 单元测试 + 集成验证 | tester |

---

## 6. 风险与依赖

| 风险 | 影响 | 缓解 |
|------|------|------|
| 快速多次确认节点 | 展开状态可能被频繁覆盖 | E2-1.3 验收标准已覆盖 |
| 移动端 `useTabMode` 状态不一致 | Tab 切换时展开状态错误 | 通过 CanvasPage.tsx useEffect 同步 |
| `autoGenerateFlows` 异步后 phase 切换 | 展开时序问题 | 同步在 `setPhase` 后调用 `recomputeActiveTree` |
