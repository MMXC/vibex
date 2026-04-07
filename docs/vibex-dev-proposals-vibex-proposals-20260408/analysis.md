# Requirements Analysis: vibex-backend Worker Issues & Optimization
> **项目**: vibex-dev-proposals-vibex-proposals-20260408
> **分析时间**: 2026-04-08
> **分析者**: dev agent
> **参考**: dev.md (11个提案)

---

## 1. 业务场景分析

### 1.1 项目背景
VibeX 是一个基于 Cloudflare Workers (Hono + TypeScript) 的可视化原型设计平台。backend 提供：
- Canvas 画布 API（bounded contexts、flows、components 生成）
- WebSocket 实时协作（光标同步、编辑同步）
- AI 设计助手（MiniMax 流式对话）
- 协作权限管理（PrototypeCollaboration）
- 通知系统（Slack 集成）

### 1.2 关键业务流
```
用户操作 → Hono Router → Middleware Chain → Service Layer → D1/Prisma/AI Service
                                                        ↓
                                                  Cloudflare Workers 运行时
```

### 1.3 技术栈
| 层级 | 技术 |
|------|------|
| Runtime | Cloudflare Workers (V8 Isolates) |
| Framework | Hono.js |
| Database | D1 (SQLite) + Prisma (local) |
| AI | MiniMax API (流式) |
| Real-time | WebSocket (ConnectionPool) |
| Auth | JWT (bcrypt) |

---

## 2. 历史经验（Learnings）参考

### 2.1 canvas-cors-preflight-500.md（2026-04-05）
**教训**: CORS 预检请求不带 Authorization header，如果不在 gateway 层拦截 OPTIONS，会落入 authMiddleware 导致 401。

**关联提案**: D-P0-2（ConnectionPool 使用 setInterval）和 D-P1-1（auth 静默放行）都是同类问题——**不熟悉 Cloudflare Workers 运行时约束**。

### 2.2 canvas-testing-strategy.md（2026-04-05）
**教训**: Mock store 过于简化导致测试通过但运行失败。Vitest/Jest 语法混用导致 mock 不工作。

**关联提案**: D-P2-7（缺少测试覆盖）直接相关——如果 CollaborationService 和 NotificationService 有测试，会发现 D-P0-1 和 D-P0-3 的问题。

### 2.3 canvas-api-completion.md（2026-04-05）
**教训**: Hono route 顺序敏感，`GET /latest` 必须在 `GET /:id` 之前。

**关联提案**: D-P2-5（全局单例）相关——如果使用 DI，测试时更容易替换 mock。

### 2.4 canvas-flowtree-api-fix learnings（2026-03-12 记忆）
**教训**: Canvas API 返回的数据结构和前端期望不一致，导致 500 错误。

**关联提案**: D-P1-2（SSE buffer bug）相关——都是流式数据处理的问题。

---

## 3. Git History 分析

### 3.1 CollaborationService 引入（commit 1cd172b8, 2026-04-01）
- E2-T1: CollaborationService.json file-level lock 实现
- E2-T3: NotificationService 30min deduplication
- **当时是 demo 级别实现，fs-based，在 CF Workers 不兼容**

### 3.2 SSE 流稳定性（commit 2b33f966, 2026-04-05）
- E1: 添加 AbortController 10s 超时
- 发现 timers[] 跟踪 setTimeout ID 的模式
- **但 AbortController 在 CF Workers 中工作（使用 Web API 而非 Node API）**

### 3.3 WebSocket ConnectionPool
- 首次引入在 db70c286（db70c286 feat: vibex 功能更新与安全配置）
- 从未有过版本更新
- **setInterval 问题从一开始就存在**

### 3.4 CORS + JWT 修复（commit 2b0d72b8）
- E2.1-E2.3: OPTIONS/CORS + NODE_ENV + JWT error fixes
- 说明团队已知 CORS 问题，但未系统性扫描所有 OPTIONS 路径

---

## 4. 技术方案选项

### 方案 A：渐进式修复（推荐）

**思路**: 按 P0→P1→P2 优先级逐步修复，每两周一个 P0，每月一个 P1 sprint。

**优点**: 风险可控，不影响现有功能
**缺点**: P0 问题在此期间可能影响生产

| 阶段 | 内容 | 工时估算 |
|------|------|---------|
| Sprint 1 | D-P0-1 + D-P0-2 + D-P0-3 | 6h |
| Sprint 2 | D-P1-1 + D-P1-2 + D-P1-3 | 4h |
| Sprint 3 | D-P2-1 + D-P2-2 + D-P2-3 | 6h |
| Sprint 4 | D-P2-4 + D-P2-5 + D-P2-6 + D-P2-7 + D-P2-8 | 8h |

### 方案 B：重构基础设施层

**思路**: 一次性引入 CF Workers 兼容层（KV、Durable Objects、SSE 统一库）。

