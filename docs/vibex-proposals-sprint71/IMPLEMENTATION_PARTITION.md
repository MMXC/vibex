# VibeX Sprint71 Implementation Partition

**Project**: vibex-proposals-sprint71
**Date**: 2026-06-07
**Self-impl**: All 4 Phase1 files (analyze-requirements phantom ghost)

---

## E1: 键盘快捷键可配置化

### DoD Checklist
- [ ] `src/stores/shortcutStore.ts` — 扩展 `parseKeyboardEvent` + `detectConflict` (store 已有 addBinding/removeBinding/importBindings/exportBindings)
- [ ] `src/lib/keyboard/shortcutManager.ts` — 扩展 `detectConflict` 支持 `ShortcutBinding` 格式
- [ ] `src/components/dds/shortcuts/ShortcutSettingsPanel.tsx` — 新增"自定义" Tab (Tab4)
- [ ] `src/components/dds/shortcuts/ShortcutEditor.tsx` — 快捷键编辑弹窗（reuse existing）
- [ ] `src/components/dds/shortcuts/__tests__/ShortcutSettingsPanel.e1.test.tsx` — 新增
- [ ] `src/stores/__tests__/shortcutStore.e1.test.ts` — 新增

### 新增/扩展文件
| 文件 | 操作 | 路径 |
|------|------|------|
| `shortcutStore.e1.test.ts` | 新增 | `src/stores/__tests__/` |
| `ShortcutSettingsPanel.e1.test.tsx` | 新增 | `src/components/dds/shortcuts/__tests__/` |

### expect() 断言
```typescript
// E1 核心: 用户自定义绑定持久化
const store = createShortcutStore()
await store.addBinding('save', { key: 'ctrl+shift+s', action: 'save' })
expect(store.getState().bindings['save']).toEqual({ key: 'ctrl+shift+s', action: 'save' })

// E1: 冲突检测
expect(store.detectConflict({ key: 'ctrl+s', action: 'save' })).toBe(true)
```

---

## E2: 实时协作评论系统

### DoD Checklist
- [ ] `src/stores/dds/commentStore.ts` — 扩展 `subscribeToCanvas(canvasId)` + `broadcastComment()`
- [ ] `src/lib/canvas/wsCommentHandler.ts` — 扩展 `comment:reaction` / `comment:delete` 消息类型
- [ ] `src/components/dds/comments/CommentThread.tsx` — 监听 WS 事件，实时追加评论
- [ ] `src/components/dds/comments/MentionInput.tsx` — 验证存在性并集成（复用 S51）
- [ ] `src/components/dds/comments/CommentThread.tsx` — Emoji 反应按钮（👍❤️😂）
- [ ] `src/stores/dds/__tests__/commentStore.realtime.test.ts` — 新增

### 新增/扩展文件
| 文件 | 操作 | 路径 |
|------|------|------|
| `commentStore.realtime.test.ts` | 新增 | `src/stores/dds/__tests__/` |

### expect() 断言
```typescript
// E2 核心: WS 消息触发评论添加
const mockWS = { send: vi.fn(), on: vi.fn() }
await subscribeToCanvas('canvas-1', mockWS)
triggerWSMessage(mockWS, { type: 'comment:add', comment: { id: 'c1', text: 'hello' } })
expect(getState().comments['canvas-1']).toContainEqual(expect.objectContaining({ id: 'c1' }))

// E2: reaction
await addReaction('comment-1', 'thumbsup', 'user-2')
expect(getState().reactions['comment-1']).toContainEqual(expect.objectContaining({ type: 'thumbsup' }))
```

---

## E3: 大型画布性能优化

### DoD Checklist
- [ ] `src/components/dds/canvas/DDSFlow.tsx` — 添加 `nodeExtent` 限制 + 视口过滤
- [ ] `src/hooks/canvas/__tests__/useViewportVirtualization.test.ts` — 新增
- [ ] `src/utils/canvas/__tests__/nodeAggregator.test.ts` — 新增
- [ ] `src/workers/pathfinding.worker.ts` — 新建 WebWorker
- [ ] `src/workers/__tests__/pathfinding.worker.test.ts` — 新增
- [ ] `src/components/dds/canvas-history/BranchManager.tsx` — 快照懒加载（初始 50 条）
- [ ] 性能基准测试

### 新增/扩展文件
| 文件 | 操作 | 路径 |
|------|------|------|
| `useViewportVirtualization.ts` | 新增 | `src/hooks/canvas/` |
| `useViewportVirtualization.test.ts` | 新增 | `src/hooks/canvas/__tests__/` |
| `nodeAggregator.ts` | 新增 | `src/utils/canvas/` |
| `nodeAggregator.test.ts` | 新增 | `src/utils/canvas/__tests__/` |
| `pathfinding.worker.ts` | 新增 | `src/workers/` |
| `pathfinding.worker.test.ts` | 新增 | `src/workers/__tests__/` |

