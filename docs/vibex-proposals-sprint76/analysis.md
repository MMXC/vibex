# S76 分析文档

**项目**: vibex-proposals-sprint76
**日期**: 2026-06-07
**分析依据**: S74/S75 CHANGELOG + git log

---

## S74/S75 已完成功能摘要

### S74 (2026-06-07)
- **E1**: 搜索历史记录 — `recentSearches` chips 交互 + `canvasSearchStore` 状态
- **E2**: 模板标签筛选 — `filterByTag` + `selectedTags` 多标签 AND 筛选
- **E3**: 画布分支对比视图 — HistoryPanel Ctrl+Click 多选 + BranchDiffDialog
- **E4**: @mention 通知闭环 — `activityStore` → `notificationStore` bridge
- **E5**: 键盘导航增强 — aria-activedescendant / focus trap / Tab+Enter

### S75 (2026-06-07)
- **E1**: 搜索历史工具栏快捷入口 — RecentSearchesDropdown + DDSToolbar 入口
- **E2**: 通知中心分类 TabBar — 全部/提及/回复/系统 四类过滤
- **E3**: 分支对比历史记录 — IndexedDB 持久化 branchDiffHistory
- **E4**: 协作活动流消息发送 — CollabActivityPanel handleSend → addEntry
- **E5**: Canvas Snapshot Management — 多选批量删除 + CanvasSettingsDrawer 集成

---

## 识别到的迭代缺口

### P001 — 画布背景设置集成
**问题**: S52-E5 创建了 `ShortcutSettingsPanel.tsx` 作为 CanvasSettingsPanel 第4个 Tab，但画布背景设置从未实现。`DDSToolbar.tsx` L213 有硬编码 Background dots。画布背景色/网格/间距需要在 `CanvasSettingsPanel` 中可配置，且设置需要持久化到 `settingsStore`。

**根因**: S52 CanvasSettingsPanel DoD 包含"背景设置 Tab"但实现时只做了快捷键 Tab；S65 再次识别该 gap 但未实现。

**影响**: 用户无法自定义画布视觉体验；硬编码设置无法适配不同工作场景。

**技术方案**: 在 `CanvasSettingsPanel` 中添加第4个 Tab（背景），使用 `settingsStore.canvasBackground` 状态。DDSToolbar 从 store 读取背景配置，移除硬编码值。

**验收标准**:
- `settingsStore` 新增 `canvasBackground: { variant, gap, size, color }` 字段
- CanvasSettingsPanel 第4个 Tab 可切换背景样式（dots/grid/cross/none）
- DDSToolbar 从 settingsStore 读取背景配置，不再使用硬编码
- 背景设置通过 persist 中间件持久化

---

### P002 — 批量画布操作工具栏
**问题**: `FolderTree` 组件支持多选画布节点（`Ctrl+Click`），但选中后没有批量操作入口。S73-E4 BranchDiffDialog 使用了 Ctrl+Click 多选 UI，但没有扩展到通用批量操作。

**根因**: 多选基础设施存在（HistoryPanel），但没有通用的 BatchOpsToolbar 覆盖层。

**影响**: 用户管理多个画布（批量导出/移动/删除）效率低；FolderTree 多选能力被浪费。

**技术方案**: 创建 `BatchOpsToolbar.tsx` 覆盖在 FolderTree 上方（`position: fixed` / `z-index`），显示选中数量 + 操作按钮（导出/移动/删除）。监听 FolderTree 的多选状态变化。

**验收标准**:
- `FolderTree` 多选（Ctrl+Click）后自动显示 BatchOpsToolbar
- 支持批量导出（选中画布打包 .zip）、批量移动（到目标文件夹）、批量删除
- 批量删除需二次确认弹窗
- 选中数量 badge 实时更新

---

### P003 — 全文搜索增强
**问题**: S56-E2 实现了基础全局搜索，但仅支持画布标题的模糊匹配。S65-E4 的 GlobalSearchPanel 也依赖 `fuzzySearch` 的标题搜索。无法搜索画布内容/模板描述/协作者名称。

**根因**: `canvasListStore` 没有索引画布内容；搜索只查 `canvas.name` 字段。

**影响**: 大型工作空间用户无法快速定位画布；搜索体验远低于 Notion/Miro 等竞品。

**技术方案**: 在 `canvasListStore` 中维护 `canvasIndex: { id, name, description, tags, collaboratorIds }[]`，使用 Fuse.js 对索引进行搜索（支持多字段加权）。GlobalSearchPanel 扩展搜索结果类型标签（画布/模板/协作者）。

**验收标准**:
- 搜索支持匹配画布名称、描述、标签
- GlobalSearchPanel 搜索结果分组显示（画布/模板）
- 搜索响应时间 <100ms（本地 Fuse.js）
- 热键 `Cmd/Ctrl+K` 全局呼出搜索面板

---

### P004 — 画布导入导出完整流程
**问题**: S56 实现了 `ZipExporter` 服务（zip 下载），但 DDSToolbar 的 ExportMenu 入口只触发单个画布下载。S75-E5 的 SnapshotManagerPanel 涉及画布快照但不是通用导入。

**根因**: ZipExporter 服务存在，但 DDSToolbar ExportMenu 没有导出菜单选项；导入流程完全缺失。

**影响**: 用户无法批量导出多个画布；无法从外部 zip 导入画布。

**技术方案**:
- ExportMenu 添加"导出选中画布"/"导出全部画布"选项
- 新建 `CanvasImportPanel` 组件，支持选择 .vibex / .json 文件导入
- `ZipExporter` 扩展支持批量打包

**验收标准**:
- ExportMenu 显示"导出选中画布"（当 FolderTree 有选中时激活）
- ExportMenu 显示"导出全部画布"
- 导入面板支持 .vibex / .json 文件拖拽上传
- 导入后画布出现在目标文件夹中

---

### P005 — 协作冲突检测与提示
**问题**: S62-E1 实现了 RemoteCursorsLayer（协作者在线状态），S74-E4 实现了 @mention 通知。但当两个用户同时编辑同一画布时，系统没有任何冲突检测或提示。

**根因**: `usePresenceStore` 有 `remoteUsers` 但没有"编辑同一个节点"检测；WS 消息只有 cursor 位置更新。

**影响**: 多用户协作时，后保存者可能覆盖先保存者的更改；用户不知道有其他人正在编辑同一画布。

**技术方案**: 在 `usePresenceStore` 中新增 `editingNodeId?: string` 字段（通过 WS 广播）。`DDSCanvasPage` 监听 remoteUsers 的 editingNodeId，当检测到远程用户编辑同一节点时，显示 `ConflictWarningBanner`（非阻塞提示条）。

**验收标准**:
- `presenceStore` 新增 `remoteEditing: Map<userId, {nodeId, userName}>` 状态
- DDSCanvasPage 检测到同节点编辑时显示 WarningBanner
- WarningBanner 显示"张三正在编辑此节点"，3秒后自动消失
- 同一用户不会收到自己的编辑提示
