# 分析报告：Canvas 页两个 P0 Bug

**项目**: vibex-canvas-continu  
**任务**: analyze-requirements  
**分析日期**: 2026-03-29  
**分析师**: Analyst Agent

---

## 问题 1：继续·流程树按钮事件绑定问题

### 源代码验证

| 检查项 | 文件 | 行号 | 状态 |
|--------|------|------|------|
| 按钮文本 | BoundedContextTree.tsx | 523 | `继续 → 流程树` |
| onClick 绑定 | BoundedContextTree.tsx | 520 | ✅ `onClick={handleConfirmAll}` |
| handler 函数定义 | BoundedContextTree.tsx | 455 | ✅ `handleConfirmAll` 已定义 |
| 条件渲染 | BoundedContextTree.tsx | 519 | `{allConfirmed && (...)}` |

### 发现详情

**现状**: 按钮**已有**事件绑定 (`onClick={handleConfirmAll}`)，但存在逻辑缺陷。

**handleConfirmAll 逻辑**:
```typescript
const handleConfirmAll = useCallback(() => {
  const unconfirmedIds = contextNodes.filter((n) => !n.confirmed).map((n) => n.nodeId);
  unconfirmedIds.forEach((nodeId) => {
    confirmContextNode(nodeId);
  });
  if (unconfirmedIds.length > 0) {
    advancePhase(); // 仅在有待确认节点时推进阶段
  }
}, [contextNodes, confirmContextNode, advancePhase]);
```

**Bug 描述**: 
- 按钮仅在 `allConfirmed === true` 时渲染（所有节点已确认）
- 但 `handleConfirmAll` 在所有节点已确认时，`unconfirmedIds.length === 0`，`advancePhase()` 不会执行
- **结果**：当用户看到按钮并点击时，什么都不会发生（按钮显示但点击无效）

### 技术方案

#### 方案 A：移除按钮显示条件，让按钮始终可点击（推荐）
```typescript
// 修改 BoundedContextTree.tsx 第 519 行
{/* 移除 {allConfirmed && (...)} 条件 */}
<button
  type="button"
  className={styles.primaryButton}
  onClick={handleConfirmAll}
  disabled={contextNodes.length === 0}  // 仅在无节点时禁用
  aria-label="继续到流程树"
>
  {contextNodes.length === 0 
    ? '请先添加上下文节点' 
    : allConfirmed 
      ? '继续 → 流程树' 
      : `确认 ${contextNodes.filter(n => !n.confirmed).length} 个节点后继续`}
</button>
```
**优点**: 用户体验清晰，按钮始终有意义  
**缺点**: 需要改渲染逻辑

#### 方案 B：修复 handleConfirmAll 逻辑
```typescript
const handleConfirmAll = useCallback(() => {
  const allIds = contextNodes.map((n) => n.nodeId);
  allIds.forEach((nodeId) => {
    if (!contextNodes.find(n => n.nodeId === nodeId)?.confirmed) {
      confirmContextNode(nodeId);
    }
  });
  advancePhase(); // 始终尝试推进阶段
}, [contextNodes, confirmContextNode, advancePhase]);
```
**优点**: 不改变 UI 结构  
**缺点**: 可能导致重复确认调用

#### 方案 C：确认后自动推进阶段（利用 cascade 机制）
当前 `confirmContextNode` 在最后一个节点确认时会触发 `cascade.areAllConfirmed`，并调用 `autoGenerateFlows`。建议让 `advancePhase` 也在此时触发。

---

## 问题 2：Phase2 Canvas 增强功能未集成

### Phase2 计划 vs 实现对照表

| 功能 | 计划 | 实现状态 | 详情 |
|------|------|---------|------|
| F1.1 expand-both 模式 | canvasStore.expandMode | ✅ 已实现 | `canvasStore.ts:495` |
| F1.2 maximize 模式 | toggleMaximize | ✅ 已实现 | `canvasStore.ts:508` |
| F1.3 F11/ESC 快捷键 | keydown handler | ✅ 已实现 | `CanvasPage.tsx:116-130` |
| F1.4 移除旧 1.5fr 逻辑 | 代码清理 | ✅ 已实现 | 注释标注"旧 1.5fr 逻辑已移除" |
| F2.1 交集高亮层 | OverlapHighlightLayer.tsx | ❌ **未集成** | 组件存在但未在 CanvasPage 中导入/使用 |
| F2.2 start/end 节点标记 | FlowNodeMarker | ⚠️ 部分实现 | 组件存在，未在 FlowNodeCard 中集成 |
| F3.1 数据模型扩展 | BoundedEdge/FlowEdge 类型 | ✅ 已实现 | `types.ts` |
| F3.2 BoundedEdgeLayer | BoundedEdgeLayer.tsx | ⚠️ **框架存在，数据流断裂** | 组件存在，已导入，但 `boundedEdges` 永远为空 |
| F3.3 FlowEdgeLayer | FlowEdgeLayer.tsx | ⚠️ **框架存在，数据流断裂** | 组件存在，已导入，但 `flowEdges` 永远为空 |
| F3.4 连线密度控制 | edgeCluster | ⚠️ 依赖 F3.2/F3.3 数据 | 无数据时无法验证 |

