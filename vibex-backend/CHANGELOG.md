# Changelog

## [Unreleased]

### Backend Core

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
