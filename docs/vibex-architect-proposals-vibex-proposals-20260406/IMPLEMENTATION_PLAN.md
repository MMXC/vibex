# VibeX Proposals 2026-04-06 — Implementation Plan

> **项目**: vibex-architect-proposals-vibex-proposals-20260406  
> **类型**: Bug Fix Sprint Implementation  
> **作者**: architect agent  
> **日期**: 2026-04-06  
> **版本**: v1.0

---

## 1. Sprint 概览

| Sprint | Epic | 内容 | 工时 | 顺序 |
|--------|------|------|------|------|
| Sprint 1 | E1 | OPTIONS 预检路由修复 | 0.5h | 1 |
| Sprint 1 | E2 | Canvas Context 多选修复 | 0.3h | 2 |
| Sprint 1 | E3 | generate-components flowId | 0.3h | 3 |
| Sprint 2 | E4 | SSE 超时 + 连接清理 | 1.5h | 4 |
| Sprint 2 | E5 | 分布式限流 | 1.5h | 5 |
| Sprint 2 | E6 | test-notify 去重 | 1h | 6 |

**总工时**: 5.1h  
**Sprint 节奏**: Sprint 1 (P0, 1.1h) → Sprint 2 (P1, 4h)

---

## 2. Sprint 1: P0 修复（目标：当天完成）

### 2.1 Epic 1: OPTIONS 预检路由修复（0.5h）

#### Step 1: 分析当前代码（5 min）
```bash
# 查找 gateway.ts 文件
find /root/.openclaw/vibex -name "gateway.ts" -o -name "index.ts" | grep backend | head -5
cat /root/.openclaw/vibex/vibex-backend/src/app/gateway.ts 2>/dev/null || cat /root/.openclaw/vibex/vibex-backend/src/index.ts 2>/dev/null
```

**预期发现**: `app.options()` 在 `app.use(authMiddleware)` 之后注册。

#### Step 2: 调整注册顺序（10 min）

**文件**: `vibex-backend/src/app/gateway.ts`

```typescript
// 修复：OPTIONS handler 必须在 authMiddleware 之前注册

// ✅ 正确顺序
app.options('*', corsHandler);    // Step 1: CORS handler（预检请求处理）
app.use('*', authMiddleware);    // Step 2: Auth middleware（所有其他请求）

// 不受影响的路由
app.get('/v1/projects', handleProjectsList);
app.post('/v1/projects', handleProjectsCreate);
```

#### Step 3: 编写单元测试（10 min）

**文件**: `vibex-backend/src/__tests__/gateway/options-handler.test.ts`

```typescript
describe('OPTIONS preflight', () => {
  it('returns 204', async () => {
    const res = await fetch('/v1/projects', { method: 'OPTIONS' });
    expect(res.status).toBe(204);
  });

  it('has CORS headers', () => {
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });

  it('not 401', () => {
    expect(res.status).not.toBe(401);
  });

  it('GET still requires auth', async () => {
    const res = await fetch('/v1/projects', { method: 'GET' });
    expect(res.status).toBe(401);
  });
});
```

#### Step 4: 手动验证（5 min）

```bash
curl -X OPTIONS -I https://api.vibex.top/v1/projects
# 期望: HTTP/2 204 + Access-Control-Allow-Origin: *
```

#### Step 5: 本地 Wrangler 验证（5 min）

```bash
cd /root/.openclaw/vibex/vibex-backend
pnpm dev:hono &
sleep 3
curl -X OPTIONS -I http://localhost:3000/v1/projects
```

#### ✅ E1 验收标准

- [ ] `curl -X OPTIONS -I /v1/projects` → 204
- [ ] Headers 包含 `Access-Control-Allow-Origin: *`
- [ ] GET `/v1/projects` → 401（无 token）
- [ ] Jest 测试全部通过

#### 回滚方案

```bash
# 回滚：恢复原始顺序
git checkout vibex-backend/src/app/gateway.ts

# 如果 Wrangler 部署后出问题：
wrangler rollback
```

---

