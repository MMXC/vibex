# Architect Proposals — vibex-proposals-20260407

**Date:** 2026-04-07
**Cycle:** 2026-W14
**Status:** Draft for Review

---

## ADR-001: Canvas Real-time API Protocol Selection

### Metadata

| Field | Value |
|-------|-------|
| **Status** | Proposed |
| **Deciders** | Architect, Dev Lead |
| **Context** | Canvas collaboration requires real-time sync between agent sessions and UI |

---

### Problem / Opportunity

72% of canvas API endpoints are missing. The canvas system needs to sync:
- **Shared state** (objects, layers, selections) across multiple clients
- **Agent events** (task start/progress/complete, errors)
- **Cursor presence** (real-time cursor positions)

Traditional REST polling is insufficient for real-time collaboration. We must choose the right protocol stack for D1 persistence + real-time delivery.

---

### Solution

**Hybrid approach: REST for commands + SSE for state push + WebSocket for cursor presence**

| Layer | Protocol | Rationale |
|-------|----------|-----------|
| Command API | REST (POST/PATCH) | Idempotent operations, natural for tools, easy to test |
| State Push | Server-Sent Events (SSE) | Simpler than WS, works over HTTP/2, auto-reconnect, good for server→client |
| Cursor/Presence | WebSocket | High-frequency, low-latency, bidirectional not needed but WS is standard choice |

**D1 Schema Design:**

```sql
-- Core canvas state
CREATE TABLE canvas_sessions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch()),
  metadata TEXT -- JSON blob for extensibility
);

-- Objects within a canvas
CREATE TABLE canvas_objects (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES canvas_sessions(id),
  type TEXT NOT NULL, -- 'rect' | 'text' | 'image' | 'group'
  position_x REAL NOT NULL,
  position_y REAL NOT NULL,
  width REAL,
  height REAL,
  z_index INTEGER DEFAULT 0,
  props TEXT NOT NULL, -- JSON: { color, fontSize, content, ... }
  created_by TEXT NOT NULL,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);

-- Version vector for CRDT-free optimistic locking
CREATE TABLE canvas_versions (
  session_id TEXT PRIMARY KEY REFERENCES canvas_sessions(id),
  version INTEGER DEFAULT 1,
  last_event_id TEXT
);

-- Presence / cursors (ephemeral, could be D1 or Redis)
CREATE TABLE canvas_cursors (
  session_id TEXT NOT NULL REFERENCES canvas_sessions(id),
  user_id TEXT NOT NULL,
  position_x REAL NOT NULL,
  position_y REAL NOT NULL,
  color TEXT,
  last_seen INTEGER DEFAULT (unixepoch()),
  PRIMARY KEY (session_id, user_id)
);
```

**API Surface:**

```
REST (commands):
  POST   /api/canvas/sessions              → create session
  GET    /api/canvas/sessions/:id          → get session + objects
  PATCH  /api/canvas/sessions/:id/objects/:oid → update object
  DELETE /api/canvas/sessions/:id/objects/:oid → delete object

SSE (state push):
  GET    /api/canvas/sessions/:id/stream    → SSE channel for state changes

WebSocket (presence):
  WS     /api/canvas/sessions/:id/presence  → cursor positions
```

**Versioning strategy:** All REST endpoints use `If-Match` / `ETag` with `canvas_versions.version`. Optimistic locking prevents conflicting writes.

---

### Impact

| Item | Estimate |
|------|----------|
| API schema + D1 migrations | 2d |
| REST endpoints (CRUD) | 2d |
| SSE event emitter | 1d |
| WebSocket presence layer | 1d |
| Client SDK (React hooks) | 1d |
| **Total** | **~7d (Phase 1-3)** |

---

### Priority

**P0** — Blocking all canvas collaboration features. Cannot build UI components without stable API contract.

---

### Verification Criteria

- [ ] All REST endpoints return correct HTTP status codes (200/201/404/409)
- [ ] SSE reconnects automatically after 3s network drop
- [ ] Two browser tabs see same canvas state within 500ms
- [ ] ETag mismatch returns 409 Conflict, client retries with fresh data
- [ ] D1 migrations run without data loss on existing schema

---

## ADR-002: Zustand Store Consolidation Architecture

### Metadata

| Field | Value |
|-------|-------|
| **Status** | Proposed |
| **Deciders** | Architect, Dev Lead |
| **Context** | 20 legacy stores + 5 new canvas stores have overlapping state. High coupling risk. |

---

### Problem / Opportunity

