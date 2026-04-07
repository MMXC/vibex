# VibeX Canvas 持续改进架构设计

> **项目**: vibex-canvas-continu  
> **状态**: Architecture v1.0  
> **日期**: 2026-03-29  
> **基于**: `vibex-canvas-feature-gap-20260329/prd.md` + `vibex-canvas-feature-gap-20260329/analysis.md`  
> **工作目录**: /root/.openclaw/vibex

---

## 1. 执行摘要

本架构设计针对 VibeX 三树画布（FlowCanvas）的持续改进需求，基于功能差距分析（18 个缺失功能点，P0–P3 分级）制定系统化演进方案。

**核心架构原则**：
- **持久化优先** — 让画布数据可靠存储，解除核心阻塞
- **渐进增强** — 优先实现高价值低成本功能，分阶段交付
- **状态解耦** — 三树独立状态管理 + 统一 Undo/Redo 历史栈
- **API 先行** — 持久化 API 为所有高级功能提供基础设施

---

## 2. 系统架构总览

```
┌─────────────────────────────────────────────────────────────────┐
│                        FlowCanvas Page                          │
├──────────────────┬──────────────────┬───────────────────────────┤
│  BoundedContext  │   BusinessFlow   │     ComponentTree        │
│    TreePanel     │    TreePanel     │      TreePanel            │
│                  │                  │                           │
│  · ReactFlow    │  · ReactFlow     │  · ReactFlow              │
│  · MiniMap      │  · MiniMap       │  · MiniMap                │
│  · Controls     │  · Controls      │  · Controls               │
│  · GatewayNodes │  · GatewayNodes  │  · GatewayNodes           │
│  · LoopEdges    │  · LoopEdges     │  · LoopEdges              │
│  · Relationship  │  · Relationship  │  · Relationship           │
│    Edges (P2)    │    Edges (P2)    │    Edges (P2)             │
└──────────────────┴──────────────────┴───────────────────────────┘
                              │
                    ┌─────────┴──────────┐
                    │   CanvasStore      │
                    │  (Zustand)         │
                    │                    │
                    │  · treeStates     │
                    │  · selectionState │
                    │  · uiState        │
                    │  · historyStack   │  ← Undo/Redo 统一历史
                    │  · persistenceLayer│
                    └─────────┬──────────┘
                              │
         ┌────────────────────┼────────────────────┐
         │                    │                    │
  ┌──────┴──────┐    ┌───────┴───────┐    ┌──────┴──────┐
  │ localStorage │    │  canvasApi    │    │  SSE Stream  │
  │  (热缓存)    │    │  (持久化层)    │    │  (AI生成流)   │
  └─────────────┘    └───────┬───────┘    └─────────────┘
                              │
                    ┌─────────┴──────────┐
                    │   Canvas Backend    │
                    │  /api/canvas/*     │
                    └────────────────────┘
```

---

## 3. 核心模块设计

### 3.1 CanvasStore（状态管理）

**位置**: `src/store/canvasStore.ts`

```typescript
interface CanvasStore {
  // 三树状态（独立管理）
  treeStates: {
    context: TreeState;
    flow: TreeState;
    component: TreeState;
  };

  // 统一历史栈（Undo/Redo）
  history: {
    past: HistoryEntry[];   // max 50
    future: HistoryEntry[];
  };

  // 持久化层
  persistence: {
    localStorage: PersistenceLayer;
    api: CanvasApiClient;
    syncStatus: 'synced' | 'pending' | 'error';
  };

  // UI 状态
  ui: {
    search: SearchState;
    zoom: number;
    panels: PanelState;
  };
}
```

**关键设计决策**：
- 三树状态独立存储，独立更新，互不阻塞
- 统一历史栈记录所有跨树操作（通过 `recordAction()` 包装）
- `partialize` 排除瞬时 UI 状态（如 hover）到 localStorage

---

### 3.2 PersistenceLayer（持久化）

**位置**: `src/store/persistence/`

```
PersistenceLayer
├── LocalStorageAdapter   — Zustand persist middleware
│   └── partialize 排除: uiState, selectionState
├── ApiPersistenceAdapter — 后台异步节流写入
│   └── throttle: 2000ms
└── ConflictResolver      — localStorage vs API 冲突处理
    └── 策略: API 数据优先 + 用户确认
```

**三层持久化策略**：
1. **localStorage 热缓存** — 毫秒级读写，刷新不丢
2. **API 异步持久化** — 2s 节流，防止频繁请求
3. **页面加载合取** — 优先读 localStorage，再静默拉取 API 比对

---

### 3.3 HistoryManager（Undo/Redo）

**位置**: `src/store/middleware/historyMiddleware.ts`

```typescript
interface HistoryManager {
  // 记录操作（节流 300ms，防止拖拽过程爆炸）
  recordAction(action: CanvasAction): void;

  // 撤销 / 重做
  undo(): CanvasState;
  redo(): CanvasState;

  // 历史边界
  canUndo: boolean;
  canRedo: boolean;
  historyDepth: number; // max 50
}
```

