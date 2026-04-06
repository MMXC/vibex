# Epic Spec: Epic1-sub-quality — 质量与性能优化

**Epic**: Epic1-sub-quality  
**Parent**: vibex-dev-proposals-vibex-proposals-20260410  
**Stories**: ST-05, ST-06, ST-07, ST-08, ST-09, ST-10  
**Total Estimate**: 4.5h  
**Priority**: P1–P3  

---

## Story ST-05: 清理敏感信息日志

### 文件
`app/api/v1/canvas/generate-contexts/route.ts`, `generate-components/route.ts`, `generate-flows/route.ts`, `services/websocket/connectionPool.ts`

### 问题描述
多个 API 路由中 `console.log` 输出 entity ID、token 使用量等敏感信息，在生产环境暴露，存在安全合规风险。

### 技术方案
创建 `lib/logger.ts` 统一日志工具：
```typescript
// lib/logger.ts
const isProduction = process.env.NODE_ENV === 'production';

export function devDebug(message: string, data?: Record<string, unknown>) {
  if (!isProduction) {
    console.log(`[DEV] ${message}`, sanitize(data));
  }
}

function sanitize(data: Record<string, unknown>): Record<string, unknown> {
  const sensitiveKeys = /id|token|key|secret|password|usage|cost/i;
  const sanitized: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    sanitized[k] = sensitiveKeys.test(k) ? '[REDACTED]' : v;
  }
  return sanitized;
}
```

需清理的日志：
- `generate-contexts/route.ts:123` → 移除 entity ID 输出
- `generate-components/route.ts:215` → 移除 token usage 输出
- `generate-flows/route.ts:157` → 移除调试详情
- `connectionPool.ts` → 移除连接信息泄露

### 验收测试
```typescript
// tests/unit/logger.test.ts
describe('devDebug', () => {
  it('should not output sensitive keys in production', () => {
    const logs: string[] = [];
    const originalLog = console.log;
    console.log = (...args) => logs.push(args.join(' '));
    
    process.env.NODE_ENV = 'production';
    devDebug('user action', { entityId: '123', token: 'sk-abc' });
    
    console.log = originalLog;
    expect(logs[0]).not.toContain('entityId');
    expect(logs[0]).not.toContain('token');
    expect(logs[0]).toContain('[REDACTED]');
  });
});
```

---

## Story ST-06: 启用 PrismaPoolManager

### 文件
`lib/db.ts`, 所有 API 路由

### 问题描述
`lib/db.ts` 中 `PrismaPoolManager` 已实现但未被使用，所有 API 调用绕过连接池，每次新建连接，性能差且资源浪费。

### 技术方案
将 `PrismaPoolManager` 集成到 `getDBClient()`：
```typescript
// lib/db.ts
import { PrismaClient } from '@prisma/client';

class PrismaPoolManager {
  private pool: PrismaClient[] = [];
  private readonly maxConnections = parseInt(process.env.DB_POOL_SIZE || '10');

  acquire(): PrismaClient {
    return this.pool.pop() ?? new PrismaClient();
  }

  release(client: PrismaClient) {
    if (this.pool.length < this.maxConnections) {
      this.pool.push(client);
    } else {
      client.$disconnect();
    }
  }
}

// 全局单例
const poolManager = new PrismaPoolManager();

export function getDBClient() {
  if (isWorkers) {
    return createD1CompatLayer(env.D1_DB);
  }
  return poolManager.acquire(); // Workers 外使用连接池
}
```

### 验收测试
```typescript
// tests/unit/pool.test.ts
describe('PrismaPoolManager', () => {
  it('should reuse connections', () => {
    const pool = new PrismaPoolManager();
    const conn1 = pool.acquire();
    pool.release(conn1);
    const conn2 = pool.acquire();
    expect(conn1).toBe(conn2);
  });

  it('should respect max connections limit', () => {
    const pool = new PrismaPoolManager();
    for (let i = 0; i < 15; i++) {
      pool.release(new PrismaClient());
    }
    // 超出限制的连接应被断开，而非入池
    expect(pool.poolLength).toBeLessThanOrEqual(pool.maxConnections);
  });
});
```

