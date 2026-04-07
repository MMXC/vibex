# Analysis: VibeX Canvas Phase2 — 全屏展开 + 关系可视化

> **任务**: canvas-phase2/analyze-requirements
> **分析日期**: 2026-03-29
> **分析师**: Analyst Agent
> **项目**: canvas-phase2
> **工作目录**: /root/.openclaw/vibex

---

## 1. 执行摘要

Phase2 在 Phase1 样式统一基础上，聚焦两大核心增强：
1. **全屏展开 = 可编辑画布**：当前面板展开仅略微增加宽度（1fr → 1.5fr），需要真正的准全屏**可编辑**体验
2. **关系可视化**：在画布上直接呈现限界上下文卡片之间的关联、流程节点之间的关系

**核心约束（用户明确）**：★ 全屏展开 = 可编辑模式 ★，不是只读展示，是真正的编辑画布：
- 可拖拽调整卡片位置
- 可添加/删除/修改连线
- 可微调对话内容

核心发现：关系可视化的实现复杂度远超全屏展开，前者需要引入 SVG/Canvas 连线渲染层。全屏展开从"展开宽度"变成"可编辑画布"，工作量显著增加。

---

## 2. 实地审计结果

### 2.1 全屏展开现状

**当前机制**（CanvasPage.tsx L75-97）：

```tsx
grid.style.setProperty('--grid-left', leftExpand === 'expand-right' ? '1.5fr' : '1fr');
grid.style.setProperty('--grid-center', centerExpand === 'expand-left' ? '1.5fr' : '1fr');
grid.style.setProperty('--grid-right', rightExpand === 'expand-left' ? '1.5fr' : '1fr');
```

- 展开 → `1.5fr`（仅增加 50%）
- 收缩 → `0fr`（隐藏）
- **问题**：从 1fr 扩展到 1.5fr，用户感知不强，非真正全屏

**现有 expand 模式**：
- `expand-left` / `expand-right`：单向展开，接收邻居空间
- 缺 `expand-both`：三栏同时展开，强制准全屏
- 缺 `fullscreen`/`maximize`：隐藏工具栏，最大化画布区域

### 2.2 关系可视化现状

**限界上下文虚线框**（已有基础实现）：

| 文件 | 功能 | 状态 |
|------|------|------|
| `BoundedGroupOverlay.tsx` | SVG 虚线矩形包裹分组 | ✅ 已有基础实现 |
| `ComponentGroupOverlay.tsx` | 组件树分组叠加层 | ✅ 已有基础实现 |
| `BOUNDED_GROUP_COLORS` | 4色领域变量 | ✅ 已有 |

**关系可视化缺失项**：

| 功能 | 状态 | 缺失原因 |
|------|------|----------|
| 虚线框交集高亮 | ❌ | BoundedGroupOverlay 仅画矩形，无交集检测 |
| 卡片连线（节点间关系） | ❌ | 无 edge/connection 数据模型 |
| 虚线框连线（组间关系） | ❌ | boundedGroups 无 inter-group relation 字段 |
| 流程卡片连线 | ❌ | businessFlowTree 无 edge 连接数据 |
| 起止节点标记 | ❌ | 流程节点无 start/end type 区分 |
| 位置布局优化 | ❌ | 卡片绝对位置固定，无 DAG 布局算法 |

### 2.3 数据模型审计

```typescript
// canvasStore 中的数据结构（推断）
boundedGroups: BoundedGroup[]       // 有 groupId, domainType, nodeIds
// ❌ 缺少: interGroupRelations: { from: groupId, to: groupId, type: RelationType }[]

businessFlowTree: FlowNode[]        // 树形结构
// ❌ 缺少: flowEdges: { from: nodeId, to: nodeId, type: 'sequence'|'branch'|'loop' }[]
// ❌ 缺少: startNodeId, endNodeIds[]

componentNodes: ComponentNode[]     // 组件节点
// ❌ 缺少: nodeEdges: { from: nodeId, to: nodeId, type: 'import'|'render'|'call' }[]
```

---

## 3. 方案对比

### 方案 A：轻量化 CSS + 状态增强 + 可编辑画布（全屏展开核心）

**全屏展开 = 可编辑画布**：

| 改动 | 实现方式 | 工时 |
|------|---------|------|
| 添加 `expand-both` 模式 | grid-template-columns: `1fr 1fr 1fr` 固定 | 2h |
| 添加 `maximize` 模式 | 隐藏 Toolbar/ProjectBar，padding→0 | 3h |
| **可编辑模式：拖拽调整卡片位置** | `node-position-changed` 事件 + canvasStore 持久化 | 5h |
| **可编辑模式：添加/删除/修改连线** | 新增 edge 操作 API + SVG 连线层 CRUD | 8h |
| **可编辑模式：微调对话内容** | 卡片内联编辑 + 内容持久化 | 4h |
| 侧边栏可折叠（快捷键 F11） | visibility toggle | 1h |
| **小计** | | **23h** |

**优势**：真正实现可编辑画布，用户体验完整
**劣势**：工时从 6h → 23h，增幅接近 4 倍；涉及节点拖拽数据模型变更

### 方案 B：SVG 关系可视化层（推荐用于关系）

**限界上下文关系**：

| 改动 | 实现方式 | 工时 |
|------|---------|------|
| 虚线框交集检测 | 矩形交集算法（ Cohen-Sutherland 裁剪） | 4h |
| 交集区域高亮（半透明叠加） | SVG `<clipPath>` + `<rect fill-opacity="0.1">` | 3h |
| 卡片连线（BC→BC） | 新增 `BoundedRelationEdge` SVG layer | 5h |
| **小计** | | **12h** |

