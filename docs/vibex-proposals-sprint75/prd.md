# VibeX Sprint75 PRD

## 执行摘要

| Epic | 功能 | 优先级 | 负责人 |
|------|------|--------|--------|
| E1 | 搜索历史工具栏快捷入口 | P0 | — |
| E2 | @mention 通知专用 Tab | P0 | — |
| E3 | 分支对比历史记录 | P1 | — |
| E4 | 协作活动流消息发送 | P1 | — |
| E5 | 画布设置专用面板 Tab | P2 | — |

## Epic × DoD

### E1 — 搜索历史工具栏快捷入口
**功能**: 在 DDSToolbar 搜索按钮旁增加 RecentSearchesDropdown，显示最近 5 条搜索记录。

**DoD checklist**:
- [ ] RecentSearchesDropdown 组件新建（`src/components/dds/search/RecentSearchesDropdown.tsx`）
- [ ] Dropdown 内显示 canvasSearchStore.recentSearches（最多 5 条）
- [ ] 点击搜索词 → 填充查询框 + 触发搜索
- [ ] 「清除历史」按钮调用 canvasSearchStore.clearRecentSearches()
- [ ] 搜索词超过 5 条时显示「查看更多」链接（呼起完整搜索面板）
- [ ] 组件在 DDSToolbar 搜索图标位置渲染（搜索图标 + 箭头按钮）
- [ ] vitest 测试（RecentSearchesDropdown.test.tsx，≥5 cases）

**expect() 断言**:
```typescript
expect(canvasSearchStore.getState().recentSearches.length).toBeLessThanOrEqual(5)
expect(screen.getByRole('button', { name: /清除历史/i })).toBeInTheDocument()
```

---

### E2 — @mention 通知专用 Tab
**功能**: NotificationPanel 新增 Tab 切换（全部/提及/评论/系统），按 notificationStore.type 过滤。

**DoD checklist**:
- [ ] NotificationPanel header 新增 3 个 Tab（提及/评论/系统）+ 全部 Tab 保持默认
- [ ] Tab 点击切换后过滤 notificationStore.notifications（按 type 字段）
- [ ] 各 Tab 维护独立滚动位置
- [ ] 当前 Tab 高亮显示（activeTab 状态）
- [ ] 切换 Tab 后 badge 计数同步更新
- [ ] vitest 测试（NotificationPanel.test.tsx，Tab 切换相关 ≥8 cases）

**expect() 断言**:
```typescript
expect(screen.getByRole('tab', { name: /提及/i })).toBeInTheDocument()
expect(notificationStore.getState().notifications.filter(n => n.type === 'mention')).toHaveLength(0)
```

---

### E3 — 分支对比历史记录
**功能**: 每次打开 BranchDiffDialog 时自动记录对比历史到 IndexedDB，支持历史记录快速重现。

**DoD checklist**:
- [ ] canvasHistoryStore 新增 branchDiffHistory 字段（MAX=20）到 historyDB
- [ ] BranchDiffDialog 新增「历史」Tab（与「对比」Tab 并列）
- [ ] 历史列表按时间倒序显示最近 20 条（canvas名 + 两分支名 + 对比时间）
- [ ] 点击历史记录 → 自动填充分支选择 + 触发对比
- [ ] 「清除历史」按钮从 IndexedDB 删除记录
- [ ] BranchDiffDialog test.tsx 扩展历史功能测试（≥5 cases）

**expect() 断言**:
```typescript
expect(history.length).toBeLessThanOrEqual(20)
expect(screen.getByRole('tab', { name: /历史/i })).toBeInTheDocument()
```

---

### E4 — 协作活动流消息发送
**功能**: CollabActivityPanel 底部新增消息输入区，支持 @ 提及协作者并通过 WebSocket 广播。

**DoD checklist**:
- [ ] CollabActivityPanel 底部新增消息输入框（在 footer 上方）
- [ ] 输入框集成 MentionInput 组件（S51）支持 @ 提及
- [ ] 按 Enter 或点击发送 → 调用 activityStore.addEntry({message, type: 'comment'})
- [ ] 发送后自动触发 @mention 检测（extractMentions → processMentionNotifications）
- [ ] 新消息通过 WebSocket 即时广播
- [ ] 输入框 ESC 清空内容
- [ ] CollabActivityPanel.test.tsx 扩展发送消息测试（≥6 cases）

**expect() 断言**:
```typescript
expect(screen.getByPlaceholderText(/输入评论/i)).toBeInTheDocument()
expect(screen.getByRole('button', { name: /发送/i })).toBeInTheDocument()
```

---

### E5 — 画布设置专用面板 Tab
**功能**: SettingsDrawer 新增「画布」Tab（Tab 索引 3），集中管理画布可视化偏好。

**DoD checklist**:
- [ ] SettingsDrawer 新增 Tab：「画布」（第 4 个 Tab，索引 3）
- [ ] Tab 内含：背景色选择器（5 种预设色）、网格间距下拉（无/稀疏/标准/密集）、默认缩放滑块（50%-200%）
- [ ] 设置修改后实时应用到当前画布（通过 canvasStoreRegistry）
- [ ] 设置随画布持久化到 IndexedDB（canvasStoreRegistry.settings）
- [ ] 「恢复默认」按钮
- [ ] SettingsDrawer test.tsx 扩展画布设置 Tab 测试（≥6 cases）

**expect() 断言**:
```typescript
expect(screen.getByRole('tab', { name: /画布/i })).toBeInTheDocument()
expect(screen.getByRole('slider', { name: /缩放/i })).toBeInTheDocument()
```

---

## 跨 Epic 集成表

| 集成点 | 涉及 Epic | 方案 |
|--------|-----------|------|
| RecentSearchesDropdown → canvasSearchStore | E1 ↔ S74-E1 | 直接 import 共用 store |
| BranchDiffDialog → historyDB | E3 ↔ S73-E4 | 复用现有 historyDB |
| MentionInput → activityStore | E4 ↔ S51 + S68-E2 | S51 MentionInput 已实现，直接复用 |
| NotificationPanel Tab → notificationStore | E2 ↔ S74-E4 | notificationStore.type 字段已存在 |
| SettingsDrawer → canvasStoreRegistry | E5 ↔ S52-E5 | Tab 架构复用，读取 canvas settings |

## 技术风险表

| 风险 | 级别 | 缓解 |
|------|------|------|
| P002 Tab 滚动位置独立存储复杂度 | 低 | 各 Tab 用独立 scroll container |
| P004 @mention 在活动流内循环触发通知 | 中 | addEntry 跳过 self-mention（sender === target）|
| P005 设置面板与 DDSToolbar 背景冲突 | 低 | settings 有则用，无则降级 |
