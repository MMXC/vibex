# PRD: Vibex Dev Proposals — Backend Bug Fixes & Quality Improvements

**Project**: vibex-dev-security-20260410
**Author**: PM Agent
**Date**: 2026-04-10
**Status**: Draft → Ready for Review
**Repo**: `/root/.openclaw/vibex`

---

## 1. Executive Summary

### 1.1 Background

Vibex 是基于 Next.js (App Router) + Cloudflare Workers (D1) + Prisma + SQLite 的 AI 原型生成平台。本次提案聚焦于 **backend 代码质量**的系统性修复，源于对 `vibex-backend/src/` 下 251 个 TypeScript 文件的全面扫描，共发现 10 个可执行的改进点（8 个 Bug/Perf，2 个 Docs）。

核心问题集中在三类：
1. **部署阻断**：Workers 环境中 PrismaClient 未隔离，导致部署失败
2. **运行时缺陷**：流式响应闭包 this 引用错误、关系查询数据丢失
3. **安全/性能风险**：内存缓存跨请求泄漏、日志泄露敏感信息

### 1.2 Goals

- 消除所有 P0 部署阻断问题（2 项）
- 修复 P1 数据正确性和安全风险（4 项）
- 改进 P2 质量和性能（3 项）
- 补充 P3 文档和工具链（1 项）

### 1.3 Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Wrangler deploy dry-run | ✅ 无 PrismaClient 警告 | `wrangler deploy --dry-run` |
| 流式响应崩溃率 | 0%（当前 100% 崩溃） | 端到端 SSE 流测试 |
| 关系查询完整率 | 100%（当前仅返回首个 entity 的关系） | 集成测试 |
| 敏感信息日志泄露 | 0 条（entityId/token/usage/sk-） | grep 生产构建输出 |
| 内存缓存跨请求泄漏 | 0（冷启动后隔离） | Workers 冷启动测试 |
| CI 后端测试覆盖率 | ≥ 80% | vitest coverage |

---

## 2. Feature List

| ID | 功能名称 | 描述 | 根因关联 | 优先级 | 估算工时 |
|----|---------|------|---------|--------|---------|
| F-01 | 流式响应 `this` 绑定修复 | `createStreamingResponse` 中 `thisLLMService` 引用顺序错误导致 ReadableStream 崩溃 | D-01 | P0 | 1h |
| F-02 | Workers DB 客户端统一 | 所有 API 路由替换为 `getDBClient()`，兼容 D1（Workers）和 Prisma（本地） | D-02 | P0 | 1.5h |
| F-03 | 关系查询多 ID 修复 | `getRelationsForEntities` 只用首个 entityId，改为 `IN` 查询获取所有关系 | D-03 | P1 | 0.5h |
| F-04 | D1 KV 缓存替换内存 Map | `RequirementAnalyzerService` 的内存 Map 缓存替换为 D1 KV，解决跨请求泄漏 | D-04 | P1 | 1h |
| F-05 | 生产日志脱敏 | `console.log` 替换为 `logger`，禁止输出 entityId/token/usage/sk- | D-05 | P1 | 0.5h |
| F-06 | 连接池启用 | `PrismaPoolManager` 已有但未被使用，改为 API 路由默认使用方式 | D-06 | P2 | 0.5h |
| F-07 | Flow 执行实现 | `flow-execution.ts` 中 4 处 `TODO` 标记替换为实际逻辑 | D-07 | P2 | 1h |
| F-08 | clarificationId 索引 | 数据库添加索引，消除全表扫描 | D-08 | P2 | 0.5h |
| F-09 | 重复代码清理 | `login/route.ts` 路径拼接重复（同一路径拼接两次） | D-09 | P3 | 0.25h |
| F-10 | Workers 开发规范文档 | `AGENTS.md` 补充 D1 vs Prisma、`isWorkers` 守卫、缓存策略等规范 | D-10 | P3 | 0.25h |
| **合计** | | | | | **7.0h** |

---

## 3. Epic Breakdown

### Epic 1: Core Infrastructure & Streaming (ST-01, ST-02)

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| ST-01 | 修复 `createStreamingResponse` this 绑定 | 1h | SSE 流正常返回，无 ReferenceError |
| ST-02 | Workers 统一 DB 客户端（8+ 路由） | 1.5h | wrangler dry-run 无 PrismaClient 警告，本地测试回归通过 |

### Epic 2: Data Integrity (ST-03, ST-04)

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| ST-03 | 修复 `getRelationsForEntities` 多 ID 查询 | 0.5h | 3 个 entity 的关系查询返回 ≥ 2 条记录 |
| ST-04 | 内存 Map 缓存替换为 D1 KV | 1h | 冷启动后缓存隔离，无跨请求数据泄漏 |

