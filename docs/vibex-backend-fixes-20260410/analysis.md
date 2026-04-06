# Backend 修复需求分析

**项目**: vibex-backend-fixes-20260410
**分析日期**: 2026-04-10
**分析师**: Analyst Agent
**状态**: ✅ 分析完成

---

## 问题定义

### Epic 1: Schema 字段名漂移（sessionId vs generationId）

**问题描述**:
Canvas API 的输入/输出 Schema 在不同位置使用不一致的字段名，导致前端后端契约漂移。

| 位置 | 字段名 | 类型 |
|------|--------|------|
| `packages/types/src/api/canvasSchema.ts` (输入/输出) | `generationId` | string |
| `packages/types/src/api/canvas.ts` (输入) | `sessionId` | string |
| `vibex-backend/src/schemas/canvas.ts` (请求体) | `sessionId` | string |
| `vibex-backend/src/app/api/v1/canvas/generate-contexts/route.ts` (响应) | `generationId` | string |

**根因**: Canvas API 经过多轮迭代，初始设计使用 `sessionId` 追踪请求，后改为 `generationId` 表示生成批次 ID，但两套 Schema 未统一。

**影响范围**:
- 前端 `canvasApiValidation.ts` 使用 `sessionId`
- 后端请求验证 `schemas/canvas.ts` 使用 `sessionId`
- 后端响应 `generate-contexts/route.ts` 返回 `generationId`
- 类型包 `packages/types/src/api/canvasSchema.ts` 混合两者

---

### Epic 2: SSE Streaming 超时未正确中断（AbortController）

**问题描述**:
`createStreamingResponse`（`services/llm.ts:325`）创建的 SSE 流缺少：
1. **无请求超时** — 底层 `streamChat` 调用无 timeout，Worker 可能无限期挂起
2. **无 AbortController 暴露** — 调用方无法传入 signal 来取消流
3. **错误后 stream 可能悬挂** — catch 后 `controller.close()` 可能已被调用但资源未释放

对比：`lib/sse-stream-lib/index.ts` 的 `buildSSEStream` 已有 10s 超时和 AbortController，但 `createStreamingResponse` 是独立实现，未复用。

**根因**: `createStreamingResponse` 是通用封装，未考虑 Worker 环境下的资源清理边界情况。

**影响范围**:
- `services/llm.ts` 的 `createStreamingResponse`
- 所有调用该方法的路由（如 chat 生成、stream 响应）

---

### Epic 3: PrismaClient Workers 守卫未全面覆盖（12 个路由）

**问题描述**:
当前 PrismaClient 使用模式：

| 文件 | 模式 | Workers 兼容 |
|------|------|-------------|
| `src/lib/prisma.ts` | 全局单例（无 Workers 守卫） | ❌ 无守卫 |
| `src/lib/db.ts` | 条件导入 Prisma（isWorkers check） | ✅ 有守卫 |
| 12 个路由 | `new PrismaClient()` 直接创建 | ❌ 无守卫 |

**直接创建 `new PrismaClient()` 的 12 个路由**:
```
src/app/api/auth/login/route.ts
src/app/api/auth/register/route.ts
src/app/api/messages/route.ts
src/app/api/messages/[messageId]/route.ts
src/app/api/users/[userId]/route.ts
src/app/api/flows/[flowId]/route.ts
src/app/api/v1/auth/login/route.ts
src/app/api/v1/auth/register/route.ts
src/app/api/v1/messages/route.ts
src/app/api/v1/messages/[messageId]/route.ts
src/app/api/v1/users/[userId]/route.ts
src/app/api/v1/flows/[flowId]/route.ts
```

**根因**: 这些路由在重构 Workers 兼容时遗漏，未统一迁移到 `db.ts` 或添加等效守卫。

**影响**: 在 Cloudflare Workers 生产环境，这些路由会尝试加载 Prisma（Node.js only），导致 bundle 膨胀或运行时错误。

---

## 技术方案对比

### Epic 1: Schema 统一

**方案 A: 以 `generationId` 为标准（推荐）**
- 语义更准确：表示"一次生成批次"，而非一般性"会话"
- 修改点：前端类型/验证改为 `generationId`，`schemas/canvas.ts` 改为 `generationId`
- 影响范围：frontend、packages/types、vibex-backend

**方案 B: 以 `sessionId` 为标准**
- 与前端历史包袱更兼容
- 修改点：后端 `generate-contexts/route.ts` 响应改为 `sessionId`，类型包改为 `sessionId`
- 问题：语义模糊，`sessionId` 在不同上下文含义不同

**推荐方案 A**，理由：
1. `generationId` 语义更精确
2. 类型包已有一致定义（`canvasSchema.ts`）
3. 后端是 source of truth，改动量可控

---

### Epic 2: SSE 超时修复

**方案 A: 为 createStreamingResponse 添加超时参数（推荐）**
```typescript
async createStreamingResponse(
  options: LLMRequestOptions,
  onChunk?: (chunk: LLMStreamChunk) => void,
  timeoutMs?: number  // 新增参数，默认 30s
): Promise<Response>
```
- 内部创建 AbortController，超时后 abort
- 复用 `lib/sse-stream-lib` 中的清理模式
- 向后兼容（timeoutMs 可选）

**方案 B: 强制调用方传入 signal**
```typescript
async createStreamingResponse(
  options: LLMRequestOptions,
  signal: AbortSignal,  // 必选参数
  onChunk?: (chunk: LLMStreamChunk) => void
): Promise<Response>
```
- 优点：调用方完全控制生命周期
- 缺点：破坏性变更，所有调用方需更新

