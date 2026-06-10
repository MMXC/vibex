# S80 QA PRD — Sprint80 产出物质量验证计划

## 执行摘要

Sprint80 完成了 5 个 Epic 的开发（E1-E5），所有代码已合并至 `origin/main`。本 QA 项目对每个 Epic 的产出物进行完整性验证、交互可用性验证和设计一致性验证。

---

## Epic-Story 验证矩阵

| ID | Epic | 验证类型 | 阻塞级别 | 验证方法 |
|----|------|---------|---------|---------|
| E1 | 通知偏好设置管理面板 | 功能 + 持久化 | P0 | 黑盒 + IndexedDB 检查 |
| E2 | 模板分类/标签过滤测试 | 测试覆盖 | P1 | vitest 运行 + 覆盖率分析 |
| E3 | Merge History Enrichment | 功能 + UI | P1 | 组件渲染 + 数据结构验证 |
| E4 | 画布设置中心 | UI + 状态 | P0 | 组件集成 + Tab 切换验证 |
| E5 | 协作者在线状态指示器 | 功能 + WebSocket | P0 | vitest + 组件渲染验证 |

---

## E1: 通知偏好设置管理面板

### DoD (Definition of Done)
- [ ] IndexedDB `notification_prefs` objectStore 可读写（DB v11）
- [ ] `notificationStore.setPreference(key, enabled)` 保存后 `getPreference(key)` 返回正确值
- [ ] 页面刷新后偏好保持（持久化验证）
- [ ] 重置按钮清空所有偏好
- [ ] `NotificationPreferencesPanel` 渲染：频道开关 + 类型开关 + 重置按钮
- [ ] DDSToolbar ⚙️ 按钮打开正确面板

### expect() 断言（自动化验证）
```ts
// IndexedDB 读写
const prefs = await getPreferencesFromDB();
expect(prefs).toBeDefined();

// setPreference → getPreference
notificationStore.setPreference('email', true);
expect(notificationStore.getPreference('email')).toBe(true);

// 重置
notificationStore.resetPreferences();
expect(notificationStore.getAllPreferences()).toEqual(defaultPrefs);
```

---

## E2: 模板分类/标签过滤测试

### DoD (Definition of Done)
- [ ] `templateStore.category.test.ts` 19/19 通过
- [ ] AND 交集过滤：`filterByTag(['tag1', 'tag2'])` 仅返回同时含两个标签的模板
- [ ] OR 过滤：`filterByCategory(['cat1', 'cat2'])` 返回任一分类的模板
- [ ] CategoryFilter 多选切换 AND/OR 模式正确
- [ ] `searchTemplates` 与 category/tag 双维度过滤集成正确
- [ ] 空状态处理：取消全部标签/分类时显示全部模板

### expect() 断言（vitest 已覆盖）
```ts
// E2 vitest 运行命令: npx vitest run templateStore.category.test.ts --reporter=verbose
// 期望: 19/19 passing
```

---

## E3: Merge History Enrichment

### DoD (Definition of Done)
- [ ] `MergeHistoryEntry` 包含 `mergedNodeIds: string[]`、`conflictCount: number`、`authorIds: string[]` 字段
- [ ] `recordMerge({mergedNodeIds, conflictCount, authorIds})` 正确存储
- [ ] MergeHistoryPanel Timeline Item 点击展开显示详情
- [ ] 展开详情显示节点统计（mergedNodeIds.length）和贡献者头像列表（authorIds）
- [ ] `conflictCount > 0` 时显示 ⚠️ 徽章，`conflictCount === 0` 时不显示
- [ ] Markdown 导出包含 mergedNodeIds/conflictCount/authorIds 字段
- [ ] `npx vitest run canvasHistoryStore.e3-merge-history.test.ts` 4/4 通过

### expect() 断言
```ts
const entry: MergeHistoryEntry = {
  id: 'merge-1',
  sourceBranch: 'feature-a',
  targetBranch: 'main',
  mergedNodeIds: ['node1', 'node2'],
  conflictCount: 2,
  authorIds: ['user1', 'user2'],
  timestamp: Date.now(),
};
expect(entry.mergedNodeIds).toHaveLength(2);
expect(entry.conflictCount).toBe(2);
expect(entry.authorIds).toContain('user1');
```