### Epic 3: Quality & Logging (ST-05, ST-06)

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| ST-05 | 生产日志脱敏 + 空 catch 块清理 | 0.5h | `grep -r "console.log" dist/` 无敏感词，本源无空 catch |
| ST-06 | PrismaPoolManager 连接池启用 | 0.5h | 连接复用率 ≥ 80%，无连接泄漏 |

### Epic 4: Execution & Indexing (ST-07, ST-08)

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| ST-07 | Flow 执行 TODO 替换为实际逻辑 | 1h | `/api/flows/execute` 返回非 null step outputs |
| ST-08 | clarificationId 数据库索引 | 0.5h | EXPLAIN QUERY PLAN 显示 `USING INDEX` 而非 `SCAN TABLE` |

### Epic 5: Polish (ST-09, ST-10)

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| ST-09 | 清理 `login/route.ts` 重复代码 | 0.25h | 文件 < 200 行，功能回归正常 |
| ST-10 | Workers 开发规范补充到 AGENTS.md | 0.25h | `grep -c "getDBClient\|isWorkers\|CACHE_KV" AGENTS.md` ≥ 3 |

---

## 4. Acceptance Criteria

### ST-01: 流式响应 this 绑定

```typescript
// expect(): SSE 流正常返回
const response = await llmService.createStreamingResponse({ model: 'gpt-4', messages: [] });
expect(response.headers.get('Content-Type')).toBe('text/event-stream');
// expect(): 无 ReferenceError
let hasError = false;
response.body.pipeTo(new WritableStream({
  write(chunk) { /* 正常处理 */ },
  error() { hasError = true; }
}));
await response.body.cancel();
expect(hasError).toBe(false);
```

### ST-02: Workers DB 客户端统一

```typescript
// expect(): wrangler deploy --dry-run 无 @prisma/client 警告
// expect(): 本地 pnpm dev 下 /api/v1/chat 返回 200/401（不崩溃）
const res = await fetch('http://localhost:3000/api/v1/chat', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer invalid' },
  body: JSON.stringify({ message: 'hello' })
});
expect(res.status).not.toBe(500);
// expect(): 路由文件中无 "new PrismaClient()"
expect(source).not.toMatch(/new PrismaClient\(\)/);
```

### ST-03: 关系查询多 ID

```typescript
// expect(): 3 个 entity 的关系查询返回所有相关关系
const entities = await createTestEntities(3);
const relations = await analyzer.getRelationsForEntities(entities.map(e => e.id));
expect(relations.length).toBeGreaterThanOrEqual(2); // 至少 2 条关系
```

### ST-04: D1 KV 缓存

```typescript
// expect(): 冷启动后缓存 miss
const serviceA = new RequirementAnalyzerService(env);
await serviceA.analyze(reqA);
const serviceB = new RequirementAnalyzerService(env); // 模拟冷启动
const cached = await serviceB.getCache(`req:${reqA.id}`);
expect(cached).toBeNull();
// expect(): 正常缓存命中
const cached2 = await serviceA.getCache(`req:${reqA.id}`);
expect(cached2).not.toBeNull();
```

### ST-05: 日志脱敏

```typescript
// expect(): 生产构建中无敏感信息
// $ grep -r "console.log" dist/ | grep -E "entityId|token|usage|sk-|password"
// → 返回空
// expect(): 空 catch 块已清理
// $ grep -r "catch\s*{\s*}" src/
// → 返回空
```

### ST-06: 连接池

```typescript
// expect(): 同一连接被复用
const prisma1 = pool.acquire();
pool.release(prisma1);
const prisma2 = pool.acquire();
expect(prisma2).toBe(prisma1); // 同一实例
// expect(): 连接不泄漏
const before = pool.activeCount;
for (let i = 0; i < 20; i++) {
  const p = pool.acquire();
  pool.release(p);
}
expect(pool.activeCount).toBeLessThanOrEqual(before + 2);
```

### ST-07: Flow 执行

```typescript
// expect(): 返回非 null 输出
const result = await executeFlow({ flowId: testFlow.id });
expect(result.success).toBe(true);
expect(result.data?.steps?.length).toBeGreaterThan(0);
// expect(): 不再静默失败
expect(result.data).not.toBeNull();
```

### ST-08: 索引

```typescript
// expect(): 使用索引而非全表扫描
const plan = await db.explain('SELECT * FROM Clarification WHERE clarificationId = ?', [testId]);
expect(plan).toContain('USING INDEX');
expect(plan).not.toContain('SCAN TABLE');
```

### ST-09: 重复代码

```typescript
// expect(): 文件行数合理
const lines = fs.readFileSync('app/api/auth/login/route.ts', 'utf8').split('\n');
expect(lines.length).toBeLessThan(200);
// expect(): 路径拼接无重复
expect(content).not.toMatch(/(path1|path2).*\1/);
```

### ST-10: Workers 开发规范

```typescript
// expect(): AGENTS.md 包含关键规范
const content = fs.readFileSync('AGENTS.md', 'utf8');
expect(content).toMatch(/getDBClient/);
expect(content).toMatch(/CACHE_KV/);
expect(content).toMatch(/withAuth/);
```

