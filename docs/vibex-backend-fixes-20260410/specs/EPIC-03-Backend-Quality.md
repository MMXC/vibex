# Epic 3: Backend Quality Foundations

**Epic ID**: EPIC-03  
**Priority**: P1–P2  
**Estimated**: 3.5h  
**Stories**: ST-07, ST-08, ST-09, ST-10, ST-11

---

## ST-07: Unified Logger with Sanitization

### Context

Backend code uses raw `console.log` to write sensitive metadata (entityId, token usage, sk-* keys) to stdout in production. No log level control. No redaction.

### Solution: `lib/logger.ts`

```typescript
// lib/logger.ts
const BLOCKED_KEYS = ['entityId', 'token', 'usage', 'sk-', 'password', 'secret', 'key'];
const LOG_LEVEL = (process.env.LOG_LEVEL ?? 'info') as LogLevel;
const LEVELS: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };

function shouldLog(level: LogLevel): boolean {
  return LEVELS[level] >= LEVELS[LOG_LEVEL];
}

function sanitizeLogMeta(meta?: Record<string, unknown>): Record<string, unknown> {
  if (!meta) return {};
  const sanitized: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(meta)) {
    if (BLOCKED_KEYS.some(b => k.toLowerCase().includes(b))) {
      sanitized[k] = '[REDACTED]';
    } else if (typeof v === 'object' && v !== null) {
      sanitized[k] = sanitizeLogMeta(v as Record<string, unknown>);
    } else {
      sanitized[k] = v;
    }
  }
  return sanitized;
}

export const logger = {
  debug: (...args: unknown[]) => shouldLog('debug') && console.log('[DEBUG]', ...args),
  info: (...args: unknown[]) => shouldLog('info') && console.log('[INFO]', ...args),
  warn: (...args: unknown[]) => shouldLog('warn') && console.warn('[WARN]', ...args),
  error: (ctx: string, meta?: Record<string, unknown>) => {
    if (!shouldLog('error')) return;
    console.error(`[ERROR] ${ctx}`, sanitizeLogMeta(meta));
  },
};
```

### Acceptance Tests

```typescript
// __tests__/lib/logger.test.ts
it('redacts entityId, token, usage, sk-, password, secret, key', () => {
  const sanitized = sanitizeLogMeta({
    entityId: 'abc123',
    token: 'sk-test-123',
    usage: { prompt_tokens: 100 },
    mysk_key: 'value',
    password: 'secret',
    userId: 'user-456',
  });
  expect(sanitized.entityId).toBe('[REDACTED]');
  expect(sanitized.token).toBe('[REDACTED]');
  expect(sanitized.usage).toBe('[REDACTED]');
  expect(sanitized.mysk_key).toBe('[REDACTED]');
  expect(sanitized.password).toBe('[REDACTED]');
  expect(sanitized.userId).toBe('user-456'); // not blocked
});

it('output does not contain sensitive keys', () => {
  const output = captureStderr(() => logger.error('test', { entityId: 'abc', token: 'sk-123' }));
  expect(output).not.toMatch(/abc|sk-123|entityId|token/);
});
```

### Files Changed
- `vibex-backend/src/lib/logger.ts` (new)
- Replaces inline `console.log` calls in 10+ files

---

## ST-08: Eliminate Empty `catch {}` Blocks

### Context

10+ catch blocks swallow errors silently: `} catch { }`. No logging, no user feedback, no error propagation. Errors are invisible in production.

### Files to Fix (priority order)

| File | Empty Catch Count | Pattern |
|------|------------------|---------|
| `app/api/v1/chat/route.ts` | 1 | SSE stream JSON parse |
| `app/api/v1/canvas/snapshots.ts` | 6+ | Various DB operations |
| `app/api/v1/ai-ui-generation/route.ts` | 1 | Generation error |
| `app/api/v1/canvas/export/route.ts` | 1 | Export operation |
| `routes/v1/canvas/snapshots.ts` | 3+ | DB operations |

### Fix Pattern

```typescript
// ❌ BEFORE
try {
  // ... operation
} catch { }

// ✅ AFTER
try {
  // ... operation
} catch (err) {
  logger.error('operation_name', { error: err instanceof Error ? err.message : String(err), context });
  return NextResponse.json({ error: 'Operation failed' }, { status: 500 });
}
```

### ESLint Rule Addition

```javascript
// .eslintrc.js (backend)
{
  rules: {
    'no-empty': ['error', { allowEmptyCatch: false }],
  }
}
```

### Acceptance Tests

```bash
# No empty catch blocks in backend source
grep -rn "catch { }" vibex-backend/src/ | expect empty

# New catches call logger
grep -rn "catch (" vibex-backend/src/ | xargs grep "logger.error" | expect > 0 matches
```

### Files Changed
- `vibex-backend/src/app/api/v1/chat/route.ts`
- `vibex-backend/src/app/api/v1/canvas/snapshots.ts`
- `vibex-backend/src/app/api/v1/ai-ui-generation/route.ts`
- `vibex-backend/src/app/api/v1/canvas/export/route.ts`
- `vibex-backend/src/routes/v1/canvas/snapshots.ts`
- `vibex-backend/.eslintrc.js`

---

## ST-09: Enable PrismaPoolManager

### Context

`lib/db.ts` has a full `PrismaPoolManager` implementation (connection pooling, acquire/release), but no API routes use it. All Prisma calls bypass the pool.

### Solution

