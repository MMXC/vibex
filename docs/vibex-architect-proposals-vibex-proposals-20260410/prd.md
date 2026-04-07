# PRD — VibeX 架构修复提案实施计划

**项目**: vibex-architect-proposals-vibex-proposals-20260410
**状态**: Draft
**日期**: 2026-04-10
**负责人**: PM
**工作目录**: `/root/.openclaw/vibex`

---

## 1. 执行摘要

### 1.1 背景

VibeX 是一个 AI 驱动的 DDD（领域驱动设计）产品建模平台，技术栈为 Next.js 15 前端 + Cloudflare Workers 后端。当前系统存在 9 项架构性问题，包含 3 个 P0 紧急风险（Schema 不一致导致 AI 生成结果解析失败、SSE 流僵尸连接威胁 Worker 稳定性、双测试框架维护成本翻倍），已在 2026-04-10 的架构分析中被识别并形成改进提案。

### 1.2 目标

通过本次实施，消除 3 个 P0 级稳定性风险，统一代码类型系统与测试基础设施，并为后续运维与质量保障建立规范基础。

### 1.3 成功指标

| 指标 | 目标 |
|------|------|
| Schema drift bug | 本季度归零（目标 Q2 第一周起） |
| SSE zombie stream | 每次 AI 请求超时后 100% 正确中断 |
| 测试框架 | 仅保留 Vitest，CI 单一命令 `pnpm test` |
| CORS preflight | OPTIONS 请求返回 200 而非 401 |
| 分布式限流 | 多实例并发场景下计数误差 < 1% |
| 类型包可用性 | `@vibex/types/api/*` 在前后端均可正常导入 |

---

## 2. Feature List

| ID | 功能名称 | 描述 | 根因关联 | 优先级 | 工时 |
|----|---------|------|---------|--------|------|
| F-01 | packages/types 类型包建立 | 建立 `@vibex/types` workspace 包，定义 exports map | A-P1-3 | P0 | 4h |
| F-02 | Zod Schema 统一化 | 以 Zod 为单一真相来源，前后端共享类型定义 | A-P0-1 | P0 | 8h |
| F-03 | SSE AbortController 集成 | ai-service.ts 所有 fetch 调用传递 signal，超时正确清理 | A-P0-2 | P0 | 6h |
| F-04 | 测试框架全面迁移 Vitest | 删除 jest.config.js，统一使用 Vitest 运行所有测试 | A-P0-3 | P0 | 8h |
| F-05 | OPTIONS 预检路由修复 | 调整 Hono middleware 注册顺序，OPTIONS 在 auth 之前 | A-P1-1 | P1 | 2h |
| F-06 | 分布式限流（Cache API） | 将 rateLimit.ts 从内存 Map 迁移到 Cache API | A-P1-2 | P1 | 6h |
| F-07 | SSR-Safe 编码规范 | 编写规范文档 + ESLint rule 检测 SSR-Unsafe 模式 | A-P2-1 | P2 | 8h |
| F-08 | 健康检查端点 | 添加 GET /health 返回 DB/KV/AI 服务状态 | A-P2-2 | P2 | 4h |
| F-09 | AI Service Timeout 配置化 | 将 timeout 从硬编码改为环境变量/配置文件，支持请求级别覆盖 | A-P2-3 | P2 | 4h |

**总工时估算**: 50h（约 6.25 人天，按 2 人并行 Sprint 约 3 Sprint）

---

## 3. Epic 拆分

| Epic | 描述 | Stories | 总工时 |
|------|------|---------|--------|
| Epic 1 | 类型系统统一 | F-01 + F-02 | 12h |
| Epic 2 | SSE 与 AI Service 可靠性 | F-03 + F-09 | 10h |
| Epic 3 | 测试基础设施统一 | F-04 | 8h |
| Epic 4 | 部署与运维基础设施 | F-05 + F-06 | 8h |
| Epic 5 | 质量保障与规范 | F-07 + F-08 | 12h |

### Epic 1: 类型系统统一

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| ST-01 | packages/types 包初始化 | 4h | `pnpm --filter @vibex/types build` 成功；`import { X } from '@vibex/types/api'` 在前后端均可工作 |
| ST-02 | Zod Schema 重构 | 8h | `sessionId` → `generationId` 漂移修复；所有 API route 运行时验证通过 |

### Epic 2: SSE 与 AI Service 可靠性

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| ST-03 | SSE AbortController 集成 | 6h | ai-service.ts 所有 fetch 调用传递 `signal: controller.signal`；超时后 stream 正确中断，无 zombie 连接 |
| ST-04 | AI Timeout 配置化 | 4h | timeout 通过环境变量 `AI_TIMEOUT_MS` 配置；请求级别可覆盖 |

