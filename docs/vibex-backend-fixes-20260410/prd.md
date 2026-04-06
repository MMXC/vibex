# PRD: Vibex Backend Fixes — 2026-04-10

**Project**: vibex-backend-fixes-20260410  
**Type**: Bug Fix + Quality Improvement Sprint  
**Author**: PM Agent  
**Date**: 2026-04-10  
**Status**: Ready for Development  
**Est. Total Effort**: ~16 developer hours (4 sprints)

---

## 1. Executive Summary

### Background

The 2026-04-09 sprint resolved critical concurrency and deployment stability issues (E1–E6). However, a parallel proposal execution debt has accumulated since 2026-04-06, creating **10 backend bugs and quality issues** that directly block team productivity. These issues span Cloudflare Workers deployment failures, runtime errors, data integrity problems, and type safety gaps.

### Goal

Fix all P0/P1 backend bugs (streaming `this` binding, Prisma in Workers, relations query, memory cache leakage) and address P1/P2 quality issues (auth, input validation, logging, frontend type safety) to restore deployment stability and type safety baseline.

### Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| `pnpm --filter vibex-backend run typecheck` | ✅ Pass | CI gate |
| `pnpm --filter vibex-backend run test` | ✅ >80% coverage | CI gate |
| `pnpm --filter vibex-fronted run typecheck` | ✅ Pass | CI gate |
| Wrangler deploy dry-run | ✅ No Prisma warnings | CI gate |
| Zero empty `catch {}` blocks | 0 remaining | `grep -r "catch { }" src/` |
| Auth coverage | All 16+ routes protected | Manual + E2E |

---

## 2. Feature List

| ID | Feature | Description | Root Cause | Priority | Est. |
|----|---------|-------------|-----------|----------|------|
| F-01 | Streaming `this` binding fix | `createStreamingResponse` crashes with ReferenceError in production | Variable declared after closure reference | P0 | 0.5h |
| F-02 | PrismaClient Workers isolation | 8+ API routes fail on Workers deploy or produce connection errors | Direct `new PrismaClient()` without `isWorkers` guard | P0 | 1.5h |
| F-03 | Multi-entity relations query | `getRelationsForEntities` only returns relations for the first entityId | `entityIds[0]` hardcoded, loop missing | P1 | 0.5h |
| F-04 | D1 KV cache (replace Map) | In-memory `Map()` leaks across Workers cold starts, data corrupts between requests | Workers stateless but `this.cache = new Map()` persists | P1 | 1.5h |
| F-05 | Auth middleware on all routes | 16+ routes lack authentication, anyone can call | Auth not enforced per-route | P1 | 2h |
| F-06 | Input validation (Zod) | Canvas routes accept any JSON, no UUID/size validation | Missing schema validation layer | P1 | 1h |
| F-07 | Unified logger with sanitization | Production logs expose entityId/token/usage via `console.log` | No log redaction, no level control | P1 | 1h |
| F-08 | PrismaPoolManager activation | Full pool manager exists but unused, all connections bypass it | Pool instantiated but not called | P2 | 1h |
| F-09 | `as any` removal (components) | CardTreeNode + 3 other components use `any`, blocking type safety | Implicit type coercion for expedience | P1 | 1h |
| F-10 | Empty catch block elimination | 10+ `catch {}` swallow errors silently in production | Error handling deferred | P1 | 1h |
| F-11 | DOMPurify SVG sanitization | 4 MermaidRenderer instances render LLM output unsanitized, XSS risk | `dangerouslySetInnerHTML` without sanitization | P1 | 1h |
| F-12 | ReactFlow hook usage fix | Nodes call `useReactFlow()` incorrectly; nested providers cause context errors | Pattern copied from examples without understanding | P1 | 1h |
| F-13 | Console → logger replacement | Frontend stores leak entityId/token to browser console | `console.log` used for debugging, not removed | P2 | 0.5h |
| F-14 | Chat history pass-through | Chat API discards `history` field, LLM gets only the last message | History not forwarded to LLM service | P2 | 0.5h |
| F-15 | ErrorHandler `any` → `unknown` | `error.details?: any` leaks unknown types, unsafe | Type shortcuts for speed | P2 | 0.5h |
| F-16 | `eslint-disable` hooks removal | `stores/ddd/init.ts` has hook rule suppressed | Hook ordering issue deferred | P2 | 0.5h |
| F-17 | Flow execution TODO stubs | 4 `TODO` placeholders in `flow-execution.ts` cause silent failures | Not implemented yet | P2 | 1h |
| F-18 | clarificationId DB index | `Entity.clarificationId` queried but unindexed, slow on large datasets | Index forgotten during schema design | P2 | 0.5h |
| F-19 | Login route duplicate code | `auth/login/route.ts` has same path concatenated twice, file bloated | Copy-paste error | P3 | 0.5h |
| F-20 | AGENTS.md Workers guide | Missing Workers-specific docs for new team members | Documentation never written | P3 | 0.5h |

