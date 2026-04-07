# Dev Proposals 2026-04-08

> **分析范围**: vibex-backend (Hono/Cloudflare Workers + TypeScript)
> **重点**: backend/Worker 相关代码审查

## 提案列表

| ID | 类别 | 问题/优化点 | 优先级 |
|----|------|-------------|--------|
| D-P0-1 | Bug | CollaborationService lock TTL 未实际生效 | P0 |
| D-P0-2 | Bug | WebSocket ConnectionPool 使用 `setInterval` 在 CF Workers 中不工作 | P0 |
| D-P0-3 | Bug | NotificationService 使用 `fs.*` 文件系统 API，CF Workers 不支持 | P0 |
| D-P1-1 | Bug | auth middleware 在 JWT_SECRET 缺失时静默放行请求 | P1 |
| D-P1-2 | Bug | Canvas SSE stream buffer 分割逻辑有边界 case bug | P1 |
| D-P1-3 | Bug | CollaborationService `acquireLock` 复写已存在 lock 时不重置 TTL | P1 |
| D-P2-1 | Feature | 实现 LLM Provider retry 逻辑（配置已存在但未使用） | P2 |
| D-P2-2 | Feature | AI Service cache 跨 Worker 实例同步（当前 in-memory 不共享） | P2 |
| D-P2-3 | Feature | Auth endpoints 添加 rate limit 保护 | P2 |
| D-P2-4 | Feature | generateId 替换为 CUID2 或 nanoid（当前实现碰撞风险高） | P2 |
| D-P2-5 | Refactor | ConnectionPool/MessageRouter 全局单例改为依赖注入 | P2 |
| D-P2-6 | Refactor | 清理 `llm-provider.ts.backup-*` 等废弃文件 | P2 |
| D-P2-7 | Test | 为 CollaborationService/NotificationService/MessageRouter 补充单元测试 | P2 |
| D-P2-8 | Refactor | AI Design Chat SSE buffer 重构为行缓冲而非累积 buffer | P2 |

---

## 详细提案

### D-P0-1: CollaborationService lock TTL 未实际生效

**问题描述**:
`CollaborationService` 的 `acquireLock` 方法每次调用都会覆写 lock 文件，但 `acquiredAt` 时间戳被设为新时间，导致 TTL 无法正确反映 lock 的"最后活跃时间"。真正的问题在于：`acquireLock` 应该在 lock 已存在且有效时**拒绝覆写**（乐观锁），或者在已存在时**刷新 TTL**。当前实现两件事都没做对：
- 如果 lock 文件已存在，直接覆写，不检查是否过期
- TTL 比较在 `hasLock` 中做，但 `acquireLock` 没有调用它

**影响范围**:
- 高并发场景下，多个请求可能相互覆写 lock
- `validateLock` 可能因为 TTL 计算错误导致误判

**代码位置**:
`vibex-backend/src/services/CollaborationService.ts`

**建议方案**:
```typescript
async acquireLock(projectId: string, stageId: string, ttlMs = 300_000): Promise<void> {
  // 先检查是否存在有效 lock
  if (await this.hasLock(projectId, stageId)) {
    throw new Error(`Lock already held for ${projectId}/${stageId}`);
  }
  await fs.mkdir(this.lockDir, { recursive: true });
  const lockFile = this.lockPath(projectId, stageId);
  const content = JSON.stringify({ projectId, stageId, acquiredAt: Date.now(), ttlMs });
  await fs.writeFile(lockFile, content, 'utf-8');
}

// 新增: 刷新 lock TTL（用于长时间操作）
async refreshLock(projectId: string, stageId: string): Promise<void> {
  const lockFile = this.lockPath(projectId, stageId);
  const raw = await fs.readFile(lockFile, 'utf-8');
  const lock = JSON.parse(raw);
  lock.acquiredAt = Date.now(); // 刷新时间
  await fs.writeFile(lockFile, JSON.stringify(lock), 'utf-8');
}
```

---

### D-P0-2: ConnectionPool 使用 `setInterval` 在 Cloudflare Workers 中不工作

**问题描述**:
`ConnectionPool.startHeartbeat()` 使用 `setInterval`：
```typescript
this.heartbeatTimer = setInterval(() => {
  this.checkConnections();
}, this.config.heartbeatInterval);
```
Cloudflare Workers 运行在 V8  isolate 中，**不支持 `setInterval` / `setTimeout`**。Workers 中的定时操作应使用 `scheduler.wait()` (Durable Objects) 或在每次请求时做懒检查。

