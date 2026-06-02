# VibeX Sprint 54 — Implementation Partition

**Sprint**: Sprint 54
**日期**: 2026-06-02
**Architect**: Hermes Coord (self-impl)
**状态**: Draft

---

## DoD 检查清单

### E1 — Canvas Snapshot 版本历史 UI [P0]

- [ ] `src/components/dds/history/HistoryPanel.tsx` 已创建
- [ ] DDSToolbar 添加 History 图标按钮 (`aria-label="History"`)
- [ ] `src/hooks/canvas/useHistoryPanel.ts` 订阅 canvasHistoryStore
- [ ] `canvasHistoryStore.getState().loadHistoryWithRevision(revision)` 可调用
- [ ] vitest `HistoryPanel.test.tsx` **8/8** 通过
- [ ] CHANGELOG.md + vibex-fronted/CHANGELOG.md 已更新

**验收标准**：

```typescript
// E1.1
expect(toolbar.querySelector('[aria-label="History"]')).toBeInTheDocument();

// E1.2
const snapshots = within(historyPanel).getAllByRole('listitem');
expect(snapshots.length).toBeGreaterThanOrEqual(1);

// E1.3
const restoreBtn = within(historyPanel).getByRole('button', { name: /restore/i });
expect(restoreBtn).toBeInTheDocument();

// E1.4
expect(screen.queryByText(/no snapshots/i)).toBeInTheDocument();
```

**新增文件列表**：

| 文件路径 | 用途 |
|---------|------|
| `src/components/dds/history/HistoryPanel.tsx` | History 面板 Dialog 组件 |
| `src/components/dds/history/HistoryPanel.module.css` | HistoryPanel 样式 |
| `src/hooks/canvas/useHistoryPanel.ts` | History 面板逻辑 hook |

**DoD item 详细说明**：

1. **HistoryPanel.tsx**：Dialog 组件，主题赛博朋克，使用 `DDSDialog` base 或自定义 dialog
2. **DDSToolbar History 按钮**：在 Toolbar 末尾添加，icon + aria-label，双向状态绑定
3. **useHistoryPanel.ts**：`const { snapshots, restore } = useHistoryPanel()`，订阅 canvasHistoryStore
4. **loadHistoryWithRevision**：若不存在，在 `canvasHistoryStore` 中补充实现（先检查后端 API）

---

### E2 — Canvas 文件导入增强 [P1]

- [ ] `src/hooks/canvas/useFileDrop.ts` 处理 onDragOver/onDrop
- [ ] 支持 .json / .yaml / .vibex 格式检测
- [ ] `src/components/dds/canvas/FileImportDialog.tsx` 导入预览 + 确认
- [ ] `src/components/dds/canvas/DropOverlay.tsx` 可视化 drop target
- [ ] DDSCanvasPage 画布区域可作为 drop target
- [ ] vitest `useFileDrop.test.ts` **10/10** 通过
- [ ] CHANGELOG.md + vibex-fronted/CHANGELOG.md 已更新

**验收标准**：

```typescript
// E2.1
fireEvent.drop(dropZone, { dataTransfer: { files: [jsonFile] } });
expect(screen.getByText(/imported 5 nodes/i)).toBeInTheDocument();

// E2.2
fireEvent.drop(dropZone, { dataTransfer: { files: [yamlFile] } });
expect(screen.getByText(/imported/i)).toBeInTheDocument();

// E2.3
fireEvent.drop(dropZone, { dataTransfer: { files: [badFile] } });
expect(screen.getByRole('alert')).toHaveTextContent(/unsupported format/i);
```

**新增文件列表**：

| 文件路径 | 用途 |
|---------|------|
| `src/hooks/canvas/useFileDrop.ts` | Drag & Drop hook |
| `src/components/dds/canvas/FileImportDialog.tsx` | 导入预览确认 Dialog |
| `src/components/dds/canvas/DropOverlay.tsx` | 可视化 drop target 提示 |
| `src/components/dds/canvas/DropOverlay.module.css` | DropOverlay 样式 |
| `src/lib/canvas/parseImportFile.ts` | JSON/YAML/Vibex 文件解析工具 |

**DoD item 详细说明**：

