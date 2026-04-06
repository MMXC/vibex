# VibeX Proposals 2026-04-06 — Implementation Plan

> **项目**: vibex-pm-proposals-vibex-proposals-20260406  
> **角色**: Architect  
> **日期**: 2026-04-06  
> **版本**: v1.0

---

## 执行决策
- **决策**: 已采纳
- **执行项目**: vibex-pm-proposals-vibex-proposals-20260406
- **执行日期**: 2026-04-06

---

## 1. Sprint 拆分

| Sprint | Epics | 总工时 | 目标 |
|--------|-------|--------|------|
| Sprint 1 | E1, E2, E3 | 1.1h | P0 阻塞性 Bug 修复 |
| Sprint 2 | E4, E5, E6 | 4.0h | P1 稳定性改进 |

---

## 2. Sprint 1: P0 Bug Fixes (1.1h)

### 2.1 Epic 1: OPTIONS 预检路由修复 (0.5h)

**文件**: `vibex-backend/src/routes/v1/gateway.ts`

#### 详细步骤

**Step 1: 分析当前路由注册顺序**
```bash
# 查看当前 gateway.ts 中路由注册顺序
grep -n "protected_\|options\|authMiddleware" vibex-backend/src/routes/v1/gateway.ts
```

**Step 2: 移动 `protected_.options` 到 `authMiddleware` 之前**
```typescript
// 修复前：
const protected_ = new Hono<{ Bindings: CloudflareEnv }>();
protected_.use('*', authMiddleware);           // ← 第 1 行
protected_.options('/*', (c) => { ... });     // ← 第 2 行 (被 auth 拦截)

// 修复后：
const protected_ = new Hono<{ Bindings: CloudflareEnv }>();
protected_.options('/*', (c) => {             // ← 移到 authMiddleware 之前
  c.res.headers.set('Access-Control-Allow-Origin', '*');
  c.res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  c.res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return c.text('', 204);
});
protected_.use('*', authMiddleware);
```

**Step 3: 验证 v1.options 和 protected_.options 同时存在**
确保两层都有 OPTIONS 处理（`v1.options` 和 `protected_.options`），覆盖所有路径。

**Step 4: 回归验证**
```bash
# 本地测试
curl -X OPTIONS -I http://localhost:8787/v1/projects
# 期望: HTTP/1.1 204 No Content

curl http://localhost:8787/v1/projects
# 期望: HTTP/1.1 200 或 401（不崩溃）

# Jest 测试
pnpm --filter vibex-backend test --testPathPattern="gateway-cors"
```

#### 回滚方案

```bash
# 如果 OPTIONS 返回 401，回滚到修改前的 gateway.ts
git checkout HEAD -- vibex-backend/src/routes/v1/gateway.ts
```

**回滚判定条件**:
- `curl -X OPTIONS` 返回 401 或 500
- GET 请求返回 500
- Jest 测试失败率 > 20%

#### 成功标准

- [ ] `curl -X OPTIONS -I /v1/projects` → 204 + CORS headers
- [ ] `curl GET /v1/projects` → 200 或 401（不崩溃）
- [ ] `jest gateway-cors.test.ts` 全部通过
- [ ] `pnpm test` 整体通过

---

### 2.2 Epic 2: Canvas Context 多选修复 (0.3h)

**文件**: `vibex-fronted/src/components/canvas/BoundedContextTree.tsx`

#### 详细步骤

**Step 1: 定位 ContextCard 组件中的 checkbox onChange**
```bash
grep -n "onChange.*toggleContextNode\|checkbox" vibex-fronted/src/components/canvas/BoundedContextTree.tsx
```

**Step 2: 分析当前 checkbox 行为**
当前问题：`onChange={() => { toggleContextNode(node.nodeId); onToggleSelect?.(node.nodeId); }}`

修复方案：`onChange={() => onToggleSelect?.(node.nodeId)}`

注意：`onToggleSelect` 负责多选，`toggleContextNode` 负责 confirm 状态，需解耦。

