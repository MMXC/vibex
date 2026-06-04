# VibeX Sprint60 需求分析报告

**Sprint**: Sprint60
**日期**: 2026-06-03
**基于**: Sprint58-S59 已完成功能，识别下一轮迭代缺口

---

## Sprint58-S59 交付总结

| Sprint | Epic | 名称 | 关键产出 |
|--------|------|------|---------|
| S58 | E1 | 画布版本分支管理 | canvasHistoryStore.saveSnapshot/loadSnapshot + HistoryPanel 双Tab + IndexedDB snapshots表 |
| S58 | E2 | 桌面文件拖拽导入 | useFileDrop + DropOverlay + FileImportDialog + DDSFlow onDrop集成 |
| S58 | E3 | 协作者Cursor同步 | coords.ts 坐标转换 + broadcastCursor(100ms节流) + 15 vitest |
| S58 | E4 | Canvas分享权限 | ShareDialog 权限下拉 + generateShareToken/checkSharePermission + 46 vitest |
| S58 | E5 | 协作冲突增强 | wsConflictHandler + ConflictDialog + ConflictStore 三选项处理 |
| S59 | E1 | 画布全局搜索 | Cmd+K搜索面板 + Fuse.js + useSearchIndex + 21 vitest |
| S59 | E2 | 评论实时通知 | @mention通知 + reactions支持 + wsCommentHandler增强 |
| S59 | E3 | 画布节点自动布局 | dagreLayout + autoLayoutStore + Cmd+L集成 + 20 vitest |
| S59 | E4 | 模板批量导入导出 | importTemplates/exportTemplates + JSON/YAML格式 + conflict策略 |
| S59 | E5 | 键盘快捷键扩展 | shortcutStore冲突检测 + loadDefaults + DDSToolbar设置按钮 |

**S58-S59 已验证技术基础**:
- IndexedDB 持久化全链路（S49至今 history/template/comment/shortcut/snapshot/sessions）
- Zustand store + vitest 测试文化成熟（vibex-fronted 全量 300+ 测试）
- WebSocket 协作者同步: presence + cursor + conflict + chat 全覆盖
- Fuse.js 全文搜索 + dagre 自动布局算法均已掌握
- CMD+K/L 全局快捷键框架就绪

---

## Sprint60 需求分析 (P001-P005)

### P001: 画布版本历史 UI 增强 — 快照时间线与分支视图 (P0)

**问题**: S58-E1 实现了 canvasHistoryStore snapshot 持久化 + HistoryPanel 基本 UI，但缺少快照时间线视图和分支切换能力。用户无法直观浏览多个快照、比较差异或快速回滚到历史版本。

**根因**: HistoryPanel 只有列表视图，没有"快照分支"概念。IndexedDB snapshots 表支持多快照，但 UI 只展示 flat 列表。`compareSnapshots()` diff 逻辑未集成到 UI。

**影响**: P0 — 版本分支是 VibeX 差异化核心功能，S58 打下数据层基础后，S60 必须完成 UI 层最后一公里。

**技术方案**:
1. 扩展 `HistoryPanel.tsx` — 新增"时间线视图" Tab，展示快照创建时间轴
2. 新增 `SnapshotDiffDialog.tsx` — 两快照对比，显示新增/删除/修改的节点卡片
3. 扩展 `canvasHistoryStore.ts` — 新增 `compareSnapshots(snapshotIdA, snapshotIdB)` 方法
4. 快照重命名/标记星标功能
5. `Snapshot` 类型支持 `branchName?: string` 字段

**验收标准**:
- HistoryPanel 有"时间线视图"Tab，与"列表视图"Tab 并列
- 时间线视图展示快照创建时间轴，点击快照弹出预览浮层
- 点击"比较"按钮打开 SnapshotDiffDialog，显示两快照差异
- `compareSnapshots()` 正确返回 {added:[], removed:[], modified:[]}
- vitest 测试覆盖: 时间线渲染、diff 对比逻辑、快照重命名

---

### P002: 批量操作增强 — 画布批量删除/重命名 + 卡片批量操作面板 (P1)

**问题**: 当前 VibeX 没有画布级别的批量管理能力。用户画布列表（CanvasListPanel）无法批量删除、重命名或导出多个画布。S57-E4 曾计划 batchDelete/batchRename 但未交付。

**根因**: `canvasStore.ts` 有 `batchDeleteCanvas` 和 `renameCanvas` 方法，但用户没有操作入口。

**影响**: P1 — 影响重度用户的日常管理效率。个人工作区有 50+ 画布时，单个删除/重命名非常繁琐。

**技术方案**:
1. 在 `CanvasListPanel.tsx` 工具栏新增"批量选择"模式（checkbox 多选）
2. 新增 `BatchOpsToolbar.tsx` — 批量操作浮层（删除/重命名/导出）
3. 扩展 `canvasStore.ts` — 确认 `batchDeleteCanvas(ids[])` 和 `renameCanvas(id, newName)` 已实现
4. 批量删除确认对话框（显示即将删除 N 个画布）
5. 批量重命名支持前缀/后缀批量替换