---

## Story ST-07: 实现 Flow 执行逻辑

### 文件
`lib/prompts/flow-execution.ts:792, 813, 847, 869`

### 问题描述
Flow 执行有 4 处 `TODO` 标记，Prompt 中描述了执行逻辑但代码为空，调用时静默失败，返回 `{ success: true, data: null }`。

### 技术方案
根据 Prompt 模板描述，实现每步执行逻辑：
```typescript
// lib/prompts/flow-execution.ts

// Step 1: 解析 Flow 节点定义 → 候选步骤列表
async parseFlowSteps(flow: Flow): Promise<Step[]> {
  // TODO: 实现节点定义解析
  return flow.nodes.map(node => ({
    id: node.id,
    action: node.action,
    params: node.params,
    status: 'pending',
  }));
}

// Step 2: 逐个执行步骤并收集输出
async executeStep(step: Step, context: ExecutionContext): Promise<StepResult> {
  // TODO: 调用对应 action handler
  const handler = this.getActionHandler(step.action);
  if (!handler) {
    throw new Error(`Unknown action: ${step.action}`);
  }
  const output = await handler.execute(step.params, context);
  return { ...step, status: 'completed', output };
}

// Step 3: 聚合步骤结果
async aggregateResults(steps: StepResult[]): Promise<FlowResult> {
  // TODO: 合并所有 step output
  return {
    flowId: steps[0]?.flowId,
    steps: steps,
    summary: steps.map(s => s.output?.summary).filter(Boolean).join('\n'),
  };
}
```

### 验收测试
```typescript
// tests/unit/flow-execution.test.ts
describe('Flow Execution', () => {
  it('should not return null for valid flow', async () => {
    const executor = new FlowExecutor(mockEnv);
    const flow = createTestFlow(3); // 3 步 flow
    const result = await executor.execute(flow);
    
    expect(result).not.toEqual({ success: true, data: null });
    expect(result).toHaveProperty('steps');
    expect(result.steps.length).toBe(3);
    expect(result.steps[0]).toHaveProperty('output');
  });

  it('should throw 501 if not implemented yet', async () => {
    // 如果仍为 TODO 状态，应返回 501 而非静默失败
    const response = await fetch('/api/flows/execute', { method: 'POST', body: JSON.stringify({ flowId: 'test' }) });
    expect([200, 501]).toContain(response.status);
    const data = await response.json();
    expect(data).not.toEqual({ success: true, data: null });
  });
});
```

---

## Story ST-08: 添加 clarificationId 索引

### 文件
`app/api/clarifications/[clarificationId]/route.ts`, migration

### 问题描述
`clarification route` 中有 TODO 注释指出 `clarificationId` 需要索引查询优化，全表扫描在大数据量时性能退化。

### 技术方案
```sql
-- migrations/xxx_add_clarification_index.sql
CREATE INDEX IF NOT EXISTS idx_clarification_id ON Clarification(clarificationId);
CREATE INDEX IF NOT EXISTS idx_clarification_requirement ON Clarification(requirementId);
```

### 验收测试
```typescript
// tests/integration/clarification-perf.test.ts
describe('Clarification Query Performance', () => {
  it('should use index for clarificationId lookup', async () => {
    const db = getDBClient();
    const plan = await db.prepare(
      'EXPLAIN QUERY PLAN SELECT * FROM Clarification WHERE clarificationId = ?'
    ).bind('test-id').all();
    
    expect(plan[0].detail).toMatch(/USING INDEX|USING COVERING INDEX/i);
  });

  it('should not scan entire Clarification table', async () => {
    const db = getDBClient();
    const plan = await db.prepare(
      'EXPLAIN QUERY PLAN SELECT * FROM Clarification WHERE clarificationId = ?'
    ).bind('test-id').all();
    
    expect(plan[0].detail).not.toContain('SCAN TABLE');
  });
});
```