1. **useFileDrop.ts**：核心 hook，监听 canvas 区域的 drag 事件，返回 `{ isDragActive, handleDrop }`
2. **.json / .yaml / .vibex 检测**：使用 `dataTransfer.items[0].type` 和文件扩展名双重检测
3. **FileImportDialog.tsx**：显示解析后的节点数量，提供 "Confirm" / "Cancel" 按钮
4. **DropOverlay.tsx**：绝对定位 overlay，drag enter 时高亮画布边框，z-index 100
5. **DDSCanvasPage 集成**：在 canvas 外层 div 添加 `onDragOver` / `onDrop` / `onDragLeave`

---

### E3 — 协作者 Cursor 实时同步 [P1]

- [ ] WebSocket `cursor:move` 消息类型在后端已注册（或前端模拟）
- [ ] `src/stores/dds/cursorStore.ts` 新增 `setCursor` + `cursors` Map state
- [ ] `src/components/dds/collaboration/CursorOverlay.tsx` SVG overlay
- [ ] DDSCanvasPage 渲染 CursorOverlay
- [ ] 100ms throttle cursor broadcast 实现
- [ ] vitest `CursorOverlay.test.tsx` **8/8** 通过
- [ ] CHANGELOG.md + vibex-fronted/CHANGELOG.md 已更新

**验收标准**：

```typescript
// E3.1
const cursorOverlay = screen.getByTestId('cursor-overlay');
expect(within(cursorOverlay).getAllByRole('img').length).toBeGreaterThanOrEqual(1);

// E3.2
const myCursor = screen.queryByTestId('cursor-self');
expect(myCursor).not.toBeInTheDocument();

// E3.3
expect(screen.queryByTestId('cursor-overlay')).not.toBeInTheDocument();
```

**新增文件列表**：

| 文件路径 | 用途 |
|---------|------|
| `src/stores/dds/cursorStore.ts` | cursor 位置状态 |
| `src/components/dds/collaboration/CursorOverlay.tsx` | SVG cursor overlay |
| `src/lib/collaboration/throttleCursorBroadcast.ts` | 100ms throttle 工具 |
| `src/lib/collaboration/screenToFlowCoords.ts` | 屏幕坐标→Flow 坐标转换 |

**DoD item 详细说明**：

1. **cursorStore.ts**：Zustand store，`cursors: Map<userId, {x, y, color, name}>` + `setCursor(userId, pos)`
2. **CursorOverlay.tsx**：SVG 层，每个远端用户一个 cursor element (arrow + name label)
3. **throttleCursorBroadcast.ts**：通用 throttle 工具，100ms 间隔，用于 mousemove
4. **screenToFlowCoords.ts**：使用 `reactFlowInstance.screenToFlowCoordinate` 或手动 inverse viewport transform
5. **DDSCanvasPage**：在 ReactFlow 之上渲染 `<CursorOverlay>`，绝对定位

---

### E4 — 画布性能优化 [P2]

- [x] `src/lib/canvas/ViewportCulling.ts` 工具函数
- [x] `src/hooks/canvas/useViewportCulling.ts` hook，集成 viewportBoundsStore
- [x] `uiStore.ts` 新增 `visibleNodeIds: string[]` state + `setVisibleNodeIds`
- [x] `FlowEditor.tsx` 新增 `enableCulling` prop，渲染过滤后的节点
- [x] vitest `ViewportCulling.test.ts` **12/12** 通过
- [ ] CHANGELOG.md + vibex-fronted/CHANGELOG.md 已更新

**验收标准**：

```typescript
// E4.1
const visible = getVisibleNodes(allNodes, viewportBounds);
expect(visible.length).toBeLessThanOrEqual(allNodes.length);

// E4.2
const outsideBounds = { x: -10000, y: -10000, width: 100, height: 100 };
const visible2 = getVisibleNodes(allNodes, outsideBounds);
expect(visible2.length).toBe(0);
```

**新增文件列表**：

| 文件路径 | 用途 |
|---------|------|
| `src/lib/canvas/ViewportCulling.ts` | 视口裁剪纯函数 |
| `src/hooks/canvas/useViewportCulling.ts` | culling hook，整合 viewportBoundsStore |

**DoD item 详细说明**：

