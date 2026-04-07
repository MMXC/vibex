# PRD：Canvas 页面两个 P0 Bug 修复

**项目**: vibex-canvas-continu  
**任务**: create-prd  
**文档版本**: v1.0  
**日期**: 2026-03-29  
**产品负责人**: PM Agent  
**状态**: Phase 1 — PRD 评审中

---

## 1. 背景与目标

### 1.1 项目背景

Canvas 页面是 VibeX 的核心编辑界面，当前存在两个 P0 Bug 导致用户流程无法正常推进：

1. **Bug 1**: "继续 → 流程树" 按钮点击无效 — 按钮已绑定 `handleConfirmAll` 事件，但该 handler 在所有节点已确认时不会触发 `advancePhase()`，导致按钮形同虚设
2. **Bug 2**: Phase2 Canvas 增强功能（边图层）未集成 — `BoundedEdgeLayer` 和 `FlowEdgeLayer` 组件框架存在，但数据流断裂，连线从不渲染

### 1.2 项目目标

| 目标 | 描述 | 验收方式 |
|------|------|---------|
| Bug 1 修复 | "继续 → 流程树"按钮点击后 phase 从 `context` 推进到 `flow` | Playwright E2E |
| Bug 2 修复 | 限界上下文之间、流程节点之间显示连线 | 视觉验证 + E2E |
| 性能保障 | 修复不影响现有功能，渲染性能无明显下降 | Playwright performance |

### 1.3 范围

**包含**:
- BoundedContextTree "继续 → 流程树" 按钮逻辑修复
- BoundedEdgeLayer 数据流打通（节点确认时生成边）
- FlowEdgeLayer 数据流打通（流程生成时创建边）
- OverlapHighlightLayer 集成
- expandMode 持久化

**不包含**:
- FlowNodeMarker start/end 节点标记（单独 Epic）
- Canvas 性能深度优化（单独 Epic）
- 其他 Phase2 未完成功能（如边密度控制）

---

## 2. 功能点（Epic & Story）

### Epic 1：B1 - 继续流程树按钮修复

#### Story 1.1：修复 handleConfirmAll 逻辑

| 字段 | 内容 |
|------|------|
| **ID** | F1.1 |
| **功能点** | 修复 handleConfirmAll 推进阶段逻辑 |
| **描述** | 修改 `handleConfirmAll` 逻辑，确保点击按钮后 `phase` 从 `context` 推进到 `flow` |
| **技术方案** | 采用方案 A（推荐）：移除按钮显示条件，让按钮始终可点击，在点击时无论节点是否已确认都调用 `advancePhase()` |
| **涉及文件** | `src/components/canvas/BoundedContextTree.tsx` |
| **验收标准** | `expect(handleConfirmAll()…).toAdvancePhase('flow')` |
| **DoD** | 按钮点击后 phase 变为 'flow'；控制台无 Error；单元测试覆盖 |
| **页面集成** | ✅【需页面集成】BoundedContextTree 组件 |

#### Story 1.2：按钮状态与文案优化

| 字段 | 内容 |
|------|------|
| **ID** | F1.2 |
| **功能点** | 按钮状态与文案优化 |
| **描述** | 根据节点确认状态显示不同文案；无节点时显示"请先添加上下文节点"；未全确认时显示"确认 X 个节点后继续" |
| **涉及文件** | `src/components/canvas/BoundedContextTree.tsx` |
| **验收标准** | `expect(screen.queryByText('请先添加上下文节点')).toBeVisible()`（无节点时） |
| **DoD** | 不同状态下文案正确；按钮 disabled 状态正确 |
| **页面集成** | ✅【需页面集成】BoundedContextTree 组件 |

---

### Epic 2：B2 - Phase2 Canvas 增强功能集成

#### Story 2.1：打通 BoundedEdgeLayer 数据流

