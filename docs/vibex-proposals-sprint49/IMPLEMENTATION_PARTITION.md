# VibeX Sprint 49 实现分区计划

> **Agent**: coord (architect self-impl)
> **日期**: 2026-06-01
> **依据**: prd.md + architecture.md

---

## 实现顺序

```
E1 (P0) → E4 (P1, 依赖 E1 的 onComplete) → E2 (P1) → E3 (P1) → E5 (P2)
```

**依赖关系**：
- E4 auto-snapshot 依赖 E1 的 `useStreamingAgent.onComplete` hook
- E3/E2/E5 无相互依赖，可并行

---

## E1 — AI 断线重连 + 流式可靠性增强

**预估工时**: M
**分支**: `epic/s49-e1-ai-retry`

### 改动文件

| 文件 | 操作 | 关键内容 |
|------|------|---------|
| `src/hooks/useStreamingAgent.ts` | 修改 | 添加指数退避 / 60s 超时 / retryStatus |
| `src/components/ui/ConnectionStatus.tsx` | 修改 | 新增 RetryBadge |
| `src/hooks/__tests__/useStreamingAgent.test.ts` | 修改 | +5 tests: retry counter / timeout / success |

### DoD Checklist
- [ ] `useStreamingAgent` 新增参数: `retryBaseDelay`(1000ms), `retryMaxDelay`(8000ms), `requestTimeout`(60000ms)
- [ ] 指数退避: delay = min(1000 * 2^attempt, 8000) + jitter
- [ ] 60s 超时: `AbortController.timeout` via `setTimeout(signal.abort, 60000)`
- [ ] UI badge 显示: "正在重连 (N/3)" / "请求超时" / "重连成功"
- [ ] vitest ≥5 tests PASS
- [ ] dual-CHANGELOG updated

### 验收标准 (expect)
```typescript
// 重试计数器
expect(retryStatus).toBe('retrying');
expect(retryCount).toBe(1);
// 超时
expect(retryStatus).toBe('timeout');
// 成功恢复
expect(retryStatus).toBe('success');
```

---

## E4 — 画布版本历史可视化

**预估工时**: M
**分支**: `epic/s49-e4-version-history`
**前置依赖**: E1 onComplete hook 完成后

### 改动文件

| 文件 | 操作 | 关键内容 |
|------|------|---------|
| `src/stores/dds/snapshotHistoryStore.ts` | 新建 | auto-snapshot / debounce |
| `src/components/dds/version-history/Timeline.tsx` | 新建 | 水平滚动时间轴 |
| `src/components/dds/version-history/SnapshotDiff.tsx` | 新建 | 双栏 diff 对比 |
| `src/hooks/useStreamingAgent.ts` | 修改 | E1 后 onComplete 调用 auto-snapshot |
| `src/stores/dds/__tests__/snapshotHistoryStore.test.ts` | 新建 | auto-snapshot debounce / Timeline |

### DoD Checklist
- [ ] `snapshotHistoryStore.addAutoSnapshot('ai-generate')` 在 AI 生成完成时调用
- [ ] `snapshotHistoryStore.addAutoSnapshot('pre-export')` 在导出前调用
- [ ] auto-snapshot debounce 2s 防止误触发
- [ ] Timeline 组件水平滚动 + 关键节点 label
- [ ] SnapshotDiff 双栏对比高亮变化
- [ ] vitest snapshotHistoryStore + Timeline PASS
- [ ] dual-CHANGELOG updated

### 验收标准 (expect)
```typescript
const store = createSnapshotHistoryStore();
const before = store.snapshots.length;
store.addAutoSnapshot('ai-generate');
const after = store.snapshots.length;
expect(after).toBe(before + 1);
expect(store.snapshots[store.snapshots.length - 1].type).toBe('ai-generate');
```

---

## E2 — 画布模板管理完善

**预估工时**: M
**分支**: `epic/s49-e2-template-mgmt`
**前置依赖**: 无

### 改动文件

| 文件 | 操作 | 关键内容 |
|------|------|---------|
| `src/stores/templateStore.ts` | 修改 | searchTemplates / filterByCategory / renameTemplate / thumbnailCache |
| `src/components/dds/templates/TemplateSearchBar.tsx` | 新建 | 模糊搜索框 |
| `src/components/dds/templates/CategoryFilter.tsx` | 新建 | 分类按钮组 |
| `src/components/dds/templates/TemplateThumbnail.tsx` | 新建 | SVG 缩略图 |
| `src/components/dds/templates/TemplateSaveDialog.tsx` | 修改 | name 可编辑 |
| `src/stores/templateStore.test.ts` | 修改 | +search/filter/rename tests |

