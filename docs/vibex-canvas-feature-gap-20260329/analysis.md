# VibeX Canvas 功能差距分析报告

> 分析日期: 2026-03-29
> 分析范围: VibeX 画布页 (CardTree / FlowCanvas / MermaidCanvas)
> 分析目的: 识别当前画布功能差距，对标竞品，输出优先级矩阵和实现建议

---

## 一、当前画布功能盘点

### 1.1 画布架构概览

VibeX 画布页 (`/canvas`) 采用**三树并行架构**，由 `CanvasPage` 容器统一管理，分为三个子画布：

| 子画布 | 组件 | 技术栈 | 核心功能 |
|--------|------|--------|----------|
| 限界上下文树 | `BoundedContextTree` | 自定义垂直列表 | AI生成、CRUD、关系连接器、确认状态 |
| 业务流程树 | `BusinessFlowTree` | 自定义垂直列表 + 拖拽排序 | AI生成、Step拖拽排序、级联状态 |
| 组件树 | `ComponentTree` | 自定义垂直列表 | AI生成、预览、页面分组 (E1) |

另有三个可视化渲染器（位于 `visualization/`）：
- `CardTreeRenderer` — 基于 ReactFlow 的卡片树可视化（垂直布局）
- `FlowRenderer` — 基于 ReactFlow 的流程图可视化
- `MermaidRenderer` — Mermaid SVG 渲染

**核心状态管理**: `canvasStore.ts` (Zustand)，按 context/flow/component/phase/queue/drag/expand 分 slice 管理。

---

### 1.2 已实现功能清单

#### 🔷 阶段与流程管理
- [x] 5 阶段进度条 (`input → context → flow → component → prototype`)
- [x] 阶段点击回退（可回到更早阶段）
- [x] 阶段锁定机制（context 未确认不可进入 flow，flow 未确认不可进入 component）
- [x] AI Thinking 状态指示器（spinner + 消息）
- [x] 原型队列面板 (`PrototypeQueuePanel`) 及进度追踪

#### 🔷 三树面板
- [x] 三栏横向布局 + 移动端 Tab 切换模式
- [x] 面板折叠/展开 (`toggleContextPanel` 等)
- [x] 三栏展开切换（`leftExpand`/`centerExpand`/`rightExpand`，E2）
- [x] Hover 热区视觉增强（`HoverHotzone`，E2-3）
- [x] 移动端 Tab 模式自动展开当前面板（E2-2）
- [x] 阶段标签实时显示（节点数 + 确认状态 ✅）

#### 🔷 限界上下文树
- [x] AI 生成限界上下文（`generateContextsFromRequirement`，调用 `canvasApi`）
- [x] 上下文节点 CRUD（添加、编辑、删除）
- [x] 节点状态：`pending`(黄) / `generating` / `confirmed`(绿) / `error`(红)
- [x] 节点类型标签：`core`(橙) / `supporting` / `generic` / `external`
- [x] 关系连接器 (`RelationshipConnector`) — 拖拽创建上下文间关系
- [x] 节点确认机制（checkbox 确认）
- [x] 级联标记（context 变更 → flow + component 标记 pending）

#### 🔷 业务流程树
- [x] 基于已确认 context 自动生成 flow（`autoGenerateFlows`，E3-1 修复）
- [x] Flow 节点 CRUD + 展开/折叠
- [x] Step 行：拖拽排序（视觉手柄）、上移/下移按钮
- [x] Step 类型：`normal` / `branch` / `loop`（E3）
- [x] 节点状态 + 确认机制
- [x] 继续 → 组件树按钮（携带用户编辑后的 context 数据）

#### 🔷 组件树
- [x] 基于已确认 flow 生成组件（`handleContinueToComponents`）
- [x] 组件节点 CRUD
- [x] 组件类型：`page` / `form` / `list` / `detail` / `modal`
- [x] API 设计（method + path + params）
- [x] 节点状态 + 确认机制
- [x] 组件树页面分组（`ComponentGroupOverlay`，E1）- 虚线框按 flowId 分组，通用组件独立置顶（E2）