| 字段 | 内容 |
|------|------|
| **ID** | F2.1 |
| **功能点** | 在节点确认时生成 BoundedEdge 数据 |
| **描述** | 在 `confirmContextNode` 时，读取 `relatedContexts` 字段，调用 `addBoundedEdge` 生成限界上下文之间的连线数据 |
| **技术方案** | 修改 `canvasStore.confirmContextNode`，在确认节点后检查 `relatedContexts` 并添加边 |
| **涉及文件** | `src/stores/canvasStore.ts` |
| **验收标准** | `expect(boundedEdges.length).toBeGreaterThan(0)`（至少 2 个节点且有 relatedContexts 时） |
| **DoD** | BoundedEdgeLayer 在有数据时渲染；`grep -rn "addBoundedEdge" src/` 输出 > 2 行 |
| **页面集成** | ✅【需页面集成】CanvasPage.tsx BoundedEdgeLayer 使用处 |

#### Story 2.2：打通 FlowEdgeLayer 数据流

| 字段 | 内容 |
|------|------|
| **ID** | F2.2 |
| **功能点** | 在流程生成时创建 FlowEdge 数据 |
| **描述** | 在 `autoGenerateFlows` 或 `handleContinueToComponents` 时，根据流程节点顺序创建相邻节点的 FlowEdge |
| **技术方案** | 在 `BusinessFlowTree.tsx` 或 `canvasStore` 中，流程生成后遍历 `flowNodes` 数组，为相邻节点添加 `FlowEdge` |
| **涉及文件** | `src/stores/canvasStore.ts`, `src/components/canvas/BusinessFlowTree.tsx` |
| **验收标准** | `expect(flowEdges.length).toBeGreaterThan(0)`（至少 2 个流程节点时） |
| **DoD** | FlowEdgeLayer 在有数据时渲染；`grep -rn "addFlowEdge" src/` 输出 > 2 行 |
| **页面集成** | ✅【需页面集成】CanvasPage.tsx FlowEdgeLayer 使用处 |

#### Story 2.3：集成 OverlapHighlightLayer

| 字段 | 内容 |
|------|------|
| **ID** | F2.3 |
| **功能点** | 集成 OverlapHighlightLayer 交集高亮 |
| **描述** | 将 `OverlapHighlightLayer` 组件导入 CanvasPage 并渲染，用于显示两个虚线框相交时的高亮区域 |
| **技术方案** | 在 CanvasPage.tsx 中导入组件，计算 `boundedGroups` 和 `boundedGroupBboxes`，传入 OverlapHighlightLayer |
| **涉及文件** | `src/components/canvas/CanvasPage.tsx`, `src/components/canvas/groups/OverlapHighlightLayer.tsx` |
| **验收标准** | 两个虚线框相交时，页面显示交集高亮区域（黄色半透明叠加） |
| **DoD** | OverlapHighlightLayer 正确渲染；性能无明显下降（useMemo 优化） |
| **页面集成** | ✅【需页面集成】CanvasPage.tsx overlay 层 |

#### Story 2.4：expandMode 状态持久化

| 字段 | 内容 |
|------|------|
| **ID** | F2.4 |
| **功能点** | expandMode 刷新页面后保持状态 |
| **描述** | 将 `expandMode` 添加到 canvasStore 的 `partialize` 白名单，使用 localStorage 持久化 |
| **涉及文件** | `src/stores/canvasStore.ts` |
| **验收标准** | 展开/收拢状态后刷新页面，状态保持不变 |
| **DoD** | localStorage 中可看到 expandMode 值；E2E 验证持久化 |
| **页面集成** | ❌【无需页面集成】仅状态管理 |

---

## 3. 优先级矩阵

| ID | 功能点 | 优先级 | 类型 | 工作量 | 风险 |
|----|--------|--------|------|--------|------|
| F1.1 | 修复 handleConfirmAll 逻辑 | P0 | Bug | 2h | 低 |
| F2.1 | BoundedEdgeLayer 数据流 | P0 | Bug | 3h | 中 |
| F2.2 | FlowEdgeLayer 数据流 | P0 | Bug | 3h | 中 |
| F1.2 | 按钮状态与文案优化 | P1 | UX | 1h | 低 |
| F2.3 | OverlapHighlightLayer 集成 | P1 | Feature | 2h | 低 |
| F2.4 | expandMode 持久化 | P2 | Feature | 1h | 低 |

