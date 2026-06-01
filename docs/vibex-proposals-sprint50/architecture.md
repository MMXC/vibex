# Sprint 50 架构设计

> **Agent**: coord (architect-review self-impl — architect phantom ghost, running_agents=null)
> **Date**: 2026-06-02
> **Context**: 基于 prd.md (5 Epic × 26 功能点) + analysis.md (技术风险评估)

---

## E1 — 画布全局搜索 (Cmd+K)

### 现有状态
- `canvasDB` (IndexedDB) 已存在，含 `addCanvas/updateCanvas/deleteCanvas`
- `useCanvasStore` 已存在，含 `canvases` map
- Header 有右侧区域，Cmd+K 全局快捷键框架已由 `@xyflow/react` 的 `onKeyDown` 处理

### 需新增
| 文件 | 描述 |
|------|------|
| `src/stores/canvasSearchStore.ts` | Zustand store，`keywordIndex: Map<canvasId, string[]>`，搜索状态 |
| `src/lib/canvas/fullTextSearch.ts` | `fullTextSearch(query): canvasId[]`，查询时走 Map 而非 DB scan |
| `src/hooks/useSearchIndex.ts` | Hook，画布打开时触发索引构建/更新 |
| `src/components/dds/SearchPanel.tsx` | 搜索浮层，Cmd+K 激活 |
| `src/styles/SearchPanel.module.css` | 搜索浮层样式 |
| `tests/stores/canvasSearchStore.test.ts` | vitest 覆盖 |

### 架构决策
1. **索引时机**：画布打开时增量构建，不全量重建
2. **索引字段**：节点 text + 边 label + 画布名（`canvas.name`）
3. **搜索范围**：只搜当前 workspace 的画布
4. **Rank 算法**：O(n) 计数，按匹配次数 + 更新时间排序

### 测试策略
- `canvasSearchStore`: 索引构建/更新/搜索/清空
- `fullTextSearch`: 精确匹配/模糊匹配/空查询

---

## E2 — 画布节点自动布局 (Dagre)

### 现有状态
- `useFlowStore` 已有 `nodes`/`edges` state + `setNodes`/`setEdges`
- `useViewportBoundsStore` 已有 viewport bounds
- `DDSToolbar` 已存在（DDSToolbar.tsx）

### 需新增
| 文件 | 描述 |
|------|------|
| `src/stores/layoutStore.ts` | Zustand store，`layoutMode: 'none' \| 'dagre' \| 'force'` |
| `src/lib/canvas/computeLayout.ts` | Dagre 布局算法封装 |
| `src/hooks/useAutoLayout.ts` | Hook，整合 computeLayout + flowStore |
| `DDSToolbar.tsx` 修改 | 添加"自动排版"按钮 |
| `tests/stores/layoutStore.test.ts` | vitest 覆盖 |

### 架构决策
1. **仅用户主动触发**：不在 `onNodesChange` 自动触发，防止覆盖手动调整
2. **布局前 Undo**：记录当前 positions，布局后可撤销
3. **层级方向**：Dagre TB（top-to-bottom），适合 DDS 树状结构
4. **Cmd+L 快捷键**：注册到 `@xyflow/react` 的 `onKeyDown`

### 测试策略
- `layoutStore`: mode 切换/applyAutoLayout position 验证
- `computeLayout`: 节点层级顺序（父节点 y < 子节点 y）

---

## E3 — 评论实时通知 (WebSocket)

### 现有状态
- `commentStore` 已存在（Sprint49），含 `addComment/deleteComment/resolveComment`
- 后端 `/api/ws` WebSocket handler 已存在，处理 `presence:*` 消息
- `useStreamingAgent` 已处理 SSE；WebSocket 连接在 `wsProvider.ts` 中

### 需新增
| 文件 | 描述 |
|------|------|
| `src/stores/commentStore.ts` 修改 | 添加 `addListener`/`removeListener`/`unreadCount` |
| `src/lib/canvas/wsCommentHandler.ts` | WS handler，订阅 `comment:created`/`comment:resolved` |
| `src/components/dds/CommentBadge.tsx` | 未读红点 Badge |
| `tests/stores/commentStore.test.ts` 修改 | 添加事件订阅测试 |
| `backend/src/handlers/ws.py` 修改 | 添加 `comment:created`/`comment:resolved` 消息 case |

