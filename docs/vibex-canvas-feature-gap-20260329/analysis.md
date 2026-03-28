# VibeX 画布功能差距分析报告

**项目**: vibex-canvas-feature-gap-20260329
**日期**: 2026-03-29
**分析人**: analyst agent
**工作目录**: /root/.openclaw/vibex

---

## 1. 执行摘要

VibeX 目前有三套画布实现：**CardTree（首页预览）**、**FlowCanvas（画布页面）** 和 **MermaidCanvas（图表可视化）**。核心画布 FlowCanvas 已实现三栏折叠展开、节点 CRUD、AI 生成、级联状态、关系连线、网关节点、拖拽重排、队列生成等功能，但仍缺少多项竞品标配功能。

**最关键的缺失是 Undo/Redo**（任何创作工具的核心需求），其次是导出能力、搜索导航、键盘快捷键和 MiniMap。

---

## 2. 当前画布功能盘点

### 2.1 CardTree（首页预览画布）

| 功能 | 状态 | 代码位置 |
|------|------|---------|
| ReactFlow 垂直树布局 | ✅ 已实现 | `src/components/visualization/CardTreeRenderer/` |
| 卡片节点 + 展开/折叠 | ✅ 已实现 | `src/components/visualization/CardTreeNode/` |
| Checkbox 状态切换 | ✅ 已实现 | `CardTreeNode.tsx` |
| 节点点击回调 | ✅ 已实现 | `onCardClick` prop |
| MiniMap 导航 | ⚠️ 有 prop 未激活 | `CardTreeRenderer` |
| Controls（缩放控制） | ⚠️ 有 prop 未激活 | `CardTreeRenderer` |
| Background 背景 | ⚠️ 有 prop 未激活 | `CardTreeRenderer` |
| 加载骨架屏 | ✅ 已实现 | `CardTreeSkeleton.tsx` |
| 错误状态 + 重试 | ✅ 已实现 | `CardTreeError.tsx` |
| 特性开关 | ✅ 已实现 | `FeatureFlagToggle.tsx` |
| Bounded Group SVG 叠加层 | ✅ 已实现 | `groups/BoundedGroupOverlay.tsx` |
| Gateway 节点（菱形分支） | ✅ 已实现 | `nodes/GatewayNode.tsx` |
| Loop 边（循环连线） | ✅ 已实现 | `edges/LoopEdge.tsx` |
| 自定义边类型 | ✅ 已实现 | `edgeTypes` prop |
| Freehand 手绘模式 | ❌ 未实现 | — |
| Undo/Redo | ❌ 未实现 | — |
| 多选 | ❌ 未实现 | — |

### 2.2 FlowCanvas（画布页面 — 三树画布）

| 功能 | 状态 | 代码位置 |
|------|------|---------|
| 三栏并行布局（Context / Flow / Component） | ✅ 已实现 | `src/components/canvas/CanvasPage.tsx` |
| 阶段进度条（5阶段） | ✅ 已实现 | `PhaseProgressBar.tsx` |
| 面板折叠/展开 | ✅ 已实现 | `TreePanel.tsx` + `toggleContextPanel` |
| Hover 热区展开（E2 Expand） | ✅ 已实现 | `HoverHotzone.tsx` |
| Grid 动态列宽（1fr / 1.5fr / 0） | ✅ 已实现 | `getGridTemplate()` in store |
| Context 节点 CRUD + AI 生成 | ✅ 已实现 | `BoundedContextTree.tsx` |
| Flow 节点 CRUD + AI 生成 | ✅ 已实现 | `BusinessFlowTree.tsx` |
| Component 节点 CRUD + AI 生成 | ✅ 已实现 | `ComponentTree.tsx` |
| 节点确认状态（pending/confirmed/error） | ✅ 已实现 | `NodeStatus` in types |
| 级联状态标记（上游变 → 下游 pending） | ✅ 已实现 | `CascadeUpdateManager.ts` |
| 关系连线 SVG（Context Relationship） | ✅ 已实现 | `edges/RelationshipConnector.tsx` |
| ReactFlow 关系边（RelationshipEdge） | ✅ 已实现 | `edges/RelationshipEdge.tsx` |
| Gateway 节点（菱形分支节点） | ✅ 已实现 | `nodes/GatewayNode.tsx` |
| Loop 边（循环连线） | ✅ 已实现 | `edges/LoopEdge.tsx` |
| 按 Flow ID 分组叠加层（虚线框） | ✅ 已实现 | `groups/ComponentGroupOverlay.tsx` |
| 按 Bounded Context 分组叠加层 | ✅ 已实现 | `groups/BoundedGroupOverlay.tsx` |
| 节点拖拽重排 | ✅ 已实现（E3） | `DragSlice` in store |
| 原型队列面板 | ✅ 已实现 | `PrototypeQueuePanel.tsx` |
| 项目创建 + 持久化 | ✅ 已实现 | `ProjectBar.tsx` + `canvasApi` |
| SSE/轮询生成状态 | ✅ 已实现 | `canvasSseApi.ts` |
| 响应式 Tab 切换（< 768px） | ✅ 已实现 | `CanvasPage` prop |
| Undo/Redo | ❌ 未实现 | — |
| 搜索节点 | ❌ 未实现 | — |
| 键盘快捷键 | ❌ 未实现 | — |
| 导出（图片/PDF/JSON） | ❌ 未实现 | — |
| 缩放控制（Zoom In/Out/Fit） | ❌ 未实现 | — |
| 多选 + 批量操作 | ❌ 未实现 | — |
| 贴纸/标注 | ❌ 未实现 | — |
| 协作（实时多人） | ❌ 未实现 | — |
| 版本历史 | ❌ 未实现 | — |

