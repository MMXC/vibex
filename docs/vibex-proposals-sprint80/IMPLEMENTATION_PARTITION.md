# VibeX Sprint80 实现分工文档

**Project**: vibex-proposals-sprint80  
**Date**: 2026-06-09

---

## Epic E1: 统一通知中心管理面板

### DoD Checklist

- [ ] `notificationStore` 新增 `preferences: NotificationPreferences` 状态
- [ ] `notificationStore` 新增 `setPreference(type, enabled)` action
- [ ] `notificationStore` 新增 `getPreference(type)` action
- [ ] `notificationStore` 新增 `addNotification` 检查偏好逻辑
- [ ] `NotificationPreferences` 类型定义
- [ ] IndexedDB `notification_prefs` 表创建
- [ ] 偏好设置持久化 (save/load on init)
- [ ] `NotificationPreferencesPanel.tsx` 组件
- [ ] 组件集成到 NotificationPanel (⚙️ 按钮)
- [ ] vitest: notificationStore preference 相关测试 5/5

### 新增/扩展文件

| File | Action | Note |
|------|--------|------|
| `src/stores/dds/notificationStore.ts` | 修改 | + preferences state + actions |
| `src/components/dds/notifications/NotificationPreferencesPanel.tsx` | 新增 | 偏好设置面板 |
| `src/components/dds/notifications/NotificationPreferencesPanel.module.css` | 新增 | 样式 |
| `src/stores/dds/__tests__/notificationStore.preferences.test.ts` | 新增 | 偏好相关测试 |

### expect() 断言示例

```typescript
// notificationStore.preferences.test.ts
describe('NotificationPreferences', () => {
  it('默认所有通知类型开启', () => {
    expect(store.getState().getPreference('mention')?.enabled).toBe(true);
  });

  it('setPreference 可关闭指定类型', () => {
    store.getState().setPreference('mention', false);
    expect(store.getState().getPreference('mention')?.enabled).toBe(false);
  });

  it('addNotification 检查偏好', () => {
    store.getState().setPreference('mention', false);
    store.getState().addNotification({ type: 'mention', ... });
    const notifications = store.getState().notifications;
    expect(notifications.find(n => n.type === 'mention')).toBeUndefined();
  });
});
```

---

## Epic E2: 模板分类与标签系统

### DoD Checklist

- [ ] `TemplateMeta` 类型新增 `category: TemplateCategory` 字段
- [ ] `TemplateMeta` 类型新增 `tags: string[]` 字段
- [ ] `TemplateCategory` 枚举定义
- [ ] `templateStore` 新增 `filterByCategory(cat)` action
- [ ] `templateStore` 新增 `filterByTag(tag)` action
- [ ] `templateStore` 新增 `filterBySearch(q)` action
- [ ] `CategoryTabBar.tsx` 组件 (5 个 category tab)
- [ ] `TagChipFilter.tsx` 组件 (多选 tag chips)
- [ ] `TemplateGalleryPanel` 集成 CategoryTabBar + TagChipFilter
- [ ] `CreateTemplateDialog` 扩展：category 下拉 + tag 输入
- [ ] vitest: templateStore filter 相关测试 5/5

### 新增/扩展文件

| File | Action | Note |
|------|--------|------|
| `src/stores/dds/templateStore.ts` | 修改 | + category/tags fields + filter actions |
| `src/components/dds/templates/CategoryTabBar.tsx` | 新增 | 分类导航 |
| `src/components/dds/templates/TagChipFilter.tsx` | 新增 | 标签过滤 |
| `src/components/dds/templates/TemplateGalleryPanel.tsx` | 修改 | 集成 tab + tag filter |
| `src/components/dds/templates/CreateTemplateDialog.tsx` | 修改 | + category + tag |
| `src/stores/dds/__tests__/templateStore.category.test.ts` | 新增 | filter 测试 |

### expect() 断言示例