#### 🔷 ReactFlow 可视化层（CardTreeRenderer）
- [x] 垂直卡片布局（ReactFlow）
- [x] 自定义节点类型注册（`CardTreeNode`、`GatewayNode`）
- [x] 自定义边类型（`LoopEdge`、`RelationshipEdge`）
- [x] 节点拖拽位置保存（`draggedPositions`，E3）
- [x] Controls / MiniMap / Background
- [x] BoundedGroupOverlay — SVG 虚线框叠加层（E4）
- [x] 节点点击展开/折叠
- [x] Gateway 节点（分支/循环）支持

#### 🔷 其他画布渲染器
- [x] `FlowRenderer` — 基础 ReactFlow 流程图（节点/边/最小地图/缩放）
- [x] `MermaidRenderer` — Mermaid SVG 渲染（加载/错误/空状态，节点点击）

#### 🔷 数据与导出
- [x] 示例数据导入 (`loadExampleData`)
- [x] 项目创建（`createProject` API）
- [x] sessionId 链路追踪
- [x] localStorage 持久化

---

## 二、竞品功能对比

> 参考竞品: **v0.dev** (AI 产品生成)、**Excalidraw** (无限画布)、**Miro** (协作白板)、**FigJam** (设计协作)、**Notion AI Canvas** (知识画布)

### 2.1 竞品功能矩阵

