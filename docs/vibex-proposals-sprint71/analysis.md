# VibeX Sprint71 提案分析

**Sprint**: vibex-proposals-sprint71
**分析日期**: 2026-06-07
**分析来源**: CHANGELOG gap analysis (S68–S70)

---

## 执行摘要

基于 S68–S70 已完成功能，识别以下 5 个核心缺口：

| ID | 提案 | 类别 | 优先级 | 影响 |
|----|------|------|--------|------|
| P001 | 键盘快捷键可配置化 | Canvas UX | P0 | 所有用户 |
| P002 | 实时协作评论系统 | Collaboration | P0 | 团队用户 |
| P003 | 大型画布性能优化 | Canvas UX | P1 | 大型画布用户 |
| P004 | 画布使用统计分析 | Data Management | P2 | Pro 用户 |
| P005 | 模板评分与收藏增强 | Template System | P1 | 模板用户 |

---

## P001: 键盘快捷键可配置化

### 问题描述
当前 `useKeyboardShortcuts.ts` 中的快捷键硬编码在 `shortcuts` 数组中，用户无法自定义或禁用不喜欢的快捷键。每次升级可能覆盖用户习惯。

### 根因分析
S52-E5 创建了 `ShortcutSettingsPanel.tsx` 和 `shortcutStore.ts`，但仅支持查看快捷键列表和预设切换（Ctrl+Z undo vs Ctrl+Y redo）。缺少用户自定义绑定能力。

### 影响范围
- 所有 VibeX 用户，尤其是重度键盘用户
- 当前状态：`ShortcutSettingsPanel` 仅显示快捷键，无编辑能力

### 技术方案
1. **Store 扩展**: `shortcutStore.ts` 新增 `userBindings: Record<string, ShortcutBinding>` + `loadBindings()`/`saveBinding()`/`resetBinding()` + localStorage 持久化 (`vibex-shortcut-bindings`)
2. **快捷键解析**: `parseShortcut(e: KeyboardEvent): ShortcutKey` 函数，将 `Ctrl+Shift+S` 解析为 `{ctrl:true, shift:true, key:'s'}` 格式
3. **绑定 UI**: `ShortcutSettingsPanel.tsx` Tab4 新增"自定义" tab，显示每个 action 的当前绑定 + 编辑按钮
4. **注册中心**: `registerShortcut(action, defaultBinding, description)` 全局注册，每个 action 只需注册一次
5. **冲突检测**: 相同快捷键绑定多个 action 时显示警告

### 验收标准
- 用户可将任意 action 的快捷键改为其他组合
- 快捷键保存在 localStorage，刷新页面后保持
- 冲突检测阻止重复绑定
- vitest: `shortcutStore.test.ts` 覆盖 binding CRUD + conflict detection

---

## P002: 实时协作评论系统

### 问题描述
S69-E4 建立了节点评论的数据层（`commentStore.ts` 存储评论）和通知层（`useNotificationStore` 发送通知），但缺乏实时同步能力。协作者无法在其他人的画布上看到实时评论。

### 根因分析
- `commentStore.ts` 仅有本地 CRUD，无 WebSocket 同步
- `CommentThread.tsx` 是静态评论显示，无实时更新
- 协作者的光标和活动状态已同步（E5 S68），但评论无同步

### 影响范围
- 团队协作场景（异步 Code Review 替代品）
- 当前状态：评论存储在本地，用户 A 发的评论用户 B 看不到

### 技术方案
1. **WebSocket 消息类型**: `comment:add` / `comment:delete` / `comment:reaction`
2. **commentStore 扩展**: `subscribeToCanvas(canvasId)` + `broadcastComment()` action 发送 WS 消息
3. **CommentThread 实时更新**: `useEffect` 监听 `commentStore` 变化 + WS `comment:add` 消息触发 `addComment()`
4. **@提及通知**: 已在 S69-E4 集成（`useNotificationStore.addNotification()`），复用
5. **评论输入增强**: `MentionInput` 集成（已在 S51 存在），评论时支持 @ 提及

### 验收标准
- 用户 A 在画布发表评论，用户 B 的客户端在 <2s 内收到并显示
- 评论区支持 @ 提及，提及用户收到通知
- vitest: `commentStore.test.ts` 覆盖 add/delete/reaction + WebSocket mock

---

## P003: 大型画布性能优化

### 问题描述
当画布节点数 >500 时，ReactFlow 的节点渲染出现明显卡顿。`DDSFlow.tsx` 目前无虚拟化，所有节点始终在 DOM 中。

### 根因分析
- ReactFlow 默认渲染所有节点，S68 的 `RemoteCursorsLayer` 会额外渲染光标
- `DDSCanvasPage.tsx` 无 `nodeExtent` 限制，导致无限画布区域
- 无懒加载机制：打开画布时一次性加载全部历史快照

