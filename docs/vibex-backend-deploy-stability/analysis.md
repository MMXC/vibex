# VibeX Backend Deploy Stability + OPTIONS 500 分析

> **分析日期**: 2026-04-05
> **分析者**: analyst agent
> **项目**: vibex-backend-deploy-stability + vibex-backend-p0-20260405（合并版）

---

## 1. 执行摘要

VibeX 后端部署在 Cloudflare Workers + D1 上，架构清晰但存在 **7 个关键风险**，其中 3 个 P0 需立即修复：

| 风险 | 级别 | 状态 |
|------|------|------|
| OPTIONS 500 — authMiddleware 拦截预检 | **P0** | ⚠️ 今日发生 |
| SSE AI 调用无超时 | **P0** | 🔴 未修复 |
| 内存 RateLimit 跨实例不共享 | **P0** | 🔴 未修复 |
| JWT_SECRET 缺失返回 500 | P1 | 🔴 未修复 |
| 无 Health Check 端点 | P1 | ⚠️ 部分实现 |
| SSE 连接关闭无清理 | P2 | 🔴 未修复 |
| Prisma PoolManager 不适配 Workers | P2 | 🔴 未修复 |

---

## 2. 问题详解

### 2.1 P0: OPTIONS 500（Cloudflare 1101）

**现象**: 浏览器 CORS 预检请求返回 HTTP 500，阻止所有跨域 POST/PUT/DELETE。

**根因链路**:

```
OPTIONS /api/v1/projects
    ├─[1] index.ts: app.use('*', cors()) → 设置 headers → 返回 204 ✅
    └─[2] gateway.ts: v1.options('/*', ...) → 设置 Allow-Methods
           └─[3] protected_.options('/*', ...)
                  ↑
                  │ ❌ authMiddleware 在此之前拦截！
                  │     authHeader 为空 → 401
                  │     → Cloudflare 1101 (Worker 内部错误)
```

**代码证据** (`src/routes/v1/gateway.ts`):
```typescript
// 第 111 行：authMiddleware 先注册
protected_.use('*', authMiddleware);

// 第 119 行：OPTIONS handler 后注册 — 永远不执行！
protected_.options('/*', (c) => {
  return c.text('', 204);
});
```

**额外风险 — JWT_SECRET 缺失** (`src/lib/auth.ts`):
```typescript
if (!jwtSecret) {
  return c.json(
    { success: false, error: 'Server configuration error', code: 'INTERNAL_ERROR' },
    500  // ← 返回 500 而非 401
  );
}
```

**最小修复**（~0.5h，推荐立即执行）:
```typescript
// gateway.ts — 调整注册顺序
const protected_ = new Hono<{ Bindings: CloudflareEnv }>();

// ✅ OPTIONS 必须先注册！
protected_.options('/*', (c) => {
  c.res.headers.set('Access-Control-Allow-Origin', '*');
  c.res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  c.res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return c.text('', 204);
});

// 然后才是 authMiddleware
protected_.use('*', authMiddleware);
```

**验证命令**:
```bash
curl -X OPTIONS 'https://api.vibex.top/v1/projects' \
  -H 'Origin: https://vibex-app.pages.dev' \
  -H 'Access-Control-Request-Method: POST' -v
# → HTTP 204 + CORS headers ✅
```

---

### 2.2 P0: SSE 流无超时

**文件**: `src/lib/sse-stream-lib/index.ts`

```typescript
export function buildSSEStream({ requirement, env }: SSEStreamOptions): ReadableStream {
  return new ReadableStream({
    async start(controller) {
      // AI 调用无 timeout
      const stage1Result = await aiService.chat(stage1Prompt);
      // ❌ 无 .catch()，无 AbortSignal
      // ❌ setTimeout 未在 cancel() 中清理
```

**问题**:
- `aiService.chat()` 无超时控制，AI 服务慢/挂死时 Worker 无限期等待
- `controller.close()` 未在 AbortSignal 上绑定，客户端断开后 SSE 流继续
- `setTimeout` 计时器未清理