| 功能维度 | VibeX | v0.dev | Excalidraw | Miro | FigJam | 说明 |
|----------|-------|--------|------------|------|--------|------|
| **基础画布** |
| 自由画布（无限滚动/缩放） | ❌ | ✅ | ✅ | ✅ | ✅ | v0 有虚拟画布；VibeX 是树形结构 |
| 手绘/草图风格 | ❌ | ❌ | ✅ | ❌ | ✅ | Excalidraw 标志特性 |
| 多人实时协作 | ❌ | ❌ | ✅ | ✅ | ✅ | v0 是异步；VibeX 无协作 |
| 评论/锚点标注 | ❌ | ❌ | ✅ | ✅ | ✅ | 协作标配 |
| **节点编辑** |
| 节点内联编辑 | ✅ | ✅ | ✅ | ✅ | ✅ | VibeX 已实现 |
| 节点复制/粘贴 | ❌ | ✅ | ✅ | ✅ | ✅ | 高频操作 |
| 节点多选 + 批量操作 | ❌ | ✅ | ✅ | ✅ | ✅ | 效率关键 |
| 节点自由拖拽（非树形） | ⚠️ E3 | ✅ | ✅ | ✅ | ✅ | CardTreeRenderer 已支持 |
| 节点锁定 | ❌ | ✅ | ✅ | ✅ | ✅ | 防误操作 |
| **连接与关系** |
| 自由边（拖拽创建） | ⚠️ 关系连接器 | ✅ | ✅ | ✅ | ✅ | VibeX 仅限上下文关系 |
| 边类型（直线/曲线/正交） | ⚠️ 仅 smoothstep | ✅ | ✅ | ✅ | ✅ | Excalidraw 多种模式 |
| 边的标签/注释 | ⚠️ 仅 loop edge | ✅ | ✅ | ✅ | ✅ | 大量缺失 |
| 边的箭头/端点样式 | ⚠️ 仅默认箭头 | ✅ | ✅ | ✅ | ✅ | 可配置性不足 |
| **布局与对齐** |
| 自动布局（dagre/elk） | ❌ | ✅ | ✅ | ✅ | ✅ | 竞品均有；VibeX 纯手动 |
| 网格吸附 | ❌ | ✅ | ✅ | ✅ | ✅ | 效率关键 |
| 元素对齐辅助线 | ❌ | ❌ | ✅ | ✅ | ✅ | Excalidraw 特有 |
| **视图与导航** |
| 最小地图导航 | ⚠️ 有但不完善 | ✅ | ✅ | ✅ | ✅ | CardTreeRenderer 有 |
| 缩略图概览 | ❌ | ✅ | ❌ | ✅ | ✅ | 快速定位 |
| 全屏演示模式 | ❌ | ✅ | ✅ | ✅ | ✅ | 展示场景 |
| 锁定缩放级别 | ❌ | ✅ | ✅ | ✅ | ✅ | 防止误操作 |
| **AI 能力** |
| 自然语言添加节点 | ✅ | ✅ | ✅ | ❌ | ❌ | 核心能力 |
| AI 重写/优化内容 | ❌ | ✅ | ❌ | ✅ | ✅ | v0 的强项 |
| AI 生成图片填充 | ❌ | ✅ | ✅ | ❌ | ✅ | 快速原型 |
| AI 解释选中节点 | ❌ | ✅ | ❌ | ❌ | ❌ | v0 特有 |
| **导入导出** |
| 导入 JSON/Excel | ❌ | ❌ | ✅ | ✅ | ✅ | 竞品均有 |
| 导出 PNG/SVG/PDF | ❌ | ✅ | ✅ | ✅ | ✅ | v0/Excalidraw 强项 |
| 导出代码（Mermaid等） | ⚠️ Mermaid渲染 | ✅ | ✅ | ✅ | ✅ | 可增强 |
| **原型生成** |
| 从节点生成可交互原型 | ✅ | ✅ | ⚠️ | ⚠️ | ✅ | VibeX 核心功能 |
| 原型预览/播放 | ✅ | ✅ | ❌ | ⚠️ | ⚠️ | VibeX 有队列 |
| **个性化** |
| 主题定制（颜色/字体） | ❌ | ✅ | ✅ | ✅ | ✅ | 无品牌适配 |
| 画布背景样式 | ❌ | ❌ | ✅ | ✅ | ✅ | 点/线/方格等 |
| 快捷键系统 | ❌ | ✅ | ✅ | ✅ | ✅ | 高效操作 |
| **搜索与筛选** |
| 画布内全局搜索 | ❌ | ✅ | ✅ | ✅ | ✅ | 节点多了必需 |
| 按类型/状态筛选节点 | ❌ | ❌ | ✅ | ✅ | ✅ | 大型项目必需 |
| **撤销/重做** |
| 操作历史撤销/重做 | ⚠️ 仅 localStorage | ✅ | ✅ | ✅ | ✅ | 核心功能缺失 |
| 版本快照 | ❌ | ❌ | ✅ | ✅ | ✅ | 可回溯 |

---

## 三、功能差距分析

### 3.1 缺失功能详细清单

#### 🚨 高优先级差距 (Critical Gaps)

**G1: 撤销/重做系统 (Undo/Redo)**
- **现状**: 仅通过 localStorage 持久化，无操作级撤销
- **影响**: 用户误操作后无法回退，高风险功能
- **参考**: Excalidraw 历史记录、v0.dev command history
- **实现成本**: 🟡 Medium（需引入状态快照机制，UndoManager）
- **用户价值**: ⭐⭐⭐⭐⭐

**G2: 节点多选 + 批量操作**
- **现状**: 仅支持单节点操作
- **影响**: 编辑效率极低，多节点管理不可行
- **参考**: Excalidraw shift+click / 框选
- **实现成本**: 🟡 Medium（需 ReactFlow selection + 批量 store action）
- **用户价值**: ⭐⭐⭐⭐⭐

**G3: 全局搜索 + 筛选**
- **现状**: 无任何搜索能力
- **影响**: 节点数量增加后无法快速定位
- **参考**: Miro 搜索面板、Excalidraw CMD+P
- **实现成本**: 🟢 Low（前端 filter + 高亮）
- **用户价值**: ⭐⭐⭐⭐⭐

