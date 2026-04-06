# IMPLEMENTATION_PLAN: VibeX 架构修复提案实施 2026-04-10

> **项目**: vibex-architect-proposals-vibex-proposals-20260410  
> **作者**: Architect  
> **日期**: 2026-04-10  
> **版本**: v1.0

---

## 1. Sprint 规划

| Sprint | 周期 | Epic | 工时 | 目标 |
|--------|------|------|------|------|
| Sprint 1 | Day 1-2 | E1: 类型系统统一 + E4 部分 | 18h | P0 清零 |
| Sprint 2 | Day 3-4 | E2: SSE 可靠性 + E3: Vitest + E4 完成 | 20h | 基础设施统一 |
| Sprint 3 | Day 5 | E5: 质量保障 + 收尾 | 16h | 全部交付 |

**总工时**: 54h | **团队**: 2 Dev 并行

---

## 2. Sprint 1: 类型系统统一（18h）

### ST-01: @vibex/types 包初始化（4h）

**Step 1: 创建 packages/types 目录结构**

```bash
mkdir -p packages/types/src/{api,schemas}
mkdir -p packages/types/src/api/{canvas,generation}
mkdir -p packages/types/src/schemas/{canvas,generation}
```

**Step 2: 初始化 package.json**

```json
{
  "name": "@vibex/types",
  "version": "0.1.0",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": "./dist/index.js",
    "./api/*": "./dist/api/*.js",
    "./schemas/*": "./dist/schemas/*.js"
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "zod": "^3.23.0"
  }
}
```

**Step 3: 添加到 pnpm workspace**

```yaml
# pnpm-workspace.yaml
packages:
  - 'packages/*'
  - 'apps/*'
```

**Step 4: 导出类型**

```typescript
// packages/types/src/api/canvas.ts
export interface CanvasNode {
  id: string;
  type: string;
  label: string;
  position: { x: number; y: number };
  data?: Record<string, unknown>;
}

// packages/types/src/schemas/canvas.ts
import { z } from 'zod';
import { CanvasNodeSchema } from '../api/canvas';

export const CanvasSnapshotSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  name: z.string(),
  nodes: z.array(CanvasNodeSchema),
  edges: z.array(z.object({
    id: z.string(),
    source: z.string(),
    target: z.string(),
  })),
  createdAt: z.string(),
  updatedAt: z.string(),
});
```

**验证命令**:
```bash
cd packages/types && pnpm build
cd apps/vibex-backend && pnpm add @vibex/types@workspace:*
cd apps/vibex-fronted && pnpm add @vibex/types@workspace:*
```

---

### ST-02: Zod Schema 重构（8h）

**Step 1: 识别现有 Schema 定义**

```bash
# 找出所有 Zod usage
grep -rn "z\." vibex-backend/src/ vibex-fronted/src/ --include="*.ts" | head -50

# 找出 sessionId drift
grep -rn "sessionId" vibex-fronted/src/lib/api/ --include="*.ts"
```

**Step 2: 创建统一 Schema（packages/types/src/schemas/）**

```
schemas/
├── api/
│   ├── canvas.ts       # CanvasSnapshot, CanvasNode, CanvasEdge
│   ├── project.ts     # Project, ProjectCreate
│   ├── generation.ts  # GenerationOptions, GenerationResult
│   └── health.ts      # HealthResponse
├── backend/
│   ├── request.ts      # API 请求类型
│   └── response.ts     # API 响应类型
└── index.ts
```

**Step 3: 迁移前后端代码**

```typescript
// Before: vibex-fronted/src/lib/api/canvas.ts
import { useState } from 'react';
interface CanvasNode { sessionId: string } // ❌ drift

// After: vibex-fronted/src/lib/api/canvas.ts
import { CanvasNode } from '@vibex/types/api/canvas';
const [nodes, setNodes] = useState<CanvasNode[]>([]); // ✅ 统一
```

**Step 4: 添加运行时验证**

```typescript
// lib/api-validator.ts
import { CanvasSnapshotSchema } from '@vibex/types/schemas/canvas';

export function validateCanvasSnapshot(data: unknown) {
  const result = CanvasSnapshotSchema.safeParse(data);
  if (!result.success) {
    console.error('Schema validation failed:', result.error);
    return null;
  }
  return result.data;
}
```

---

### ST-04: AI Timeout 配置化（4h）

**Step 1: 环境变量**

```typescript
// env.ts
export interface Env {
  AI_API_URL: string;
  AI_TIMEOUT_MS: string; // 默认 60000 (60s)
  AI_MODEL?: string;
}
```

**Step 2: ai-service.ts 重构**

```typescript
export class AIService {
  private defaultTimeout: number;

  constructor(private env: Env) {
    this.defaultTimeout = parseInt(env.AI_TIMEOUT_MS ?? '60000');
  }

  async chat(prompt: string, options: GenerationOptions = {}): Promise<ChatResponse> {
    const timeout = options.timeout ?? this.defaultTimeout;
    const controller = new AbortController();
    
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(this.env.AI_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, model: options.model ?? this.env.AI_MODEL }),
        signal: controller.signal,
      });
      
      return await response.json();
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
```

