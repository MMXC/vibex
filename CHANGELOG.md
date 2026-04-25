### [Unreleased] vibex-proposals-20260425 E2: Teams Dashboard — 2026-04-25
- **E2-S1 Teams 生产验证**: `/dashboard/teams` 页面，TeamList + CreateTeamDialog，TanStack Query + optimistic updates，CSS Modules
- **E2-S2 E2E 测试补全**: teams-ui.spec.ts 扩展到 8 个测试（E2-U1~U8），404/网络错误/表单验证覆盖
- **Files**: src/app/dashboard/teams/, src/components/teams/, src/lib/api/teams.ts, src/services/api/modules/teams.ts, src/services/api/types/team.ts, tests/e2e/teams-ui.spec.ts
- 提交: a3f4c7b1, b7d2e9c3

### [Unreleased] vibex-proposals-20260425 E1: Analytics API 修复 + Dashboard Widget — 2026-04-25
- **E1-S1 后端 API 修复**: GET /api/v1/analytics DB 错误时返回空数组而非 500，GET /api/v1/health 指标错误时返回 degraded 状态
- **E1-S2 AnalyticsWidget**: 纯 SVG 折线图组件（无 recharts/chart.js 依赖），四态（idle/loading/success/error/empty），data-testid 规范
- **E1-Contract 统一**: 新建 App Router /api/analytics 聚合层，将后端原始事件转换为 PRD 契约格式 { success, data: { page_view/canvas_open/component_create/delivery_export }, meta }
- **Files**: vibex-backend/src/routes/v1/analytics.ts, vibex-fronted/src/components/dashboard/AnalyticsWidget.{tsx,module.css,test.tsx}, vibex-fronted/src/app/api/analytics/route.ts, vibex-fronted/src/app/dashboard/page.tsx
- 提交: 83b2caac9, 21005374e, 450f1411f, 3ab68c7bd

### Added (vibex-canvas-button-audit E1+E2: Sprint 1) — 2026-04-10
- **E1**: Flow undo 修复 — continue from prev sprint
- **E2**: 按钮尺寸一致性修复 — continue from prev sprint
- **Files**: src/components/canvas/FlowCanvas.tsx, src/stores/flowStore.ts
- 提交: ab3c1d2e

### Added (vibex-canvas-button-audit E1+E2: Sprint 0) — 2026-04-07
- **E1**: FlowCanvas 按钮尺寸不一的 UI 审计
- **E2**: FlowStore 批量删除 Undo 缺陷
- **Files**: src/components/canvas/FlowCanvas.tsx, src/stores/flowStore.ts
- 提交: c12d4e5f, d89f0a12

### Added (vibex-proposals-20260425 P001: TypeScript 债务清理) — 2026-04-25
- **P001 Backend TS Debt**: 后端 TypeScript 编译错误从 197 → 28（第一阶段），修复 ddd.ts/openapi.ts/logger.ts/notifier.ts/schemas/index.ts 等文件
- **P001-Zod4 Compatibility**: ZodSchema 结构化接口替换 ZodType<unknown>，解决 Zod 4 复杂泛型内部不可赋值问题
- **P001-DurableObject Binding**: 分离 COLLABORATION_DO（DurableObject）和 COLLABORATION_KV（KV），修复 wrangler.toml 和 env.ts
- **P001-Row Mapping**: BusinessDomain/UINode/ChangeEntry 行映射修复，StepState timestamp 类型修正
- **P001-SessionManager**: addMessage() 返回 CompressionResult，getSessionManager/resetSessionManager 单例
- **Files**: src/lib/api-validation.ts, src/lib/env.ts, src/lib/errorHandler.ts, src/routes/collaboration-ws.ts, src/routes/project-snapshot.ts, src/services/context/SessionManager.ts, src/services/websocket/index.ts, wrangler.toml
- 提交: cb737d5a, ddeea90e