**G4: 自动布局引擎**
- **现状**: 完全依赖手动拖拽
- **影响**: 大量节点时布局耗时，CardTreeRenderer 无自动排列
- **参考**: dagre/elk.js 自动布局算法
- **实现成本**: 🔴 High（需集成布局库 + 适配 ReactFlow）
- **用户价值**: ⭐⭐⭐⭐

#### ⚠️ 中优先级差距 (Important Gaps)

**G5: 边的富文本标签与样式**
- **现状**: 仅 loop edge 有 label，其他边无标签
- **影响**: 关系语义不清晰
- **实现成本**: 🟢 Low（扩展 Edge 组件）
- **用户价值**: ⭐⭐⭐

**G6: 边类型多样性**
- **现状**: 仅 `smoothstep`，无直线/正交/贝塞尔选项
- **影响**: 无法适配不同审美偏好
- **实现成本**: 🟢 Low（ReactFlow `edgeOptions` 配置）
- **用户价值**: ⭐⭐

**G7: 网格吸附**
- **现状**: 无网格，节点位置自由漂浮
- **影响**: 布局不够整齐
- **实现成本**: 🟢 Low（ReactFlow `snapGrid` 配置）
- **用户价值**: ⭐⭐⭐

**G8: 节点复制/粘贴**
- **现状**: 无此功能
- **影响**: 重复节点需重新创建
- **实现成本**: 🟢 Low（clipboard API + store action）
- **用户价值**: ⭐⭐⭐⭐

**G9: 导出能力（PNG/SVG/JSON）**
- **现状**: 仅 Mermaid 渲染，无导出
- **影响**: 无法分享静态图，无法嵌入外部文档
- **实现成本**: 🟡 Medium（html-to-image + ReactFlow toJSON）
- **用户价值**: ⭐⭐⭐

**G10: 快捷键系统**
- **现状**: 无任何快捷键
- **影响**: 效率用户操作繁琐
- **参考**: Excalidraw CMD+Z/CMD+D/CMD+G
- **实现成本**: 🟢 Low（`useHotkeys` hook）
- **用户价值**: ⭐⭐⭐

**G11: 节点锁定**
- **现状**: 所有节点均可编辑
- **影响**: 确认后的节点可能被误改
- **实现成本**: 🟢 Low（readonly 模式扩展）
- **用户价值**: ⭐⭐⭐

**G12: 导入能力（JSON/Excel）**
- **现状**: 仅支持示例数据导入
- **影响**: 无法接入外部数据源
- **实现成本**: 🟡 Medium（文件解析 + schema 验证）
- **用户价值**: ⭐⭐

#### 📋 低优先级差距 (Nice-to-Haves)

**G13: 多人实时协作** — 架构改造成本极高，中长期目标
**G14: 自由画布模式** — 需架构重构，当前树形结构不适合
**G15: 手绘/草图风格** — 美学增强，非核心
**G16: AI 重写/优化节点内容** — 依赖 LLM 能力扩展
**G17: 主题定制系统** — UI 增强，非 MVP 必需
**G18: 画布背景样式切换** — 美学增强
**G19: 全屏演示模式** — 展示场景，非核心
**G20: 版本快照对比** — 中期目标，需版本化数据模型

---

## 四、优先级矩阵

> 矩阵维度: **用户价值** (1-5⭐) × **实现成本** (🟢Low / 🟡Medium / 🔴High)
> 颜色标注: 🟢 MVP候选（≤2天可上线） / 🟡 短期迭代 / 🔴 中长期规划

