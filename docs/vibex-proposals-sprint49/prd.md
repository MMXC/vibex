# VibeX Sprint 49 PRD

> **Agent**: coord (heartbeat self-implement — pm-review ghost-completed without output)
> **日期**: 2026-06-01
> **输入**: proposals/20260601/analyst.md (5 proposals)
> **下一步**: architect-review → coord-decision → Phase2

---

## 执行摘要

Sprint49 基于 Sprint48 交付的 5 个 Epic（Canvas 导出/PDF/快捷键/会话标签/跨画布粘贴）进行功能增强，聚焦 **P0 AI 可靠性** + **P1 体验优化** + **P2 协作增强**。5 个 Epic 全部为前端/状态层改动，无后端依赖。

| ID | 优先级 | 标题 | 预估工时 | 主要风险 |
|----|--------|------|----------|----------|
| E1 | P0 | AI 断线重连 + 流式可靠性增强 | M | SSE 重试逻辑测试覆盖 |
| E2 | P1 | 画布模板管理完善 | M | IndexedDB 存储路径 |
| E3 | P1 | 大型画布性能优化 v2 | M | 性能基准可靠性 |
| E4 | P1 | 画布版本历史可视化 | M | auto-snapshot 触发时机 |
| E5 | P2 | 协作评论系统 | L | 评论数据持久化架构 |

---

## Epic-Story Table

| Epic | Story | 功能点 | 验收标准 |
|------|-------|--------|---------|
| E1 | AI 断线重连 | useStreamingAgent 重试逻辑 | 网络断线后自动重试 3 次，每次间隔翻倍 |
| E1 | AI 断线重连 | AbortController 超时保护 | 60s 无响应自动终止，显示超时错误 |
| E1 | AI 断线重连 | 重连状态指示器 | 重试时 UI 显示 "正在重连 (N/3)" badge |
| E1 | AI 断线重连 | 重试逻辑测试 | vitest 覆盖：重试计数器/超时终止/正常完成 |
| E2 | 模板搜索过滤 | 搜索框 name 模糊匹配 | 搜索框输入 "flow" 过滤出 flowchart 类模板 |
| E2 | 模板分类过滤 | 分类筛选器 | 支持 blank/flowchart/mindmap/swot 分类 |
| E2 | 模板预览 | 缩略图生成 | 首次打开模板时生成 SVG snapshot 存入 IndexedDB |
| E2 | 模板重命名 | 用户自定义命名 | TemplateSaveDialog 可编辑 name |
| E2 | 模板 CRUD | IndexedDB 持久化 | IndexedDB 存储用户生成模板，刷新后不丢失 |
| E2 | 模板测试 | Vitest 覆盖 | templateStore CRUD + 搜索过滤，10+ tests PASS |
| E3 | 视口裁剪 | nodeExtent 限制 | nodeExtent 限制渲染范围 + onlyRenderVisibleElements 默认开启 |
| E3 | 节点懒加载 | 离屏节点延迟 | offscreen 节点延迟 100ms 后渲染 |
| E3 | 缩放性能 | debounce viewport | 缩放时 debounce viewport 更新（100ms） |
| E3 | 性能基准 | 帧率测试 | 100 节点画布缩放帧率 >= 30fps（Chrome DevTools Performance） |
| E3 | 性能测试 | Vitest | vitest 覆盖视口相关逻辑 |
| E4 | 自动快照 | AI 生成触发 | AI 生成完成后自动创建快照（snapshotType: "ai-generate"） |
| E4 | 自动快照 | 导出前触发 | 导出前自动创建快照（snapshotType: "pre-export"） |
| E4 | 时间线视图 | Timeline 组件 | Timeline 组件可水平滚动，关键节点有 label |
| E4 | 快照比较 | diff 对比 | 选择任意两个快照对比 diff |
| E4 | 版本历史测试 | Vitest | vitest 覆盖 auto-snapshot 逻辑 + Timeline 渲染 |
| E5 | 评论数据模型 | commentStore | commentId, nodeId, text, author, timestamp, resolved |
| E5 | 评论气泡 UI | 节点评论 badge | 节点右上角 comment badge，显示未读数 |
| E5 | 评论 Panel | 右侧边栏 | 列出当前画布所有评论，支持回复 |
| E5 | 评论持久化 | IndexedDB | offline-first，评论存储在 IndexedDB，刷新不丢失 |
| E5 | 评论测试 | Vitest | commentStore CRUD，5+ tests PASS |

---

## expect() 断言示例（Vitest）

