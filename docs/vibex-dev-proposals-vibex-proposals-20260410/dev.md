# Dev Proposals 2026-04-10

## 提案列表

| ID | 类别 | 问题/优化点 | 优先级 | 涉及文件 |
|----|------|------------|--------|---------|
| D-01 | 🐛 Bug | `createStreamingResponse` 中 `thisLLMService` 在 `ReadableStream.start` 闭包中引用顺序错误，可能导致运行时 ReferenceError | P0 | `services/llm.ts` |
| D-02 | 🐛 Bug | Auth/API 路由直接在 Workers 环境使用 PrismaClient，未做 `isWorkers` 守卫，导致 Workers 部署失败或连接错误 | P0 | `app/api/auth/login/route.ts`, `app/api/auth/login/route.ts` (dup), `app/api/v1/auth/login/route.ts`, `app/api/v1/auth/register/route.ts`, `app/api/v1/flows/[flowId]/route.ts`, `app/api/v1/messages/...`, `app/api/v1/users/[userId]/route.ts` 等 8+ 文件 |
| D-03 | 🐛 Bug | `getRelationsForEntities` 只用 `entityIds[0]` 查询，忽略其余 entityId，导致关联数据不完整 | P1 | `services/requirement-analyzer.ts` L423 |
| D-04 | 🐛 Bug | `RequirementAnalyzerService` 内存缓存（`this.cache = new Map()`）在 Cloudflare Workers 无状态环境中跨请求泄漏，应改用 D1 KV 或持久化缓存 | P1 | `services/requirement-analyzer.ts` |
| D-05 | 🔧 Perf | API 路由中大量 `console.log` 在生产环境暴露敏感信息（entity ID、token 使用量等），应统一替换为 `devDebug` 或日志服务 | P1 | `app/api/v1/canvas/generate-contexts/route.ts:123`, `generate-components/route.ts:215`, `generate-flows/route.ts:157`, `services/websocket/connectionPool.ts` |
| D-06 | 🔧 Perf | PrismaPoolManager 在 `lib/db.ts` 中定义了完整连接池管理代码但未被 API 路由使用，所有 Prisma 调用均绕过连接池，无法复用连接 | P2 | `lib/db.ts`, 多个 API 路由 |
| D-07 | 🔧 Perf | `flow-execution.ts` 中 4 处 `TODO` 标记为"未实现"，Prompt 中描述了执行逻辑但代码为空，调用会静默失败 | P2 | `lib/prompts/flow-execution.ts:792,813,847,869` |
| D-08 | 🔧 Perf | `clarification route` 中有 TODO 注释指出clarificationId 需要索引查询优化 | P2 | `app/api/clarifications/[clarificationId]/route.ts:53` |
| D-09 | 🔧 Perf | Auth 路由 (`login/route.ts`) 存在重复代码——整个文件被 `cat` 输出两次（同一文件路径两次拼接），可能是复制粘贴或构建配置问题 | P3 | `app/api/auth/login/route.ts` |
| D-10 | 📝 Docs | `CLAUDE.md` / `AGENTS.md` 缺失 Workers 环境特定开发指南（如 D1 vs Prisma 区分、`isWorkers` 守卫模式） | P3 | `vibex-backend/AGENTS.md` |

---

## 关键 Bug 详解

### D-01: `createStreamingResponse` 闭包 this 引用问题

```typescript
async createStreamingResponse(options, onChunk?) {
  const stream = new ReadableStream({
    async start(controller) {
      for await (const chunk of thisLLMService.streamChat(options)) { // ← 引用在此
        ...
      }
    },
  });
  const thisLLMService = this;  // ← 赋值在此，行序颠倒
  return new Response(stream, {...});
}
```

**问题**: `start` 是同步方法，在构造函数内立即执行，但 `const thisLLMService = this` 在 `start` 之后才执行，导致 `thisLLMService` 为 `undefined`。

**修复**: 将 `const thisLLMService = this` 移到 `ReadableStream` 构造之前。

### D-02: PrismaClient 在 Cloudflare Workers 环境未隔离

`db.ts` 有 `isWorkers` 守卫逻辑，但 `app/api/auth/login/route.ts` 等文件直接：
```typescript
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
```
Workers 环境中无 Prisma 驱动，会在冷启动时报错。需要统一通过 `db.ts` 的 `getDBClient()` 获取。

### D-03: `getRelationsForEntities` 逻辑错误

```typescript
private async getRelationsForEntities(entityIds: string[]): Promise<EntityRelation[]> {
  if (entityIds.length === 0) return [];
  return listEntityRelations(this.env, {
    sourceEntityId: entityIds[0],  // ← BUG: 只用了第一个 ID
  });
}
```
应改为 `IN` 查询或批量获取所有 entityId 的关系。

---

## 扫描范围

- 扫描目录: `/root/.openclaw/vibex/vibex-backend/src/`
- 扫描文件数: 251 个 `.ts` 文件（排除测试文件）
- 扫描方式: 关键词搜索 (`TODO`/`FIXME`/`BUG`/`HACK`/`console.log`) + 重点文件人工审查
- 时间: 约 8 分钟