---

## Story ST-09: 清理 login/route.ts 重复代码

### 文件
`app/api/auth/login/route.ts`

### 问题描述
文件被 `cat` 输出两次（同一文件路径两次拼接），可能是复制粘贴或构建配置问题。

### 技术方案
1. 审查 `login/route.ts` 文件内容
2. 移除重复的拼接逻辑
3. 确保文件只包含单一、完整的路由实现

```typescript
// 修复后：单一路由实现
import { NextRequest, NextResponse } from 'next/server';
import { getDBClient } from '@/lib/db';
import { hashPassword, verifyPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    const db = getDBClient();
    const user = await db.user.findUnique({ where: { email } });
    
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    
    return NextResponse.json({ userId: user.id });
  } catch (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
```

### 验收测试
```typescript
// tests/unit/login-route.test.ts
describe('Login Route', () => {
  it('should have single route implementation', () => {
    const content = readFile('app/api/auth/login/route.ts');
    // 文件不应有明显的代码重复（如相同的 import 或函数定义出现 2 次）
    const imports = content.match(/^import /gm) || [];
    expect(imports.length).toBeLessThanOrEqual(5); // 合理数量内
  });

  it('should return 401 for invalid credentials', async () => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@test.com', password: 'wrong' }),
    });
    expect(response.status).toBe(401);
  });
});
```

---

## Story ST-10: 补充 AGENTS.md Workers 开发规范

### 文件
`vibex-backend/AGENTS.md`

### 问题描述
`CLAUDE.md` / `AGENTS.md` 缺失 Workers 环境特定开发指南，新开发者容易踩坑（如直接使用 `PrismaClient` 导致 Workers 部署失败）。

### 技术方案
在 `vibex-backend/AGENTS.md` 末尾新增章节：
```markdown
## Cloudflare Workers 开发规范

### 数据库访问
- **始终使用 `getDBClient()`**，禁止直接 `new PrismaClient()`
- Workers 环境使用 D1 binding，本地开发使用 Prisma SQLite
- 判断环境：`import { isWorkers } from '@/lib/db'`

### 缓存策略
- **禁止使用内存 `Map()`** 做跨请求持久化缓存
- 使用 `env.CACHE_KV` (D1 KV) 存储需要持久化的缓存数据
- 冷启动后内存清空，需要重新预热

### 环境变量
- Workers 环境通过 `wrangler.toml` 配置 `env.D1_DB` 等 binding
- 本地通过 `.dev.vars` 文件配置
- 禁止硬编码 API keys 或 secrets

### API 路由模式
- Workers 路由返回 `Response` 对象
- 本地使用 `NextResponse` / `NextRequest`（Next.js App Router）
- 统一使用 `getDBClient()` 抽象差异
```

### 验收测试
```typescript
// tests/unit/agents-md.test.ts
describe('AGENTS.md Workers Guidelines', () => {
  it('should contain getDBClient usage guideline', () => {
    const content = readFile('vibex-backend/AGENTS.md');
    expect(content).toContain('getDBClient');
    expect(content).toContain('isWorkers');
    expect(content).toContain('D1');
  });

  it('should warn against Map() for persistent cache', () => {
    const content = readFile('vibex-backend/AGENTS.md');
    expect(content.toLowerCase()).toContain('map');
    expect(content).toContain('D1 KV');
  });
});
```

---

## Epic 验收

- [ ] ST-05: 生产环境日志无 entityId/token/usage
- [ ] ST-06: 连接池复用率 ≥ 80%（10 次请求共用连接）
- [ ] ST-07: Flow 执行返回实际结果，非 `{ success: true, data: null }`
- [ ] ST-08: `EXPLAIN QUERY PLAN` 显示 `USING INDEX`
- [ ] ST-09: login/route.ts 无重复代码拼接
- [ ] ST-10: AGENTS.md 包含 `isWorkers` / `getDBClient` 规范
- [ ] 全局: `pnpm lint` + `pnpm typecheck` 通过
