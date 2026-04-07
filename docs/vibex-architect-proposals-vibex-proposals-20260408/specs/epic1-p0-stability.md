# Spec — Epic 1: P0 稳定性修复

**Project:** vibex-architect-proposals-vibex-proposals-20260408
**Epic:** Epic 1 — P0 Stability Fixes
**Sprint:** Sprint 1 (5d)
**Status:** Draft
**Date:** 2026-04-08

---

## 概述

Epic 1 解决 VibeX 当前最紧迫的 3 个 P0 问题：
1. CORS preflight 500 阻断生产 API
2. Zustand Store 状态碎片化导致跨组件 bug
3. TypeScript `as any` 泛滥导致类型安全失守

这 3 个问题相互独立，可并行执行，但 Store 治理需先于路由拆分（共享数据模型）。

---

## Story 1.1 — Ar-P0-1: CORS Preflight 全局中间件

### 背景

Cloudflare Workers 环境中，OPTIONS 预检请求命中 auth 中间件时因无 Authorization header 返回 401，浏览器阻断后续 POST 请求。该 bug 在 2026-03-27 修复后，2026-04-05 的 `canvas-flowtree-api-fix` 分支又引入了新的局部 CORS 配置（`canvas.options('/*', ...)`）。

### 实现方案

**文件: `src/middleware/cors.ts`**（新建）

```typescript
import type { Next } from 'hono';
import type { Context } from 'hono';

const ALLOWED_ORIGINS = [
  'https://vibex-app.pages.dev',
  'http://localhost:3000',
  'https://staging.vibex-app.pages.dev', // staging for testing
];

const ALLOWED_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'];
const ALLOWED_HEADERS = [
  'Content-Type',
  'Authorization',
  'X-Requested-With',
  'X-Request-Id',
];
const EXPOSED_HEADERS = ['Content-Length', 'X-Request-Id'];

export function globalCorsMiddleware(c: Context, next: Next) {
  const origin = c.req.header('Origin') || '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];

  // Handle preflight immediately — skip auth for OPTIONS
  if (c.req.method === 'OPTIONS') {
    return c.text('', 204, {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': ALLOWED_METHODS.join(', '),
      'Access-Control-Allow-Headers': ALLOWED_HEADERS.join(', '),
      'Access-Control-Expose-Headers': EXPOSED_HEADERS.join(', '),
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400', // 24h cache
    });
  }

  // Add CORS headers to all responses
  c.res.headers.set('Access-Control-Allow-Origin', allowedOrigin);
  c.res.headers.set('Access-Control-Allow-Credentials', 'true');
  c.res.headers.set('Access-Control-Expose-Headers', EXPOSED_HEADERS.join(', '));

  return next();
}
```

**文件: `src/index.ts` 或 `src/app.ts`**（修改）

在所有中间件之前注册全局 CORS：

```typescript
import { globalCorsMiddleware } from './middleware/cors';

// Register BEFORE auth middleware
app.use('*', globalCorsMiddleware);
app.use('/api/*', authMiddleware);  // OPTIONS reaches here but already handled
```

**文件: `src/routes/v1/canvas/index.ts`**（删除/注释）

移除局部 `canvas.options('/*', ...)` 配置，统一走全局中间件：

```typescript
// REMOVE this block — handled by globalCorsMiddleware
// canvas.options('/*', (c) => c.text('', 204));
```

### 测试策略

```typescript
// e2e/vibex-cors.spec.ts
describe('CORS Preflight', () => {
  const routes = [
    '/api/v1/canvas/generate-contexts',
    '/api/v1/canvas/generate-flows',
    '/api/v1/canvas/generate-components',
    '/api/auth/login',
    '/api/projects',
  ];

  routes.forEach(route => {
    test(`${route} OPTIONS returns 204`, async ({ request }) => {
      const res = await request.options(`https://api.vibex.top${route}`, {
        headers: {
          'Origin': 'https://vibex-app.pages.dev',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type, Authorization',
        },
      });
      expect(res.status()).toBe(204);
      expect(res.headers()['access-control-allow-methods']).toBeTruthy();
    });
  });

  test('cross-origin POST does not trigger 401', async ({ page }) => {
    await page.goto('https://vibex-app.pages.dev/project/test-project');
    const result = await page.evaluate(async () => {
      const res = await fetch('https://api.vibex.top/api/v1/canvas/generate-contexts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: 'test' }),
      });
      return { status: res.status, ok: res.ok };
    });
    expect(result.ok || result.status === 401).toBeTruthy(); // 401 ok (auth required), but not 500
    expect(result.status).not.toBe(500);
  });
});
```

### 验收标准

- [ ] `curl -X OPTIONS -H "Origin: https://vibex-app.pages.dev" https://api.vibex.top/api/v1/canvas/generate-contexts` → 204
- [ ] `curl -X OPTIONS -H "Origin: http://localhost:3000" https://api.vibex.top/api/auth/login` → 204
- [ ] Playwright: 跨域 fetch 不返回 500
- [ ] 移除所有局部 `canvas.options('/*', ...)` 配置

