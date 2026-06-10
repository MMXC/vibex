# VibeX Sprint71 PRD — 产品需求文档

**Project**: vibex-proposals-sprint71
**Date**: 2026-06-07
**基于**: analysis.md (5 proposals)

---

## 执行摘要

| Epic | 功能 | 优先级 | 预估规模 |
|------|------|--------|----------|
| E1 | 键盘快捷键可配置化 | P0 | 中 |
| E2 | 实时协作评论系统 | P0 | 大 |
| E3 | 大型画布性能优化 | P1 | 大 |
| E4 | 画布使用统计分析 | P2 | 小 |
| E5 | 模板评分与收藏增强 | P1 | 小 |

---

## E1: 键盘快捷键可配置化

### 1. 概述
允许用户自定义键盘快捷键绑定，持久化到 localStorage，支持冲突检测。

### 2. User Stories
- 作为用户，我希望自定义 `Ctrl+S` 的行为（保存 vs 同步），以适应我的工作习惯
- 作为用户，我希望看到哪些快捷键有冲突，避免误操作
- 作为用户，我希望重置单个快捷键为默认值，而不是全部重置

### 3. DoD (Definition of Done)
- [ ] `shortcutStore.ts` 扩展: `userBindings: Record<string, ShortcutBinding>` + localStorage 持久化
- [ ] `parseShortcut(e: KeyboardEvent): ShortcutKey` 解析函数
- [ ] `registerShortcut(action, defaultBinding, description)` 全局注册 API
- [ ] `ShortcutSettingsPanel.tsx` 新增"自定义" Tab（Tab4）
- [ ] 冲突检测: 相同快捷键绑定多个 action 时显示警告
- [ ] `shortcutStore.test.ts` 覆盖 binding CRUD + conflict detection

### 4. expect() 断言（Vitest）
```typescript
// shortcutStore.userBindings.test.ts
expect(getState().userBindings['save']).toEqual({ ctrl: true, key: 's' })
expect(getState().userBindings['save']).toBeUndefined() // 未设置时

// conflict detection
expect(detectConflict({ ctrl: true, key: 's' }, userBindings)).toBe(true) // 冲突
expect(detectConflict({ ctrl: true, key: 'z' }, userBindings)).toBe(false) // 无冲突

// save/load
await saveBinding('save', { ctrl: true, shift: true, key: 's' })
expect(loadBindings()['save']).toEqual({ ctrl: true, shift: true, key: 's' })
```

### 5. 新增/扩展文件
- `vibex-fronted/src/stores/dds/shortcutStore.ts` — 扩展（已有）
- `vibex-fronted/src/components/dds/settings/ShortcutSettingsPanel.tsx` — 扩展
- `vibex-fronted/src/components/dds/settings/__tests__/ShortcutSettingsPanel.test.tsx` — 新增
- `vibex-fronted/src/stores/dds/__tests__/shortcutStore.bindings.test.ts` — 新增

---

## E2: 实时协作评论系统

### 1. 概述
在 S69-E4 节点评论基础上增加 WebSocket 实时同步，使协作者能实时看到彼此的评论。

### 2. User Stories
- 作为协作者，我希望在画布上评论后，其他协作者立即看到（<2s）
- 作为用户，我希望在评论时 @ 提及团队成员，被提及者立即收到通知
- 作为用户，我希望评论支持 emoji 反应（👍 ❤️ 😂 等）

### 3. DoD (Definition of Done)
- [ ] `commentStore.ts` 新增 `subscribeToCanvas(canvasId)` + `broadcastComment()` action
- [ ] WebSocket `comment:add` / `comment:delete` / `comment:reaction` 消息类型
- [ ] `CommentThread.tsx` 监听 WebSocket，实时追加新评论（<2s 延迟）
- [ ] `MentionInput` 在评论输入框中集成（复用 S51 `MentionInput.tsx`）
- [ ] Emoji 反应: 评论消息下方显示 👍❤️😂 按钮，点击更新
- [ ] `commentStore.test.ts` 覆盖 WS mock + reaction

### 4. expect() 断言（Vitest）
```typescript
// commentStore.realtime.test.ts
const mockWS = { send: vi.fn(), on: vi.fn() }
await subscribeToCanvas('canvas-1', mockWS)
expect(mockWS.send).toHaveBeenCalledWith(JSON.stringify({
  type: 'comment:subscribe', canvasId: 'canvas-1'
}))

// 收到 comment:add 消息时自动添加评论
triggerWSMessage(mockWS, { type: 'comment:add', comment: { id: 'c1', text: 'hello' } })
expect(getState().comments['canvas-1']).toContainEqual(
  expect.objectContaining({ id: 'c1', text: 'hello' })
)

// reaction
await addReaction('comment-1', 'thumbsup', 'user-2')
expect(getState().reactions['comment-1']).toContainEqual(
  expect.objectContaining({ type: 'thumbsup', userId: 'user-2' })
)
```

