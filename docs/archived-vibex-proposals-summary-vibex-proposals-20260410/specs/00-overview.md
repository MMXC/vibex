# Spec Overview: VibeX 质量治理与体验提升

**项目**: vibex-proposals-summary-vibex-proposals-20260410
**版本**: v1.0 | 2026-04-10

---

## Spec 文件索引

| 文件 | Epic | Sprint | 工时 | 核心内容 |
|------|------|--------|------|----------|
| `01-sprint0-s止血.md` | E1, E2 | Sprint 0 | 4h | Token 硬编码 / streaming 崩溃 / Workers 守卫 / SSE 超时 |
| `02-sprint1-质量筑基.md` | E3, E4, E5 | Sprint 1 | 16h | TypeScript any 清理 / Schema 统一 / 测试基础设施 / Vitest 迁移 |
| `03-sprint2-开发者体验.md` | E6 | Sprint 2 | 8h | CLI / types 包 / componentStore / health endpoint / SSR 规范 |
| `04-sprint3-用户体验.md` | E7 | Sprint 3 | 6h | 模板库（5+ 模板）/ 新手引导（5 步骤）|

**总工时**: 34h

---

## 依赖关系图

```
Sprint 0 (E1-S1: token fix) ──────┐
                                   ├──► Sprint 1 ──► Sprint 2 ──► Sprint 3
Sprint 0 (E2-S2: Workers deploy) ──┤        │           │           │
                                   │        ▼           ▼           ▼
Sprint 0 (E2-S1: streaming crash)─┘     类型安全    DX提升      用户体验
                                        Schema统一   Health检查   模板库
                                                     SSR规范
```

---

## 文件变更清单（推断）

基于提案分析，以下文件需要修改（需与实际代码库核实）：

### Sprint 0
- `~/.openclaw/skills/team-tasks/scripts/task_manager.py` — Slack token 环境变量化
- `services/llm.ts` — createStreamingResponse 闭包修复
- `lib/prisma.ts`（新建或修改）— PrismaClient Workers 守卫
- `app/api/auth/login/route.ts` 等 8+ 文件 — PrismaClient 守卫注入
- `services/stream.ts`（新建）— SSE 超时控制

### Sprint 1
- 全局 `.ts/.tsx` 文件（9 个）— ESLint any 清理
- `schemas/flow.ts`（新建）— Zod 统一 Schema
- `prisma/schema.prisma` — sessionId → generationId 迁移
- `stores/componentStore.ts` — selectedNodeIds 类型统一
- `services/relations.ts` — getRelationsForEntities 修复
- `playwright.config.ts` — 配置统一
- `e2e/stability.spec.ts` — 路径修复
- `e2e/component-generation.spec.ts`（新建）— flowId E2E 验证
- `vitest.config.ts`（新建）— Vitest 配置
- 测试套件 — waitForTimeout 清理

### Sprint 2
- `cli/` — 提案追踪 CLI 完善
- `packages/types/package.json`（新建）— 可依赖化
- `stores/componentStore.ts` — 批量方法
- `config/ai.ts`（新建或修改）— AI timeout 外化
- `app/api/health/route.ts`（新建）— 健康检查
- `docs/ssr-safe.md`（新建）— SSR 规范
- `prisma/migrations/` — clarificationId 索引
- `services/flow-execution/` — TODO 清理
- `components/canvas/ComponentRegistry.ts` — 版本化
- `middleware/cors.ts`（修改）— OPTIONS 200 修复

### Sprint 3
- `app/templates/page.tsx`（新建）— 模板库页面
- `data/templates.ts`（新建）— 模板数据
- `components/onboarding/OnboardingFlow.tsx`（新建）— 引导组件
- `hooks/useOnboarding.ts`（新建）— 引导状态管理
- `app/layout.tsx`（修改）— 引导组件集成

---

## 测试策略

| 层级 | 工具 | 覆盖目标 | 当前问题 |
|------|------|----------|----------|
| 单元 | Vitest | 工具函数、业务逻辑 | 需迁移自 Jest |
| 集成 | Vitest + MSW | API 路由、store | 部分缺失 |
| E2E | Playwright（统一配置后）| 关键用户路径 | 35+ 被跳过，需恢复 |
| 稳定性 | stability.spec.ts（修复后）| 无 waitForTimeout | 路径错误导致永远 PASS |

---

## 监控与告警

| 指标 | 当前 | 目标 | 监控方式 |
|------|------|------|----------|
| P0 问题数 | 13 | 0 | Sprint burndown |
| CI E2E 通过率 | < 50% | ≥ 95% | GitHub Actions |
| TypeScript any 数 | 9 | 0 | ESLint CI |
| 引导完成率 | N/A | ≥ 70% | Analytics |
| /health 响应时间 | N/A | < 200ms | 监控轮询 |

---

*v1.0 | PM Agent | 基于 48 条提案汇总*