**影响范围**:
- WebSocket 心跳检测完全失效
- 超时连接不会被自动清理
- 内存泄漏风险（连接对象持续堆积）

**代码位置**:
`vibex-backend/src/services/websocket/connectionPool.ts`

**建议方案**:
方案A（推荐）：改为按需检查，每次 API 调用时触发清理
```typescript
private lastCheck = 0;
private readonly CHECK_INTERVAL = 30_000; // 30s

private checkIfNeeded(): void {
  const now = Date.now();
  if (now - this.lastCheck > this.CHECK_INTERVAL) {
    this.lastCheck = now;
    this.checkConnections();
  }
}

// 在 broadcastToRoom, sendToUser 等公开方法中调用
broadcastToRoom(roomId: string, message: any): number {
  this.checkIfNeeded(); // 每次广播时顺便检查
  // ...existing logic
}
```

方案B：如果需要真正的后台任务，使用 Cloudflare Cron Trigger 触发 Durable Object 的清理方法。

---

### D-P0-3: NotificationService 使用 `fs.*` 文件系统 API，CF Workers 不支持

**问题描述**:
`NotificationService` 使用 `fs.readFile/writeFile` 存储去重缓存：
```typescript
private async loadCache(): Promise<void> {
  const raw = await fs.readFile(this.cachePath, 'utf-8');
  // ...
}
private async saveCache(): Promise<void> {
  await fs.writeFile(this.cachePath, JSON.stringify(entries), 'utf-8');
}
```
Cloudflare Workers **没有本地文件系统**。这段代码在 Workers 环境中会直接抛出异常。

**影响范围**:
- 通知去重完全失效（缓存无法加载/保存）
- 每次请求都会尝试重新发送通知

**代码位置**:
`vibex-backend/src/services/NotificationService.ts`

**建议方案**:
改用 Cloudflare KV 存储：
```typescript
import { KV } from '@cloudflare/workers-types';

export class NotificationService {
  private kv: KVNamespace;
  
  constructor(kv: KVNamespace, ttlMs = DEFAULT_TTL_MS) {
    this.kv = kv;
    this.ttlMs = ttlMs;
  }

  private computeKey(channel: string, text: string): string {
    return crypto.createHash('sha256').update(`${channel}:${text}`).digest('hex');
  }

  isDuplicate(channel: string, text: string): boolean {
    const key = this.computeKey(channel, text);
    const cached = this.kv.get(key);
    return cached !== null;
  }

  async send(notification: SlackNotification): Promise<...> {
    const key = this.computeKey(notification.channel, notification.text);
    const existing = await this.kv.get(key);
    if (existing) return { skipped: true };
    await this.kv.put(key, JSON.stringify({ sentAt: Date.now() }), {
      expirationTtl: Math.floor(this.ttlMs / 1000)
    });
    // ...send to Slack
  }
}
```

---

### D-P1-1: auth middleware 在 JWT_SECRET 缺失时静默放行请求

**问题描述**:
在 `auth.ts` 的 `verifyToken` 中：
```typescript
export function verifyToken(token: string, jwtSecret: string): JWTPayload | null {
  if (!jwtSecret) {
    return null;  // 返回 null 但没有任何告警
  }
  // ...
}
```
当 `JWT_SECRET` 未配置时，所有请求都会获得 `null` user。如果后续的 route handler 没有正确检查 `user !== null`，请求会被静默放行，产生安全风险。

**影响范围**:
- JWT_SECRET 未配置时所有受保护 API 裸奔
- 难以在运行时发现配置缺失

**代码位置**:
`vibex-backend/src/lib/auth.ts`

**建议方案**:
```typescript
export function verifyToken(token: string, jwtSecret: string): JWTPayload | null {
  if (!jwtSecret) {
    // 启动时检查一次，防止每次请求都打日志
    if (process.env.NODE_ENV !== 'test') {
      console.error('[AUTH] FATAL: JWT_SECRET is not configured!');
    }
    return null;
  }
  // ...
}

// authMiddleware 中增强检查
export async function authMiddleware(c: AuthContext, next: Next) {
  if (!c.env.JWT_SECRET) {
    return c.json({ error: 'Server misconfigured: JWT_SECRET missing' }, 500);
  }
  // ... existing logic
}
```

---

### D-P1-2: Canvas SSE stream buffer 分割逻辑有边界 case bug