---

### ST-05: OPTIONS 预检修复（2h）

**Step 1: Gateway middleware 顺序**

```typescript
// gateway.ts
const app = new Hono();

// CORS 必须在 auth 之前
app.use('*', cors({
  origin: env.ALLOWED_ORIGIN,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// OPTIONS 预检在 auth 之前处理
app.options('*', (c) => {
  return c.text('', 200);
});

// auth middleware
app.use('*', authMiddleware);
```

**验证命令**:
```bash
curl -X OPTIONS http://localhost:8787/api/v1/projects \
  -H "Origin: https://vibex-app.pages.dev" \
  -H "Access-Control-Request-Method: POST" \
  -i | grep HTTP
# 应返回: HTTP/1.1 200
```

---

## 3. Sprint 2: 可靠性攻坚（20h）

### ST-03: SSE AbortController 集成（6h）

**Step 1: Audit 所有 ai-service 调用点**

```bash
grep -rn "\.streamChat\|\.chat\|stream(" vibex-backend/src/ --include="*.ts" | grep -v "test\|\.backup"
```

**Step 2: 添加 AbortController 到所有 fetch**

```typescript
// Before: ai-service.ts
const response = await fetch(url, {
  method: 'POST',
  body: JSON.stringify(payload),
});

// After:
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), timeout);

const response = await fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
  signal: controller.signal, // ✅ 传递 signal
});

try {
  // stream processing...
} finally {
  clearTimeout(timeoutId);
  if (!controller.signal.aborted) {
    controller.abort(); // 确保清理
  }
}
```

**Step 3: SSE stream 正确关闭**

```typescript
async *streamChat(prompt: string, options: GenerationOptions = {}): AsyncGenerator<string> {
  const controller = new AbortController();
  // ...

  try {
    const reader = response.body?.getReader();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      yield this.decode(value);
    }
  } finally {
    // ✅ 确保 stream 关闭
    controller.abort();
    reader.releaseLock();
  }
}
```

**验证**:
```typescript
// tests/unit/ai-service.test.ts
it('should cleanup zombie connections on timeout', async () => {
  const service = new AIService(env);
  const activeBefore = service.getActiveStreamCount();
  
  // trigger timeout
  await sleep(100);
  
  const activeAfter = service.getActiveStreamCount();
  expect(activeAfter).toBe(activeBefore); // 应回到原始值
});
```

---

### ST-06: Cache API 分布式限流（6h）

**Step 1: RateLimiter 重构**

```typescript
// lib/rateLimit.ts
interface Cache {
  get(key: string, type: 'text' | 'json'): Promise<string | unknown | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}

export class RateLimiter {
  constructor(private cache: Cache) {}

  async check(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
    const cacheKey = `ratelimit:${key}`;
    const entry = await this.cache.get(cacheKey, 'json') as RateLimitEntry | null;
    const now = Date.now();

    if (!entry || now > entry.resetAt) {
      await this.cache.put(cacheKey, JSON.stringify({
        count: 1,
        resetAt: now + windowMs,
      }), { expirationTtl: Math.ceil(windowMs / 1000) });
      return { allowed: true, remaining: limit - 1 };
    }

    if (entry.count >= limit) {
      return { allowed: false, remaining: 0, resetAt: entry.resetAt };
    }

    entry.count++;
    await this.cache.put(cacheKey, JSON.stringify(entry), {
      expirationTtl: Math.ceil((entry.resetAt - now) / 1000),
    });

    return { allowed: true, remaining: limit - entry.count };
  }
}
```

**Step 2: 迁移测试**

```typescript
// tests/unit/rate-limit.test.ts
describe('RateLimiter with Cache API', () => {
  let cache: MockCache;
  let limiter: RateLimiter;

  beforeEach(() => {
    cache = new MockCache();
    limiter = new RateLimiter(cache);
  });

  it('should share count across instances', async () => {
    // Simulate two instances
    const limiter1 = new RateLimiter(cache);
    const limiter2 = new RateLimiter(cache);

    for (let i = 0; i < 3; i++) {
      await limiter1.check('user:123', { limit: 5, windowMs: 60000 });
    }

    const result = await limiter2.check('user:123', { limit: 5, windowMs: 60000 });
    expect(result.remaining).toBe(2); // 5 - 3 = 2
  });
});
```

---

### ST-07: Vitest 全面迁移（8h）

**Phase 1: 并行验证（2h）**

```bash
# 添加 vitest 配置，运行双框架
npx vitest run --reporter=json > vitest-results.json

# 对比 Jest 和 Vitest 结果
npx jest --json > jest-results.json

# 如果有差异，分析原因
diff <(jq '.testResults[].status' jest-results.json) \
      <(jq '.testResults[].status' vitest-results.json)
```

