# AGENTS.md — Vibex Dev Proposals (2026-04-10)

**Project**: vibex-dev-proposals-vibex-proposals-20260410  
**Author**: Architect Agent  
**Date**: 2026-04-10  
**Status**: Ready for Review

---

## 1. Agent Roles Overview

This project has **4 agent roles** working in parallel:

| Role | Agent | Primary Responsibility |
|------|-------|----------------------|
| 🏛️ **Architect** | architect | Tech decisions, architecture docs, API design |
| 💻 **Dev** | dev | Code implementation, refactoring, migrations |
| 🔍 **Reviewer** | reviewer | Code review, security review, quality gate |
| 🧪 **Tester** | tester | Test writing, E2E coverage, validation |

---

## 2. Dev Agent

### 2.1 Role Definition

The Dev Agent implements all features, fixes, and refactors described in the PRD and implementation plan.

### 2.2 Responsibilities

- Implement all 10 PRD stories (ST-01 ~ ST-10)
- Implement all 17 dev proposals (D-P0-1 ~ D-P3-2)
- Follow the code patterns defined in architecture.md
- Write unit tests alongside every change
- Ensure `pnpm typecheck` passes before marking done
- Ensure `pnpm lint` passes before marking done
- Use `withAuth()` for all protected routes
- Use Zod schemas for all user input validation
- Use `logger.error()` instead of empty catch blocks
- Use `getDBClient(env, isWorkers)` instead of `new PrismaClient()`

### 2.3 Task Assignment

| Story | Dev Task | Branch | PR Target |
|-------|----------|--------|-----------|
| ST-01 | Fix LLM streaming `this` binding | `fix/llm-stream-this` | Epic1-sub-prisma-fix |
| ST-02 | Unified DB client (17 routes) | `fix/db-client-workers` | Epic1-sub-prisma-fix |
| ST-03 | Multi-ID entity relations | `fix/entity-relations-multi-id` | Epic1-sub-data-fix |
| ST-04 | D1 KV cache replacement | `fix/requirement-analyzer-d1-cache` | Epic1-sub-data-fix |
| ST-05 | Sensitive log cleanup | `fix/logger-sanitize` | Epic1-sub-quality |
| ST-06 | PrismaPoolManager enablement | `fix/pool-manager` | Epic1-sub-quality |
| ST-07 | Flow execution TODO → real impl | `impl/flow-execution` | Epic1-sub-quality |
| ST-08 | clarificationId database index | `fix/clarification-index` | Epic1-sub-quality |
| ST-09 | login/route.ts duplicate code | `fix/login-route-dedup` | Epic1-sub-quality |
| ST-10 | Workers dev guide in AGENTS.md | `docs/workers-guide` | Epic1-sub-quality |
| D-P0-1 | Auth middleware + protect routes | `feat/auth-middleware` | Epic1-sub-prisma-fix |
| D-P0-2 | Backend empty catch removal | `fix/backend-empty-catch` | Epic1-sub-quality |
| D-P0-3 | Input validation schemas | `feat/input-validation` | Epic1-sub-data-fix |
| D-P1-1 | Remove `as any` from components | `refactor/fix-any-types` | Epic1-sub-quality |
| D-P1-2 | Frontend empty catch removal | `fix/frontend-empty-catch` | Epic1-sub-quality |
| D-P1-3 | Split CanvasPage.tsx (5 sub-components) | `refactor/canvas-split` | Epic1-sub-quality |
| D-P1-4 | DOMPurify for MermaidRenderer | `fix/mermaid-xss` | Epic1-sub-quality |
| D-P1-5 | Fix ReactFlow hook usage | `fix/reactflow-hooks` | Epic1-sub-quality |
| D-P1-6 | Replace console.log with logger | `refactor/frontend-logger` | Epic1-sub-quality |
| D-P2-1 | Merge Zustand stores | `refactor/store-merge` | Epic1-sub-quality |
| D-P2-2 | Chat history passed to LLM | `fix/chat-history` | Epic1-sub-data-fix |
| D-P2-3 | Remove nested ReactFlowProvider | `fix/reactflow-provider-nesting` | Epic1-sub-quality |
| D-P2-4 | Backend errorHandler `as any` | `fix/errorhandler-types` | Epic1-sub-quality |
| D-P2-5 | Remove eslint-disable hooks | `fix/remove-eslint-disable` | Epic1-sub-quality |
| D-P2-6 | Add backend CI test gate | `feat/backend-ci` | Epic1-sub-quality |
| D-P3-1 | Canvas E2E test coverage | `test/canvas-e2e` | Epic1-sub-quality |
| D-P3-2 | error.details `unknown` type | `fix/errordetails-unknown` | Epic1-sub-quality |

### 2.4 Working Agreement

**Before starting a task**:
1. Read the relevant section of `IMPLEMENTATION_PLAN.md`
2. Read the existing code that will be modified
3. Write the test first (TDD approach for bug fixes)