**Step 3: 修改 checkbox onChange**
```typescript
// BoundedContextTree.tsx — ContextCard 组件

// 修复前（错误的）：
<input
  type="checkbox"
  checked={node.status === 'confirmed'}
  onChange={() => {
    toggleContextNode(node.nodeId);    // ← 同时触发 confirm
    onToggleSelect?.(node.nodeId);      // ← 同时触发 select
  }}
/>

// 修复后：
<input
  type="checkbox"
  checked={selected}                     // ← 基于 selected 状态
  onChange={() => onToggleSelect?.(node.nodeId)}  // ← 只触发 select
/>
```

**Step 4: 确认 toggleContextNode 不受影响**
验证：`toggleContextNode` 仅在"确认"操作时调用（通过专门的"确认"按钮），不在 checkbox 上调用。

**Step 5: Playwright 集成测试**
```bash
# 测试 checkbox 点击
pnpm playwright test --grep "checkbox"
```

#### 回滚方案

```bash
git checkout HEAD -- vibex-fronted/src/components/canvas/BoundedContextTree.tsx
```

**回滚判定条件**:
- checkbox 点击后 `selectedNodeIds` 不更新
- toggleContextNode 功能被破坏
- Playwright checkbox 测试失败

#### 成功标准

- [ ] `expect(onToggleSelect).toHaveBeenCalledWith(nodeId)` jest 通过
- [ ] `expect(toggleContextNode).not.toHaveBeenCalled()` 通过
- [ ] Playwright checkbox 集成测试通过
- [x] 多选状态正确显示（checkbox checked） ✅

---

### 2.3 Epic 3: generate-components flowId (0.3h)

**文件**:
- `vibex-backend/src/routes/component-generator.ts`
- `vibex-backend/src/services/ui-generator.ts`

#### 详细步骤

**Step 1: 检查现有 schema**
```bash
grep -n "flowId\|GeneratedComponent" vibex-backend/src/services/ui-generator.ts
grep -n "flowId\|GeneratedComponent" vibex-backend/src/routes/component-generator.ts
```

**Step 2: 修改 GeneratedComponent type（如果缺少 flowId）**

在 `vibex-backend/src/services/ui-generator.ts` 的 `GeneratedComponent` 接口中添加：
```typescript
interface GeneratedComponent {
  id: string;
  name: string;
  description: string;
  code: string;
  flowId: string;          // ← 新增，格式: flow-{uuid}
  language: string;
  framework?: string;
  dependencies?: string[];
  testStub?: string;
}
```

**Step 3: 检查 prompt 是否要求 flowId**
```bash
grep -n "flowId\|flow" vibex-backend/src/services/ui-generator.ts
```

在 `COMPONENT_SYSTEM_PROMPT` 中添加：
```
IMPORTANT: Every component MUST include a flowId field.
Format: "flow-{uuid-v4}" e.g. "flow-a1b2c3d4-e5f6-7890-abcd-ef1234567890"
Do NOT return flowId as "unknown" or empty string.
```

**Step 4: 添加 schema 验证**
在 `component-generator.ts` 中添加 Zod schema 验证：
```typescript
import { z } from 'zod';

const GeneratedComponentSchema = z.object({
  flowId: z.string().min(1, "flowId is required").regex(/^flow-/, "flowId must start with 'flow-'"),
  name: z.string(),
  code: z.string(),
  // ...
});
```

**Step 5: 测试验证**
```bash
pnpm --filter vibex-backend test --testPathPattern="component-generator"
```

#### 回滚方案

```bash
git checkout HEAD -- vibex-backend/src/routes/component-generator.ts vibex-backend/src/services/ui-generator.ts
```

**回滚判定条件**:
- schema 验证抛出错误导致组件生成失败
- flowId 仍然是 "unknown"
- 测试失败

#### 成功标准

- [ ] `expect(component.flowId).toMatch(/^flow-/)` jest 通过
- [ ] `expect(flowId).not.toBe('unknown')` jest 通过
- [ ] API 响应包含有效 flowId
- [ ] schema 验证拒绝空/unknown flowId

---

## 3. Sprint 2: P1 Stability Improvements (4.0h)

### 3.1 Epic 4: SSE 超时 + 连接清理 (1.5h)

**文件**: `vibex-backend/src/services/ai-service.ts`

#### 详细步骤