---

## 3. Epic Breakdown

### Epic 1 — P0 Critical Bugs (4h)

| Story | Description | Est. | Acceptance Criteria |
|-------|-------------|------|---------------------|
| ST-01 | Fix `createStreamingResponse` `this` binding | 0.5h | Stream starts without ReferenceError; produces chunks; `vitest run __tests__/services/llm.test.ts` passes |
| ST-02 | Replace all `new PrismaClient()` with `getDBClient()` across 16+ routes | 2h | `wrangler deploy --dry-run` has no Prisma warnings; `pnpm --filter vibex-backend run test` passes |
| ST-03 | Fix `getRelationsForEntities` to query all entityIds (not just first) | 0.5h | 3 entity IDs → 2+ relations returned; `vitest run __tests__/services/requirement-analyzer.test.ts` passes |
| ST-04 | Replace `Map()` cache with D1 KV in `RequirementAnalyzerService` | 1h | Cold start → cache miss (isolated); TTL enforced; `vitest run __tests__/services/requirement-analyzer.test.ts` passes |

### Epic 2 — Auth & Input Validation (3h)

| Story | Description | Est. | Acceptance Criteria |
|-------|-------------|------|---------------------|
| ST-05 | Create `withAuth()` middleware + apply to all 16+ routes | 2h | `curl /api/v1/chat` without token → 401; with valid Bearer token → proceeds |
| ST-06 | Add Zod validation to canvas/generate, generate-contexts, generate-components, generate-flows | 1h | `POST /api/v1/canvas/generate -d '{"projectId":"not-a-uuid"}'` → 400 + error details |

### Epic 3 — Backend Quality Foundations (3.5h)

| Story | Description | Est. | Acceptance Criteria |
|-------|-------------|------|---------------------|
| ST-07 | Unified logger (`lib/logger.ts`) with sensitive data redaction | 1h | `logger.error("test", { entityId:"abc", token:"sk-123" })` → output contains `[REDACTED]` for both; `vitest run __tests__/lib/logger.test.ts` passes |
| ST-08 | Replace all empty `catch {}` blocks (backend, 10+ files) with `logger.error()` | 1h | `grep -r "catch { }" vibex-backend/src/` returns empty; no new empty catches |
| ST-09 | Enable PrismaPoolManager in `lib/db.ts` and wire to route heavy-read paths | 0.5h | Pool reuse rate ≥ 80% under load test |
| ST-10 | Implement 4 TODO stubs in `lib/prompts/flow-execution.ts` | 1h | `/api/flows/execute` returns non-null step outputs; `vitest run __tests__/lib/flow-execution.test.ts` passes |
| ST-11 | Add `clarificationId` index to `Entity` and `Clarification` tables | 0.5h | `EXPLAIN QUERY PLAN` shows index usage; `pnpm migrate` completes |

### Epic 4 — Frontend Type Safety (2.5h)

| Story | Description | Est. | Acceptance Criteria |
|-------|-------------|------|---------------------|
| ST-12 | Remove `as any` from CardTreeNode, FlowNodes, PageNode, RelationshipEdge | 1h | `pnpm --filter vibex-fronted run typecheck` passes; no `as any` in source |
| ST-13 | DOMPurify SVG sanitization for all 4 MermaidRenderer instances | 1h | `<script>alert(1)</script>` injected in mermaid code → script stripped from output; XSS test passes |
| ST-14 | Fix ReactFlow hook usage (remove `useReactFlow()` from Node components; remove nested Provider) | 0.5h | ReactFlow renders without "Cannot find ReactFlow context" errors; gstack screenshot verifies |

### Epic 5 — Frontend Architecture (3h)

| Story | Description | Est. | Acceptance Criteria |
|-------|-------------|------|---------------------|
| ST-15 | Split CanvasPage.tsx (981 lines → 5 sub-components: Header, TreePanel, PreviewPanel, QueuePanel, Shortcuts) | 2h | Each sub-component independently testable; all existing functionality preserved; gstack screenshot of canvas after refactor |
| ST-16 | Merge `designStore` + `simplifiedFlowStore` via Zustand slices pattern | 1h | All canvas features work; `pnpm --filter vibex-fronted run test` passes |

