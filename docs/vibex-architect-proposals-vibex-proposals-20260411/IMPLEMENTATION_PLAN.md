# IMPLEMENTATION_PLAN: VibeX 架构提案实施 2026-04-11

> **项目**: vibex-architect-proposals-vibex-proposals-20260411  
> **作者**: Architect  
> **日期**: 2026-04-11  
> **版本**: v1.0

---

## Sprint 规划

| Sprint | 周期 | 内容 | 工时 |
|--------|------|------|------|
| Sprint 1 | Day 1 | E1: API v0/v1 治理 | 4h |
| Sprint 2 | Day 2 | E2: WebSocket 治理 | 6h |
| Sprint 3 | Day 3 | E3: packages/types 集成 | 3h |
| Sprint 4 | Day 4 | E4: 路由分层 | 4h |
| Sprint 5 | Day 5 | E5: 质量评分 | 5h |
| Sprint 6 | Day 6 | E6: AST 安全扫描 | 4h |
| Sprint 7 | Day 7 | E7: MCP 可观测性 | 3h |

**总工时**: 29h | **团队**: 1 Dev

---

## Sprint 1: E1 API v0/v1 治理（4h）

### E1-S1: 添加 v0 Deprecation header

```typescript
// middleware/deprecation.ts
export function withDeprecationHeaders(handler) {
  return async (c) => {
    const response = await handler(c);
    response.headers.set('Deprecation', 'true');
    response.headers.set('Sunset', 'Sat, 31 Dec 2026 23:59:59 GMT');
    response.headers.set('Link', '</api/v1/...>; rel="successor-version"');
    return response;
  };
}
```

### E1-S2: v1 路由覆盖验证

```bash
# 验证 v0 路由在 v1 有对应
grep -rn "router.get\|router.post" vibex-backend/src/routes/v0/
```

---

## Sprint 2: E2 WebSocket 治理（6h）

### E2-S1: 连接限制

```typescript
const MAX_CONNECTIONS = 100;

accept(socket: WebSocket) {
  if (this.connections.size >= MAX_CONNECTIONS) {
    socket.close(1008, 'Too many connections');
    return false;
  }
}
```

### E2-S2: 心跳 + 死连接清理

```typescript
setInterval(() => {
  cleanupDeadConnections();
}, WebSocketManager.DEAD_CONNECTION_TIMEOUT);
```

---

## Sprint 3: E3 packages/types（3h）

```bash
# 1. 创建 packages/types
mkdir -p packages/types/src/schemas
cat > packages/types/package.json << 'EOF'
{ "name": "@vibex/types", "version": "1.0.0" }
EOF

# 2. 迁移类型
mv vibex-backend/src/lib/schemas/* packages/types/src/schemas/

# 3. 更新依赖
pnpm add @vibex/types -w
```

---

## Sprint 4: E4 路由分层（4h）

```typescript
// Hono 网关层
gateway.use('*', withAuth());  // 统一认证

// Next.js 内部（不再重复认证）
export async function GET() {
  return Response.json({});
}
```

---

## Sprint 5: E5 质量评分（5h）

```typescript
// qualityScore.ts
function calculateQualityScore(result): number {
  const coverageScore = entities.length > 0 ? Math.min(100, entities.length * 10) : 0;
  const ratioScore = (1 - compressed / original) * 100;
  return Math.round(coverageScore * 0.6 + ratioScore * 0.4);
}
```

---

## Sprint 6: E6 AST 安全扫描（4h）

```bash
pnpm add @babel/parser @babel/traverse
```

```typescript
// scanForDangerousPatterns(code)
traverse(ast, {
  CallExpression(path) {
    if (['eval', 'Function'].includes(path.node.callee.name)) {
      patterns.push({ type: 'DANGEROUS_FUNCTION', line: path.node.loc.start.line });
    }
  },
});
```

---

## Sprint 7: E7 MCP 可观测性（3h）

```typescript
// /health 端点
export async function GET() {
  const checks = await Promise.allSettled([
    checkDatabase(),
    checkWebSocket(),
  ]);
  return Response.json({ status: allHealthy ? 'healthy' : 'unhealthy', checks });
}
```

---

## 验收命令

```bash
# E1
curl -I http://localhost:8787/api/v0/agents | grep -i deprecation

# E2
# 并发 101 连接测试

# E3
grep "@vibex/types" vibex-backend/src/routes/*/route.ts | wc -l

# E5
expect(calculateQualityScore({ entities: 10, ratio: 0.5 })).toBeGreaterThanOrEqual(70)
```

---

*文档版本: v1.0 | 最后更新: 2026-04-11*
