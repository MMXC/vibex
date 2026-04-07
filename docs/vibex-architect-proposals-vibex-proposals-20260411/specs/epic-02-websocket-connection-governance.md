# Spec: Epic 2 — WebSocket ConnectionPool 连接治理

**Epic ID**: E2
**提案**: A-P0-2
**优先级**: P0
**工时**: 6h
**负责人**: Backend Dev

---

## 1. Overview

修复 WebSocket ConnectionPool 的连接泄露风险，添加 maxConnections 限制、死连接自动清理（5min 无活动）、心跳机制和健康检查端点。

## 2. Scope

### In Scope
- `vibex-backend/src/services/websocket/connectionPool.ts`
- `vibex-backend/src/services/websocket/messageRouter.ts`
- 新增 `/api/ws/health` 健康检查端点
- 现有 connectionPool 测试覆盖

### Out of Scope
- Cloudflare Durable Objects 迁移（作为 Epic 独立后续评估）
- MessageRouter 业务逻辑重构

## 3. Technical Approach

采用**方案一：添加连接限制 + 心跳机制**。

### 3.1 PoolConfig 接口扩展

```typescript
// 新增配置项
interface PoolConfig {
  maxConnections: number    // 默认 1000
  heartbeatInterval: number  // 默认 30s (客户端 ping 间隔)
  connectionTimeout: number  // 默认 5min (无活动 → 关闭)
  cleanupInterval: number    // 默认 60s (定时扫描死连接)
}
```

### 3.2 连接限制

```typescript
// 新连接时检查
if (pool.size >= config.maxConnections) {
  return { status: 503, message: 'Connection limit exceeded' }
}
```

### 3.3 死连接清理

```typescript
// 定时任务扫描
setInterval(() => {
  for (const [id, conn] of pool.entries()) {
    if (Date.now() - conn.lastActivity > config.connectionTimeout) {
      conn.close(1000, 'Connection timeout')
      pool.delete(id)
    }
  }
}, config.cleanupInterval)
```

### 3.4 健康检查端点

```typescript
// GET /api/ws/health
app.get('/api/ws/health', (c) => {
  return c.json({
    activeConnections: pool.size,
    maxConnections: config.maxConnections,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  })
})
```

## 4. File Changes

```
Modified:
  vibex-backend/src/services/websocket/connectionPool.ts   (新增 PoolConfig + 限制逻辑)
  vibex-backend/src/services/websocket/messageRouter.ts    (新增心跳支持)
  vibex-backend/src/app/api/ws/health/route.ts             (新建)

Added:
  vibex-backend/src/services/websocket/__tests__/connectionPool.test.ts  (新增)
```

## 5. Stories

| Story ID | 描述 | 工时 | 验收条件 |
|----------|------|------|---------|
| E2-S1 | 连接数限制实现 | 2h | 超过 maxConnections 返回 503 |
| E2-S2 | 死连接清理 + 心跳 | 3h | 5min 无活动连接被关闭 |
| E2-S3 | 健康检查端点 | 1h | /api/ws/health 返回连接统计 |

## 6. Acceptance Criteria

```typescript
// E2-S1
describe('ConnectionPool', () => {
  it('should reject when maxConnections exceeded', async () => {
    const pool = new ConnectionPool({ maxConnections: 2 })
    await pool.connect('client1')
    await pool.connect('client2')
    const result = await pool.connect('client3')
    expect(result.status).toBe(503)
    expect(result.message).toContain('limit exceeded')
  })
})

// E2-S2
it('should close dead connections after 5min inactivity', async () => {
  vi.useFakeTimers()
  const pool = new ConnectionPool({ connectionTimeout: 5 * 60 * 1000 })
  await pool.connect('client1')
  vi.advanceTimersByTime(5 * 60 * 1000 + 1)
  expect(pool.size).toBe(0)
  vi.useRealTimers()
})

// E2-S3
it('should expose health endpoint', async () => {
  const res = await fetch('/api/ws/health')
  expect(res.status).toBe(200)
  const body = await res.json()
  expect(body.activeConnections).toBeDefined()
  expect(body.maxConnections).toBeDefined()
  expect(body.uptime).toBeDefined()
})
```

## 7. Test Cases

| ID | 输入 | 预期输出 |
|----|------|---------|
| TC01 | 并发连接数 = maxConnections + 1 | 第 maxConnections+1 连接返回 503 |
| TC02 | 连接建立后 5min 无消息 | 连接被关闭，pool.size -1 |
| TC03 | GET /api/ws/health | 200 + JSON {activeConnections, maxConnections, uptime} |
| TC04 | 连接满载时健康检查 | 仍返回 200，不阻塞监控 |

## 8. Edge Cases

- **Cloudflare Workers 限制**：Workers 环境下 WebSocket 实现有限，connectionTimeout 实现需兼容 Workers Runtime
- **并发竞争**：cleanupInterval 和新连接到达的竞争条件，需加锁
- **健康检查风暴**：高频健康检查不影响 pool 稳定性

## 9. Definition of Done

- [ ] maxConnections 配置生效，超限时返回 503
- [ ] 死连接 5min 内自动关闭
- [ ] /api/ws/health 端点返回连接统计
- [ ] 单元测试覆盖率 ≥90%
- [ ] Code review 通过（≥1 reviewer）
