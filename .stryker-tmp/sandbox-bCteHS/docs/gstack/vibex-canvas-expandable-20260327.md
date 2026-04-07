# Design: VibeX 卡片画布增强 — 三栏双向展开 + 拖拽 + 虚线领域框

**项目**: vibex-canvas-expandable-20260327
**状态**: DRAFT
**作者**: Coord Agent（基于 gstack 源码分析）
**日期**: 2026-03-27

---

## 1. 当前状态分析

### 1.1 已实现能力（gstack 源码验证）

| 功能 | 文件 | 状态 |
|------|------|------|
| 三栏网格布局（1fr 1fr 1fr） | canvas.module.css `.treePanelsGrid` | ✅ |
| 面板折叠/展开动画 | canvasStore.ts + canvas.module.css | ✅ |
| 分支节点 GatewayNode（菱形 XOR/OR） | nodes/GatewayNode.tsx | ✅ Epic2 |
| 循环边 LoopEdge（红色虚线） | edges/LoopEdge.tsx | ✅ Epic2 |
| 关系边 RelationshipEdge（实线/虚线/粗实线） | edges/RelationshipEdge.tsx | ✅ Epic1 |
| ReactFlow 卡片树渲染 | CardTreeRenderer.tsx | ✅ |
| 阶段进度条 + 面板激活 | PhaseProgressBar + canvasStore | ✅ |

### 1.2 缺失能力（需新增）

| 功能 | 优先级 | 难度 |
|------|--------|------|
| **双向展开**（各栏可向相邻栏扩展宽度） | P0 | 中 |
| **卡片拖拽排序**（卡片可自由移动位置） | P0 | 中 |
| **虚线领域框**（虚线框包裹相关卡片组） | P1 | 低 |
| 拖拽时自动布局重算（dagre） | P1 | 中 |
| 展开动画的平滑过渡 | P2 | 低 |

---

## 2. 核心设计：双向展开机制

### 2.1 展开方向规则

```
左侧栏 ──→ [向右展开] ──→ 中间栏（默认占 1fr）
中间栏 ──→ [向左扩展] + [向右扩展] ──→ 两侧栏
右侧栏 ──→ [向左展开] ──→ 中间栏（默认占 1fr）
```

### 2.2 宽度体系

| 状态 | 左侧栏 | 中间栏 | 右侧栏 | 说明 |
|------|--------|--------|--------|------|
| **默认** | 1fr | 1fr | 1fr | 三等分 |
| **左展** | 1.5fr | 0.75fr | 0.75fr | 左侧扩展50%，中间+右侧各收缩25% |
| **右展** | 0.75fr | 0.75fr | 1.5fr | 右侧扩展50% |
| **中左展** | 1.5fr | 1.5fr | 0fr (collapsed) | 中间向左扩，左栏向右扩 |
| **中右展** | 0fr (collapsed) | 1.5fr | 1.5fr | 中间向右扩，右栏向左扩 |
| **全展** | 1fr | 1fr | 1fr | 三栏等分 + 面板可拖拽调整宽度 |

### 2.3 交互设计

**展开触发**：
- 悬停面板边缘（8px 热区）→ 显示展开指示器（双向箭头图标）
- 点击边缘热区 → 触发该方向展开
- 双击热区 → 全展开（恢复默认三等分）

**展开动画**：
- CSS `transition: grid-template-columns 300ms ease-in-out`
- 卡片位置不变，仅容器宽度变化
- 最小宽度保护：`min-width: 200px`（防止卡片被压扁）

**实现方式**：
```typescript
// canvasStore 新增 slice
interface CanvasExpandState {
  leftExpand: 'none' | 'expand-right' | 'full';
  rightExpand: 'none' | 'expand-left' | 'full';
  centerExpand: 'none' | 'expand-left' | 'expand-right' | 'full';
  activePanel: TreeType | null; // 当前激活展开的面板
}

// gridTemplate 计算
function getGridTemplate(state: CanvasExpandState): string {
  const base = 1; // 基础 1fr
  // 详细计算见 2.2 表格
}
```

---

## 3. 卡片拖拽排序

### 3.1 技术方案

**方案选型**：ReactFlow 内置 Drag & Drop（`@xyflow/react` v12+）

ReactFlow 12+ 支持 `nodesDraggable` + `nodesConnectable` 属性，配合自定义 `onNodesChange` 实现拖拽排序。

**备选**：@dnd-kit/core（更灵活但引入新依赖）

### 3.2 拖拽行为

| 场景 | 行为 |
|------|------|
| 卡片拖拽 | 在当前面板内自由移动位置，释放后自动吸附到网格 |
| 跨面板拖拽 | **不支持**（三栏职责分离，跨栏移动需通过"阶段推进"机制） |
| 拖拽时 | 显示半透明占位符（ghost card），原位置虚线框占位 |
| 释放 | 卡片平滑过渡到新位置，自动重算上下游关系边 |
| 自动布局 | 拖拽结束后 200ms 延迟 → 触发 dagre 自动布局（避免频繁重算） |

### 3.3 数据结构

