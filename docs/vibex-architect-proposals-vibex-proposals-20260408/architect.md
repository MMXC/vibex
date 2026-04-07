# Architect Proposals — vibex-proposals-20260408

**Date:** 2026-04-08
**Cycle:** 2026-W15
**Status:** Draft for Review
**Architect:** Architect Agent

---

## 提案列表

| ID | 类别 | 问题/优化点 | 优先级 |
|----|------|-------------|--------|
| Ar-P0-1 | Bug | CORS preflight 500 — OPTIONS 命中 auth 中间件返回 401 | P0 |
| Ar-P0-2 | Perf | 42 Zustand stores (7895 LOC) 状态碎片化，跨 store 同步导致 bug surface 扩大 | P0 |
| Ar-P0-3 | Bug | `as any` 在生产代码中有 25+ 处，TypeScript 类型安全防线失效 | P0 |
| Ar-P1-1 | Perf | v1/canvas API 387 行单文件 — 无路由拆分，难维护 | P1 |
| Ar-P1-2 | Feature | Canvas 实时协作缺失（WebSocket 基础设施存在但未集成） | P1 |
| Ar-P1-3 | TechDebt | 废弃 legacy store 清理不彻底，Phase2 canvasStore 已删但仍有残留 | P1 |
| Ar-P2-1 | Feature | API client 分散在 services/api/modules — 无统一封装层 | P2 |
| Ar-P2-2 | Perf | 诊断模块与 DDD 模块路径重名（`/ddd` vs `/diagnosis`）语义混乱 | P2 |
| Ar-P2-3 | TechDebt | Auth 中间件双重实现：middleware/auth.ts + routes/auth/* | P2 |

---

## 详细提案

### Ar-P0-1: CORS Preflight 500 — OPTIONS 命中 auth 中间件

**问题描述**:
Cloudflare Workers 环境下，OPTIONS 预检请求命中 auth 中间件时因无 Authorization header 返回 401，浏览器阻断后续 POST 请求。CORS preflight 500 是 2026-03-27 已修复的老问题，2026-04-05 `canvas-flowtree-api-fix` 时又引入了新的 CORS 配置（显式 `canvas.options('/*', ...)`）。

**影响范围**:
- 所有跨域 API 调用（生产环境 `api.vibex.top` vs `vibex-app.pages.dev`）
- Canvas generate-contexts/flows/components API
- `xhr.send()` 和 `fetch()` 在非同源场景下失败

**建议方案**:

```typescript
// 方案 A: 全局 CORS 中间件优先于 auth（推荐）
// index.ts 或 app.ts
app.use('*', cors({
  origin: ['https://vibex-app.pages.dev', 'http://localhost:3000'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposeHeaders: ['Content-Length', 'X-Request-Id'],
  credentials: true,
}));
app.use('/api/*', authMiddleware);  // OPTIONS 不携带 token，跳过 auth

// 方案 B: 每个路由显式处理 OPTIONS（已部分实施，不推荐扩展）
canvas.options('/*', (c) => c.text('', 204));
```

**验收标准**:
- [ ] `curl -X OPTIONS -H "Origin: https://vibex-app.pages.dev" https://api.vibex.top/api/v1/canvas/generate-contexts` 返回 204
- [ ] Playwright test: 跨域 fetch 不触发 401
- [ ] 浏览器 DevTools Network: OPTIONS → 204, POST → 200/201（不出现 red）

---

### Ar-P0-2: Zustand Store 状态碎片化治理

**问题描述**:
当前 42 个 store 文件共 7895 行，存在以下问题：
1. **重叠状态**: `authStore` + `guidanceStore` + `onboardingStore` 都持有 user 相关字段
2. **隐式依赖**: Canvas 组件依赖 5+ store，跨 store 同步靠 `useEffect` + 手动 dispatch
3. **Hydration 风险**: SSR + 客户端 hydration 时 store 状态重复初始化

**影响范围**:
- CanvasPage: 任意 store 更新可能导致其他 store 陈旧
- 全局: 新增功能时开发者倾向于创建新 store 而非复用现有

**建议方案**:

**Phase 1 — Store 清单与依赖图（1d）**
```bash
# 自动生成 store 清单 + 依赖关系图
pnpm exec ts-node scripts/audit-stores.ts
# 输出: store清单.csv, dependency-graph.dot
```

**Phase 2 — 合并重叠 store（2d）**
| 合并目标 | 源 stores | 合并后 |
|---------|---------|-------|
| `auth.slice.ts` | `authStore` (用户字段) + `guidanceStore` (用户ID) + `onboardingStore` (用户token) | `auth/` 目录单一 slice |
| `canvas.slice.ts` | 清理 `canvasStore` 残留引用 | 统一为 `canvasStore` 唯一入口 |
| `ui.slice.ts` | `shortcutStore` + `guideStore` | `ui.shortcuts` + `ui.guide` |

**Phase 3 — Store 间同步契约（1d）**
```typescript
// 引入 Zustand middleware for cross-store sync
const boundaryMiddleware: Middleware = (config) => (set, get, api) => {
  const store = config((set) => set, get, api);
  
  // 监听 auth 变化 → 同步清理 session 状态
  if (api.name === 'sessionSlice') {
    return store;
  }
  
  return store;
};
```

**验收标准**:
- [ ] `find src/stores -name "*.ts" | wc -l` ≤ 20（当前 42）
- [ ] `grep -r "getState()." src/stores/ | grep -v test | wc -l` ≤ 5（跨 store 直接调用）
- [ ] `grep -r "useEffect.*store" src/components/canvas/ | wc -l` ≤ 3
- [ ] Vitest: store 单元测试 100% 通过

---

### Ar-P0-3: TypeScript `as any` 类型安全防线失效

**问题描述**:
生产代码中有 25+ 处 `as any`（排除 test 文件），主要分布在：
- `useCanvasHistory.ts`: `as any` 用于 state reset
- `UndoingBar.tsx`, `ProjectBar.tsx`: `as any` 用于未知 shape 数据
- `page.tsx` (project): 跨组件 props 传递时绕过类型

**影响范围**:
- 重构时静默类型错误传播
- 新增字段时遗漏点无法被 TSC 捕获
- ESLint `@typescript-eslint/no-explicit-any: error` 配置无法生效

**建议方案**:

**短期（1d）: 强制 error 级别 + CI gate**
```json
// .eslintrc
{
  "@typescript-eslint/no-explicit-any": "error",
  "@typescript-eslint/no-unsafe-assignment": "error",
  "@typescript-eslint/no-unsafe-member-access": "error"
}
```
```bash
# CI 检查: 任一 as any 存在则 CI 失败
pnpm lint --fix || { echo "Fix as any violations before commit"; exit 1; }
```

**中期（2d）: 逐文件消除**
- 按文件 `as any` 数量排序，从最少到最多逐个修复
- 优先使用 `unknown` + 窄化类型守卫
- 公共类型放入 `packages/types/`

**长期: 引入 strict typed utilities**
```typescript
// 替代 as any 的 safe cast 工具
function safeCast<T>(value: unknown, schema: z.ZodSchema<T>): T | null {
  const result = schema.safeParse(value);
  return result.success ? result.data : null;
}

// 使用示例
const node = safeCast(CanvasNodeSchema, rawData);
```

**验收标准**:
- [ ] `grep -rn "as any" src/ --include="*.ts" --include="*.tsx" | grep -v test | wc -l` = 0
- [ ] `pnpm build` 无 TSC 错误
- [ ] CI lint gate 强制执行

---

### Ar-P1-1: v1/canvas API 单文件 387 行 — 无路由拆分

**问题描述**:
`/routes/v1/canvas/index.ts` 387 行，包含 3 个生成端点的全部逻辑：
- `POST /generate-contexts`
- `POST /generate-flows`
- `POST /generate-components`

无子路由拆分，难以独立测试和演进。

**影响范围**:
- 单点故障：任何改动都可能影响全部 canvas API
- 测试覆盖率低：无法按端点隔离测试
- 扩展困难：新增 canvas 端点需修改大文件

**建议方案**:

```
routes/v1/canvas/
├── index.ts          # 路由注册（30行）：app.route('/generate-contexts', contextsRouter), ...
├── contexts.ts       # generate-contexts 端点逻辑（~120行）
├── flows.ts          # generate-flows 端点逻辑（~120行）
├── components.ts     # generate-components 端点逻辑（~120行）
└── __tests__/
    ├── contexts.test.ts
    ├── flows.test.ts
    └── components.test.ts
```

**验收标准**:
- [ ] `wc -l routes/v1/canvas/index.ts` ≤ 50 行
- [ ] 每个端点独立 Vitest 测试文件，覆盖率 ≥ 80%
- [ ] `pnpm test routes/v1/canvas/ --run` 全通过

---

### Ar-P1-2: Canvas 实时协作缺失

**问题描述**:
WebSocket 基础设施已存在于 `/services/websocket/`，但 Canvas 协作功能未集成：
- 多用户同时编辑同一 canvas 时无冲突检测
- 无 cursor presence（用户游标位置共享）
- 无实时状态推送（SSE/WebSocket）

**影响范围**:
- 无法支持多用户协作编辑
- agent 执行进度无法实时推送到 UI
- 协作版 VibeX 功能缺失

**建议方案**:

**Phase 1: WebSocket Presence Layer（2d）**
```typescript
// websocket/canvasPresence.ts
// 利用现有 /services/websocket/ WebSocket infrastructure
// 添加 canvas room 管理
const canvasRooms = new Map<string, Set<string>>(); // roomId → Set<userId>

// 连接时加入 room
ws.on('canvas:join', ({ canvasId, userId }) => {
  canvasRooms.get(canvasId)?.add(userId) || 
    canvasRooms.set(canvasId, new Set([userId]));
});

// 广播 cursor 位置
ws.on('canvas:cursor', ({ canvasId, userId, x, y }) => {
  broadcast(canvasId, { type: 'cursor', userId, x, y });
});
```

**Phase 2: SSE State Push（2d）**
```typescript
// 复用现有 SSE 基础设施推送 canvas 状态变更
// 当 canvas 对象增删改时，通过 SSE 推送给所有订阅者
canvas.on('object:created', (object) => {
  sseEmitter.emit(`canvas:${canvasId}`, { type: 'object:created', object });
});
```

**验收标准**:
- [ ] 两个浏览器 tab 同时打开同一 canvas，cursor 位置同步延迟 < 500ms
- [ ] WebSocket 连接数 ≥ 2 时无内存泄漏
- [ ] Playwright E2E: `expect(page2.locator('.cursor-indicator')).toBeVisible()`

---

### Ar-P1-3: 废弃 legacy store 清理不彻底

**问题描述**:
`canvas-optimization-roadmap E2` 已删除 `canvasStore.ts`，但 2026-04-05 的 `canvas-button-cleanup` 分支仍引用了部分 deprecated 接口。git log 显示 2026-04-05 有 `06ad16d8` 提交删除了 `canvasHistoryStore.ts`，但仍有其他 legacy store 残留。

**影响范围**:
- 开发者导入废弃 store 时 TSC 不报错（因为还有 re-export）
- 死代码累积，CI 编译时间增加

**建议方案**:

```bash
# 1. 扫描残留引用
grep -rn "canvasStore\|deprecatedStore" vibex-fronted/src/ --include="*.ts" --include="*.tsx"

# 2. 确认每条引用的状态
# - 已在 E2 删除但仍有引用 → 修复引用或确认已删除
# - 仍在使用但应迁移 → 分配重构任务

# 3. 建立废弃追踪表
# 在每个 legacy store 文件顶部添加废弃注释
/**
 * @deprecated 2026-04-05 — 已迁移至 canvasStore. 请使用:
 * - canvasFlowStore.ts (Flow 数据)
 * - canvasContextStore.ts (Context 数据)  
 * - canvasSelectionStore.ts (Selection 数据)
 * 迁移截止: 2026-04-15
 */
