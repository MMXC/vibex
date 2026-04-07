# Architect Analysis — 2026-04-10

**Agent**: architect
**项目**: vibex-architect-proposals-vibex-proposals-20260410
**产出**: docs/vibex-architect-proposals-vibex-proposals-20260410/analysis.md

---

## 1. 业务场景分析

### 1.1 项目定位
VibeX 是一个 AI 驱动的 DDD（领域驱动设计）产品建模平台，核心流程：
```
对话式需求输入 → AI 领域建模 → 可视化流程图 + 原型页面
```

### 1.2 技术栈现状
| 层级 | 技术 | 状态 |
|------|------|------|
| 前端 | Next.js 15 (App Router) + Zustand + TanStack Query | 活跃开发 |
| 后端 | Cloudflare Workers + Hono | 活跃开发 |
| 数据库 | Cloudflare D1 (SQLite) | 已部署 |
| 协作 | Cloudflare Workers KV | E5 已迁移 |
| AI | MiniMax API (流式 SSE) | 核心能力 |
| 测试 | Jest + Vitest 双框架 | 技术债 |

### 1.3 关键业务风险

| 风险 | 描述 | 影响 |
|------|------|------|
| Schema 不一致 | 前后端类型漂移导致 AI 生成结果解析失败 | P0 — 用户流程中断 |
| SSE 流中断 | 无超时控制导致僵尸连接占用 Worker 内存 | P0 — 服务稳定性 |
| 双测试框架 | Jest/Vitest 维护成本加倍，CI 配置复杂 | P0 — 开发效率 |
| 分布式限流 | 多实例下限流失效，API 滥用无保护 | P1 — 成本风险 |
| KV 类型共享 | packages/types 不可用，Schema drift 根因 | P1 — 类型安全 |

---

## 2. 技术方案选项（≥2 个）

### 2.1 Schema Drift 治理（A-P0-1）

#### 方案一：Zod 统一 Schema（推荐）

```
packages/types/src/api/canvas.ts
    ↓ 导出 Zod schema
vibex-fronted/src/app/api/canvas/route.ts  ← 后端 route
vibex-fronted/src/lib/api/canvas.ts         ← 前端 API client
tests/validators/                           ← 测试 validator
```

**优点**: 单一真相来源，Zod 可同时用于运行时验证和类型推断
**缺点**: 需要重构所有 schema 定义，前期投入较大

#### 方案二：Schema Registry + Codegen

```
后端 Interface → OpenAPI spec → 前端 types (codegen)
```

**优点**: 自动化程度高，类型与 API 严格绑定
**缺点**: 需要维护 OpenAPI spec，增量修改流程复杂

#### 方案三：渐进式对齐（最小改动）

仅修复当前已知漂移点（`sessionId` → `generationId`），不改动整体架构。

**优点**: 改动最小，快速止血
**缺点**: 不解决根本问题，未来仍会漂移

---

### 2.2 SSE Stream 可靠性（A-P0-2）

#### 方案一：AbortController + 超时传递（推荐）

```typescript
// ai-service.ts
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

try {
  const result = await llmProvider.chat(messages, {
    signal: controller.signal,  // ← 传递 abort signal
    model,
  });
} finally {
  clearTimeout(timeout);  // ← finally 中清理
}
```

**优点**: 原生支持，无额外依赖，`AbortController` 可级联取消
**缺点**: 需要确保所有 downstream 调用都支持 `signal`

#### 方案二：Worker 级别超时 + 清理注册表

维护一个 `activeStreams: Map<string, () => void>` 注册表，在 Worker 退出时统一清理。

**优点**: 显式管理所有活跃流
**缺点**: 需要修改 stream 创建/销毁的所有入口点

---

### 2.3 测试框架统一（A-P0-3）

#### 方案一：全面迁移到 Vitest（推荐）

```
保留: vitest.config.ts
移除: jest.config.js, tests/unit/setup.tsx (Jest compat layer)
重命名: *.test.ts(x) → *.test.ts(x) (Vitest 兼容，无需重命名)
```

**优点**: Vitest 兼容 Jest API，迁移成本低；配置更现代，支持 Vite HMR
**缺点**: 需要审核所有 `vi.fn()` 用法确保与原 `jest.fn()` 等价

#### 方案二：保留双框架并明确边界

```
Jest: 纯函数测试（无 React 依赖）
Vitest: React 组件测试 + Vite 环境
```

**优点**: 无需迁移现有测试
**缺点**: 两套配置需同步维护，边界模糊容易混用

---

## 3. 初步风险

