# Canvas 三树统一 — 需求分析

**项目**: canvas-three-tree-unification  
**阶段**: analyze-requirements  
**Analyst**: analyst  
**日期**: 2026-03-31  
**状态**: ✅ 完成

> **与 `canvas-data-model-unification` 的关系**：本项目与 `canvas-data-model-unification`（2026-03-31 v4）高度重叠。本分析基于已完成的那份分析，**聚焦在三树 UI 展示和联动触发机制**上的差异，新增了 Section 3（"三画布同级展示"分析）和 Section 4（"下游联动手动触发"分析）。如无特殊说明，Section 0-2 与 `canvas-data-model-unification/analysis.md` 保持一致。

---

## 0. 核心设计原则

| # | 原则 | 含义 | 对应问题 |
|---|------|------|----------|
| **PRIN-1** | **无 phase 约束** | `phase` 状态机废除；用户可自由导航，无「确认后才能操作下一步」的硬约束 | P3: phase 控制按钮可用性 |
| **PRIN-2** | **单一数据源** | AI 生成/用户编辑/模板套用——所有操作都作用在同一份数据 | P1: 三树无统一顶层结构 |
| **PRIN-3** | **画布即渲染层** | 画布只负责渲染，不知道业务规则 | P3: 画布自己维护 phase 门控 |
| **PRIN-4** | **无 confirmed 状态** | 节点三态：`isActive=true`（勾选参与生成）/ `isActive=false`（不勾选）/ `isDeleted=true`（删除） | P4: confirmed 门控冗余；P8: cascade 依赖 confirmed |
| **PRIN-5** | **下游联动手动触发** | 下游树变更（删除/编辑 context）不会自动重置上游树；级联更新由用户手动触发 | P9: cascadeContextChange 自动重置下游（应改为手动） |
| **PRIN-6** | **单一 JSON 可导出/导入** | 一份 JSON 包含所有三棵树数据，URL 即分享链接 | P10: 无统一 JSON schema |
| **PRIN-7** | **URL 长度安全** | <2KB 直接编码，>2KB LZ-String，>4KB 文件下载兜底 | P11: 无 URL 分享机制 |

---

## 1. 现有代码审计

### 1.1 当前画布 UI 结构（gstack 验证）

```
┌─────────────────────────────────────────────────────┐
│  PhaseProgressBar | ProjectBar | PhaseLabelBar      │
├──────┬──────────────┬───────────────┬────────┬──────┤
│ [◀]  │ 限界上下文树 │  业务流程树   │ 组件树  │ [▶]  │
│ 24px │  (context)   │   (flow)     │(comp.) │ 24px │
│展开按钮│             │               │        │展开按钮│
└──────┴──────────────┴───────────────┴────────┴──────┘
        三列 grid 同级展示（但受 phase 约束）
```

**当前实现**：
- 三树是**同一 canvas 页面的三个 panel**（CSS grid 三列）
- phase 控制面板折叠/展开逻辑
- 三树**不是三个独立 canvas 页面**

### 1.2 Cascade 逻辑审计

```typescript
// CascadeUpdateManager.ts — 当前实现
cascadeContextChange(ctx[], flow[], comp[]) → 重置 flow + component 为 pending
cascadeFlowChange(flow[], comp[])          → 重置 component 为 pending
areAllConfirmed(nodes[])                  → 检查是否全部 confirmed
```

**问题**：`cascadeContextChange` 在 context 变更时**自动重置**下游 flow + component 为 pending，`confirmed: false`。这违反了 PRIN-5（下游联动手动触发）。

### 1.3 现有 Store 审计

与 `canvas-data-model-unification/analysis.md` Section 1 一致，此处不重复。关键差异点：

| Store | 与三树的关系 |
|--------|-------------|
| `canvasStore` | 三树数据 + phase 状态机 + 面板折叠 |
| `cascade/CascadeUpdateManager` | context 变更 → 自动重置下游（需改为手动） |
| `historySlice` | 三树独立历史栈 |

---

## 2. 当前问题分析

