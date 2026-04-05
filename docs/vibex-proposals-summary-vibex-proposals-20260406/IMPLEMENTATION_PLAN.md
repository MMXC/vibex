# 实施计划: vibex-proposals-summary-vibex-proposals-20260406

> **项目**: vibex-proposals-summary-vibex-proposals-20260406
> **版本**: v1.0
> **作者**: architect agent
> **日期**: 2026-04-06
> **状态**: 已采纳

---

## 概览

本计划覆盖 6 个 Epic (E1–E6) 及 2 个并行提案的完整实施路径，分为 2 个 Sprint，总工时 **6.1h**。

| Sprint | 周期 | 目标 | 工时 |
|--------|------|------|------|
| Sprint 1 | 2026-04-06 | P0 Bug 修复，解除阻塞 | 1.1h |
| Sprint 2 | 2026-04-07 | P1 稳定性改进 | 4h |
| 并行任务 | 全程 | E2E 测试修复 + 组件合并 | 3h |

---

## Sprint 1 — P0 修复 (2026-04-06)

### E1: OPTIONS 预检路由修复

**目标**: 解除所有跨域 POST/PUT/DELETE 请求的阻塞

**修改文件**:
- `src/gateway.ts`

**实施步骤**:

1. 定位 `gateway.ts` 中 `protected_.options` 和 `authMiddleware` 的注册位置
2. 将 `protected_.options(handler)` 移动到 `authMiddleware` 之前
3. 确认 OPTIONS handler 正确设置 CORS headers:
   ```typescript
   protected_.options(async (c) => {
     c.header('Access-Control-Allow-Origin', '*');
     c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
     c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
     c.status(204);
     return;
   });
   ```
4. 回归验证 GET/POST/PUT/DELETE 路由不受影响

**验收测试**:
```bash
# 验证 OPTIONS 返回 204
curl -X OPTIONS -I https://<domain>/v1/projects
# 期望: HTTP/1.1 204 + Access-Control-Allow-Origin: *

# 验证 GET 不受影响
curl https://<domain>/v1/projects -H "Authorization: Bearer <token>"
# 期望: 200 或 401，非 500
```

**DoD**:
- [ ] `gateway.ts` 中 OPTIONS handler 在 authMiddleware 之前
- [ ] `curl -X OPTIONS -I /v1/projects` → 204
- [ ] GET/POST 回归测试通过

---

### E2: Canvas Context 多选修复

**目标**: 恢复 Canvas checkbox 多选功能

**修改文件**:
- `src/components/BoundedContextTree.tsx`

**实施步骤**:

1. 找到 checkbox 的 `onChange` 属性
2. 将 `onChange={toggleContextNode}` 改为 `onChange={() => onToggleSelect(node.id)}`
3. 确认 `onToggleSelect` 已在 props 中正确传递
4. 回归验证 `toggleContextNode` (节点展开/折叠) 不受影响

**验收测试**:
```typescript
// Jest 单元测试
const onToggleSelect = jest.fn();
render(<BoundedContextTree onToggleSelect={onToggleSelect} ... />);
fireEvent.click(screen.getByRole('checkbox', { name: /node-1/i }));
expect(onToggleSelect).toHaveBeenCalledWith('node-1');
expect(toggleContextNode).not.toHaveBeenCalled();
```

**DoD**:
- [ ] checkbox `onChange` 改为 `onToggleSelect`
- [ ] `onToggleSelect` 正确维护 `selectedNodeIds`
- [ ] 节点展开/折叠功能不受影响

---

### E3: generate-components flowId 修复

**目标**: AI 输出包含正确 flowId

**修改文件**:
- `src/services/ai-schema.ts` (或 AI prompt 配置文件)
- `src/prompts/generate-components.md` (或 prompt 字符串)

**实施步骤**:

1. 在 AI schema 中添加 `flowId` 字段:
   ```typescript
   const componentSchema = z.object({
     id: z.string(),
     name: z.string(),
     flowId: z.string().describe('The ID of the flow this component belongs to'),
     // ... other fields
   });
   ```
2. 在 prompt 中明确要求 flowId 输出:
   ```
   For each component, include the flowId field that matches the current flow.
   The flowId should follow the pattern: flow-<uuid>.
   ```
3. 验证 AI 输出包含非 `unknown` 的 flowId