Current store landscape:
- **20 existing stores** — some share state (e.g., `userStore` + `authStore` both hold user profile)
- **5 new canvas stores** — overlap with existing stores for session, workspace, tool selection
- **No clear ownership** — components import from multiple stores for a single feature
- **Hydration mismatch risk** — SSR + client hydration with duplicate state

Result: **State fragmentation**. When canvas session updates, 3+ stores need manual sync. Bug surface is proportional to cross-store dependencies.

---

### Solution

**Unified store with feature slices — one source of truth per domain**

```
store/
├── index.ts              # Root store (combines all slices)
├── slices/
│   ├── auth.slice.ts     # user, token, permissions
│   ├── session.slice.ts  # active session, tabs, workspace
│   ├── canvas.slice.ts   # canvas objects, selection, tool, viewport
│   ├── ui.slice.ts       # sidebar, modals, theme, notifications
│   └── agent.slice.ts    # running agents, task queue, results
└── migrations/
    └── legacy-migration.ts  # Consolidate auth.user → auth.userId
```

**Key principles:**

1. **One store per domain, one domain per store** — no overlapping state
2. **Derived state via selectors** — no denormalization. Canvas object positions stay in `canvas.objects[]`, selection is a `selector` not a separate field
3. **Migration path** — wrap legacy stores with compatibility shims that dispatch to new slices during transition
4. **Strict TypeScript** — root store typed as `StateCreator<RootState>` with no `any`

```typescript
// Example: selection is a derived selector, not a separate field
const selectSelectedIds = (state: CanvasState) => state.selectedIds;
// NOT: state.selectedIds = [...] in a reducer

// Canvas stores never duplicate auth state — they reference sessionId
const selectCanvasOwner = (state: CanvasState) => {
  const session = sessionStore.getState().sessions[state.sessionId];
  return session?.createdBy;
};
```

**Migration strategy (2 phases):**

- **Phase 1 (Week 1):** Create new slices. Add compatibility shims to legacy stores that proxy writes to new slices. No changes to components yet.
- **Phase 2 (Week 2):** Update component imports from legacy stores → new slices. Remove shims. Delete legacy stores.

---

### Impact

| Item | Estimate |
|------|----------|
| Design new slice boundaries | 0.5d |
| Implement new slices | 1d |
| Write compatibility shims | 0.5d |
| Migrate components (1:1 import swap) | 1d |
| Remove legacy stores + shims | 0.5d |
| **Total** | **~3.5d** |

---

### Priority

**P0** — Zustand consolidation unblocks canvas-split-components refactor. Splitting 3757-line components without consolidated state is high-risk (state will scatter across split components).

---

### Verification Criteria

- [ ] `grep -r "legacyStore\|oldStore" src/` returns 0 matches after Phase 2
- [ ] No two stores have the same keys (verify with unit test)
- [ ] React DevTools shows ≤5 canvas-related store keys
- [ ] Canvas selection change triggers exactly 1 store update (verified via middleware log)
- [ ] SSR hydration works without duplicate state warnings

---

## ADR-003: Canvas Component Split Architecture

### Metadata

| Field | Value |
|-------|-------|
| **Status** | Proposed |
| **Deciders** | Architect, Dev Lead |
| **Context** | Three component trees totaling 3757 lines + CanvasPage. Too large for single maintainer. |

---

### Problem / Opportunity

Current structure is monolithic:
- Canvas page is one 3757-line file
- No clear boundary between canvas logic, rendering, and tool handling
- Adding a new tool requires editing the main file
- Testing is impossible at component level — only E2E

---

### Solution

**Hooks-first architecture with clean separation of concerns**

```
canvas/
├── components/
│   ├── CanvasPage.tsx           # Orchestrator — thin, delegates to hooks
│   ├── CanvasViewport.tsx       # Render loop — pure display
│   ├── CanvasToolbar.tsx        # Tool selection UI
│   ├── CanvasObject.tsx         # Polymorphic object renderer
│   └── panels/
│       ├── PropertiesPanel.tsx  # Object property editor
│       └── LayersPanel.tsx      # Z-order management
├── hooks/
│   ├── useCanvasEngine.ts       # Core engine: objects CRUD, selection, transforms
│   ├── useCanvasTool.ts         # Tool state machine (select/move/resize/draw)
│   ├── useCanvasViewport.ts     # Pan, zoom, viewport math
│   ├── useCanvasHistory.ts      # Undo/redo stack
│   ├── useCanvasCollaboration.ts # SSE subscription, presence
│   └── useCanvasPersistence.ts  # API sync, autosave
└── types/
    └── canvas.types.ts
```