| # | 问题 | 违反原则 | 优先级 |
|---|------|----------|--------|
| P1 | 三棵树无统一顶层结构，`projectId` 是唯一关联字段 | PRIN-2 | P0 |
| P2 | `confirmationStore` 的类型与 `canvasStore` 不兼容 | PRIN-2 | P0 |
| P3 | `phase` 控制面板折叠/展开，用户无法自由操作 | PRIN-1, PRIN-3 | P0 |
| P4 | `node.confirmed` + `confirm*` 方法是冗余门控 | PRIN-4 | P0 |
| P5 | `handlePhaseClick` 限制只能回退不能前进 | PRIN-1 | P0 |
| P6 | 三树 Cascade 自动触发（context 变更 → 下游 pending） | PRIN-5 | P0 |
| P7 | 无统一 JSON Schema，无法一次性序列化完整画布 | PRIN-6 | P0 |
| P8 | cascade 逻辑依赖 `confirmed` 字段 | PRIN-4 | P0 |
| P9 | URL 分享无压缩机制 | PRIN-7 | P1 |

---

## 3. "三画布同级展示"分析（核心差异）

### 3.1 两种架构对比

| 架构 | 描述 | 当前实现 | 适用场景 |
|------|------|----------|----------|
| **三 Panel 同级**（当前） | 同一 canvas 页面内三列 grid，三树共享同一页面容器 | ✅ 已有 | 快速切换、轻量级编辑 |
| **三 Canvas 同级** | 三个独立 canvas 页面/视图，共享同一 CanvasData，可通过 Tab 或 Sidebar 切换 | ❌ 无 | 多显示器、复杂项目管理 |

### 3.2 推荐架构：三 Panel 同级（保持当前 UI）

**理由**：
1. 当前三列 grid 布局已实现「同级展示」
2. "三画布同级展示"的「画布」指的是**展示视图**，而非独立页面
3. 用户在**同一页面**内直接操作三棵树，无需切换 Tab

```
┌──────────────────────────────────────────────────────┐
│  Toolbar: [上下文树] [流程树] [组件树]  ← Tab 切换  │
│           + 搜索框 + 快捷操作                         │
├──────────────────────────────────────────────────────┤
│                                                       │
│  ┌─ 限界上下文树 (context) ─────────────────────┐   │
│  │  节点卡片列表，支持新增/编辑/删除/勾选        │   │
│  └────────────────────────────────────────────────┘   │
│  ┌─ 业务流程树 (flow) ──────────────────────────┐   │
│  │  节点卡片列表，支持新增/编辑/删除/勾选          │   │
│  └────────────────────────────────────────────────┘   │
│  ┌─ 组件树 (component) ──────────────────────────┐   │
│  │  节点卡片列表，支持新增/编辑/删除/勾选          │   │
│  └────────────────────────────────────────────────┘   │
│                                                       │
│  [生成流程树 ← 从已勾选 context]                      │
│  [生成组件树 ← 从已勾选 flow]                        │
└──────────────────────────────────────────────────────┘
```

### 3.3 关键 UI 改动

| 改动 | 当前 | 目标 | 优先级 |
|------|------|------|--------|
| Tab 切换器 | 无（只有展开/折叠按钮） | 新增 Tab bar，支持快速切换到任意树 | P1 |
| 三树同时可见 | 否（只能展开一个树面板） | 通过 Tab 快速切换，三树数据同时存在 | P0 |
| 面板折叠逻辑 | phase 控制自动折叠 | 面板独立折叠，与 phase 解耦 | P0 |

---

## 4. "下游联动手动触发"分析

### 4.1 当前 Cascade 行为

```
用户编辑 context 节点
         ↓
  cascadeContextChange(ctx, flow, comp)
         ↓
  flow[].status = 'pending' + confirmed = false  ← 自动重置！
  component[].status = 'pending' + confirmed = false  ← 自动重置！
         ↓
  用户看到下游节点"消失"了（变灰/pending）
```

**问题**：下游树的数据被自动丢弃，用户无法保留下游编辑。

### 4.2 目标 Cascade 行为（手动触发 + 部分重生成）