### 2.2 Epic 2: Canvas Context 多选修复（0.3h）

#### Step 1: 定位 BoundedContextTree.tsx（5 min）

```bash
find /root/.openclaw/vibex -name "BoundedContextTree.tsx" | head -3
cat /root/.openclaw/vibex/vibex-fronted/src/components/BoundedContextTree.tsx 2>/dev/null | grep -A 10 "Checkbox"
```

#### Step 2: 修复 checkbox onChange（10 min）

**文件**: `vibex-fronted/src/components/BoundedContextTree.tsx`

```typescript
// 修复前
<Checkbox
  checked={selectedNodeIds.includes(node.id)}
  onChange={() => toggleContextNode(node.id)}  // ❌ 错误
/>

// 修复后
<Checkbox
  checked={selectedNodeIds.includes(node.id)}
  onChange={() => onToggleSelect(node.id)}      // ✅ 正确
/>
```

#### Step 3: 确认 props 接口兼容（5 min）

检查 `BoundedContextTreeProps` 是否已定义 `onToggleSelect`，如果未定义则添加：

```typescript
interface BoundedContextTreeProps {
  nodes: ContextNode[];
  selectedNodeIds: string[];
  onToggleSelect: (nodeId: string) => void;   // 必填
  toggleContextNode?: (nodeId: string) => void; // 保留但 checkbox 不调用
}
```

#### Step 4: 编写组件测试（5 min）

**文件**: `vibex-fronted/src/__tests__/BoundedContextTree.test.tsx`

```typescript
it('checkbox calls onToggleSelect on change', async () => {
  const onToggleSelect = jest.fn();
  render(<BoundedContextTree nodes={nodes} onToggleSelect={onToggleSelect} />);
  const checkbox = screen.getAllByRole('checkbox')[0];
  await userEvent.click(checkbox);
  expect(onToggleSelect).toHaveBeenCalledWith('node-1');
});
```

#### Step 5: Playwright E2E 验证（5 min）

**文件**: `vibex-fronted/e2e/canvas-checkbox.spec.ts`

```typescript
test('canvas checkbox multi-select', async ({ page }) => {
  await page.goto('/canvas');
  await page.click('[data-testid="context-node-node1"] checkbox');
  await expect(page.locator('.selected-count')).toHaveText('1');

  await page.click('[data-testid="context-node-node2"] checkbox');
  await expect(page.locator('.selected-count')).toHaveText('2');
});
```

#### ✅ E2 验收标准

- [ ] `onToggleSelect` 被 checkbox 调用
- [ ] `toggleContextNode` 不被 checkbox 调用
- [ ] `selectedNodeIds` 更新
- [ ] Jest 组件测试通过
- [ ] Playwright E2E 通过

#### 回滚方案

```bash
git checkout vibex-fronted/src/components/BoundedContextTree.tsx
```

---

### 2.3 Epic 3: generate-components flowId（0.3h）

#### Step 1: 定位 schema 文件（5 min）

```bash
find /root/.openclaw/vibex -name "ai-component*.ts" -o -name "schema*.ts" | grep -i component | head -5
grep -rn "flowId" /root/.openclaw/vibex/vibex-backend/src/ | head -20
```

#### Step 2: 修复 schema（10 min）

**文件**: `vibex-backend/src/schemas/ai-component.ts`

```typescript
// 添加 flowId 字段
const AIComponentSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['bounded-context', 'flow', 'service', 'gateway']),
  flowId: z.string().regex(/^flow-/, "flowId must start with 'flow-'"), // ✅ 新增
  position: z.object({ x: z.number(), y: z.number() }),
});

// 向后兼容：历史数据 fallback
const parseComponent = (raw: unknown) => {
  const result = AIComponentSchema.safeParse(raw);
  if (result.success) return result.data;
  // 旧数据 fallback（不破坏已有功能）
  console.warn('[aiService] Component missing flowId, using fallback');
  return { ...(raw as object), flowId: 'unknown' };
};
```

#### Step 3: 更新 prompt（5 min）