**修复方案**（~1h）:
```typescript
export function buildSSEStream({ requirement, env }: SSEStreamOptions): ReadableStream {
  return new ReadableStream({
    start(controller) {
      // 设置 5s 超时
      const timeoutId = setTimeout(() => {
        controller.close();
      }, 5000);

      // AbortSignal 清理
      return new Promise(async (resolve) => {
        try {
          // ... SSE 逻辑
        } finally {
          clearTimeout(timeoutId);
        }
      });
    },
    cancel() {
      // 清理计时器
      clearTimeout(timeoutId);
    }
  });
}
```

---

### 2.3 P0: 内存 RateLimit 跨实例不共享

**文件**: `src/lib/rateLimit.ts`

```typescript
class RateLimitStore {
  private store = new Map<string, { count: number; resetTime: number }>();
}
const store = new RateLimitStore(); // ❌ 单例，内存存储
```

**问题**: Cloudflare Workers 每个实例有独立内存，限流计数器在各 Worker 间**不共享**。

**修复方案**（~1.5h）: 使用 Workers Cache API：
```typescript
const cacheKey = `ratelimit:${key}`;
const cached = await caches.default.match(cacheKey);
// 或使用 KV：await env.RATE_LIMIT_KV.get(key)
```

---

## 3. 推荐修复优先级

| 优先级 | 修复项 | 工时 | 收益 |
|--------|--------|------|------|
| 1 | OPTIONS 预检修复 | 0.5h | 立即解除 CORS 阻塞 |
| 2 | SSE 超时控制 | 1h | 防止 Worker 挂死 |
| 3 | 分布式限流 | 1.5h | API 滥用防护 |
| 4 | Health Check | 0.5h | 部署验证 |
| 5 | JWT_SECRET 500 改 401 | 0.3h | 错误码规范 |

**总工时**: ~4h（P0 约 3h）

---

## 4. 验收标准

| ID | 标准 | 验证方法 |
|----|------|----------|
| AC1 | OPTIONS `/api/v1/projects` 返回 204 | `curl -X OPTIONS -I https://api.vibex.top/v1/projects` |
| AC2 | OPTIONS 响应含 CORS headers | 检查 `Access-Control-Allow-*` 存在 |
| AC3 | OPTIONS 无认证时返回 204（非 401/500）| `curl -X OPTIONS -v https://api.vibex.top/v1/projects` |
| AC4 | SSE 流 10s 无响应自动关闭 | curl 断开发送，计时验证 |
| AC5 | Rate limit 在多 Worker 间一致 | 并发压测验证计数 |
| AC6 | GET /health 返回 200 | 部署后 curl 验证 |

---

## 5. 风险矩阵

| 风险 | 概率 | 影响 | 缓解 |
|------|------|------|------|
| OPTIONS 修复破坏其他路由 | 低 | 高 | 仅调整顺序，充分测试 |
| SSE 超时误杀长请求 | 中 | 低 | 超时设 5s，正常请求 < 3s |
| Cache API 部署需额外配置 | 中 | 低 | wrangler 默认启用 |

---

## 6. 依赖关系

```
vibex-api-retry-circuit (P1 提案)
  → 依赖 Health Check 端点存在
  → 依赖 SSE 稳定性修复
```

---

## 7. 相关文件

| 文件 | 修改类型 |
|------|----------|
| `src/routes/v1/gateway.ts` | 修复（调整 OPTIONS 顺序）|
| `src/lib/sse-stream-lib/index.ts` | 修复（添加超时）|
| `src/lib/rateLimit.ts` | 修复（迁移到 Cache API）|
| `src/index.ts` | 增强（CORS 显式 OPTIONS + NODE_ENV 检测）|
| `src/lib/auth.ts` | 增强（JWT_SECRET 缺失返回 401）|

---

**结论**: 后端架构良好，但 OPTIONS 500 是 P0 紧急问题（今日发生），需立即修复。SSE 超时和限流跨实例不共享是系统性风险，建议在 4h 内完成全部修复。