### 2.3 MermaidCanvas（图表可视化）

| 功能 | 状态 | 代码位置 |
|------|------|---------|
| Mermaid 语法渲染 | ✅ 已实现 | `src/components/visualization/MermaidRenderer/` |
| Mermaid 代码编辑器 | ✅ 已实现 | `src/components/ui/MermaidEditor.tsx` |
| 节点点击交互 | ✅ 已实现 | `onNodeClick` prop |
| 空/加载/错误状态 | ✅ 已实现 | MermaidRenderer |
| ViewSwitcher（Flow/Mermaid/JSON） | ✅ 已实现 | `ViewSwitcher.tsx` |
| VisualizationPlatform 统一容器 | ✅ 已实现 | `VisualizationPlatform.tsx` |
| 节点关系图（上下文关联） | ✅ 已实现 | `ContextTreeFlow.tsx` |
| 导出 Mermaid SVG | ❌ 未实现 | — |
| 实时预览（编辑时） | ⚠️ 基础实现 | MermaidEditor |
| 深色主题渲染 | ⚠️ 部分实现 | CSS variable |

---

## 3. 竞品功能对比

| 功能 | VibeX FlowCanvas | v0.dev | Excalidraw | Miro | FigJam |
|------|:----------------:|:------:|:----------:|:----:|:------:|
| **核心** |
| 三树结构（DDD） | ✅ | — | — | — | — |
| AI 生成节点 | ✅ | ✅ | — | ✅ | ✅ |
| 级联确认 | ✅ | — | — | — | — |
| 关系连线 | ✅ | — | ✅ | ✅ | ✅ |
| **导航** |
| MiniMap | ⚠️ 有prop未用 | — | ✅ | ✅ | ✅ |
| Zoom In/Out | ❌ | ✅ | ✅ | ✅ | ✅ |
| Fit View | ⚠️ 有prop未用 | ✅ | ✅ | ✅ | ✅ |
| 搜索节点/元素 | ❌ | — | ✅ | ✅ | ✅ |
| 键盘快捷键 | ❌ | ✅ | ✅ | ✅ | ✅ |
| **编辑** |
| Undo/Redo | ❌ | ✅ | ✅ | ✅ | ✅ |
| 多选 | ❌ | ✅ | ✅ | ✅ | ✅ |
| Freehand 手绘 | ❌ | — | ✅ | ✅ | ✅ |
| 贴纸/便利贴 | ❌ | — | ✅ | ✅ | ✅ |
| 拖拽重排 | ✅ | ✅ | ✅ | ✅ | ✅ |
| **导出** |
| 导出图片（PNG/SVG） | ❌ | ✅ | ✅ | ✅ | ✅ |
| 导出 PDF | ❌ | — | ✅ | ✅ | ✅ |
| 导出 JSON | ⚠️ API部分 | ✅ | ✅ | ✅ | ✅ |
| 打印 | ⚠️ 浏览器 | ✅ | ✅ | ✅ | ✅ |
| **协作** |
| 实时多人编辑 | ❌ | ✅ | ✅ | ✅ | ✅ |
| 鼠标指针显示 | ❌ | — | ✅ | ✅ | ✅ |
| 评论/标注 | ❌ | — | ✅ | ✅ | ✅ |
| **高级** |
| 版本历史 | ❌ | — | ✅ | ✅ | ✅ |
| 模板市场 | ❌ | — | ✅ | ✅ | ✅ |
| 演示模式 | ❌ | — | ✅ | ✅ | ✅ |
| 深色模式 | ✅ 全局 | — | ✅ | ✅ | ✅ |
| 离线支持 | ❌ | — | ✅ | — | — |