**三树历史隔离**：
- 每个 TreePanel 有独立历史指针
- 跨树操作（如级联确认）同时记录到所有受影响树的历史
- 拖拽操作使用 `onDragEnd` 事件触发记录（而非 `onDrag` 过程）

---

### 3.4 SearchEngine（搜索导航）

**位置**: `src/hooks/useCanvasSearch.ts`

```typescript
interface SearchEngine {
  // fuse.js 模糊匹配
  search(query: string): SearchResult[];

  // 匹配节点路径展示
  formatPath(node: CanvasNode): string;
  // 例如: "电商域 → 下单流程 → OrderForm"
}
```

**搜索交互**：
- 触发: `Cmd/Ctrl+K` 或 ProjectBar 搜索图标
- 结果列表: 虚拟化滚动（节点多时性能保障）
- 高亮: 目标节点脉冲动画（300ms ease-out）
- 导航: `↑↓` 切换结果，`Enter` 跳转，`Esc` 关闭

---

### 3.5 ShortcutSystem（快捷键）

**位置**: `src/hooks/useKeyboardShortcuts.ts`

**快捷键映射**：

| 快捷键 | 功能 | 作用域 |
|--------|------|--------|
| `Cmd/Ctrl+Z` | Undo | 全局（焦点不在输入框） |
| `Cmd/Ctrl+Shift+Z` | Redo | 全局 |
| `Cmd/Ctrl+K` | 搜索 | 全局 |
| `Cmd/Ctrl+S` | 保存 | 全局 |
| `N` | 新建节点（当前选中树） | 全局 |
| `Del/Backspace` | 删除选中节点 | 全局 |
| `Enter` | 确认/编辑节点 | 树面板 |
| `Esc` | 取消操作 | 全局 |
| `?` | 显示快捷键面板 | 全局 |
| `Cmd/Ctrl+E` | 展开/折叠面板 | 全局 |

**焦点隔离**: 输入框聚焦时自动跳过画布快捷键（通过 `event.stopPropagation()`）

---

### 3.6 ExportPipeline（导出）

**位置**: `src/components/canvas/ExportMenu.tsx` + `src/utils/export/`

```
ExportPipeline
├── JSONExporter    — 完整画布状态序列化
├── PNGSnapshotter — html-to-image toPng
├── SVGSnapshotter — html-to-image toSvg（含字体嵌入）
└── MarkdownExporter — 三树结构化描述生成
```

**导出格式优先级**:
1. JSON（P0）— 代码生成工具消费
2. PNG/SVG（P1）— 用户分享
3. Markdown（P2）— 文档用途
4. PDF（P3）— 报告用途（依赖 svg2pdf 中文处理）

---

## 4. 组件架构

### 4.1 CanvasPage 布局

```
CanvasPage
├── PhaseProgressBar        — 5阶段进度指示
├── ProjectBar
│   ├── UndoButton         — ↶
│   ├── RedoButton         — ↷
│   ├── SearchButton       — 🔍
│   ├── ShortcutHelpButton — ?
│   └── ExportButton       — 📤
├── CanvasGrid             — CSS Grid 三栏布局
│   ├── TreePanel[context]— 可折叠，含 MiniMap + Controls
│   ├── TreePanel[flow]   — 可折叠，含 MiniMap + Controls
│   └── TreePanel[component]
│       └── PrototypeLink  — P1-F8 原型跳转
├── HoverHotzone           — E2 悬停展开触发区
├── SearchDialog           — P1-F5 搜索浮层
├── ShortcutHelpPanel      — P1-F6 快捷键帮助
└── VersionHistoryDrawer   — P2-F11 版本历史侧边抽屉
```

### 4.2 TreePanel 内部结构

```
TreePanel<TreeType>
├── TreePanelHeader        — 标题 + 折叠按钮 + MiniMap toggle
├── ReactFlowCanvas        — @xyflow/react 实例
│   ├── MiniMap            — 导航缩略图
│   ├── Controls           — 缩放控制（+/fit）
│   ├── Background         — 网格背景
│   ├── Nodes
│   │   ├── ContextNode
│   │   ├── FlowNode
│   │   ├── ComponentNode
│   │   ├── GatewayNode    — 菱形分支
│   │   └── [P3] StickyNode — 贴纸标注
│   └── Edges
│       ├── RelationshipEdge— 关系连线
│       ├── LoopEdge       — 循环连线
│       └── [P2] DragEdge  — 拖拽引导线
├── BoundedGroupOverlay    — 领域虚线框（Context 层）
├── ComponentGroupOverlay  — 流程分组虚线框（Flow 层）
├── DragOverlay            — dnd-kit 拖拽遮罩
└── SearchHighlightLayer   — 搜索结果高亮叠加
```

---

## 5. API 设计

### 5.1 持久化 API

| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/canvas/projects/{id}` | GET | 获取项目完整状态 |
| `/api/canvas/projects/{id}` | PUT/PATCH | 保存项目状态（节流 2s） |
| `/api/canvas/projects/{id}/snapshots` | GET | 获取版本快照列表 |
| `/api/canvas/projects/{id}/snapshots` | POST | 创建快照（AI生成完成 / 手动） |
| `/api/canvas/projects/{id}/snapshots/{sid}` | GET | 获取指定快照 |
| `/api/canvas/projects/{id}/snapshots/{sid}/restore` | POST | 恢复到指定快照 |

### 5.2 SSE 流式 AI 生成

```
GET /api/canvas/projects/{id}/generate
  → Event: node-created { treeType, nodeId, nodeData }
  → Event: node-updated { treeType, nodeId, status }
  → Event: error { treeType, nodeId, message }
  → Event: complete { totalNodes, duration }
```

---

## 6. 技术债与迁移

### 6.1 P0 迁移项

| 项目 | 当前状态 | 目标 | 文件位置 |
|------|---------|------|---------|
| CardTree 深色主题 | 白底灰边 | CSS 变量迁移 | `CardTreeNode.module.css` |
| MiniMap 激活 | 有 prop 未用 | 全三栏激活 | `TreePanel.tsx` |
| Controls 激活 | 有 prop 未用 | 全三栏激活 | `TreePanel.tsx` |
| PreviewUrl 补全 | 缺失 | 100% 覆盖 | `example-canvas.json` |

### 6.2 ReactFlow 版本锁定

```json
// package.json
"@xyflow/react": "12.3.6"  // 锁定版本，防止破坏性变更
```

---

## 7. 实施计划

### Phase 0 — 部署解除阻塞（P0-F1）
- **工时**: 0.5h
- **产出**: 画布页生产环境可访问
- **关键路径**: Vercel 路由配置 + 回归测试

### Phase 1 — 持久化 + 主题（P0-F2 + P0-F3）
- **工时**: 12–18h
- **产出**: 
  - Zustand persist middleware 接入
  - API 持久化层 + ConflictResolver
  - CardTree 深色主题 CSS 变量迁移

### Phase 2 — Undo/Redo + 快捷键（P1-F4 + P1-F6）
- **工时**: 10–14h
- **产出**:
  - HistoryManager middleware
  - ProjectBar Undo/Redo 按钮
  - useKeyboardShortcuts hook
  - 快捷键帮助面板

### Phase 3 — 搜索 + 拖拽 + 原型连接（P1-F5 + P1-F7 + P1-F8）
- **工时**: 13–18h
- **产出**:
  - SearchDialog + fuse.js 集成
  - @dnd-kit/sortable 三树接入
  - /editor 路由参数支持

### Phase 4 — 导出 + MiniMap + Zoom（P2-F9 + P2-F12 + P2-F14）
- **工时**: 13–19h
- **产出**:
  - ExportMenu（JSON/PNG/SVG/Markdown）
  - 三栏 MiniMap 完整激活
  - ReactFlow Controls 激活

### Phase 5 — 模板 + 版本 + 关系连线（P2-F10 + P2-F11 + P2-F13）
- **工时**: 20–30h
- **产出**:
  - /public/templates/ 预设模板
  - 版本历史抽屉 + 快照 API
  - Flow/Component 树 RelationshipEdge

### Phase 6 — 生态扩展（P3: F15–F18）
- **工时**: 38–53h
- **产出**: 离线 / 设计系统 / 协作评论 / AI 流式生成
- **状态**: 长期规划

---

## 8. 验收标准

- [ ] CanvasStore 提供完整 TypeScript 类型定义
- [ ] Undo/Redo 支持三树独立历史，最大深度 50 步
- [ ] localStorage 持久化 + API 持久化双层保障
- [ ] 快捷键系统完整覆盖 PRD 定义的所有快捷键
- [ ] 搜索支持 fuse.js 模糊匹配，路径格式正确
- [ ] 导出支持 JSON/PNG/SVG/Markdown 四种格式
- [ ] MiniMap 在三栏均激活，移动端隐藏
- [ ] 版本历史支持快照创建、列表查看、回滚
- [ ] 无新依赖引入破坏性变更（ReactFlow 版本锁定）
- [ ] 集成测试覆盖核心用户路径（Playwright）

---

## 9. 风险与缓解

| 风险 | 概率 | 影响 | 缓解 |
|------|------|------|------|
| 拖拽过程历史栈爆炸 | 中 | 高 | `onDragEnd` 触发记录（非 `onDrag`）+ 节流 300ms |
| localStorage 配额（>500节点） | 低 | 中 | API 持久化为主要保障，localStorage 仅作热缓存 |
| SVG 导出中文乱码 | 中 | 中 | PNG 回退 + 字体嵌入调查 |
| ReactFlow 版本升级破坏性变更 | 低 | 高 | `package.json` 锁定版本 12.3.6 |
| SSE 流式与现有批量更新冲突 | 高 | 中 | P3 单独实施，Phase 2 前不引入 |

---

*本文档由 Architect Agent 生成 | 基于 vibex-canvas-feature-gap-20260329 PRD + Analysis | 2026-03-29*