```

**验收标准**:
- [ ] `grep -rn "@deprecated" vibex-fronted/src/stores/ | wc -l` = 所有 legacy store 数量
- [ ] `grep -rn "canvasStore\b" vibex-fronted/src/ --include="*.ts" --include="*.tsx" | wc -l` = 0
- [ ] CI 在 2026-04-15 后拒绝包含废弃 store 引用的 PR

---

### Ar-P2-1: API Client 无统一封装层

**问题描述**:
前端 `services/api/modules/` 下有 15+ 模块文件（user.ts, project.ts, domain-entity.ts, flow.ts 等），每个文件独立实现 fetch 调用，无统一错误处理、retry、loading 状态封装。

**影响范围**:
- 每个 API 调用点重复相同的 error handling 逻辑
- 无统一的请求拦截/响应拦截
- API 变更时需修改多个文件

**建议方案**:

```
services/api/
├── client.ts           # 统一 HTTP client (fetch 封装 + retry + interceptors)
├── modules/           # 现有模块（重构）
│   ├── user.ts
│   ├── project.ts
│   └── ...
└── hooks/             # API + React 集成
    ├── useProject.ts  # useQuery + API call
    └── useProjects.ts
```

```typescript
// client.ts — 统一封装
export const apiClient = {
  async get<T>(url: string, options?: RequestInit): Promise<ApiResponse<T>> {
    return fetchWithRetry(url, { ...options, method: 'GET' });
  },
  async post<T>(url: string, data: unknown, options?: RequestInit): Promise<ApiResponse<T>> {
    return fetchWithRetry(url, { ...options, method: 'POST', body: JSON.stringify(data) });
  },
  // 统一错误处理: 401 → 跳转登录, 5xx → retry, 4xx → throw
};
```

**验收标准**:
- [ ] `services/api/client.ts` 存在统一封装
- [ ] 每个 module 文件减少 50%+ 重复代码
- [ ] TanStack Query 集成：loading/error/data 状态统一处理

---

### Ar-P2-2: 诊断模块与 DDD 模块路径重名

**问题描述**:
- `/ddd` — DDD 限界上下文、域模型、业务流程
- `/diagnosis` — 需求诊断
两者语义部分重叠，路径重名容易混淆，导航到错误模块。

**影响范围**:
- 开发者路由跳转错误
- API 文档结构不清晰
- 未来功能扩展时命名冲突

**建议方案**:

| 当前路径 | 建议路径 | 理由 |
|---------|---------|------|
| `/ddd` | `/ddd/contexts` | 明确限界上下文是 DDD 子模块 |
| `/diagnosis` | `/requirement/diagnosis` | 诊断属于需求流程的子模块 |
| `/ddd/domain` | `/ddd/domain-model` | 避免与 `/domain-entities` 混淆 |

**验收标准**:
- [ ] API 文档中 16 个 tag 无语义重叠
- [ ] 新开发者能在 5 分钟内区分 `/ddd` vs `/diagnosis` 的使用场景
- [ ] 路由变更需更新 `api-contract.yaml` 并附带 migration guide

---

### Ar-P2-3: Auth 中间件双重实现

**问题描述**:
Auth 逻辑分散在两处：
1. `middleware/auth.ts` — 全局 JWT 验证中间件
2. `routes/auth/*` — 独立 auth 路由处理器

这导致：
- token 验证逻辑可能不一致
- 修改 JWT 验证规则时需同步两处
- 测试时需 mock 两个位置

**建议方案**:
```typescript
// lib/auth.ts — 统一的 auth utilities
export async function verifyToken(token: string, env: Env): Promise<User | null> {
  // 唯一的 JWT 验证逻辑
  return jwt.verify(token, env.JWT_SECRET) as Promise<User>;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

// middleware/auth.ts — 调用 lib/auth
export async function authMiddleware(c: Context, next: Next) {
  const token = c.req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return c.json({ error: 'Unauthorized' }, 401);
  const user = await verifyToken(token, c.env);
  if (!user) return c.json({ error: 'Invalid token' }, 401);
  c.set('user', user);
  return next();
}

// routes/auth/*.ts — 调用 lib/auth
export async function login(c: Context) {
  const { email, password } = c.req.json();
  const user = await verifyToken(token); // NO — 用 lib/auth 的 hashPassword + DB lookup
}
```

**验收标准**:
- [ ] `lib/auth.ts` 包含所有 auth 核心逻辑（验证、hash、token 生成）
- [ ] `middleware/auth.ts` 和 `routes/auth/` 都 import from `lib/auth`
- [ ] Auth 逻辑单元测试 ≥ 10 个，覆盖所有 edge cases

---

## 依赖关系

```
Ar-P0-1 (CORS) ─────────────┐
                            ├── Ar-P1-2 (Canvas 实时协作) ── Ar-P1-1 (路由拆分)
Ar-P0-2 (Store 治理) ───────┤
                            └── Ar-P1-3 (Legacy 清理)
Ar-P0-3 (as any 消除) ──────┤
Ar-P2-1 (API Client) ───────┤
Ar-P2-2 (路由重名) ─────────┤
Ar-P2-3 (Auth 双重实现) ─────┘
```

## 推荐执行顺序

| 优先级 | 提案 | 预计工时 |
|--------|------|---------|
| P0 | Ar-P0-1 CORS preflight | 0.5d |
| P0 | Ar-P0-2 Store 治理 | 4d |
| P0 | Ar-P0-3 as any 消除 | 3d |
| P1 | Ar-P1-1 路由拆分 | 2d |
| P1 | Ar-P1-2 Canvas 实时协作 | 4d |
| P1 | Ar-P1-3 Legacy 清理 | 1d |
| P2 | Ar-P2-1 API Client 封装 | 2d |
| P2 | Ar-P2-2 路由重名 | 1d |
| P2 | Ar-P2-3 Auth 双重实现 | 1d |

**总计: ~18.5d**（建议拆分为 2 个 sprint）
