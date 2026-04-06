# Epic 1: P0 Critical Bugs

**Epic ID**: EPIC-01  
**Priority**: P0 — Critical  
**Estimated**: 4h  
**Stories**: ST-01, ST-02, ST-03, ST-04

---

## ST-01: Fix Streaming Response `this` Binding

### Context

`createStreamingResponse()` in `services/llm.ts` declares `const thisLLMService = this` **after** the `ReadableStream` constructor's `start` callback, which runs synchronously. This causes a `ReferenceError: thisLLMService is not defined` in production.

### Technical Fix

Move `const thisLLMService = this` to before the `new ReadableStream({...})` call.

```typescript
// ✅ CORRECT ORDER
async createStreamingResponse(options, onChunk?) {
  const thisLLMService = this; // ← BEFORE ReadableStream
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of thisLLMService.streamChat(options)) {
          controller.enqueue(new TextEncoder().encode(JSON.stringify(chunk) + '\n'));
          onChunk?.(chunk);
        }
        controller.close();
      } catch (e) {
        controller.error(e);
      }
    },
  });
  return new Response(stream, { headers: { 'Content-Type': 'text/event-stream' } });
}
```

### Acceptance Tests

```typescript
// __tests__/services/llm.test.ts
expect(() => svc.createStreamingResponse({ messages: [...] })).not.toThrow(ReferenceError);

const response = await svc.createStreamingResponse({ messages: [...] });
expect(response.headers.get('Content-Type')).toBe('text/event-stream');

const reader = response.body!.getReader();
const { done } = await reader.read();
expect(done).toBe(false); // stream not exhausted immediately
```

### Files Changed
- `vibex-backend/src/services/llm.ts`

---

## ST-02: PrismaClient Workers Isolation (16+ Routes)

### Context

8+ API routes directly call `new PrismaClient()` without the `isWorkers` guard from `lib/db.ts`. This causes:
1. Prisma binary bundling failure on Workers deploy (`wrangler deploy`)
2. Wrong database connection (SQLite path vs D1 binding) in production

### Fix Pattern

```typescript
// ❌ BEFORE
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// ✅ AFTER
import { getDBClient } from '@/lib/db';
const prisma = getDBClient(env, isWorkers);
```

### Affected Routes (at least 16)

```
app/api/v1/chat/route.ts
app/api/v1/canvas/generate/route.ts
app/api/v1/canvas/generate-contexts/route.ts
app/api/v1/canvas/generate-components/route.ts
app/api/v1/canvas/generate-flows/route.ts
app/api/v1/canvas/stream/route.ts
app/api/v1/canvas/status/route.ts
app/api/v1/canvas/export/route.ts
app/api/v1/canvas/project/route.ts
app/api/v1/ai-ui-generation/route.ts
app/api/v1/domain-model/[projectId]/route.ts
app/api/v1/prototype-snapshots/route.ts
app/api/v1/prototype-snapshots/[id]/route.ts
app/api/v1/agents/route.ts
app/api/v1/agents/[id]/route.ts
app/api/v1/pages/route.ts
app/api/v1/pages/[id]/route.ts
```

### Acceptance Tests

```bash
# No Prisma warnings in dry-run
wrangler deploy --dry-run 2>&1 | grep -i "prisma\|warning" | expect empty

# All tests pass
pnpm --filter vibex-backend run test
```

### Files Changed
- `vibex-backend/src/lib/db.ts` (extend with isWorkers flag)
- All 16+ API route files above

---

## ST-03: Fix Multi-Entity Relations Query

### Context

`getRelationsForEntities(entityIds: string[])` only queries the first element `entityIds[0]`, returning incomplete relation data.

### Fix

