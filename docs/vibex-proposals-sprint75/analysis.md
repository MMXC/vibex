# VibeX Sprint75 提案分析 — analyze-requirements

## 提案来源
- Sprint73 完成：全文搜索、模板导入画布、通知偏好设置、分支命名保护、AI会话导出
- Sprint74 完成：搜索历史chips、分支对比视图、模板标签筛选、@mention通知闭环、键盘导航增强

## 提案列表

### P001 — 搜索历史工具栏快捷入口
**问题**: 搜索历史记录已在 CanvasSearchPanel 内实现（S74-E1），但 DDSToolbar 的搜索按钮点击后直接呼起搜索面板，用户无法快速访问最近搜索记录，需要先呼起面板再滚动查看chips，体验割裂。

**根因**: S74-E1 的 recentSearches 只在 CanvasSearchPanel 内部展示，DDSToolbar 的搜索图标没有对应的快捷下拉菜单。

**影响**: 重复搜索场景（同一会话内搜索多次相同关键词）体验差，工具栏快捷优势未发挥。

**技术方案**: 在 DDSToolbar 搜索按钮位置（搜索图标右侧或下拉区域）增加 RecentSearchesDropdown 组件，显示最近 5 条搜索记录，点击后直接填充查询词并呼起搜索面板。数据源为 canvasSearchStore.recentSearches。

**验收标准**:
- 搜索按钮 hover 显示下拉箭头
- 点击后展示最近 5 条搜索词（按时间倒序）
- 点击某条搜索词 → 填充查询框 + 触发搜索
- 清空历史按钮 → 调用 canvasSearchStore.clearRecentSearches()
- 搜索词超过 5 条时显示「查看更多」入口

---

### P002 — @mention 通知专用 Tab
**问题**: @mention 通知系统已完成闭环（S74-E4），activityStore 自动触发 notificationStore.addNotification(type: 'mention')，但 NotificationPanel 没有专门的 @mention Tab，用户无法快速筛选通知类型，所有通知混在一起。

**根因**: S74-E4 完成了 mention 检测和通知生成，但 NotificationPanel UI 只展示全部通知，没有按类型 Tab 筛选的交互。

**影响**: 协作场景下，用户收到大量 @mention 通知时，无法快速定位是谁在哪个画布 @了你，需要滚动全部通知列表。

**技术方案**: 在 NotificationPanel 的 header 区域增加 Tab 切换（全部/提及/评论/系统），使用 notificationStore 的 filterByType 实现。每个 Tab 维护自己的滚动位置。

**验收标准**:
- NotificationPanel header 新增 3 个 Tab：@提及、评论、系统
- 点击 Tab 后只显示对应类型通知（filter by type）
- 各 Tab 维护独立滚动位置
- 切换 Tab 后通知计数同步更新
- 当前 Tab 高亮显示

---

### P003 — 分支对比历史记录
**问题**: BranchDiffDialog 已实现两个分支的对比功能（S74-E3），但只支持一次性对比，用户无法查看历史对比记录，无法快速恢复之前的对比状态。

**根因**: S74-E3 的 BranchDiffDialog 是纯 UI 组件，没有将对比结果持久化，用户每次打开都需要重新选择分支。

**影响**: 频繁对比分支的用户（如开发工作流）每次都要手动选择两个分支，多个画布的对比历史无法追溯。

**技术方案**: 在 canvasHistoryStore 新增 branchDiffHistory 字段（MAX=20），每次打开 BranchDiffDialog 对比时自动记录 {canvasId, branchA, branchB, comparedAt} 到 IndexedDB historyDB。Dialog 内部增加「历史记录」Tab 显示最近对比列表，点击直接重现对比。

**验收标准**:
- BranchDiffDialog 新增「历史」Tab
- 历史列表按时间倒序显示（最多 20 条）
- 每条历史记录显示：两分支名 + 对比时间 + canvas 名称
- 点击历史记录自动填充分支选择并重新对比
- 清除历史按钮

---

### P004 — 协作活动流消息发送
**问题**: CollabActivityPanel 已实现活动流展示（S68-E2），但目前是纯阅读界面，用户无法在活动流内直接发送评论或回复，每次都要跳转到其他入口（S74-E4 mention 在独立入口）。

**根因**: S68-E2 的 CollabActivityPanel 设计为只读活动流，未接入消息发送功能。S74-E4 的 mention 通知走的是独立通知面板，与活动流割裂。

**影响**: 协作场景下，用户在查看活动流时需要跳出画布才能回复或提及，无法保持上下文。

**技术方案**: 在 CollabActivityPanel 底部（现有 footer 上方）增加消息输入区，集成 MentionInput 组件（S51）。发送时调用 activityStore.addEntry({message, type: 'comment'})，消息通过 WebSocket 广播给其他协作者并触发 @mention 检测。输入区支持 @ 提及协作者。

**验收标准**:
- CollabActivityPanel 底部新增消息输入框
- 输入框支持 @ 提及协作者（用户列表下拉）
- 按 Enter 或点击发送按钮 → 调用 activityStore.addEntry
- 消息发送后自动触发 @mention 检测
- 新消息通过 WebSocket 即时广播到其他协作者
- 输入框 ESC 清空内容

---

### P005 — 画布设置专用面板 Tab
**问题**: ShortcutSettingsPanel.tsx 已在 S52-E5 实现，是快捷键设置面板。但画布相关的偏好设置（背景色/网格间距/主题）目前散落在不同位置，用户没有统一的「画布设置」入口。

**根因**: S52-E5 的 ShortcutSettingsPanel 是独立的快捷键面板，S74-E1 的 recentSearches 是搜索相关，画布本身的可视化偏好（背景、网格、缩放）没有集中管理。

**影响**: 用户调整画布背景、网格样式需要通过多个入口，缺少统一的画布级设置面板。

**技术方案**: 在 DDSToolbar 设置按钮的下拉菜单或 SettingsDrawer 中增加「画布设置」Tab（第 4 个 Tab），包含：背景色选择（预设 5 种）、网格间距（无/稀疏/标准/密集）、默认缩放比例、主题色切换。这些值存储在 canvasStoreRegistry 对应 canvas 的 settings 字段。

**验收标准**:
- SettingsDrawer 新增「画布」Tab（第 4 个 Tab，索引 3）
- Tab 内含：背景色选择器、网格间距下拉、默认缩放滑块
- 设置修改后实时应用到当前画布
- 设置随画布持久化到 IndexedDB
- 恢复默认按钮

---

## 技术风险

| 风险 | 级别 | 缓解方案 |
|------|------|----------|
| P001 与 S74-E1 搜索历史重复实现 | 低 | 共用 canvasSearchStore.recentSearches，不重复存储 |
| P002 Tab 切换导致滚动位置丢失 | 低 | 各 Tab 独立滚动容器状态 |
| P004 @mention 在活动流内触发循环通知 | 中 | addEntry 内跳过 self-mention 检测 |
| P005 画布设置覆盖 DDSToolbar 背景样式 | 低 | 先读取 canvas settings，无则降级到默认值 |

## 依赖关系
- P002 依赖 S74-E4（notificationStore 已实现 type 过滤）
- P001 依赖 S74-E1（recentSearches 数据源）
- P003 依赖 S74-E3（BranchDiffDialog 基础实现）
- P004 依赖 S51（MentionInput 组件）+ S68-E2（activityStore）
- P005 依赖 S52-E5（SettingsDrawer Tab 架构）
