# VibeX Sprint75 Implementation Partition

## 文件清单

### 新增文件

| 文件 | Epic | 说明 |
|------|------|------|
| `src/components/dds/search/RecentSearchesDropdown.tsx` | E1 | 搜索历史下拉菜单 |
| `src/components/dds/search/RecentSearchesDropdown.module.css` | E1 | 下拉菜单样式 |
| `src/components/dds/search/__tests__/RecentSearchesDropdown.test.tsx` | E1 | 测试 |
| `src/components/dds/history/SnapshotManagerPanel.tsx` | E5 | 快照管理面板 |
| `src/components/dds/history/SnapshotManagerPanel.module.css` | E5 | 面板样式 |
| `src/components/dds/history/__tests__/SnapshotManagerPanel.test.tsx` | E5 | 测试 |

### 扩展文件

| 文件 | Epic | 修改内容 |
|------|------|----------|
| `src/components/dds/toolbar/DDSToolbar.tsx` | E1 | 新增 RecentSearchesDropdown 渲染 |
| `src/components/dds/notifications/NotificationPanel.tsx` | E2 | 新增 TabBar + filterByType 逻辑 |
| `src/components/dds/notifications/NotificationPanel.module.css` | E2 | TabBar 样式 |
| `src/components/dds/history/BranchDiffDialog.tsx` | E3 | 新增「历史」Tab |
| `src/components/dds/history/BranchDiffDialog.module.css` | E3 | 历史列表样式 |
| `src/components/dds/collab/CollabActivityPanel.tsx` | E4 | 新增 MessageInput 区域 |
| `src/components/dds/collab/CollabActivityPanel.module.css` | E4 | MessageInput 样式 |
| `src/components/dds/settings/CanvasSettingsDrawer.tsx` | E5 | 新增「快照管理」Tab |
| `src/components/dds/settings/CanvasSettingsDrawer.module.css` | E5 | Tab 内容样式 |
| `src/stores/dds/canvasHistoryStore.ts` | E3/E5 | 新增 branchDiffHistory + deleteSnapshots |
| `src/lib/canvas/historyDB.ts` | E3 | 新增 branchDiffHistory objectStore |
| `src/stores/dds/canvasSearchStore.ts` | E1 | 无需修改（E1 只读）|
| `src/lib/collaboration/activityStore.ts` | E4 | 无需修改（`addEntry` 已支持 message）|

---

## E1 DoD checklist

- [ ] `RecentSearchesDropdown.tsx` 新建
- [ ] 读取 `canvasSearchStore.recentSearches`（最多 5 条）
- [ ] 点击搜索词 → `canvasSearchStore.setSearchQuery(term)` + 呼起搜索
- [ ] 「清除历史」按钮
- [ ] 「查看更多」链接 → 呼起完整搜索面板
- [ ] `DDSToolbar.tsx` 集成渲染
- [ ] `RecentSearchesDropdown.test.tsx` ≥5 测试用例

**expect() 断言示例**:
```typescript
expect(screen.getAllByRole('listitem')).toHaveLength(recentSearches.length)
expect(screen.getByRole('button', { name: /清除历史/i })).toBeInTheDocument()
```

---

## E2 DoD checklist

- [ ] NotificationPanel header 新增 TabBar（全部/提及/评论/系统）
- [ ] Tab 点击 → `notifications.filter(n => n.type === tabType)`
- [ ] 各 Tab 独立滚动容器（scrollTopMap state）
- [ ] 当前 Tab 高亮（activeTab state）
- [ ] Tab badge 计数同步
- [ ] `NotificationPanel.test.tsx` 扩展 Tab 测试 ≥8 用例

**expect() 断言示例**:
```typescript
expect(screen.getByRole('tab', { name: /提及/i })).toBeInTheDocument()
expect(screen.getByRole('tab', { name: /提及/i })).toHaveAttribute('aria-selected', 'true')
```

---

## E3 DoD checklist

- [ ] `historyDB.ts` 新增 `branchDiffHistory` objectStore
- [ ] `canvasHistoryStore.ts` 新增 `addBranchDiffHistory`/`getBranchDiffHistory`/`clearBranchDiffHistory`
- [ ] `BranchDiffDialog.tsx` 新增「历史」Tab
- [ ] 历史列表按时间倒序（MAX=20）
- [ ] 点击历史记录 → 自动填充分支 + 触发 `compareBranches`
- [ ] 「清除历史」按钮
- [ ] `BranchDiffDialog.test.tsx` 扩展 ≥5 测试用例

**expect() 断言示例**:
```typescript
expect(screen.getByRole('tab', { name: /历史/i })).toBeInTheDocument()
expect(historyList.length).toBeLessThanOrEqual(20)
```

---

## E4 DoD checklist

- [ ] `CollabActivityPanel.tsx` 底部新增 `<MessageInput>` 区域（footer 上方）
- [ ] 集成 `MentionInput` from `src/components/dds/collaboration/MentionInput`
- [ ] 按 Enter 或点击发送 → `activityStore.addEntry({ message, type: 'comment', canvasId })`
- [ ] 发送后自动触发 mention 检测（已有 `extractMentions`）
- [ ] ESC 清空输入框
- [ ] `CollabActivityPanel.test.tsx` 扩展发送测试 ≥6 用例

**expect() 断言示例**:
```typescript
expect(screen.getByPlaceholderText(/输入评论/i)).toBeInTheDocument()
expect(screen.getByRole('button', { name: /发送/i })).toBeInTheDocument()
```

---

## E5 DoD checklist（修正版 — 快照管理）

- [ ] `CanvasSettingsDrawer.tsx` 新增「快照管理」Tab（Tab 索引 3）
- [ ] 新建 `SnapshotManagerPanel.tsx`：显示画布所有快照列表
- [ ] 多选快照 → 批量删除按钮
- [ ] `canvasHistoryStore.ts` 新增 `deleteSnapshots(snapshotIds: string[])` action
- [ ] 「恢复默认」按钮
- [ ] `CanvasSettingsDrawer.test.tsx` 扩展快照管理测试 ≥6 用例

**expect() 断言示例**:
```typescript
expect(screen.getByRole('tab', { name: /快照管理/i })).toBeInTheDocument()
expect(screen.getByRole('button', { name: /批量删除/i })).toBeDisabled()
```

---

## vitest 测试命令

```bash
cd vibex-fronted
npx vitest run RecentSearchesDropdown --reporter=verbose
npx vitest run NotificationPanel --reporter=verbose
npx vitest run BranchDiffDialog --reporter=verbose
npx vitest run CollabActivityPanel --reporter=verbose
npx vitest run CanvasSettingsDrawer --reporter=verbose
```

---

## 集成点验证

| 检查项 | 预期 | 验证 |
|--------|------|------|
| `MentionInput` import 路径正确 | ✅ `src/components/dds/collaboration/MentionInput` | Pre-discovery 确认 |
| `canvasSearchStore.recentSearches` 存在 | ✅ S74-E1 已有 | Pre-discovery 确认 |
| `notificationStore.type` 支持 mention/comment/system | ✅ S74-E4 已有 | Pre-discovery 确认 |
| `historyDB` 支持新 objectStore | ✅ IndexedDB 已配置 | Pre-discovery 确认 |
| `BranchDiffDialog` 位于 history/ 子目录 | ✅ `src/components/dds/history/` | Pre-discovery 确认 |