```typescript
// ❌ BEFORE
private async getRelationsForEntities(entityIds: string[]): Promise<EntityRelation[]> {
  if (entityIds.length === 0) return [];
  return listEntityRelations(this.env, {
    whereClause: 'sourceEntityId = ? OR targetEntityId = ?',
    params: [entityIds[0], entityIds[0]],
  });
}

// ✅ AFTER
private async getRelationsForEntities(entityIds: string[]): Promise<EntityRelation[]> {
  if (entityIds.length === 0) return [];
  const placeholders = entityIds.map(() => '?').join(',');
  return listEntityRelations(this.env, {
    whereClause: `sourceEntityId IN (${placeholders}) OR targetEntityId IN (${placeholders})`,
    params: [...entityIds, ...entityIds], // source and target
  });
}
```

### Acceptance Tests

```typescript
// __tests__/services/requirement-analyzer.test.ts
it('returns relations for ALL entity IDs, not just the first', async () => {
  const analyzer = new RequirementAnalyzerService(testEnv);
  const entities = await createTestEntities(3); // e1, e2, e3
  await createTestRelation(e1.id, e2.id); // e1→e2
  await createTestRelation(e2.id, e3.id); // e2→e3
  const relations = await analyzer.getRelationsForEntities([e1.id, e2.id, e3.id]);
  expect(relations.length).toBeGreaterThanOrEqual(2);
  // Every relation involves at least one input entity
  relations.forEach(r => {
    const involved = [e1.id, e2.id, e3.id];
    expect(involved.some(id => r.sourceEntityId === id || r.targetEntityId === id)).toBe(true);
  });
});
```

### Files Changed
- `vibex-backend/src/services/requirement-analyzer.ts`

---

## ST-04: D1 KV Cache (Replace In-Memory Map)

### Context

`RequirementAnalyzerService` uses `this.cache = new Map<string, CachedResult>()`. In Cloudflare Workers, each invocation may be a new isolate — the Map persists within a warm instance but data from other instances is inaccessible, causing inconsistency.

### Fix

```typescript
// Replace: private cache = new Map<string, CachedResult>();
// With D1 KV binding methods:

private async getCache(key: string): Promise<CachedResult | null> {
  const { results } = await this.env.CACHE_KV.prepare(
    'SELECT value FROM cache WHERE key = ? AND expires_at > ?'
  ).bind(key, Date.now()).all();
  return results[0] ? JSON.parse(results[0].value) : null;
}

private async setCache(key: string, value: CachedResult): Promise<void> {
  const ttl = parseInt(this.env.CACHE_TTL_SECONDS ?? '3600');
  const expiresAt = Date.now() + ttl * 1000;
  await this.env.CACHE_KV.prepare(
    'INSERT OR REPLACE INTO cache (key, value, expires_at) VALUES (?, ?, ?)'
  ).bind(key, JSON.stringify(value), expiresAt).run();
}
```

### D1 Migration

```sql
-- migrations/YYYYMMDDHHMMSS_add_cache_table.sql
CREATE TABLE IF NOT EXISTS cache (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);
```

### Acceptance Tests

```typescript
it('cache is isolated between cold starts', async () => {
  const analyzer1 = new RequirementAnalyzerService(testEnv);
  await analyzer1.setCache('key1', { result: 'data' });

  // Simulate cold start: new instance
  const analyzer2 = new RequirementAnalyzerService(testEnv);
  const cached = await analyzer2.getCache('key1');
  expect(cached).toBeNull(); // No cross-instance Map persistence
});
```

### Files Changed
- `vibex-backend/src/services/requirement-analyzer.ts`
- `vibex-backend/src/lib/db.ts` (extend)
- `vibex-backend/prisma/migrations/YYYYMMDDHHMMSS_add_cache_table.sql` (new)
- `vibex-backend/wrangler.toml` (add CACHE_KV binding)

---

## Rollback Procedures

| Story | Rollback Action |
|-------|----------------|
| ST-01 | Revert to original `this` assignment order in `llm.ts` |
| ST-02 | Revert all routes to `new PrismaClient()`, redeploy |
| ST-03 | Revert to `entityIds[0]` in `requirement-analyzer.ts` |
| ST-04 | Revert `RequirementAnalyzerService` to `new Map()` cache |
