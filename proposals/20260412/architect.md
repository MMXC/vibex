# Architect 提案 — 2026-04-12

**Agent**: architect
**日期**: 2026-04-12
**产出**: proposals/20260412/architect.md

---

## 1. 近期架构发现

### 2026-04-07 完成分析

| 任务 | 架构发现 | 影响 |
|------|----------|------|
| vibex-proposals-20260411-page-structure | pageName 可选字段 + JSON 预览独立弹窗 | ComponentTree.tsx |
| vibex-canvaslogger-fix-20260407 | canvasLogger 需 null safety 检查 | canvasLogger |
| vibex-backend-p0-20260405 | SSE 流超时 + 内存限流跨实例 | Hono gateway |
| vibex-backend-deploy-stability | Cloudflare Workers 环境检测 | PrismaClient |

---

## 2. 提案列表

| ID | 类别 | 标题 | 影响范围 | 优先级 |
|----|------|------|----------|--------|
| A-P1-1 | type-safety | packages/types API Schema 深化落地 | packages/types | P1 |
| A-P1-2 | reliability | Canvas 三栏 Error Boundary 补全 | ErrorBoundary | P1 |
| A-P1-3 | deployment | API v0→v1 迁移收尾 | /api/v0/* | P1 |
| A-P2-1 | type-safety | frontend types ↔ packages/types 对齐 | types.ts | P2 |
| A-P2-2 | performance | groupByFlowId 记忆化优化 | ComponentTree | P2 |
| A-P2-3 | reliability | sessionStore localStorage 容量警戒 | sessionStore | P2 |

---

## 3. 提案详情

### A-P1-1: packages/types API Schema 深化落地

**问题**: `packages/types/src/api/` 已定义 canvas.ts 和 canvasSchema.ts，但 backend 和 frontend 并未完全引用这些共享类型。各端仍独立维护 API 请求/响应类型，存在不一致风险。

**现状**:
- `packages/types/src/api/canvasSchema.ts` — Zod schema 定义
- `packages/types/src/api/canvas.ts` — TypeScript 类型
- backend: `/api/v1/canvas/...` 路由直接定义类型
- frontend: `fetch()` 返回 `unknown` 后手动断言

**建议**:
```typescript
// backend: /api/v1/canvas/health/route.ts
import { CanvasHealthResponse, canvasHealthResponseSchema } from '@vibex/types';

export async function GET() {
  const response: CanvasHealthResponse = { status: 'ok', connections: 0 };
  return Response.json(canvasHealthResponseSchema.parse(response));
}

// frontend: useCanvasPreview.ts
import { CanvasHealthResponse } from '@vibex/types';

const res = await fetch('/api/v1/canvas/health');
const data: CanvasHealthResponse = await res.json(); // 类型安全
```

**工时**: 2h
**风险**: 低（增量引用，不改现有逻辑）

---

### A-P1-2: Canvas 三栏 Error Boundary 补全

**问题**: 现有 `JsonRenderErrorBoundary` 只保护 JSON 渲染区域，ComponentTree / FlowTree / ContextTree 各栏独立渲染，若某栏崩溃会导致整页白屏。

**现状**:
```
App
└── AppErrorBoundary (全局兜底)
    └── CanvasPage
        ├── ContextTreePanel ── 无独立 ErrorBoundary
        ├── FlowTreePanel ──── 无独立 ErrorBoundary
        ├── ComponentTreePanel ┄ JsonRenderErrorBoundary (仅 JSON 渲染)
        └── CanvasEditor
            └── JsonRenderErrorBoundary
```

**建议**:
```tsx
// 在每个 TreePanel 外部包裹 ErrorBoundary
function ComponentTreePanel() {
  return (
    <ErrorBoundary
      fallback={(error, reset) => (
        <div className={styles.panelError}>
          <p>组件树加载失败</p>
          <button onClick={reset}>重试</button>
        </div>
      )}
      onError={(error) => canvasLogger.error('[ComponentTreePanel]', error)}
    >
      <ComponentTree />
    </ErrorBoundary>
  );
}
```

**工时**: 1h
**风险**: 低（隔离现有组件，不改核心逻辑）

---

### A-P1-3: API v0→v1 迁移收尾

**问题**: 2026-04-11 架构决策要求 v0 路由添加 Deprecation Header，但部分旧路由（`/api/projects`, `/api/plan/analyze`）尚未迁移到 `/api/v1/`。

**现状**:
| 路由 | 版本 | 状态 |
|------|------|------|
| `/api/projects` | v0 | 需迁移 |
| `/api/projects/[id]` | v0 | 需迁移 |
| `/api/projects/from-template` | v0 | 需迁移 |
| `/api/plan/analyze` | v0 | 需迁移 |
| `/api/v1/*` | v1 | 完整 |

**建议**:
1. 将 `/api/projects` → `/api/v1/projects`（同文件迁移）
2. 将 `/api/plan/analyze` → `/api/v1/plan/analyze`
3. v0 路由添加 `Deprecation: true` + `Sunset: 2026-12-31`
4. 迁移后 frontend 统一使用 v1

**工时**: 2h
**风险**: 中（需同步更新 frontend 调用方）

---

### A-P2-1: frontend types ↔ packages/types 对齐

**问题**: `vibex-fronted/src/lib/canvas/types.ts` 与 `packages/types/src/` 存在重复类型定义，ComponentNode / BusinessFlowNode / BoundedContextNode 在两边都有定义，长久会导致不一致。

**建议**:
```typescript
// packages/types/src/store.ts
export interface ComponentNode {
  nodeId: string;
  flowId: string;
  name: string;
  type: ComponentType;
  // ...
  pageName?: string; // E1-F1 新增
}

// frontend: 改为引用
import type { ComponentNode } from '@vibex/types';

// vibex-fronted/src/lib/canvas/types.ts
// 只保留 frontend-only 的扩展，不重复定义核心类型
export type { ComponentNode } from '@vibex/types';
```

**工时**: 3h
**风险**: 中（涉及多处 import 变更，需全面回归测试）

---

### A-P2-2: groupByFlowId 记忆化优化

**问题**: `ComponentTree` 组件中 `useMemo(() => groupByFlowId(...), [...])` 已存在，但 `getPageLabel` 函数内部 4 层 fallback 匹配（精确→前缀→名称模糊→兜底）在节点数量多时有性能隐患。

**现状**:
```typescript
// getPageLabel 每 call 都执行 3 次 find()
export function getPageLabel(flowId, flowNodes) {
  const exact = flowNodes.find(f => f.nodeId === flowId);        // O(n)
  const prefix = flowNodes.find(f => flowId.startsWith(...));     // O(n)
  const fuzzy = flowNodes.find(f => normalizeMatch(...));        // O(n)
}
```

**建议**:
```typescript
// 创建 flowNode 索引缓存（组件级别 memoize）
const flowNodeIndex = useMemo(() => {
  const byNodeId = new Map(flowNodes.map(f => [f.nodeId, f]));
  const byPrefix = new Map<string, BusinessFlowNode[]>();
  const byNameNorm = new Map<string, BusinessFlowNode[]>();
  
  flowNodes.forEach(f => {
    // prefix 索引
    for (let i = 1; i < f.nodeId.length; i++) {
      const prefix = f.nodeId.slice(0, i);
      if (!byPrefix.has(prefix)) byPrefix.set(prefix, []);
      byPrefix.get(prefix)!.push(f);
    }
    // 名称标准化索引
    const norm = f.name.toLowerCase().replace(/[\s\-_]/g, '');
    if (!byNameNorm.has(norm)) byNameNorm.set(norm, []);
    byNameNorm.get(norm)!.push(f);
  });
  
  return { byNodeId, byPrefix, byNameNorm };
}, [flowNodes]);

// getPageLabel 查索引 O(1) 替代 O(n) find
```

**工时**: 1.5h
**风险**: 低（向后兼容，新增索引层）

---

### A-P2-3: sessionStore localStorage 容量警戒

**问题**: `sessionStore` 使用 `persist` 中间件（Zustand）将整个状态序列化到 localStorage。messages 数组和 prototypeQueue 随使用时间线性增长，可能触发 localStorage 5MB 上限。

**现状**:
```typescript
// sessionStore.ts
persist(
  (set, get) => ({
    messages: MessageItem[];      // 持续增长
    prototypeQueue: PrototypePage[]; // 持续增长
    // ...
  }),
  { name: 'vibex-session' }  // 无大小限制
)
```

**建议**:
```typescript
// 方案: sliding window + 压缩
const MAX_MESSAGES = 500;
const MAX_QUEUE = 50;

const storageMiddleware = (config) => (set, get, store) => {
  const persistedStorage = {
    getItem: (name) => {
      const raw = localStorage.getItem(name);
      if (!raw) return null;
      // 大小检查
      if (raw.length > 4_000_000) {
        console.warn('[sessionStore] Approaching localStorage limit, truncating...');
        const state = JSON.parse(raw);
        if (state.state?.messages?.length > MAX_MESSAGES) {
          state.state.messages = state.state.messages.slice(-MAX_MESSAGES);
        }
        return JSON.stringify(state);
      }
      return raw;
    },
    setItem: () => {},
    removeItem: () => {},
  };
  return persist(config, { storage: persistedStorage })(set, get, store);
};
```

**工时**: 1h
**风险**: 低（添加保护层，不改变现有行为）

---

## 4. 风险评估

| ID | 风险 | 概率 | 影响 | 缓解 |
|----|------|------|------|------|
| R1 | packages/types 变更导致 backend/frontend 同时 break | 低 | 高 | 先改无引用处，逐步替换 |
| R2 | ErrorBoundary 嵌套过深导致调试困难 | 低 | 低 | 仅包裹独立面板，不改子组件 |
| R3 | v0→v1 迁移遗漏 frontend 调用方 | 中 | 中 | 迁移后运行 e2e 回归测试 |
| R4 | localStorage 截断导致消息丢失 | 极低 | 低 | 仅截断旧消息，保留最新 500 条 |

---

## 5. 依赖关系

```
A-P1-1 (packages/types 落地)
    ↓
A-P2-1 (frontend types 对齐)
    ↓ 依赖 A-P1-1 先完成

A-P1-3 (v0→v1 迁移)
    ↓
frontend API 调用方同步更新
```

---

## 6. 下一步

1. **A-P1-2** (ErrorBoundary) 可立即独立实施，工时最短
2. **A-P1-1** 和 **A-P2-1** 需顺序执行（先落地 schema，再对齐 frontend）
3. **A-P1-3** 需 frontend team 配合更新调用方