**推荐方案 A**，理由：
1. 向后兼容，无破坏性变更
2. 符合"聪明默认值"原则
3. 与现有 `sse-stream-lib` 模式一致

---

### Epic 3: PrismaClient Workers 守卫

**方案 A: 统一迁移到 `db.ts`（推荐）**
```typescript
// 替换所有 new PrismaClient() 为
import { db } from '@/lib/db';  // db.ts 已实现 isWorkers guard
```
- 优点：复用现有守卫逻辑，零新增代码
- 缺点：12 个文件需修改 import

**方案 B: 在 `prisma.ts` 中增加 Workers 守卫**
```typescript
// 修改 lib/prisma.ts
const isWorkers = typeof globalThis !== 'undefined' && typeof globalThis.caches !== 'undefined'
if (!isWorkers) {
  const Prisma = require('@prisma/client');
  globalForPrisma.prisma ??= new Prisma.PrismaClient();
}
```
- 优点：所有现有 `import prisma from '@/lib/prisma'` 自动生效
- 缺点：需确保 `prisma.ts` 是唯一入口，当前 12 个路由直接 `new PrismaClient()` 不受影响

**推荐方案 A**，理由：
1. `db.ts` 已有完整实现
2. 12 个路由数量可控，一次性迁移
3. 消除 `new PrismaClient()` 分散实例的风险

---

## JTBD（Jobs to be Done）

1. **作为前端开发者，我希望 Canvas API 字段名语义一致（generationId），避免因类型不匹配导致集成错误**
2. **作为 DevOps/SRE，我希望 SSE 流有超时保护，避免 Worker 资源泄漏导致线上事故**
3. **作为后端开发者，我希望 PrismaClient 使用有统一入口，避免 Workers 环境下运行时崩溃**
4. **作为 Code Reviewer，我希望看到 12 个路由的 Prisma 使用已统一，消除潜在的 Workers 兼容性隐患**
5. **作为产品，我们希望在 Epic 修复后，Canvas 生成流程（context → flow → component）在各种网络条件下都能可靠运行**

---

## 风险识别

| 风险 | 等级 | 缓解措施 |
|------|------|---------|
| Epic 1：字段名修改导致前端现有调用失效 | 中 | 提供 migration alias 或渐进式迁移（v1 response 同时返回 sessionId+generationId） |
| Epic 2：超时时间设置不当（太短打断正常长推理） | 中 | 默认 30s，允许调用方 override；通过日志观察调整 |
| Epic 3：迁移后 Prisma 连接池管理变化 | 低 | db.ts 已有成熟的连接池配置，迁移后行为一致 |
| 12 个路由同步修改带来回归风险 | 中 | 每个路由有 route.test.ts，先确保测试通过再合入 |
| 前端缓存了旧的 sessionId 类型导致类型冲突 | 低 | 前端同步修改，类型包版本 bump |

---

## 验收标准（具体可测试）

### Epic 1: Schema 统一
- [ ] `packages/types/src/api/canvasSchema.ts` 中所有字段统一为 `generationId`
- [ ] `vibex-backend/src/schemas/canvas.ts` 中请求体字段统一为 `generationId`
- [ ] `vibex-backend/src/app/api/v1/canvas/generate-contexts/route.ts` 响应字段与类型包一致
- [ ] 前端类型导入点（`canvasApiValidation.ts`）验证通过，无 TS 报错
- [ ] 端到端测试：POST `/api/v1/canvas/generate-contexts` → 响应中 `generationId` 存在且非空

### Epic 2: SSE 超时修复
- [ ] `createStreamingResponse` 新增 `timeoutMs` 参数（默认 30000）
- [ ] 超时触发时，stream 正确发送 error 事件并 close
- [ ] 单元测试：timeout = 100ms，验证 abort 被调用
- [ ] 集成测试：模拟长推理流，超时后客户端收到 error 事件

### Epic 3: PrismaClient Workers 守卫
- [ ] 12 个路由中所有 `new PrismaClient()` 替换为 `import { db } from '@/lib/db'`
- [ ] `lib/prisma.ts` 可保留但标注 @deprecated（避免新路由误用）
- [ ] 所有受影响的路由测试通过（`*.test.ts`）
- [ ] Workers build 不再包含 `@prisma/client`（通过构建产物检查）

---

## 工时估算

| Epic | 功能点 | 预估工时 | 说明 |
|------|--------|---------|------|
| Epic 1: Schema 统一 | 3 | **1.5h** | 改 3 处 Schema + 前端类型对齐 + 测试 |
| Epic 2: SSE 超时修复 | 2 | **2h** | 修改 llm.ts + 单元测试 + 集成测试 |
| Epic 3: Prisma Workers 守卫 | 2 | **2h** | 12 个路由迁移 + 测试 |
| **总计** | **7** | **5.5h** | < 1 人天，符合标准 Epic 规模 |

> Epic 规模标准：小 0.5h / 标准 1h / 大 6h+（需拆分）
> 当前 7 个功能点 / 5.5h，属于**标准 Epic**，无需拆分。

---

## 依赖关系

- Epic 1 和 Epic 3 可并行开发（无相互依赖）
- Epic 2 可在 Epic 1 完成后验证（确保 generationId 流正确中断）
- 所有 Epic 共享同一 PR，可在同一分支开发

---

## 后续建议

1. 在 CI 中添加 Schema 一致性检查（确保 packages/types 和 vibex-backend 的 Schema 定义同步）
2. 考虑为 SSE 路由添加 metrics（超时次数、abort 原因），便于线上监控调优
3. 审查 `lib/prisma.ts` 的使用者，考虑是否在 ESLint 规则中禁止 `new PrismaClient()` 直接调用