1. **ViewportCulling.ts**：`getVisibleNodes(nodes, bounds)` — AABB 交集检测，过滤视口外节点
2. **useViewportCulling.ts**：`const visibleNodes = useViewportCulling()` — 订阅 viewportBoundsStore，返回 culling 结果
3. **flowStore visibleNodeIds**：新增 `visibleNodeIds: string[]` state，由 useViewportCulling 更新
4. **DDSCanvasPage**：`<ReactFlow nodes={flowStore.visibleNodeIds}>` — 渲染 culling 后的节点

---

### E5 — Template Gallery 增强 [P2]

- [ ] `CanvasTemplateData.thumbnail?: string` 字段扩展
- [ ] `src/components/dds/templates/TemplatePreviewDialog.tsx` mini canvas preview
- [ ] `src/hooks/templates/useTemplatePreview.ts` 模板数据加载
- [ ] TemplateGallery 添加 "Recent" 标签页
- [ ] vitest `TemplatePreviewDialog.test.tsx` **6/6** 通过
- [ ] CHANGELOG.md + vibex-fronted/CHANGELOG.md 已更新

**验收标准**：

```typescript
// E5.1
const previewBtn = screen.getByRole('button', { name: /preview/i });
fireEvent.click(previewBtn);
expect(screen.getByRole('dialog')).toBeInTheDocument();

// E5.2
const recentTab = screen.getByRole('tab', { name: /recent/i });
fireEvent.click(recentTab);
expect(screen.getByText(/no recent templates/i)).toBeInTheDocument();
```

**新增文件列表**：

| 文件路径 | 用途 |
|---------|------|
| `src/components/dds/templates/TemplatePreviewDialog.tsx` | 模板预览 Dialog |
| `src/components/dds/templates/TemplatePreviewDialog.module.css` | 预览 Dialog 样式 |
| `src/components/dds/templates/MiniCanvas.tsx` | 简化 canvas 预览渲染 |
| `src/hooks/templates/useTemplatePreview.ts` | 模板数据加载 hook |

**DoD item 详细说明**：

1. **CanvasTemplateData.thumbnail**：可选字段，存储 base64 或 URL，无缩略图时显示 placeholder
2. **TemplatePreviewDialog.tsx**：使用 `DDSDialog` base，内嵌 `<MiniCanvas>` 渲染模板内容
3. **MiniCanvas.tsx**：ReactFlow 简版，无交互事件，仅渲染节点和边，禁用动画
4. **useTemplatePreview.ts**：加载模板数据 + 渲染 preview，支持 loading / error 状态
5. **Recent 标签页**：localStorage 读取 `recentTemplates`，按最近使用时间排序，最多 5 个

---

## Sprint 级别 DoD

- [ ] 5 个 Epic 全部完成（每个 Epic 全部 DoD item 勾选）
- [ ] 所有 vitest 测试通过 (E1: 8, E2: 10, E3: 8, E4: 8, E5: 6 = **40 total**)
- [ ] dual-CHANGELOG（root + vibex-fronted）已更新所有 5 个 Epic
- [ ] 无新增 TypeScript 编译错误 (`pnpm lint` clean)
- [ ] `pnpm build` 构建成功

---

## 依赖关系图

```
E1 (History UI)
  └── 依赖: canvasHistoryStore (S51-E1), DDSToolbar (S49+)
  └── 被依赖: 无

E2 (File Import)
  └── 依赖: flowStore (S49+), @xyflow/react (S49+)
  └── 被依赖: 无

E3 (Cursor Sync)
  └── 依赖: presenceStore (S53-E1), wsPresenceHandler (S53-E1)
  └── 被依赖: 无

E4 (Viewport Culling)
  └── 依赖: viewportBoundsStore (S52-E3), flowStore (S49+)
  └── 被依赖: 无

E5 (Template Preview)
  └── 依赖: TemplateGallery (S52-E4), templateStore (S52-E4)
  └── 被依赖: 无

Epic 间无相互依赖，可并行开发
```

---

## Dev 任务派发顺序

| 顺序 | Epic | 理由 |
|------|------|------|
| 1 | E1 (P0) | 最高优先级 |
| 2 | E2 (P1) | 用户导入体验 |
| 3 | E3 (P1) | 协作能力 |
| 4 | E4 (P2) | 性能优化 |
| 5 | E5 (P2) | 模板体验 |
