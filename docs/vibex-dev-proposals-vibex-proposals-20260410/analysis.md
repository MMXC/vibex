# Requirements Analysis - Backend Dev Proposals

## 业务场景分析

### 背景
Vibex 是一个 AI 驱动的应用原型生成平台，backend 基于 **Next.js (App Router) + Cloudflare Workers (D1)** 架构，同时在本地开发环境使用 Prisma + SQLite。本次提案聚焦于 backend 代码的 bug 修复和优化。

### 关键业务影响分析

| 提案 | 业务影响 |
|------|---------|
| D-01 流式响应崩溃 | 用户发起流式 AI 生成时直接 500 错误，核心功能不可用 |
| D-02 Prisma in Workers | 所有 auth/flows/messages API 在 Workers 部署后不可用，属于部署阻断级 |
| D-03 关系查询丢失 | 需求分析后的实体关系图不完整，影响后续领域建模准确性 |
| D-04 缓存跨请求泄漏 | 内存缓存失效且可能泄漏上一请求的数据到下一请求，安全风险 |
| D-05 日志泄露 | console.log 输出 entity ID、token 用量等，生产环境敏感信息暴露 |
| D-06 连接池未使用 | 每次 DB 调用新建连接，本地开发性能差，连接资源浪费 |
| D-07 流执行空实现 | 用户触发 Flow 执行时静默失败，无反馈，体验差 |
| D-08 索引优化缺失 | clarification 查询走全表扫描，数据量大时性能退化 |

---

## 技术方案选项

### D-01: `createStreamingResponse` this 引用修复

#### 方案 A: 提前绑定 this（推荐）
```typescript
async createStreamingResponse(options, onChunk?) {
  const self = this;  // 提前捕获
  const stream = new ReadableStream({
    async start(controller) {
      for await (const chunk of self.streamChat(options)) {
        // ...
      }
    }
  });
  return new Response(stream, {...});
}
```
**优点**: 最小改动，向后兼容
**缺点**: 需要确认 `streamChat` 可在 `ReadableStream.start` 中安全调用

#### 方案 B: 移除 `createStreamingResponse`，直接暴露 streamChat
```typescript
async createStreamingResponse(options, onChunk?) {
  return this.streamChat(options);  // 直接返回 generator
}
```
**优点**: 彻底消除闭包问题
**缺点**: 需要调用方适配 SSE 封装逻辑

---

### D-02: PrismaClient in Workers 统一修复

#### 方案 A: 全局 DB 抽象层统一分发（推荐）
在 `lib/db.ts` 导出 `getDBClient()`，所有 API 路由替换：
```typescript
// 替换前
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// 替换后
import { getDBClient } from '@/lib/db';
const prisma = getDBClient();  // Workers 返回 D1，local 返回 Prisma
```
**优点**: 一处修改全局生效，符合现有 `isWorkers` 守卫设计
**缺点**: 需要审查所有 8+ 路由文件，逐个替换

#### 方案 B: 每个路由文件内独立守卫
```typescript
import { getDB } from '@/lib/db';  // 兼容层
export async function GET(request) {
  const db = getDB(request);  // 自动适配
  const user = await db.query('SELECT * FROM User...');
}
```
**优点**: 无需修改 `lib/db.ts`
**缺点**: 改动面更广，API 路由与 DB 层耦合增加

---

### D-03: `getRelationsForEntities` 修复

#### 方案 A: 使用 D1 `IN` 查询（推荐）
```typescript
private async getRelationsForEntities(entityIds: string[]): Promise<EntityRelation[]> {
  if (entityIds.length === 0) return [];
  const placeholders = entityIds.map(() => '?').join(',');
  return listEntityRelations(this.env, {
    whereClause: `sourceEntityId IN (${placeholders}) OR targetEntityId IN (${placeholders})`,
    params: [...entityIds, ...entityIds],
  });
}
```
**优点**: 一次查询获取所有关系
**缺点**: `listEntityRelations` 函数签名可能需要调整

#### 方案 B: 批量逐个查询后合并
```typescript
const results = await Promise.all(entityIds.map(id => listEntityRelations(this.env, { sourceEntityId: id })));
return results.flat();
```
**优点**: 简单直接，无需修改底层函数
**缺点**: N+1 查询，entityIds 多时性能差

---

## 初步风险