**问题描述**:
`ai-design-chat.ts` 中的 SSE buffer 处理：
```typescript
buffer += decoder.decode(value, { stream: true });
const lines = buffer.split('\n');
buffer = lines.pop() || '';  // ← 最后一个不完整的行留在 buffer
```
问题：`lines.pop()` 取走最后一项，但如果最后一项是**空字符串**（buffer 以换行结尾），会错误地把倒数第二行当作未处理完的片段。如果 `buffer` 为空字符串，`pop()` 返回 `undefined`，`|| ''` 使 `buffer = ''`，正常。但如果最后一行是不完整的 chunk（如 `data: {"content": "hel` 没有闭合），该逻辑正确保留，但需要确保外层 `try-catch` 能处理。

更严重的问题在 `prototype-collaboration.ts` 等流式处理：使用 `for await...of streamFromMiniMax`，但当 API 返回错误时可能生成无效的 SSE 格式。

**影响范围**:
- 流式响应可能出现乱序或截断
- 错误响应的 SSE 格式不规范

**代码位置**:
`vibex-backend/src/routes/ai-design-chat.ts`

**建议方案**:
改为行缓冲（逐行处理），确保完整的 SSE 行才处理：
```typescript
const reader = response.body.getReader();
const decoder = new TextDecoder();
let lineBuffer = '';

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const chunk = decoder.decode(value, { stream: true });
  lineBuffer += chunk;

  // 按行分割
  let newlineIndex;
  while ((newlineIndex = lineBuffer.indexOf('\n')) !== -1) {
    const line = lineBuffer.slice(0, newlineIndex);
    lineBuffer = lineBuffer.slice(newlineIndex + 1);
    
    if (!line.trim()) continue; // 跳过空行
    if (!line.startsWith('data: ')) continue;
    
    const data = line.slice(6).trim();
    if (data === '[DONE]') return;
    
    try {
      const parsed = JSON.parse(data);
      if (parsed.content) yield `data: ${JSON.stringify(parsed)}\n\n`;
    } catch { /* skip */ }
  }
}
```

---

### D-P1-3: CollaborationService `acquireLock` 复写已存在 lock 时不重置 TTL

**问题描述**:
与 D-P0-1 相关但更具体：`acquireLock` 方法直接覆写 lock 文件，没有检查该 lock 是否已被其他进程持有。应该使用原子的文件操作（如 `fs.open` + `fx.excl`）来确保原子性。

**代码位置**:
`vibex-backend/src/services/CollaborationService.ts`

**建议方案**:
使用 Cloudflare 的 Durable Objects 实现分布式锁（原子性 + 跨 Worker 协调）：
```typescript
// 使用 Durable Objects 实现分布式锁
export class LockDO {
  private state: DurableObjectState;
  private lockHolder: string | null = null;
  private lockExpiry: number = 0;

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const action = url.pathname.split('/').pop();

    if (action === 'acquire') {
      const body = await request.json();
      if (this.lockHolder && Date.now() < this.lockExpiry && this.lockHolder !== body.holderId) {
        return new Response(JSON.stringify({ locked: true, holder: this.lockHolder }), { status: 409 });
      }
      this.lockHolder = body.holderId;
      this.lockExpiry = Date.now() + body.ttlMs;
      return new Response(JSON.stringify({ locked: false }));
    }
    // ... release, refresh
  }
}
```

---

### D-P2-1: 实现 LLM Provider retry 逻辑

**问题描述**:
`ProviderConfig` 中定义了 `retryAttempts: number`，但在 `llm-provider.ts` 中未实现重试逻辑。API 调用失败时直接抛出异常，没有指数退避重试。

**建议方案**:
```typescript
async chatWithRetry(options: LLMRequestOptions, attempt = 0): Promise<LLMResponse> {
  try {
    return await this.chat(options);
  } catch (error) {
    const maxRetries = this.config.retryAttempts ?? 3;
    if (attempt >= maxRetries) throw error;
    
    // 指数退避：1s, 2s, 4s
    const delay = Math.pow(2, attempt) * 1000;
    await new Promise(r => setTimeout(r, delay));
    return this.chatWithRetry(options, attempt + 1);
  }
}
```

---

### D-P2-2: AI Service cache 跨 Worker 实例同步

**问题描述**:
`AIService` 使用 `Map<string, { data, expiry }>` 做缓存，在多 Worker 实例场景下完全不共享。导致：
- 同一 prompt 可能在不同 Worker 被重复调用
- 缓存一致性问题