**While implementing**:
- Keep changes focused — one story per commit
- Add inline comments for non-obvious logic
- Use `logger.error()` with context string for all catch blocks
- Never commit `as any` unless absolutely necessary (document why)

**After completing**:
- Run `pnpm typecheck` and `pnpm lint` locally
- Verify tests pass: `pnpm test`
- Open PR with description referencing story ID
- Tag Reviewer for review

### 2.5 Definition of Done (per story)

- [ ] Code changes match implementation plan
- [ ] Unit tests written and passing
- [ ] TypeScript typecheck passes
- [ ] ESLint passes
- [ ] PR opened and tagged

---

## 3. Reviewer Agent

### 3.1 Role Definition

The Reviewer Agent provides structured code review across security, correctness, performance, and maintainability dimensions.

### 3.2 Responsibilities

**Security Review** (mandatory for D-P0-1, D-P0-2, D-P0-3, D-P1-4):
- Verify auth middleware is applied to all protected routes
- Verify JWT secret comes from env, not hardcoded
- Verify input validation rejects malformed requests
- Verify MermaidRenderer sanitizes SVG output
- Verify logs don't contain sensitive data

**Correctness Review** (mandatory for ST-01, ST-03, ST-07):
- Verify `thisLLMService` is bound before ReadableStream construction
- Verify `getRelationsForEntities` uses IN clause with all IDs
- Verify Flow execution returns non-null step outputs
- Verify chat history is passed to LLM

**Performance Review** (mandatory for ST-04, ST-06, ST-08):
- Verify D1 KV cache replaces in-memory Map
- Verify PrismaPoolManager is actually used
- Verify index query plan uses index (not full table scan)

**Maintainability Review** (mandatory for D-P1-3, D-P2-1):
- Verify CanvasPage split is clean (sub-components independently testable)
- Verify store merge doesn't break existing imports

### 3.3 Review Checklist

For each PR, complete the following:

```
## PR Review: <story ID>
**Reviewer**: reviewer agent
**Date**: YYYY-MM-DD

### Security
- [ ] Auth applied correctly
- [ ] Input validation present
- [ ] No sensitive data in logs
- [ ] No XSS vectors

### Correctness
- [ ] Tests cover happy path
- [ ] Tests cover error paths
- [ ] Edge cases handled
- [ ] No silent failures

### Performance
- [ ] No N+1 queries
- [ ] Indexes used appropriately
- [ ] Cache strategy documented

### Maintainability
- [ ] Code follows existing patterns
- [ ] No unnecessary abstractions
- [ ] Naming is clear

### LGTM: YES / NO / NEEDS_WORK

### Comments:
- [blocker/optional] ...
```

### 3.4 Escalation

If a PR has **3+ blockers**, do not approve. Request specific fixes from Dev Agent before re-reviewing.

---

## 4. Tester Agent

### 4.1 Role Definition

The Tester Agent ensures comprehensive test coverage for all changes, writing unit, integration, and E2E tests.

### 4.2 Responsibilities

**Test Coverage Requirements**:

| Layer | Framework | Minimum Coverage | Stories |
|-------|-----------|-----------------|---------|
| Backend unit | Vitest | 80% lines | All backend stories |
| Backend integration | Vitest | 50% lines | ST-02, ST-03, ST-07 |
| Frontend unit | Vitest | 70% lines | All frontend stories |
| Frontend E2E | Playwright | Canvas flows | D-P3-1 |

**Specific Test Writing**:

| Story | Test File | Test Cases |
|-------|-----------|-----------|
| ST-01 | `__tests__/services/llm.test.ts` | Stream starts, chunks produced |
| ST-02 | `__tests__/lib/db.test.ts` | D1 client, Prisma client, no-throw |
| ST-03 | `__tests__/services/requirement-analyzer.test.ts` | 3 entities → 2+ relations |
| ST-04 | `__tests__/services/requirement-analyzer.test.ts` | Cold start → cache miss |
| ST-05 | `__tests__/lib/logger.test.ts` | Sanitization, no sensitive keys |
| ST-06 | `__tests__/lib/db.test.ts` | Pool reuse, max connections |
| ST-07 | `__tests__/lib/flow-execution.test.ts` | Wait step, failure, output not null |
| ST-08 | `__tests__/db/index.test.ts` | Index used in EXPLAIN plan |
| D-P1-4 | `__tests__/MermaidRenderer.test.tsx` | Script tag stripped |
| D-P2-2 | `__tests__/lib/api/chat.test.ts` | History passed to LLM |
| D-P3-1 | `playwright/tests/canvas/*.spec.ts` | 5 user flow scenarios |

### 4.3 Testing Strategy

**Test File Convention**:
```
vibex-backend/src/__tests__/
  lib/
    db.test.ts
    logger.test.ts
    flow-execution.test.ts
  services/
    llm.test.ts
    requirement-analyzer.test.ts
  db/
    index.test.ts

vibex-fronted/src/__tests__/
  components/
    visualization/
      MermaidRenderer.test.tsx
      CardTreeNode.test.tsx
    canvas/
      CanvasHeader.test.tsx
      CanvasTreePanel.test.tsx
      ...
  lib/
    logger.test.ts
```

