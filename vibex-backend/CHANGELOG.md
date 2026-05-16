# Changelog

## [Unreleased]

### Backend Core

#### 2026-05-17

- **Epic F002 PDF Export API** (epic/f002-export-pdf-api)
  - `src/app/api/export/pdf/route.ts`: POST /api/export/pdf endpoint
    - E006: Receives canvas data as JSON body, returns minimal valid PDF
    - Error handling: 400 for missing/invalid body, 500 for generation failures
    - Content-Disposition header with timestamped filename

#### 2026-04-09

- **Epic2 Chat SSE 可靠性增强** (sse-backend-fix)
  - `src/app/api/v1/chat/route.ts`: Chat SSE 可靠性修复
    - F2.1: 30s timeout (`AbortController` + `setTimeout` + `clearTimeout` finally)
    - F2.2: Client disconnect 信号转发 (`request.signal` → `abortController.abort()`)
    - F2.3: conversationId 首事件返回（MiniMax stream 之前发送）
  - `src/app/api/v1/chat/route.test.ts`: Chat SSE 集成测试 183 行，7 tests
  - `src/app/api/v1/canvas/__tests__/stream.test.ts`: Canvas SSE 集成测试 159 行
  - 提交: `01811ced`

- **Epic5 测试覆盖** (sse-backend-fix)
  - `vibex-fronted/tests/e2e/sse-e2e.spec.ts`: Playwright E2E SSE 事件序列测试 205 行，6 tests (3 pass 3 skip)
  - `vibex-fronted/playwright.sse.config.ts`: 独立 Playwright 配置，支持 `BASE_URL` 环境变量
  - F5.1 Vitest: 已在 Epic2 的 `canvas/__tests__/stream.test.ts` 中实现
  - 提交: `5121ca11`

- **Epic4 Hono/Next.js 路由一致性** (sse-backend-fix, 随 Epic2 合并)
  - `src/app/api/v1/canvas/stream/route.ts`: Canvas SSE stream endpoint，requirement query 参数
  - F4.1: 路由参数验证
  - F4.2: Canvas SSE 事件序列集成测试
  - 提交: `01811ced`

- **Epic1 SSE 超时稳定性修复** (sse-backend-fix)
  - `src/lib/sse-stream-lib/index.ts`: SSEStreamOptions.timeout 参数化，默认 30s，AbortController 级联取消，timers 统一清理
  - `src/lib/sse-stream-lib/error-classifier.ts` (F3.1): 错误分类函数，AbortError→timeout / success=false→llm_error / 网络错误→network
  - `src/lib/sse-stream-lib/index.ts`: 4 个 stage catch 块 + error event 均注入 errorType (F3.2)
  - `src/lib/sse-stream-lib/index.test.ts`: 18 Jest tests 全部通过
  - 提交: `9ff47ab2`

#### 2026-04-07

- **E-P0-4 P0-12/13 Test Fixes** (tester-e-p0-4)
  - `src/app/api/projects/route.test.ts`: Complete rewrite of P0-13 project search API tests
    - Added auth mocking (`getAuthUserFromRequest`), env mocking (`getLocalEnv`), Prisma mocking
    - 14 tests covering: auth, pagination, q/name/description search, status/isPublic/isTemplate filters, limit/offset, deprecation headers, error handling
  - `src/app/api/projects/route.ts`: Bug fixes
    - Fixed search+userFilter combination (q OR was being overwritten)
    - Added explicit userId filter support
    - Added try-catch + safeError for error handling (matching v1 route pattern)
  - `src/lib/ai-quality/keyword-detector.test.ts`: 10 tests (pre-existing, all passing)
  - All 32 P0-12/13 tests: ✅ 100% pass

#### 2026-04-05

- **canvas-api-completion E1: Flows CRUD API**
  - `src/routes/v1/flows.ts`: GET / POST / GET/:id / PUT/:id / DELETE/:id for FlowData
  - Hono + D1 pattern, protected routes, pagination (page/limit), FlowData JSON columns (nodes TEXT, edges TEXT)
  - `src/routes/v1/__tests__/flows.test.ts`: 14 unit tests (all passing)
  - Registered in `gateway.ts` as `protected_.route('/canvas/flows', flows)`
  - Commits: `ebd007db`, `33cd209e`

- **canvas-api-completion E2: Canvas Snapshot API (Hono)**
  - `src/routes/v1/canvas/snapshots.ts`: GET / POST / GET/:id / GET/latest / POST /:id/restore
  - Hono + D1 pattern, optimistic locking (409 conflict), version comparison (< not <=)
  - `src/routes/v1/canvas/__tests__/snapshots.test.ts`: 18 unit tests (all passing)
  - Commits: `25763af1`, `038485da`

#### 2026-04-03

- **E4-SyncProtocol**: POST /api/canvas/snapshots — Next.js App Router 端点，冲突检测（409 + serverSnapshot）
  - `src/app/api/canvas/snapshots/route.ts` — D1 raw SQL，支持乐观锁
  - 409 响应包含 serverSnapshot data，客户端可显示 ConflictDialog

#### 2026-04-03

