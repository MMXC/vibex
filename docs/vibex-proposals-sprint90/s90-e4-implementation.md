# S90-E4: Canvas Annotation Layer — Implementation Plan

## Background

Sprint90 E4 — 最后 Epic。完成画布自由批注层（区别于现有 node 关联的评论系统）：
- 用户在画布任意位置放置文字批注
- 批注跟随画布缩放/平移（绝对定位 + CSS transform 继承）
- 不同用户不同颜色
- 解决/删除

## 现状（INV-0 已验证）

### 已有基础设施
- `CanvasPage.tsx` (line 800): `gridRef` 已绑定，CSS 变量 `--canvas-pan-x/y/zoom` 应用 transform
- `presenceStore.ts` (实际位置 `@/lib/collaboration/presenceStore`) — WS 实时协作参考
- `commentStore.ts` (Zustand + IndexedDB + WS broadcast) — CRUD + persist 模式参考
- `comments/route.ts` — D1 CRUD API 模式参考（注意 nudge 路径写错）
- `getAuthUserFromRequest` — auth 返回 `{ success, user }`（在 `@/lib/authFromGateway`）

### 现有错误路径澄清（nudge 与实际差异）
| nudge 写的 | 实际 | 处理 |
|------------|------|------|
| `@/stores/presenceStore.ts` | `@/lib/collaboration/presenceStore.ts` | 用真实路径 |
| `safeError from '@/lib/logger/safeError'` | 转发器；真实源是 `@/lib/log-sanitizer` | comments 路由用 `@/lib/log-sanitizer`，对齐 |
| `DDSCanvasPage` | `CanvasPage` (含 `CanvasPageClient` 包裹) | 用真实组件 |

## 方案设计

### 数据模型（D1 schema）
```sql
CREATE TABLE annotations (
  id TEXT PRIMARY KEY,
  canvas_id TEXT NOT NULL,
  content TEXT NOT NULL,
  x REAL NOT NULL,
  y REAL NOT NULL,
  type TEXT NOT NULL DEFAULT 'point',
  author_id TEXT NOT NULL,
  author_name TEXT,
  color TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX idx_annotations_canvas ON annotations(canvas_id);
```

### 渲染策略（关键决策）
**AnnotationLayer 放在 `gridRef` 内部**：
- 因为 gridRef 的 CSS `transform: scale(var(--canvas-zoom))` 包含其所有子元素
- 这样不需要自己实现缩放逻辑，CSS 自动同步
- 批注 x/y 是画布逻辑坐标（与 pan/zoom 解耦）

### Store 设计（Zustand + IndexedDB）
- 字段：`annotations[]`、`pendingSync[]`（离线队列占位 — 暂不实现）
- 操作：`addAnnotation`、`updateAnnotation`、`resolveAnnotation`、`deleteAnnotation`
- 持久化：IndexedDB（类似 commentStore）
- WS 同步：本 epic 范围外（nudge 提到但没有强制；先做 HTTP CRUD + WS 留给后续）

### 测试策略
- Store 测试：CRUD + IndexedDB 读写（mock idb）
- Component 测试：渲染 + 点击添加 + 解决/删除 + 颜色应用
- 用 `vi.hoisted()` 而非 `vi.mock` + `vi.fn()`（nudge 禁止事项）

## 实施步骤

1. Backend migration
2. Backend API (list + create + update + delete)
3. Frontend store
4. Frontend AnnotationLayer + CSS
5. Frontend CanvasPage 集成
6. Tests (store + component)
7. Verify: vitest + tsc
8. CHANGELOG
9. Commit

## 验收对照

| AC | 验证方式 |
|----|----------|
| AC1 添加文字批注 | Component test: 点击 → 显示输入框 → 提交后渲染批注 |
| AC2 跟随缩放/平移 | CSS 继承 gridRef 的 transform，单元测试验证 AnnotationLayer 父级继承 |
| AC3 用户颜色不同 | authorColor 计算：hash(userId) → HSL |
| AC4 解决/删除 | Component test: resolve 按钮 → 划线样式；delete → 消失 |

## 回滚

新分支独立，cherry-pick 前可丢弃。如已合并：`git revert <commit>`。

## 风险

- CanvasPage 集成点：gridRef 内部已有复杂 children 树，注入需小心（用绝对定位 + pointer-events 选择性）
- vitest + jsdom 对 CSS 变量支持有限，transform 同步测试用 snapshot/属性断言代替