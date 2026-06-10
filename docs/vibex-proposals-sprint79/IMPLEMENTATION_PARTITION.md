# Sprint79 IMPLEMENTATION PARTITION

**项目**: vibex-proposals-sprint79
**日期**: 2026-06-08

---

## E1: 定时导出执行引擎

### DoD Checklist

- [ ] `ScheduledExportRunner.ts` 单例实现 `startScheduler()` / `stopScheduler()`
- [ ] `setInterval` 每 60s 轮询到期任务
- [ ] 到期调用 `ZipExporter.exportWithWebhook()`
- [ ] 调用 `canvasListStore.markExportRun(id)` 更新 `lastRunAt`
- [ ] `ScheduledExport` interface 新增 `lastRunAt?: string`
- [ ] `canvasListStore.ts` 新增 `markExportRun(id)` action
- [ ] DDSDashboard 或 App root `useEffect` 调用 `startScheduler()`
- [ ] vitest: `ScheduledExportRunner.test.ts` 12/12
- [ ] eslint 0 new warnings

### expect() 测试断言

```typescript
expect(ScheduledExportRunner.getInstance()).toBeDefined();
instance.startScheduler();
// advance timers → 到期任务触发
expect(mockExportWithWebhook).toHaveBeenCalled();
expect(canvasListStore.getState().scheduledExports[0].lastRunAt).toBeDefined();
instance.stopScheduler();
```

### 新增/扩展文件

| 文件 | 类型 | 说明 |
|------|------|------|
| `src/services/export/ScheduledExportRunner.ts` | **新增** | 执行引擎单例 |
| `src/stores/dds/__tests__/ScheduledExportRunner.test.ts` | **新增** | 12 个测试 |
| `src/stores/dds/canvasListStore.ts` | 扩展 | `markExportRun` + `lastRunAt` 字段 |

---

## E2: 模板更新通知面板

### DoD Checklist

- [ ] `DDSToolbar.tsx` 确认/添加通知铃铛按钮
- [ ] `notificationStore.getUnreadCount()` 包含 `template_update`
- [ ] `NotificationPanel.tsx` 新增「模板更新」Tab
- [ ] 模板更新项显示缩略图 + 作者名 + 时间
- [ ] 点击跳转 `TemplateMarketplacePanel` 高亮模板
- [ ] vitest: `NotificationPanel.template-update.test.tsx` 6/6
- [ ] eslint 0 new warnings

### expect() 测试断言

```typescript
render(<NotificationPanel />);
fireEvent.click(screen.getByRole('tab', { name: /模板更新/i }));
expect(screen.getByText(/模板更新/)).toBeInTheDocument();
expect(screen.queryAllByText(/更新于/)).toHaveLength(templateNotifications.length);
```

### 新增/扩展文件

| 文件 | 类型 | 说明 |
|------|------|------|
| `src/components/dds/notifications/__tests__/NotificationPanel.template-update.test.tsx` | **新增** | 6 个测试 |
| `src/components/dds/notifications/NotificationPanel.tsx` | 扩展 | 新增 Tab |
| `src/components/dds/toolbar/DDSToolbar.tsx` | 扩展 | 验证/添加铃铛按钮 |

---

## E3: 评论/提及通知系统

### DoD Checklist

- [ ] `collabSessionStore.addComment` 在 `parentId` 存在时创建 `comment_reply` 通知
- [ ] `notificationStore.ts` 新增 `'comment_reply'`/`'mention'` NotificationType
- [ ] `mentionStore` @提及时触发 `mention` 通知
- [ ] `NotificationPanel` 显示评论回复和提及通知
- [ ] 回复通知带节点跳转锚点
- [ ] vitest: `collabSessionStore.comments.test.ts` 扩展 4 条
- [ ] vitest: `mentionStore.mention-notification.test.ts` 4/4
- [ ] eslint 0 new warnings

### expect() 测试断言

```typescript
await act(async () => { store.getState().addComment('c1', 'n1', 'reply', 'p1'); });
const notifs = store.getState().notifications;
expect(notifs.find(n => n.type === 'comment_reply')?.targetUserId).toBe('parent-author-id');
```

