# VibeX Sprint 54 — 产品需求文档 (PRD)

**Sprint**: Sprint 54
**日期**: 2026-06-02
**PM**: Product Manager
**状态**: Draft

---

## 执行摘要

Sprint 54 聚焦于三项用户核心体验补全工作：
1. **P001 (P0)**: Canvas Snapshot 版本历史 UI — 将 S51-E1 的持久化能力暴露给用户
2. **P002 (P1)**: Canvas 文件导入增强 — 支持拖放导入本地文件
3. **P003 (P1)**: 协作者 Cursor 实时同步 — 补全实时协作的视觉反馈

Sprint 53 的 E5 QA 问题（wsCommentHandler revision cases）修复以 fix project 形式跟进。

---

## Epic / Story 映射表

| Epic ID | Epic 标题 | 优先级 | 涉及 Story |
|---------|---------|--------|-----------|
| E1 | Canvas Snapshot 版本历史 UI | P0 | E1.1–E1.4 |
| E2 | Canvas 文件导入增强 | P1 | E2.1–E2.3 |
| E3 | 协作者 Cursor 实时同步 | P1 | E3.1–E3.3 |
| E4 | 画布性能优化 | P2 | E4.1–E4.2 |
| E5 | Template Gallery 增强 | P2 | E5.1–E5.2 |

---

### Epic 1: Canvas Snapshot 版本历史 UI [P0]

### 功能描述
为 DDSCanvasPage 添加 History 面板入口，用户可查看历史快照并一键恢复到任意版本。

### 验收标准 (expect 断言)

```typescript
// E1.1 — History 按钮存在
const toolbar = screen.getByRole('toolbar');
expect(toolbar.querySelector('[aria-label="History"]')).toBeInTheDocument();

// E1.2 — HistoryPanel 显示快照列表
const historyPanel = screen.getByRole('dialog');
const snapshots = within(historyPanel).getAllByRole('listitem');
expect(snapshots.length).toBeGreaterThanOrEqual(1);

// E1.3 — Restore 恢复画布状态
const restoreBtn = within(historyPanel).getByRole('button', { name: /restore/i });
expect(restoreBtn).toBeInTheDocument();

// E1.4 — 空状态显示
expect(screen.queryByText(/no snapshots/i)).toBeInTheDocument();
```

### DoD (Definition of Done)
- [ ] `HistoryPanel.tsx` 已创建，赛博朋克风格
- [ ] DDSToolbar 添加 History 图标按钮
- [ ] `useHistoryPanel.ts` 订阅 canvasHistoryStore
- [ ] `canvasHistoryStore.getState().loadHistoryWithRevision(revision)` 实现
- [ ] vitest `HistoryPanel.test.tsx` 8/8 通过
- [ ] CHANGELOG.md + vibex-fronted/CHANGELOG.md 已更新

---

### Epic 2: Canvas 文件导入增强 [P2]

### 功能描述
用户可将 `.json` / `.yaml` / `.vibex` 文件直接拖放到画布上，系统自动解析并合并到当前画布。

### 验收标准 (expect 断言)

```typescript
// E2.1 — JSON 文件导入
const dropZone = screen.getByTestId('canvas-drop-zone');
const file = new File(['{"nodes":[]}'], 'test.json', { type: 'application/json' });
fireEvent.drop(dropZone, { dataTransfer: { files: [file] } });
expect(screen.getByText(/imported 5 nodes/i)).toBeInTheDocument();

// E2.2 — YAML 文件导入
const yamlFile = new File(['nodes:\n  - id: n1'], 'test.yaml', { type: 'text/yaml' });
fireEvent.drop(dropZone, { dataTransfer: { files: [yamlFile] } });
expect(screen.getByText(/imported/i)).toBeInTheDocument();

// E2.3 — 无效格式报错
const badFile = new File(['not valid'], 'test.txt', { type: 'text/plain' });
fireEvent.drop(dropZone, { dataTransfer: { files: [badFile] } });
expect(screen.getByRole('alert')).toHaveTextContent(/unsupported format/i);
```

### DoD
- [ ] `useFileDrop.ts` — 处理 onDragOver/onDrop
- [ ] 支持 .json / .yaml / .vibex 格式
- [ ] `importFileDialog.tsx` — 导入预览 + 确认
- [ ] DDSCanvasPage 画布区域可作为 drop target
- [ ] vitest `useFileDrop.test.ts` 10/10 通过
- [ ] CHANGELOG.md + vibex-fronted/CHANGELOG.md 已更新

