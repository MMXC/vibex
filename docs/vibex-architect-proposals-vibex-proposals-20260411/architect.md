# Architect Proposals — 2026-04-11

**Agent**: architect
**项目**: vibex-architect-proposals-vibex-proposals-20260411
**工作目录**: /root/.openclaw/vibex
**产出**: docs/vibex-architect-proposals-vibex-proposals-20260411/architect.md

---

## 提案列表

| ID | 类别 | 问题/优化点 | 影响范围 | 优先级 |
|----|------|------------|----------|--------|
| A-P0-1 | architecture | API v0/v1 双路由并行维护 | 所有 API route、Contract 测试、CI | P0 |
| A-P0-2 | reliability | WebSocket ConnectionPool 连接泄露风险 | collaboration service、生产稳定性 | P0 |
| A-P1-1 | schema | `packages/types` 发布配置缺失，无法被 workspace 依赖 | 类型共享、Schema drift 根因 | P1 |
| A-P1-2 | architecture | Hono Gateway 与 Next.js API Route 并存导致路由冲突 | gateway.ts、middleware、Auth | P1 |
| A-P2-1 | perf | Context CompressionEngine 压缩质量与 token 成本 | context/SessionManager、LLM 调用成本 | P2 |
| A-P2-2 | security | `prompts/code-review.ts` 中 `eval` 模式匹配 | 提示词注入风险、代码审查准确性 | P2 |
| A-P2-3 | observability | MCP Server 集成缺少健康检查与错误上报 | packages/mcp-server、生产监控 | P2 |

---

## 提案详情

### A-P0-1: API v0/v1 双路由并行维护

**问题**: 后端同时维护 `/api/` 和 `/api/v1/` 两套路由，重复代码严重：
- `/api/agents` ↔ `/api/v1/agents`
- `/api/canvas/generate` ↔ `/api/v1/canvas/generate`
- `/api/chat` ↔ `/api/v1/chat`
- `/api/flows`, `/api/messages`, `/api/pages`, `/api/projects` 等全部重复

**根因**: v1 作为新版本迁移时保留了旧路由，但从未废弃 v0。

**影响范围**:
- `vibex-backend/src/app/api/` — 约 50+ 重复 route 文件
- `vibex-backend/src/lib/contract/` — Contract test runner 需覆盖两套路由
- CI/CD 流水线

**建议**: 见 analysis.md Section 2.1。

---

### A-P0-2: WebSocket ConnectionPool 连接泄露风险

**问题**:
- `connectionPool.ts` (243 行) + `messageRouter.ts` (251 行) = 494 行无测试
- `connectionPool.ts` 无 `maxConnections` 限制，无超时清理
- Cloudflare Workers 环境 WebSocket 支持有限，边缘场景可能崩溃
- 无心跳/ping-pong 机制检测死连接

**影响范围**: `vibex-backend/src/services/websocket/`

**建议**: 见 analysis.md Section 2.2。

---

### A-P1-1: `packages/types` 发布配置缺失

**问题**:
- `packages/types` 有 `package.json`（`@vibex/types`），但整个 workspace 无任何 import
- `pnpm-workspace.yaml` 正确包含 `'packages/types'`，理论上可在内部使用
- 根因：没有建立从 `vibex-backend` 和 `vibex-fronted` 到 `packages/types` 的依赖

**影响范围**: `packages/types/`、`vibex-backend/src/`、`vibex-fronted/src/`

**建议**: 见 analysis.md Section 2.3。

---

### A-P1-2: Hono Gateway 与 Next.js API Route 并存

**问题**:
- `vibex-backend/src/index.ts` 启动 Hono server
- `vibex-backend/src/app/api/` 使用 Next.js App Router
- 两套路由系统并行：Hono 路由 + Next.js route handlers
- `src/routes/` 目录下还有 Hono 风格的路由文件（`auth/login.ts`、`chat.ts` 等）
- Auth 中间件可能在两套系统中行为不一致

**影响范围**: `vibex-backend/src/index.ts`、`src/routes/`、`src/app/api/`

**建议**: 见 analysis.md Section 2.4。

---

### A-P2-1: Context CompressionEngine 压缩质量

**问题**:
- `CompressionEngine.ts` (311 行) 负责对话上下文压缩
- 当前基于规则 + 关键词的压缩可能丢失关键领域信息
- 压缩质量直接影响 LLM 输出准确性，但无质量评估机制
- `ImportanceScorer.ts` (108 行) 评分逻辑缺乏可解释性

**影响范围**: `services/context/`

**建议**: 见 analysis.md Section 2.5。

---

### A-P2-2: Prompts 中 `eval` 模式匹配安全风险

**问题**:
- `prompts/code-review.ts`、`code-generation.ts` 等使用字符串拼接生成代码模式
- 若用户输入包含特定关键词（`eval` 等），可能触发误判或注入风险
- 当前通过字符串匹配做安全过滤，缺乏沙箱

**影响范围**: `lib/prompts/code-review.ts`、`lib/prompts/code-generation.ts`

**建议**: 见 analysis.md Section 2.6。

---

### A-P2-3: MCP Server 健康检查缺失

**问题**:
- `packages/mcp-server` 已构建 (dist/)，但无健康检查端点
- MCP SDK 版本 `0.5.0`，可能存在 breaking changes 未跟进
- 与主系统集成方式不明确（独立进程 / 嵌入）

**影响范围**: `packages/mcp-server/`

**建议**: 见 analysis.md Section 2.7。
