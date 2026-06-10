# Sprint79 提案分析 — 2026-06-08

**分析师**: Hermes Coord Heartbeat
**日期**: 2026-06-08
**依据**: CHANGELOG S78 缺口分析

---

## 提案摘要

基于 S78 已完成功能（分支自动合并/模板订阅/节点评论/定时导出/关联追踪），识别以下 5 个核心缺口：

---

### P001: 定时导出执行引擎 — 从配置到落地

**问题描述**: S78-E4 实现了 `ScheduledExport` 配置 UI（`ScheduledExportPanel`）和 `addScheduledExport/removeScheduledExport` 等 CRUD，但定时导出的**实际执行引擎缺失**。导出的 cron 表达式和 Webhook URL 只被存储，没有后台定时器去真正触发导出。

**根因**: `parseCronNextRun()` 存在但从未被轮询调用；`ZipExporter.exportWithWebhook()` 只在用户手动触发时调用。

**影响**: 用户配置了定时导出但永远不会被执行，整个功能形同虚设。

**技术方案**:
1. `ScheduledExportRunner.ts` — 全局单例执行引擎：
   - `startScheduler()` — 页面加载时启动（放在 DDSCanvasPage 或 App 根组件 useEffect）
   - 使用 `setInterval` 每 60 秒轮询所有 `scheduledExports`，调用 `parseCronNextRun()` 判断是否到期
   - 到期时调用 `ZipExporter.exportWithWebhook()`，执行成功后更新 `lastRunAt`
   - `stopScheduler()` — 清理
2. `canvasListStore.ts` 新增：
   - `lastRunAt?: string` — 字段加到 `ScheduledExport` interface
   - `markExportRun(id)` — 更新 `lastRunAt` + 重新计算下次执行时间
3. `ScheduledExportRunner.test.ts` — mock setInterval + mock ZipExporter，测试轮询逻辑和到期触发
4. `canvasListStore.e4-scheduled-export.test.ts` 扩展：测试 `markExportRun`

**验收标准**:
- `startScheduler()` 调用后，到期任务正确触发 `ZipExporter.exportWithWebhook`
- `markExportRun` 正确更新 `lastRunAt` 和下次执行时间
- vitest: 12/12

---

### P002: 模板更新通知面板 — 让通知落地

**问题描述**: S78-E2 实现了 `template_update` NotificationType 和 `getTemplateUpdates()`，但通知 UI **完全缺失**：
- `DDSToolbar` 没有通知铃铛按钮（相比 S68-E2 已有通用通知铃铛）
- 没有模板更新专属的通知面板 Tab 或筛选

**根因**: E2 只实现了通知类型定义和 store 逻辑，没有接入 Toolbar UI 和 NotificationPanel。

**影响**: 用户订阅了模板更新但无法在界面上看到更新通知。

**技术方案**:
1. `DDSToolbar.tsx` — 检查是否已有通知铃铛按钮（参考 S68-E2 扩展模式）：
   - 若已有 `isNotificationOpen` 状态和 `NotificationPanel` → 仅需确认 `unreadCount` 是否包含 `template_update`
   - 若缺失 → 按 S68-E2 模式添加铃铛按钮
2. `NotificationPanel.tsx` — 新增「模板更新」Tab 或筛选：
   - `useNotificationStore` 过滤 `type === 'template_update'`
   - 显示模板缩略图 + 作者名 + 更新时间
   - 点击跳转到 `TemplateMarketplacePanel`
3. `notificationStore.ts` — 确保 `getUnreadCount()` 包含 template_update 计数
4. `NotificationPanel.template-update.test.tsx` — 模板更新通知显示/筛选 6 测试

**验收标准**:
- Toolbar 铃铛显示未读模板更新数
- NotificationPanel 有模板更新 Tab
- vitest: 6/6

---

### P003: 评论通知与提及通知 — 通知系统补全

**问题描述**: S78-E3 实现了节点评论 CRUD，但评论被回复时**没有通知**被创建。用户添加评论后，无法收到「某人在我的评论下回复」的通知。

**根因**: `collabSessionStore.addComment()` 中 `parentId` 参数存在但未触发通知创建；`mentionStore` 的 `@提及` 通知也未接入通知 store。

**影响**: 评论互动无反馈，用户不知道自己的评论被回复了。