**文件**: `vibex-backend/src/prompts/component-generation.ts`

```typescript
const COMPONENT_PROMPT = `
生成以下组件时，每个组件必须包含：
1. id: 唯一标识符
2. name: 组件名称
3. type: 组件类型
4. flowId: 所属流程 ID，格式为 "flow-{uuid}"（例: "flow-a1b2c3d4"）
5. position: { x: number, y: number }

注意：flowId 不能为空字符串或 "unknown"。
`;
```

#### Step 4: 编写测试（5 min）

```typescript
it('flowId starts with "flow-"', async () => {
  const components = await generateComponents(mockContext);
  components.forEach(c => {
    expect(c.flowId).toMatch(/^flow-/);
    expect(c.flowId).not.toBe('unknown');
  });
});
```

#### ✅ E3 验收标准

- [ ] schema 包含 `flowId` 字段（必填）
- [ ] prompt 明确要求 flowId
- [ ] `flowId` 不等于 "unknown"
- [ ] 向后兼容 fallback 存在

#### 回滚方案

```bash
git checkout vibex-backend/src/schemas/ai-component.ts vibex-backend/src/prompts/
```

---

### Sprint 1 验收

| Epic | 验收标准 | 状态 |
|------|----------|------|
| E1 | OPTIONS → 204, not 401 | ⬜ |
| E2 | checkbox → onToggleSelect | ⬜ |
| E3 | flowId → /flow-*/ | ⬜ |

---

## 3. Sprint 2: P1 改进

### 3.1 Epic 4: SSE 超时 + 连接清理（1.5h）

#### Step 1: 定位 aiService.ts（10 min）

```bash
find /root/.openclaw/vibex -name "aiService.ts" -o -name "ai.ts" | grep backend | head -3
cat /root/.openclaw/vibex/vibex-backend/src/services/aiService.ts 2>/dev/null
```

#### Step 2: 实现 chatWithTimeout（30 min）

**文件**: `vibex-backend/src/services/aiService.ts`

```typescript
// 添加 TimeoutController
function chatWithTimeout(options: ChatOptions, timeoutMs = 10_000): TimeoutController {
  const controller = new AbortController();
  let timerId: ReturnType<typeof setTimeout> | null = null;

  timerId = setTimeout(() => {
    controller.abort('timeout');
  }, timeoutMs);

  return {
    signal: controller.signal,
    cancel: () => {
      if (timerId !== null) {
        clearTimeout(timerId);
        timerId = null;
      }
    },
  };
}

// 更新 chat() 使用 timeout
async function chat(options: ChatOptions): Promise<ReadableStream> {
  const { signal, cancel } = chatWithTimeout(options, 10_000);

  try {
    const response = await fetch(AI_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: options.messages }),
      signal,  // ✅ 传入 AbortSignal
    });

    if (!response.body) throw new Error('No response body');

    const stream = response.body;
    const reader = stream.getReader();

    // 包装为带 cancel cleanup 的 ReadableStream
    return new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            controller.enqueue(value);
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        } finally {
          cancel();  // ✅ 正常结束时也清理 timer
        }
      },
      async cancel() {
        // ✅ ReadableStream.cancel() 被调用时清理
        await reader.cancel();
        cancel();
      },
    });
  } catch (err) {
    cancel();  // ✅ 异常时清理
    throw err;
  }
}
```

#### Step 3: 编写测试（20 min）

```typescript
describe('SSE timeout', () => {
  it('times out after 10s', async () => {
    jest.useFakeTimers();
    const slowStream = mockSlowStream();
    const promise = streamAIResponse(slowStream, 10_000);

    await jest.advanceTimersByTimeAsync(10_000);
    await expect(promise).rejects.toThrow('timeout');

    jest.useRealTimers();
  });

  it('clears timer on cancel', () => {
    jest.useFakeTimers();
    const { cancel } = chatWithTimeout({ messages: [] });
    await jest.advanceTimersByTimeAsync(100);
    cancel();
    expect(clearTimeout).toHaveBeenCalled();
    jest.useRealTimers();
  });

  it('timer cleanup on client disconnect', async () => {
    const stream = await chat({ messages: [] });
    await stream.cancel();
    expect(clearTimeout).toHaveBeenCalled();
  });
});
```

