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

### Task 2.1: Prisma Schema Extension (PENDING)
**File**: `prisma/schema.prisma`
**Status**: PENDING

Need to add:
```prisma
model StepState {
  id          String   @id @default(cuid())
  projectId   String   @unique
  currentStep Int
  version     Int      @default(1)
  step1Data   String?  // JSON
  step2Data   String?  // JSON
  step3Data   String?  // JSON
  lastModifiedBy String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model ChangeLog {
  id        String   @id @default(cuid())
  projectId String
  version   Int
  source    String   // user|ai|system|rollback
  action    String   // create|update|delete|rollback|merge
  field     String
  before    String?  // JSON
  after     String?  // JSON
  userId    String?
  createdAt DateTime @default(now())
  
  @@index([projectId, version])
}
```

### Task 2.2: D1 Migration (PENDING)
**File**: `prisma/migrations/003_step_state_tables.sql`
**Status**: PENDING

### Task 2.3: Extend Project Model (PENDING)
**File**: `prisma/schema.prisma`

Add to Project model:
```prisma
status        String   @default("draft")  // draft|active|converted|archived
version       Int      @default(1)
isTemplate    Boolean  @default(false)
parentDraftId String?
```

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