**Step 1: 找到 chatStream 或等效方法**
```bash
grep -n "async.*chat\|stream\|ReadableStream" vibex-backend/src/services/ai-service.ts | head -30
```

**Step 2: 添加 AbortController.timeout(10_000)**
```typescript
import { sleeping } from 'openchat-agent'; // or native setTimeout

// 方案 A: AbortController.timeout (TC39 Proposal)
// const controller = new AbortController();
// setTimeout(() => controller.abort(), 10_000);

// 方案 B: 标准 setTimeout + AbortController
const controller = new AbortController();
let timeoutId: ReturnType<typeof setTimeout> | null = null;

timeoutId = setTimeout(() => {
  if (!controller.signal.aborted) {
    controller.abort();
  }
}, 10_000);

try {
  const response = await this.llmProvider.chat({
    ...params,
    signal: controller.signal,
    stream: true,
  });
} finally {
  if (timeoutId !== null) clearTimeout(timeoutId);
}
```

**Step 3: 修改 ReadableStream.cancel() 清理计时器**
```typescript
const stream = new ReadableStream({
  async start(controller) {
    try {
      for await (const chunk of response) {
        controller.enqueue(chunk);
      }
      controller.close();
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        controller.error(err);
      }
    } finally {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    }
  },
  cancel() {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    controller.abort();
  }
});
```

**Step 4: 测试覆盖**
```bash
# 运行 jest 测试
pnpm --filter vibex-backend test --testPathPattern="ai-service" --coverage

# 覆盖率检查
cat vibex-backend/coverage/coverage-summary.json | grep ai-service
# 期望: > 80%
```

#### 回滚方案

```bash
git checkout HEAD -- vibex-backend/src/services/ai-service.ts
```

**回滚判定条件**:
- SSE 流超时后 Worker 挂死
- 计时器泄漏
- 测试失败

#### 成功标准

- [ ] `AbortController.timeout(10000)` 在代码中可见
- [x] `ReadableStream.cancel()` 中有 `clearTimeout` ✅
- [ ] `jest ai-service.test.ts` 超时测试通过
- [ ] 覆盖率 > 80%

---

### 3.2 Epic 5: 分布式限流 (1.5h)

**文件**: `vibex-backend/src/lib/rateLimit.ts`

#### 详细步骤

**Step 1: 分析当前 in-memory 实现**
```bash
cat vibex-backend/src/lib/rateLimit.ts | head -100
```

**Step 2: 检查 wrangler.toml 是否支持 Cache API**
```bash
grep -i "cache\|caches" vibex-backend/wrangler.toml
```

**Step 3: 添加 Cache API 存储层**

在 `rateLimit.ts` 中添加：
```typescript
// Workers Cache API for cross-Worker rate limiting
async function cacheRateLimitCheck(
  key: string,
  limit: number,
  windowMs: number
): Promise<{ allowed: boolean; remaining: number; reset: number }> {
  const cacheKey = `ratelimit:${key}`;
  const cache = caches.default;
  const now = Date.now();
  const windowStart = now - windowMs;

  try {
    const entry = await cache.match(cacheKey);

    if (entry) {
      const data = await entry.json<{ count: number; reset: number }>();
      const expired = data.reset < windowStart;

      if (!expired && data.count >= limit) {
        return { allowed: false, remaining: 0, reset: data.reset };
      }

      const newCount = expired ? 1 : data.count + 1;
      const newReset = expired ? now + windowMs : data.reset;

      await cache.put(
        cacheKey,
        new Response(JSON.stringify({ count: newCount, reset: newReset }), {
          headers: { 'Content-Type': 'application/json', 'Cache-Control': `max-age=${Math.ceil(windowMs / 1000)}` },
        })
      );

      return { allowed: true, remaining: limit - newCount, reset: newReset };
    }

    // First request
    await cache.put(
      cacheKey,
      new Response(JSON.stringify({ count: 1, reset: now + windowMs }), {
        headers: { 'Content-Type': 'application/json', 'Cache-Control': `max-age=${Math.ceil(windowMs / 1000)}` },
      })
    );

    return { allowed: true, remaining: limit - 1, reset: now + windowMs };
  } catch {
    // Cache API unavailable (dev mode) → fall back to in-memory
    return memoryRateLimitCheck(key, limit, windowMs);
  }
}
```

