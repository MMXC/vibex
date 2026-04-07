# PRD: VibeX Backend Worker Issues & Optimization

> **项目**: vibex-dev-proposals-vibex-proposals-20260408
> **版本**: v1.0
> **日期**: 2026-04-08
> **状态**: Draft → Ready for Dev

---

## 1. 执行摘要

### 背景

VibeX 是一个基于 Cloudflare Workers (Hono + TypeScript) 的可视化原型设计平台。后端服务包括 Canvas 画布 API、WebSocket 实时协作、AI 设计助手（MiniMax 流式对话）、协作权限管理与 Slack 通知系统。

**核心问题**: 经过系统代码审查，发现后端存在 3 个 P0 级运行时兼容性问题——`CollaborationService`、`ConnectionPool`、`NotificationService` 均使用了 Cloudflare Workers **不支持**的 Node.js API，直接影响生产环境稳定性。此外还有 3 个 P1 数据完整性/安全问题 和 8 个 P2 优化项。

### 目标

1. **立即消除 P0 生产风险**: 修复 CF Workers 运行时不兼容的 API 调用
2. **建立数据完整性基线**: 确保 lock 机制和 JWT 配置的正确性
3. **提升系统可维护性**: 补充测试、清理废弃代码、引入现代 ID 生成方案

### 成功指标

| 指标 | 当前 | 目标 |
|------|------|------|
| CollaborationService lock TTL 有效性 | 0% (未生效) | 100% (乐观锁语义) |
| ConnectionPool 心跳检测 | 不工作 (setInterval) | 按需检查正常触发 |
| NotificationService 缓存可用性 | 0% (fs API 不支持) | 100% (KV 存储) |
| authMiddleware JWT 配置检查 | 静默放行 (安全风险) | 500 拒绝 + 启动告警 |
| 核心服务单元测试覆盖率 | ~0% | ≥70% (CollaborationService + NotificationService + MessageRouter) |
| generateId 碰撞风险 | 高 (Math.random) | 0 (CUID2) |
| Sprint 总工时 | — | 32h 内完成 |

---

## 2. Feature List

| ID | 功能名称 | 类型 | 描述 | 根因关联 | 工时 |
|----|----------|------|------|----------|------|
| D-P0-1 | CollaborationService lock TTL 修复 | Bug | 实现乐观锁语义——lock 已存在时拒绝覆写，添加 refreshLock 方法 | 2026-04-05 learnings: canvas-api-completion | 2h |
| D-P0-2 | ConnectionPool 移除 setInterval | Bug | 改用按需检查模式（每次 broadcast/send 时触发），消除 Workers 不支持的定时器 | 2026-04-05 learnings: canvas-cors-preflight-500 | 2h |
| D-P0-3 | NotificationService 切换到 KV 存储 | Bug | 用 Cloudflare KV 替换 fs.* API，保留 30min 去重语义 | 2026-04-05 learnings: canvas-cors-preflight-500 | 2h |
| D-P1-1 | JWT_SECRET 缺失时强制拒绝 | Bug | authMiddleware 检测到缺失配置时返回 500，verifyToken 增加启动告警 | 安全风险 | 1h |
| D-P1-2 | SSE buffer 行缓冲重构 | Bug | 改为逐行解析，确保完整 SSE 行才处理，消除 buffer 分割边界 case | 2026-04-05 learnings: canvas-flowtree-api-fix | 1h |
| D-P1-3 | lock 原子性保证 | Bug | acquireLock 在 lock 存在时拒绝覆写（乐观锁），而非直接覆写 TTL | D-P0-1 细化 | 2h |
| D-P2-1 | LLM Provider retry 逻辑 | Feature | 实现指数退避重试（1s/2s/4s），使用已配置的 retryAttempts | 配置存在但未使用 | 3h |
| D-P2-2 | AI Service 跨 Worker 缓存 | Feature | 用 Cloudflare Cache API 替换 in-memory Map，实现边缘缓存 | 缓存不共享 | 2h |
| D-P2-3 | Auth endpoints rate limit | Feature | 对 /auth/login 和 /auth/register 添加独立限流（10次/分钟） | 当前限流可能不覆盖 | 2h |
| D-P2-4 | generateId 替换为 CUID2 | Feature | 使用 @paralleldrive/cuid2 替换 Math.random 实现 | ID 碰撞风险 | 1h |
| D-P2-5 | ConnectionPool/MessageRouter DI 重构 | Refactor | 全局单例改为通过 Hono c.set 注入，支持测试替换 | 2026-04-05 learnings: canvas-api-completion | 3h |
| D-P2-6 | 清理废弃文件 | Refactor | 删除 llm-provider.ts.backup-* 等废弃备份文件 | 技术债务 | 1h |
| D-P2-7 | 核心服务单元测试覆盖 | Test | 为 CollaborationService、NotificationService、MessageRouter 补充测试 | 2026-04-05 learnings: canvas-testing-strategy | 5h |
| D-P2-8 | SSE 行缓冲实现 | Refactor | AI Design Chat 全面使用行缓冲替代累积 buffer | D-P1-2 扩展 | 2h |

