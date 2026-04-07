# PRD: Vibex Backend Dev Proposals — Bug Fixes & Optimizations

**Project**: vibex-dev-proposals-vibex-proposals-20260410  
**Author**: PM Agent  
**Date**: 2026-04-10  
**Status**: Draft → Ready for Review  
**Repo**: `/root/.openclaw/vibex`

---

## 1. 执行摘要（Executive Summary）

### 背景

Vibex 是一个 AI 驱动的应用原型生成平台，后端基于 **Next.js (App Router) + Cloudflare Workers (D1)** 架构，本地开发使用 Prisma + SQLite。2026-04-10 代码审计发现 10 个后端缺陷（Bug 5 个 + 性能优化 5 个），涵盖流式响应崩溃、Workers 部署阻断、数据查询错误、缓存泄漏、日志泄露等，直接影响用户核心体验和平台稳定性。

### 目标

修复所有 P0/P1 级 Bug（D-01 ~ D-05），实现 P2/P3 级优化（D-06 ~ D-10），确保：

1. 流式 AI 响应正常可用（无 500 错误）
2. Cloudflare Workers 部署路径可正常调用数据库
3. 需求分析的实体关系数据完整准确
4. 缓存跨请求隔离，无数据泄漏
5. 生产环境无敏感信息日志泄露
6. 连接池被正确使用
7. Flow 执行有明确反馈（非静默失败）
8. 关键查询有索引覆盖

### 成功指标

| 指标 | 目标值 | 测量方式 |
|------|--------|---------|
| 流式响应成功率 | ≥ 99% | POST /api/chat 调用无 500 错误 |
| Workers 部署 DB 可用性 | 100% | wrangler deploy 无 PrismaClient 警告 |
| 关系查询完整率 | 100% | 3+ 实体场景关系完整返回 |
| 缓存隔离率 | 100% | 冷启动后无跨请求数据泄漏 |
| 敏感日志泄露数 | 0 | 生产环境日志无 entityId/token/usage |
| 连接池复用率 | ≥ 80% | 10 次连续请求共用连接池 |
| Flow 执行反馈率 | 100% | 执行请求返回实际结果或 501 |
| 索引覆盖查询 | 100% | clarification 查询无全表扫描 |

---

## 2. Feature List（功能列表）

| ID | 功能名 | 描述 | 根因关联 | 工时 |
|----|--------|------|---------|------|
| F-01 | 修复流式响应 this 引用错误 | `createStreamingResponse` 闭包中 `thisLLMService` 引用顺序修复 | D-01 Bug | 0.5h |
| F-02 | 统一 Workers DB 客户端 | 所有 API 路由替换 `new PrismaClient()` 为 `getDBClient()` | D-02 Bug | 1.5h |
| F-03 | 修复关系查询逻辑错误 | `getRelationsForEntities` 支持多 entityId IN 查询 | D-03 Bug | 0.5h |
| F-04 | 替换内存缓存为 D1 KV | `RequirementAnalyzerService` 缓存从 `Map()` 迁移到 D1 KV | D-04 Bug | 1.0h |
| F-05 | 清理敏感信息日志 | 替换 console.log 为 devDebug，移除生产环境敏感输出 | D-05 Perf | 0.5h |
| F-06 | 启用连接池管理 | API 路由使用 `PrismaPoolManager` 而非直连 | D-06 Perf | 0.5h |
| F-07 | 实现 Flow 执行空函数 | 4 处 `TODO` 替换为实际执行逻辑 | D-07 Perf | 1.5h |
| F-08 | 添加 clarificationId 索引 | 创建数据库索引加速查询 | D-08 Perf | 0.5h |
| F-09 | 清理重复代码文件 | 修复 login/route.ts 文件重复拼接问题 | D-09 Perf | 0.5h |
| F-10 | 补充 AGENTS.md 开发指南 | 补充 Workers 环境开发规范 | D-10 Docs | 0.5h |

**总工时**: 7.5h（≈ 2 人日）

---

## 3. Epic 拆分（Epic Breakdown）

### Epic 1: `Epic1-sub-prisma-fix` — Prisma + Workers 核心修复