```typescript
// E1: 重试计数器
const hook = renderHook(() => useStreamingAgent({ endpoint: '/api/ai/generate' }));
expect(hook.result.current.retryCount).toBe(0);
act(() => { hook.result.current.trigger断线重连(); });
expect(hook.result.current.status).toBe('retrying');
expect(hook.result.current.retryCount).toBe(1);

// E2: 模板搜索
const store = createTemplateStore();
store.addTemplate({ name: 'flowchart-basic', category: 'flowchart' });
store.addTemplate({ name: 'blank-default', category: 'blank' });
const results = store.searchTemplates('flow');
expect(results).toHaveLength(1);
expect(results[0].name).toBe('flowchart-basic');

// E3: 缩放 debounce
const debounced = debounceViewport(100);
expect(debounced.pending).toBe(false);
debounced.schedule();
expect(debounced.pending).toBe(true);

// E4: 自动快照
const store = createCanvasHistoryStore();
const initialCount = store.snapshots.length;
store.addCustomSnapshot('ai-generate');
expect(store.snapshots.find(s => s.type === 'ai-generate')).toBeTruthy();

// E5: 评论 CRUD
const store = createCommentStore();
store.addComment({ nodeId: 'node-1', text: 'Review this' });
expect(store.getCommentsByNode('node-1')).toHaveLength(1);
store.resolveComment(store.comments[0].id);
expect(store.comments[0].resolved).toBe(true);
```

---

## Definition of Done (DoD)

### E1 — AI 断线重连 + 流式可靠性增强
- [ ] `useStreamingAgent` 添加指数退避重试（max 3 次，base 1s, max 8s）
- [ ] AbortController 超时保护（60s 无响应自动终止）
- [ ] UI 显示重连状态 "正在重连 (N/3)" badge
- [ ] vitest 覆盖：重试计数器 / 超时终止 / 正常完成（≥5 tests）
- [ ] 手动测试：断网 → 重连 → 恢复生成

### E2 — 画布模板管理完善
- [ ] 模板搜索框（name 模糊匹配）实现
- [ ] 分类筛选器（blank/flowchart/mindmap/swot）
- [ ] 模板缩略图预览（SVG snapshot → IndexedDB）
- [ ] 用户自定义模板重命名（TemplateSaveDialog 可编辑）
- [ ] vitest ≥10 tests PASS

### E3 — 大型画布性能优化 v2
- [ ] nodeExtent 限制渲染范围
- [ ] onlyRenderVisibleElements 默认开启
- [ ] 离屏节点延迟 100ms 渲染
- [ ] 缩放 debounce（100ms）
- [ ] 100 节点画布缩放帧率 >= 30fps（Chrome DevTools Performance 验证）
- [ ] vitest 覆盖视口相关逻辑

### E4 — 画布版本历史可视化
- [ ] AI 生成完成后自动快照（snapshotType: "ai-generate"）
- [ ] 导出前自动快照（snapshotType: "pre-export"）
- [ ] Timeline 组件（水平滚动 + 关键节点 label）
- [ ] 快照 diff 对比
- [ ] vitest 覆盖 auto-snapshot 逻辑 + Timeline 渲染

### E5 — 协作评论系统
- [ ] commentStore 数据模型（commentId/nodeId/text/author/timestamp/resolved）
- [ ] 节点评论气泡（右上角 badge + 未读数）
- [ ] 评论 Panel（右侧边栏，列出 + 回复）
- [ ] 评论 IndexedDB 持久化（offline-first）
- [ ] vitest ≥5 tests PASS

### 通用 DoD（全 Epic 必须满足）
- [ ] TypeScript strict mode 无 error
- [ ] `pnpm build` 构建成功
- [ ] vitest 全量 PASS
- [ ] dual-CHANGELOG（根目录 + vibex-fronted）均已更新
- [ ] 所有 epic 分支已合并到 main 并 push 到 origin
- [ ] Epic 分支已删除（合并后清理）

---

## 架构影响

### 依赖关系
```
E1: useStreamingAgent — 依赖 Sprint43 SSE 端点
E2: templateStore — 依赖 Sprint42 TemplateGallery
E3: 视口/节点渲染 — 依赖 React Flow 内置组件
E4: canvasHistoryStore — 依赖 Sprint15 SnapshotSelector
E5: commentStore — 新数据模型，依赖 IndexedDB（已有）
```

### 风险项
| 风险 | 影响 | 缓解 |
|------|------|------|
| E3 性能基准不稳定 | 帧率测试可能随 CI 机器波动 | 用相对指标（debounce 调用次数）代替绝对 fps |
| E4 auto-snapshot 误触发 | 频繁快照导致 IndexedDB 膨胀 | 添加 debounce（编辑停止 2s 后才触发） |
| E5 评论持久化冲突 | 多人同时编辑同一节点评论 | IndexedDB 乐观更新 + 冲突提示 |

### 兼容性
- 所有改动向后兼容（纯增量功能，不修改已有 API）
- 无需数据库迁移
- 无需后端修改

---

## specs/ 目录（供 architect-review 参考）

本次 PRD 详细程度已覆盖 26 个功能点和对应的 expect() 断言。建议 architect-review 重点关注：
1. E3 性能测试的可靠性（建议改为行为测试而非性能测试）
2. E5 评论数据模型的 IndexedDB schema 设计
3. E4 auto-snapshot 的 debounce 策略

