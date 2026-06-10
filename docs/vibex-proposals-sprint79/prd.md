# Sprint79 PRD — VibeX 定时导出引擎 & 通知落地 & 可视化增强

**项目**: vibex-proposals-sprint79
**版本**: 1.0
**日期**: 2026-06-08
**产品负责人**: Hermes Coord

---

## 执行摘要

Sprint79 聚焦于三个维度：**补全 S78 功能落地**（定时导出执行引擎、模板通知 UI、评论通知）、**增强数据可视化**（关联网络图形化、合并历史时间线），总计 5 个 Epic，25 个 DoD 条目。

---

## Epic-Story 表

| Epic | 名称 | 优先级 | 负责人 |
|------|------|--------|--------|
| E1 | 定时导出执行引擎 | P0 | Dev |
| E2 | 模板更新通知面板 | P1 | Dev |
| E3 | 评论/提及通知系统 | P1 | Dev |
| E4 | 画布关联网络可视化 | P2 | Dev |
| E5 | 合并历史与差异查看器 | P2 | Dev |

---

## E1: 定时导出执行引擎

### DoD (Definition of Done)

- [ ] `ScheduledExportRunner.ts` 单例类实现 `startScheduler()` / `stopScheduler()`
- [ ] `setInterval` 每 60s 轮询所有 scheduledExports，判断 `parseCronNextRun` 是否到期
- [ ] 到期时调用 `ZipExporter.exportWithWebhook(canvasId, options, webhookUrl)`
- [ ] 执行成功后调用 `canvasListStore.markExportRun(id)` 更新 `lastRunAt`
- [ ] `ScheduledExport` interface 新增 `lastRunAt?: string` 字段
- [ ] `canvasListStore.ts` 新增 `markExportRun(id)` action
- [ ] 页面加载时在 DDSDashboard 或 App root useEffect 调用 `startScheduler()`
- [ ] vitest: `ScheduledExportRunner.test.ts` 12/12
- [ ] eslint 无新增警告

### expect() 断言

```typescript
// ScheduledExportRunner.test.ts
expect(ScheduledExportRunner.getInstance()).toBeDefined();
const instance = ScheduledExportRunner.getInstance();
instance.startScheduler();
// mock setInterval advance 60s →到期任务触发
expect(mockExportWithWebhook).toHaveBeenCalledWith(expect.any(String), expect.any(Object), expect.stringContaining('http'));
// markExportRun 更新 lastRunAt
expect(canvasListStore.getState().scheduledExports[0].lastRunAt).toBeDefined();
instance.stopScheduler();
```

---

## E2: 模板更新通知面板

### DoD

- [ ] `DDSToolbar.tsx` 确认存在通知铃铛按钮（参考 S68-E2 NotificationPanel 扩展模式）
- [ ] 若铃铛缺失，添加 `isNotificationOpen` 状态 + 铃铛按钮 + `NotificationPanel` 渲染
- [ ] `notificationStore.getUnreadCount()` 包含 `template_update` 类型计数
- [ ] `NotificationPanel.tsx` 新增「模板更新」Tab（type filter = `template_update`）
- [ ] 模板更新项显示：缩略图 + 作者名 + "X 小时前更新"
- [ ] 点击模板更新项跳转 `TemplateMarketplacePanel` 并高亮对应模板
- [ ] vitest: `NotificationPanel.template-update.test.tsx` 6/6
- [ ] eslint 无新增警告

### expect() 断言

```typescript
// NotificationPanel.template-update.test.tsx
render(<NotificationPanel />, { wrapper: NotificationsWrapper });
const templateTab = screen.getByRole('tab', { name: /模板更新/i });
fireEvent.click(templateTab);
expect(screen.getByText(/模板更新/)).toBeInTheDocument();
expect(screen.queryAllByText(/更新于/)).toHaveLength(templateNotifications.length);
```

---

## E3: 评论/提及通知系统

### DoD

- [ ] `collabSessionStore.ts` — `addComment` 中当 `parentId` 存在时，创建 `comment_reply` 通知
- [ ] `notificationStore.ts` — 新增 NotificationType `'comment_reply'` 和 `'mention'`
- [ ] `mentionStore.ts` — @提及时触发 `mention` 类型通知
- [ ] `NotificationPanel.tsx` — 评论回复和提及通知项带节点跳转锚点
- [ ] 回复通知点击后跳转到对应画布 + 高亮评论节点
- [ ] vitest: `collabSessionStore.comments.test.ts` 扩展回复通知测试 4 条
- [ ] vitest: `mentionStore.mention-notification.test.ts` 4/4
- [ ] eslint 无新增警告