**总工时**: 32h

---

## 3. Epic 拆分表

### Epic 1: P0 安全修复 — Workers 运行时兼容性

| Epic | Story | 工时 | 验收标准 |
|------|-------|------|----------|
| E1: P0 安全修复 | S1.1: CollaborationService 乐观锁修复 | 2h | `acquireLock` 在 lock 存在时抛出 `LockHeldError`；`refreshLock` 正确刷新 TTL；`validateLock` 在过期时抛出错误 |
| | S1.2: ConnectionPool 移除 setInterval，改按需检查 | 2h | 无 `setInterval`/`setTimeout` 调用；`checkConnections` 在 `broadcastToRoom`/`sendToUser` 时触发；超时连接在下次触发时移除 |
| | S1.3: NotificationService 切换到 KV | 2h | `loadCache`/`saveCache` 改为 KV API；去重 30min TTL 语义保持；S1.1 的测试通过 |

### Epic 2: P1 数据完整性与安全

| Epic | Story | 工时 | 验收标准 |
|------|-------|------|----------|
| E2: P1 数据完整性与安全 | S2.1: JWT_SECRET 缺失强制拒绝 | 1h | 环境变量缺失时 `authMiddleware` 返回 500；`verifyToken` 启动时打 `[AUTH] FATAL` 日志 |
| | S2.2: SSE buffer 行缓冲重构 | 1h | 逐行解析 SSE；不完整的行正确保留在 buffer 中；`[DONE]` 正确终止流 |
| | S2.3: lock 原子性保证 | 2h | E1-S1.1 基础上增加：不能通过两次调用覆盖已有 lock |

### Epic 3: P2 基础设施优化

| Epic | Story | 工时 | 验收标准 |
|------|-------|------|----------|
| E3: P2-A 可靠性增强 | S3.1: LLM Provider retry | 3h | 429 响应触发 3 次重试（1s/2s/4s 退避）；非 429 错误不重试；测试覆盖 |
| | S3.2: AI Service 边缘缓存 | 2h | 使用 `caches.default` 跨 Worker 共享缓存；缓存命中时 latency=0；TTL 可配置 |
| | S3.3: Auth rate limit | 2h | /auth/login 和 /auth/register 独立限流（10次/分钟/IP）；超出返回 429 |
| | S3.4: CUID2 替换 | 1h | 生成的 ID 长度 22 字符；10000 次生成无碰撞；后端所有 generateId 调用更新 |
| E3: P2-B 可维护性提升 | S3.5: DI 重构 | 3h | ConnectionPool 和 MessageRouter 通过 `c.set` 注入；Vitest 可替换 mock；无全局单例引用 |
| | S3.6: 清理废弃文件 | 1h | 无 .backup-* / .orig 文件；llm-provider.ts 备份文件全部删除 |
| | S3.7: 单元测试覆盖 | 5h | CollaborationService: 5 个测试用例；NotificationService: 3 个；MessageRouter: 4 个；覆盖率 ≥70% |
| | S3.8: SSE 行缓冲实现 | 2h | ai-design-chat.ts 和 prototype-collaboration.ts 使用行缓冲；D-P1-2 所有边界 case 覆盖 |