### DoD Checklist
- [ ] 模板搜索框 `searchTemplates(query)` 实现 name 模糊匹配
- [ ] 分类筛选器 blank/flowchart/mindmap/swot
- [ ] 缩略图生成（SVG snapshot → IndexedDB）
- [ ] TemplateSaveDialog name 可编辑
- [ ] vitest ≥10 tests PASS
- [ ] dual-CHANGELOG updated

### 验收标准 (expect)
```typescript
const store = createTemplateStore();
store.addTemplate({ name: 'flowchart-basic', category: 'flowchart' });
store.addTemplate({ name: 'blank-default', category: 'blank' });
const results = store.searchTemplates('flow');
expect(results).toHaveLength(1);
expect(results[0].name).toBe('flowchart-basic');
```

---

## E3 — 大型画布性能优化 v2

**预估工时**: M
**分支**: `epic/s49-e3-perf-v2`
**前置依赖**: 无

### 改动文件

| 文件 | 操作 | 关键内容 |
|------|------|---------|
| `src/lib/canvas/stores/viewportBoundsStore.ts` | 修改 | nodeExtent / onlyRenderVisible / debounce |
| `src/components/dds/DDSFlow.tsx` | 修改 | 注入 viewport 配置 |
| `src/lib/canvas/stores/__tests__/viewportBoundsStore.test.ts` | 修改 | debounce 行为测试 |

### DoD Checklist
- [ ] `nodeExtent` 设置为 `[[-5000, -5000], [5000, 5000]]`
- [ ] `onlyRenderVisibleElements` 默认开启
- [ ] offscreen 节点延迟 100ms 渲染
- [ ] 缩放 debounce 100ms（Zustand action 级别）
- [ ] vitest debounce 调用次数测试
- [ ] dual-CHANGELOG updated

### 验收标准 (expect)
```typescript
// debounce 测试 (行为替代性能)
const spy = vi.spyOn(store, 'setViewport');
fireEvent.resize(window);
await waitFor(() => {
  expect(spy).toHaveBeenCalledTimes(1);  // 多次 resize 只触发 1 次
});
```

---

## E5 — 协作评论系统

**预估工时**: L
**分支**: `epic/s49-e5-comments`
**前置依赖**: 无

### 改动文件

| 文件 | 操作 | 关键内容 |
|------|------|---------|
| `src/stores/dds/commentStore.ts` | 新建 | comment CRUD + IndexedDB persist |
| `src/components/dds/comments/CommentBadge.tsx` | 新建 | 节点右上角 badge |
| `src/components/dds/comments/CommentPanel.tsx` | 新建 | 右侧边栏评论列表 |
| `src/stores/dds/__tests__/commentStore.test.ts` | 新建 | CRUD / unread / resolve |
| `src/lib/streamingChunkDB.ts` | 参考 | IndexedDB wrapper 模式复用 |

### DoD Checklist
- [ ] `commentStore` 数据模型 (commentId/nodeId/text/author/timestamp/resolved/version)
- [ ] 节点评论气泡（右上角 badge + 未读数）
- [ ] 评论 Panel（右侧边栏，列出 + 回复）
- [ ] IndexedDB 持久化（offline-first）
- [ ] vitest ≥5 tests PASS
- [ ] dual-CHANGELOG updated

### 验收标准 (expect)
```typescript
const store = createCommentStore();
store.addComment({ nodeId: 'node-1', text: 'Review this' });
expect(store.getCommentsByNode('node-1')).toHaveLength(1);
store.resolveComment(store.comments[0].commentId);
expect(store.comments[0].resolved).toBe(true);
```

---

## Epic 合流计划

每个 Epic 完成后依次合并到 main：
```bash
git checkout main
git pull
git merge --no-ff epic/s49-e1-ai-retry
git merge --no-ff epic/s49-e4-version-history
git merge --no-ff epic/s49-e2-template-mgmt
git merge --no-ff epic/s49-e3-perf-v2
git merge --no-ff epic/s49-e5-comments
git push origin main
# 删除 epic branches
git branch -d epic/s49-e1-ai-retry epic/s49-e4-version-history epic/s49-e2-template-mgmt epic/s49-e3-perf-v2 epic/s49-e5-comments
```

---

## 通用 DoD（全 Epic 必须满足）

- [ ] TypeScript strict mode 无 error
- [ ] `pnpm build` 构建成功
- [ ] vitest 全量 PASS
- [ ] dual-CHANGELOG（根目录 + vibex-fronted）均已更新
- [ ] 所有 epic 分支已合并到 main 并 push 到 origin
- [ ] Epic 分支已删除（合并后清理）