**优点**: 一次性解决所有 P0-P2 的基础设施问题
**缺点**: 改动面大，可能影响其他正在进行的 PR

**核心组件**:
```typescript
// lib/cloudflare-adapters.ts — 统一 CF Workers 兼容层
export class DistributedLock {
  constructor(private do: DurableObjectStub) {}
  async acquire(ttlMs: number): Promise<boolean> { ... }
  async release(): Promise<void> { ... }
  async refresh(ttlMs: number): Promise<void> { ... }
}

export class KVCache {
  constructor(private kv: KVNamespace, private ttl: number) {}
  async get<T>(key: string): Promise<T | null> { ... }
  async set<T>(key: string, value: T): Promise<void> { ... }
  async invalidate(key: string): Promise<void> { ... }
}
```

### 方案 C：迁移到 Durable Objects 架构

**思路**: WebSocket 和 Collaboration 全部迁移到 Durable Objects，利用 DO 的单线程协调能力。

**优点**: 
- 分布式锁天然支持（DO 是单线程的）
- WebSocket 连接状态内聚在 DO 中
- 跨 Worker 共享状态

**缺点**: 
- 需要重写 ConnectionPool、CollaborationService
- DO 成本比纯 Workers 高
- 需要新订阅 Cloudflare DO 计划

---

## 5. 可行性评估

| 提案 | 方案 A | 方案 B | 方案 C |
|------|--------|--------|--------|
| D-P0-1 lock TTL | ✅ 直接修 | ✅ 换 DO 锁 | ✅ 天然支持 |
| D-P0-2 setInterval | ✅ 按需检查 | ✅ 统一适配层 | ✅ DO handle |
| D-P0-3 fs KV | ✅ KV 替换 | ✅ 统一适配层 | ✅ KV + DO |
| D-P1-1 JWT | ✅ 添加检查 | ✅ 统一配置层 | ✅ 无变化 |
| D-P1-2 SSE buffer | ✅ 改行缓冲 | ✅ SSE 统一库 | ✅ DO SSE |
| D-P1-3 lock 原子 | ✅ 乐观锁 | ✅ DO 原子锁 | ✅ 天然支持 |
| D-P2-1 retry | ✅ 3h 实现 | ✅ 统一重试 | ✅ 无变化 |
| D-P2-2 cache 同步 | ✅ KV | ✅ KV | ✅ KV |
| D-P2-3 auth rate | ✅ middleware | ✅ 统一 | ✅ 无变化 |
| D-P2-4 CUID2 | ✅ 依赖替换 | ✅ 无变化 | ✅ 无变化 |
| D-P2-5 DI | ✅ 注入 | ✅ DI 容器 | ✅ DO 注入 |
| D-P2-6 清理 | ✅ rm | ✅ 无变化 | ✅ 无变化 |
| D-P2-7 测试 | ✅ vitest | ✅ vitest | ✅ vitest |
| D-P2-8 行缓冲 | ✅ 重构 | ✅ 统一库 | ✅ DO SSE |

**推荐方案**: 方案 A（渐进式）+ 方案 B 的局部适配层（KV + SSE 行缓冲），方案 C 留作长期架构演进方向。

---

## 6. 初步风险识别

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|---------|
| 修复 D-P0-1 时引入新的 lock 竞争 | 中 | 高 | 单元测试覆盖 + staging 验证 |
| D-P0-2 改为按需检查后漏检真实超时 | 低 | 中 | 添加 metrics counter 追踪 |
| D-P0-3 切换到 KV 后冷启动缓存为空 | 中 | 低 | TTL 设为 30min，影响可接受 |
| D-P1-1 JWT 检查破坏已有测试 | 中 | 中 | 更新测试覆盖 auth 中间件 |
| D-P2-4 CUID2 引入破坏现有 ID 引用 | 低 | 高 | 先在 staging 验证，ID 格式向后兼容 |
| 全局重构影响其他并行 PR | 高 | 高 | 方案 A 确保每次只改一个问题 |

---

## 7. 验收标准（具体可测试）

### D-P0-1: CollaborationService lock TTL
```typescript
// test: CollaborationService.validateLock throws when lock expired
it('should throw LockRequiredError when lock has expired', async () => {
  const svc = new CollaborationService(tmpDir);
  await svc.acquireLock('p1', 's1', 100); // 100ms TTL
  await sleep(150); // wait past TTL
  await expect(svc.validateLock('p1', 's1')).rejects.toThrow(LockRequiredError);
});

// test: concurrent acquireLock throws
it('should prevent concurrent lock acquisition', async () => {
  const svc = new CollaborationService(tmpDir);
  await svc.acquireLock('p1', 's1');
  await expect(svc.acquireLock('p1', 's1')).rejects.toThrow();
});
```