#### Step 4: Wrangler dev 验证（15 min）

```bash
cd /root/.openclaw/vibex/vibex-backend
pnpm dev:hono &
sleep 3
# 测试 SSE 超时
timeout 12 curl -N http://localhost:3000/chat/stream
# 期望：12s 后连接关闭，不挂死 Worker
```

#### Step 5: Wrangler 部署验证（15 min）

```bash
wrangler deploy --env staging
# 验证 staging 环境超时行为
```

#### ✅ E4 验收标准

- [ ] 10s 无响应 → `controller.close()` / `controller.error()`
- [ ] `ReadableStream.cancel()` → `clearTimeout()` 被调用
- [ ] Worker 不挂死（不泄漏 timer）
- [ ] Jest 测试 > 90% 覆盖率

#### 回滚方案

```bash
git checkout vibex-backend/src/services/aiService.ts
wrangler rollback  # 如果已部署
```

---

### 3.2 Epic 5: 分布式限流（1.5h）

#### Step 1: 定位 rateLimit.ts（10 min）

```bash
find /root/.openclaw/vibex -name "rateLimit.ts" -o -name "rate-limit.ts" | head -3
grep -rn "rateLimit\|rate-limit\|limiter" /root/.openclaw/vibex/vibex-backend/src/ | head -20
```

#### Step 2: 重构为 Cache API 实现（30 min）

**文件**: `vibex-backend/src/lib/rateLimit.ts`

```typescript
import { caches } from '@cloudflare/workers-types';

interface RateLimitOptions {
  key: string;
  limit: number;
  windowMs: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  total: number;
}

// 内存 fallback（Cache API 不可用时）
const memoryFallback = new Map<string, { count: number; resetAt: number }>();

async function checkRateLimit(options: RateLimitOptions): Promise<RateLimitResult> {
  const cacheKey = `ratelimit:${options.key}`;
  const windowSec = Math.ceil(options.windowMs / 1000);

  try {
    const cache = caches.default;
    const cached = await cache.match(cacheKey);
    let data: { count: number; resetAt: number };

    if (cached) {
      data = await cached.json();
    } else {
      data = { count: 0, resetAt: Date.now() + options.windowMs };
    }

    // 重置过期窗口
    if (Date.now() > data.resetAt) {
      data = { count: 0, resetAt: Date.now() + options.windowMs };
    }

    if (data.count >= options.limit) {
      return { allowed: false, remaining: 0, resetAt: data.resetAt, total: data.count };
    }

    data.count++;
    const response = new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': `max-age=${windowSec}` },
    });
    await cache.put(cacheKey, response);

    return {
      allowed: true,
      remaining: options.limit - data.count,
      resetAt: data.resetAt,
      total: data.count,
    };
  } catch (err) {
    // ✅ Fallback: 内存 Map + 告警
    console.warn('[rateLimit] Cache API unavailable, using memory fallback:', err);
    return rateLimitMemoryFallback(options);
  }
}

function rateLimitMemoryFallback(options: RateLimitOptions): RateLimitResult {
  const key = `ratelimit:${options.key}`;
  let data = memoryFallback.get(key);

  if (!data || Date.now() > data.resetAt) {
    data = { count: 0, resetAt: Date.now() + options.windowMs };
  }

  if (data.count >= options.limit) {
    return { allowed: false, remaining: 0, resetAt: data.resetAt, total: data.count };
  }

  data.count++;
  memoryFallback.set(key, data);

  return {
    allowed: true,
    remaining: options.limit - data.count,
    resetAt: data.resetAt,
    total: data.count,
  };
}

export { checkRateLimit };
```

#### Step 3: 添加 wrangler.json 配置（10 min）

**文件**: `vibex-backend/wrangler.json`

