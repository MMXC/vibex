# Implementation Plan: VibeX Proposals 2026-04-06

> **项目**: vibex-pm-proposals-vibex-proposals-20260406
> **作者**: architect agent
> **日期**: 2026-04-06
> **版本**: v1.0

---

## 概述

本计划基于 6 个 Agent 提案汇总的 6 个 Epic（3 个 P0 + 3 个 P1），总工期 **5.1 小时**，分 2 个 Sprint 实施。

| Sprint | 优先级 | Epic 数 | 工时 |
|--------|--------|---------|------|
| Sprint 1 | P0 | 3 | 1.1h |
| Sprint 2 | P1 | 3 | 4.0h |
| **合计** | — | **6** | **5.1h** |

---

## Sprint 1: P0 优先

### Epic 1: OPTIONS 预检路由修复（0.5h）

#### 目标
修复 `gateway.ts` 中 OPTIONS handler 注册顺序，确保预检请求在 `authMiddleware` 之前处理。

#### 修改文件
```
gateway.ts
```

#### 实施步骤

**Step 1: 分析当前注册顺序**
- 找到 `authMiddleware` 和 `protected_.options` 的注册位置
- 确认当前 `options` 注册在 auth 之后

**Step 2: 调整注册顺序**
```typescript
// 修复前 (错误顺序)
app.use('/v1/*', authMiddleware);
app.options('/v1/projects', protected_.options);

// 修复后 (正确顺序)
app.options('/v1/projects', protected_.options); // ← OPTIONS 优先注册
app.use('/v1/*', authMiddleware);
```

**Step 3: 验证所有受保护路由的 OPTIONS**
- 检查 `/v1/projects`、`/v1/generate-components`、`/v1/chat` 等路由
- 确保所有需要 CORS 的端点都有对应 OPTIONS 处理

**Step 4: 回归测试**
- GET 请求不受影响
- POST/PUT/DELETE 请求 CORS 正常
- 认证流程不变

#### 验收标准
- [ ] `OPTIONS /v1/projects` 返回 204
- [ ] `Access-Control-Allow-Origin: *` header 存在
- [ ] OPTIONS 不返回 401
- [ ] GET / POST / PUT / DELETE 请求测试通过

#### 负责人
dev

---

### Epic 2: Canvas Context 多选修复（0.3h）

#### 目标
修复 `BoundedContextTree.tsx` 中 checkbox 的 `onChange` 绑定错误。

#### 修改文件
```
src/components/BoundedContextTree.tsx
```

#### 实施步骤

**Step 1: 定位问题代码**
```tsx
// 当前错误代码
<input
  type="checkbox"
  checked={isSelected}
  onChange={toggleContextNode}  // ← 错误：应该是 onToggleSelect
/>
```

**Step 2: 修复 onChange**
```tsx
<input
  type="checkbox"
  checked={isSelected}
  onChange={() => onToggleSelect(node.id)}  // ← 修复：调用正确的 handler
/>
```

**Step 3: 验证不影响其他功能**
- 确认 `toggleContextNode`（右键菜单）功能不受影响
- 确认批量选择/全选功能正常

#### 验收标准
- [ ] 点击 checkbox 触发 `onToggleSelect`
- [ ] `selectedNodeIds` 状态正确更新
- [ ] `toggleContextNode` 不被 checkbox 调用
- [ ] 手动测试 checkbox 选择功能通过

#### 负责人
dev

---

### Epic 3: generate-components flowId（0.3h）

#### 目标
修复 AI schema 缺少 `flowId` 字段，prompt 未要求输出。

#### 修改文件
```
src/schema.ts       (或 AI prompt 相关文件)
src/prompts/xxx.ts  (prompt 模板)
```

#### 实施步骤

**Step 1: 修改 AI schema**
```typescript
// 添加 flowId 字段
interface GeneratedComponent {
  flowId: string;      // 新增，必填
  name: string;
  schema: object;
  prompt: string;
}
```

**Step 2: 修改 prompt 模板**
```text
请生成以下字段:
- flowId: 格式 "flow-{uuid}"，请生成唯一 ID
- name: 组件名称
- schema: JSON Schema
- prompt: 组件提示词

确保 flowId 不为空。
```

**Step 3: 后端处理**
```typescript
// 如果 AI 未返回 flowId，后端兜底生成
const flowId = component.flowId || `flow-${crypto.randomUUID()}`;
```

