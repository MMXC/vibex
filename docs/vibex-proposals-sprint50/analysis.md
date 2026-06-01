# Sprint 50 技术分析

> **Agent**: coord (pm-review self-impl)
> **Date**: 2026-06-02

---

## P001 — 画布全局搜索 技术风险

| 风险 | 等级 | 缓解方案 |
|------|------|----------|
| IndexedDB LIKE 查询性能（50+ 画布 × 100+ 节点）| M | 先索引写入时构建 Map<string, canvasId[]>，查询走 Map 而非 DB scan |
| Cmd+K 与其他快捷键冲突 | L | @xyflow/react 的 Keyboard key handler 注册顺序优先 |
| 搜索结果 rank 算法复杂度 | L | 简单计数排序：O(n)，无需 ML |

**实现路径**: `sessionStore` 不改 → 新建 `canvasSearchStore` → 增量索引 → 搜索框 UI

---

## P002 — 画布节点自动布局 技术风险

| 风险 | 等级 | 缓解方案 |
|------|------|----------|
| dagre 布局结果不符合用户预期（层次颠倒） | M | 提供 `force` 备选模式（力导向），用户可切换 |
| 自动布局触发时机（每次节点变更都触发？） | H | 仅用户主动点击"自动排版"或 Cmd+L，不在 onNodesChange 自动触发 |
| 布局结果覆盖用户手动调整 | M | 布局前提示用户确认；提供 Undo |

**实现路径**: `npm install dagre @types/dagre` → `layoutStore` → `computeLayout(graph)` → 更新 position

---

## P003 — 评论实时通知 技术风险

| 风险 | 等级 | 缓解方案 |
|------|------|----------|
| WebSocket comment:created 与现有 presence 消息复用同一 WS 连接 | M | 后端 WS handler 添加消息类型分支，不破坏现有逻辑 |
| 未读数 Badge 跨 session 持久化 | L | `commentStore` 在 IndexedDB 持久化 `unreadCount` |
| 评论通知与 @mention 通知合并？ | L | v1 独立，后续迭代 |

**实现路径**: 后端 `/api/ws` → 添加 `comment:created` case → 前端 WebSocket handler → commentStore action → UI 刷新

---

## P004 — 模板导入/导出 技术风险

| 风险 | 等级 | 缓解方案 |
|------|------|----------|
| 导入文件格式校验（恶意 JSON） | H | JSON Schema 校验 version + templates 字段，不合规则 reject |
| 冲突模板处理（同名 ID） | M | 弹窗让用户选：覆盖 / 重命名 / 跳过 |
| 模板版本化兼容（v1 模板导入 v2 store） | M | `templateVersion` 字段默认值 '1.0'，未标记视为 v1 |

**实现路径**: `exportTemplates()` → JSON Blob → download → `importTemplates(file)` → parse + validate → merge

---

## P005 — Timeline 增强 技术风险

| 风险 | 等级 | 缓解方案 |
|------|------|----------|
| Timeline 组件横向滚动 + 缩放同时存在导致布局抖动 | M | 缩放通过 transform: scale() 而非改变 minWidth，保持滚动位置 |
| 快照搜索在 100+ snapshot 时实时过滤卡顿 | M | debounce 500ms 后过滤，UI 先显示 spinner |
| 时间分组「今天/昨天/本周」跨时区 | L | 使用 dayjs 的 `isToday()` / `isYesterday()` |

**实现路径**: Timeline 组件添加 zoom state → 缩放通过 CSS transform → 搜索 debounced filter → 分组用 dayjs

---

## Epic 间集成点

| 集成点 | 涉及 Epic | 验证方式 |
|--------|-----------|----------|
| canvasSearchStore 索引触发 | E1（搜索） | vitest 验证索引在画布打开时构建 |
| auto-layout 结果刷新 | E2（布局） | vitest 验证 position 更新后视图正确 |
| commentStore WS 事件 | E3（通知） | 端到端测试（mock WS） |
| exportTemplates 覆盖画布名 | E4（模板） | 验证导出 JSON 含 canvasName |
| Timeline 缩放 | E5（Timeline） | vitest 验证 transform scale 正确 |
