# Sprint 50 PRD — VibeX 画布增强

> **Agent**: coord (pm-review self-impl — PM phantom ghost cycle 5, pm agent Slack polling broken)
> **Date**: 2026-06-02
> **Status**: pm-review done (self-impl), architect-review pending

---

## 执行摘要

Sprint50 基于 Sprint49 交付的画布基础设施（IndexedDB 全链路、Zustand 测试文化、SSE 重试机制、WebSocket presence），聚焦三大体验增强：
1. **画布发现**：全局搜索 + 自动布局
2. **协作通知**：评论实时推送
3. **效率工具**：模板批量管理 + Timeline 增强

**5 Epic × 26 功能点**，Phase1 由 coord 自迭代完成，Phase2 由 dev/tester/reviewer 流水线执行。

---

## Epic-Story 映射

| Epic | 标题 | 优先级 | 核心改动 |
|------|------|--------|----------|
| E1 | 画布全局搜索 (Cmd+K) | P0 | Zustand canvasSearchStore + IndexedDB fullTextSearch + Header 搜索框 |
| E2 | 画布节点自动布局 (Dagre) | P1 | dagre 布局算法 + DDSToolbar 自动排版按钮 + Cmd+L 快捷键 |
| E3 | 评论实时通知 (WebSocket) | P1 | commentStore 事件订阅 + 后端 WS comment:created 消息 + 未读红点 Badge |
| E4 | 模板导入/导出管理 | P1 | exportTemplates/importTemplates + TemplatePanel 按钮 + 冲突处理 |
| E5 | Timeline 增强 (缩放+搜索) | P2 | Timeline 缩放控制 + 快照搜索 + 时间分组折叠 |

---

## 功能分解

### E1 — 画布全局搜索 (P0)

| 功能点 | 描述 |
|--------|------|
| E1.1 | `canvasSearchStore` — Zustand store，维护 keywordIndex: Map<canvasId, string[]> |
| E1.2 | IndexedDB canvasDB 添加 `fullTextSearch()` 方法（节点 text + 边 label + 画布名） |
| E1.3 | Header 右侧搜索框，Cmd+K 快捷键激活 |
| E1.4 | 搜索结果 rank（匹配次数、更新时间） |
| E1.5 | vitest 覆盖 canvasSearchStore CRUD + 索引逻辑 |

### E2 — 画布节点自动布局 (P1)

| 功能点 | 描述 |
|--------|------|
| E2.1 | 引入 `@types/dagre`，`layoutGraph()` 按层级排列节点 |
| E2.2 | `layoutStore` — Zustand store，layoutMode: 'none' \| 'dagre' \| 'force' |
| E2.3 | `applyAutoLayout()` 调用 computeLayout 并更新节点 position |
| E2.4 | DDSToolbar 添加"自动排版"按钮 |
| E2.5 | Cmd+L 快捷键触发自动布局 |
| E2.6 | vitest 覆盖 layoutStore + dagre 布局计算 |

### E3 — 评论实时通知 (P1)

| 功能点 | 描述 |
|--------|------|
| E3.1 | `commentStore` 添加 addListener/removeListener 订阅机制 |
| E3.2 | 后端 `/api/ws` 添加 `comment:created` / `comment:resolved` 消息类型 |
| E3.3 | 前端 WebSocket handler 订阅评论事件 → UI 自动刷新 |
| E3.4 | 评论图标显示未读数红点 Badge |
| E3.5 | vitest 覆盖 commentStore 事件订阅 + WebSocket handler |

### E4 — 模板导入/导出管理 (P1)

| 功能点 | 描述 |
|--------|------|
| E4.1 | `exportTemplates()` — 导出所有模板为 `{ version, templates: [...] }` JSON |
| E4.2 | `importTemplates(file)` — 导入 JSON，支持覆盖/跳过/重命名冲突 |
| E4.3 | TemplatePanel 添加 Export All / Import 按钮 |
| E4.4 | 模板版本化 — `templateStore` 添加 `templateVersion` 字段 |
| E4.5 | vitest 覆盖 export/import 序列化 + 冲突处理 |

### E5 — Timeline 增强 (P2)

| 功能点 | 描述 |
|--------|------|
| E5.1 | Timeline 缩放控制（minWidth=80px → maxWidth=240px） |
| E5.2 | Timeline 快照搜索 — `snapshotHistoryStore.searchSnapshots(query)` |
| E5.3 | 快照悬停预览（JSON 内容片段） |
| E5.4 | 快照时间分组（今天/昨天/本周/更早） |
| E5.5 | vitest 覆盖缩放 + 搜索过滤 + 分组折叠 |

---

## DoD（Definition of Done）

通用 DoD（每 Epic 必须满足）：
- [ ] 所有功能点对应的 TypeScript 代码已实现
- [ ] vitest 测试覆盖率 ≥80%（新增 store/hook 必须有测试）
- [ ] `src/dds/` 目录内的 dds 组件已测试
- [ ] IndexedDB 操作有错误处理
- [ ] i18n key 已注册（中文/英文）
- [ ] 跨 Epic 集成点已验证（如 E3 的 WebSocket + commentStore）

---

## 验收标准（expect() 断言示例）

```typescript
// E1 — canvasSearchStore
const store = useCanvasSearchStore.getState();
expect(store.keywordIndex.size).toBeGreaterThan(0);

// E2 — layoutStore
const store = useLayoutStore.getState();
act(() => { store.applyAutoLayout(graph); });
expect(graph.nodes[0].position.y).toBeLessThan(graph.nodes[1].position.y);

// E3 — commentStore event subscription
const listener = vi.fn();
store.addListener(listener);
act(() => { store.addComment({...}); });
expect(listener).toHaveBeenCalled();

// E4 — template export/import
const json = store.exportTemplates();
expect(json.version).toBe('1.0');
expect(json.templates.length).toBeGreaterThan(0);

// E5 — Timeline zoom
const store = useTimelineStore.getState();
act(() => { store.setZoomLevel(2); });
expect(store.zoomLevel).toBe(2);
```

---

## 技术约束

- 前端：`src/components/dds/`（dds 组件）、`src/stores/dds/`（dds stores）
- 后端：`backend/` — WebSocket handler 在 `backend/handlers/ws.py`
- 测试：`npx vitest run src/dds/`，使用 `vi.useFakeTimers()` 测试定时器
- 布局库：`npm install dagre @types/dagre`（E2 专用，不污染其他 Epic）