**Phase 2: 迁移配置（2h）**

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}', 'tests/**/*.test.{ts,tsx}'],
    exclude: [
      'node_modules',
      'dist',
      'jest.config.ts',
      'jest.setup.ts',
    ],
  },
});
```

**Phase 3: 修复差异（3h）**

常见差异：
- `jest.fn()` → `vi.fn()`
- `jest.spyOn()` → `vi.spyOn()`
- `jest.mock()` → `vi.mock()`
- `expect.any(String)` → `expect.any(String)` (相同)
- `toBeCalled()` → `toHaveBeenCalled()`

**Phase 4: 删除 Jest（1h）**

```bash
# 确认 Vitest 100% 覆盖后
rm jest.config.js jest.config.ts jest.setup.ts 2>/dev/null || true
pnpm remove jest @types/jest ts-jest
```

---

## 4. Sprint 3: 质量保障（16h）

### ST-08: SSR-Safe 编码规范（8h）

**Step 1: 编写规范文档**

```markdown
# SSR-Safe Coding Guidelines

## 禁止模式

### 1. setInterval / setTimeout in SSR
```typescript
// ❌ 禁止
useEffect(() => {
  const timer = setInterval(() => {}, 1000);
  return () => clearInterval(timer);
}, []);
```

### 2. window / document access
```typescript
// ❌ 禁止（无防护）
const width = window.innerWidth;

// ✅ 正确
const width = typeof window !== 'undefined' ? window.innerWidth : 1024;
```

### 3. localStorage / sessionStorage
```typescript
// ❌ 禁止（SSR 无）
const token = localStorage.getItem('token');

// ✅ 正确
const token = typeof window !== 'undefined' 
  ? localStorage.getItem('token') 
  : undefined;
```
```

**Step 2: ESLint 规则**

```javascript
// eslint-plugin-ssr-safe/index.js
module.exports = {
  rules: {
    'no-window-access': {
      create(context) {
        return {
          MemberExpression(node) {
            if (node.object.name === 'window') {
              context.report({
                node,
                message: 'Do not access window directly. Use useSMTH hook or check typeof.',
              });
            }
          },
        };
      },
    },
  },
};
```

---

### ST-09: Health Check 端点（4h）

```typescript
// routes/health.ts
export const healthRoute = new Hono().get('/health', async (c) => {
  const startDb = Date.now();
  let dbStatus: ServiceStatus = 'ok';
  try {
    await env.DB.prepare('SELECT 1').first();
  } catch {
    dbStatus = 'error';
  }

  const startKv = Date.now();
  let kvStatus: ServiceStatus = 'ok';
  try {
    await env.KV.get('health-check');
  } catch {
    kvStatus = 'error';
  }

  const startAi = Date.now();
  let aiStatus: ServiceStatus = 'ok';
  try {
    await fetch(env.AI_API_URL + '/models');
  } catch {
    aiStatus = 'error';
  }

  return c.json({
    db: { status: dbStatus, latencyMs: Date.now() - startDb },
    kv: { status: kvStatus, latencyMs: Date.now() - startKv },
    ai: { status: aiStatus, latencyMs: Date.now() - startAi },
    timestamp: new Date().toISOString(),
  });
});
```

---

## 5. 验收标准总表

| Story | 验收标准 | 验证命令 |
|-------|---------|---------|
| ST-01 | `@vibex/types` 可导入 | `tsc --noEmit` in backend + frontend |
| ST-02 | Schema drift 修复 | `grep "sessionId" --include="*.ts"` 返回 0 |
| ST-03 | SSE 无 zombie | 压测 timeout 后 `getActiveStreams() === 0` |
| ST-04 | Timeout 可配置 | `AI_TIMEOUT_MS=5000 node -e "..."` 生效 |
| ST-05 | OPTIONS 返回 200 | `curl -X OPTIONS /api/ -i` 检查状态码 |
| ST-06 | 限流跨实例 | 双实例并发测试误差 < 1% |
| ST-07 | Jest 删除 | `ls jest.config.js` 返回空 |
| ST-08 | SSR 规则生效 | `pnpm lint` 无 SSR warning |
| ST-09 | Health 端点 | `curl /health` 返回 200 + 三个 status |

---

## 6. 回滚计划

| Story | 回滚步骤 | 时间 |
|-------|---------|------|
| ST-01 | `pnpm remove @vibex/types` + 恢复旧类型 | < 10 min |
| ST-02 | `git checkout HEAD~1 -- "**/schemas/**"` | < 5 min |
| ST-03 | `git checkout HEAD~1 -- ai-service.ts` | < 5 min |
| ST-06 | 恢复内存 Map | < 5 min |
| ST-07 | `git checkout HEAD~1 -- jest.config.js` | < 5 min |

---

*文档版本: v1.0 | 最后更新: 2026-04-10*