---

## Story 1.2 — Ar-P0-2: Zustand Store 治理

### 背景

42 个 Zustand store（7895 LOC）导致：
- `authStore` + `guidanceStore` + `onboardingStore` 持有重复的 user 字段
- Canvas 组件依赖 5+ store，跨 store 同步靠 `useEffect` + 手动 dispatch
- 新增功能时开发者倾向创建新 store 而非复用

### 实现方案

**Phase 1 — Store 清单与依赖图（1d）**

新建脚本 `vibex-fronted/scripts/audit-stores.ts`：

```typescript
// 生成 store 清单
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const storesDir = 'src/stores';
const storeFiles = execSync(`find ${storesDir} -name "*.ts" ! -name "*.test.ts" ! -name "*.d.ts"`)
  .toString().trim().split('\n');

interface StoreInfo {
  file: string;
  lines: number;
  stateKeys: string[];
  dependencies: string[]; // other stores this store references
}

const report: StoreInfo[] = [];

for (const file of storeFiles) {
  const content = fs.readFileSync(file, 'utf-8');
  const lines = content.split('\n').length;
  
  // Extract state keys (simple heuristic)
  const stateKeys = [...content.matchAll(/getState\(\)\.(\w+)/g)]
    .map(m => m[1]);
  
  // Extract store dependencies (imports of other stores)
  const deps = [...content.matchAll(/from\s+['"]@\/stores\/(\w+)['"]/g)]
    .map(m => m[1]);

  report.push({ file, lines, stateKeys, dependencies: [...new Set(deps)] });
}

// Output CSV
const csv = ['File,Lines,StateKeys,Dependencies'];
for (const s of report) {
  csv.push(`${s.file},${s.lines},"${s.stateKeys.join(';')}","${s.dependencies.join(';')}"`);
}
fs.writeFileSync('store-audit.csv', csv.join('\n'));
console.log(`Total stores: ${report.length}`);
console.log(`Total LOC: ${report.reduce((sum, s) => sum + s.lines, 0)}`);
```

**Phase 2 — 合并重叠 stores（2d）**

目标目录结构：
```
src/stores/
├── auth/
│   ├── auth.slice.ts      # merged from authStore (user fields)
│   ├── guidance.slice.ts  # merged from guidanceStore (userId)
│   └── onboarding.slice.ts # merged from onboardingStore (token)
├── canvas/
│   ├── canvas.slice.ts    # unified canvas state
│   └── selection.slice.ts # selection state
├── ui/
│   ├── shortcuts.slice.ts # merged from shortcutStore
│   └── guide.slice.ts     # merged from guideStore
└── index.ts               # barrel export
```

Auth slice 合并示例（`src/stores/auth/auth.slice.ts`）：
```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  user: User | null;
  userId: string | null;
  token: string | null;
  isAuthenticated: boolean;
  // Unified actions
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  logout: () => void;
  hydrateFromSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      userId: null,
      token: null,
      isAuthenticated: false,

      setUser: (user) => set({ user, userId: user?.id ?? null, isAuthenticated: !!user }),
      setToken: (token) => set({ token }),
      logout: () => set({ user: null, userId: null, token: null, isAuthenticated: false }),
      hydrateFromSession: async () => {
        // Rehydrate from server session (e.g., via /api/auth/me)
      },
    }),
    { name: 'auth-storage', partialize: (s) => ({ token: s.token }) }
  )
);
```

**Phase 3 — Store 间同步契约（1d）**

引入 Zustand middleware 替代 `useEffect` 跨 store 同步：