**流程节点关系**：

| 改动 | 实现方式 | 工时 |
|------|---------|------|
| start/end 节点标记 | 圆点图标 + 颜色区分 | 2h |
| 流程连线 | 扩展 `BusinessFlowTree` 数据模型 + SVG path | 6h |
| 位置布局算法 | Dagre.js 或 elkjs 层 | 8h |
| 虚线框连线（flow 组间） | `FlowGroupOverlay` 新增 | 4h |
| **小计** | | **20h** |

**优势**：完整的关系可视化能力，Phase3 ReactFlow 迁移时可复用
**劣势**：工时较长（~32h），涉及数据模型变更，可能影响 Phase1 成果

### 方案 C：渐进增强（推荐综合方案，已更新）

将 Phase2 拆为三次迭代：

| 迭代 | 内容 | 工时 |
|------|------|------|
| Phase2a-1 | 全屏展开 CSS + maximize + 可编辑：拖拽 | 13h |
| Phase2a-2 | 可编辑：连线 CRUD + 内联编辑 + 交集高亮 | 14h |
| Phase2b | 连线数据模型 + 卡片/虚线框连线 + 起止标记 | 20h |

**优势**：风险可控，可编辑功能分批交付，第一阶段快速交付可用体验
**劣势**：需要三次发布周期，工时总量增加（~47h）

---

## 4. 推荐方案

**推荐方案 C（渐进增强）**，理由：

1. 全屏展开 = 可编辑画布（Phase2a）是高确定性需求，**工时从 6h 增至 23h**，需拆分控制风险
2. 可编辑模式涉及节点拖拽、连线 CRUD、内联编辑三个子功能，建议作为独立 Epic 管理
3. 关系可视化（Phase2b）复杂度高（~24h），需要数据模型设计，建议 Phase2b 与 Phase3 ReactFlow 迁移合并考虑

---

## 5. 验收标准

### Phase2a：全屏展开 + 交集高亮 + 可编辑画布

- [ ] 三栏展开模式下，点击"全屏展开"按钮，三个面板各占 `1fr`，填满视口
- [ ] 快捷键 `F11` 切换准全屏模式（隐藏 Toolbar、ProjectBar）
- [ ] 两个领域虚线框有交集时，交集区域显示半透明高亮色
- [ ] 全屏展开后，`Escape` 键恢复正常布局
- [ ] `grep -rn "1.5fr" CanvasPage.tsx` → 0（移除旧 expand 逻辑）
- [ ] **可编辑：拖拽卡片后，位置变化持久化到 canvasStore**
- [ ] **可编辑：新增连线后，edge 数据写入 store，刷新后连线保留**
- [ ] **可编辑：双击卡片可内联编辑对话内容，修改后持久化**

### Phase2b：关系可视化

- [ ] 限界上下文之间有连线时，卡片之间绘制 SVG path 连线（带箭头）
- [ ] 流程节点中，start 节点有绿色圆点标记，end 节点有红色方块标记
- [ ] 流程节点之间有分支/循环时，SVG 连线支持分支样式（`-->`）和循环样式（`↩`）
- [ ] 流程分组虚线框之间有连线时，绘制虚线框之间的 path
- [ ] 连线密度过高时（>20条），自动聚类合并显示

---

## 6. 风险评估

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| **可编辑模式数据持久化复杂度** | 高 | 高 | 复用 canvasStore + localStorage，节点位置存 `position: {x,y}` 字段 |
| **连线 CRUD 与现有只读树结构冲突** | 高 | 高 | 区分"树结构（只读生成）"和"画布编辑层（可写）"，通过独立 overlay 处理 |
| 全屏展开与现有 expand 逻辑冲突 | 高 | 中 | Phase2a 先移除旧 1.5fr 逻辑，统一新模式 |
| SVG 连线层遮挡节点交互 | 高 | 高 | `pointer-events: none`；连线层置于底层 |
| 关系数据模型变更影响 Phase1 | 中 | 高 | Phase2b 独立数据模型，不复用 boundedGroups；向后兼容 |
| 布局算法复杂度超预期 | 中 | 中 | 先用固定位置，连线自组织；Dagre 优化放 Phase3 |
| 与 Phase3 ReactFlow 迁移重叠 | 高 | 低 | 关系可视化层独立于 ReactFlow；Phase3 可复用 SVG 层概念 |

---

## 7. 工时估算（已更新 — F1 可编辑约束）

| 阶段 | 功能 | 工时 |
|------|------|------|
| Phase2a | 全屏展开（CSS + maximize） | 6h |
| Phase2a | **可编辑：拖拽卡片位置** | 5h |
| Phase2a | **可编辑：连线 CRUD** | 8h |
| Phase2a | **可编辑：内联内容编辑** | 4h |
| Phase2a | 交集高亮 | 2h |
| Phase2b | 连线数据模型 | 4h |
| Phase2b | 卡片/虚线框连线 | 8h |
| Phase2b | 起止节点标记 | 2h |
| Phase2b | 位置布局 | 8h |
| **合计** | | **47h** |

---

## 8. 开放问题

1. 限界上下文之间的关系数据从哪来？（API 返回 / 用户手动绘制 / AI 推导？）
2. 流程分支/循环的连线样式是否有设计规范？
3. Phase3 ReactFlow 迁移计划是否已确定？Phase2 的 SVG 连线层是否需要兼容 ReactFlow？
4. **可编辑模式**：拖拽后的位置数据是否需要同步到后端 API，还是仅存 localStorage？
5. **可编辑模式**：卡片内容修改的版本控制如何处理？（多人协作 vs 单用户）