---

## E4: 画布设置中心

### DoD (Definition of Done)
- [ ] `SettingsModal.tsx` 渲染 4 个 Tab：快捷键/画布/通知/性能
- [ ] Tab 切换不重置其他 Tab 的值（状态隔离）
- [ ] `settingsStore.lastOpenedTab` 刷新后保持
- [ ] DDSToolbar ⚙️ 按钮触发 SettingsModal 打开
- [ ] `npx vitest run SettingsModal.test.tsx` 7/7 通过

### expect() 断言
```ts
// Tab 切换状态隔离
const store = settingsStore.getState();
store.setActiveTab('shortcuts');
store.updateShortcutSetting('copy', true);
store.setActiveTab('canvas');
store.updateCanvasSetting('grid', false);
store.setActiveTab('shortcuts');
expect(store.getShortcutSetting('copy')).toBe(true); // 未被 canvas 设置影响
```

---

## E5: 协作者在线状态与活动流

### DoD (Definition of Done)
- [ ] `presenceStore.lastActiveAt` 为 `Record<userId, number>` 类型
- [ ] `presenceStore.updateLastActive(userId)` 正确更新 `lastActiveAt[userId]`
- [ ] `presenceStore.isOnline(userId)` — 5 分钟内活跃返回 true，≥5 分钟返回 false
- [ ] `OnlinePresenceIndicator` 组件：在线用户显示绿点，离线用户显示灰点
- [ ] `PresenceUpdateMessage` WebSocket 类型在 `useCollaboration.ts` 中处理
- [ ] `DDSCanvasPage` 中 `handleNodeMouseMove`/`handleNodesChange` 调用 `updateLastActive`
- [ ] `OnlinePresenceIndicator` 定位：top: 60px, right: 16px
- [ ] `presenceStore.e5.test.ts` 11/11 通过
- [ ] `OnlinePresenceIndicator.test.tsx` 7/7 通过

### expect() 断言
```ts
// isOnline 阈值测试
const now = Date.now();
presenceStore.updateLastActive('user1', now - 3 * 60 * 1000); // 3 min ago
expect(presenceStore.isOnline('user1')).toBe(true);

presenceStore.updateLastActive('user2', now - 6 * 60 * 1000); // 6 min ago
expect(presenceStore.isOnline('user2')).toBe(false);

// OnlinePresenceIndicator 渲染
render(<OnlinePresenceIndicator />);
expect(screen.getByRole('img', { name: /online/i })).toBeInTheDocument();
```

---

## 页面集成表

| Epic | 涉及页面 | 集成点 |
|------|---------|-------|
| E1 | NotificationPanel | 铃铛按钮 → NotificationPreferencesPanel |
| E2 | TemplateGallery | CategoryFilter 组件 + filterByCategory/tag |
| E3 | MergeHistoryPanel | Timeline Item 展开详情 + Markdown 导出 |
| E4 | DDSCanvasPage | DDSToolbar ⚙️ 按钮 → SettingsModal |
| E5 | DDSCanvasPage | DDSCanvasPage 右上方在线状态指示器 |

---

## 质量阈值

- **E1**: vitest `notificationStore.preferences.test.ts` 12/12 + IndexedDB 读写手动验证
- **E2**: vitest `templateStore.category.test.ts` 19/19
- **E3**: vitest `canvasHistoryStore.e3-merge-history.test.ts` 4/4 + UI 手动验证
- **E4**: vitest `SettingsModal.test.tsx` 7/7 + Tab 切换手动验证
- **E5**: vitest 18/18 (11+7) + OnlinePresenceIndicator 手动验证

**通过标准**: 所有 vitest 100% 通过 + 所有手动验证项通过 → `coord-completed`
**失败标准**: 任意 vitest 失败或 P0 手动验证失败 → 创建 `sprint80-fix` 修复任务

---

## 输出路径

- 验证报告: `docs/vibex-proposals-sprint80-qa/verification-report.md`
- 测试命令参考: `scripts/sprint80-qa-test-commands.sh`