```typescript
describe('Template Category/Tag Filter', () => {
  it('filterByCategory 只返回指定分类', () => {
    store.getState().filterByCategory('flowchart');
    store.getState().templates.forEach(t => {
      expect(t.category).toBe('flowchart');
    });
  });

  it('filterByTag 返回包含 tag 的模板', () => {
    store.getState().filterByTag('architecture');
    store.getState().filteredTemplates.forEach(t => {
      expect(t.tags).toContain('architecture');
    });
  });
});
```

---

## Epic E3: 分支合并历史可视化面板

### DoD Checklist

- [ ] `MergeHistoryEntry` 新增 `mergedNodeIds: string[]` 字段
- [ ] `MergeHistoryEntry` 新增 `conflictCount: number` 字段
- [ ] `MergeHistoryEntry` 新增 `authorIds: string[]` 字段
- [ ] `recordMerge` 接收并存储这些 enriched fields
- [ ] `MergeHistoryPanel` Timeline Item 点击展开
- [ ] 展开详情显示节点统计 (新增/修改/删除)
- [ ] 展开详情显示贡献者头像列表
- [ ] `MergeHistoryPanel` 导出 Markdown 合并报告功能
- [ ] vitest: canvasHistoryStore mergeHistory enriched 4/4

### 新增/扩展文件

| File | Action | Note |
|------|--------|------|
| `src/stores/dds/canvasHistoryStore.ts` | 修改 | MergeHistoryEntry enriched |
| `src/components/dds/canvas-dashboard/MergeHistoryPanel.tsx` | 修改 | expand logic + stats |
| `src/stores/dds/__tests__/canvasHistoryStore.e3-merge-history.test.ts` | 修改 | 添加 enriched 测试 |

### expect() 断言示例

```typescript
describe('MergeHistoryEntry enriched fields', () => {
  it('recordMerge 存储 mergedNodeIds', () => {
    store.getState().recordMerge({
      branchFrom: 'feature', branchTo: 'main',
      mergedNodeIds: ['n1', 'n2'], conflictCount: 0, authorIds: ['u1']
    });
    const history = store.getState().getMergeHistory();
    expect(history[0].mergedNodeIds).toEqual(['n1', 'n2']);
  });

  it('conflictCount > 0 显示冲突标记', () => {
    store.getState().recordMerge({
      ...entry, conflictCount: 3
    });
    expect(screen.getByText(/3 个冲突/)).toBeInTheDocument();
  });
});
```

---

## Epic E4: 画布设置中心

### DoD Checklist

- [ ] `DDSToolbar.tsx` 新增 ⚙️ 设置按钮
- [ ] `SettingsModal.tsx` 组件 (4 Tab: 快捷键/画布/通知/性能)
- [ ] `ShortcutSettingsPanel` 集成到快捷键 Tab
- [ ] `CanvasSettingsPanel` 集成到画布 Tab
- [ ] `NotificationPreferencesPanel` (E1) 集成到通知 Tab
- [ ] `PerformanceSettings.tsx` 新增到性能 Tab
- [ ] `settingsStore` 新增 `lastOpenedTab` 持久化
- [ ] `SettingsModal` 打开时恢复 lastOpenedTab
- [ ] vitest: settingsModal tab switching 5/5

### 新增/扩展文件

| File | Action | Note |
|------|--------|------|
| `src/components/dds/settings/SettingsModal.tsx` | 新增 | 统一设置入口 |
| `src/components/dds/settings/SettingsModal.module.css` | 新增 | 样式 |
| `src/components/dds/settings/PerformanceSettings.tsx` | 新增 | 性能 Tab 内容 |
| `src/components/dds/settings/__tests__/SettingsModal.test.tsx` | 新增 | Tab 切换测试 |
| `src/components/dds/toolbar/DDSToolbar.tsx` | 修改 | + ⚙️ 按钮 |

### expect() 断言示例