| 提案 | 风险 | 缓解措施 |
|------|------|---------|
| A-P0-1 Schema | 重构影响面大，可能 break 现有 API 调用 | 渐进式迁移，先加 schema 版本字段 |
| A-P0-2 SSE | AbortController 传播链不完整 | 全面 audit 所有 AI service 调用点 |
| A-P0-3 测试 | 迁移期间测试失败，CI 红 | 先在 PR 中并行运行，确认无差异再切换 |
| A-P1-2 限流 | KV 写入有延迟，限流计数不准 | 使用 Cache API（内存级，更快） |
| A-P1-3 types | packages/types 被直接引用前需全面审查 | 先建立空 package.json，验证导入路径 |

---

## 4. 验收标准（具体可测试）

### A-P0-1 Schema Drift
- [ ] `packages/types/package.json` 存在且 pnpm workspace 可解析
- [ ] `GenerateContextsResponseSchema` 定义在 `packages/types/src/api/`
- [ ] 运行 `grep -r "sessionId" vibex-fronted/src/lib/api/` 返回空（已统一为 generationId）
- [ ] 所有 API route 使用 `@vibex/types` 的 schema 做运行时验证
- [ ] 新增 API 字段时，CI 检查对应的 Zod schema 已更新

### A-P0-2 SSE Stream
- [ ] `ai-service.ts` 中所有 `fetch` 调用传递 `signal: controller.signal`
- [ ] 添加端到端测试：发送长时间 AI 请求，验证超时后 stream 被正确中断
- [ ] `setTimeout` 在 `finally` 块或 `cancel()` 中被 `clearTimeout` 清理
- [ ] 无 `setInterval` 调用（Workers 禁用）

### A-P0-3 测试框架
- [ ] `jest.config.js` 文件已删除
- [ ] `vitest.config.ts` 覆盖所有测试目录
- [ ] CI 中只运行一套测试命令：`pnpm test`
- [ ] 所有现有测试通过（无功能 regression）
- [ ] `tests/unit/setup.tsx` 中的 jest globals compat layer 已移除

### A-P1-1 OPTIONS 预检
- [ ] CORS preflight 请求（OPTIONS 方法）返回 200（而非 401）
- [ ] `curl -X OPTIONS https://api.vibex.top/api/protected-route` 返回正确 headers

### A-P1-2 分布式限流
- [ ] 限流计数器存储在 Cache API 或 KV
- [ ] 多实例并发请求场景下，限流计数准确
- [ ] `rateLimit.ts` 无内存 Map fallback（在 Workers 环境中）

### A-P1-3 packages/types
- [ ] `pnpm --filter @vibex/types build` 成功
- [ ] `pnpm --filter vibex-fronted add @vibex/types` 可正确解析
- [ ] `import { SomeSchema } from '@vibex/types/api'` 在前端和后端均可工作

### A-P2-1 SSR-Safe 规范
- [ ] 新增 `docs/ssr-safe-coding-guidelines.md`
- [ ] ESLint rule 检测 `setInterval` / `window.*` 在组件顶层的使用
- [ ] 现有 SSR-Unsafe 代码修复完成（grep 返回空）

### A-P2-2 健康检查
- [ ] `GET /health` 返回 200 且包含 DB/KV/AI 状态
- [ ] 部署后可通过健康检查验证服务就绪

### A-P2-3 AI Timeout
- [ ] AI service 所有外部调用支持 `AbortController`
- [ ] timeout 可配置（环境变量或 config 文件）
- [ ] 超时后用户收到友好的错误提示（非 500）

---

## 5. 优先级建议

```
P0 (立即修复):
  1. A-P0-1 Schema Drift — 根因修复，阻止持续产生的 bug
  2. A-P0-2 SSE Stream — 服务稳定性，防止 Worker 崩溃
  3. A-P0-3 测试框架 — 开发效率，消除维护负担

P1 (本周完成):
  4. A-P1-1 OPTIONS 预检 — 用户无法使用 CORS 相关功能
  5. A-P1-2 分布式限流 — 成本风险
  6. A-P1-3 packages/types — Schema drift 的工程根因

P2 (排期处理):
  7. A-P2-1 SSR 规范 — 防患于未然
  8. A-P2-2 健康检查 — 运维必需
  9. A-P2-3 AI Timeout — 可先用 P0-2 方案覆盖
```

---

## 6. 依赖关系

```
A-P1-3 (packages/types) ──→ A-P0-1 (Schema Drift)
  ↑ 先行建立 @vibex/types 包

A-P0-2 (SSE) ──→ A-P2-3 (AI Timeout)
  ↑ SSE timeout 是 AI timeout 的子集

A-P0-3 (测试统一) 独立
  ↑ 无依赖，可并行执行
```