---

## 4. 验收标准（每 Story 可执行 expect() 断言）

### E1-S1.1: CollaborationService 乐观锁

```typescript
// 验收 1: lock 已存在时拒绝覆写
it('should throw LockHeldError when lock already exists', async () => {
  const svc = new CollaborationService(tmpDir);
  await svc.acquireLock('p1', 's1', 100);
  await expect(svc.acquireLock('p1', 's1')).rejects.toThrow('already held');
});

// 验收 2: lock 过期后 validateLock 抛出
it('should throw LockRequiredError when lock has expired', async () => {
  const svc = new CollaborationService(tmpDir);
  await svc.acquireLock('p1', 's1', 100); // 100ms TTL
  await sleep(150);
  await expect(svc.validateLock('p1', 's1')).rejects.toThrow('expired');
});

// 验收 3: refreshLock 正确刷新 TTL
it('should extend TTL when refreshLock is called', async () => {
  const svc = new CollaborationService(tmpDir);
  await svc.acquireLock('p1', 's1', 100);
  await sleep(80);
  await svc.refreshLock('p1', 's1');
  await sleep(50); // 原 TTL 已过，但刷新后应存活
  await expect(svc.validateLock('p1', 's1')).resolves.not.toThrow();
});
```

### E1-S1.2: ConnectionPool 移除 setInterval

```typescript
// 验收 1: 无 setInterval/setTimeout
it('should not use setInterval or setTimeout', () => {
  const code = fs.readFileSync('./src/services/websocket/connectionPool.ts', 'utf-8');
  expect(code).not.toMatch(/setInterval|setTimeout/);
});

// 验收 2: 超时连接在 broadcast 时移除
it('should remove timed-out connection on broadcastToRoom', async () => {
  const pool = new ConnectionPool({ heartbeatInterval: 30_000, disconnectTimeout: 60_000 });
  pool.add({ id: 'c1', userId: 'u1', roomId: 'r1', socket: mockSocket,
    connectedAt: Date.now() - 90_000, lastHeartbeat: Date.now() - 90_000, status: 'connected' });
  pool.broadcastToRoom('r1', { type: 'ping' });
  expect(pool.getSize()).toBe(0);
});
```

### E1-S1.3: NotificationService KV

```typescript
// 验收 1: 使用 KV 而非 fs
it('should call KV.put instead of fs.writeFile', async () => {
  const mockKV = { put: vi.fn(), get: vi.fn().mockResolvedValue(null) };
  const svc = new NotificationService(mockKV as any);
  await svc.send({ channel: '#test', text: 'hello' });
  expect(mockKV.put).toHaveBeenCalledOnce();
});

// 验收 2: 30min TTL
it('should set expirationTtl to 1800 seconds', async () => {
  const mockKV = { put: vi.fn(), get: vi.fn().mockResolvedValue(null) };
  const svc = new NotificationService(mockKV as any);
  await svc.send({ channel: '#test', text: 'hello' });
  expect(mockKV.put.mock.calls[0][2].expirationTtl).toBe(1800);
});
```

### E2-S2.1: JWT 配置检查

```typescript
// 验收 1: 缺失 JWT_SECRET 返回 500
it('should return 500 when JWT_SECRET is missing', async () => {
  const res = await app.request('/protected', {}, { env: { JWT_SECRET: '' } });
  expect(res.status).toBe(500);
});

// 验收 2: 正常 JWT 返回 200
it('should return 200 with valid JWT', async () => {
  const token = signToken({ userId: 'u1' }, 'secret');
  const res = await app.request('/protected', { headers: { Authorization: `Bearer ${token}` } }, { env: { JWT_SECRET: 'secret' } });
  expect(res.status).toBe(200);
});
```