### 5. 新增/扩展文件
- `vibex-fronted/src/stores/dds/commentStore.ts` — 扩展（已有 S69）
- `vibex-fronted/src/components/dds/comments/CommentThread.tsx` — 扩展（已有 S69）
- `vibex-fronted/src/components/dds/comments/MentionInput.tsx` — 复用（S51）
- `vibex-fronted/src/stores/dds/__tests__/commentStore.realtime.test.ts` — 新增

---

## E3: 大型画布性能优化

### 1. 概述
优化 >500 节点画布的渲染性能，引入虚拟化和视口裁剪。

### 2. User Stories
- 作为大型画布用户（>500节点），我希望打开画布时加载时间 <3s
- 作为用户，我希望拖拽操作始终保持 60fps
- 作为用户，我希望大型画布的快捷键响应不受影响

### 3. DoD (Definition of Done)
- [ ] ReactFlow `nodeExtent` 限制渲染区域
- [ ] 视口虚拟化: 仅渲染当前视口 ± 200px 范围内的节点
- [ ] `BranchManager.tsx` 懒加载: 分支快照按需加载（初始 50 条）
- [ ] 节点聚合: >100 节点显示聚合节点，点击展开
- [ ] WebWorker: `findPath` 计算移到 WebWorker
- [ ] 性能基准测试: `vitest run --reporter=verbose` + `performance.mark()`

### 4. expect() 断言（Vitest）
```typescript
// performance.benchmark.test.ts
// 虚拟化: 视口内节点数量 < 总节点数的 20%
const visibleNodes = filterNodesByViewport(allNodes, viewport, 200)
expect(visibleNodes.length).toBeLessThan(Math.ceil(allNodes.length * 0.2))

// 节点聚合
const clusters = aggregateNodes(mockNodes(150))
expect(clusters.length).toBeLessThan(50) // 150 节点聚合后 < 50 个 cluster

// WebWorker 消息
const result = await computeInWorker('findPath', mockPathRequest)
expect(result.path).toBeDefined()
expect(result.duration).toBeLessThan(100) // < 100ms
```

### 5. 新增/扩展文件
- `vibex-fronted/src/components/dds/canvas/DDSFlow.tsx` — 扩展（添加 nodeExtent + viewport）
- `vibex-fronted/src/hooks/canvas/__tests__/useViewportVirtualization.test.ts` — 新增
- `vibex-fronted/src/utils/canvas/__tests__/nodeAggregator.test.ts` — 新增
- `vibex-fronted/src/workers/__tests__/pathfinding.worker.test.ts` — 新增
- `vibex-fronted/src/workers/pathfinding.worker.ts` — 新增

---

## E4: 画布使用统计分析

### 1. 概述
为用户提供画布使用数据分析：编辑频率、协作时长、最活跃节点。

### 2. User Stories
- 作为 Pro 用户，我希望了解我的画布被编辑的频率
- 作为团队 lead，我希望知道哪些节点最活跃（被编辑最多）
- 作为用户，我希望导出画布使用报告

### 3. DoD (Definition of Done)
- [ ] `canvasAnalyticsStore.ts` 新建: `editingStats` + `topNodes` 状态 + localStorage 持久化
- [ ] `DDSCanvasPage.tsx` 集成: `onNodesChange` 触发数据采集，debounce 5min 批量写入
- [ ] `AnalyticsPanel.tsx` 新建: HistoryPanel Tab5（统计）显示数据
- [ ] 周数据聚合: 显示最近 4 周趋势图（纯 CSS 柱状图）
- [ ] CSV 导出: `exportAnalytics(canvasId)` 生成下载

### 4. expect() 断言（Vitest）
```typescript
// canvasAnalyticsStore.test.ts
await recordEdit('canvas-1', { nodeId: 'node-a', changeType: 'position' })
const stats = getState().editingStats['canvas-1']
expect(stats.totalEdits).toBeGreaterThan(0)

await recordEdit('canvas-1', { nodeId: 'node-a' })
await recordEdit('canvas-1', { nodeId: 'node-a' })
const top = getTopNodes('canvas-1', 3)
expect(top[0].nodeId).toBe('node-a')

const csv = exportAnalytics('canvas-1')
expect(csv).toContain('canvas-1')
```