| Epic | Story | 工时 | 验收标准 |
|------|-------|------|---------|
| Epic1-sub-prisma-fix | ST-01: 修复 `createStreamingResponse` this 引用 | 0.5h | `expect(thisLLMService).not.toBeUndefined()` 在 start 执行前 |
| Epic1-sub-prisma-fix | ST-02: 统一 Workers DB 客户端（8+ 路由） | 1.5h | `expect(prisma).toBeDefined()` 且无 PrismaClient constructor 错误 |

### Epic 2: `Epic1-sub-data-fix` — 数据正确性与安全

| Epic | Story | 工时 | 验收标准 |
|------|-------|------|---------|
| Epic1-sub-data-fix | ST-03: 修复 `getRelationsForEntities` 多 ID 查询 | 0.5h | `expect(relations.length).toBeGreaterThan(1)` 3 个 entity 时 |
| Epic1-sub-data-fix | ST-04: 替换内存缓存为 D1 KV | 1.0h | `expect(cache.get(reqId)).not.toEqual(reqAPayload)` 冷启动后 |

### Epic 3: `Epic1-sub-quality` — 质量与性能优化

| Epic | Story | 工时 | 验收标准 |
|------|-------|------|---------|
| Epic1-sub-quality | ST-05: 清理敏感信息日志 | 0.5h | `expect(logs).not.toContain('entityId')` 生产环境 |
| Epic1-sub-quality | ST-06: 启用 PrismaPoolManager | 0.5h | `expect(pool.connectionsInUse).toBeLessThan(maxConn)` |
| Epic1-sub-quality | ST-07: 实现 Flow 执行逻辑（4 处 TODO） | 1.5h | `expect(result).not.toBeNull()` 调用 /api/flows/execute |
| Epic1-sub-quality | ST-08: 添加 clarificationId 索引 | 0.5h | `expect(EXPLAIN).toContain('USING INDEX')` |
| Epic1-sub-quality | ST-09: 清理 login/route.ts 重复代码 | 0.5h | `expect(routeFile.length).toBeLessThan(100)` 单次拼接 |
| Epic1-sub-quality | ST-10: 补充 Workers 开发指南 | 0.5h | `expect(AGENTS).toContain('isWorkers')` |

---

## 4. 验收标准（Acceptance Criteria）

### ST-01: 修复流式响应 this 引用

```typescript
// services/llm.ts
async createStreamingResponse(options, onChunk?) {
  const thisLLMService = this; // ← 提前绑定，在 ReadableStream 构造前
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

// 验收断言
expect(() => {
  const svc = new LLMService();
  // 直接调用 start，不应抛出 ReferenceError
  const stream = svc.createStreamingResponse({ prompt: 'test' });
  expect(stream).toBeInstanceOf(Response);
}).not.toThrow();
```

### ST-02: 统一 Workers DB 客户端

```typescript
// lib/db.ts（扩展现有 getDBClient）
export function getDBClient() {
  if (isWorkers) {
    // 返回 D1 binding
    return {
      prepare: (sql) => env.D1_DB.prepare(sql),
      // 兼容层：封装 D1 → 类似 Prisma 接口
    };
  }
  return new PrismaClient();
}

// app/api/auth/login/route.ts（替换前）
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// app/api/auth/login/route.ts（替换后）
import { getDBClient } from '@/lib/db';
const prisma = getDBClient();

// 验收断言
expect(() => getDBClient()).not.toThrow();
expect(typeof prisma.query).toBeDefined(); // Workers 兼容层需实现
```

### ST-03: 修复关系查询多 ID

```typescript
// services/requirement-analyzer.ts L423
private async getRelationsForEntities(entityIds: string[]): Promise<EntityRelation[]> {
  if (entityIds.length === 0) return [];
  const placeholders = entityIds.map(() => '?').join(',');
  return listEntityRelations(this.env, {
    whereClause: `sourceEntityId IN (${placeholders}) OR targetEntityId IN (${placeholders})`,
    params: entityIds,
  });
}

// 验收断言
const entities = await createTestEntities(3);
const relations = await analyzer.getRelationsForEntities(entities.map(e => e.id));
expect(relations.length).toBeGreaterThanOrEqual(2); // 3个实体间应有多条关系
```