**验收标准**:
- CanvasListPanel 有批量选择模式（checkbox）
- 批量选择后显示 BatchOpsToolbar
- 批量删除显示确认对话框，最终调用 `canvasStore.batchDeleteCanvas()`
- 批量重命名支持替换模式（前缀/后缀替换）
- vitest 测试: batchDeleteCanvas, renameCanvas, BatchOpsToolbar

---

### P003: 协作增强 — 活动流 + 在线状态指示 (P1)

**问题**: S42 开始做 presence/cursor，但协作者之间的"活动流"缺失。用户不知道协作者在编辑什么节点、什么时候做了操作。

**根因**: `presenceStore.ts` 有 `updateCursor()` 但没有"活动事件"概念。WebSocket 只广播 cursor 位置，没有结构化的 activity feed。

**影响**: P1 — 协作场景下的 awareness（情境感知）缺失，用户体验接近"单人在用"而非"多人实时协作"。

**技术方案**:
1. 新增 `activityStore.ts` — 协作者活动状态管理
2. 扩展 `wsCollaborationHandler.ts` — 新增 `activity:update` 消息类型
3. 新增 `ActivityFeed.tsx` — 协作者最近活动面板
4. 扩展 `RemoteCursor.tsx` — 在线状态指示器（绿色脉冲点 = 在线，灰色 = 空闲>5min）
5. `presenceStore.ts` 新增 `lastActivity` 字段

**验收标准**:
- ActivityFeed 面板展示最近 5 条协作者活动
- RemoteCursor 有明确的在线状态指示
- WS activity 消息广播间隔 5s，最新操作 30s 后降级为"空闲"
- `activityStore.ts` 单元测试覆盖
- vitest 测试: activityStore, RemoteCursor 在线状态渲染

---

### P004: 画布导出增强 — 多格式批量导出 + PNG/PDF 单画布导出 (P1)

**问题**: S58-S59 实现了模板批量导入导出，但画布本身的导出能力很弱。只能导出 `.vibex`/`.json` 格式，缺少用户常用的 PNG、PDF 格式。

**根因**: `ZipExporter.ts` 已有批量导出基础设施。需要扩展支持 PNG/PDF，并打通从 CanvasListPanel 一键批量导出的 UI 链路。

**影响**: P1 — 画布导出是高频用户需求，PNG 用于分享，PDF 用于归档。

**技术方案**:
1. 扩展 `ZipExporter.ts` — 新增 `exportMultipleAsPNG(zip)` 和 `exportMultipleAsPDF(zip)` 方法
2. 使用 `html-to-image` 库进行 PNG 截取
3. 在 CanvasListPanel 批量操作栏新增"导出为 PNG/PDF" 选项
4. 单画布导出：`CanvasToolbar` 新增"导出为 PNG"和"导出为 PDF"按钮
5. 导出进度条 UI（复用 S58-E4 的 ExportProgress 组件模式）

**验收标准**:
- CanvasListPanel 批量导出支持 ZIP（JSON+YAML）、PNG、PDF 三种格式
- 单画布 CanvasToolbar 有 PNG/PDF 导出按钮
- ZipExporter 支持多格式打包（JSON+YAML+PNG+PDF）
- 导出过程有进度条
- vitest 测试: ZipExporter PNG/PDF 导出方法

---

### P005: 搜索体验增强 — 搜索历史 + 模糊匹配 + 搜索结果高亮优化 (P2)

**问题**: S59-E1 实现了 Cmd+K 搜索面板，但搜索历史没有保存、模糊匹配不够智能、高亮效果不够明显。

**根因**: `canvasSearchStore.ts` 有 `searchResults` 但没有 `searchHistory` 概念。`fullTextSearch.ts` 使用 Fuse.js threshold=0.3 但对中文支持有限。

**影响**: P2 — 搜索是日常高频操作，体验细节影响使用愉悦度。

**技术方案**:
1. 扩展 `canvasSearchStore.ts` — 新增 `searchHistory`（最近 10 条，localStorage 持久化）
2. 优化 `fullTextSearch.ts` — 降低 Fuse.js threshold=0.2 提高精确度
3. 搜索面板 Tab 切换：支持"最近搜索"和"搜索结果"两个 Tab
4. 搜索结果高亮：`DDSSearchPanel` 搜索词用 `<mark>` 标签高亮
5. 键盘导航：↑↓ 选择搜索结果，Enter 跳转到目标节点

**验收标准**:
- 搜索面板显示"最近搜索"Tab（最多10条，点击可直接搜索）
- 搜索结果节点标题/内容中高亮匹配关键词
- ↑↓ 键可选择搜索结果，Enter 跳转
- `canvasSearchStore.searchHistory` localStorage 持久化
- vitest 测试: searchHistory, fullTextSearch, 高亮渲染