**Hooks-first means:** Components are thin wrappers. All logic lives in hooks. This enables:
- **Unit testing hooks** without mounting components (Vitest + @testing-library/react-hooks)
- **Component testing** with mocked hooks
- **Refactoring** by changing hook internals without touching component tree

**Component-level responsibilities:**

| Component | Responsibility |
|-----------|---------------|
| CanvasPage | Read from Zustand slices, render children, handle page-level events |
| CanvasViewport | Receive `objects[]` + `viewport`, render via requestAnimationFrame |
| CanvasToolbar | Dispatch tool actions, show active tool state |
| CanvasObject | Polymorphic: renders rect/text/image based on `type` field |
| Panels | Read from store, dispatch form changes |

---

### Impact

| Item | Estimate |
|------|----------|
| Extract hooks from 3757-line tree | 2d |
| Build CanvasPage orchestrator | 0.5d |
| Write hook unit tests (≥80% coverage) | 1d |
| Write component integration tests | 0.5d |
| Migration + QA | 1d |
| **Total** | **~5d** |

---

### Priority

**P1** — Blocking the Canvas API client SDK and collaboration features. Currently unforkable (3757 lines = single point of failure). But can proceed after Zustand consolidation.

---

### Verification Criteria

- [ ] Largest component file ≤ 300 lines
- [ ] All hooks have ≥80% unit test coverage
- [ ] CanvasViewport renders same output before/after refactor (snapshot test)
- [ ] Tool switching works in < 16ms (no jank in RAF loop)
- [ ] `grep -r "useState\|useReducer" components/` finds ≤ 2 instances (rest must be hooks)

---

## ADR-004: Subagent Resilience Architecture

### Metadata

| Field | Value |
|-------|-------|
| **Status** | Proposed |
| **Deciders** | Architect, Dev Lead, DevOps |
| **Context** | `sessions_spawn` lacks resilience. Agent processes die mid-task. No recovery path. |

---

### Problem / Opportunity

Current `sessions_spawn` behavior:
- Agent starts → works → mid-way failure (OOM, segfault, upstream API timeout)
- **Result:** Work is lost. No checkpoint. WIP state is gone.
- **Impact:** Users lose progress. Retry means starting over.

Common failure modes:
1. Long tool execution (> 60s) → connection timeout
2. Memory exhaustion → OOM kill
3. Upstream API (tool server) returns 500 → crash
4. Context window overflow → truncation mid-task

---

### Solution

**Three-tier resilience: worktree isolation + periodic checkpointing + WIP commit**

```
Tier 1: Worktree Isolation (per session)
  → Each agent session gets an isolated git worktree
  → Worktree = safe sandbox: crashes don't corrupt main repo
  → Branch per session: sessions/canvas-api-001, sessions/canvas-api-002

Tier 2: Checkpoint Script (every 60s during execution)
  → Checkpoint state: git stash + JSON state file + artifact snapshot
  → Stored in: /var/checkpoints/<session_id>/<timestamp>/
  → Cost: ~50ms per checkpoint, negligible I/O

Tier 3: WIP Commit (on significant milestones)
  → git add -A && git commit -m "WIP: session <id> milestone <n>"
  → Pushes to remote branch: origin/sessions/<session_id>
  → Enables: resume from any milestone, cross-session sharing
```

**Checkpoint data structure:**

```json
{
  "sessionId": "canvas-api-001",
  "checkpointId": 7,
  "timestamp": 1743801600,
  "phase": "implementing-endpoints",
  "artifacts": {
    "lastFile": "src/canvas/objects.ts",
    "pendingChanges": ["src/canvas/sessions.ts"],
    "testResults": "✓ 12 passed, 2 failing"
  },
  "zombie": {
    "activePids": [12345],
    "openHandles": 3,
    "memoryMb": 412
  }
}
```

**Resume flow:**
```
sessions_resume --session canvas-api-001 --checkpoint 7
→ Restore worktree
→ Apply stashed changes
→ Restart from checkpoint state
→ Report: "Resuming from checkpoint 7/12, phase: implementing-endpoints"
```

**Recovery from zombie processes:**
- Checkpoint script includes `kill -0 $PID` for all active PIDs
- If PID is dead but session is "active" → mark as `zombie` status
- Zombie sessions can be resumed from last checkpoint

---

### Impact

| Item | Estimate |
|------|----------|
| Worktree manager (create/delete/cleanup) | 1d |
| Checkpoint script + storage layout | 1d |
| WIP commit automation | 0.5d |
| Resume flow + CLI | 0.5d |
| Zombie detection + recovery | 0.5d |
| **Total** | **~3.5d** |

---

### Priority

**P1** — No P0 because current system is "mostly works." But resilience gap is significant for production confidence.

