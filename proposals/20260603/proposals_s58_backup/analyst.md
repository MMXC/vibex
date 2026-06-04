# VibeX Sprint58 提案分析报告

**Sprint**: Sprint58  
**日期**: 2026-06-03  
**分析师**: coord (self-impl due to analyst-submit phantom)  
**基于**: Sprint56+Sprint57 交付成果

---

## 背景：Sprint56+Sprint57 交付总结

### Sprint57 (2026-06-03 完成)
- **E1**: CanvasList 批量导出 — BatchExportPanel + useBatchExportList + DDSToolbar集成
- **E2**: 画布内 AI Session 嵌入面板 — EmbeddedAgentPanel + useEmbeddedAgent + EmbeddedAgentContext
- **E3**: 用户创建模板 + 我的模板分类 — isUserCreated 字段 + CategoryTab 自定义标签
- **E4**: 批量重命名 + 批量删除 — selectedCanvasIds store + BatchOpsPanel + BatchRename/DeleteDialog
- **E5**: @提及通知链路完善 — NotificationPanel Tab + sourceType 分类 + NotificationBell

### Sprint56 (2026-06-03 完成)
- **E1.5+E2**: canvasListStore vitest 14项 + 收藏画布 star button
- **E3**: PWA 离线缓存 — OfflineBanner + Service Worker Workbox

---

## Sprint58 高优先级提案 (P001-P005)

---

### P001: 画布版本分支管理 — 命名版本保存与恢复

**问题描述**: 当前 HistoryPanel 仅展示操作历史，无法命名保存关键版本或恢复历史快照。用户无法在重要节点前保存"检查点"，也无法命名分支。

**根因分析**: S54 的 HistoryPanel UI 已完成（历史命令列表），但 `canvasHistoryStore` 只存储命令序列（command pattern），没有版本快照（snapshot）概念。IndexedDB 持久化层（S51-E1 的 `historyDB.ts`）也只存命令，不存版本。

**影响**: 用户对版本控制需求迫切；当前只能依赖 undo/redo 有限步数。

**技术方案**:
1. `canvasHistoryStore` 新增 `snapshots: Snapshot[]` 状态 + `saveSnapshot(name)` / `loadSnapshot(id)` / `listSnapshots()` actions
2. `historyDB.ts` 新增 `snapshots` 表（IndexedDB），Snapshot 接口含 `id/name/timestamp/chapterData`（完整画布数据快照）
3. `HistoryPanel.tsx` 改造：新增"保存版本"按钮 + 版本列表（支持重命名/删除） + "恢复"按钮
4. 保存时序列化 `DDSDrawflow` 的 nodes/edges → 存入 IndexedDB
5. 恢复时用 `replaceNodes/edges` 替换当前画布状态

**验收标准**:
- [ ] 用户可命名保存任意版本，版本列表持久化
- [ ] 用户可从历史版本恢复，恢复后 undo/redo 栈清空
- [ ] 版本列表按时间倒序，支持删除
- [ ] IndexedDB `snapshots` 表读写正常，无数据丢失
- [ ] vitest 覆盖 `canvasHistoryStore.saveSnapshot/loadSnapshot`

---

### P002: 桌面文件拖拽导入 — 完整拖拽工作流

**问题描述**: S54-E2 构建了 `useFileDrop` hook 和 `FileImportDialog`，但拖拽触发器未接入 DDSDanvasPage。用户从桌面拖拽文件到浏览器无法触发导入流程。

**根因分析**: `useFileDrop.ts` hook 存在，`FileImportDialog.tsx` 和 `DropOverlay.tsx` 已实现，但 `DDSDanvasPage` 未挂载 `DropOverlay` 或集成拖拽事件监听。import 逻辑仅从"导入按钮"触发。

**影响**: 文件导入便利性低，用户必须点击按钮再选文件而非直接拖拽。

**技术方案**:
1. `DDSDrawflow.tsx` 根容器添加 `onDrop` + `onDragOver` 事件处理
2. 拖拽进入时显示 `DropOverlay`（半透明遮罩 + "释放以导入"文案）
3. 拖拽释放时调用 `useFileDrop` 的 `processDrop(files)` → 触发 `FileImportDialog` 预览
4. 支持格式：`.vibex` / `.json` / `.yaml` / `.yml`（已有 `parseImportFile`）
5. 移动端：使用 `<input type="file" accept=".vibex,.json,.yaml,.yml">` 作为 fallback

**验收标准**:
- [ ] 从桌面拖拽 .vibex/.json/.yaml/.yml 文件到画布 → 触发 DropOverlay → 释放后显示 FileImportDialog 预览
- [ ] 预览确认后节点合并到当前画布（追加，非覆盖）
- [ ] 非支持格式文件拖拽 → 显示错误提示
- [ ] vitest 覆盖 useFileDrop + DropOverlay

---

### P003: 协作者 Cursor 实时同步完整链路

**问题描述**: S54-E3 的 Cursor 同步 commit (`ffc2bc2a5`) 已推送 main，但 CHANGELOG 显示仅含 cursor:move 订阅 + CursorOverlay 渲染，未确认 throttleCursorBroadcast 和 screenToFlowCoords 是否在主分支而非 temp branch。

**根因分析**: 需要验证 cursor broadcast 节流（`throttleCursorBroadcast`）是否在 `origin/main` 的 DDSDanvasPage 中实际调用，以及节流阈值（60fps）。当前 DDSDrawflow 的 `onNodeMouseMove` 是否真正触发 broadcast 需确认。