**Step 4: 验证输出**
- 测试调用 `generate-components`
- 确认返回的 `flowId` 格式正确且不是 "unknown"

#### 验收标准
- [ ] schema 定义包含 `flowId: string`
- [ ] prompt 明确要求输出 flowId
- [ ] API 响应中 `flowId` 不是 "unknown"
- [ ] `expect(flowId).toMatch(/^flow-/)` 测试通过

#### 负责人
dev

---

## Sprint 2: P1 改进

### Epic 4: SSE 超时 + 连接清理（1.5h）

#### 目标
为 `aiService.chat()` 添加 10 秒超时控制，并确保 `cancel()` 时清理所有 timer。

#### 修改文件
```
src/services/aiService.ts
src/routes/v1/chat.ts
```

#### 实施步骤

**Step 1: 添加 AbortController 超时包装**

```typescript
// aiService.ts
export async function chat(options: ChatOptions): Promise<ReadableStream> {
  const controller = new AbortController();
  
  // 设置 10s 超时
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, 10_000);

  try {
    const stream = await openai.chat.completions.create({
      ...options,
      signal: controller.signal,
      stream: true,
    });

    return new ReadableStream({
      start(controller) {
        // 收集 chunks...
      },
      cancel() {
        // 清理超时 timer
        clearTimeout(timeoutId);
        // 清理其他资源...
      }
    });
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}
```

**Step 2: 前端 SSE 取消处理**

```typescript
// 前端调用处
const eventSource = new EventSource('/v1/chat', { signal: abortController.signal });
eventSource.onmessage = (e) => { /* 处理消息 */ };
eventSource.onerror = () => { /* 错误处理 */ };
```

**Step 3: 测试超时场景**
- Mock OpenAI 响应延迟 > 10s
- 验证超时后 `controller.close()` 被调用

**Step 4: 测试 cancel 清理**
- 手动取消 SSE 流
- 验证 `clearTimeout` 被调用

#### 验收标准
- [ ] `AbortController.timeout(10000)` 配置正确
- [ ] 10s 无响应时 ReadableStream 正常关闭
- [ ] `cancel()` 调用 `clearTimeout`
- [ ] Worker 不挂死

#### 负责人
dev

---

### Epic 5: 分布式限流（1.5h）

#### 目标
将内存 Map 限流改为 Cache API，跨 Worker 共享限流计数。

#### 修改文件
```
src/middleware/rateLimit.ts
wrangler.toml
```

#### 实施步骤

**Step 1: 替换存储实现**

```typescript
// rateLimit.ts (修复前: 内存 Map)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

// rateLimit.ts (修复后: Cache API)
export async function checkRateLimit(userId: string, endpoint: string): Promise<{
  allowed: boolean;
  remaining: number;
  resetAt: number;
}> {
  const cacheKey = `rate:${userId}:${endpoint}`;
  const cache = caches.default;

  const cached = await cache.match(cacheKey);
  
  if (cached) {
    const data = await cached.json();
    if (Date.now() < data.resetAt) {
      if (data.count >= LIMIT) {
        return { allowed: false, remaining: 0, resetAt: data.resetAt };
      }
      data.count++;
      // 更新缓存 TTL
      await cache.put(cacheKey, new Response(JSON.stringify(data), {
        headers: { 'Cache-Control': 'max-age=60' }
      }));
      return { allowed: true, remaining: LIMIT - data.count, resetAt: data.resetAt };
    }
  }

  // 新建
  const resetAt = Date.now() + 60_000;
  await cache.put(cacheKey, new Response(JSON.stringify({ count: 1, resetAt }), {
    headers: { 'Cache-Control': 'max-age=60' }
  }));
  return { allowed: true, remaining: LIMIT - 1, resetAt };
}
```

**Step 2: 确认 wrangler.toml 配置**

```toml
# wrangler.toml
compatibility_flags = ["cloudflare_challenge_on_unknown_environment_variable"]
# Cache API 默认启用，无需额外配置
```

**Step 3: 并发测试**
- 100 并发请求验证限流一致
- 确认多 Worker 下计数共享

#### 验收标准
- [ ] `caches.default` 可用
- [ ] 限流接口不变（`checkRateLimit` 返回值不变）
- [ ] 100 并发请求，限流计数一致
- [ ] 后续请求返回 429

#### 负责人
dev

---

### Epic 6: test-notify 去重（1h）

