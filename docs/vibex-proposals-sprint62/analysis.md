# Sprint62 需求分析报告

**项目**: vibex-proposals-sprint62  
**Sprint**: 62  
**分析日期**: 2026-06-04  
**分析方法**: CHANGELOG 缺口分析（S61 + S60 + S59 产出对比）

---

## 执行摘要

Sprint61 完成了画布版本历史时间线、批量导出 PNG/SVG/PDF、国际化完善、AI Session 画布上下文集成等核心功能。Sprint62 将聚焦**协作者实时同步**与**画布生命周期管理**两大方向，填补多用户协作和画布持久化管理的空白。

---

## 提案列表

### P001: 协作者实时同步 — 多人同时编辑感知

**问题描述**:  
当前协作者通过 WebSocket 同步 cursor 和 activity 状态，但无法感知他人当前正在编辑的节点/卡片。多用户协作时，同一节点被两人同时编辑会导致数据覆盖风险。

**根因分析**:  
S60-E3 的 activityStore 仅记录最近 5 条活动条目，没有实时"节点锁定"或"正在编辑"感知能力。缺少细粒度的协作冲突提示。

**影响评估**:  
- 高频协作场景（>2 用户同时编辑）数据覆盖风险
- 用户无法判断某个节点是否正在被他人编辑

**技术方案**:  
1. `collaborationStore.ts` — 扩展现有 presenceStore，新增 `editingNodeIds: Map<nodeId, userId>` 追踪
2. `wsCollabHandler.ts` — 新增 `collab:editing` 消息类型，节点开始编辑/结束编辑广播
3. `NodeEditorLock.tsx` — 节点编辑锁定 UI（节点边框变虚线 + 显示锁定者名称）
4. 冲突检测：用户提交修改前检查 `editingNodeIds`，若节点被他人编辑则弹窗提示

**验收标准**:
- [ ] 2+ 用户打开同一节点时，双方都能看到对方正在编辑（虚线边框 + 名称标签）
- [ ] 用户离开编辑状态后，其他用户立即收到解锁通知
- [ ] `collaborationStore` vitest 覆盖编辑锁定状态转换

---

### P002: 画布文件夹管理 — 画布持久化组织

**问题描述**:  
用户创建大量画布后，无法有效组织。所有画布平铺在 CanvasListPanel 中，缺少文件夹/分类能力。

**根因分析**:  
S58/S59 实现了画布搜索，但没有文件夹/分类管理。现有的 `templateStore` 提供了模板分类，但用户自己的画布没有组织能力。

**影响评估**:  
- 画布数量 >20 时管理效率显著下降
- 用户依赖画布标题进行人工记忆排序

**技术方案**:  
1. `canvasFolderStore.ts` — Zustand store，`folders[]` + `canvasFolderMap: Map<canvasId, folderId>`
2. `FolderTree.tsx` — CanvasListPanel 左侧文件夹树形视图，支持展开/折叠/重命名
3. `CreateFolderDialog.tsx` — 创建文件夹对话框（支持中文名称）
4. `moveCanvasToFolder(canvasId, folderId)` — 画布移动 action，支持批量移动
5. `DDSToolbar.tsx` — 新增"移动到文件夹"按钮（`aria-label="移动到文件夹"`）

**验收标准**:
- [ ] 用户可创建/重命名/删除文件夹，画布可移动到指定文件夹
- [ ] CanvasListPanel 筛选模式下按文件夹分组显示画布
- [ ] `canvasFolderStore` vitest 覆盖 CRUD + 画布移动逻辑

---

### P003: 画布云端备份与恢复 — 数据安全

**问题描述**:  
当前版本历史（canvasHistoryStore）仅在本地 IndexedDB 存储快照。浏览器清除数据后版本历史丢失，无法跨设备同步。

**根因分析**:  
S61-E1 实现了完整的本地版本历史，但缺少云端同步机制。IndexedDB 仅本地持久化，无冗余。

**影响评估**:  
- 浏览器数据清除或设备更换导致版本历史完全丢失
- 重要画布缺乏云端灾备能力

**技术方案**:  
1. `backupStore.ts` — Zustand store，`lastBackupTime` + `backupStatus` 状态
2. `BackupService.ts` — 封装云端备份 API（POST /api/backup），序列化画布 JSON + 快照元数据
3. `RestoreDialog.tsx` — 备份恢复对话框，显示备份历史列表 + 预览 + 恢复按钮
4. `DDSToolbar.tsx` — 新增备份按钮（`aria-label="云端备份"`）
5. `useAutoBackup.ts` — Hook，页面可见性变化时触发自动备份（间隔 30 分钟）