---

## 4. 功能差距分析（缺失功能清单）

### 4.1 高价值缺失（用户核心体验）

| ID | 功能 | 描述 | 对应竞品 |
|----|------|------|---------|
| G1 | **Undo/Redo** | 任何创作工具的核心需求，VibeX 三树画布完全没有 | Excalidraw/Miro 标配 |
| G2 | **搜索节点** | 在大型项目中快速定位节点，无搜索体验差 | Excalidraw/Miro |
| G3 | **导出图片** | 用户需要将画布导出为 PNG/SVG 用于分享 | v0.dev/Excalidraw |
| G4 | **键盘快捷键** | Cmd+Z, Cmd+Shift+Z, Cmd+S 等提升效率 | 全部竞品 |
| G5 | **MiniMap** | 大型 DDD 模型的导航工具，当前有 prop 未激活 | Excalidraw/Miro |

### 4.2 中价值缺失（增强体验）

| ID | 功能 | 描述 | 对应竞品 |
|----|------|------|---------|
| M1 | **Zoom 缩放控制** | 放大/缩小/适应屏幕，当前有 ReactFlow 未使用 | Excalidraw/Miro |
| M2 | **多选 + 批量操作** | Shift+点击多选，批量移动/删除 | Excalidraw/Miro |
| M3 | **Sticky Notes 贴纸** | 轻量标注/备注，竞品标配 | Excalidraw/Miro/FigJam |
| M4 | **导出 PDF** | 项目汇报用，需要 PDF 格式 | Excalidraw/Miro |
| M5 | **版本历史** | 记录每次保存状态，可回溯 | Excalidraw/Miro |
| M6 | **节点颜色标签** | Excalidraw/Miro 的色块标注，可视化辅助 | Excalidraw |

### 4.3 低价值缺失（高级特性）

| ID | 功能 | 描述 | 对应竞品 |
|----|------|------|---------|
| L1 | **Freehand 手绘** | Excalidraw 的核心特色，画布涂鸦 | Excalidraw/FigJam |
| L2 | **模板市场** | 预设 DDD 模板快速开始 | Excalidraw/Miro |
| L3 | **演示模式** | 全屏逐步展示画布结构 | Excalidraw/Miro |
| L4 | **协作评论** | 团队成员在节点上留评论 | Miro/FigJam |
| L5 | **实时多人编辑** | 需要后端 WebSocket 支持，工作量较大 | v0.dev/Miro/FigJam |
| L6 | **离线支持** | Service Worker 缓存 | Excalidraw |

---

## 5. 优先级矩阵

```
用户价值
    高
     │
  G1 │ U1: Undo/Redo
     │ G2: 搜索节点
     │ G3: 导出图片
     │
  中 ─┼─ G4: 键盘快捷键
     │ G5: MiniMap
     │ M1: Zoom控制
     │ M2: 多选批量
     │ M3: Sticky Notes
     │ M4: 导出PDF
     │
  低 ─┼─ M5: 版本历史
     │ M6: 节点颜色
     │ L1: Freehand
     │ L2: 模板市场
     │ L3: 演示模式
     │ L4: 协作评论
     │ L5: 实时协作
     │ L6: 离线支持
     │
    低└──────────────┴──────────────高
       容易实现              难实现
```

### 矩阵坐标说明

| 象限 | 策略 | 功能 |
|------|------|------|
| **左上（高价值+低成本）** | 🔴 立即做（本周） | G1, G2, G4, G5 |
| **右上（高价值+高成本）** | 🟡 规划做（本月） | G3（导出图片）, M4（PDF） |
| **左下（低价值+低成本）** | 🟢 快速做（有空） | M6, L2 |
| **右下（低价值+高成本）** | ⚪ 暂不做 | L1, L3, L4, L5, L6 |

---

## 6. MVP 级别功能（3天内可上线）

以下功能基于现有 ReactFlow API + Zustand store，无需新依赖，实现成本低：

### M1: Undo/Redo（G1）— 优先级 🔴 P0
- **工时估算**: 6-8h
- **实现方案**:
  - 安装 `zustand/middleware` 的 `useUndoStore`
  - 封装 `useHistory` hook，监听节点增删改事件
  - 添加 `Ctrl+Z` / `Ctrl+Shift+Z` 快捷键
  - 在 ProjectBar 添加 Undo/Redo 按钮
- **验收标准**:
  - [ ] `Ctrl+Z` 回退最近一次节点操作
  - [ ] `Ctrl+Shift+Z` 重做
  - [ ] 按钮状态正确（无可撤销时禁用）
  - [ ] 三棵树状态独立历史