**Test Data Fixtures**:
```typescript
// __tests__/fixtures/
export const mockEnv = {
  D1_DB: { prepare: vi.fn() },
  CACHE_KV: { prepare: vi.fn() },
  JWT_SECRET: 'test-secret',
  AI_API_KEY: 'test-key',
} as unknown as CloudflareEnv;

export async function createTestEntities(count: number) {
  // Create test entities in DB or mock
}
```

### 4.4 Test-Driven Development Workflow

For bug fixes:
1. Write failing test that reproduces the bug
2. Dev Agent fixes code until test passes
3. Tester Agent reviews test quality
4. Merge

### 4.5 Validation Checklist

Before marking test coverage complete:
- [ ] All new functions have at least one test
- [ ] All error paths have test coverage
- [ ] Edge cases (empty input, null values, max lengths) tested
- [ ] Tests are isolated (no shared mutable state)
- [ ] Tests run in CI and pass

---

## 5. Architect Agent

### 5.1 Role Definition

The Architect Agent defines technical direction, makes design decisions, and ensures cross-cutting concerns are addressed.

### 5.2 Responsibilities

- Define tech stack decisions (documented in architecture.md)
- Review implementation plan for feasibility
- Resolve technical disputes between Dev and Reviewer
- Update architecture.md if implementation reveals new patterns
- Ensure consistency across all sprint deliverables

### 5.3 Decision Authority

| Decision Area | Architect Authority |
|--------------|--------------------|
| Tech stack changes | Approve/reject |
| API interface design | Final say |
| Code pattern standards | Define and enforce |
| Story scope changes | Propose to PM |
| Cross-cutting concerns | Resolve |

### 5.4 Handoff Checklist

Before Dev starts Sprint 1:
- [ ] architecture.md approved by PM
- [ ] IMPLEMENTATION_PLAN.md reviewed by Dev
- [ ] AGENTS.md roles understood by all agents

---

## 6. Communication Protocol

### 6.1 Task Assignment Flow

```
Architect → Dev: "ST-01 is ready, implement using architecture.md patterns"
Dev → Reviewer: "PR #X ready for review, covers ST-01"
Reviewer → Dev: "LGTM" or "Blockers: [list]"
Dev → Tester: "ST-01 implementation done, writing tests now"
Tester → Reviewer: "Tests written, coverage at 82%"
Reviewer → Dev: "All clear, ready to merge"
Dev → Architect: "All PRs merged, ready for final sign-off"
Architect → PM: "vibex-dev-proposals complete"
```

### 6.2 Escalation Path

```
Dev is blocked → Reviewer
Reviewer conflict → Architect
Architect conflict → PM
```

### 6.3 Branch Naming Convention

```
fix/<story-id>-<short-description>   # Bug fixes
feat/<story-id>-<short-description>  # New features
refactor/<story-id>-<short-description> # Code restructuring
test/<story-id>-<short-description>  # Test additions
docs/<story-id>-<short-description>  # Documentation
```

### 6.4 Commit Message Convention

```
<type>(<scope>): <subject>

<body>

<footer>

Types: fix, feat, refactor, test, docs, chore
Scope: llm, db, auth, canvas, store, logger, flow, migration

Example:
fix(llm): bind thisLLMService before ReadableStream construction

ST-01: streaming response crashes because this.streamChat() is called
inside ReadableStream.start() where `this` is undefined. Fixed by
capturing `this` in a local variable before stream construction.
```

---

## 7. Definition of Done — Project Level

All of the following must be true before this project is considered complete:

### Code Quality
- [ ] All 27 stories implemented and merged
- [ ] Zero `as any` in source files (test mocks acceptable)
- [ ] Zero empty `catch {}` blocks
- [ ] Zero `console.log` in production (frontend strip verified)
- [ ] `pnpm typecheck` passes on both frontend and backend
- [ ] `pnpm lint` passes on both frontend and backend

### Testing
- [ ] Backend coverage ≥ 80%
- [ ] Frontend coverage ≥ 70%
- [ ] Canvas E2E tests covering 5 user flows
- [ ] All tests pass in GitHub Actions CI

### Security
- [ ] All 16+ routes protected by auth middleware
- [ ] Input validation on all user-facing endpoints
- [ ] MermaidRenderer sanitizes SVG output
- [ ] Logs contain no sensitive data

### Performance
- [ ] clarificationId index created and verified
- [ ] PrismaPoolManager used in all heavy DB operations
- [ ] D1 KV cache replaces in-memory Map
- [ ] Flow execution returns actual results (not null)

### Documentation
- [ ] Workers development guide in AGENTS.md
- [ ] All architectural decisions documented
- [ ] Migration files for database changes

### Deployment
- [ ] `wrangler deploy` succeeds without warnings
- [ ] All migrations applied to production D1
- [ ] New CI gates passing on main branch