---

### Verification Criteria

- [ ] Simulate crash mid-execution: resume recovers ≥ 90% of work
- [ ] Checkpoint completes in < 100ms (no performance impact on agent)
- [ ] Worktree cleanup removes all session branches within 24h
- [ ] Zombie detection marks dead sessions within 30s
- [ ] Resume from checkpoint restores identical file state (diff = empty)

---

## ADR-005: Testing Pyramid Architecture

### Metadata

| Field | Value |
|-------|-------|
| **Status** | Proposed |
| **Deciders** | Architect, QA Lead |
| **Context** | Need clear boundaries between unit / integration / E2E to avoid test brittleness and gaps. |

---

### Problem / Opportunity

Current testing is ad-hoc:
- Some unit tests (Jest), mostly absent
- No integration test layer between units and E2E
- E2E tests are brittle (depend on full app + network)
- **Coverage is unknown** — likely significant gaps in middle layers

---

### Solution

**Define three clear layers with distinct responsibilities:**

```
Layer 1: Unit Tests (Vitest)
  ├── Target: hooks, utilities, pure functions, Zustand slices
  ├── Scope: 1 module or hook in isolation
  ├── Mocking: deep mock (Jest mocks for external deps)
  ├── Speed: < 5ms per test
  └── Coverage gate: 80% minimum per hook/slice

Layer 2: Integration Tests (Vitest + MSW + testing-library)
  ├── Target: API routes, store slices, component groups
  ├── Scope: 1 feature flow (e.g., "create canvas session")
  ├── Mocking: MSW for HTTP, mock Zustand store
  ├── Speed: < 200ms per test
  └── Coverage: all API routes + store actions

Layer 3: E2E Tests (Playwright)
  ├── Target: critical user journeys
  ├── Scope: full app (dev server), real browser
  ├── Mocking: none (or minimal: real auth, real D1 via test DB)
  ├── Speed: < 30s per test suite
  └── Coverage: 5 critical paths only
```

**Critical user journeys (E2E):**
1. Create canvas session → add object → delete object
2. Agent spawns → executes task → completes
3. Real-time collaboration: two cursors see same state
4. Subagent resume: crash → resume → verify state
5. Canvas API: REST round-trip → SSE update → WebSocket presence

**Boundary rules:**
- **No unit test mocks store** — use real Zustand slices (they're fast enough)
- **No integration test goes to real network** — use MSW
- **No E2E tests test logic** — that's unit/integration's job
- **E2E = black box** — only test observable outcomes, not implementation

**Test file naming convention:**
```
*.test.ts      → unit
*.integration.test.ts → integration
*.e2e.test.ts  → E2E
```

---

### Impact

| Item | Estimate |
|------|----------|
| Set up MSW + testing-library | 0.5d |
| Write unit tests for canvas hooks (≥80%) | 1.5d |
| Write integration tests for API routes | 1d |
| Write 5 E2E critical path tests | 1d |
| CI pipeline integration (parallelize layers) | 0.5d |
| **Total** | **~4.5d** |

---

### Priority

**P2** — Foundation work. P0/P1 features can proceed in parallel; test pyramid can be built alongside.

---

### Verification Criteria

- [ ] `npm run test:unit` runs in < 30s, all pass
- [ ] `npm run test:integration` runs in < 60s, all pass
- [ ] `npm run test:e2e` runs in < 120s, all pass
- [ ] Canvas hooks have ≥ 80% line coverage (via Vitest coverage report)
- [ ] CI fails if any layer has failing tests
- [ ] No E2E tests use `page.waitForSelector` timeout > 5s (flaky detection)

---

## Summary

| # | ADR | Priority | Estimated Duration |
|---|-----|----------|-------------------|
| 001 | Canvas Real-time API Protocol (REST + SSE + WS) | **P0** | ~7d |
| 002 | Zustand Store Consolidation | **P0** | ~3.5d |
| 003 | Canvas Component Split (hooks-first) | **P1** | ~5d |
| 004 | Subagent Resilience (worktree + checkpoint + WIP commit) | **P1** | ~3.5d |
| 005 | Testing Pyramid (unit / integration / E2E) | **P2** | ~4.5d |

**Dependency graph:**
```
ADR-001 (Canvas API) ─────────────┐
                                   ├── ADR-003 (Canvas Split) ←─ ADR-002 (Zustand)
ADR-004 (Subagent Resilience) ─────┤
                                   └── ADR-005 (Testing Pyramid)
```

**Recommended execution order:** ADR-002 → ADR-001 → ADR-003 → ADR-004 → ADR-005