---

### Epic 3: 协作者 Cursor 实时同步 [P2]

### 功能描述
在 WebSocket presence 基础上增加 cursor:move 消息类型，实现协作者鼠标位置实时同步。

### 验收标准 (expect 断言)

```typescript
// E3.1 — 远端 cursor 渲染
const cursorOverlay = screen.getByTestId('cursor-overlay');
expect(within(cursorOverlay).getAllByRole('img').length).toBeGreaterThanOrEqual(1);

// E3.2 — 自己 cursor 不显示
const myCursor = screen.queryByTestId('cursor-self');
expect(myCursor).not.toBeInTheDocument();

// E3.3 — cursor 隐藏（无协作者时）
expect(screen.queryByTestId('cursor-overlay')).not.toBeInTheDocument();
```

### DoD
- [ ] WebSocket `cursor:move` 消息类型实现
- [ ] `presenceStore.ts` 新增 `setCursor` + `cursors` Map state
- [ ] `CursorOverlay.tsx` — SVG overlay，多用户 cursor
- [ ] DDSCanvasPage 渲染 CursorOverlay
- [ ] 100ms throttle cursor broadcast
- [ ] vitest `CursorOverlay.test.tsx` 8/8 通过
- [ ] CHANGELOG.md + vibex-fronted/CHANGELOG.md 已更新

---

### Epic 4: 画布性能优化 [P2]

### 功能描述
实现视口裁剪 (viewport culling)，500+ 节点画布仅渲染可见区域节点。

### 验收标准 (expect 断言)

```typescript
// E4.1 — 视口内节点可见
const visible = getVisibleNodes(allNodes, viewportBounds);
expect(visible.length).toBeLessThanOrEqual(allNodes.length);

// E4.2 — 完全不可见节点被过滤
const outsideBounds = { x: -10000, y: -10000, width: 100, height: 100 };
const visible2 = getVisibleNodes(allNodes, outsideBounds);
expect(visible2.length).toBe(0);
```

### DoD
- [ ] `ViewportCulling.ts` 工具函数
- [ ] ReactFlow 视口订阅 + culling 触发
- [ ] `flowStore.ts` 新增 `visibleNodeIds` state
- [ ] vitest `ViewportCulling.test.ts` 8/8 通过
- [ ] CHANGELOG.md + vibex-fronted/CHANGELOG.md 已更新

---

### Epic 5: Template Gallery 增强 [P2]

### 功能描述
为 TemplateGallery 添加缩略图预览和最近使用标签页。

### 验收标准 (expect 断言)

```typescript
// E5.1 — PreviewDialog 渲染
const previewBtn = screen.getByRole('button', { name: /preview/i });
fireEvent.click(previewBtn);
expect(screen.getByRole('dialog')).toBeInTheDocument();

// E5.2 — Recent 标签页
const recentTab = screen.getByRole('tab', { name: /recent/i });
fireEvent.click(recentTab);
expect(screen.getByText(/no recent templates/i)).toBeInTheDocument();
```

### DoD
- [ ] `CanvasTemplateData.thumbnail?: string` 字段
- [ ] `TemplatePreviewDialog.tsx` — mini canvas preview
- [ ] `useTemplatePreview.ts` — 模板数据加载
- [ ] TemplateGallery 添加 "Recent" 标签页
- [ ] vitest `TemplatePreviewDialog.test.tsx` 6/6 通过
- [ ] CHANGELOG.md + vibex-fronted/CHANGELOG.md 已更新

---

## DoD (Sprint 级别)

- [ ] 5 个 Epic 全部完成
- [ ] 所有 vitest 测试通过 (E1: 8, E2: 10, E3: 8, E4: 8, E5: 6 = 40 total)
- [ ] dual-CHANGELOG 已更新
- [ ] 无新增 TypeScript 编译错误

---

## 页面集成表

| 页面 | 改动 |
|------|------|
| `/canvas/[id]` | +History 按钮, +CursorOverlay, +Drop zone |
| `/templates` | +PreviewDialog, +Recent 标签页 |
| 通用 Store | +viewport culling state, +cursor tracking |