```json
{
  "main": "src/index.ts",
  "compatibility_flags": ["streams_enable_constructors"],
  "vars": {
    "RATE_LIMIT_WINDOW_MS": "60000",
    "RATE_LIMIT_MAX_REQUESTS": "100"
  }
}
```

#### Step 4: 编写测试（20 min）

```typescript
describe('Distributed rate limit', () => {
  beforeEach(() => {
    global.caches = { default: mockCache } as any;
  });

  it('uses Cache API', async () => {
    await checkRateLimit({ key: 'test', limit: 10, windowMs: 60_000 });
    expect(mockCache.match).toHaveBeenCalled();
    expect(mockCache.put).toHaveBeenCalled();
  });

  it('returns 429 when limit exceeded', async () => {
    mockCache.match.mockResolvedValue(
      new Response(JSON.stringify({ count: 10, resetAt: Date.now() + 60_000 }))
    );
    const result = await checkRateLimit({ key: 'test', limit: 10, windowMs: 60_000 });
    expect(result.allowed).toBe(false);
  });

  it('falls back to memory when Cache API throws', async () => {
    mockCache.match.mockRejectedValue(new Error('Cache unavailable'));
    const result = await checkRateLimit({ key: 'test', limit: 10, windowMs: 60_000 });
    expect(result.allowed).toBe(true);
  });
});
```

#### Step 5: 多 Worker 集成测试（10 min）

在 staging 环境启动多个并发请求验证跨 Worker 一致性。

#### ✅ E5 验收标准

- [ ] `caches.default` 被调用
- [ ] 限流计数跨 Worker 共享
- [ ] 超过 limit → 429
- [ ] fallback 机制工作
- [ ] Jest 测试 > 80% 覆盖率

#### 回滚方案

```bash
git checkout vibex-backend/src/lib/rateLimit.ts
wrangler rollback
```

---

### 3.3 Epic 6: test-notify 去重（1h）

#### Step 1: 创建 dedup.ts（20 min）

**文件**: `vibex-backend/src/lib/dedup.ts`

```typescript
import fs from 'node:fs/promises';
import path from 'node:path';

const DEDUP_WINDOW_MS = 5 * 60 * 1000;
const DEDUP_CACHE_FILE = path.join(process.cwd(), '.dedup-cache.json');

interface DedupRecord {
  key: string;
  sentAt: number;
  skipped: boolean;
}

interface DedupResult {
  skipped: boolean;
  reason?: string;
  nextAllowedAt?: number;
}

const memoryCache = new Map<string, DedupRecord>();

async function loadDedupCache(): Promise<Record<string, DedupRecord>> {
  try {
    const content = await fs.readFile(DEDUP_CACHE_FILE, 'utf-8');
    return JSON.parse(content);
  } catch {
    return {};
  }
}

async function saveDedupCache(cache: Record<string, DedupRecord>): Promise<void> {
  await fs.writeFile(DEDUP_CACHE_FILE, JSON.stringify(cache, null, 2));
}

async function checkDedup(key: string): Promise<DedupResult> {
  const now = Date.now();

  // 快速路径
  const memEntry = memoryCache.get(key);
  if (memEntry && now - memEntry.sentAt < DEDUP_WINDOW_MS) {
    return { skipped: true, reason: 'in-memory duplicate' };
  }

  // 持久化路径
  const cache = await loadDedupCache();
  const fileEntry = cache[key];

  if (fileEntry && now - fileEntry.sentAt < DEDUP_WINDOW_MS) {
    memoryCache.set(key, fileEntry);
    return {
      skipped: true,
      reason: 'file duplicate',
      nextAllowedAt: fileEntry.sentAt + DEDUP_WINDOW_MS,
    };
  }

  return { skipped: false };
}

async function recordSend(key: string): Promise<void> {
  const now = Date.now();
  const record: DedupRecord = { key, sentAt: now, skipped: false };

  memoryCache.set(key, record);

  const cache = await loadDedupCache();
  cache[key] = record;
  await saveDedupCache(cache);
}

function hashEvent(event: unknown): string {
  const str = typeof event === 'string' ? event : JSON.stringify(event);
  // 简单 hash：实际生产应使用 crypto.createHash
  return `dedup:${Buffer.from(str).toString('base64').slice(0, 32)}`;
}

export { checkDedup, recordSend, hashEvent, DEDUP_WINDOW_MS, DedupResult };
```