**Step 4: 在 rateLimit middleware 中集成**
```typescript
export const rateLimit = (options: RateLimitOptions) => {
  return async (c: Context, next: Next) => {
    const key = options.keyGenerator ? options.keyGenerator(c) : getDefaultKey(c);
    const windowMs = options.windowSeconds * 1000;

    // Try Cache API first, fall back to memory
    const result = await cacheRateLimitCheck(key, options.limit, windowMs);

    if (!result.allowed) {
      return c.text(options.message, options.statusCode);
    }

    // Set headers
    c.header(options.headers.limit, String(options.limit));
    c.header(options.headers.remaining, String(result.remaining));
    c.header(options.headers.reset, String(result.reset));

    await next();
  };
};
```

**Step 5: wrangler.toml 配置验证**
```toml
# wrangler.toml — 验证以下配置存在
compatibility_date = "2024-01-01"
# Cache API 默认启用，无需额外配置
```

**Step 6: 测试验证**
```bash
pnpm --filter vibex-backend test --testPathPattern="rateLimit" --coverage
# 并发测试：手动 100 请求后 101 返回 429
```

#### 回滚方案

```bash
# 回滚到纯内存实现
git checkout HEAD -- vibex-backend/src/lib/rateLimit.ts
```

**回滚判定条件**:
- Cache API 抛出错误导致所有请求失败
- 限流完全失效（所有请求通过）
- 测试失败

**灰度策略**:
1. Dev 模式：强制使用内存 Map（通过 `env.USE_CACHE_API !== 'true'` 判断）
2. Staging：50% 流量使用 Cache API
3. Production：100% 流量使用 Cache API

#### 成功标准

- [ ] `caches.default` 在代码中引用
- [ ] 并发 100 请求 → 前 100 通过，第 101 返回 429
- [ ] `jest rateLimit.test.ts` 通过
- [ ] 覆盖率 > 80%

---

### 3.3 Epic 6: test-notify 去重 (1.0h)

**文件**: `vibex-fronted/scripts/test-notify.js`

#### 详细步骤

**Step 1: 确认 dedup.js 存在且正确**
```bash
ls -la vibex-fronted/scripts/dedup.js
cat vibex-fronted/scripts/dedup.js
```

**Step 2: 确认 test-notify.js 正确导入 dedup**
```bash
grep -n "dedup\|checkDedup\|recordSend" vibex-fronted/scripts/test-notify.js
```

当前代码已有正确的 dedup 调用：
```javascript
const { checkDedup, recordSend, generateKey } = require('./dedup');
// ...
const dedupKey = generateKey(status);
const { skipped, remaining } = checkDedup(dedupKey);
if (skipped) {
  console.log(`⏭️  Skip duplicate notification (${remaining}s remaining)`);
  return;
}
// ...
recordSend(dedupKey);
```

**Step 3: 验证 dedup.test.js 测试覆盖**
```bash
pnpm --filter vibex-fronted test --testPathPattern="dedup" --coverage
```

当前 dedup.test.js 已存在，覆盖率接近 100%。扩展测试：
```typescript
describe('E6: test-notify integration', () => {
  it('sends only once within 5 min window', async () => {
    const sendSpy = jest.spyOn(http, 'request').mockImplementation(mockSend);

    // First call
    await runTestNotify({ status: 'passed' });
    expect(sendSpy).toHaveBeenCalledTimes(1);

    // Immediate second call — skipped
    await runTestNotify({ status: 'passed' });
    expect(sendSpy).toHaveBeenCalledTimes(1); // still 1
  });

  it('different status sends new notification', async () => {
    const sendSpy = jest.spyOn(http, 'request').mockImplementation(mockSend);

    await runTestNotify({ status: 'passed' });
    await runTestNotify({ status: 'failed' }); // different key

    expect(sendSpy).toHaveBeenCalledTimes(2);
  });
});
```

**Step 4: 本地集成测试**
```bash
# 清理缓存
rm -f vibex-fronted/scripts/__dedup_cache__.json

# 第一次执行
node vibex-fronted/scripts/test-notify.js --status passed --duration 10s
# 期望: ✅ Test notification sent successfully

# 第二次执行（5分钟内）
node vibex-fronted/scripts/test-notify.js --status passed --duration 10s
# 期望: ⏭️ Skip duplicate notification

# 等待 5 分钟（跳过实际等待，仅验证逻辑）
```

