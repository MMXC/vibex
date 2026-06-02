# VibeX Sprint 54 — 架构设计文档

**Sprint**: Sprint 54
**日期**: 2026-06-02
**Architect**: Hermes Coord (self-impl)
**状态**: Draft

---

## 执行摘要

Sprint 54 实现 5 个 Epic：E1(E1.1-E1.4) 版本历史 UI、E2(E2.1-E2.3) 文件拖放导入、E3(E3.1-E3.3) 协作者 Cursor、E4(E4.1-E4.2) 视口裁剪、E5(E5.1-E5.2) 模板预览增强。

**技术主线**：
- E1 复用 S51-E1 已有的 `canvasHistoryStore` + IndexedDB，不改后端
- E2 纯前端 HTML5 Drag & Drop，文件解析走已有 store/parser
- E3 新增 WebSocket `cursor:move` 消息类型，复用 S53-E1 presence 基础设施
- E4 在 ReactFlow node renderer 层做视口过滤，不改底层
- E5 在 `TemplateGallery` 内嵌 PreviewDialog，扩展 `CanvasTemplateData`

---

## E1 — Canvas Snapshot 版本历史 UI [P0]

### 现有状态

| 文件/组件 | 状态 | 来源 Sprint |
|-----------|------|-------------|
| `canvasHistoryStore.ts` | ✅ 已在 main | S51-E1 |
| `historyDB.ts` (IndexedDB) | ✅ 已在 main | S51-E1 |
| `canvasHistoryStore.loadHistoryWithRevision()` | ⚠️ 需验证 | S51-E1 |
| `DDSCanvasPage.tsx` | ✅ 已在 main | S49+ |
| `DDSToolbar.tsx` | ✅ 已在 main | S49+ |

### 需新增

| 文件 | 用途 |
|------|------|
| `src/components/dds/history/HistoryPanel.tsx` | History 面板 Dialog |
| `src/hooks/canvas/useHistoryPanel.ts` | History 面板逻辑 hook |
| `src/components/dds/history/HistoryPanel.module.css` | 面板样式 |

### 组件架构

```
DDSToolbar
  └── [History button]
        └── onClick → setHistoryPanelOpen(true)
              └── DDSCanvasPage 渲染 <HistoryPanel>
                    ├── useHistoryPanel() → canvasHistoryStore
                    └── snapshot list → Restore button → loadHistoryWithRevision
```

### 架构决策

1. **HistoryPanel 挂载在 DDSCanvasPage，不在 Toolbar** — Toolbar 是工具栏，Panel 是独立 Dialog，职责分离
2. **使用 canvasHistoryStore 作为单一数据源** — 不再重复调用 historyDB；Panel 只读 store
3. **Restore 触发 `loadHistoryWithRevision(revision)`** — revision-aware restore，支持任意版本恢复
4. **HistoryPanel 监听 `canvasHistoryStore` 的 snapshots** — 响应式更新，无需手动 refresh

### 测试策略

- `HistoryPanel.test.tsx`：8 个测试用例
  - E1.1: History 按钮存在（aria-label="History"）
  - E1.2: 面板显示 ≥1 条快照（`getAllByRole('listitem')`）
  - E1.3: Restore 按钮存在且可点击
  - E1.4: 空状态显示（无快照时）
  - Dialog 打开/关闭动画
  - snapshot 点击高亮
  - Restore 调用 `loadHistoryWithRevision`
  - 响应 store 变化自动更新

---

## E2 — Canvas 文件导入增强 [P1]

### 现有状态

| 文件/组件 | 状态 | 来源 Sprint |
|-----------|------|-------------|
| `TemplateGallery.tsx` (import logic) | ✅ 已在 main | S52-E4 |
| `CanvasTemplateData` 类型 | ✅ 已在 main | S52-E4 |
| `flowStore.ts` (`setNodes`) | ✅ 已在 main | S49+ |
| `@xyflow/react` ReactFlow | ✅ 已在 main | S49+ |
| `package.json` (js-yaml) | ⚠️ 需验证存在 | — |

