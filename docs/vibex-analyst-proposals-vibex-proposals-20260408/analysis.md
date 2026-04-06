# Requirements Analysis: Vibex Analyst Proposals 2026-04-08

**Project**: vibex-analyst-proposals-vibex-proposals-20260408
**Author**: Analyst
**Date**: 2026-04-08
**Reference**: proposals/20260407/ (analyst, dev, architect, pm, tester, reviewer)

---

## 1. Business Scenario Analysis

### Context
Vibex is a DDD modeling + prototype generation platform. The canvas is the primary workspace where users:
1. Input requirements → AI generates bounded contexts, flows, component trees
2. Edit/modify the generated trees
3. Create projects from tree data
4. Generate UI prototypes

### Current Critical Path
```
需求输入 → AI生成三树 → 用户编辑确认 → 创建项目 → 原型生成
         ↑                                        ↑
      Canvas API (P0 blocker)              Snapshot API (E4 blocker)
```

### Key Observations

| Area | Status | Issue |
|------|--------|-------|
| Canvas API (generate-contexts/flows/components) | Partially fixed | OPTIONS CORS fixed 2026-04-06 |
| Snapshot CRUD | Confusing state | Hono has create/list/get/restore; missing latest+delete |
| Changelog | Gap | 2026-04-06/07 work undocumented |
| Proposal lifecycle | Broken | 2026-04-06/07 proposals zero落地 |
| Zustand stores | Unresolved | Dual-store since 2026-04-07 |
| Subagent reliability | Unresolved | checkpoint proposal from 2026-04-05 still pending |

---

## 2. Technical Options

### Option A: Snapshot API — Audit & Complete (Recommended)

**Current State** (from git + code analysis):

| Frontend Endpoint | Backend Route | Status |
|-------------------|---------------|--------|
| `POST /api/canvas/snapshots` | Next.js `/app/api/canvas/snapshots/` | ✅ Implemented |
| `GET /api/canvas/snapshots` | Next.js `/app/api/canvas/snapshots/` | ✅ Implemented |
| `GET /api/v1/canvas/snapshots/:id` | Hono `/routes/v1/canvas/snapshots.ts` | ✅ Implemented |
| `POST /api/v1/canvas/snapshots/:id/restore` | Hono `/routes/v1/canvas/snapshots.ts` | ✅ Implemented |
| `GET /api/v1/canvas/snapshots/latest` | **MISSING** | ❌ Not in routes |
| `DELETE /api/v1/canvas/snapshots/:id` | **MISSING** | ❌ Not in routes |

**Problem**: Two backends (Next.js + Hono) with inconsistent schemas. Frontend split-calls create/list → Next.js, get/restore → Hono.

**Solution**: 
1. Audit both backends, document schema differences
2. Complete Hono implementation (add latest + delete)
3. Choose one source of truth (recommend Hono for v1 API consistency)
4. Migrate Next.js → Hono for create/list

**Pros**: Single source of truth, consistent API
**Cons**: Migration effort, need to verify D1 schema compatibility

### Option B: Snapshot API — Stabilize Dual-Backend

**Current State**: Keep both Next.js and Hono, just complete missing endpoints.

**Solution**:
1. Add `latest` endpoint to Hono (`routes/v1/canvas/snapshots.ts`)
2. Add `delete` endpoint to Hono
3. Document the split: Next.js for create/list, Hono for get/restore/latest/delete
4. Add integration tests for both backends

**Pros**: Lower migration risk, can ship faster
**Cons**: Two backends = maintenance overhead, schema drift risk

---

## 3. Feasibility Assessment

### Proposal Feasibility Matrix

| Proposal | Feasibility | Risk | Effort | Notes |
|----------|-------------|------|--------|-------|
| A-P0-1 (Proposal tracking) | ✅ High | Low | 1h | Metadata change, no code |
| A-P0-2 (Snapshot API) | ⚠️ Medium | Medium | 5h | Need schema audit first |
| A-P1-1 (Changelog fix) | ✅ High | Low | 0.5h | Documentation only |
| A-P1-2 (Zustand audit) | ✅ High | Low | 3h | Phase 1 is analysis only |
| A-P2-1 (Subagent checkpoint) | ⚠️ Medium | Medium | 4h | Coord layer changes |

### Snapshot API — Specific Feasibility

