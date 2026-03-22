# Implementation Plan: Vibex Simplified Flow — Backend API

**Project**: `vibex-simplified-flow` (Backend)
**Agent**: dev
**Workdir**: `/root/.openclaw/vibex/vibex-backend`
**Date**: 2026-03-23

---

## Epic 1: Infrastructure — Core Types & APIs

### Task 1.1: Shared Type Definitions ✅ (2026-03-23)
**Files**: `src/types/simplified-flow.ts`
**Status**: COMPLETE

Types for the simplified 3-step flow:
- `BusinessDomain`, `Feature`, `DomainRelationship`
- `FlowNode`, `FlowEdge`, `FlowData`
- `UINode`, `UINodeAnnotation`
- `Step1Data`, `Step2Data`, `Step3Data`, `StepState`
- `ChangeEntry`, `ProjectSnapshot`, `SnapshotMeta`
- `SaveStepStateRequest/Response`

### Task 1.2: Step State API (Autosave) ✅ (2026-03-23)
**File**: `src/routes/step-state.ts`
**Status**: COMPLETE

```typescript
POST /api/step-state    // Save step state with optimistic locking
GET /api/step-state     // Get step state + history
DELETE /api/step-state  // Clear step state
```

Features:
- Optimistic locking (version conflict detection)
- Change history tracking
- In-memory store (prod: D1/SQLite)

### Task 1.3: Project Snapshot API ✅ (2026-03-23)
**File**: `src/routes/project-snapshot.ts` + `src/routes/projects.ts`
**Status**: COMPLETE

```typescript
GET /api/projects?id=&include=snapshot  // Complete project snapshot
```

Returns: project, stepState, domains, flow, uiNodes, history, snapshotMeta

### Task 1.4: Route Registration ✅ (2026-03-23)
**File**: `src/index.ts`
**Status**: COMPLETE

Registered routes:
- `/api/business-domain` → business-domain.ts
- `/api/flow` → flow.ts
- `/api/step-state` → step-state.ts

---

## Epic 2: DataStructure — Database Schema

### Task 2.1: Prisma Schema Extension ✅ (2026-03-23)
**File**: `prisma/schema.prisma`
**Commit**: `pending`
**Status**: COMPLETE

Added models:
- `StepState` - step state with JSON data for each step
- `ChangeLog` - change history with versioning
- `BusinessDomain` - domain storage with features/relationships
- `UINode` - UI node tree storage

Extended Project model:
- `status` (draft|active|converted|archived)
- `version` (optimistic locking)
- `isTemplate`
- `parentDraftId`

Relations: Project → StepState (1:1), ChangeLog (1:N), BusinessDomain (1:N), UINode (1:N)

### Task 2.2: D1 Migration ✅ (2026-03-23)
**File**: `prisma/migrations/003_step_state_tables.sql`
**Status**: COMPLETE

SQLite D1-compatible migration with:
- StepState table with unique projectId
- ChangeLog table with composite index
- BusinessDomain table with projectId index
- UINode table with projectId index
- Foreign key constraints with CASCADE delete

### Task 2.3: Extend Project Model ✅ (2026-03-23)
**File**: `prisma/schema.prisma`
**Status**: COMPLETE

Integrated with Task 2.1.

---

## Epic 4: FlowAPI — D1 Persistence

### Task 4.1: Flow GET/PUT DB Persistence ✅ (2026-03-23)
**File**: `src/routes/flow.ts`
**Status**: COMPLETE
**Commit**: `f9639fe1`

Replaced TODO placeholders with real D1/SQLite persistence:
- **GET /api/flow**: Query `FlowData` table by `flowId` (id) or `projectId`; parse nodes/edges from JSON; graceful 503 when D1 unavailable
- **PUT /api/flow**: Upsert `FlowData` row — UPDATE if exists, INSERT with projectId if new; update nodes/edges as JSON; update updatedAt timestamp
- **Added imports**: `queryDB`, `queryOne`, `executeDB` from `@/lib/db`
- Build: ✅ | Tests: 436/436 passed

---

## Epic 5: D1 Persistence — StepState API (Autosave Core)

### Task 5.1: StepState D1 Persistence ✅ (2026-03-23)
**File**: `src/routes/step-state.ts`
**Status**: COMPLETE
**Commit**: `f5f46893`

Replaced in-memory `stateStore` Map with real D1/SQLite persistence:
- **POST /api/step-state**: INSERT new StepState row or UPDATE existing; optimistic locking (409 on version conflict); INSERT ChangeLog entry
- **GET /api/step-state**: Query StepState row, parse JSON columns, return last 50 ChangeLog entries
- **DELETE /api/step-state**: DELETE from StepState + related ChangeLog entries
- **Fallback**: In-memory store when D1 unavailable (dev mode)
- **ChangeLog**: Records step field changes with before/after JSON snapshots
- Build: ✅ | Tests: 436/436 passed

---

## API Endpoints Summary

| Method | Path | Description | Status |
|--------|------|-------------|--------|
| POST | `/api/business-domain/generate` | SSE streaming domain generation | ✅ DONE |
| GET | `/api/business-domain` | List domains | ✅ DONE |
| POST | `/api/business-domain/create` | Create domain | ✅ DONE |
| PUT | `/api/business-domain` | Update domain | ✅ DONE |
| DELETE | `/api/business-domain` | Delete domain | ✅ DONE |
| POST | `/api/flow/generate` | SSE streaming flow generation | ✅ DONE |
| GET | `/api/flow` | Get flow | ✅ DONE |
| PUT | `/api/flow` | Update flow | ✅ DONE |
| GET | `/api/projects?id=&include=snapshot` | Project snapshot | ✅ DONE |
| POST | `/api/step-state` | Autosave step state | ✅ DONE |
| GET | `/api/step-state` | Get step state | ✅ DONE |
| DELETE | `/api/step-state` | Clear step state | ✅ DONE |

---

## Verification

```bash
# Backend build
cd vibex-backend && pnpm run build

# Backend tests
cd vibex-backend && pnpm test

# Frontend build
cd vibex-fronted && pnpm run build
```

---

## Dependencies

- Frontend: `simplifiedFlowStore.ts` (Phase 1 ✅)
- Frontend: Step 1-3 pages + components (Phase 3-4, PENDING)