```
用户价值
   5⭐
   4⭐  ┌──────────────────────────────────────────┐
        │  [G1] Undo/Redo        [G2] 多选+批量操作 │
        │  [G3] 全局搜索+筛选    [G8] 复制/粘贴     │
   3⭐  ├──────────────────────────────────────────┤
        │  [G11] 节点锁定          [G10] 快捷键     │
        │  [G5] 边富文本标签       [G7] 网格吸附   │
        │  [G9] 导出能力           [G6] 边类型多样  │
   2⭐  ├──────────────────────────────────────────┤
        │  [G4] 自动布局引擎      [G12] 导入能力   │
   1⭐  │  [G13-20] 低优先级功能                       │
        └──────────────────────────────────────────┘
         🟢Low    🟡Medium    🔴High
                  实现成本
```

### 详细优先级排序

| 优先级 | ID | 功能 | 用户价值 | 实现成本 | 预计工时 | 理由 |
|--------|-----|------|----------|----------|----------|------|
| 🥇 P0 | G3 | 全局搜索+筛选 | ⭐⭐⭐⭐⭐ | 🟢 Low | 1天 | 最小成本，最大收益，解决找节点痛点 |
| 🥇 P0 | G8 | 节点复制/粘贴 | ⭐⭐⭐⭐ | 🟢 Low | 1天 | 高频操作，VibeX 节点复用场景多 |
| 🥇 P0 | G10 | 快捷键系统 | ⭐⭐⭐ | 🟢 Low | 1天 | 效率提升显著，Excalidraw 标配 |
| 🥈 P1 | G1 | 撤销/重做系统 | ⭐⭐⭐⭐⭐ | 🟡 Medium | 2天 | 核心防错机制，UndoManager 实现 |
| 🥈 P1 | G2 | 节点多选+批量操作 | ⭐⭐⭐⭐⭐ | 🟡 Medium | 2天 | 效率关键，ReactFlow selection API |
| 🥈 P1 | G11 | 节点锁定 | ⭐⭐⭐ | 🟢 Low | 0.5天 | 防误操作，确认后锁定 |
| 🥈 P1 | G5 | 边富文本标签 | ⭐⭐⭐ | 🟢 Low | 0.5天 | 关系语义增强 |
| 🥉 P2 | G7 | 网格吸附 | ⭐⭐⭐ | 🟢 Low | 0.5天 | 布局整齐度 |
| 🥉 P2 | G6 | 边类型多样性 | ⭐⭐ | 🟢 Low | 0.5天 | 审美偏好适配 |
| 📋 P3 | G9 | 导出能力 | ⭐⭐⭐ | 🟡 Medium | 2天 | 分享和嵌入场景 |
| 📋 P3 | G4 | 自动布局引擎 | ⭐⭐⭐⭐ | 🔴 High | 5天 | 长期目标，dagre 集成 |
| 🔜 P4 | G12 | 导入能力 | ⭐⭐ | 🟡 Medium | 2天 | 数据接入 |
| ⏳ P5+ | G13-20 | 协作/自由画布等 | 视情况 | 🔴 High | 未知 | 中长期目标 |

---

## 五、MVP 快速实现清单 (3天内可上线)

以下 6 个功能点可在 **3 天内**完成，可作为 MVP 版本发布：

### Day 1: 搜索 + 锁定 + 边标签
| 功能 | 实现要点 | 工时估计 |
|------|----------|----------|
| **G3: 全局搜索** | 在 CanvasPage 顶部加搜索框，`useMemo` filter `contextNodes/flowNodes/componentNodes`，高亮匹配节点，scrollIntoView | 4h |
| **G11: 节点锁定** | `BoundedContextNode` 等类型增加 `locked: boolean`，确认后自动锁定；编辑时检查 `locked`，展示 🔒 图标 | 3h |
| **G5: 边富文本标签** | `RelationshipEdge` / 默认 edge 增加 `label` 渲染，支持自定义 label 内容 | 2h |