#### Step 2: 集成到 test-notify（15 min）

**文件**: `vibex-backend/src/routes/test-notify.ts`

```typescript
import { checkDedup, recordSend, hashEvent } from '../lib/dedup';

async function testNotify(event: TestEvent): Promise<void> {
  const dedupKey = hashEvent(event);

  const result = await checkDedup(dedupKey);
  if (result.skipped) {
    console.log(`[dedup] Skipped duplicate: ${dedupKey} (${result.reason})`);
    return;
  }

  await sendWebhook(event);
  await recordSend(dedupKey);
}
```

#### Step 3: 编写测试（15 min）

```typescript
describe('test-notify deduplication', () => {
  beforeEach(() => {
    memoryCache.clear();
    jest.spyOn(fs, 'readFile').mockResolvedValue('{}');
    jest.spyOn(fs, 'writeFile').mockResolvedValue();
  });

  it('skips duplicate within 5 minutes', async () => {
    await recordSend('event-1');
    const result = await checkDedup('event-1');
    expect(result.skipped).toBe(true);
  });

  it('allows after 5 minutes', async () => {
    const oldCache: Record<string, DedupRecord> = {
      'event-1': { key: 'event-1', sentAt: Date.now() - 6 * 60 * 1000, skipped: false },
    };
    jest.spyOn(fs, 'readFile').mockResolvedValue(JSON.stringify(oldCache));

    const result = await checkDedup('event-1');
    expect(result.skipped).toBe(false);
  });

  it('persists to .dedup-cache.json', async () => {
    await recordSend('event-2');
    expect(fs.writeFile).toHaveBeenCalledWith(
      '.dedup-cache.json',
      expect.stringContaining('event-2')
    );
  });
});
```

#### Step 4: 手动验证（10 min）

```bash
# 模拟重复通知
node -e "
const { checkDedup, recordSend } = require('./src/lib/dedup');
(async () => {
  await recordSend('test-event');
  const r = await checkDedup('test-event');
  console.log('First check:', r);
  const r2 = await checkDedup('test-event');
  console.log('Second check (should skip):', r2);
})();
"
```

#### ✅ E6 验收标准

- [ ] 5 分钟内重复 → `skipped: true`
- [ ] `.dedup-cache.json` 持久化
- [ ] 内存缓存快速路径
- [ ] Jest 测试 > 90% 覆盖率

#### 回滚方案

```bash
git checkout vibex-backend/src/lib/dedup.ts vibex-backend/src/routes/test-notify.ts
```

---

## 4. 部署清单

### 4.1 Pre-deployment 检查

| # | 检查项 | 命令 |
|---|--------|------|
| 1 | 所有 Jest 测试通过 | `pnpm test -- --passWithNoTests` |
| 2 | TypeScript 类型检查 | `pnpm --filter vibex-backend lint` |
| 3 | 覆盖率 > 80% | `pnpm test -- --coverage --coverageThreshold` |
| 4 | 无内联 style（前端） | `grep -rn "style={{" vibex-fronted/src/ --include="*.tsx"` |
| 5 | Playwright E2E 通过 | `pnpm --filter vibex-fronted test:e2e` |

### 4.2 部署步骤

```bash
# 1. 创建 feature 分支
git checkout -b fix/vibex-proposals-20260406

# 2. 提交每个 Epic
git add vibex-backend/src/app/gateway.ts
git commit -m "fix(E1): OPTIONS handler before authMiddleware"
git push origin fix/vibex-proposals-20260406

# 3. 部署 staging
wrangler deploy --env staging

# 4. 验证 staging
curl -X OPTIONS -I https://staging-api.vibex.top/v1/projects

# 5. 创建 PR
gh pr create --title "fix: P0+P1 bug fixes for proposals 2026-04-06" --body "..."

# 6. 合并到 main
gh pr merge --squash

# 7. 自动部署到 production
# (CI/CD pipeline 触发)
```