### 需新增

| 文件 | 用途 |
|------|------|
| `src/hooks/canvas/useFileDrop.ts` | Drag & Drop hook |
| `src/components/dds/canvas/FileImportDialog.tsx` | 导入预览确认 Dialog |
| `src/lib/canvas/parseImportFile.ts` | JSON/YAML/Vibex 文件解析 |
| `src/components/dds/canvas/DropOverlay.tsx` | 可视化 drop target 提示 |
| `src/components/dds/canvas/DropOverlay.module.css` | Drop overlay 样式 |

### 组件架构

```
DDSCanvasPage
  ├── <DropOverlay> (绝对定位，z-index 100，drop 时高亮)
  │     └── onDragOver → preventDefault + setDropActive
  │     └── onDrop → useFileDrop().handleDrop
  ├── useFileDrop() hook
  │     ├── 支持 .json / .yaml / .vibex
  │     ├── parseImportFile() → CanvasSnapshot JSON
  │     └── flowStore.setNodes() 合并节点
  └── <FileImportDialog> (预览 + 确认)
```

### 架构决策

1. **Drop event 在 DDSCanvasPage 顶层捕获** — 不在 ReactFlow 内部，避免与 node drag 冲突
2. **useFileDrop 使用 `dataTransfer.items` API** — 区分文件类型比 `dataTransfer.files` 更可靠
3. **YAML 解析：检查 package.json 中 `js-yaml` 依赖** — 若不存在，使用动态 import
4. **.vibex 视为 JSON 扩展名** — 直接解析为 JSON，跳过 schema 验证
5. **ImportDialog 提供预览** — 用户可确认导入前查看节点数量和预览

### 测试策略

- `useFileDrop.test.ts`：10 个测试用例
  - E2.1: JSON drop → 节点导入成功
  - E2.2: YAML drop → 自动转换后导入
  - E2.3: 无效格式 → error toast 显示
  - file type 检测
  - large file (>5MB) → warning toast
  - multiple files → 只处理第一个
  - 空文件 → no-op
  - dialog 打开/确认逻辑
  - Dialog 取消后状态恢复
  - .vibex 扩展名处理

---

## E3 — 协作者 Cursor 实时同步 [P1]

### 现有状态

| 文件/组件 | 状态 | 来源 Sprint |
|-----------|------|-------------|
| `wsPresenceHandler.ts` | ✅ 已在 main | S53-E1 |
| `presenceStore.ts` | ✅ 已在 main | S53-E1 |
| `PresenceIndicator.tsx` (avatar stack) | ✅ 已在 main | S53-E1 |
| WebSocket connection | ✅ 已在 main | S53-E1 |
| `@xyflow/react` viewport API | ✅ 已在 main | S49+ |

### 需新增

| 文件 | 用途 |
|------|------|
| `src/components/dds/collaboration/CursorOverlay.tsx` | SVG cursor overlay |
| `src/stores/dds/cursorStore.ts` | cursor 位置状态 |
| `src/lib/collaboration/throttleCursorBroadcast.ts` | 100ms throttle 工具 |
| `src/lib/collaboration/screenToFlowCoords.ts` | 屏幕坐标 → Flow 坐标转换 |

### 组件架构

```
DDSCanvasPage
  └── <CursorOverlay>
        ├── presenceStore.cursors (Map<userId, cursor>)
        ├── useEffect → mousemove listener → throttleCursorBroadcast
        │     └── wsConnection.send({ type: 'cursor:move', payload: { x, y, userId } })
        └── SVG cursor elements (per remote user)
              └── cursor = screenToFlowCoords(remoteX, remoteY)
                    └── 坐标使用 ReactFlow viewport transform
```

### 架构决策

