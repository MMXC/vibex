# VibeX Sprint80 PRD — 产品需求文档

**Project**: vibex-proposals-sprint80  
**Date**: 2026-06-09  
**Status**: Draft

---

## 执行摘要

Sprint80 聚焦于**系统完善与协作体验提升**：统一通知管理、模板系统增强、分支历史可视化、统一设置中心、协作者在线状态。基于 S78/S79 的功能实现，填补体验缺口，让已有功能更易发现、更易配置、更易协作者感知。

---

## Epic × DoD 矩阵

### E1: 统一通知中心管理面板

**Owner**: PM  
**依赖**: E1 独立，无前置依赖

| DoD Item | 验收标准 |
|----------|---------|
| notificationStore preferences 状态 | `setPreference(type, enabled)` + `getPreference(type)` 工作正常 |
| NotificationPreferences 类型定义 | `NotificationPreferences` = `{ [type in NotificationType]?: { enabled: boolean; muteUntil?: number } }` |
| 持久化到 IndexedDB | 重启后偏好设置保留 |
| NotificationPreferencesPanel 组件 | ⚙️ 按钮打开面板，列出所有 NotificationType 开关 |
| 通知发送前检查偏好 | 只有 `preferences[type]?.enabled !== false` 时才发送通知 |
| vitest 测试 | notificationStore preference 相关 5/5 |

**expect() 断言**:
```typescript
expect(store.getState().preferences['mention']?.enabled).toBe(true); // 默认开启
store.getState().setPreference('mention', false);
expect(store.getState().getPreference('mention')?.enabled).toBe(false);
```

---

### E2: 模板分类与标签系统

**Owner**: PM  
**依赖**: E1 完成

| DoD Item | 验收标准 |
|----------|---------|
| TemplateMeta category + tags | `TemplateMeta` 有 `category: TemplateCategory` + `tags: string[]` |
| TemplateCategory 枚举 | `'flowchart' | 'mindmap' | 'ui-prototype' | 'whiteboard' | 'other'` |
| Gallery TabBar 分类导航 | 5 个 category tab，点击切换 |
| TagChip 多选过滤 | 选中 tag 时过滤显示匹配模板 |
| 模板创建时选择 category | CreateTemplateDialog 有分类下拉框 |
| 模板创建时添加 tags | CreateTemplateDialog 有 tag 输入框 |
| templateStore filter actions | `filterByCategory(cat)` / `filterByTag(tag)` / `filterBySearch(q)` |
| vitest 测试 | templateStore filter 相关 5/5 |

**expect() 断言**:
```typescript
expect(meta.category).toBe('flowchart');
expect(meta.tags).toContain('architecture');
store.getState().filterByCategory('mindmap');
expect(store.getState().filteredTemplates.length).toBeLessThan(store.getState().templates.length);
```

---

### E3: 分支合并历史可视化面板

**Owner**: PM  
**依赖**: E2 完成

| DoD Item | 验收标准 |
|----------|---------|
| MergeHistoryEntry enriched fields | `mergedNodeIds: string[]` + `conflictCount: number` + `authorIds: string[]` |
| recordMerge 传入完整参数 | 分支合并完成后调用 recordMerge 时传入节点和作者信息 |
| Timeline Item 可展开 | 点击时间线条目展开详情面板 |
| 展开显示合并统计 | 显示「新增 N 节点 / 修改 M 节点 / 删除 K 节点」+ 贡献者头像 |
| vitest 测试 | canvasHistoryStore mergeHistory enriched 4/4 |

**expect() 断言**:
```typescript
store.getState().recordMerge({ ...entry, mergedNodeIds: ['n1', 'n2'], authorIds: ['u1'] });
const history = store.getState().getMergeHistory();
expect(history[0].mergedNodeIds).toEqual(['n1', 'n2']);
expect(history[0].authorIds).toEqual(['u1']);
```

---

### E4: 画布设置中心

**Owner**: PM  
**依赖**: E3 完成

| DoD Item | 验收标准 |
|----------|---------|
| DDSToolbar ⚙️ 按钮 | 点击打开 SettingsModal |
| SettingsModal TabBar | 4 Tab: 快捷键 | 画布 | 通知 | 性能 |
| 快捷键 Tab | 集成 ShortcutSettingsPanel 内容 |
| 画布 Tab | 集成 CanvasSettingsPanel (含 DPR 设置) |
| 通知 Tab | 集成 NotificationPreferencesPanel |
| 性能 Tab | DPR 模式选择 + 离线缓存策略 |
| lastOpenedTab 持久化 | 记住上次打开的 tab |
| vitest 测试 | settingsModal tab switching 5/5 |

**expect() 断言**:
```typescript
expect(screen.getByRole('tab', { name: /快捷键/ })).toBeInTheDocument();
expect(screen.getByRole('tab', { name: /通知/ })).toBeInTheDocument();
userEvent.click(screen.getByRole('tab', { name: /通知/ }));
expect(screen.getByText(/通知偏好/)).toBeInTheDocument();
```

---

### E5: 协作者在线状态与活动流

**Owner**: PM  
**依赖**: E4 完成

| DoD Item | 验收标准 |
|----------|---------|
| presenceStore lastActiveAt | 每次 presence 更新时更新 lastActiveAt 时间戳 |
| isOnline 计算属性 | 5min 内有活动 → true；5min 无活动 → false |
| OnlinePresenceIndicator 组件 | 用户头像旁显示绿点(在线) / 灰点(离开) |
| 指示器集成到 DDSCanvasPage | 协作头像栏显示在线状态 |
| CollabActivityPanel 实时追加 | WS 推送 `activity` 事件时，feed 顶部追加新条目 |
| 活跃状态上报 | 鼠标移动/节点编辑时通过 WS 发送 presence_update 事件 |
| vitest 测试 | presenceStore isOnline + CollabActivityPanel 实时 6/6 |

**expect() 断言**:
```typescript
expect(presenceStore.getState().isOnline('u1')).toBe(true); // 5min内有活动
vi.useFakeTimers();
vi.advanceTimersByTime(6 * 60 * 1000); // 6分钟
expect(presenceStore.getState().isOnline('u1')).toBe(false);
```

---

## 跨 Epic 集成表

| 集成点 | E1 ↔ E4 | E2 ↔ E4 | E5 ↔ E1 |
|--------|---------|---------|---------|
| NotificationPreferencesPanel | 被 SettingsModal 通知 Tab 引用 | — | — |
| NotificationType enum | E1 定义 | E2 模板更新通知用到 | E5 活动通知用到 |
| TemplateCategory | — | E2 定义 | — |

---

## 质量门槛

- 每个 Epic 至少 4 个 vitest 测试用例
- E1/E2/E4/E5 涉及 UI 组件的 vitest 必须渲染测试 (renderHook/render)
- 所有新增 store actions 必须有对应的单元测试