### D-P0-2: ConnectionPool heartbeat in Workers
```typescript
// test: heartbeat triggers on broadcast (not setInterval)
it('should check connections on broadcast, not via setInterval', async () => {
  const pool = new ConnectionPool({ heartbeatInterval: 30_000, disconnectTimeout: 60_000 });
  // Mock Date.now to simulate time passing
  vi.setSystemTime(Date.now() + 90_000);
  pool.add({ id: 'c1', userId: 'u1', roomId: 'r1', socket: mockSocket, connectedAt: Date.now(), lastHeartbeat: Date.now() - 90_000, status: 'connected' });
  // Call broadcastToRoom to trigger check
  pool.broadcastToRoom('r1', { type: 'ping' });
  expect(pool.getSize()).toBe(0); // connection should be removed
});
```

### D-P0-3: NotificationService KV integration
```typescript
// test: send() uses KV instead of fs
it('should call KV.put instead of fs.writeFile', async () => {
  const mockKV = { put: vi.fn(), get: vi.fn().mockResolvedValue(null) };
  const svc = new NotificationService(mockKV as any);
  await svc.send({ channel: '#test', text: 'hello' });
  expect(mockKV.put).toHaveBeenCalledOnce();
  expect(mockKV.put.mock.calls[0][2]).toMatchObject({ expirationTtl: 1800 }); // 30min
});
```

### D-P1-1: JWT missing config check
```typescript
// test: missing JWT_SECRET returns 500
it('should return 500 when JWT_SECRET is missing', async () => {
  const app = new Hono();
  app.use('/test', authMiddleware, (c) => c.json({ ok: true }));
  const res = await app.request('/test', {}, { env: { ...env, JWT_SECRET: '' } });
  expect(res.status).toBe(500);
  expect(await res.json()).toMatchObject({ error: expect.stringContaining('JWT_SECRET') });
});
```

### D-P1-2: SSE buffer correctness
```typescript
// test: incomplete SSE chunk at buffer end is preserved
it('should preserve incomplete chunk when splitting mid-chunk', async () => {
  const chunks: string[] = [];
  const svc = new MessageRouter();
  // Simulate streaming: first chunk ends with partial line
  const chunks_awaited = [
    'data: {"content": "Hello',
    '"}',
    '\n',
    'data: {"content": " world"}\n',
    'data: [DONE]\n',
  ];
  // Verify all complete messages are parsed, incomplete preserved
});
```

### D-P1-3: Lock atomicity
```typescript
// test: acquireLock with existing lock throws (no silent overwrite)
it('should throw when acquiring already-held lock', async () => {
  const svc = new CollaborationService(tmpDir);
  await svc.acquireLock('p1', 's1');
  await expect(svc.acquireLock('p1', 's1')).rejects.toThrow('already held');
});
```

### D-P2-1: LLM retry
```typescript
// test: retries on 429, succeeds on 3rd attempt
it('should retry 3 times on transient failure', async () => {
  let attempts = 0;
  vi.stubGlobal('fetch', async () => {
    attempts++;
    if (attempts < 3) return new Response('rate limited', { status: 429 });
    return new Response(JSON.stringify({ choices: [{ delta: { content: 'ok' } }] }), { status: 200 });
  });
  // Verify attempts === 3
});
```

### D-P2-4: CUID2 generateId
```typescript
// test: generated IDs are CUID2 format (22 chars, base32)
it('should generate CUID2-compatible IDs', () => {
  const id = generateId();
  expect(id.length).toBe(22);
  expect(id).toMatch(/^[A-Za-z0-9]+$/);
  // Collision test: generate 10000, all unique
  const ids = new Set(Array.from({ length: 10000 }, () => generateId()));
  expect(ids.size).toBe(10000);
});
```

---

## 8. 实施路线图

```
Week 1: Sprint A（安全修复）
  ├─ D-P0-1: CollaborationService lock 修复
  ├─ D-P0-2: ConnectionPool 移除 setInterval
  └─ D-P0-3: NotificationService 切换到 KV
      → Staging 验证通过后合并

Week 2: Sprint B（数据完整性）
  ├─ D-P1-1: JWT_SECRET 检查
  ├─ D-P1-2: SSE buffer 重构
  └─ D-P1-3: lock 原子性

Week 3-4: Sprint C（基础设施）
  ├─ D-P2-1: LLM retry
  ├─ D-P2-2: Cache 跨 Worker
  ├─ D-P2-3: Auth rate limit
  └─ D-P2-4: CUID2

Week 5-6: Sprint D（架构优化）
  ├─ D-P2-5: DI 重构
  ├─ D-P2-6: 清理废弃文件
  ├─ D-P2-7: 补充测试
  └─ D-P2-8: 行缓冲
```

---

## 9. 资源需求

- **人力**: 1 dev（兼做 review）
- **工具**: CF Workers 账号 + Wrangler CLI
- **环境**: staging 环境（必须，不能跳过）
- **测试**: Vitest（已配置），需扩展到 services 层