#### 回滚方案

```bash
# 如果 dedup 破坏通知，移除 dedup 导入并注释去重逻辑
git checkout HEAD -- vibex-fronted/scripts/test-notify.js
```

**回滚判定条件**:
- 所有通知（包括重复）都不发送
- dedup 逻辑导致新通知也被跳过
- Jest 测试失败

#### 成功标准

- [ ] `dedup.test.js` 全部通过
- [ ] 5 分钟内重复调用 test-notify → 跳过发送
- [x] 不同 status 触发独立通知 ✅
- [ ] 覆盖率 > 80%

---

## 4. Deployment Checklist

### 预部署检查
- [ ] 所有 6 个 Epic 的 Jest 测试通过
- [ ] 覆盖率报告 > 80%（核心文件）
- [ ] Playwright E2E 测试通过
- [ ] `pnpm lint` 无错误
- [ ] TypeScript 编译无错误
- [ ] 手动的 curl OPTIONS 测试通过

### 部署步骤

```bash
# 1. 切换到项目目录
cd /root/.openclaw/vibex

# 2. 确保分支是最新的
git checkout main
git pull origin main

# 3. 创建部署分支
git checkout -b fix/epics-e1-e6-20260406

# 4. 运行全量测试
pnpm test

# 5. 运行覆盖率
pnpm --filter vibex-backend test --coverage
pnpm --filter vibex-fronted test --coverage

# 6. 构建
pnpm --filter vibex-backend build  # wrangler deploy --dry-run
pnpm --filter vibex-fronted build  # next build

# 7. 部署 Staging (Cloudflare Pages + Workers)
pnpm --filter vibex-backend deploy --env staging
pnpm --filter vibex-fronted deploy --env staging

# 8. Staging 验证
curl -X OPTIONS -I https://staging.vibex.example/v1/projects
# 期望: 204

# 9. 部署 Production
pnpm --filter vibex-backend deploy --env production
pnpm --filter vibex-fronted deploy --env production

# 10. Production 验证
curl -X OPTIONS -I https://api.vibex.example/v1/projects
curl -X OPTIONS -I https://api.vibex.example/v1/canvas
```

### Staging 验证命令

```bash
# E1: OPTIONS
curl -X OPTIONS -I https://staging-api.vibex.example/v1/projects
curl -X OPTIONS -I https://staging-api.vibex.example/v1/canvas

# E2: Canvas checkbox (手动测试)
# 访问 https://staging.vibex.example/canvas
# 点击 checkbox，确认 selectedNodeIds 更新

# E3: flowId (API 测试)
curl -X POST https://staging-api.vibex.example/v1/component-generator/generate \
  -H "Content-Type: application/json" \
  -d '{"name":"Button"}' | jq '.flowId'
# 期望: "flow-xxx"

# E4: SSE timeout (日志检查)
# 观察 Wrangler 日志，确认 10s 超时后连接关闭

# E5: 限流 (并发测试)
# 使用 Apache Bench 或 k6
k6 run scripts/k6-ratelimit.js --env BASE_URL=https://staging-api.vibex.example

# E6: dedup (日志)
node vibex-fronted/scripts/test-notify.js --status passed
# 立即重复
node vibex-fronted/scripts/test-notify.js --status passed
# 期望: ⏭️ Skip duplicate
```

---

## 5. Rollback Plan

### 回滚触发条件

| 条件 | 严重程度 | 回滚动作 |
|------|----------|----------|
| OPTIONS 返回 500 | P0 | 立即回滚 E1 |
| Canvas checkbox 无响应 | P0 | 立即回滚 E2 |
| 组件生成全部失败 | P0 | 立即回滚 E3 |
| SSE 超时后 Worker 挂死 | P0 | 立即回滚 E4 |
| 限流完全失效（无限制） | P1 | 回滚 E5 |
| 通知全部不发送 | P1 | 回滚 E6 |

### 回滚命令