### expect() 断言
```typescript
// E3: 视口虚拟化 — 过滤后节点数 < 总数的 20%
const visible = filterNodesByViewport(allNodes, viewport, 200)
expect(visible.length).toBeLessThan(Math.ceil(allNodes.length * 0.2))

// E3: 节点聚合
const clusters = aggregateNodes(mockNodes(150))
expect(clusters.length).toBeLessThan(50)

// E3: WebWorker
const result = await computeInWorker('findPath', mockRequest)
expect(result.path).toBeDefined()
expect(result.duration).toBeLessThan(100)
```

---

## E4: 画布使用统计分析

### DoD Checklist
- [ ] `src/stores/dds/canvasAnalyticsStore.ts` — 新建 Store (editingStats + topNodes + localStorage)
- [ ] `src/components/dds/canvas-history/AnalyticsPanel.tsx` — 新建组件（HistoryPanel Tab5）
- [ ] `src/components/dds/canvas-history/AnalyticsPanel.module.css` — 新建样式
- [ ] `src/components/dds/canvas-history/__tests__/AnalyticsPanel.test.tsx` — 新增
- [ ] `src/stores/dds/__tests__/canvasAnalyticsStore.test.ts` — 新增
- [ ] `DDSCanvasPage.tsx` — 集成 onNodesChange 数据采集（debounce 5min）

### 新增文件
| 文件 | 操作 | 路径 |
|------|------|------|
| `canvasAnalyticsStore.ts` | 新建 | `src/stores/dds/` |
| `canvasAnalyticsStore.test.ts` | 新建 | `src/stores/dds/__tests__/` |
| `AnalyticsPanel.tsx` | 新建 | `src/components/dds/canvas-history/` |
| `AnalyticsPanel.module.css` | 新建 | `src/components/dds/canvas-history/` |
| `AnalyticsPanel.test.tsx` | 新建 | `src/components/dds/canvas-history/__tests__/` |

### expect() 断言
```typescript
// E4 核心: 数据采集 + 聚合
await recordEdit('canvas-1', { nodeId: 'node-a', type: 'position' })
const stats = getState().editingStats['canvas-1']
expect(stats.totalEdits).toBeGreaterThan(0)

const top = getTopNodes('canvas-1', 3)
expect(top[0].nodeId).toBe('node-a') // node-a 被编辑最多

const csv = exportAnalytics('canvas-1')
expect(csv).toContain('canvas-1').toContain('nodeId')
```

---

## E5: 模板评分与收藏增强

### DoD Checklist
- [ ] `src/stores/templateStore.ts` — 扩展 `ratings` 利用 + 新增 `favoriteTemplateIds` + `toggleFavorite()`
- [ ] `src/components/dds/templates/TemplateMarketplacePanel.tsx` — 评分星标 + 收藏按钮 + 排序选择器
- [ ] `src/components/dds/templates/TemplateGallery.tsx` — "收藏" Tab
- [ ] `src/components/dds/templates/__tests__/TemplateMarketplacePanel.e5.test.tsx` — 新增
- [ ] `src/stores/__tests__/templateStore.rating.test.ts` — 新增

### 新增/扩展文件
| 文件 | 操作 | 路径 |
|------|------|------|
| `templateStore.rating.test.ts` | 新增 | `src/stores/__tests__/` |
| `TemplateMarketplacePanel.e5.test.tsx` | 新增 | `src/components/dds/templates/__tests__/` |

### expect() 断言
```typescript
// E5 核心: 评分
await rateTemplate('tmpl-1', 5, 'user-1')
const info = getState().ratings['tmpl-1']
expect(info.scores).toContain(5)

await rateTemplate('tmpl-1', 3, 'user-2')
expect(getAverageScore('tmpl-1')).toBeCloseTo(4.0, 1)

// E5: 收藏
await toggleFavorite('tmpl-1', 'user-1')
expect(getFavorites('user-1')).toContain('tmpl-1')

// E5: 排序
const sorted = getSortedTemplates('score')
expect(sorted[0].averageScore).toBeGreaterThanOrEqual(sorted[1].averageScore)
```

---

## 测试命令

```bash
# E1
npx vitest run shortcutStore.e1 --reporter=verbose
npx vitest run ShortcutSettingsPanel.e1 --reporter=verbose

# E2
npx vitest run commentStore.realtime --reporter=verbose

# E3
npx vitest run useViewportVirtualization --reporter=verbose
npx vitest run nodeAggregator --reporter=verbose
npx vitest run pathfinding.worker --reporter=verbose

# E4
npx vitest run canvasAnalyticsStore --reporter=verbose
npx vitest run AnalyticsPanel --reporter=verbose

# E5
npx vitest run templateStore.rating --reporter=verbose
npx vitest run TemplateMarketplacePanel.e5 --reporter=verbose
```