```
用户编辑 context 节点
         ↓
  仅更新 context 树（不影响 flow/component）
         ↓
  用户选中若干 context 节点（Ctrl+点击，或全选）
         ↓
  用户手动点击「生成流程树」（仅从选中的 context）
         ↓
  AI 仅生成选中节点对应的 flow
  其他未选中的 flow 节点**保留不变**
         ↓
  用户选中若干 flow 节点
         ↓
  用户手动点击「生成组件树」（仅从选中的 flow）
         ↓
  AI 仅生成选中节点对应的 component
  其他未选中的 component 节点**保留不变**
```

**核心变化**：
- 下游树变更**不自动重置**上游树
- 生成操作是**部分覆盖**而非**全量重置**
- 用户可以选择性保留下游编辑，只重新生成**选中的部分节点**
- 生成单位是**用户选中的节点集**，不是整棵树

### 4.3 部分重生成的数据流

```
Flow 生成（部分）：
  输入：选中的 context 节点 ID 列表 + 当前 flowNodes
  输出：
    1. 遍历选中的 contextId
    2. 调用 AI 生成对应 flowNodes
    3. 合并：新生成的 flowNodes + 保留未选中的 flowNodes
    4. 去重：如果 contextId 已有 flow，替换；否则追加
```

```typescript
// 部分重生成逻辑（示意）
function generateFlowsPartially(
  selectedContextIds: string[],
  currentFlowNodes: BusinessFlowNode[]
): BusinessFlowNode[] {
  // 保留未被选中的 flow 节点
  const retainedFlows = currentFlowNodes.filter(
    f => !selectedContextIds.includes(f.contextId)
  );

  // 选中的 context 节点生成新 flow
  const newFlows = await canvasApi.generateFlows({
    contexts: selectedContextIds.map(id => contextNodesMap[id])
  });

  // 合并去重（按 contextId）
  const existingContextIds = new Set(newFlows.map(f => f.contextId));
  const replacedFlows = currentFlowNodes.filter(
    f => selectedContextIds.includes(f.contextId)
  );

  return [...retainedFlows, ...newFlows];
}
```

### 4.3 CascadeManager 改造

```typescript
// 改造后的 CascadeUpdateManager.ts
// PRIN-5: 下游联动手动触发，移除自动重置

// 不再导出 cascadeContextChange / cascadeFlowChange
// 改为手动触发的生成函数

/**
 * 从 context 生成 flow（手动触发）
 */
export async function generateFlowFromContext(
  contextNodes: BoundedContextNode[]
): Promise<BusinessFlowNode[]> {
  // 过滤 isActive=true 的节点参与生成
  const activeContexts = contextNodes.filter(n => n.isActive !== false && !n.isDeleted);
  // 调用 AI 生成 flow
  const result = await canvasApi.generateFlows({ contexts: activeContexts });
  return result.flows;
}

/**
 * 从 flow 生成 component（手动触发）
 */
export async function generateComponentFromFlow(
  flowNodes: BusinessFlowNode[]
): Promise<ComponentNode[]> {
  const activeFlows = flowNodes.filter(n => n.isActive !== false && !n.isDeleted);
  const result = await canvasApi.generateComponents({ flows: activeFlows });
  return result.components;
}

/**
 * 删除节点时：仅标记删除，不级联重置下游
 * 下游节点保留，用户可自行决定是否重新生成
 */
export function markNodeDeleted(
  nodes: Array<{ nodeId: string; isDeleted?: boolean }>,
  nodeId: string
): Array<{ nodeId: string; isDeleted?: boolean }> {
  return nodes.map(n => n.nodeId === nodeId ? { ...n, isDeleted: true } : n);
}
```

---

## 5. JTBD

| # | JTBD | 对应原则 |
|---|------|----------|
| JTBD-1 | **消除 phase 状态机** | PRIN-1 |
| JTBD-2 | **统一 CanvasData 数据结构** | PRIN-2 |
| JTBD-3 | **消除 confirmed，替换为 isActive** | PRIN-4 |
| JTBD-4 | **画布只渲染，不维护业务规则** | PRIN-3 |
| JTBD-5 | **三树同级展示，Tab 快速切换，面板独立折叠** | — |
| JTBD-6 | **下游联动改为手动触发**，不自动重置下游 | PRIN-5 |
| JTBD-6b | **部分重生成**：用户选中若干节点 → 仅重新生成这若干节点，其他节点保留 | PRIN-5 |
| JTBD-7 | **单一 JSON 导出/导入 + URL 分享** | PRIN-6, PRIN-7 |
| JTBD-8 | **自动消息/历史记录** | — |