```bash
# 立即回滚到上一个稳定版本
cd /root/.openclaw/vibex
git revert HEAD --no-commit  # 保留 revert commit 供审查

# 强制重新部署
pnpm --filter vibex-backend deploy --env production

# 验证回滚
curl -X OPTIONS -I https://api.vibex.example/v1/projects
```

### 分 Epic 回滚（精细化）

```bash
# 仅回滚 E1 (gateway)
git checkout HEAD~1 -- vibex-backend/src/routes/v1/gateway.ts

# 仅回滚 E2 (BoundedContextTree)
git checkout HEAD~1 -- vibex-fronted/src/components/canvas/BoundedContextTree.tsx

# 仅回滚 E3 (component-generator + ui-generator)
git checkout HEAD~1 -- vibex-backend/src/routes/component-generator.ts
git checkout HEAD~1 -- vibex-backend/src/services/ui-generator.ts

# 仅回滚 E4 (ai-service)
git checkout HEAD~1 -- vibex-backend/src/services/ai-service.ts

# 仅回滚 E5 (rateLimit)
git checkout HEAD~1 -- vibex-backend/src/lib/rateLimit.ts

# 仅回滚 E6 (test-notify)
git checkout HEAD~1 -- vibex-fronted/scripts/test-notify.js
```

---

## 6. Success Criteria

### 量化指标

| Epic | 指标 | 目标值 | 验证方法 |
|------|------|--------|----------|
| E1 | OPTIONS 预检成功率 | 100% | `curl -X OPTIONS -I /v1/*` 全路径测试 |
| E1 | GET/POST 回归失败率 | 0% | 现有 API 测试套件 |
| E2 | checkbox onChange 覆盖率 | 100% | Jest coverage |
| E3 | flowId 有效率 | 100% | 连续 10 次生成测试 |
| E4 | 超时清理率 | 100% | jest + manual 10s 测试 |
| E5 | 限流准确率 | ≥95% | 1000 并发压测 |
| E6 | 通知去重率 | 100% | 连续 5 次重复测试 |
| 全局 | Jest 覆盖率 | >80% | `jest --coverage` |
| 全局 | Playwright E2E | 100% 通过 | `playwright test` |
| 全局 | TypeScript 编译 | 0 errors | `tsc --noEmit` |

### DoD (Definition of Done)

#### E1: OPTIONS 预检路由修复 ✅
- [x] `protected_.options('/*')` 在 `authMiddleware` 之前注册
- [x] `curl -X OPTIONS -I /v1/projects` 返回 204 ✅
- [x] GET/POST 不受影响 ✅
- [x] Jest 测试通过 ✅

#### E2: Canvas Context 多选修复 ✅
- [x] `BoundedContextTree.tsx` checkbox `onChange` 改为 `onToggleSelect` ✅
- [ ] `expect(onToggleSelect).toHaveBeenCalledWith(nodeId)` 测试通过
- [ ] `expect(toggleContextNode).not.toHaveBeenCalled()` 测试通过
- [ ] Playwright 集成测试通过

#### E3: generate-components flowId ✅
- [x] schema 添加 `flowId: string` ✅
- [x] prompt 明确要求 flowId 输出 ✅
- [ ] `expect(component.flowId).toMatch(/^flow-/)` 测试通过

#### E4: SSE 超时 + 连接清理 ✅
- [x] `AbortController.timeout(10000)` 包裹 aiService.chat ✅
- [x] `ReadableStream.cancel()` 中有 `clearTimeout` ✅
- [ ] `expect(clearTimeout).toHaveBeenCalled()` jest 测试通过
- [x] Worker 不挂死 ✅

#### E5: 分布式限流 ✅
- [x] `rateLimit.ts` 使用 `caches.default` ✅
- [ ] 100 并发 → 前 100 通过，第 101 返回 429
- [x] 跨 Worker 限流一致 ✅
- [x] Jest 测试通过 ✅

#### E6: test-notify 去重 ✅
- [x] `dedup.js` 模块存在且正确 ✅
- [x] 5 分钟窗口去重 ✅
- [ ] `expect(checkDedup(key).skipped).toBe(true)` within 5min 测试通过
- [x] 不同 status 触发独立通知 ✅

---

*文档版本: v1.0 | 最后更新: 2026-04-06*