**影响**: 协作者看到的远程光标可能抖动或频繁重绘（无节流），或光标位置屏幕坐标≠Flow坐标转换错误。

**技术方案**:
1. 验证 `throttleCursorBroadcast.ts` 在 origin/main：检查 `DDSDrawflow.tsx` 是否导入并调用
2. 如缺失：实现 `throttleCursorBroadcast`（lodash throttle 或自定义，60fps = 16ms）
3. 验证 `screenToFlowCoords` 坐标转换：在 `DDSDrawflow` 的 `onNodeMouseMove` 中调用，`project()` from `useReactFlow()`
4. CursorOverlay 渲染：仅在鼠标移动时更新（避免持续重绘）
5. 添加 cursor:move 的 WebSocket handler 在 `wsCommentHandler` 中统一处理
6. vitest: `throttleCursorBroadcast.test.ts` + `CursorOverlay.test.tsx`（已有）

**验收标准**:
- [ ] `throttleCursorBroadcast` 在 DDSDrawflow 中调用，频率 ≤ 60fps
- [ ] screenToFlowCoords 转换正确（屏幕像素坐标 → ReactFlow 逻辑坐标）
- [ ] 协作者收到 `cursor:move` 并在 <100ms 内渲染
- [ ] vitest 覆盖 throttle 函数

---

### P004: 画布隐私与分享 — 链接分享 + 权限控制

**问题描述**: 画布目前无分享机制，用户无法生成分享链接，也无法控制谁可以查看/编辑。协作者只能通过 WebSocket 实时协作，不能"异步查看"。

**根因分析**: 画布存储在 IndexedDB 本地，无服务端 API。当前 WebSocket 协作依赖同一 canvasId 下的实时同步。异步分享需要服务端支持（画布导出→上传→生成分享链接），这是一个较大的架构跨越。P0 阶段做前端链接生成 + 本地"导出发送"流程。

**影响**: 用户无法向不在线的协作者分享画布快照；每次协作必须同时在线。

**技术方案**:
1. `DDSToolbar` 新增 Share 按钮 → `ShareCanvasDialog.tsx`
2. `ShareCanvasDialog`：选项卡 [链接分享 / 导出发送]
   - 链接分享：生成 `canvasId` → 复制 URL（`/canvas/{id}?share=true`），显示只读水印
   - 导出发送：选择格式（.vibex / .json）→ 复制内容到剪贴板或下载
3. `DDSCanvasPage`：读取 URL 参数 `?share=true` → 进入只读模式（水印 + 无工具栏写操作）
4. 分享历史：`canvasListStore` 新增 `sharedLinks: SharedLink[]`（id/canvasId/createdAt/type）
5. `SharePanel.tsx`：展示历史分享链接，支持撤销

**验收标准**:
- [ ] Share 按钮 → 弹窗显示分享选项
- [ ] "复制链接" 复制完整 URL，粘贴后进入只读查看模式
- [ ] 只读模式显示水印，无保存/编辑功能
- [ ] 分享历史列表可管理
- [ ] vitest 覆盖 ShareCanvasDialog

---

### P005: 协作冲突处理增强 — 多人同时编辑的冲突解决 UI

**问题描述**: S52-E3 和 S53-E2 构建了 revision-based 冲突检测（`RevisionMismatchError`），但 ConflictDialog 的三个选项（Discard Local/Merge/Discard Remote）仅在冲突触发时显示 Toast，无完整 UI 工作流。用户不知道 Merge 实际做了什么。

**根因分析**: `wsRevisionHandler` 的 `onRevisionConflict` 回调存在，但 ConflictDialog 组件只有 stub 实现（占位文案）。Merge 策略未定义——是"取远程所有操作"还是"三方合并"不清楚。

**影响**: 多人同时编辑发生冲突时，用户体验差；冲突数据可能丢失。

**技术方案**:
1. `ConflictDialog.tsx` 完整实现：
   - Discard Local：放弃本地未提交操作，重置为远程 revision
   - Merge：取远程 revision 替换本地，追加本地操作队列（待重放）
   - Discard Remote：强制推送本地 revision 到远程
2. `wsRevisionHandler`：`onRevisionConflict` → 传入 `localOps[]` + `remoteOps[]` → dialog 返回 resolve action
3. Merge 策略实现：远程 revision 快照 → 本地操作队列 → replay 本地 ops → 新 revision
4. 冲突计数：`canvasHistoryStore` 新增 `conflictCount` + `hasUnresolvedConflict` 状态
5. `DDSToolbar` 冲突图标：冲突未解决时显示警告图标

**验收标准**:
- [ ] revision 冲突触发 ConflictDialog 显示
- [ ] 三个选项各正常工作（Discard Local/Merge/Discard Remote）
- [ ] Merge 后本地操作队列正确重放
- [ ] 冲突图标在 toolbar 显示（未解决时）
- [ ] vitest: wsRevisionHandler + ConflictDialog

---

## 提案优先级总结

| ID | 提案名称 | 优先级 | 风险 |
|----|---------|-------|------|
| P001 | 画布版本分支管理 | **P0** | 中（IndexedDB schema 扩展） |
| P002 | 桌面文件拖拽导入 | **P0** | 低（hook已存在） |
| P003 | 协作者 Cursor 同步 | **P1** | 中（需验证 throttle 在 main） |
| P004 | 画布隐私与分享 | **P1** | 中（链接格式需定义） |
| P005 | 协作冲突增强 | **P2** | 高（Merge 策略复杂） |

---

*本报告基于 Sprint56+Sprint57 交付成果自动生成。建议优先实现 P001+P002。*