### ST-04: D1 KV 缓存替换

```typescript
// services/requirement-analyzer.ts
// 替换前
private cache = new Map<string, CachedResult>();

// 替换后
private async getCache(key: string): Promise<CachedResult | null> {
  const { results } = await this.env.CACHE_KV.prepare(
    'SELECT value FROM cache WHERE key = ?'
  ).bind(key).all();
  return results[0] ? JSON.parse(results[0].value) : null;
}

// 验收断言
await analyzer.setCache('reqA', payloadA);
await triggerColdStart(); // wrangler dev --reload
const result = await analyzer.getCache('reqA');
expect(result).toBeNull(); // 冷启动后内存清空，D1 有持久化但应在隔离请求后不混淆
```

### ST-05: 日志清理

```typescript
// 替换前
console.log('entityId:', entity.id, 'token usage:', usage);

// 替换后
import { devDebug } from '@/lib/logger';
devDebug('entity processed', { hasId: !!entity.id }); // 不输出实际值

// 验收断言
const logs = captureConsoleLogs(() => generateComponents(req));
expect(logs.every(l => !/entityId|token|usage|sk-/.test(l))).toBe(true);
```

### ST-06: 连接池启用

```typescript
// lib/db.ts PrismaPoolManager（已有但未使用）
class PrismaPoolManager {
  private pool: PrismaClient[];
  acquire() { return this.pool.pop() ?? new PrismaClient(); }
  release(client) { this.pool.push(client); }
}

// 验收断言
const manager = new PrismaPoolManager();
const conn1 = manager.acquire();
manager.release(conn1);
const conn2 = manager.acquire();
expect(conn1).toBe(conn2); // 同一连接被复用
```

### ST-07: Flow 执行实现

```typescript
// lib/prompts/flow-execution.ts（4 处 TODO 替换）
// TODO: 实现步骤执行 → 执行步骤 + 返回结果

// 验收断言
const result = await executeFlow({ flowId: testFlow.id, steps: [...] });
expect(result).toHaveProperty('steps');
expect(result.steps[0]).toHaveProperty('output');
expect(result).not.toEqual({ success: true, data: null });
```

### ST-08: clarificationId 索引

```typescript
// migrations/xxx_add_clarification_index.sql
CREATE INDEX IF NOT EXISTS idx_clarification_id ON Clarification(clarificationId);

// 验收断言
const plan = await db.prepare('EXPLAIN QUERY PLAN SELECT * FROM Clarification WHERE clarificationId = ?').bind('test').all();
expect(plan[0].detail).toContain('USING INDEX');
```

### ST-09: 清理重复代码

```typescript
// 修复文件拼接逻辑
// 替换前（错误）
const content = readFile(path1) + readFile(path2); // path1 === path2

// 替换后
const content = readFile(normalizedPath);

// 验收断言
expect(readFile('app/api/auth/login/route.ts').length).toBeLessThan(200);
```

### ST-10: AGENTS.md 补充

```typescript
// vibex-backend/AGENTS.md 新增章节
## Cloudflare Workers 开发规范

### DB 访问
- 始终使用 `getDBClient()` 而非直接实例化 `PrismaClient`
- Workers 环境使用 D1 binding，本地使用 Prisma SQLite

### 缓存策略
- 禁止使用内存 `Map()` 做持久化缓存，使用 `env.CACHE_KV` (D1 KV)
- 冷启动后缓存失效，需重新预热

// 验收断言
const agents = readFile('vibex-backend/AGENTS.md');
expect(agents).toContain('getDBClient');
expect(agents).toContain('isWorkers');
```

---

## 5. DoD（Definition of Done）

### Epic1-sub-prisma-fix
- [ ] `services/llm.ts` 中 `thisLLMService` 在 ReadableStream 构造前赋值
- [ ] 所有 8+ API 路由替换为 `getDBClient()`
- [ ] `wrangler deploy --dry-run` 无 PrismaClient bundle 警告
- [ ] 本地 `pnpm dev` + Workers 模拟环境均返回正确响应
- [ ] 单元测试覆盖流式响应路径