### 关键 Bug：BoundedEdgeLayer 和 FlowEdgeLayer 数据流断裂

**证据**:
1. `canvasStore.ts` 定义了 `boundedEdges` 和 `flowEdges` 状态
2. 定义了 `addBoundedEdge`、`addFlowEdge` 方法
3. CanvasPage.tsx 导入了 `BoundedEdgeLayer` 和 `FlowEdgeLayer`
4. **但 `addBoundedEdge` 和 `addFlowEdge` 在整个代码库中从未被调用**

```typescript
// canvasStore.ts - 定义了但从未调用
addBoundedEdge: (edgeData) => {
  set((s) => ({ boundedEdges: [...s.boundedEdges, newEdge] }));
},
addFlowEdge: (edgeData) => {
  set((s) => ({ flowEdges: [...s.flowEdges, newEdge] }));
},
```

```tsx
// CanvasPage.tsx - 有渲染逻辑但数据为空
{boundedEdges.length > 0 && (
  <BoundedEdgeLayer edges={boundedEdges} ... />
)}
{flowEdges.length > 0 && (
  <FlowEdgeLayer edges={flowEdges} ... />
)}
// 由于 boundedEdges/flowEdges 永远为空，两个图层从不渲染
```

### 技术方案

#### 方案 A（推荐）：在节点确认时生成边数据

在 `confirmContextNode` 或 `confirmAll` 时，计算并添加边数据：

```typescript
// canvasStore.ts - 扩展 confirmContextNode
confirmContextNode: (nodeId) => {
  // ... 现有逻辑 ...
  
  // 新增：生成限界上下文之间的边
  const ctxA = newContextNodes.find(n => n.nodeId === nodeId);
  if (ctxA?.relatedContexts) {
    ctxA.relatedContexts.forEach((relatedId) => {
      get().addBoundedEdge({
        sourceId: nodeId,
        targetId: relatedId,
        type: 'association',
      });
    });
  }
  
  // ... cascade 逻辑 ...
}
```

#### 方案 B：在 FlowNode 生成时创建 FlowEdge

在 `autoGenerateFlows` 或 `handleContinueToComponents` 中：

```typescript
// BusinessFlowTree.tsx - 在流程生成后添加边
flowNodes.forEach((flow, idx) => {
  if (idx > 0) {
    canvasStore.getState().addFlowEdge({
      sourceId: flowNodes[idx - 1].nodeId,
      targetId: flow.nodeId,
      type: 'sequence',
    });
  }
});
```

#### 方案 C：集成 OverlapHighlightLayer

```tsx
// CanvasPage.tsx - 添加导入和渲染
import { OverlapHighlightLayer } from './groups/OverlapHighlightLayer';

// 在 overlay 层中添加
<OverlapHighlightLayer
  groups={boundedGroups}
  bboxes={boundedGroupBboxes}
  zoom={zoomLevel}
  pan={panOffset}
/>
```

### 初步风险

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| 边数据生成时机不确定 | EdgeLayer 不渲染 | 在节点创建/确认时统一生成 |
| OverlapHighlightLayer 性能 | 大量节点时可能卡顿 | 使用 useMemo 缓存，使用 pointer-events: none |
| expandMode 不持久化 | 刷新页面后恢复默认 | 将 expandMode 添加到 partialize 白名单 |
| FlowNodeMarker 未集成 | start/end 节点无视觉标记 | 单独 Epic 修复 |

### 验收标准

#### 问题 1 验收标准
- [ ] 点击"继续 → 流程树"按钮后，phase 从 'context' 变为 'flow'
- [ ] 按钮在有未确认节点时也可见（disabled 状态）
- [ ] 点击后控制台无报错
- [ ] Playwright E2E 测试通过

#### 问题 2 验收标准
- [ ] BoundedContextTree 有至少 2 个节点时，页面显示连线（BoundedEdgeLayer 渲染）
- [ ] BusinessFlowTree 有至少 2 个流程节点时，页面显示连线（FlowEdgeLayer 渲染）
- [ ] 两个虚线框相交时，页面显示交集高亮
- [ ] `grep -rn "addBoundedEdge\|addFlowEdge" src/` 输出 > 2 行（不止 store 定义）
- [ ] expandMode 刷新页面后保持原状态

---

## 附录：文件清单

| 文件 | 作用 | 状态 |
|------|------|------|
| BoundedContextTree.tsx | 限界上下文树，含"继续 → 流程树"按钮 | 有事件绑定但逻辑需修复 |
| BusinessFlowTree.tsx | 业务流程树，含"继续·组件树"按钮 | ✅ 绑定正常 |
| CanvasPage.tsx | 画布主容器，含 Phase2 增强功能 | ⚠️ EdgeLayer 框架存在，数据流断裂 |
| canvasStore.ts | Zustand 状态管理 | ✅ expandMode 存在，❌ 边数据从未添加 |
| OverlapHighlightLayer.tsx | 虚线框交集高亮组件 | ⚠️ 组件存在，未集成 |
| BoundedEdgeLayer.tsx | 限界上下文连线层 | ⚠️ 框架存在，无数据 |
| FlowEdgeLayer.tsx | 流程节点连线层 | ⚠️ 框架存在，无数据 |

---

*分析师报告 | vibex-canvas-continu/analyze-requirements*