### Epic 6 — Quality & Polish (3.5h)

| Story | Description | Est. | Acceptance Criteria |
|-------|-------------|------|---------------------|
| ST-17 | Replace `console.log` with `logger` across frontend stores + homepage | 0.5h | `grep -r "console.log" vibex-fronted/src/lib/logger.ts` → only in logger; `grep -r "console.log" vibex-fronted/src/stores/` → empty |
| ST-18 | Fix chat history: forward `history` field to LLM service | 0.5h | 3-turn history → LLM receives 4 messages (3 history + 1 current); `vitest run __tests__/lib/api/chat.test.ts` passes |
| ST-19 | `error.details?: any` → `error.details?: unknown` in `lib/errorHandler.ts` | 0.5h | `pnpm --filter vibex-backend run typecheck` passes |
| ST-20 | Remove `eslint-disable` hooks comment from `stores/ddd/init.ts` | 0.5h | `pnpm --filter vibex-fronted run lint` passes without disable |
| ST-21 | Fix login/route.ts duplicate path concatenation | 0.5h | File < 200 lines; login API still functions correctly |
| ST-22 | Add Workers development guide to `vibex-backend/AGENTS.md` | 0.5h | `grep -c "getDBClient\|isWorkers\|CACHE_KV" AGENTS.md` ≥ 3 |
| ST-23 | Canvas E2E tests (5 scenarios: create project, add/drag/delete node, export) | 1h | All 5 scenarios pass in CI (`pnpm --filter vibex-fronted run test:e2e`) |

---

## 4. Acceptance Criteria

### AC-1: Production Readiness Gates
```
Given a developer runs a pull request
When all changes from this sprint are merged
Then:
  - `pnpm --filter vibex-backend run typecheck` exits 0
  - `pnpm --filter vibex-backend run test` exits 0 (>80% coverage)
  - `pnpm --filter vibex-fronted run typecheck` exits 0
  - `pnpm --filter vibex-fronted run test` exits 0 (>70% coverage)
  - `pnpm --filter vibex-fronted run test:e2e` exits 0
  - `wrangler deploy --dry-run` shows no Prisma warnings
```

### AC-2: Streaming Fix
```
Given the LLM streaming endpoint is called
When the ReadableStream starts
Then no ReferenceError is thrown
And chunks are produced and enqueued correctly
And the stream closes gracefully on completion
And errors propagate via controller.error()
```

### AC-3: Workers DB Isolation
```
Given the app is deployed to Cloudflare Workers
When any API route is called
Then PrismaClient is not instantiated directly
And getDBClient() is used with isWorkers=true
And D1 bindings are used instead of Prisma SQLite
And no connection errors occur on cold start
```

### AC-4: Multi-Entity Relations
```
Given a RequirementAnalyzer request with 3 entity IDs
When getRelationsForEntities() is called
Then relations for ALL 3 entity IDs are returned
And each relation involves at least one of the input entity IDs
```

### AC-5: D1 KV Cache Isolation
```
Given a RequirementAnalyzer service instance
When a cold start occurs (new instance)
Then the cache is empty (no Map() persistence)
And subsequent requests re-populate the cache
And cached results have TTL enforcement
```

### AC-6: Auth Coverage
```
Given a request to any /api/v1/* route (except /auth/login, /auth/register, /health)
When no Authorization header is provided
Then a 401 response is returned immediately
When a valid Bearer token is provided
Then the request proceeds with auth context available
```

### AC-7: Input Validation
```
Given a POST to /api/v1/canvas/generate with invalid input
When projectId is not a valid UUID
Then a 400 response is returned with { error: "Validation failed", details: [...] }
When pageIds is an empty array
Then a 400 response is returned
When input is valid
Then the request proceeds normally
```

### AC-8: Log Sanitization
```
Given logger.error() is called with sensitive metadata
When the log is written to stdout
Then entityId, token, usage, sk-*, password, secret, key are replaced with [REDACTED]
And no raw sensitive values appear in the output
```

### AC-9: Empty Catch Elimination
```
Given a grep search for empty catch blocks in vibex-backend/src/
When run against the updated code
Then zero matches are found
And every catch block calls logger.error() or re-throws
```

### AC-10: Mermaid XSS Prevention
```
Given a MermaidRenderer receives code with <script>alert(1)</script>
When the SVG is rendered via dangerouslySetInnerHTML
Then the script tag is stripped from the output
And no script execution occurs in the browser
```