```typescript
describe('SettingsModal Tab Navigation', () => {
  it('默认打开快捷键 Tab', () => {
    render(<SettingsModal open={true} onClose={vi.fn()} />);
    expect(screen.getByRole('tab', { name: /快捷键/ })).toHaveAttribute('aria-selected', 'true');
  });

  it('点击通知 Tab 切换内容', () => {
    render(<SettingsModal open={true} onClose={vi.fn()} />);
    userEvent.click(screen.getByRole('tab', { name: /通知/ }));
    expect(screen.getByText(/通知偏好/)).toBeInTheDocument();
  });

  it('关闭后重新打开恢复 lastOpenedTab', () => {
    settingsStore.getState().lastOpenedTab = 'notifications';
    render(<SettingsModal open={true} onClose={vi.fn()} />);
    expect(screen.getByRole('tab', { name: /通知/ })).toHaveAttribute('aria-selected', 'true');
  });
});
```

---

## Epic E5: 协作者在线状态与活动流

### DoD Checklist

- [ ] `presenceStore` 新增 `lastActiveAt: Record<string, number>` 状态
- [ ] `presenceStore` 新增 `updateLastActive(userId)` action
- [ ] `presenceStore` 新增 `isOnline(userId)` 计算方法 (5min 阈值)
- [ ] `OnlinePresenceIndicator.tsx` 组件 (绿点/灰点指示器)
- [ ] `DDSCanvasPage.tsx` 协作头像栏集成指示器
- [ ] WS 新增 `presence_update` inbound 事件处理
- [ ] `CollabActivityPanel` 接收 WS `activity` 事件
- [ ] CollabActivityPanel 实时追加活动到 feed 顶部
- [ ] 鼠标移动/节点编辑触发 `presence_update` 上报
- [ ] vitest: presenceStore isOnline + CollabActivityPanel 实时 6/6

### 新增/扩展文件

| File | Action | Note |
|------|--------|------|
| `src/stores/dds/presenceStore.ts` | 修改 | + lastActiveAt + isOnline |
| `src/components/dds/collab/OnlinePresenceIndicator.tsx` | 新增 | 在线状态指示器 |
| `src/components/dds/collab/OnlinePresenceIndicator.module.css` | 新增 | 样式 |
| `src/components/dds/collab/CollabActivityPanel.tsx` | 修改 | + WS 实时追加 |
| `src/components/dds/DDSCanvasPage.tsx` | 修改 | + 集成指示器 |
| `src/stores/dds/__tests__/presenceStore.e5.test.ts` | 新增 | isOnline 测试 |

### expect() 断言示例

```typescript
describe('Online Presence', () => {
  it('5min内有活动返回在线', () => {
    presenceStore.getState().updateLastActive('u1');
    expect(presenceStore.getState().isOnline('u1')).toBe(true);
  });

  it('5min无活动返回离开', () => {
    vi.useFakeTimers();
    presenceStore.getState().updateLastActive('u1');
    vi.advanceTimersByTime(6 * 60 * 1000);
    expect(presenceStore.getState().isOnline('u1')).toBe(false);
  });
});

describe('CollabActivityPanel real-time', () => {
  it('WS activity 事件追加到 feed 顶部', async () => {
    const { rerender } = render(<CollabActivityPanel ... />);
    // Simulate WS event
    wsClient.trigger('activity', { action: 'node_edit', userId: 'u1' });
    rerender(<CollabActivityPanel ... />);
    expect(screen.getByText(/u1 进行了节点编辑/)).toBeInTheDocument();
  });
});
```

---

## 测试命令

```bash
# E1
npx vitest run notificationStore.preferences --reporter=verbose

# E2
npx vitest run templateStore.category --reporter=verbose

# E3
npx vitest run canvasHistoryStore.e3-merge-history --reporter=verbose

# E4
npx vitest run SettingsModal --reporter=verbose

# E5
npx vitest run presenceStore.e5 --reporter=verbose
```