#### 目标
为 `test-notify` 添加 5 分钟去重窗口，避免重复通知。

#### 修改文件
```
src/utils/dedup.js
src/routes/v1/test-notify.ts
```

#### 实施步骤

**Step 1: 实现去重模块**

```javascript
// dedup.js
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

const CACHE_FILE = '.dedup-cache.json';
const WINDOW_MS = 5 * 60 * 1000; // 5 分钟

async function loadCache() {
  try {
    const data = await readFile(CACHE_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return {};
  }
}

async function saveCache(cache) {
  await writeFile(CACHE_FILE, JSON.stringify(cache, null, 2));
}

export async function checkDedup(eventId) {
  const cache = await loadCache();
  const entry = cache[eventId];

  if (entry && Date.now() - entry.sentAt < WINDOW_MS) {
    return { skipped: true };
  }

  return { skipped: false };
}

export async function recordSend(eventId) {
  const cache = await loadCache();
  
  // 清理过期项
  const now = Date.now();
  for (const [key, val] of Object.entries(cache)) {
    if (now - val.sentAt >= WINDOW_MS) {
      delete cache[key];
    }
  }

  cache[eventId] = { sentAt: now };
  await saveCache(cache);
}
```

**Step 2: 集成到 test-notify 路由**

```typescript
// test-notify.ts
import { checkDedup, recordSend } from '../utils/dedup';

app.post('/v1/test-notify', async (c) => {
  const { eventId, payload } = await c.req.json();

  const { skipped } = await checkDedup(eventId);
  if (skipped) {
    return c.json({ skipped: true });
  }

  await sendWebhook(payload);
  await recordSend(eventId);

  return c.json({ sent: true });
});
```

**Step 3: 测试覆盖**

```typescript
// dedup.test.js
describe('Dedup', () => {
  it('5 分钟内重复调用跳过', async () => {
    const eventId = 'evt-test-001';
    await recordSend(eventId);
    const result = await checkDedup(eventId);
    expect(result.skipped).toBe(true);
  });

  it('5 分钟后重置', async () => {
    jest.useFakeTimers();
    const eventId = 'evt-test-002';
    await recordSend(eventId);
    jest.advanceTimersByTime(5 * 60 * 1000 + 1);
    const result = await checkDedup(eventId);
    expect(result.skipped).toBe(false);
  });
});
```

#### 验收标准
- [ ] `dedup.js` 模块独立可用
- [ ] 5 分钟内重复调用返回 `{ skipped: true }`
- [ ] 5 分钟后重置
- [ ] 状态持久化到 `.dedup-cache.json`

#### 负责人
dev

---

## Sprint 总结

| Sprint | Epic | 状态 | 验收标准 |
|--------|------|------|----------|
| Sprint 1 | E1: OPTIONS 预检 | 1.1h | 204 + CORS headers |
| Sprint 1 | E2: Canvas 多选 | 0.3h | checkbox 正确调用 onToggleSelect |
| Sprint 1 | E3: flowId 修复 | 0.3h | flowId 不是 unknown |
| Sprint 2 | E4: SSE 超时 | 1.5h | 10s 超时 + cancel 清理 |
| Sprint 2 | E5: 分布式限流 | 1.5h | Cache API 限流一致 |
| Sprint 2 | E6: test-notify 去重 | 1h | 5 分钟去重窗口 |

---

## 测试计划

| 测试类型 | 范围 | 工具 |
|----------|------|------|
| 单元测试 | E1-E6 各模块 | Jest |
| 集成测试 | E5 限流并发 | Jest + supertest |
| E2E 测试 | E1 OPTIONS/E6 去重 | Playwright |
| 手动测试 | E2 checkbox 交互 | — |

### CI 门禁

- 所有 PR 必须通过 Jest 测试
- E2E 测试在 CI 环境可运行（修复 pre-existing 测试污染）
- 覆盖率 > 80%

---

## 部署计划

| 阶段 | 操作 | 验证 |
|------|------|------|
| 1. 本地测试 | `npm test` 全量通过 | 覆盖率 > 80% |
| 2. Staging 部署 | `wrangler deploy --env staging` | Staging 环境测试 |
| 3. 回归验证 | 手动测试核心功能 | 无回归 |
| 4. 生产部署 | `wrangler deploy` | 监控无异常 |

---

*文档版本: v1.0 | 最后更新: 2026-04-06*