### E2-S2.2: SSE buffer 行缓冲

```typescript
// 验收 1: 不完整的行正确保留
it('should preserve incomplete line at buffer boundary', async () => {
  const router = new MessageRouter();
  const messages: string[] = [];
  // 模拟 chunk1 = 'data: {"content": "Hello', chunk2 = '"}'
  await router.routeChunk('data: {"content": "Hello', messages);
  await router.routeChunk('"}', messages);
  expect(messages).toContainEqual(expect.objectContaining({ content: 'Hello"}' }));
});
```

### E2-S2.3: lock 原子性

```typescript
// 验收: 并发 acquireLock 第二次抛出（乐观锁）
it('should throw on second acquireLock call without release', async () => {
  const svc = new CollaborationService(tmpDir);
  await svc.acquireLock('p1', 's1');
  await expect(svc.acquireLock('p1', 's1')).rejects.toThrow('already held');
});
```

### E3-S3.1: LLM retry

```typescript
// 验收: 429 响应触发 3 次重试
it('should retry 3 times on 429, succeed on 3rd attempt', async () => {
  let attempts = 0;
  vi.stubGlobal('fetch', async () => {
    attempts++;
    if (attempts < 3) return new Response('', { status: 429 });
    return new Response(JSON.stringify({ choices: [{ delta: { content: 'ok' } }] }), { status: 200 });
  });
  const result = await provider.chatWithRetry({ messages: [] });
  expect(attempts).toBe(3);
  expect(result.data).toBeDefined();
});

// 验收: 非 429 错误不重试
it('should not retry on non-429 errors', async () => {
  let attempts = 0;
  vi.stubGlobal('fetch', async () => {
    attempts++;
    return new Response('', { status: 500 });
  });
  await expect(provider.chatWithRetry({ messages: [] })).rejects.toThrow();
  expect(attempts).toBe(1);
});
```

### E3-S3.2: AI Service 边缘缓存

```typescript
// 验收: 缓存命中时 latency=0
it('should return latency=0 on cache hit', async () => {
  const mockCache = { match: vi.fn().mockResolvedValue(new Response(JSON.stringify({ result: 'cached' }))) };
  const svc = new AIService(mockCache as any, defaultConfig);
  const result = await svc.executeWithFallback({ prompt: 'test', cacheKey: 'key1' });
  expect(result.latency).toBe(0);
  expect(result.provider).toBe('cached');
});
```

### E3-S3.3: Auth rate limit

```typescript
// 验收: 超出限制返回 429
it('should return 429 after 10 requests in 1 minute', async () => {
  for (let i = 0; i < 10; i++) {
    const res = await app.request('/auth/login', { method: 'POST' }, { env });
    expect([200, 429]).toContain(res.status);
  }
  const res = await app.request('/auth/login', { method: 'POST' }, { env });
  expect(res.status).toBe(429);
});
```

### E3-S3.4: CUID2 generateId

```typescript
// 验收: 22 字符，Crockford base32，无碰撞
it('should generate CUID2 IDs (22 chars, unique)', () => {
  const ids = Array.from({ length: 10000 }, () => generateId());
  expect(ids.every(id => id.length === 22)).toBe(true);
  expect(new Set(ids).size).toBe(10000);
});
```

### E3-S3.5: DI 重构

```typescript
// 验收: ConnectionPool 可通过 c.set 注入
it('should allow ConnectionPool injection via c.set', async () => {
  const mockPool = { broadcastToRoom: vi.fn() };
  const app = new Hono();
  app.use('*', async (c, next) => { c.set('connectionPool', mockPool); await next(); });
  app.get('/test', (c) => { c.get('connectionPool').broadcastToRoom('r1', {}); return c.json({ ok: true }); });
  await app.request('/test');
  expect(mockPool.broadcastToRoom).toHaveBeenCalledWith('r1', {});
});
```