```typescript
// BoundedContextNode / BusinessFlowNode / ComponentNode 扩展
interface DraggableNode {
  position: { x: number; y: number }; // 用户手动设置的位置（优先级高于自动布局）
  autoLayout: boolean; // true=跟随自动布局，false=跟随用户拖拽
  groupId?: string; // 虚线框分组 ID（用于领域框）
}

// 自动布局优先级：
// 1. 用户手动拖拽位置（position 被显式设置） → 固定位置
// 2. 无手动位置 → 自动 dagre 布局
```

---

## 4. 虚线领域框

### 4.1 视觉规范

```
┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐   ← 虚线边框（#888, stroke-dasharray: 5,3）
│   领域名称（右上角）   │   ← 标签在框内右上角
│  ┌────┐  ┌────┐     │
│  │卡片│  │卡片│     │   ← 卡片在框内正常渲染
│  └────┘  └────┘     │
└ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘
```

### 4.2 数据结构

```typescript
interface BoundedContextGroup {
  groupId: string;
  label: string;
  color: string; // 边框颜色（与 TreeType 对应）
  nodeIds: string[]; // 属于该组的节点 ID
  position?: { x: number; y: number }; // 可选，手动调整位置
}

// 关系边与领域框联动：
// - 跨框边：虚线 + 箭头，穿越边框时自动打断
// - 框内边：实线，连接框内节点
```

### 4.3 实现方案

使用 ReactFlow 的 **Custom Parent Node** 模式：
- 每个领域框是一个 `GroupNode`（无交互的容器节点）
- 内部卡片作为子节点通过 `parentId` 关联
- ReactFlow 自动处理子节点在父节点内的布局

---

## 5. 技术架构

### 5.1 文件变更

| 文件 | 改动 |
|------|------|
| `canvasStore.ts` | 新增 `CanvasExpandState` slice |
| `canvas.module.css` | 扩展 `.treePanelsGrid` 支持动态 grid-template-columns |
| `CanvasPage.tsx` | 集成展开/折叠交互逻辑 |
| `DraggableCardTreeRenderer.tsx` | 新建，封装 ReactFlow 拖拽能力 |
| `BoundedGroupNode.tsx` | 新建，虚线领域框组件 |
| `canvas/edges/LoopEdge.tsx` | 已有，验证通过 ✅ |
| `canvas/nodes/GatewayNode.tsx` | 已有，验证通过 ✅ |
| `canvas/edges/RelationshipEdge.tsx` | 已有，验证通过 ✅ |

### 5.2 新增依赖

**无需新依赖** — 所有功能均基于现有技术栈：
- ReactFlow（已有 v12）→ 拖拽 + Custom Node
- CSS Grid → 动态宽度展开
- dagre → 自动布局（已有）

### 5.3 性能考虑

| 场景 | 方案 |
|------|------|
| 拖拽时频繁重算 | 使用 `requestAnimationFrame` 节流，200ms 防抖 |
| 大量节点展开 | 虚拟化（ReactWindow）— 后续 P2 优化 |
| 自动布局计算 | Web Worker 中计算，避免阻塞主线程 |

---

## 6. Epic 拆分

### Epic E1: 三栏双向展开
- **范围**: canvasStore ExpandState + CSS Grid 动态宽度 + 热区交互
- **工时**: ~2h
- **验证**: gstack 截图：悬停热区显示展开箭头，三栏宽度按预期变化

### Epic E2: 卡片拖拽排序
- **范围**: DraggableCardTreeRenderer + onNodesChange + 自动布局触发
- **工时**: ~3h
- **验证**: gstack 截图：卡片可拖动，释放后自动吸附 + 重算边

### Epic E3: 虚线领域框
- **范围**: BoundedGroupNode + 跨框边处理
- **工时**: ~1h
- **验证**: gstack 截图：虚线框包裹相关卡片，关系边正确穿越

### Epic E4: 回归测试
- **范围**: Playwright E2E
- **工时**: ~1h

---

## 7. 验收标准

| 功能 | 验收条件 |
|------|---------|
| 左侧栏向右展开 | 悬停左栏右边缘 → 显示展开图标 → 点击 → 左栏变宽 50%，中间栏同步收缩，动画平滑 |
| 中间栏双向展开 | 同上，触发左侧热区 → 左栏+中间栏各扩 50%；触发右侧热区 → 中间栏+右栏各扩 50% |
| 卡片拖拽 | 拖动任意卡片 → 释放 → 卡片移动到新位置，关系边自动重连 |
| 虚线领域框 | 同一领域的多个卡片被虚线框包裹，跨框关系边正确渲染 |
| 全场景回归 | npm build ✅ + TypeScript 0 error + Playwright 100% pass |

---

## 8. Open Questions

- [ ] 展开时面板最小宽度是否需要用户可配置？
- [ ] 拖拽排序是否需要历史记录（Undo/Redo）？
- [ ] 虚线领域框是否需要支持手动创建/删除？
- [ ] 移动端（< 768px）展开行为如何处理？

---

*分析完成时间: 2026-03-27 01:27 UTC+8*