**建议方案**:
使用 Cloudflare Cache API（边缘缓存）：
```typescript
const cache = caches.default;

private async executeWithFallback<T>(...): Promise<AIResult<T>> {
  if (cacheKey) {
    const cached = await cache.match(cacheKey);
    if (cached) {
      const data = await cached.json();
      return { success: true, data, provider: this.config.defaultProvider, latency: 0 };
    }
  }
  // ... execute and cache
  const response = new Response(JSON.stringify(result));
  await cache.put(cacheKey, response, { expirationTtl: this.config.cacheTTL });
}
```

---

### D-P2-3: Auth endpoints 添加 rate limit

**当前状态**:
`gateway.ts` 中的 `rateLimit` 中间件对 `/v1/auth/*` 路由可能生效（取决于注册顺序），但 `/auth/login` 和 `/auth/register` 应该使用更宽松的限制。

**建议方案**:
对 auth 路由使用独立的 rate limit 配置：
```typescript
v1.route('/auth', rateLimit({
  limit: 10,  // 更严格：10次/分钟
  window: 60_000,
  keyBy: 'ip',
  message: 'Too many auth attempts',
}, authRateLimitKV), auth);
```

---

### D-P2-4: generateId 替换为 CUID2

**问题描述**:
当前 `generateId()` 使用 `Date.now().toString(36) + Math.random()`：
```typescript
export function generateId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `c${timestamp}${random}`;
}
```
- `Math.random()` 不是加密安全的
- 格式不符合 CUID2 规范
- 长度不够（碰撞概率在高并发下不可忽略）

**建议方案**:
```typescript
// 使用 @paralleldrive/cuid2
import { createId } from '@paralleldrive/cuid2';
export function generateId(): string {
  return createId(); // 默认22字符， Crockford base32，碰撞概率极低
}
```

---

### D-P2-5: ConnectionPool/MessageRouter 全局单例改为依赖注入

**问题描述**:
```typescript
let globalConnectionPool: ConnectionPool | null = null;
export function getConnectionPool(): ConnectionPool {
  if (!globalConnectionPool) {
    globalConnectionPool = new ConnectionPool();
  }
  return globalConnectionPool;
}
```
全局单例在以下场景有问题：
1. 测试时无法替换 mock 实例
2. Cloudflare Workers 热重启时状态不一致
3. 无法配置不同实例的不同参数

**建议方案**:
通过 Hono 的 context 或 DI 容器注入：
```typescript
// 在 gateway.ts 中创建并注入
const connectionPool = new ConnectionPool({ maxConnections: 200 });
const messageRouter = new MessageRouter(connectionPool);

// 通过 c.set 注入到请求上下文
v1.use('*', async (c, next) => {
  c.set('connectionPool', connectionPool);
  c.set('messageRouter', messageRouter);
  await next();
});
```

---

### D-P2-6: 清理废弃文件

**问题描述**:
存在废弃备份文件：
- `vibex-backend/src/services/llm-provider.ts.backup-20260315235610`
- 可能的 `node_modules/.cache` 中的旧构建产物

**建议方案**:
```bash
find vibex-backend/src -name "*.backup-*" -delete
find vibex-backend/src -name "*.orig" -delete
```

---

### D-P2-7: 为 CollaborationService/NotificationService/MessageRouter 补充单元测试

**问题描述**:
这三个关键服务的测试覆盖率接近 0。

**建议方案**:
```typescript
// CollaborationService.test.ts
describe('CollaborationService', () => {
  it('should prevent concurrent lock acquisition', async () => { ... });
  it('should release lock after TTL expires', async () => { ... });
  it('should allow re-acquire after release', async () => { ... });
});

// NotificationService.test.ts
describe('NotificationService', () => {
  it('should deduplicate within TTL window', async () => { ... });
  it('should allow after TTL expires', async () => { ... });
});
```

---

### D-P2-8: AI Design Chat SSE buffer 重构为行缓冲

**问题描述**:
D-P1-2 的详细方案。当前 SSE buffer 处理依赖字符串累积 + `split('\n')` + `pop()`，不够健壮。

**建议方案**:
见 D-P1-2 建议方案中的行缓冲实现。

---

## 优先级汇总

| 优先级 | 数量 | 提案 ID |
|--------|------|---------|
| P0 | 3 | D-P0-1, D-P0-2, D-P0-3 |
| P1 | 3 | D-P1-1, D-P1-2, D-P1-3 |
| P2 | 8 | D-P2-1 ~ D-P2-8 |

**P0 必须在本月内修复**，涉及 Cloudflare Workers 运行时兼容性（P0-2、P0-3）和数据竞争（P0-1）。