---

## 5. Definition of Done (DoD)

### Epic E1 DoD (P0 安全修复)

- [ ] D-P0-1: CollaborationService 乐观锁实现，3 个测试用例通过
- [ ] D-P0-2: ConnectionPool 中无 `setInterval`/`setTimeout`，超时清理测试通过
- [ ] D-P0-3: NotificationService 切换到 KV，缓存去重测试通过
- [ ] **所有 P0 修改通过 staging 环境验证**（强制，不可跳过）
- [ ] staging 回归测试：无新 500 错误，WebSocket 连接稳定
- [ ] 代码无 lint 错误（Vitest 语法一致）

### Epic E2 DoD (P1 数据完整性与安全)

- [ ] D-P1-1: JWT_SECRET 缺失测试通过（500 + FATAL 日志）
- [ ] D-P1-2: SSE 行缓冲实现，边界 case 测试通过
- [ ] D-P1-3: 乐观锁原子性测试通过
- [ ] 代码 review 通过（至少 1 人 review）
- [ ] lint 通过

### Epic E3 DoD (P2 基础设施优化)

- [ ] D-P2-1 ~ D-P2-8 全部实现
- [ ] 单元测试覆盖率 ≥70%（CollaborationService + NotificationService + MessageRouter）
- [ ] `generateId` 替换后无 ID 引用断裂（后端所有调用点更新）
- [ ] 废弃文件清理完毕（无 .backup-* / .orig）
- [ ] CI pipeline 通过（lint + test + type check）
- [ ] 代码 review 通过

### 全局 DoD

- [ ] 所有 14 个提案均有对应测试覆盖（Vitest）
- [ ] PRD 和 specs 同步更新（如有范围变更）
- [ ] 上游 Learnings 文档关联（canvas-cors-preflight-500, canvas-testing-strategy, canvas-api-completion）
- [ ] 团队通知（Slack: dev + pm 频道）

---

## 6. 实施路线图

```
Week 1: Sprint A — P0 安全修复
  ├─ D-P0-1: CollaborationService 乐观锁 (2h)
  ├─ D-P0-2: ConnectionPool 移除 setInterval (2h)
  └─ D-P0-3: NotificationService KV 切换 (2h)
      → [Gate] Staging 验证通过后合并

Week 2: Sprint B — P1 数据完整性
  ├─ D-P1-1: JWT_SECRET 强制检查 (1h)
  ├─ D-P1-2: SSE 行缓冲 (1h)
  └─ D-P1-3: lock 原子性 (2h)
      → Code Review + 合并

Week 3-4: Sprint C — P2 可靠性
  ├─ D-P2-1: LLM retry (3h)
  ├─ D-P2-2: AI 边缘缓存 (2h)
  ├─ D-P2-3: Auth rate limit (2h)
  └─ D-P2-4: CUID2 (1h)

Week 5-6: Sprint D — P2 可维护性
  ├─ D-P2-5: DI 重构 (3h)
  ├─ D-P2-6: 清理废弃文件 (1h)
  ├─ D-P2-7: 单元测试 (5h)
  └─ D-P2-8: SSE 行缓冲实现 (2h)
```

---

## 7. 风险登记

| # | 风险 | 概率 | 影响 | 缓解措施 |
|---|------|------|------|----------|
| R1 | 修复 D-P0-1 引入新的 lock 竞争 | 中 | 高 | 单元测试 + staging 验证 |
| R2 | D-P0-2 按需检查漏检真实超时 | 低 | 中 | 添加 metrics counter 追踪检查频率 |
| R3 | D-P0-3 切换 KV 后冷启动缓存为空 | 中 | 低 | TTL 30min，影响可接受 |
| R4 | D-P2-4 CUID2 破坏现有 ID 引用 | 低 | 高 | 先在 staging 验证，ID 格式向后兼容 |
| R5 | 全局重构影响其他并行 PR | 高 | 高 | 方案按 Story 逐个修改，不做跨文件批量重构 |