1. **CursorOverlay 使用 SVG 而非 HTML** — SVG 在 canvas 变换时性能更好，避免 z-index 问题
2. **100ms throttle on mousemove** — 避免 WebSocket 消息过载；throttle 工具独立复用
3. **screen → flow 坐标转换** — 使用 ReactFlow `screenToFlowCoordinate` 或手动 inverse transform
4. **cursorStore 独立于 presenceStore** — cursor 高频更新，不应污染 presence store
5. **远端 cursor 使用 `presenceStore.users` 中的 user color** — 保证与 avatar stack 颜色一致

### 测试策略

- `CursorOverlay.test.tsx`：8 个测试用例
  - E3.1: 远端 cursor 渲染（多个 `img` role in cursor-overlay）
  - E3.2: 自己 cursor 不显示（`queryByTestId('cursor-self')` 为 null）
  - E3.3: 无协作者时 overlay 不存在
  - cursor 位置正确映射（viewport 变换后）
  - cursor 颜色与 user color 一致
  - cursor 标签显示 user name
  - throttle 在高频事件下正确降频
  - cursor 在 viewport 边界时 clip

---

## E4 — 画布性能优化 [P2]

### 现有状态

| 文件/组件 | 状态 | 来源 Sprint |
|-----------|------|-------------|
| `flowStore.ts` | ✅ 已在 main | S49+ |
| `viewportBoundsStore.ts` | ✅ 已在 main | S52-E3 |
| `@xyflow/react` ReactFlow | ✅ 已在 main | S49+ |
| ReactFlow `nodes` prop | ✅ 已在 main | S49+ |

### 需新增

| 文件 | 用途 |
|------|------|
| `src/lib/canvas/ViewportCulling.ts` | 视口裁剪核心工具函数 |
| `src/hooks/canvas/useViewportCulling.ts` | culling hook，整合 viewportBoundsStore |
| `src/stores/dds/flowStore.patch.ts` | flowStore 扩展 visibleNodeIds state |

### 组件架构

```
DDSCanvasPage
  └── ReactFlow
        ├── nodes={flowStore.visibleNodeIds}  ← culling 结果
        └── viewportBoundsStore → useViewportCulling → flowStore.visibleNodeIds
              └── ViewportCulling.getVisibleNodes(allNodes, viewportBounds)
                    └── bbox intersection test (AABB)
```

### 架构决策

1. **ViewportCulling 作为纯函数工具** — 不依赖 React，用 `useViewportCulling` hook 接入 store
2. **AABB (Axis-Aligned Bounding Box) 交集检测** — 简单高效，适用于矩形节点
3. **visibleNodeIds 作为 flowStore 的 derived state** — 不改现有 `nodes` state，新增 `visibleNodeIds`
4. **ReactFlow `nodeExtent` 用于坐标范围计算** — 与 viewportBounds 单位对齐
5. **minimap 暂不参与 culling** — minimap 有独立的 node filter，后续单独处理

### 测试策略

- `ViewportCulling.test.ts`：8 个测试用例
  - E4.1: 视口内节点可见（部分在视口内）
  - E4.2: 视口外节点过滤（全不在视口）
  - 部分重叠节点（边框在视口内）
  - viewport 边界精确性（节点正好在边界）
  - 空节点列表
  - 空 viewport bounds
  - 带 margin 的 culling（额外 50px buffer）
  - 节点旋转角度（culling 忽略 rotation，使用 bounding box）

---

## E5 — Template Gallery 增强 [P2]

### 现有状态

| 文件/组件 | 状态 | 来源 Sprint |
|-----------|------|-------------|
| `TemplateGallery.tsx` | ✅ 已在 main | S52-E4 |
| `TemplateSearchBar.tsx` | ✅ 已在 main | S49-E2 |
| `CanvasTemplateData` | ✅ 已在 main | S52-E4 |
| `templateStore.ts` | ✅ 已在 main | S52-E4 |

### 需新增