### 4.3 监控清单

| Epic | 监控指标 | 告警阈值 |
|------|----------|----------|
| E1 | OPTIONS 204 比例 | < 99% |
| E2 | checkbox 点击成功率 | < 95% |
| E3 | flowId = "unknown" 比例 | > 1% |
| E4 | SSE 超时次数 | > 5/min |
| E5 | 限流 429 比例 | > 20% |
| E6 | 重复通知次数 | > 0 |

---

## 5. 回滚方案

### 5.1 自动回滚（Wrangler）

```bash
# Wrangler 自动保留历史版本
wrangler rollback [version]  # 回滚到指定版本

# 查看版本列表
wrangler versions list
```

### 5.2 手动回滚（Git）

```bash
# 获取上一个稳定提交
git log --oneline -5

# 回滚指定文件
git checkout <stable-commit> -- vibex-backend/src/app/gateway.ts

# 回滚后重新部署
wrangler deploy
```

### 5.3 回滚决策矩阵

| 场景 | 触发条件 | 回滚策略 |
|------|----------|----------|
| E1 OPTIONS 500 | > 5% OPTIONS 返回 500 | `wrangler rollback` |
| E2 多选失效 | checkbox 无响应 | `git checkout` → `wrangler deploy` |
| E3 flowId 全部 unknown | > 50% unknown | `git checkout` schema → redeploy |
| E4 Worker 挂死 | SSE 连接不释放 | `wrangler rollback` |
| E5 限流完全失效 | 大量超额请求 | `git checkout` rateLimit → redeploy |
| E6 重复通知 | 任何重复通知 | `git checkout` dedup → redeploy |

---

## 6. 成功标准

### 6.1 验收标准（AC）

| AC | 描述 | 验证方式 |
|----|------|----------|
| AC1 | OPTIONS `/v1/projects` → 204 + CORS headers | `curl -X OPTIONS -I` |
| AC2 | Canvas checkbox → `selectedNodeIds` 更新 | Playwright E2E |
| AC3 | `generate-components` 输出 `flowId` 不是 "unknown" | Jest + 日志检查 |
| AC4 | SSE 流 10s 无响应 → 关闭，不挂死 Worker | Playwright SSE test |
| AC5 | 100 并发限流 → 计数一致，后续 429 | 压力测试脚本 |
| AC6 | test-notify 5min 内重复 → 跳过发送 | Jest 集成测试 |

### 6.2 完成标准

- [ ] 6 个 Epic 全部完成
- [ ] 全部 AC 通过
- [ ] Jest 覆盖率 > 80%
- [ ] Playwright E2E 全部通过
- [ ] PR 审查通过
- [ ] 部署到 production
- [ ] 监控指标正常（1 周无告警）

---

## 7. 时间线

```
Day 1 (Sprint 1: P0)
├── T+0:00 - T+0:30  E1 OPTIONS 修复
├── T+0:30 - T+1:00  E1 验证
├── T+1:00 - T+1:30  E2 Canvas 多选修复
├── T+1:30 - T+2:00  E2 验证
├── T+2:00 - T+2:30  E3 flowId 修复
└── T+2:30 - T+3:00  E3 验证 + Sprint 1 收尾

Day 2 (Sprint 2: P1)
├── T+3:00 - T+4:30  E4 SSE 超时
├── T+4:30 - T+6:00  E5 分布式限流
├── T+6:00 - T+7:00  E6 test-notify 去重
└── T+7:00 - T+8:00  Sprint 2 验证 + PR 创建

Day 3
├── T+8:00 - T+9:00  Review + Merge
└── T+9:00 - T+10:00  部署 + 监控
```

---

## 8. 执行决策

- **决策**: 已采纳
- **执行项目**: team-tasks 项目 ID 待分配
- **执行日期**: 2026-04-06