**Option A (Recommended)** feasibility breakdown:
```
Phase 1 (2h): Schema audit
  - Compare D1 schema vs Next.js schema
  - Compare Hono CreateSnapshotSchema vs Next.js body format
  - Document mapping rules

Phase 2 (2h): Complete Hono implementation
  - GET /snapshots/latest
  - DELETE /snapshots/:id
  - Integration tests

Phase 3 (1h): Migrate create/list to Hono
  - Update frontend API_CONFIG
  - Verify with gstack
  - Deprecate Next.js route
```

**Known constraints**:
- D1 raw SQL (not Prisma ORM) — need to verify CanvasSnapshot table exists
- Cloudflare Workers environment — no Node.js APIs
- CORS OPTIONS must be handled at gateway layer (learned from canvas-cors learnings)

---

## 4. Preliminary Risk Identification

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Snapshot schema mismatch between backends | High | High | Phase 1 audit before implementation |
| Proposal tracking table becomes stale | Medium | Medium | Coord must actively maintain |
| Subagent checkpoint conflicts with existing disown logic | Medium | High | Test in isolation first |
| Zustand audit Phase 1 reveals massive duplication | Low | Medium | Only analysis, no destructive changes |
| Changelog gap causes merge conflicts | Low | Low | Single commit with all missing entries |

---

## 5. Acceptance Criteria (Testable)

### A-P0-1: Proposal Tracking

- [ ] `docs/proposals/TRACKING.md` exists
- [ ] Contains all proposals from 2026-04-06 and 2026-04-07 with status field
- [ ] At least 1 P0 proposal from this round is assigned (assignee ≠ empty) within 48h
- [ ] `grep -c "status:" docs/proposals/TRACKING.md` ≥ number of proposals

### A-P0-2: Snapshot API

- [ ] `curl -X GET https://api.vibex.top/api/v1/canvas/snapshots/latest?projectId=test` returns JSON (200 or 404, not 500)
- [ ] `curl -X DELETE https://api.vibex.top/api/v1/canvas/snapshots/snapshot-id` returns 200 or 404 (not 500)
- [ ] Frontend `canvasApi.createSnapshot()` → Hono backend (single source of truth)
- [ ] `pnpm test --testPathPattern="snapshots"` passes
- [ ] `curl -X OPTIONS -I https://api.vibex.top/api/v1/canvas/snapshots` returns 204 (CORS preflight)

### A-P1-1: Changelog Fix

- [ ] `grep "2026-04-06\|2026-04-07" CHANGELOG.md` returns ≥ 5 entries
- [ ] Each entry contains commit hash
- [ ] `CLAUDE.md` contains changelog update rule

### A-P1-2: Zustand Audit

- [ ] `stores/audit.md` exists with state overlap matrix
- [ ] `canvas/stores/alias.ts` compiles without TypeScript errors (`pnpm tsc --noEmit`)
- [ ] `pnpm build` succeeds after alias.ts creation

### A-P2-1: Subagent Checkpoint

- [ ] `/root/.openclaw/scripts/checkpoint.sh` exists and is executable
- [ ] Running checkpoint with `task_id=test123` creates `/root/.openclaw/checkpoints/test123.json`
- [ ] `cat /root/.openclaw/checkpoints/test123.json | jq -r '.task_id'` equals `test123`

---

## 6. Historical Learnings Applied

From `docs/learnings/canvas-cors-preflight-500.md`:
- CORS OPTIONS must be handled at gateway layer, not at individual route level
- Any new snapshot endpoint must include OPTIONS handler at gateway registration

From `docs/learnings/canvas-testing-strategy.md`:
- Vitest vs Jest configuration isolation is critical (testPathIgnorePatterns)
- Mock store in tests must use `mockReturnValue` not hardcoded objects
- Initial test coverage threshold should be 80-90% of current baseline

From `docs/learnings/canvas-api-completion.md`:
- Route order matters: GET /latest must come before GET /:id
- Snapshot testing (`expect().toMatchSnapshot()`) is efficient for structured JSON APIs

---

## 7. Open Questions

1. **Snapshot schema source of truth**: Should Hono or Next.js be the canonical backend for Canvas snapshots?
2. **Proposal tracking owner**: Who owns `docs/proposals/TRACKING.md`? Coord or Analyst?
3. **Subagent checkpoint scope**: Should checkpoint be a team-tools change or a per-project convention?
4. **Changelog enforcement**: Is there a GitHub Actions hook that can enforce changelog updates on PR merge?