- **Epic2-BackendVersionedStorage**: Canvas Snapshot + Versioned Storage API
  - CanvasSnapshot Table: `migrations/0006_canvas_snapshot.sql` (projectId, version, data, isAutoSave, @@unique index)
  - Snapshot API: `src/routes/v1/canvas/snapshots.ts` (GET/POST list, GET :id, POST :id/restore)
  - Rollback API: `src/routes/v1/canvas/rollback.ts` (GET version list, POST rollback with backup)
  - Route Registration: /v1/canvas/snapshots and /v1/canvas/rollback registered in gateway.ts
  - Zod validation: supports both frontend format (contextNodes/flowNodes/componentNodes) and legacy format
  - Commits: `9b083f22`, `af995f0b`

- **Epic3-AutoSave**: Automatic Canvas Save with Debounce + Beacon
  - useAutoSave hook: `vibex-fronted/src/hooks/canvas/useAutoSave.ts` (Zustand store subscription + use-debounce)
  - SaveIndicator component: `vibex-fronted/src/components/canvas/features/SaveIndicator.tsx`
  - CanvasPage integration: Debounce 2s (per AGENTS.md constraint), beforeunload beacon save
  - Status indicator: 保存中/已保存/保存失败
  - Commit: `af995f0b`

#### 2026-03-23

- **Epic1-Infrastructure**: Backend Core for Simplified Flow
  - Shared Type Definitions: `src/types/simplified-flow.ts` (BusinessDomain, Feature, FlowNode, FlowEdge, UINode, StepState, etc.)
  - Step State API: `src/routes/step-state.ts` (POST/GET/DELETE /api/step-state, optimistic locking)
  - Project Snapshot API: `src/routes/project-snapshot.ts` (GET /api/projects with snapshot)
  - Route Registration: /api/step-state registered in `src/index.ts`
  - Backend Tests: 436 tests passed
  - Commit: `7e0b669c`

- **Epic2-DataStructure**: Prisma Schema Extension for Simplified Flow
  - Prisma Schema Extension: `prisma/schema.prisma` (StepState, ChangeLog, BusinessDomain, UINode models)
  - Project Model Extensions: status, version, isTemplate, parentDraftId fields
  - D1 Migration: `prisma/migrations/003_step_state_tables.sql`
  - Backend Tests: 436 tests passed
  - Commit: `9f17483e`

- **Epic3-BusinessDomainAPI**: D1 Persistence for Business Domain CRUD
  - BusinessDomain CRUD: `src/routes/business-domain.ts` (GET/POST/PUT/DELETE /api/business-domain)
  - GET: Query BusinessDomain table by projectId, parse features/relationships from JSON
  - POST /create: INSERT domain row with JSON columns for features/relationships
  - PUT: Dynamic UPDATE with updatedAt, features serialized as JSON
  - DELETE: DELETE from BusinessDomain table by id
  - Added BusinessDomainRow interface for DB row mapping
  - Added parseJson<T>() helper for safe JSON parsing
  - Backend Tests: 436 tests passed
  - Commit: `19cc6742`

- **Epic4-FlowAPI**: Flow Generation & Persistence
  - Flow Route: `src/routes/flow.ts` (POST /api/flow/generate, SSE streaming)
  - FlowData CRUD: `src/routes/flow-data.ts` (GET/POST/PUT/DELETE /api/flow-data)
  - FlowNode/FlowEdge types aligned with SPEC-02 ('task'→'process', add checked/editable/animated)
  - POST /api/flow/generate: fetch domains for context, save flow to DB on done
  - D1 persistence for flow nodes/edges via FlowData table
  - Commits: `3fd8f1c7`, `a1575bf7`

- **Epic5-StepStateAPI**: D1 Persistence for Autosave
  - StepState D1 Persistence: `src/routes/step-state.ts` (POST/GET/DELETE /api/step-state)
  - Replaced in-memory stateStore with real D1/SQLite persistence
  - Optimistic locking (409 on version conflict)
  - ChangeLog entries with before/after JSON snapshots
  - In-memory fallback when D1 unavailable (dev mode)
  - Commit: `f5f46893`

- **Epic6-ProjectAPI**: Project CRUD Operations
  - Project CRUD: `src/routes/project-snapshot.ts`, `src/routes/projects.ts`
  - GET /api/projects with snapshot (stepState, domains, flow, uiNodes, history)
  - Project status, version, isTemplate, parentDraftId fields
  - Commit: `f9639fe1`

- **Epic7-UINodesAPI**: UI Node Generation & Persistence
  - UINodes Route: `src/routes/ui-nodes.ts` (POST/GET/DELETE /api/ui-nodes)
  - AI-driven UI structure generation with SSE streaming
  - UINode model with hierarchical children support
  - D1 persistence with JSON columns
  - Commit: `462064a8`

- **Epic8-TemplatesAPI**: Template Market & Listing
  - Templates Route: `src/routes/templates.ts` (GET /api/templates)
  - isPublic, usageCount, thumbnail columns on Project model
  - SPEC-09 compliance for template listing and filtering
  - Migration: `prisma/migrations/004_template_columns.sql`
  - Commits: `c12f3de2`, `95336b1b`