| 风险 | 级别 | 说明 | 缓解措施 |
|------|------|------|---------|
| 方案 A/D-01 中 `streamChat` 在 `start` 中被 yield 中断 | 中 | 若 `start` 方法中 `for await` yield 被中断，ReadableStream 状态不确定 | 加上 `try/finally` 确保 `controller.close()` |
| 方案 A/D-02 统一 `getDBClient()` 破坏现有测试 | 中 | 测试 mock 路径可能需要调整 | 编写集成测试覆盖 auth/login 路由 |
| 方案 B/D-02 改动范围过大 | 高 | 8+ 文件同时修改，可能遗漏 | 用 codemod 脚本批量替换 |
| D-04 缓存替换为 D1 KV 后，冷启动延迟增加 | 低 | KV 首次访问有冷启动时间 | 预热缓存或设置 TTL=0 兜底 |
| D-07 Flow 执行实现可能影响 Prompt 模板 | 中 | 已有 Prompt 逻辑，实现后与 Prompt 可能有偏差 | 实现后做 prompt-playground 对比测试 |

---

## 验收标准（具体可测试）

### D-01 修复验证
```
1. 本地 dev 启动 `pnpm dev`
2. POST /api/chat 发送流式请求
3. 确认返回 SSE 流（Content-Type: text/event-stream），无 500 错误
4. 检查 `console` 无 "ReferenceError: thisLLMService is not defined"
```

### D-02 修复验证
```
1. `wrangler deploy --dry-run` 无 "@prisma/client" bundle 警告
2. 在 Workers 模拟环境（miniflare）调用 /api/auth/login
3. 确认返回 401（正常错误），而非 "PrismaClient is not a constructor"
4. 回归：本地 `pnpm dev` 调用 /api/auth/login 仍返回 401
```

### D-03 修复验证
```sql
-- 准备数据：创建包含 3 个以上 entity 的 requirement
-- 已有 listEntityRelations 支持 IN 查询后：
SELECT * FROM EntityRelation 
WHERE sourceEntityId IN (id1, id2, id3) 
   OR targetEntityId IN (id1, id2, id3);
-- 应返回所有关系，而非只有 id1 的关系
```

### D-04 修复验证
```
1. 调用 analyzeRequirement(reqA) → 写入缓存
2. 触发 Workers 冷启动（wrangler dev --reload 或新请求）
3. 调用 analyzeRequirement(reqB) → 不应返回 reqA 的缓存数据
4. 使用 KV: GET kv:cache:{reqId} 确认数据存储在 D1 而非内存
```

### D-05 修复验证
```
1. 本地: 启动 dev server，调用 generate-components API
2. 终端输出中不包含 "entityId", "token", "usage" 等敏感关键词
3. wrangler dev 模拟 Workers: 日志中无 console 输出
```

### D-06 连接池验证
```
1. 开启 Prisma 查询日志: DATABASE_URL=xxx?schema=public&connection_limit=5 npx prisma studio
2. 批量调用 messages API 10 次
3. 观察连接池连接数不超过配置上限（maxConnections=10）
4. 无连接泄漏：请求结束后连接回归池中
```

### D-07 Flow 执行验证
```
1. POST /api/flows/execute { flowId: "xxx" }
2. 返回非空执行结果（而非 { success: true, data: null }）
3. 若流执行尚未实现，应返回 501 Not Implemented 而非静默失败
```

### D-08 索引验证
```sql
-- 检查 clarificationId 是否已建立索引
.schema Clarification
-- 确认 EXPLAIN QUERY PLAN 不出现 SCAN TABLE
EXPLAIN QUERY PLAN SELECT * FROM Clarification WHERE clarificationId = ?;
-- 预期: SEARCH TABLE USING INDEX
```

---

## 实施建议

### 实施顺序
1. **P0 优先**: D-02 → D-01（阻断部署/核心功能）
2. **P1 跟进**: D-03 → D-04（数据正确性 + 安全）
3. **P2 优化**: D-05 → D-06 → D-07（质量 + 性能）
4. **P3 完善**: D-08 → D-09 → D-10（工具链 + 文档）

### 工时估算
| 阶段 | 提案 | 预计工时 |
|------|------|---------|
| Phase 1 (P0) | D-02 + D-01 | 2h |
| Phase 2 (P1) | D-03 + D-04 | 2h |
| Phase 3 (P2) | D-05 + D-06 + D-07 | 3h |
| Phase 4 (P3) | D-08 + D-09 + D-10 | 1h |
| **合计** | | **8h** |

建议拆分为 3 个 Epic：
- **Epic1-sub-prisma-fix** (D-02, D-01): 2h
- **Epic1-sub-data-fix** (D-03, D-04): 2h
- **Epic1-sub-quality** (D-05~D-10): 4h