### M2: MiniMap 导航（G5）— 优先级 🟠 P1
- **工时估算**: 2-3h
- **实现方案**:
  - 在 CardTreeRenderer 激活 `showMiniMap={true}`
  - FlowCanvas 三栏独立 MiniMap（每个 TreePanel 一个）
  - 适配 CanvasPage 响应式（< 768px 隐藏）
- **验收标准**:
  - [ ] MiniMap 显示节点缩略图
  - [ ] 点击 MiniMap 跳转对应节点
  - [ ] 移动时 MiniMap 实时更新

### M3: 搜索节点（G2）— 优先级 🟠 P1
- **工时估算**: 4-6h
- **实现方案**:
  - 在 ProjectBar 添加搜索图标按钮，点击弹出搜索 Dialog
  - 支持按节点名称模糊搜索
  - 搜索结果高亮 + 滚动到目标节点
  - 键盘 `/` 触发搜索
- **验收标准**:
  - [ ] 输入关键词实时过滤节点
  - [ ] 匹配节点高亮显示
  - [ ] 回车跳转并聚焦节点
  - [ ] `Esc` 关闭搜索

### M4: 键盘快捷键（G4）— 优先级 🟠 P1
- **工时估算**: 4-6h
- **实现方案**:
  - 封装 `useKeyboardShortcuts` hook
  - 绑定: `Cmd+Z` Undo, `Cmd+Shift+Z` Redo, `/` 搜索, `S` 保存, `N` 新建节点, `Del` 删除
  - 显示快捷键提示面板（`?` 键触发）
- **验收标准**:
  - [ ] 所有绑定快捷键正常工作
  - [ ] 焦点在输入框时不触发画布快捷键
  - [ ] 快捷键提示面板可切换显示

### M5: Zoom 缩放控制（M1）— 优先级 🟡 P2
- **工时估算**: 3-4h
- **实现方案**:
  - 在 CanvasPage 添加缩放控制按钮组（+ / - / fit）
  - 暴露 `useReactFlow().zoomIn/zoomOut/fitView`
  - 添加鼠标滚轮缩放支持
- **验收标准**:
  - [ ] +/- 按钮缩放画布
  - [ ] Fit 按钮适应屏幕
  - [ ] 鼠标滚轮缩放
  - [ ] 缩放状态持久化到 store

---

## 7. 推荐实施路线图

### Week 1: 核心体验补全
- **G1 Undo/Redo** (6-8h) — 最影响用户信心
- **G4 键盘快捷键** (4-6h) — 与 G1 协同开发
- **G5 MiniMap** (2-3h) — 激活已有 prop

### Week 2: 导航与导出
- **G2 搜索节点** (4-6h) — 大型项目刚需
- **G3 导出图片** (4-6h) — 用户分享需求
- **M1 Zoom控制** (3-4h) — 补全导航

### Week 3: 增强编辑
- **M2 多选批量** (6-8h) — 需要 ReactFlow SelectionMode
- **M3 Sticky Notes** (4-6h) — 低成本高价值
- **M4 导出PDF** (6-8h) — 报告需求

### Week 4: 高级特性
- **M5 版本历史** (8-12h) — 持久化 + Diff
- **M6 节点颜色标签** (3-4h) — 可视化增强
- **L2 模板市场** (8-12h) — 需要模板设计

---

## 8. 技术风险识别

| 风险 | 影响 | 缓解方案 |
|------|------|---------|
| Undo/Redo 状态爆炸 | 高 | 限制历史深度（max 50步），按 TreeType 分开历史 |
| 导出图片 SVG 兼容性 | 中 | 使用 `html-to-image` 库，提供 PNG 回退 |
| 搜索性能（千级节点） | 中 | 虚拟化列表 + 防抖搜索 |
| ReactFlow 版本升级破坏性变更 | 低 | 锁定版本 + 集成测试覆盖 |
| PDF 导出中文乱码 | 中 | 使用 `jspdf` + `svg2pdf` 处理中文 |

---

## 9. 验收标准

完成本分析报告后，以下为产出验收标准：

- [ ] `docs/vibex-canvas-feature-gap-20260329/analysis.md` 已生成
- [ ] 已实现功能清单完整（CardTree/FlowCanvas/MermaidCanvas 三表）
- [ ] 缺失功能清单 18 项，覆盖 G1-L6
- [ ] 竞品对比表覆盖 v0.dev / Excalidraw / Miro / FigJam
- [ ] 优先级矩阵四象限明确
- [ ] MVP 功能 5 项，每项有工时估算和验收标准
- [ ] 推荐路线图 4 周规划
- [ ] Git commit 已提交: `feat(canvas-gap): add feature gap analysis for canvas pages`