**技术方案**:
1. `collabSessionStore.ts` 扩展 `addComment`：
   - 当 `parentId` 存在时，查找被回复的评论获取 `authorId`
   - 调用 `notificationStore.addNotification({ type: 'comment_reply', targetUserId: parentComment.authorId, ... })`
2. `mentionStore.ts`（S51 已存在）— `@提及` 时同样创建 `mention` 类型通知
3. `notificationStore.ts` — 新增 NotificationType `'comment_reply'` 和 `'mention'`
4. `NotificationPanel.tsx` — 显示评论回复和提及的通知项，带跳转锚点
5. `collabSessionStore.comments.test.ts` 扩展：测试 `addComment` 回复时通知创建
6. `mentionStore.mention-notification.test.ts` — 提及触发通知 4 测试

**验收标准**:
- 回复评论时，通知 store 中出现 `comment_reply` 类型记录
- @提及时出现 `mention` 类型记录
- NotificationPanel 正确显示两类通知
- vitest: 10/10

---

### P004: 画布关联网络可视化 — 从数据到图形

**问题描述**: S78-E5 实现了 `getCanvasRelations` 和 `CanvasRelationsPanel` 列表视图，但没有**网络图可视化**。用户无法直观看到画布间的拓扑结构。

**根因**: 列表形式只能展示关系，无法展示层级和拓扑。

**影响**: 画布关系网络对大型项目用户（大量关联画布）缺乏可操作性。

**技术方案**:
1. `CanvasRelationGraph.tsx` — 新增组件：
   - 使用纯 CSS/HTML 实现简单关系图（当前节点居中，父/子/关联画布围绕）
   - 每个节点为可点击卡片，点击跳转对应画布
   - 支持 `maxDepth` 参数控制显示层级（默认 1）
2. `CanvasRelationsPanel.tsx` — Tab 切换：列表视图 ↔ 图形视图
3. `CanvasRelationGraph.test.tsx` — 渲染验证 + 交互 6 测试
4. 扩展 `canvasListStore.getCanvasRelations` 支持 `maxDepth` 参数

**验收标准**:
- 图形视图正确显示父子/关联画布节点
- 点击节点跳转正确
- vitest: 6/6

---

### P005: 合并历史与版本差异查看器

**问题描述**: S78-E1 实现了分支合并和 `BranchAutoMergeDialog`，但用户无法查看**合并历史记录**和两个分支间的**差异对比**。合并后没有记录，用户难以追踪何时合并了什么。

**根因**: `canvasHistoryStore` 没有 `mergeHistory` 概念；没有版本对比 UI。

**影响**: 合并操作无审计追踪；用户无法直观比较分支间差异。

**技术方案**:
1. `canvasHistoryStore.ts` 新增：
   - `MergeHistoryEntry` interface: `{ id, canvasId, sourceBranch, targetBranch, mergedAt, mergedBy, snapshotId }`
   - `mergeHistory: MergeHistoryEntry[]` — 合并历史数组，IndexedDB 持久化
   - `recordMerge(entry)` — 每次 `autoMergeBranch` 或手动合并成功后记录
   - `getMergeHistory(canvasId)` — 返回画布合并历史
2. `MergeHistoryPanel.tsx` — 新增面板：
   - 时间线形式显示历史记录
   - 每条记录显示源/目标分支 + 时间 + 合并者
   - 点击可查看该合并的 snapshot diff
3. `BranchManager.tsx` — 集成 MergeHistoryPanel（Tab 或 drawer 入口）
4. `canvasHistoryStore.merge-history.test.ts` — recordMerge + getMergeHistory 6 测试

**验收标准**:
- 合并成功后 history 中出现记录
- MergeHistoryPanel 正确渲染历史时间线
- vitest: 6/6

---

## 优先级与依赖

| ID | 提案 | 优先级 | 跨 Epic 依赖 |
|----|------|--------|-------------|
| P001 | 定时导出执行引擎 | P0 | canvasListStore, ZipExporter |
| P002 | 模板更新通知面板 | P1 | notificationStore, DDSToolbar |
| P003 | 评论/提及通知 | P1 | collabSessionStore, mentionStore, notificationStore |
| P004 | 关联网络可视化 | P2 | canvasListStore, CanvasRelationsPanel |
| P005 | 合并历史查看器 | P2 | canvasHistoryStore, BranchManager |

**核心依赖关系**: P001 是 S78-E4 的缺失部分，必须先完成；P002/P003 是 S78-E2/E3 的 UI 落地；P004 依赖 S78-E5 的数据基础。