```typescript
// src/stores/middleware/crossStoreSync.ts
import type { Middleware } from 'zustand';

export const authSyncMiddleware: Middleware = (config) => {
  return (set, get, api) => {
    const store = config(set, get, api);
    
    // Listen to auth store changes
    if (api.name === 'auth') {
      const origSet = store.setState;
      store.setState = (state, ...args) => {
        const next = typeof state === 'function' ? state(store.getState()) : state;
        if (next.isAuthenticated === false) {
          // Auth logout → clear all dependent slices
          const canvasStore = get(); // cross-store sync here
          if (canvasStore.reset) canvasStore.reset();
        }
        return origSet(state, ...args);
      };
    }
    
    return store;
  };
};
```

### 验收标准

- [ ] `find vibex-fronted/src/stores -name "*.ts" | wc -l` ≤ 30（Phase 2 完成后 ≤ 20）
- [ ] `grep -r "useEffect.*store" vibex-fronted/src/components/canvas/ | wc -l` ≤ 3
- [ ] `grep -r "getState()" vibex-fronted/src/stores/ | grep -v test | wc -l` ≤ 5
- [ ] Vitest: store 单元测试 100% passed

---

## Story 1.3 — Ar-P0-3: TypeScript `as any` 消除

### 背景

生产代码中有 25+ 处 `as any`，主要分布在：
- `useCanvasHistory.ts`: `as any` 用于 state reset
- `UndoingBar.tsx`, `ProjectBar.tsx`: `as any` 用于未知 shape 数据
- `page.tsx` (project): 跨组件 props 传递时绕过类型

### 实现方案

**Step 1: 建立 CI Gate（0.5d）**

修改 `.eslintrc`：

```json
{
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unsafe-assignment": "error",
    "@typescript-eslint/no-unsafe-member-access": "error",
    "@typescript-eslint/no-unsafe-call": "error",
    "@typescript-eslint/no-unsafe-return": "error"
  }
}
```

修改 `package.json`：
```json
{
  "scripts": {
    "lint": "eslint src --ext .ts,.tsx --max-warnings 0",
    "lint:fix": "eslint src --ext .ts,.tsx --fix"
  }
}
```

**Step 2: 扫描并排序（0.5d）**

```bash
# 扫描并按文件分组 as any 数量
grep -rn "as any" vibex-fronted/src/ --include="*.ts" --include="*.tsx" \
  | grep -v node_modules | grep -v test \
  | sort > /tmp/as-any-violations.txt

# 按文件统计
cut -d: -f1 /tmp/as-any-violations.txt | sort | uniq -c | sort -rn
```

**Step 3: 逐文件消除（2.5d）**

按数量从少到多修复：

**常见模式替换：**

```typescript
// ❌ Before
const state = getState() as any;
state.reset();

// ✅ After: proper typed state
interface CanvasHistoryState {
  past: HistoryEntry[];
  future: HistoryEntry[];
  reset: () => void;
}
const state = getState() as CanvasHistoryState;
state.reset();

// ❌ Before: unknown shape data
const shape = data as any;

// ✅ After: union type or unknown + guard
const shape = data as CanvasNode | CanvasEdge;
if ('type' in shape) { /* narrow */ }

// ❌ Before: cross-component props
const props = nextProps as any;

// ✅ After: proper shared interface
import type { ProjectPageProps } from '@/types/project';
const props = nextProps as ProjectPageProps;
```

**Safe Cast Utility（用于复杂场景）：**
```typescript
// src/lib/safeCast.ts
import { z } from 'zod';

export function safeCast<T>(value: unknown, schema: z.ZodSchema<T>): T | null {
  const result = schema.safeParse(value);
  return result.success ? result.data : null;
}

// Usage: const node = safeCast(rawData, CanvasNodeSchema);
```

### 验收标准

- [ ] `grep -rn "as any" vibex-fronted/src/ --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v test | wc -l` = 0
- [ ] `pnpm build` 无 TSC 错误
- [ ] `pnpm lint` 退出码 0（无 error）
- [ ] CI gate 已配置（`.github/workflows/ci.yml` 更新）

---

## 技术债务追踪

Epic 1 完成后，以下 learnings 文档需更新：

- [ ] `docs/learnings/canvas-testing-strategy.md` — 新增 Store 测试套件要求
- [ ] `docs/learnings/vibex-e2e-test-fix.md` — CORS 测试已固化
- [ ] 新建 `docs/learnings/zustand-store-governance.md` — Store 合并规范