### expect() 断言

```typescript
// collabSessionStore.comments.test.ts
const store = createTestStore();
await act(async () => { store.getState().addComment('c1', 'n1', 'reply content', 'p1'); });
const notifs = store.getState().notifications;
expect(notifs.find(n => n.type === 'comment_reply')).toBeDefined();
expect(notifs.find(n => n.type === 'comment_reply')?.targetUserId).toBe('author-p1');
```

---

## E4: 画布关联网络可视化

### DoD

- [ ] `CanvasRelationGraph.tsx` — CSS/HTML 关系图组件
- [ ] 当前画布居中，父画布在上方，子画布在下方，关联画布在两侧
- [ ] 每个节点为可点击卡片，显示画布名称 + 关系类型
- [ ] 点击节点跳转对应画布 `navigateToCanvas(canvasId)`
- [ ] 支持 `maxDepth` prop（默认 1）
- [ ] `CanvasRelationsPanel.tsx` — Tab 切换：列表视图 ↔ 图形视图
- [ ] `canvasListStore.getCanvasRelations` 支持 `maxDepth` 参数
- [ ] vitest: `CanvasRelationGraph.test.tsx` 6/6
- [ ] eslint 无新增警告

### expect() 断言

```typescript
// CanvasRelationGraph.test.tsx
render(<CanvasRelationGraph canvasId="c1" relations={mockRelations} />);
expect(screen.getByText('父画布')).toBeInTheDocument();
expect(screen.getByText('子画布A')).toBeInTheDocument();
const nodes = screen.getAllByRole('button');
expect(nodes.length).toBeGreaterThanOrEqual(2);
```

---

## E5: 合并历史与差异查看器

### DoD

- [ ] `canvasHistoryStore.ts` — `MergeHistoryEntry` interface + `mergeHistory` state
- [ ] `recordMerge(entry)` — 每次 `autoMergeBranch` 或手动合并成功后调用
- [ ] `getMergeHistory(canvasId)` — 返回画布合并历史，按时间倒序
- [ ] `MergeHistoryPanel.tsx` — 时间线面板，显示 mergeHistory
- [ ] 每条记录：源分支 → 目标分支 + 时间 + 合并者
- [ ] `BranchManager.tsx` — 添加 MergeHistoryPanel 入口（Tab 或 drawer）
- [ ] vitest: `canvasHistoryStore.merge-history.test.ts` 6/6
- [ ] eslint 无新增警告

### expect() 断言

```typescript
// canvasHistoryStore.merge-history.test.ts
const store = createTestStore();
await act(async () => {
  store.getState().recordMerge({ id: 'mh1', canvasId: 'c1', sourceBranch: 'b1', targetBranch: 'main', mergedAt: '2026-06-08T12:00:00Z', mergedBy: 'user1', snapshotId: 's1' });
});
const history = store.getState().getMergeHistory('c1');
expect(history).toHaveLength(1);
expect(history[0].sourceBranch).toBe('b1');
expect(history[0].targetBranch).toBe('main');
```

---

## 跨 Epic 集成点

| 集成点 | 涉及 Epic | 验证方式 |
|--------|-----------|----------|
| ScheduledExportRunner → ZipExporter | E1 | mock 验证调用参数 |
| DDSToolbar → NotificationPanel | E1, E2 | UI 集成测试 |
| collabSessionStore → notificationStore | E3 | store 集成测试 |
| CanvasRelationsPanel → CanvasRelationGraph | E4 | UI 切换测试 |
| canvasHistoryStore → BranchManager | E5 | Panel 集成测试 |
| NotificationPanel ← E2, E3 | E2, E3 | Tab 筛选测试 |

---

## 页面集成表

| 页面/组件 | 涉及 Epic | 改动类型 |
|-----------|----------|----------|
| DDSDashboard / App root | E1 | useEffect 调用 startScheduler |
| DDSToolbar | E2 | 铃铛按钮（若缺失） |
| NotificationPanel | E2, E3 | 新增 Tab |
| CanvasRelationsPanel | E4 | 新增 Tab |
| BranchManager | E5 | 新增 Tab/入口 |
| canvasHistoryStore | E1, E5 | 扩展方法 |
| notificationStore | E2, E3 | 扩展类型 |
| collabSessionStore | E3 | 扩展 addComment |
| mentionStore | E3 | 扩展提及处理 |

---

## 质量门槛

- vitest: E1 ≥12, E2 ≥6, E3 ≥8, E4 ≥6, E5 ≥6 = 总计 ≥38 passing
- eslint: 0 new warnings
- 所有新增组件有 `aria-label` 或 `role`