### Epic 3: 测试基础设施统一

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| ST-05 | Vitest 全面迁移 | 8h | `jest.config.js` 删除；`pnpm test` 运行 Vitest；所有测试通过，无 regression |

### Epic 4: 部署与运维基础设施

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| ST-06 | OPTIONS 预检路由修复 | 2h | `curl -X OPTIONS /api/protected-route` 返回 200 而非 401 |
| ST-07 | 分布式限流迁移 | 6h | 限流计数器存储在 Cache API；多实例并发计数误差 < 1% |

### Epic 5: 质量保障与规范

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| ST-08 | SSR-Safe 编码规范 | 8h | 规范文档存在于 `docs/ssr-safe-coding-guidelines.md`；ESLint 规则已部署；现有 unsafe 代码已修复 |
| ST-09 | 健康检查端点 | 4h | `GET /health` 返回 200，body 包含 `{ db, kv, ai }` 三个服务状态字段 |

---

## 4. 验收标准

### Epic 1 — 类型系统统一

```
# ST-01: packages/types 包初始化
expect(build('@vibex/types')).resolves.toBeDefined()
expect(import('@vibex/types/api/canvas')).not.toThrow()
expect(pnpmFilter('@vibex/types')).toBeInWorkspace()

# ST-02: Zod Schema 重构
expect(grep('sessionId', 'vibex-fronted/src/lib/api/')).toHaveLength(0)
expect(validateApiResponse(apiResponse, GenerateContextsResponseSchema)).toBe(true)
expect(zod.parse(GenerateContextsResponseSchema, mockResponse)).toEqual(expected)
```

### Epic 2 — SSE 与 AI Service 可靠性

```
# ST-03: SSE AbortController 集成
expect(aiService.chat()).toSupport('signal' parameter)
expect(timeoutTriggered).toClearTimeout()  // finally 块中 clearTimeout
expect(zombieConnections).toHaveLength(0)  // 无 zombie 连接残留

# ST-04: AI Timeout 配置化
expect(process.env.AI_TIMEOUT_MS).toBeDefined()
expect(aiService.chat({ timeout: 5000 })).toOverrideDefault()
```

### Epic 3 — 测试基础设施统一

```
# ST-05: Vitest 全面迁移
expect(fileExists('jest.config.js')).toBe(false)
expect(run('pnpm test')).toHaveExitCode(0)
expect(testResults.count).toBeGreaterThan(0)
expect(run('pnpm test').includes('vitest')).toBe(true)
```

### Epic 4 — 部署与运维基础设施

```
# ST-06: OPTIONS 预检路由修复
expect(fetch('OPTIONS', '/api/protected')).toHaveStatus(200)
expect(headers).toContain('access-control-allow-origin')

# ST-07: 分布式限流迁移
expect(rateLimitStore).toBe('CacheAPI')  // 非内存 Map
expect(multiInstanceAccuracy).toBeGreaterThan(0.99)
expect(rateLimitStore).not.toBeInstanceOf(Map)
```

### Epic 5 — 质量保障与规范

```
# ST-08: SSR-Safe 编码规范
expect(fileExists('docs/ssr-safe-coding-guidelines.md')).toBe(true)
expect(run('pnpm lint')).toHaveNoSSRWarnings()
expect(grep('setInterval', 'src/components/')).toHaveLength(0)

# ST-09: 健康检查端点
expect(fetch('GET', '/health')).toHaveStatus(200)
expect(healthBody).toContainKeys(['db', 'kv', 'ai'])
expect(healthBody.db.status).toBeOneOf(['ok', 'error'])
```

---

## 5. Definition of Done

所有 Story 须满足以下条件方可标记为完成：

1. **代码完成**: 所有修改已通过 `git add` / `git commit`
2. **测试通过**: `pnpm test` 全部通过（Epic 3 须额外确认 `jest.config.js` 已删除）
3. **类型检查通过**: `pnpm typecheck` 无错误
4. **Linter 通过**: `pnpm lint` 无 error 级别警告
5. **CI 绿灯**: GitHub Actions / CI pipeline 所有检查通过
6. **PR 已合并**: 相关代码变更已通过 code review 并合并到 main/trunk
7. **文档更新**: 改动涉及的 README 或内联注释已同步更新

**Epic 级 DoD**（在所有 Story DoD 满足后）:
- Epic 1: `@vibex/types` 可被前后端正常引用，Schema drift 相关 bug 为零
- Epic 2: 压测验证 SSE 超时后无 zombie 连接
- Epic 3: 仅有 Vitest 一套测试框架运行于 CI
- Epic 4: 部署验证通过（OPTIONS 正常 + 限流计数准确）
- Epic 5: ESLint SSR 规则在 CI 中启用，健康检查端点已在生产环境验证

---

## 6. 功能点汇总表（含页面/模块集成标注）