---

## 5. Definition of Done

### 通用 DoD（所有 Story）

- [ ] 代码修改已提交到 `vibex-backend/` 分支
- [ ] `pnpm --filter vibex-backend run typecheck` 通过
- [ ] `pnpm --filter vibex-backend run lint` 通过（无空 catch 规则启用）
- [ ] 单元测试或集成测试覆盖修改路径
- [ ] 功能手动验证完成（参考验收标准）
- [ ] PR 创建并通过 Code Review

### Epic 专属 DoD

| Epic | 额外要求 |
|------|---------|
| Epic 1 | `wrangler deploy --dry-run` 无 PrismaClient 警告；SSE 流端到端测试通过 |
| Epic 2 | D1 迁移文件已创建；冷启动隔离测试通过 |
| Epic 3 | 生产构建日志无敏感信息；连接池复用率 ≥ 80% |
| Epic 4 | Flow 执行返回非 null；索引已应用并验证 |
| Epic 5 | 文件行数 ≤ 200；AGENTS.md 包含 ≥ 3 个关键规范 |

---

## 6. 功能点汇总表（含页面集成标注）

| 功能 ID | 页面/模块 | 变更类型 | 涉及文件 | 回滚难度 |
|---------|---------|---------|---------|---------|
| F-01 | Backend / LLM Service | Bug fix | `services/llm.ts` | 低 |
| F-02 | Backend / All API Routes | Bug fix | `lib/db.ts` + 8+ 路由文件 | 中 |
| F-03 | Backend / Requirement Analyzer | Bug fix | `services/requirement-analyzer.ts` | 低 |
| F-04 | Backend / Requirement Analyzer | Bug fix | `services/requirement-analyzer.ts` | 中 |
| F-05 | Backend / All API + Services | Perf/Security | 4+ 路由文件 + logger.ts | 低 |
| F-06 | Backend / DB Layer | Perf | `lib/db.ts` + 路由 | 低 |
| F-07 | Backend / Flow Execution | Feature | `lib/prompts/flow-execution.ts` | 中 |
| F-08 | Backend / DB Schema | Perf | 新增 migration 文件 | 高 |
| F-09 | Backend / Auth | Cleanup | `app/api/auth/login/route.ts` | 低 |
| F-10 | Backend / Docs | Docs | `vibex-backend/AGENTS.md` | 无 |

---

## 7. 实施计划（Sprint 排期）

> **总工时**: ~7h（可在 1 个 Sprint 完成，1.5-2 人天）

### Sprint 1: Core Fixes（2.5h）

| 时间 | Story | 任务 | 负责人 |
|------|-------|------|--------|
| 0-0.5h | ST-01 | 修复 `createStreamingResponse` this 绑定 + 写测试 | Dev |
| 0.5-2h | ST-02 | 统一 DB 客户端：替换 8+ 路由 + wrangler 配置 | Dev |
| 2-2.5h | ST-03 | 修复 `getRelationsForEntities` IN 查询 + 集成测试 | Dev |

### Sprint 2: Data & Quality（2h）

| 时间 | Story | 任务 | 负责人 |
|------|-------|------|--------|
| 0-1h | ST-04 | D1 KV 缓存替换 + migration + 测试 | Dev |
| 1-1.5h | ST-05 | 共享 logger 库 + 日志脱敏 + 空 catch 清理 | Dev |
| 1.5-2h | ST-06 | 启用 PrismaPoolManager + 连接池测试 | Dev |

### Sprint 3: Execution & Polish（2.5h）

| 时间 | Story | 任务 | 负责人 |
|------|-------|------|--------|
| 0-1h | ST-07 | Flow 执行 TODO 替换为实际逻辑 + 测试 | Dev |
| 1-1.5h | ST-08 | clarificationId 索引 migration + EXPLAIN 验证 | Dev |
| 1.5-2h | ST-09 | 清理 `login/route.ts` 重复代码 | Dev |
| 2-2.5h | ST-10 | Workers 规范补充 AGENTS.md + 合并 PR | Dev |

---

## 8. Appendix: Proposal-to-Story Mapping

| 原始提案 | Story | Epic | 优先级 |
|---------|-------|------|--------|
| D-01 | ST-01 | Epic 1 | P0 |
| D-02 | ST-02 | Epic 1 | P0 |
| D-03 | ST-03 | Epic 2 | P1 |
| D-04 | ST-04 | Epic 2 | P1 |
| D-05 | ST-05 | Epic 3 | P1 |
| D-06 | ST-06 | Epic 3 | P2 |
| D-07 | ST-07 | Epic 4 | P2 |
| D-08 | ST-08 | Epic 4 | P2 |
| D-09 | ST-09 | Epic 5 | P3 |
| D-10 | ST-10 | Epic 5 | P3 |