### Day 2: 快捷键 + 网格 + 边类型
| 功能 | 实现要点 | 工时估计 |
|------|----------|----------|
| **G10: 快捷键系统** | `useHotkeys` hook (react-hotkeys-hook)，支持：CMD+Z 撤销、CMD+D 复制、Delete 删除、CMD+L 锁定/解锁、CMD+F 搜索、Arrow 导航 | 4h |
| **G7: 网格吸附** | ReactFlow `snapGrid` 配置，`CardTreeRenderer` / `FlowRenderer` 添加 `snapToGrid` prop | 2h |
| **G6: 边类型选择** | 在 canvasStore 增加 `edgeStyle` 选项（smoothstep/bezier/step），ReactFlow `defaultEdgeOptions` | 2h |

### Day 3: 复制粘贴
| 功能 | 实现要点 | 工时估计 |
|------|----------|----------|
| **G8: 节点复制/粘贴** | `useCopyPaste` hook：clipboard 序列化节点，CMD+C/V 操作，支持跨节点类型复制（自动映射字段），粘贴时生成新 nodeId | 4h |

---

## 六、架构增强建议

### 6.1 撤销/重做引擎 (UndoManager)

建议引入命令模式（Command Pattern）封装所有 store mutations：

```typescript
// 每次 mutation 封装为 Command
interface Command {
  execute(): void;
  undo(): void;
  description: string;
}

// canvasStore 新增 slice
interface UndoRedoSlice {
  past: Command[];
  future: Command[];
  executeCommand(cmd: Command): void;
  undo(): void;
  redo(): void;
}
```

**依赖**: G1 依赖 G3/G8 的完成，因为撤销的内容包括搜索和复制操作。

### 6.2 布局引擎接口

为未来自动布局预留接口：

```typescript
interface LayoutEngine {
  layout(nodes: Node[], direction: 'TB' | 'LR' | 'RL'): Node[];
}

// 可选的布局引擎
const DagreLayoutEngine: LayoutEngine; // dagre
const ElkLayoutEngine: LayoutEngine;    // elk.js
const ForceLayoutEngine: LayoutEngine; // d3-force
```

### 6.3 多选 Selection Store

```typescript
interface SelectionSlice {
  selectedNodeIds: Set<string>;
  selectNode(id: string, additive?: boolean): void;
  deselectNode(id: string): void;
  selectAll(): void;
  clearSelection(): void;
  /** 批量操作 */
  batchConfirm(ids: string[]): void;
  batchDelete(ids: string[]): void;
  batchCopy(ids: string[]): void;
}
```

---

## 七、总结

### 7.1 核心发现

1. **VibeX 画布差异化优势**: DDD 领域建模 + AI 生成 + 原型一体化，这是 v0.dev/Excalidraw/Miro 均不具备的垂直场景。核心护城河在于 context/flow/component 三树联动和 AI 生成流。

2. **最大差距**: 画布基础交互能力（撤销/重做、多选、搜索）与竞品存在代差。这些是用户期望的基础能力，不应有明显缺失。

3. **可快速追赶**: 通过 3 天的 MVP 开发，可补齐最关键的 6 个功能点（G3/G11/G5/G10/G7/G6/G8），使画布交互体验接近 Excalidraw 的 80%。

4. **差异化演进方向**: 长期看，应在「AI 生成增强」和「DDD 可视化」两个方向构建护城河，而非追赶 Excalidraw 的手绘/协作功能。

### 7.2 推荐实施路线图

```
Phase 1 (1周): MVP 6项基础交互
  Day1-3: 搜索 + 锁定 + 边标签 + 快捷键 + 网格 + 边类型 + 复制粘贴
  → 画布基础交互达标

Phase 2 (1周): 撤销/重做 + 多选批量操作
  → 核心防错 + 效率工具

Phase 3 (2周): 导出能力 + 导入能力 + 自动布局
  → 生态集成 + 长期竞争力

Phase 4 (长期): 协作/自由画布/主题系统
  → 差异化深耕
```

---

*报告生成: vibex-canvas-feature-gap-20260329*
*分析人: Analyst Agent*
*审查状态: 待 PM + Architect Review*
