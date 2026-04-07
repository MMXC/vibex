# Architect Proposals 2026-04-10

**Agent**: architect
**项目**: vibex-architect-proposals-vibex-proposals-20260410
**工作目录**: /root/.openclaw/vibex
**产出**: docs/vibex-architect-proposals-vibex-proposals-20260410/architect.md

---

## 提案列表

| ID | 类别 | 问题/优化点 | 影响范围 | 优先级 |
|----|------|------------|----------|--------|
| A-P0-1 | schema | Schema Drift — `sessionId` vs `generationId` 漂移 | packages/types、API routes、前后端契约 | P0 |
| A-P0-2 | reliability | SSE Stream 超时与连接清理 | sse-stream-lib、AI service | P0 |
| A-P0-3 | test | Jest/Vitest 双测试框架共存 | 测试配置、CI | P0 |
| A-P1-1 | deployment | OPTIONS 预检路由顺序问题 | Hono gateway/middleware | P1 |
| A-P1-2 | reliability | 分布式限流缺失（内存限流跨实例失效） | rateLimit.ts、KV 迁移 | P1 |
| A-P1-3 | architecture | `packages/types` 无法被 workspace 依赖 | pnpm workspace、类型共享 | P1 |
| A-P2-1 | ssr | SSR-Unsafe 代码无统一规范 | React 组件、hydration | P2 |
| A-P2-2 | observability | 无健康检查端点 | 监控、部署验证 | P2 |
| A-P2-3 | perf | AI Service timeout 硬编码，无 AbortController | ai-service.ts | P2 |

---

## 提案详情

### A-P0-1: Schema Drift — `sessionId` vs `generationId` 漂移

**问题**: 近期连续出现字段名不一致导致的 bug：
- `generate-contexts` JSDoc 使用 `sessionId`，实际代码使用 `generationId`
- 测试 validator 使用 `sessionId`，Zod schema 使用 `generationId`
- 前端与后端 schema 各自维护，无单一真相来源

**根因**: 前后端类型三套维护机制（Interface + JSDoc / Zod Schema / 手写 validator），修改不同步。

**影响范围**:
- `packages/types/src/api/` — 无 package.json，无法被 workspace 依赖
- `vibex-fronted/src/app/api/` — 后端 API route
- `vibex-fronted/src/lib/api/` — 前端 API 调用

**建议**: 见 analysis.md Section 2.1 方案一。

---

### A-P0-2: SSE Stream 超时与连接清理

**问题**: 
- `aiService.chat()` 无超时控制
- `setTimeout` 未在 `cancel()` 中清理
- `AbortController` 未传递到 AI fetch 调用
- Worker 全局 `setInterval` 在 Cloudflare Workers 被禁用（已部分修复）

**影响范围**: `vibex-backend/src/services/ai-service.ts`, SSE 流式 API

**建议**: 见 analysis.md Section 2.2。

---

### A-P0-3: Jest/Vitest 双测试框架共存

**问题**:
- 项目同时运行 Jest 和 Vitest
- `tests/unit/setup.tsx` 提供了 Jest globals 兼容层（vi.fn 替代 jest.fn）
- 存在 `*.test.ts` 和 `*.test.tsx` 文件混合命名
- `jest.config.js` 和 `vitest.config.ts` 并存
- 维护成本高，两套配置需同步更新

**影响范围**: 测试配置、CI 流程、所有测试文件

**建议**: 见 analysis.md Section 2.3。

---

### A-P1-1: OPTIONS 预检路由顺序问题

**问题**: `protected_.options` 在 `authMiddleware` 之后注册，导致 CORS 预检请求被 401 拦截。

**影响范围**: `vibex-backend/src/gateway.ts` 或对应 middleware 注册文件

**建议**: 调整 Hono middleware 注册顺序，将 `options` 路由注册在 `authMiddleware` 之前。

---

### A-P1-2: 分布式限流缺失

**问题**: `rateLimit.ts` 使用内存 Map 存储计数器，在 Cloudflare Workers 多实例环境下跨实例不共享，导致限流失效。

**现状**: KV 命名空间已建立（`COLLABORATION_KV`, `NOTIFICATION_KV`），但 `rateLimit.ts` 尚未迁移。

**建议**: 将限流计数迁移到 Cache API（Workers 内置）或复用已有 KV。

---

### A-P1-3: `packages/types` 无法被 workspace 依赖

**问题**: `packages/types/package.json` 不存在或格式不正确，导致前端/后端无法通过 `@vibex/types` 引用共享类型，Schema drift 的根因之一。

**影响范围**: `pnpm workspace` 依赖管理、类型共享

**建议**: 修复 `packages/types/package.json`，定义正确的 exports map，支持 `@vibex/types/api/canvas` 等路径导入。

---

### A-P2-1: SSR-Unsafe 代码无统一规范

**问题**: 无 SSR-Safe 编码规范，常见 SSR-Unsafe 模式：
- `setInterval` 在 SSR 无 timer API
- `toLocaleDateString` 时区差异导致 hydration mismatch
- `dangerouslySetInnerHTML` SSR/CSR 差异
- `window.matchMedia` 等浏览器 API 在组件顶层调用

**建议**: 编写 SSR-Safe 编码规范文档，定义检查规则（可通过 ESLint plugin 检测）。

---

### A-P2-2: 无健康检查端点

**问题**: 无 `/health` 或 `/healthz` 端点，无法验证部署状态和依赖可用性。

**建议**: 在 `vibex-backend` 添加健康检查端点，验证 DB/KV/AI 服务可达性。

---

### A-P2-3: AI Service Timeout 硬编码

**问题**: `ai-service.ts` 中的 timeout 配置可能硬编码，且 `AbortController` 未传递到 LLM fetch 调用，长时间运行的 AI 请求无法被优雅中断。

**建议**: 统一 AI timeout 配置路径，支持请求级别的 timeout 和 retry 策略。

---

## 快速参考：历史提案（2026-04-06 前）

| 日期 | 提案 | 状态 |
|------|------|------|
| 2026-04-06 | OPTIONS预检路由顺序修复 | 待执行 |
| 2026-04-06 | SSE流超时+连接清理 | 待执行 |
| 2026-04-06 | 分布式限流(Cache API) | 待执行 |
| 2026-04-06 | Health Check端点 | 待执行 |
| 2026-04-05 | Schema一致性(Zod统一前后端) | 待执行 |
| 2026-04-05 | SSR-Safe编码规范标准化 | 待执行 |
| 2026-04-05 | API Surface追踪机制 | 待执行 |
| 2026-04-05 | Mock/Real边界可视化 | 待执行 |