```typescript
// lib/db.ts — ensure pool is wired to routes
import { PrismaPoolManager } from './pool-manager';

const pool = new PrismaPoolManager({ maxConnections: 10 });

export function getPrismaFromPool() {
  return pool.acquire();
}

export function returnPrismaToPool(client: any) {
  pool.release(client);
}

// In routes (ST-02 pattern already establishes getDBClient):
// For heavy DB operations, use pool directly:
import { getPrismaFromPool, returnPrismaToPool } from '@/lib/db';

const prisma = getPrismaFromPool();
try {
  const projects = await prisma.project.findMany({ where: { userId: auth.userId } });
  return NextResponse.json(projects);
} finally {
  returnPrismaToPool(prisma);
}
```

### Acceptance Tests

```typescript
// __tests__/lib/db-pool.test.ts
it('reuses connection after release', async () => {
  const client1 = getPrismaFromPool();
  returnPrismaToPool(client1);
  const client2 = getPrismaFromPool();
  // Same underlying connection returned
  expect(client2).toBe(client1);
});

it('respects maxConnections limit', async () => {
  const clients = [];
  for (let i = 0; i < 10; i++) clients.push(getPrismaFromPool());
  // 11th call should wait or throw pool exhausted error
  expect(() => getPrismaFromPool()).toThrow('Pool exhausted');
});
```

### Files Changed
- `vibex-backend/src/lib/db.ts`

---

## ST-10: Implement Flow Execution TODO Stubs

### Context

`lib/prompts/flow-execution.ts` has 4 `TODO:` stubs (lines 792, 813, 847, 869) that describe execution logic but contain no implementation. Calling these endpoints returns `{ success: true, data: null }` silently.

### Implementation (from Architecture Doc)

```typescript
// lib/prompts/flow-execution.ts

export type FlowStepType = 'llm' | 'code' | 'wait';

export interface FlowStep {
  id: string;
  type: FlowStepType;
  config: Record<string, unknown>;
}

export async function executeFlow(
  params: { flowId: string; steps: FlowStep[]; context?: Record<string, unknown> },
  env: CloudflareEnv
): Promise<FlowExecutionResult> {
  const results: FlowStepResult[] = [];

  for (const step of params.steps) {
    const stepStart = Date.now();
    try {
      switch (step.type) {
        case 'llm': {
          const output = await executeLLMStep(step, params.context, env);
          results.push({ stepId: step.id, output, status: 'success', durationMs: Date.now() - stepStart });
          break;
        }
        case 'code': {
          const output = await executeCodeStep(step, params.context);
          results.push({ stepId: step.id, output, status: 'success', durationMs: Date.now() - stepStart });
          break;
        }
        case 'wait': {
          const delay = (step.config.durationMs as number) ?? 1000;
          await new Promise(r => setTimeout(r, delay));
          results.push({ stepId: step.id, output: { waitedMs: delay }, status: 'success', durationMs: Date.now() - stepStart });
          break;
        }
        default:
          results.push({ stepId: step.id, output: null, status: 'skipped', durationMs: Date.now() - stepStart });
      }
    } catch (err) {
      results.push({
        stepId: step.id,
        output: null,
        status: 'failed',
        error: err instanceof Error ? err.message : String(err),
        durationMs: Date.now() - stepStart,
      });
    }
  }
  return { flowId: params.flowId, steps: results, completedAt: new Date().toISOString(), durationMs: 0 };
}
```

### Acceptance Tests

```typescript
// __tests__/lib/flow-execution.test.ts
it('wait step returns waitedMs in output', async () => {
  const result = await executeFlow({
    flowId: 'test', steps: [{ id: 's1', type: 'wait', config: { durationMs: 10 } }],
  }, testEnv);
  expect(result.steps[0].status).toBe('success');
  expect(result.steps[0].output).toEqual({ waitedMs: 10 });
});

it('step output is not null on success', async () => {
  const result = await executeFlow({ flowId: 'test', steps: [{ id: 's1', type: 'wait', config: { durationMs: 1 } }] }, testEnv);
  expect(result.steps[0]).not.toEqual({ stepId: 's1', output: null, status: 'failed', error: undefined });
});
```

### Files Changed
- `vibex-backend/src/lib/prompts/flow-execution.ts`

---

## ST-11: Add clarificationId DB Index

### Context

`Entity.clarificationId` and `Clarification.entityId` are queried but lack indexes, causing full table scans on large datasets.

### Migration

```sql
-- migrations/YYYYMMDDHHMMSS_add_clarification_indexes.sql
CREATE INDEX IF NOT EXISTS idx_entity_clarification_id ON Entity(clarificationId);
CREATE INDEX IF NOT EXISTS idx_clarification_entity_id ON Clarification(entityId);
```

### Acceptance Tests

```bash
# Verify index exists and is used
sqlite3 .prisma/client/dev.db "EXPLAIN QUERY PLAN SELECT * FROM Entity WHERE clarificationId = 'test';"
# Should show: USING INDEX idx_entity_clarification_id
```

### Files Changed
- `vibex-backend/prisma/migrations/YYYYMMDDHHMMSS_add_clarification_indexes.sql` (new)

---

## Rollback Procedures

| Story | Rollback Action |
|-------|----------------|
| ST-07 | Revert logger.ts, routes revert to `console.log` |
| ST-08 | Re-add empty `catch {}` blocks (this is acceptable if logger unavailable) |
| ST-09 | Revert pool wiring, routes use direct `getDBClient()` |
| ST-10 | Revert to TODO stubs in flow-execution.ts |
| ST-11 | `prisma migrate rollback` or `DROP INDEX` |