### AC-11: Canvas E2E
```
Given a Playwright test runs the canvas flow
When scenarios (create project, add node, drag, delete, export) execute
Then all 5 scenarios pass
And no console errors occur
```

---

## 5. Definition of Done

### Code Quality
- [ ] All TypeScript files pass `typecheck` (no `as any` introduced)
- [ ] All source files have zero `catch { }` (empty catch)
- [ ] All sensitive data redacted in log output
- [ ] All 16+ API routes protected by `withAuth()`
- [ ] All canvas routes validate input via Zod schemas

### Testing
- [ ] Backend unit tests > 80% line coverage
- [ ] Frontend unit tests > 70% line coverage
- [ ] All E2E scenarios pass in CI
- [ ] `vitest run __tests__/services/llm.test.ts` passes
- [ ] `vitest run __tests__/services/requirement-analyzer.test.ts` passes
- [ ] `vitest run __tests__/lib/logger.test.ts` passes
- [ ] `vitest run __tests__/lib/flow-execution.test.ts` passes

### Deployment
- [ ] `wrangler deploy --dry-run` succeeds without Prisma warnings
- [ ] Staging deployment verified manually
- [ ] Rollback procedure documented per epic

### Documentation
- [ ] `vibex-backend/AGENTS.md` updated with Workers development guide
- [ ] All new files (logger.ts, apiAuth.ts, schemas/canvas.ts) have JSDoc comments
- [ ] Migration file created for `clarificationId` index

---

## 6. Functionality Summary

| Epic | Stories | Est. | Pages/Components Affected |
|------|---------|------|--------------------------|
| Epic 1: P0 Critical Bugs | ST-01~04 | 4h | `services/llm.ts`, 16+ API routes, `services/requirement-analyzer.ts` |
| Epic 2: Auth & Validation | ST-05~06 | 3h | All `/api/v1/*` routes, canvas generate routes |
| Epic 3: Backend Quality | ST-07~11 | 3.5h | `lib/logger.ts`, `lib/db.ts`, `lib/prompts/flow-execution.ts`, migrations |
| Epic 4: Frontend Type Safety | ST-12~14 | 2.5h | `components/visualization/*`, `components/ui/*`, `MermaidRenderer` (×4) |
| Epic 5: Frontend Architecture | ST-15~16 | 3h | `CanvasPage.tsx` → 5 sub-components, `stores/` |
| Epic 6: Quality & Polish | ST-17~23 | 3.5h | Frontend stores, `lib/errorHandler.ts`, `AGENTS.md`, E2E tests |
| **Total** | **23 stories** | **~16h** | |

---

## 7. Implementation Plan (Sprint Breakdown)

| Sprint | Duration | Focus | Stories | Est. |
|--------|----------|-------|---------|------|
| Sprint 0 (Pre-work) | 0.5h | Infrastructure scaffolding | Scaffolding (logger, apiAuth, db extend, CI, schemas) | 0.5h |
| Sprint 1 | 3.5h | P0 Critical Bugs | ST-01, ST-02, ST-03, ST-04 | 3.5h |
| Sprint 2 | 2h | Auth & Input Validation | ST-05, ST-06 | 2h |
| Sprint 3 | 2h | Error Handling & Logging | ST-07, ST-08, ST-09, ST-10, ST-11 | 2h |
| Sprint 4 | 3h | Frontend Type Safety | ST-12, ST-13, ST-14, ST-17 | 3h |
| Sprint 5 | 2h | Frontend Architecture | ST-15, ST-16 | 2h |
| Sprint 6 | 1.5h | Polish & E2E | ST-18, ST-19, ST-20, ST-21, ST-22, ST-23 | 1.5h |
| **Total** | **~14.5h** | | **23 stories** | **~14.5h** |

> **Note**: Pre-work (Sprint 0) should be done before Sprint 1 begins to avoid blocking dependencies.

### Sprint Assignment

| Sprint | Stories | Owner |
|--------|---------|-------|
| Sprint 0 | Scaffolding | Dev |
| Sprint 1 | ST-01, ST-02, ST-03, ST-04 | Dev |
| Sprint 2 | ST-05, ST-06 | Dev |
| Sprint 3 | ST-07, ST-08, ST-09, ST-10, ST-11 | Dev |
| Sprint 4 | ST-12, ST-13, ST-14, ST-17 | Dev |
| Sprint 5 | ST-15, ST-16 | Dev |
| Sprint 6 | ST-18, ST-19, ST-20, ST-21, ST-22, ST-23 | Dev + Tester |

---

*PM Agent — 2026-04-10*