### 架构决策
1. **复用现有 WS 连接**：不新建连接，在现有 `wsProvider` 中添加 handler
2. **消息格式**：`{ type: 'comment:created', canvasId, commentId, author, text }`
3. **未读数持久化**：`commentStore` 在 IndexedDB 持久化 `unreadCount`

### 测试策略
- `commentStore`: addListener 回调触发/removeListener 清理/unreadCount 增减
- `wsCommentHandler`: 消息解析/错误处理

---

## E4 — 模板导入/导出管理

### 现有状态
- `templateStore` 已存在，含 `templates: Template[]`
- `TemplatePanel` 已存在，有模板列表展示
- IndexedDB `templateDB` 已存在（Sprint49）

### 需新增
| 文件 | 描述 |
|------|------|
| `src/stores/templateStore.ts` 修改 | 添加 `templateVersion` 字段 + `exportTemplates`/`importTemplates` actions |
| `src/lib/canvas/templateExport.ts` | `exportTemplates()` → JSON Blob download |
| `src/lib/canvas/templateImport.ts` | `importTemplates(file)` → parse + validate + merge |
| `src/components/dds/TemplateImportDialog.tsx` | 导入对话框，冲突处理 UI |
| `TemplatePanel.tsx` 修改 | 添加 Export All / Import 按钮 |
| `tests/stores/templateStore.test.ts` 修改 | 添加 export/import 测试 |

### 架构决策
1. **格式**：`{ version: '1.0', exportedAt, templates: [...] }` JSON
2. **冲突处理**：弹窗让用户选覆盖/重命名/跳过
3. **JSON Schema 校验**：不合规 reject，错误信息友好
4. **templateVersion**：默认值 '1.0'，未标记视为 v1

### 测试策略
- `exportTemplates`: JSON 结构验证/version 字段
- `importTemplates`: 合规 JSON/不合规 reject/冲突弹窗触发

---

## E5 — Timeline 增强 (缩放+搜索)

### 现有状态
- `snapshotHistoryStore` 已存在（Sprint49），含 `snapshots[]`
- `Timeline.tsx` 组件已存在，有基础缩略图列表
- `DDSTimelinePanel` 已存在（包含 Timeline）

### 需新增
| 文件 | 描述 |
|------|------|
| `src/stores/timelineStore.ts` | Zustand store，`zoomLevel: number`，`searchQuery: string` |
| `src/lib/canvas/snapshotSearch.ts` | `searchSnapshots(query)`，debounce 500ms |
| `src/components/dds/Timeline.tsx` 修改 | 添加 zoom slider + search input + 分组折叠 |
| `src/styles/Timeline.module.css` 修改 | 添加缩放样式 |
| `tests/stores/timelineStore.test.ts` | vitest 覆盖 |
| `tests/lib/canvas/snapshotSearch.test.ts` | vitest 覆盖 |

### 架构决策
1. **缩放实现**：`transform: scale()` 而非改变 minWidth，保持滚动位置
2. **搜索 debounce**：`setSearchQuery` 500ms 后触发过滤
3. **时间分组**：使用 `dayjs.isToday()`/`isYesterday()`，服务端不改动
4. **缩放范围**：min=0.5, max=3, step=0.25

### 测试策略
- `timelineStore`: zoomLevel 设置边界值/searchQuery debounce
- `snapshotSearch`: 过滤结果/空查询返回全部/分组逻辑

---

## 跨 Epic 集成验证计划

| 集成点 | 验证方式 |
|--------|----------|
| E1 搜索触发索引构建 | vitest: 画布打开 → keywordIndex 更新 |
| E2 布局后视图自动刷新 | vitest: setNodes → applyAutoLayout → DOM position 更新 |
| E3 WS comment → UI | mock WS → commentStore → CommentBadge 刷新 |
| E4 导出含 canvasName | vitest: exportTemplates JSON 含 canvasName 字段 |
| E5 Timeline 缩放不抖动 | vitest: setZoomLevel → CSS transform scale 正确 |
