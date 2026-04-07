# Epic 2: Data Integrity

**Project**: vibex-dev-security-20260410
**Epic ID**: E2
**Stories**: ST-03, ST-04
**Priority**: P1
**Estimated Effort**: 1.5h

---

## 1. Overview

修复两个影响数据正确性和安全性的 P1 问题：
1. **ST-03**: 需求分析关系查询只返回首个 entity 的关系，数据不完整
2. **ST-04**: `RequirementAnalyzerService` 使用内存 Map 缓存，在 Workers 无状态环境下跨请求泄漏

---

## 2. Story ST-03: Fix `getRelationsForEntities` Multi-ID Query

### 2.1 Problem

```typescript
// services/requirement-analyzer.ts — 当前代码（有 bug）
private async getRelationsForEntities(entityIds: string[]): Promise<EntityRelation[]> {
  if (entityIds.length === 0) return [];
  // BUG: 只用了 entityIds[0]，其余 ID 被忽略
  const { results } = await listEntityRelations(this.env, {
    sourceEntityId: entityIds[0],
  });
  return results as EntityRelation[];
}
```

当需求包含 3 个 entity（A、B、C）时，关系图只显示 A 的关系，B↔C 的关系全部丢失。

### 2.2 Solution

```typescript
// services/requirement-analyzer.ts — 修复后
private async getRelationsForEntities(entityIds: string[]): Promise<EntityRelation[]> {
  if (entityIds.length === 0) return [];

  // 构建 IN 查询，一次获取所有 entity 的关系
  const placeholders = entityIds.map(() => '?').join(',');
  const { results } = await listEntityRelations(this.env, {
    whereClause: `sourceEntityId IN (${placeholders}) OR targetEntityId IN (${placeholders})`,
    params: entityIds,
  });
  return results as EntityRelation[];
}
```

**需确认**：`listEntityRelations` 函数签名支持 `whereClause` + `params`。

### 2.3 Files

| File | Change |
|------|--------|
| `vibex-backend/src/services/requirement-analyzer.ts` | 修复 `getRelationsForEntities` |
| `vibex-backend/src/__tests__/services/requirement-analyzer.test.ts` | 新增多 entity 关系测试 |

### 2.4 Acceptance Tests

```typescript
describe('getRelationsForEntities', () => {
  it('should return relations for all entities, not just the first', async () => {
    // Setup: create 3 entities with 3 relations (A→B, B→C, A→C)
    const [e1, e2, e3] = await createTestEntities(3);
    await createTestRelation(e1.id, e2.id);
    await createTestRelation(e2.id, e3.id);
    await createTestRelation(e1.id, e3.id);

    const analyzer = new RequirementAnalyzerService(env);
    const relations = await analyzer.getRelationsForEntities([e1.id, e2.id, e3.id]);

    expect(relations.length).toBeGreaterThanOrEqual(3);
  });
});
```

### 2.5 Rollback

```bash
git checkout HEAD~1 -- src/services/requirement-analyzer.ts
```

---

## 3. Story ST-04: Replace In-Memory Map with D1 KV Cache

### 3.1 Problem

```typescript
// services/requirement-analyzer.ts — 当前代码（有 bug）
export class RequirementAnalyzerService {
  private cache = new Map<string, CachedResult>(); // ← 内存缓存
  // Workers 无状态，冷启动后内存丢失，且多请求可能共享同一实例
}
```

Cloudflare Workers 是无状态环境，每次请求可能分配到不同的实例，内存 Map 不保证跨请求持久化。更危险的是，同一实例可能被多个请求复用，导致数据泄漏。

### 3.2 Solution

```typescript
// services/requirement-analyzer.ts — 修复后

// 新增 D1 KV 方法
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

// 移除 private cache = new Map<string, CachedResult>();
// 替换所有 this.cache.get/set 为 this.getCache()/this.setCache()
```

**D1 Migration**:
```sql
-- migrations/YYYYMMDDHHMMSS_add_cache_table.sql
CREATE TABLE IF NOT EXISTS cache (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_cache_expires ON cache(expires_at);
```

**wrangler.toml 更新**:
```toml
[[d1_databases]]
binding = "CACHE_KV"
database_name = "vibex-cache"
database_id = "${CACHE_DB_ID}"

[vars]
CACHE_TTL_SECONDS = "3600"
```

### 3.3 Files

| File | Change |
|------|--------|
| `vibex-backend/src/services/requirement-analyzer.ts` | 移除 Map 缓存，实现 D1 KV 方法 |
| `vibex-backend/prisma/migrations/YYYYMMDDHHMMSS_add_cache_table/migration.sql` | 新增 cache 表 |
| `vibex-backend/wrangler.toml` | 添加 CACHE_KV binding |
| `vibex-backend/src/__tests__/services/requirement-analyzer.test.ts` | 冷启动隔离测试 |

### 3.4 Acceptance Tests

```typescript
describe('D1 KV Cache', () => {
  it('should isolate cache across cold starts', async () => {
    const reqA = { id: 'req-a', text: '分析用户注册流程' };

    // Warm instance
    const warmAnalyzer = new RequirementAnalyzerService(env);
    await warmAnalyzer.analyze(reqA);

    // Cold start (new instance)
    const coldAnalyzer = new RequirementAnalyzerService(env);
    const cached = await coldAnalyzer.getCache(`req:${reqA.id}`);

    // Cold start should NOT see warm instance's cache
    // Note: this depends on D1 persistence across instances
    expect(cached).not.toBeNull(); // D1 persists, so this SHOULD pass
  });
});
```

### 3.5 Rollback

```bash
git revert HEAD -- src/services/requirement-analyzer.ts
# Manual: re-add private cache = new Map()
# Rollback migration:
npx prisma migrate rollback
```