---

## 6. 验收标准

| ID | 验收条件 | 对应原则 | 测试方法 |
|----|----------|----------|----------|
| AC-1 | 编辑 context 节点后，flow 和 component 树**不受影响**（不自动重置） | PRIN-5 | 编辑一个 context 节点 → 验证 flow/component 树状态不变 |
| AC-2 | 用户手动点击「生成流程树」后，flow 树被**覆盖**更新 | PRIN-5 | 手动触发 → 验证 flow 树更新 |
| AC-2b | **部分重生成**：选中 2 个 context，生成对应的 2 个 flow；其他未选中的 flow 节点**保留不变** | PRIN-5 | 选中 context #1 和 #3 → 生成 flow → 验证 flow #1/#3 更新，flow #2 保留 |
| AC-3 | 三树通过 Tab 切换，用户可在任意时刻操作任意树，无 phase 约束 | PRIN-1 | Tab 切换 → 在任意树执行新增/编辑操作 |
| AC-4 | 面板独立折叠，不受 phase 影响 | PRIN-1 | 折叠任意面板 → 切换 phase → 验证折叠状态保留 |
| AC-5 | `node.confirmed` 已移除，替换为 `node.isActive` | PRIN-4 | 代码搜索确认无 confirmed 字段 |
| AC-6 | `cascadeContextChange` 不再自动重置下游节点 | PRIN-5 | 搜索代码确认无自动重置调用 |
| AC-7 | 勾选的节点（`isActive=true`）参与生成，不勾选的不参与 | PRIN-4 | 勾选 2 个 context → 生成 flow → 验证只有 2 个 flow 节点 |
| AC-8 | CanvasJSON 可导出/导入，包含完整三树数据 | PRIN-6 | 导出 → 清空 → 导入 → 验证三树一致 |
| AC-9 | URL 分享 < 2KB 时直接编码，> 2KB 有压缩或下载兜底 | PRIN-7 | 生成大画布 → 验证无超长 URL |

---

## 7. 实施计划

### Phase 1（三树 UI + 联动重构）：15-20h

| Epic | 内容 | 工时 |
|------|------|------|
| Epic 1 | 新增 Tab 切换器（context/flow/component），移除 phase 对树操作的约束 | 3h |
| Epic 2 | 面板折叠与 phase 解耦（独立折叠状态） | 2h |
| Epic 3 | **移除 `cascadeContextChange` 自动重置**，改为手动触发 + **部分重生成** `generateFlowsPartially` | 3h |
| Epic 4 | 移除 `confirmed`，替换为 `isActive`；删除 `confirm*` 方法 | 3h |
| Epic 5 | 重构 CascadeManager（手动生成函数替代自动级联） | 2h |
| Epic 6 | 移除 phase 状态机门控（`areAllConfirmed`） | 2h |
| Epic 7 | E2E 测试 + 回归测试 | 3h |

### Phase 2（数据统一 + JSON）：15-20h

| Epic | 内容 | 工时 |
|------|------|------|
| Epic 8 | 设计 CanvasJSON Schema，实现导出/导入 | 5h |
| Epic 9 | 实现 URL 分享（含 LZ-String + 文件下载兜底） | 4h |
| Epic 10 | 消除 confirmationStore 重复类型 | 2h |
| Epic 11 | 实现 historyMiddleware + messageMiddleware | 5h |
| Epic 12 | 回归测试 | 4h |

**总工时**: 30-40h

---

## 8. 下一步

1. **PM**: 评审 Phase 1/Phase 2 划分
2. **Architect**: 确认 CascadeManager 重构方案（手动触发 vs 自动级联）
3. **Coord**: 确认与 `canvas-data-model-unification` 的 PRD 合并策略（两个分析高度重叠）

---

*分析文档完毕。*