| 功能 | 模块/文件 | 改动类型 | 集成位置 |
|------|----------|---------|---------|
| F-01 packages/types | `packages/types/` | 新建 | workspace-wide |
| F-02 Zod Schema | `packages/types/src/api/`, `vibex-fronted/src/app/api/`, `vibex-fronted/src/lib/api/` | 重构 | API Layer |
| F-03 SSE AbortController | `vibex-backend/src/services/ai-service.ts` | 修改 | AI Service |
| F-04 Vitest 迁移 | `vitest.config.ts`, `jest.config.js`, `tests/` | 重构 | 测试基础设施 |
| F-05 OPTIONS 修复 | `vibex-backend/src/gateway.ts` | 修改 | Gateway/Middleware |
| F-06 分布式限流 | `vibex-backend/src/lib/rateLimit.ts` | 重构 | Middleware |
| F-07 SSR-Safe 规范 | `docs/ssr-safe-coding-guidelines.md`, ESLint config | 新建 | 开发规范 |
| F-08 健康检查端点 | `vibex-backend/src/routes/health.ts` | 新建 | API 路由 |
| F-09 AI Timeout 配置化 | `vibex-backend/src/config/`, `ai-service.ts` | 重构 | AI Service |

---

## 7. 实施计划（Sprint 排期）

> 按 2 人并行开发估算，工时含 code review 和测试，不含 PRD 本阶段时间。

### Sprint 1 — 基础稳固（P0 核心）

| Story | 工时 | 人员 | 产出 |
|-------|------|------|------|
| ST-01 packages/types 初始化 | 4h | Dev1 | `@vibex/types` 包 |
| ST-02 Zod Schema 重构 | 8h | Dev1 | Schema 统一 |
| ST-05 OPTIONS 预检修复 | 2h | Dev1 | CORS 修复 |
| ST-04 AI Timeout 配置化 | 4h | Dev2 | 配置化 timeout |
| **Sprint 1 合计** | **18h** | | **Epic 1 完成 + Epic 4 部分** |

### Sprint 2 — 可靠性攻坚（P0 + P1）

| Story | 工时 | 人员 | 产出 |
|-------|------|------|------|
| ST-03 SSE AbortController 集成 | 6h | Dev1 | SSE 可靠性 |
| ST-06 分布式限流迁移 | 6h | Dev1 | 限流修复 |
| ST-05 Vitest 全面迁移 | 8h | Dev2 | 测试统一 |
| **Sprint 2 合计** | **20h** | | **Epic 2 + Epic 3 + Epic 4 完成** |

### Sprint 3 — 质量保障（P2）

| Story | 工时 | 人员 | 产出 |
|-------|------|------|------|
| ST-08 SSR-Safe 编码规范 | 8h | Dev1 | 规范文档 + ESLint |
| ST-09 健康检查端点 | 4h | Dev2 | /health 端点 |
| Buffer / regression 修复 | 4h | Dev1+2 | |
| **Sprint 3 合计** | **16h** | | **Epic 5 完成 + 整体收尾** |

### 里程碑

| 里程碑 | 时间 | 条件 |
|--------|------|------|
| M1: P0 清零 | Sprint 1 末 | Epic 1 + Epic 2 完成 |
| M2: 基础设施统一 | Sprint 2 末 | Epic 3 + Epic 4 完成 |
| M3: 全部交付 | Sprint 3 末 | Epic 5 完成 + CI 绿灯 |

---

## 8. 依赖关系

```
ST-01 (packages/types) ──→ ST-02 (Zod Schema)
  ↑ types 包必须先建立

ST-01 ──→ ST-03 (SSE)
  ↑ SSE 相关类型需要从 @vibex/types 导入

ST-01 ──→ ST-06 (分布式限流)
  ↑ 限流类型定义共享

ST-03 (SSE AbortController) ──→ ST-04 (AI Timeout)
  ↑ SSE 超时是 AI timeout 的子集

ST-05 (Vitest 迁移) ──→ ST-01 (ST-01 先确保类型正确)
  ↑ 类型正确是测试迁移的前提

Epic 3 (测试) 可与 Epic 1/2 并行执行（无直接依赖）
Epic 4 (部署) 可与 Epic 1/2/3 并行
Epic 5 (规范) 可在 Epic 1 完成后开始
```

---

## 9. 风险与缓解

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|---------|
| Schema 重构 break 现有 API | 中 | 高 | 渐进式迁移，先加版本字段 |
| Vitest 迁移期间 CI 红 | 中 | 中 | PR 中并行运行 Jest+Vitest，确认无差异后切换 |
| Cache API 限流计数不准 | 低 | 中 | 使用 KV 作为 fallback，多次读写验证 |
| SSE AbortController 传播链断裂 | 中 | 高 | 全面 audit 所有 ai-service 调用点 |

---

*PRD 由 PM Agent 生成，参考 architect@2026-04-10 产出文件*