**P0 优先上线**：F1.1 + F2.1 + F2.2  
**P1 随版本修复**：F1.2 + F2.3  
**P2 可选优化**：F2.4

---

## 4. 验收标准（Testable Assertions）

### 4.1 Bug 1 验收

```typescript
// F1.1 - 按钮点击推进 phase
describe('继续→流程树按钮', () => {
  it('点击后 phase 从 context 变为 flow', async () => {
    await canvasPage.addContextNodes(2);
    await canvasPage.confirmAllNodes();
    await canvasPage.clickContinueToFlowTree();
    expect(canvasStore.getState().phase).toBe('flow');
  });

  it('无节点时按钮显示请先添加上下文节点', async () => {
    await canvasPage.render();
    expect(screen.getByText('请先添加上下文节点')).toBeVisible();
  });
});
```

### 4.2 Bug 2 验收

```typescript
// F2.1 - BoundedEdgeLayer 渲染
describe('BoundedEdgeLayer', () => {
  it('至少2个节点且有关联时显示连线', async () => {
    await canvasPage.addContextNodes(2, { relatedContexts: [node2Id] });
    await canvasPage.confirmAllNodes();
    const edgeLayer = page.locator('[data-testid="bounded-edge-layer"]');
    await expect(edgeLayer).toBeVisible();
    await expect(edgeLayer.locator('path')).toHaveCount({ greaterThan: 0 });
  });
});

// F2.2 - FlowEdgeLayer 渲染
describe('FlowEdgeLayer', () => {
  it('至少2个流程节点时显示连线', async () => {
    await canvasPage.addFlowNodes(2);
    const edgeLayer = page.locator('[data-testid="flow-edge-layer"]');
    await expect(edgeLayer).toBeVisible();
  });
});

// F2.3 - OverlapHighlightLayer 渲染
describe('OverlapHighlightLayer', () => {
  it('两个虚线框相交时显示高亮', async () => {
    // 两个框有交集时
    const highlight = page.locator('[data-testid="overlap-highlight"]');
    await expect(highlight).toBeVisible();
  });
});
```

---

## 5. 约束清单

| 约束 | 说明 |
|------|------|
| C1 | 不得破坏现有 cascade 机制（节点确认后的自动流程生成） |
| C2 | BoundedEdgeLayer/FlowEdgeLayer 只在有数据时渲染（`length > 0` 判断保留） |
| C3 | OverlapHighlightLayer 使用 `useMemo` 缓存，避免性能问题 |
| C4 | expandMode 持久化使用 `localStorage`，key 名需与 store 命名一致 |
| C5 | 所有修改的文件需有对应单元测试或 E2E 测试 |

---

## 6. 出码 Tracker

| 功能点 | 负责人 | 预计工时 | 状态 |
|--------|--------|---------|------|
| F1.1 | dev | 2h | 待开发 |
| F1.2 | dev | 1h | 待开发 |
| F2.1 | dev | 3h | 待开发 |
| F2.2 | dev | 3h | 待开发 |
| F2.3 | dev | 2h | 待开发 |
| F2.4 | dev | 1h | 待开发 |

**总预计工时**: 12h

---

## 7. 上游产物

| 产物 | 路径 | 状态 |
|------|------|------|
| analysis.md | `docs/修复 canvas 页两个 P0 Bug：1) 继续·流程树按钮未绑定事件；2) Phase2 canvas 增强功能未集成上线/analysis.md` | ✅ 完成 |

---

## 8. 下游产物

| 产物 | 路径 | 依赖 |
|------|------|------|
| architecture.md | 同目录 | 依赖本 PRD |
| IMPLEMENTATION_PLAN.md | 同目录 | 依赖本 PRD |
| AGENTS.md | 同目录 | 依赖本 PRD |
| E2E 测试 | `tests/canvas-e2e.spec.ts` | 依赖本 PRD |

---

*PRD | vibex-canvas-continu/create-prd*