| 文件 | 用途 |
|------|------|
| `src/components/dds/templates/TemplatePreviewDialog.tsx` | 模板预览 Dialog |
| `src/components/dds/templates/TemplatePreviewDialog.module.css` | 预览 Dialog 样式 |
| `src/hooks/templates/useTemplatePreview.ts` | 模板数据加载 hook |
| `src/components/dds/templates/MiniCanvas.tsx` | 简化 canvas 用于预览 |

### 组件架构

```
DDSToolbar
  └── [Templates button] → DDSCanvasPage → <TemplateGallery>
        ├── TemplateSearchBar
        ├── template categories (已有)
        ├── template cards (已有)
        │     └── [Preview button] → <TemplatePreviewDialog>
        │           ├── <MiniCanvas> — 简化 canvas 渲染
        │           └── [Use Template] / [Cancel]
        └── [Recent tab] → templateStore.filter(recent)
              └── recent = localStorage.getItem('recentTemplates')
```

### 架构决策

1. **TemplatePreviewDialog 作为独立 Dialog** — 不修改现有 TemplateGallery 组件结构，兼容已有代码
2. **MiniCanvas 使用简化渲染** — 移除交互事件，仅渲染节点位置和边，适用于 200+ 节点模板
3. **Recent 标签页限制 5 个** — localStorage 容量考虑；`templateStore` 新增 `recentTemplateIds` state
4. **`CanvasTemplateData.thumbnail?: string` 字段** — 可选字段，支持无缩略图的旧模板
5. **Recent 数据存储在 `localStorage`** — 不依赖后端；key = `recentTemplates`，value = JSON array of IDs

### 测试策略

- `TemplatePreviewDialog.test.tsx`：6 个测试用例
  - E5.1: PreviewDialog 渲染（`getByRole('dialog')`）
  - E5.2: Recent 标签页切换
  - Recent 空状态显示（无历史模板）
  - Template card Preview button 可点击
  - Dialog 关闭按钮
  - MiniCanvas 渲染基础节点

---

## 跨 Epic 架构决策

### 1. Store 架构

每个 Epic 独立 Store（historyStore / cursorStore / flowStore 扩展），避免单点耦合。Epic 间通过 WebSocket 消息和共享 ReactFlow viewport 通信。

### 2. WebSocket 消息类型命名

| 消息类型 | 方向 | 用途 |
|---------|------|------|
| `cursor:move` | client→server→clients | 协作者 cursor 位置 |
| `snapshot:created` | server→clients | S51-E1，已有 |
| `presence:join/leave/ping` | client↔server | S53-E1，已有 |

### 3. 测试覆盖率目标

| Epic | 测试文件 | 目标用例数 |
|------|---------|-----------|
| E1 | HistoryPanel.test.tsx | 8 |
| E2 | useFileDrop.test.ts | 10 |
| E3 | CursorOverlay.test.tsx | 8 |
| E4 | ViewportCulling.test.ts | 8 |
| E5 | TemplatePreviewDialog.test.tsx | 6 |
| **合计** | | **40** |

### 4. 无新增外部依赖

所有 Epic 使用已有 npm 包（ReactFlow、js-yaml、zustand）。无新依赖引入。

---

## 技术风险汇总

| Epic | 风险 | 缓解方案 |
|------|------|---------|
| E1 | `loadHistoryWithRevision` 可能未实现 | 先实现 HistoryPanel UI；若 API 缺失，在 E1 开发阶段补充 |
| E2 | js-yaml 依赖不存在 | 使用动态 import，按需加载 |
| E3 | cursor 坐标转换精度 | 使用 ReactFlow 官方 `screenToFlowCoordinate` API |
| E4 | 自定义 culling 与 ReactFlow 内部状态冲突 | 仅修改 `nodes` prop，不改 ReactFlow 内部 |
| E5 | MiniCanvas 大模板性能 | 简化渲染 + 虚拟化，仅显示节点位置 |