### 影响范围
- 大型画布用户（>200 节点）
- 当前状态：>500 节点时 FPS <30，拖拽卡顿

### 技术方案
1. **ReactFlow `nodeExtent`**: 限制可渲染区域，配合视口缩放减少渲染节点数
2. **视口虚拟化**: 仅渲染当前视口 ± 200px 范围内的节点（ReactFlow viewport API）
3. **历史快照懒加载**: `BranchManager.tsx` 点击分支时仅加载最近 50 个快照，按需加载更早记录
4. **节点聚合**: >100 节点时显示"聚合节点"（Cluster node），点击展开
5. **WebWorker 路径计算**: 将 `findPath` 等计算密集操作移到 WebWorker

### 验收标准
- 500 节点画布打开时间 <3s（当前 >8s）
- FPS 保持在 60（当前 500 节点约 25-30fps）
- vitest: 性能测试（benchmark，节点渲染时间测量）

---

## P004: 画布使用统计分析

### 问题描述
用户无法了解自己画布的使用情况：编辑频率、协作活跃度、最活跃节点等信息缺失。

### 根因分析
- `canvasHistoryStore` 仅记录快照，无使用分析数据
- 无任何统计相关的 Store 或 API

### 影响范围
- Pro 用户，了解团队使用情况
- 当前状态：用户无任何数据分析能力

### 技术方案
1. **canvasAnalyticsStore.ts**: 新建 Store，状态包含 `editingStats: Record<canvasId, EditStat>` + `topNodes: Record<canvasId, NodeActivity[]>`
2. **数据采集**: `DDSCanvasPage.tsx` 的 `onNodesChange` 触发采集，`debounce` 5min 写入 IndexedDB
3. **分析面板**: `AnalyticsPanel.tsx`（`HistoryPanel` 侧边栏的 Tab）显示周编辑次数、协作时长、最活跃节点
4. **导出**: `exportAnalytics(canvasId)` 导出 CSV 格式

### 验收标准
- 打开 `HistoryPanel` 的"统计" Tab 可看到当前画布的编辑数据
- 数据按周聚合，显示最近 4 周趋势
- vitest: `canvasAnalyticsStore.test.ts` 覆盖 CRUD + 数据聚合

---

## P005: 模板评分与收藏增强

### 问题描述
S70-E2 建立了模板市场（`TemplateMarketplacePanel`），但模板仅有 `usageCount` 排序。用户无法对模板评分，也无法收藏个人喜欢的模板。

### 根因分析
- `templateStore.ts` 的 `usageCount` 是自动计数，无用户主动评分
- 无用户收藏夹功能（`favoriteTemplates` 缺失）
- 无模板评论

### 影响范围
- 模板市场用户，影响内容质量排序
- 当前状态：模板按使用量排序，但无质量维度

### 技术方案
1. **评分系统**: `templateStore.ts` 新增 `ratings: Record<templateId, {score: number, count: number}>` + `rateTemplate(id, score)` / `getAverageScore(id)` 
2. **用户收藏**: `favoriteTemplateIds: string[]` localStorage 持久化 (`vibex-favorite-templates`) + `toggleFavorite(id)` / `getFavorites()`
3. **评分 UI**: `TemplateMarketplacePanel.tsx` 每张卡片显示 ⭐ 平均分 + 评分按钮 + ❤️ 收藏按钮
4. **排序增强**: 市场支持按 `usageCount`（默认）、`score`（评分）、`recentlyAdded` 排序

### 验收标准
- 用户可对任意模板打 1-5 星，评分即时显示
- 收藏的模板在 `TemplateGallery` 的"收藏" Tab 中显示
- 市场面板支持评分/收藏排序切换
- vitest: `templateStore.test.ts` 覆盖评分 + 收藏 CRUD

---

## 技术风险

| 风险 | 影响 | 缓解 |
|------|------|------|
| P001: 快捷键冲突检测复杂度 | 高 | MVP 仅阻止完全相同的绑定 |
| P002: WebSocket 评论同步延迟 | 中 | <2s SLA，超时降级到轮询 |
| P003: ReactFlow 虚拟化兼容性 | 高 | 先做性能基准测试再决策 |
| P004: IndexedDB 写入性能 | 低 | debounce 5min 批量写入 |

---

## 跨 Epic 集成点

- P001 (键盘) ↔ P002 (评论): 评论输入框支持快捷键提交（`Ctrl+Enter` 发送）
- P001 ↔ P003: 大型画布时禁用某些快捷键动画
- P002 ↔ P005: 模板评论（用户对模板发表评价）