### 5. 新增/扩展文件
- `vibex-fronted/src/stores/dds/canvasAnalyticsStore.ts` — 新增
- `vibex-fronted/src/components/dds/canvas-history/AnalyticsPanel.tsx` — 新增
- `vibex-fronted/src/stores/dds/__tests__/canvasAnalyticsStore.test.ts` — 新增

---

## E5: 模板评分与收藏增强

### 1. 概述
在 S70-E2 模板市场基础上增加用户评分和收藏功能。

### 2. User Stories
- 作为用户，我希望对模板打 1-5 星，帮助其他人找到高质量模板
- 作为用户，我希望收藏喜欢的模板，在个人收藏夹中快速访问
- 作为用户，我希望按评分排序，找到最好的模板

### 3. DoD (Definition of Done)
- [ ] `templateStore.ts` 扩展: `ratings: Record<templateId, RatingInfo>` + `favoriteTemplateIds: string[]`
- [ ] `rateTemplate(id, score)` / `getAverageScore(id)` / `toggleFavorite(id)` / `getFavorites()`
- [ ] localStorage 持久化: `vibex-template-ratings` + `vibex-favorite-templates`
- [ ] `TemplateMarketplacePanel.tsx` 卡片显示 ⭐ 评分 + ❤️ 收藏按钮
- [ ] 市场排序: 支持 `usageCount` / `score` / `recentlyAdded` 三种排序
- [ ] `TemplateGallery.tsx` 新增"收藏" Tab，过滤显示 favorite 模板

### 4. expect() 断言（Vitest）
```typescript
// templateStore.rating.test.ts
await rateTemplate('tmpl-1', 5, 'user-1')
const info = getState().ratings['tmpl-1']
expect(info.score).toBe(5)
expect(info.count).toBe(1)

await rateTemplate('tmpl-1', 3, 'user-2')
expect(getAverageScore('tmpl-1')).toBeCloseTo(4.0, 1)

await toggleFavorite('tmpl-1', 'user-1')
expect(getFavorites('user-1')).toContain('tmpl-1')

await toggleFavorite('tmpl-1', 'user-1') // 取消收藏
expect(getFavorites('user-1')).not.toContain('tmpl-1')
```

### 5. 新增/扩展文件
- `vibex-fronted/src/stores/dds/templateStore.ts` — 扩展（已有 S70）
- `vibex-fronted/src/components/dds/template/TemplateMarketplacePanel.tsx` — 扩展（S70）
- `vibex-fronted/src/components/dds/template/TemplateGallery.tsx` — 扩展（S70）
- `vibex-fronted/src/stores/dds/__tests__/templateStore.rating.test.ts` — 新增

---

## 跨 Epic 集成表

| 集成点 | 涉及 Epic | 说明 |
|--------|-----------|------|
| 评论快捷键 | E1 + E2 | `Ctrl+Enter` 提交评论 |
| 大画布评论 | E2 + E3 | 大型画布评论输入框使用虚拟化后的节点列表 |
| 模板评论 | E2 + E5 | 用户可对模板发表带 @ 提及的评论 |
| 快捷键禁用 | E1 + E3 | 大型画布时禁用 `Ctrl+Z` 批量动画 |

---

## 技术风险表

| 风险 | 概率 | 影响 | 缓解方案 |
|------|------|------|----------|
| ReactFlow 虚拟化破坏现有功能 | 中 | 高 | 先做基准测试，再小步迭代 |
| WebSocket 评论延迟 >2s | 低 | 中 | 超时降级到 5s 轮询 |
| IndexedDB 写入阻塞主线程 | 低 | 低 | WebWorker 中处理 |
| localStorage 存储配额溢出 | 极低 | 中 | 评分数据量小，无风险 |

---

## 验收标准总览

| Epic | 核心验收 | Vitest 覆盖率 |
|------|----------|---------------|
| E1 | 快捷键自定义保存+读取+冲突检测 | shortcutStore.bindings 100% |
| E2 | WS 消息收发 + 评论实时同步 | commentStore.realtime 100% |
| E3 | 500节点加载<3s + FPS保持60 | performance 100% |
| E4 | Analytics 数据聚合 + CSV 导出 | canvasAnalyticsStore 100% |
| E5 | 评分 CRUD + 收藏过滤 + 排序切换 | templateStore.rating 100% |

