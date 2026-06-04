# VibeX Sprint58 提案分析报告

**Sprint**: Sprint58  
**日期**: 2026-06-03  
**分析师**: coord (self-impl due to analyst-review phantom ghost)  
**基于**: Sprint56+Sprint57 交付成果 + CHANGELOG gap analysis

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
2. `historyDB.ts` 新增 `snapshots` 表（IndexedDB），Snapshot 接口含 `id/name/timestamp/chapterData`
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

**根因分析**: `useFileDrop.ts` hook 存在，`FileImportDialog.tsx` 和 `DropOverlay.tsx` 已实现，但 `DDSDanvasPage` 未挂载 `DropOverlay` 或集成拖拽事件监听。

**影响**: 文件导入便利性低，用户必须点击按钮再选文件而非直接拖拽。

**技术方案**:
1. `DDSDrawflow.tsx` 根容器添加 `onDrop` + `onDragOver` 事件处理
2. 拖拽进入时显示 `DropOverlay`（半透明遮罩 + "释放以导入"文案）
3. 拖拽释放时调用 `useFileDrop` 的 `processDrop(files)` → 触发 `FileImportDialog` 预览
4. 支持格式：`.vibex` / `.json` / `.yaml` / `.yml`
5. 移动端：使用 `<input type="file">` 作为 fallback

**验收标准**:
- [ ] 从桌面拖拽 .vibex/.json/.yaml/.yml 文件到画布 → 触发 DropOverlay → 释放后显示 FileImportDialog 预览
- [ ] 预览确认后节点合并到当前画布（追加，非覆盖）
- [ ] 非支持格式文件拖拽 → 显示错误提示
- [ ] vitest 覆盖 useFileDrop + DropOverlay

---

### P003: 协作者 Cursor 实时同步完整链路

**问题描述**: S54-E3 的 Cursor 同步 commit 已推送 main，但需验证 `throttleCursorBroadcast` 和 screenToFlowCoords 是否在 origin/main 而非 temp branch。

**根因分析**: 需要验证 cursor broadcast 节流（`throttleCursorBroadcast`）是否在 `origin/main` 的 DDSDanvasPage 中实际调用，以及节流阈值。当前 DDSDrawflow 的 `onNodeMouseMove` 是否真正触发 broadcast 需确认。

**影响**: 协作者看到的远程光标存在明显延迟或抖动，体验不流畅。

**技术方案**:
1. 验证 `throttleCursorBroadcast` 在 origin/main 的 `useCollaboration.ts` 中
2. 确认 DDSDrawflow 的 `onNodeMouseMove` 触发 cursor 广播
3. 如缺失，实现完整的光标广播链路（mouse → flow coords → broadcast）
4. screenToFlowCoords 转换在 `src/lib/canvas/` 中实现为 utils

**验收标准**:
- [ ] `throttleCursorBroadcast` 存在于 origin/main `useCollaboration.ts`
- [ ] DDSDrawflow `onNodeMouseMove` → cursor 广播链路完整
- [ ] vitest 覆盖 cursor 广播 + 节流逻辑
- [ ] 集成测试：两个用户的光标在 100ms 内同步显示

---

### P004: 画布隐私与分享 — 链接分享 + 权限控制

**问题描述**: 当前 VibeX 没有画布分享机制。用户无法通过链接分享画布，也无法控制访问权限（仅查看/可编辑）。

**根因分析**: 没有分享 API、没有权限模型、没有链接生成逻辑。canvasListStore 的 canvas 对象没有 `isPublic` / `shareToken` / `permissions` 字段。

**影响**: 协作场景受限于同一团队成员；无法实现公开画布展示。

**技术方案**:
1. `canvasListStore` 新增 `shareToken: string` / `isPublic: boolean` / `permissions: 'view'|'edit'|'none'` 字段
2. 后端 `/api/canvas/share` 端点：生成 shareToken、设置权限
3. 前端 `ShareDialog.tsx`：输入邮箱/链接、一键复制、权限下拉
4. 分享链接格式：`/canvas/<canvasId>?share=<token>`
5. 未授权访问：显示"仅限受邀用户"提示

**验收标准**:
- [ ] 用户可生成带 token 的分享链接
- [ ] 分享链接在有效期内可访问对应画布
- [ ] 权限下拉（仅查看/可编辑）正常工作
- [ ] vitest 覆盖 shareToken 生成 + 权限验证

---

### P005: 协作冲突增强 — ConflictDialog 完整实现

**问题描述**: S52-E3 的 ConflictDialog 是 stub 实现，仅显示文字冲突描述，没有三个选项（保留本地/接受远程/手动合并）。用户在并发编辑时无法选择保留策略。

**根因分析**: S52-E3 的 `ConflictDialog.tsx` 只渲染了冲突描述，没有实现 DoD 中的三个选项和合并逻辑。

**影响**: 并发冲突时用户只能放弃修改，体验差。

**技术方案**:
1. 扩展 `wsConflictHandler.ts`：检测冲突时存储 `conflictData` 到 `conflictStore`
2. `conflictStore` 新增 `conflictData: ConflictData | null` + `resolvedStrategy: 'local'|'remote'|'manual'|null`
3. `ConflictDialog.tsx` 完整实现：显示本地/远程 diff + 三个选项按钮
4. "手动合并"：打开编辑器让用户直接编辑 JSON
5. 选择后：发送 `conflict:resolve` WS 消息 + 更新 local state

**验收标准**:
- [ ] ConflictDialog 显示本地/远程 diff 内容
- [ ] 三个选项（保留本地/接受远程/手动合并）均可点击
- [ ] 手动合并打开编辑器，提交后正确合并
- [ ] vitest 覆盖 ConflictDialog + conflictStore