### Epic1-sub-data-fix
- [ ] `getRelationsForEntities` 支持多 ID IN 查询，关系返回完整
- [ ] `RequirementAnalyzerService` 缓存改为 D1 KV 实现
- [ ] 冷启动后无跨请求数据泄漏
- [ ] 集成测试验证缓存隔离

### Epic1-sub-quality
- [ ] 所有 console.log 替换为 devDebug 或完全移除
- [ ] PrismaPoolManager 被 API 路由正确使用
- [ ] Flow 执行 4 处 TODO 替换为完整逻辑
- [ ] clarificationId 索引创建并验证 EXPLAIN
- [ ] login/route.ts 文件内容无重复拼接
- [ ] AGENTS.md 包含 Workers 开发规范

### 全局
- [ ] 无新 lint 错误引入
- [ ] `pnpm typecheck` 通过
- [ ] 至少 3 个关键路径有集成测试覆盖
- [ ] PR 包含变更说明和回归验证步骤

---

## 6. 功能点汇总表（含页面集成标注）

| Story | 功能 | 涉及文件 | 页面/模块 | 风险 |
|-------|------|---------|---------|------|
| ST-01 | 流式响应修复 | `services/llm.ts` | Chat 流式生成 | 低 |
| ST-02 | Workers DB 统一 | `lib/db.ts`, 8+ API routes | 全站 API | 低 |
| ST-03 | 关系查询修复 | `services/requirement-analyzer.ts` | 需求分析 → 实体关系图 | 中 |
| ST-04 | D1 缓存迁移 | `services/requirement-analyzer.ts` | 需求分析 | 低 |
| ST-05 | 日志清理 | `app/api/v1/canvas/generate-*/route.ts` | 组件/上下文生成 | 低 |
| ST-06 | 连接池启用 | `lib/db.ts` | 全站 DB 访问 | 低 |
| ST-07 | Flow 执行实现 | `lib/prompts/flow-execution.ts` | Flow 编辑器 | 中 |
| ST-08 | clarification 索引 | migration + route | Clarification 模块 | 低 |
| ST-09 | 重复代码清理 | `app/api/auth/login/route.ts` | Auth 登录 | 低 |
| ST-10 | 文档补充 | `vibex-backend/AGENTS.md` | 开发规范 | 低 |

---

## 7. 实施计划（Implementation Plan）

### Sprint 1: 核心 Bug 修复（3.5h）

| 日期 | 任务 | 负责人 | 产出 |
|------|------|--------|------|
| Day 1 AM | ST-01: 修复流式响应 this 引用 | Dev | `services/llm.ts` 修改 |
| Day 1 AM | ST-02: 统一 DB 客户端（8+ 路由） | Dev | 批量替换 `getDBClient()` |
| Day 1 PM | ST-03: 修复关系查询 | Dev | `getRelationsForEntities` 修复 |
| Day 1 PM | ST-04: D1 KV 缓存迁移 | Dev | `RequirementAnalyzerService` 重构 |

**Review**: Day 1 EOD — 验收 P0/P1 Bug 全部修复

### Sprint 2: 质量优化（4h）

| 日期 | 任务 | 负责人 | 产出 |
|------|------|--------|------|
| Day 2 AM | ST-05: 日志清理 + ST-06: 连接池 | Dev | 批量日志替换 + Pool 使用 |
| Day 2 PM | ST-07: Flow 执行实现（4 TODO） | Dev | `flow-execution.ts` 完整实现 |
| Day 2 PM | ST-08: 索引 + ST-09: 重复代码 | Dev | migration + route 修复 |

**Review**: Day 2 EOD — 集成测试 + lint + typecheck

### Day 3: 收尾（1.5h）

| 任务 | 产出 |
|------|------|
| ST-10: 补充 AGENTS.md | Workers 开发规范文档 |
| 全局回归测试 | 无新 Bug 引入 |
| PR 审查 + 合并 | `Epic1-sub-prisma-fix` 等 3 个 PR |

---

## 附录

- **Analysis 文档**: `docs/vibex-dev-proposals-vibex-proposals-20260410/analysis.md`
- **Dev 提案原始**: `docs/vibex-dev-proposals-vibex-proposals-20260410/dev.md`
- **Spec 文件**: `docs/vibex-dev-proposals-vibex-proposals-20260410/specs/`