**验收标准**:
- [ ] 用户可手动触发云端备份，备份成功显示 toast 通知
- [ ] 备份恢复对话框列出历史备份，支持预览和恢复
- [ ] 页面隐藏 30 分钟后自动备份（仅当画布有变更时）
- [ ] `BackupService` vitest 覆盖上传/下载/冲突处理

---

### P004: 协作 Undo/Redo — 多人编辑撤销同步

**问题描述**:  
当前 canvasHistoryStore 的撤销/重做仅对本地用户有效。当协作者 A 撤销了一个操作，协作者 B 无法感知该撤销，导致状态不一致。

**根因分析**:  
S61-E1 的 `canvasHistoryStore` 是单用户设计。`historyDB` 快照不包含操作意图描述，协作者无法区分"用户 X 撤销了操作 Y"。

**影响评估**:  
- 多用户协作时，撤销操作可能导致其他用户编辑被意外覆盖
- 协作场景下撤销行为不可预测

**技术方案**:  
1. `collabHistoryStore.ts` — 协作历史 store，扩展现有 canvasHistoryStore，新增 `lastOperationId` + `operationQueue` 队列
2. `wsHistoryHandler.ts` — 监听 `history:sync` WebSocket 消息，同步协作者的撤销/重做操作
3. `HistoryPanel.tsx` — 扩展现有 HistoryPanel，新增"协作者操作"标签页，显示各协作者操作历史
4. 冲突处理：协作者撤销本地操作时，通过 WS 广播 `history:undo` 事件，其他客户端回退相同操作

**验收标准**:
- [ ] 协作者 A 撤销后，协作者 B 画布自动回退相同操作
- [ ] 协作历史面板显示所有协作者的操作记录（带用户颜色标识）
- [ ] 撤销冲突时（目标快照已被新操作覆盖）显示提示弹窗

---

### P005: 离线 PWA 支持 — Service Worker 缓存策略

**问题描述**:  
VibeX 目前不具备离线能力。当网络断开时，用户无法访问已打开的画布。AIGC 对话完全依赖实时网络。

**根因分析**:  
没有 Service Worker 注册，Next.js 静态资源没有缓存策略。IndexedDB 仅存储快照数据，不包含应用 shell。

**影响评估**:  
- 网络不稳定环境（地铁、飞机）下体验完全中断
- AIGC 对话在网络恢复前完全不可用

**技术方案**:  
1. `public/sw.js` — Service Worker，注册缓存策略（App Shell 优先 + API 请求网络优先）
2. `next.config.js` — 配置 `headers()` 为静态资源添加 Cache-Control + Service-Worker-Allowed
3. `manifest.json` — PWA Web App Manifest（name, icons, theme_color, start_url）
4. `useOfflineMode.ts` — Hook，检测 `navigator.onLine` 状态，`isOffline` 状态 + toast 提示
5. `OfflineBanner.tsx` — 网络断开时显示顶部离线提示条（`role="alert"`, `aria-live="polite"`）
6. AIGC 对话离线降级：网络恢复后自动重连，显示"网络已恢复，正在同步"状态

**验收标准**:
- [ ] 首次加载后，浏览器 Service Worker 缓存 App Shell，离线可访问最近访问的画布
- [ ] 离线状态下 DDSToolbar 显示离线图标，AIGC 面板显示重连提示
- [ ] 网络恢复后自动同步未提交的变更（检测 `navigator.onLine` 恢复事件）
- [ ] Lighthouse PWA 评分 ≥ 80

---

## 跨 Epic 技术债务

### 已知技术债务

1. **canvasHistoryStore 缺少 `snapshotTags` 字段**: S61-E1 的快照不支持标签/星标过滤（`listSnapshots(branch, starred)` 已实现但 UI 还未接入）
2. **wsCommentHandler 缺少错误边界**: @mention 动态导入失败时无降级处理
3. **DDSSearchPanel searchHistory 无大小限制**: S60-E5 的 `canvasSearchStore` searchHistory 上限为 10 条，已实现但需确认实现
4. **presenceStore cursorX/cursorY 无节流**: 鼠标移动时每帧广播，协作者多时性能下降

---

## 附录：分析来源

| Sprint | Epics | 产出物 |
|--------|-------|--------|
| S59 | E1-E5 | 全局搜索、评论通知、自动布局、模板批量导入、快捷键 |
| S60 | E3-E5 | 协作活动流、画布导出增强、搜索体验 |
| S61 | E1-E4 | 画布版本历史、批量导出、i18n、AI Session 上下文 |
| S61 | E5 | 画布版本分支管理（phase2 执行中）|
