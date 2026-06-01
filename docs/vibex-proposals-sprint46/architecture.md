# Sprint 46 架构设计

> **Agent**: coord (self-implement)
> **日期**: 2026-05-31
> **依据**: analysis.md + prd.md

---

## 架构决策

### AD-1: AI Session 搜索 — IndexedDB 全文索引

**选项**:
- A: 每个 session 写入时拼接 `searchableText`（title + 首条消息摘要），前端 IndexedDB 查询做子串匹配
- B: 引入 Fuse.js 做模糊搜索（增加包体积 ~15KB）
- C: 后端全文索引（需要网络请求）

**决策**: A — 纯前端实现，零网络开销，IndexedDB query 足够快（< 100ms 对 < 100 个 session）

**实现**:
- IndexedDB `sessions` 表新增 `searchableText: string` 字段
- session 创建时写入：`title + ' ' + firstUserMessage`
- 前端用 `sessions.filter(s => s.searchableText.includes(query))`
- 高亮：用 `mark` HTML 标签包裹匹配词

---

### AD-2: 键盘快捷键 — 动态注册表模式

**现状确认**: `useKeyboardShortcuts.ts` (477行) 已实现基础注册表 + `shortcutStore` 动态加载。`ShortcutPanel.tsx` 已存在。i18n `shortcuts` namespace 已建立。

**缺失项**:
- `Cmd+S` → `saveCanvas()` 尚未实现
- `Cmd+K` 当前绑定到搜索面板，需扩展支持 AI 面板（根据上下文）
- 冲突检测：`shortcutStore.add()` 无 `console.warn` 冲突检测

**决策**: 扩展现有 hook，不重写
- 新增 `onSaveCanvas` callback option + 对应 key handler
- 新增 `onOpenAIPanel` callback option（`Cmd+K` 在非搜索上下文时触发）
- `shortcutStore.add()` 增冲突检测：遍历现有 shortcuts，若 key 冲突则 `console.warn`

---

### AD-3: 节点复制/粘贴 — localStorage clipboard

**选项**:
- A: localStorage clipboard（TTL 5分钟，简单但跨 tab 不共享）
- B: sessionStorage（同 A but tab 隔离）
- C: IndexedDB clipboard store（持久但复杂）

**决策**: A — localStorage clipboard 满足 5 分钟 TTL 需求，无需跨 tab 共享

**实现**:
- `clipboardStore` (Zustand) 封装 localStorage 操作
- `copyNodes(nodeIds)`: 序列化 → `localStorage.setItem('dds-clipboard', JSON.stringify(nodes))` + TTL
- `pasteNodes(targetCanvasId)`: 读取 → 反序列化 → 生成新 nodeId → 添加到 target canvasStore
- `Cmd+C`/`Cmd+V` 在节点选中状态由 `useKeyboardShortcuts` 处理

---

### AD-4: 多画布管理面板 — 新路由

**现状确认**: `canvasMetaStore` 不存在，IndexedDB 无 canvas 元数据表。

**决策**: 新建 `canvasMetaStore` + `canvases/page.tsx` 路由
- IndexedDB `canvasMeta` 表：`{ id, name, updatedAt, createdAt, thumbnail? }`
- Zustand `canvasMetaStore` 封装 CRUD
- `canvases/page.tsx` 列表页（SSR 禁用，CSR）

---

## 风险表

| 风险 | 概率 | 影响 | 缓解 |
|------|------|------|------|
| 搜索匹配低精度 | 低 | 低 | 拼接更多 session 上下文 |
| 快捷键与浏览器默认冲突 | 中 | 中 | `e.preventDefault()` 拦截 |
| localStorage clipboard 被隐私模式清除 | 低 | 低 | 降级：显示「剪贴板已过期」 |
| canvasMetaStore 迁移破坏现有 canvas | 低 | 高 | 不修改现有 canvas 数据，只增新表 |

---

## 技术栈提醒

- **状态管理**: Zustand (`canvasStore`, `agentStore`, `shortcutStore` 新增)
- **持久化**: IndexedDB (session searchableText, canvasMeta) + localStorage (clipboard)
- **测试**: Vitest (unit) + E2E spec (`tests/e2e/ai-session-search.spec.ts`)
- **i18n**: `useTranslations('ai')` (session 搜索) + `useTranslations('shortcuts')` (快捷键面板)
- **路由**: `src/app/[locale]/canvases/page.tsx` (新增)
- **不走**: `[locale]/ai/` 路由（Sprint40 验证不存在，不创建）

---

## 组件清单

| 组件 | 文件路径 | 状态 | 说明 |
|------|---------|------|------|
| useKeyboardShortcuts | `src/hooks/useKeyboardShortcuts.ts` | 存在，需扩展 | 477行，需加 Cmd+S |
| ShortcutPanel | `src/components/canvas/features/ShortcutPanel.tsx` | 存在 | 已有完整快捷键列表 |
| AgentSessions | `src/components/agent/AgentSessions.tsx` | 需增强 | 需加搜索框 |
| clipboardStore | `src/stores/clipboardStore.ts` | 新建 | localStorage clipboard |
| canvasMetaStore | `src/stores/canvasMetaStore.ts` | 新建 | 多画布元数据 |
| canvases/page | `src/app/[locale]/canvases/page.tsx` | 新建 | 画布列表页 |
| shortcuts i18n | `src/i18n/messages/{en,zh}.json` | 已有3key，需补充 | 补充描述 key |

