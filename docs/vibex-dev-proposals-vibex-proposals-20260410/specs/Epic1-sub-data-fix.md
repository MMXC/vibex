# Epic Spec: Epic1-sub-data-fix — 数据正确性与安全

**Epic**: Epic1-sub-data-fix  
**Parent**: vibex-dev-proposals-vibex-proposals-20260410  
**Stories**: ST-03, ST-04  
**Total Estimate**: 1.5h  
**Priority**: P1  

---

## Story ST-03: 修复 `getRelationsForEntities` 多 ID 查询

### 文件
`services/requirement-analyzer.ts` L423

### 问题描述
`getRelationsForEntities` 方法只使用 `entityIds[0]` 查询关系，忽略其余 entityId，导致多实体需求分析时关系图不完整。

```typescript
// 错误代码
private async getRelationsForEntities(entityIds: string[]): Promise<EntityRelation[]> {
  if (entityIds.length === 0) return [];
  return listEntityRelations(this.env, {
    sourceEntityId: entityIds[0], // ← BUG: 只用第一个 ID
  });
}
```

### 技术方案
采用 **D1 `IN` 查询**（一次查询获取所有关系，性能最优）：
```typescript
private async getRelationsForEntities(entityIds: string[]): Promise<EntityRelation[]> {
  if (entityIds.length === 0) return [];
  
  const placeholders = entityIds.map(() => '?').join(',');
  return listEntityRelations(this.env, {
    whereClause: `sourceEntityId IN (${placeholders}) OR targetEntityId IN (${placeholders})`,
    params: [...entityIds, ...entityIds], // sourceEntityId IN + targetEntityId IN
  });
}
```

### 验收测试
```typescript
// tests/unit/requirement-analyzer.test.ts
describe('getRelationsForEntities', () => {
  it('should return relations for all entity IDs, not just the first', async () => {
    // 准备：3 个 entity，entity1→entity2, entity2→entity3
    const entities = await createTestEntities(3);
    await createTestRelation(entities[0].id, entities[1].id);
    await createTestRelation(entities[1].id, entities[2].id);
    
    const analyzer = new RequirementAnalyzerService(mockEnv);
    const relations = await analyzer.getRelationsForEntities(
      entities.map(e => e.id)
    );
    
    // 验证：应返回 2 条关系，而非 1 条
    expect(relations.length).toBe(2);
    expect(relations.map(r => r.sourceEntityId).sort())
      .toEqual([entities[0].id, entities[1].id].sort());
  });

  it('should return empty array for empty entityIds', async () => {
    const analyzer = new RequirementAnalyzerService(mockEnv);
    const relations = await analyzer.getRelationsForEntities([]);
    expect(relations).toEqual([]);
  });
});
```

### 页面集成
- 需求分析页面 → `/api/requirement-analyzer` → 生成实体关系图
- 关系不完整直接影响用户看到的关系图缺失连接线

---

## Story ST-04: 替换内存缓存为 D1 KV

### 文件
`services/requirement-analyzer.ts`

### 问题描述
`RequirementAnalyzerService` 使用 `this.cache = new Map()` 内存缓存，在 Cloudflare Workers 无状态环境中：
1. 冷启动后缓存清空（符合预期）
2. **跨请求可能泄漏**：Workers 可能在同一实例内复用上下文，导致上一请求的数据残留在 `Map` 中

### 技术方案
改用 D1 KV 持久化缓存，确保隔离：
```typescript
// services/requirement-analyzer.ts
// 替换前
private cache = new Map<string, CachedResult>();

// 替换后
private async getCache(key: string): Promise<CachedResult | null> {
  try {
    const result = await this.env.KV.prepare(
      'SELECT value, expires_at FROM cache WHERE key = ?'
    ).bind(key).first();
    if (!result) return null;
    if (new Date(result.expires_at) < new Date()) {
      // 过期，删除
      await this.env.KV.prepare('DELETE FROM cache WHERE key = ?').bind(key).run();
      return null;
    }
    return JSON.parse(result.value);
  } catch {
    return null; // D1 不可用时降级
  }
}

private async setCache(key: string, value: CachedResult, ttlSeconds = 3600): Promise<void> {
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();
  await this.env.KV.prepare(
    'INSERT OR REPLACE INTO cache (key, value, expires_at) VALUES (?, ?, ?)'
  ).bind(key, JSON.stringify(value), expiresAt).run();
}
```

### D1 缓存表 schema
```sql
CREATE TABLE IF NOT EXISTS cache (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  expires_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_cache_expires ON cache(expires_at);
```

### 验收测试
```typescript
// tests/integration/cache-isolation.test.ts
describe('Cache Isolation', () => {
  it('should not leak cache across requests after cold start', async () => {
    const analyzer = new RequirementAnalyzerService(mockEnvWithD1);
    
    // reqA 写入缓存
    const payloadA = { entities: [{ id: 'a', name: 'EntityA' }] };
    await analyzer.setCache('reqA', payloadA);
    
    // 模拟冷启动（new 实例）
    const analyzer2 = new RequirementAnalyzerService(mockEnvWithD1);
    
    // reqB 应不返回 reqA 的数据
    const cached = await analyzer2.getCache('reqB');
    expect(cached).toBeNull();
  });

  it('should expire cache after TTL', async () => {
    const analyzer = new RequirementAnalyzerService(mockEnvWithD1);
    const payload = { result: 'test' };
    await analyzer.setCache('short-lived', payload, 0); // 0 秒 TTL
    
    // 等待过期（实际测试可 mock 时间）
    await wait(100);
    const cached = await analyzer.getCache('short-lived');
    expect(cached).toBeNull();
  });
});
```

### 页面集成
- 需求分析页面缓存层，跨请求隔离确保数据安全

---

## Epic 验收

- [ ] ST-03: 3 个 entity 的关系查询返回完整（≥2 条关系）
- [ ] ST-04: 冷启动后无跨请求缓存泄漏
- [ ] D1 缓存表 migration 已创建并执行
- [ ] 集成测试覆盖缓存隔离场景