**验收测试**:
```typescript
const response = await generateComponents({ flowId: 'flow-123', ... });
expect(response.components[0].flowId).toMatch(/^flow-/);
expect(response.components[0].flowId).not.toBe('unknown');
```

**DoD**:
- [ ] schema 包含 `flowId: string`
- [ ] prompt 明确要求 flowId
- [ ] AI 输出 flowId 符合 `/^flow-/`

---

## Sprint 2 — P1 改进 (2026-04-07)

### E4: SSE 超时 + 连接清理

**目标**: 防止 Worker 泄漏和挂死

**修改文件**:
- `src/services/aiService.ts`

**实施步骤**:

1. 使用 `AbortController.timeout()` 包装 AI 调用:
   ```typescript
   const controller = new AbortController();
   const timeoutId = setTimeout(() => controller.abort(), 10000);

   try {
     const stream = await aiService.chat({
       messages,
       signal: controller.signal,
     });
     // 流处理...
   } finally {
     clearTimeout(timeoutId);
   }
   ```
2. 在 `ReadableStream.cancel()` 回调中清理所有 timers:
   ```typescript
   const stream = new ReadableStream({
     async start(controller) {
       // ...
     },
     async cancel(reason) {
       clearTimeout(timeoutId);
       // 清理其他资源
     }
   });
   ```
3. 添加 Jest 测试覆盖超时和取消路径

**验收测试**:
```typescript
// 超时测试
jest.useFakeTimers();
const stream = aiService.chat({ timeout: 10000 });
jest.advanceTimersByTime(10001);
await expect(stream.cancel()).resolves.not.toThrow();

// 清理测试
const clearSpy = jest.spyOn(global, 'clearTimeout');
await stream.cancel();
expect(clearSpy).toHaveBeenCalled();
```

**DoD**:
- [ ] `AbortController.timeout(10000)` 包装 AI 调用
- [ ] `cancel()` 中清理所有 timers
- [ ] Jest 测试覆盖超时和取消路径

---

### E5: 分布式限流

**目标**: 限流跨 Cloudflare Workers 多实例一致

**修改文件**:
- `src/middleware/rateLimit.ts`
- `wrangler.toml` (如需要)

**实施步骤**:

1. 替换内存 Map 为 Cache API:
   ```typescript
   import { caches } from '__STATIC_CONTENT_MANIFEST';

   const CACHE_NAME = 'rate-limit-cache';
   const WINDOW_MS = 60000; // 1 minute
   const MAX_REQUESTS = 100;

   async function checkRateLimit(key: string): Promise<{
     allowed: boolean;
     remaining: number;
   }> {
     const cache = caches.default;
     const cacheKey = `RL:${key}`;
     const entry = await cache.match(cacheKey);

     let count = entry ? parseInt(await entry.text()) : 0;

     if (count >= MAX_REQUESTS) {
       return { allowed: false, remaining: 0 };
     }

     count++;
     await cache.put(
       cacheKey,
       new Response(count.toString(), {
         headers: {
           'Cache-Control': `max-age=${WINDOW_MS / 1000}`,
         },
       })
     );

     return { allowed: true, remaining: MAX_REQUESTS - count };
   }
   ```
2. 保留原有接口 `rateLimit(limit, window)` 不变
3. 确认 `wrangler.toml` 启用 Cache API:
   ```toml
   # wrangler.toml
   compatibility_flags = ["streams_enable_constructors"]
   ```

**验收测试**:
```typescript
// 并发限流测试
const results = await Promise.all(
  Array.from({ length: 100 }, () => checkRateLimit('user-1'))
);
const allowed = results.filter(r => r.allowed).length;
const denied = results.filter(r => !r.allowed).length;
// 期望: allowed ≈ 100, denied = 0 (都在限制内)
// 或: allowed = 100, 第101个 denied = true
```

**DoD**:
- [ ] `rateLimit.ts` 使用 `caches.default`
- [ ] 限流接口不变
- [ ] 多 Worker 并发测试通过

---

### E6: test-notify 去重

**目标**: 5 分钟内重复 CI webhook 不重复发送

**新增文件**:
- `scripts/dedup.js`
- `.dedup-cache.json` (自动生成)

**修改文件**:
- `scripts/test-notify.js`

**实施步骤**:

1. 创建 `scripts/dedup.js`:
   ```javascript
   const fs = require('fs');
   const path = require('path');

   const CACHE_FILE = path.join(__dirname, '..', '.dedup-cache.json');
   const WINDOW_MS = 5 * 60 * 1000; // 5 minutes

   function loadCache() {
     if (fs.existsSync(CACHE_FILE)) {
       return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
     }
     return {};
   }

   function saveCache(cache) {
     fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
   }

   function cleanExpired(cache) {
     const now = Date.now();
     for (const key of Object.keys(cache)) {
       if (now - cache[key] > WINDOW_MS) {
         delete cache[key];
       }
     }
   }

   function checkDedup(key) {
     const cache = loadCache();
     cleanExpired(cache);
     if (cache[key]) {
       return { skipped: true, reason: 'Duplicate within 5 minutes' };
     }
     return { skipped: false };
   }

   function recordSend(key) {
     const cache = loadCache();
     cleanExpired(cache);
     cache[key] = Date.now();
     saveCache(cache);
   }

   module.exports = { checkDedup, recordSend };
   ```

2. 集成到 `test-notify.js`:
   ```javascript
   const { checkDedup, recordSend } = require('./dedup');

   async function sendWebhook(url, payload) {
     const key = `${url}:${payload.sha}`;
     const dedup = checkDedup(key);

     if (dedup.skipped) {
       console.log(`[DEDUP] Skipped duplicate webhook: ${key}`);
       return { skipped: true };
     }

     await send(url, payload);
     recordSend(key);
     return { skipped: false };
   }
   ```

**验收测试**:
```javascript
const { checkDedup, recordSend } = require('./dedup');

// 第一次发送
const r1 = checkDedup('webhook:test-sha');
expect(r1.skipped).toBe(false);

// 记录
recordSend('webhook:test-sha');

// 5分钟内重复
const r2 = checkDedup('webhook:test-sha');
expect(r2.skipped).toBe(true);
```

**DoD**:
- [ ] `dedup.js` 模块实现 `checkDedup()` 和 `recordSend()`
- [ ] 5 分钟去重窗口生效
- [ ] `.dedup-cache.json` 持久化正确
- [ ] Jest 测试通过

---

## 并行任务

### 提案 A: vibex-e2e-test-fix

**目标**: 修复 Playwright in Jest 配置，使 E2E 测试可运行，建立 CI gate

**根因**: Playwright in Jest 环境配置错误 + pre-existing 测试失败

**修改文件**:
- `jest.config.js` (或相关配置)
- `tests/e2e/*.spec.ts` (可能需修复的测试)

**实施步骤**:

1. 修复 Jest + Playwright 集成配置
2. 修复 pre-existing 测试失败
3. 添加 CI gate 确保 E2E 测试始终可运行

**工时**: 2h  
**执行者**: tester + dev  
**验收条件**: Playwright tests 在 CI 中通过

---

### 提案 B: vibex-generate-components-consolidation

**目标**: 合并 `route.ts` 和 `index.ts` 中重复的 generate-components 实现

**根因**: 两套实现，Prompt 不一致

**修改文件**:
- 合并后的单一路由文件

**实施步骤**:

1. 识别 `route.ts` 和 `index.ts` 中重复逻辑
2. 统一为一个实现，合并 Prompt
3. 删除冗余代码和路由
4. 回归测试确保功能不变

**工时**: 1h  
**执行者**: dev  
**验收条件**: 单一路由处理所有 generate-components 调用，E3 测试通过

---

## Sprint 汇总

| Sprint | 内容 | 工时 | 状态 |
|--------|------|------|------|
| Sprint 1 | E1 + E2 + E3 (P0) | 1.1h | 2026-04-06 |
| Sprint 2 | E4 + E5 + E6 (P1) | 4h | 2026-04-07 |
| 并行 | 提案 A + 提案 B | 3h | 全程 |
| **合计** | | **8.1h** | |

---

## 验收追踪

| Epic | DoD 完成 | 验收人 | 日期 |
|------|----------|--------|------|
| E1 | [ ] | | |
| E2 | [ ] | | |
| E3 | [ ] | | |
| E4 | [ ] | | |
| E5 | [ ] | | |
| E6 | [ ] | | |
| 提案 A | [ ] | | |
| 提案 B | [ ] | | |

---

*文档版本: v1.0 | 最后更新: 2026-04-06*