### 新增/扩展文件

| 文件 | 类型 | 说明 |
|------|------|------|
| `src/stores/dds/__tests__/collabSessionStore.comments-notification.test.ts` | **新增** | 4 个测试 |
| `src/stores/dds/__tests__/mentionStore.mention-notification.test.ts` | **新增** | 4 个测试 |
| `src/lib/collaboration/collabSessionStore.ts` | 扩展 | addComment reply → 通知 |
| `src/stores/dds/mentionsStore.ts` | 扩展 | 提及 → 通知 |
| `src/stores/dds/notificationStore.ts` | 扩展 | 新增类型 |

---

## E4: 画布关联网络可视化

### DoD Checklist

- [ ] `CanvasRelationGraph.tsx` — CSS Grid/Flexbox 关系图
- [ ] 中心节点居中，父子/关联分层显示
- [ ] 每个节点可点击跳转
- [ ] 支持 `maxDepth` prop（默认 1）
- [ ] `CanvasRelationsPanel` 新增 Tab 切换（列表 ↔ 图形）
- [ ] `getCanvasRelations` 支持 `maxDepth` 参数
- [ ] vitest: `CanvasRelationGraph.test.tsx` 6/6
- [ ] eslint 0 new warnings

### expect() 测试断言

```typescript
render(<CanvasRelationGraph canvasId="c1" relations={mockRelations} />);
expect(screen.getByText('父画布')).toBeInTheDocument();
expect(screen.getAllByRole('button').length).toBeGreaterThanOrEqual(2);
```

### 新增/扩展文件

| 文件 | 类型 | 说明 |
|------|------|------|
| `src/components/dds/canvas/CanvasRelationGraph.tsx` | **新增** | 关系图组件 |
| `src/components/dds/canvas/__tests__/CanvasRelationGraph.test.tsx` | **新增** | 6 个测试 |
| `src/components/dds/canvas/CanvasRelationsPanel.tsx` | 扩展 | Tab 切换 |
| `src/stores/dds/canvasListStore.ts` | 扩展 | `maxDepth` 参数 |

---

## E5: 合并历史与差异查看器

### DoD Checklist

- [ ] `MergeHistoryEntry` interface + `mergeHistory` state
- [ ] `recordMerge(entry)` — 合并成功后自动调用
- [ ] `getMergeHistory(canvasId)` — 时间倒序
- [ ] `MergeHistoryPanel.tsx` — 时间线 UI
- [ ] 每条记录：源分支 → 目标分支 + 时间 + 合并者
- [ ] `BranchManager.tsx` 添加 MergeHistoryPanel 入口
- [ ] vitest: `canvasHistoryStore.merge-history.test.ts` 6/6
- [ ] eslint 0 new warnings

### expect() 测试断言

```typescript
await act(async () => { store.getState().recordMerge(mockEntry); });
const history = store.getState().getMergeHistory('c1');
expect(history).toHaveLength(1);
expect(history[0].sourceBranch).toBe('b1');
expect(history[0].targetBranch).toBe('main');
```

### 新增/扩展文件

| 文件 | 类型 | 说明 |
|------|------|------|
| `src/components/dds/canvas-history/MergeHistoryPanel.tsx` | **新增** | 时间线面板 |
| `src/stores/dds/__tests__/canvasHistoryStore.merge-history.test.ts` | **新增** | 6 个测试 |
| `src/stores/dds/canvasHistoryStore.ts` | 扩展 | mergeHistory + actions |
| `src/components/dds/canvas-history/BranchManager.tsx` | 扩展 | MergeHistoryPanel 入口 |

---

## 总计

| Epic | 新增文件 | 扩展文件 | vitest 目标 |
|------|---------|---------|------------|
| E1 | 2 | 1 | 12/12 |
| E2 | 1 | 2 | 6/6 |
| E3 | 2 | 3 | 8/8 |
| E4 | 2 | 2 | 6/6 |
| E5 | 2 | 2 | 6/6 |
| **合计** | **9** | **10** | **≥38** |
