# Implementation Plan: Analyst Self-Check Improvement — 2026-03-23

**Project**: `vibex-proposals-20260322-selfcheck`

---

## Epic 1: ActionBar Bindings
→ See: `docs/homepage-event-audit/IMPLEMENTATION_PLAN.md`

## Epic 2: useHomeGeneration Stub Replacement ✅ DONE (2026-03-23)
**Files**: `useHomeGeneration.ts`, `useHomeGeneration.test.ts`

Implemented:
- Wire `dddApi.generateBoundedContext` (replaces stub in `generateContexts`)
- Wire `projectApi.createProject` (replaces stub in `createProject`)
- Fix import path: `BoundedContextResponse` from `@/types/api` (not `@/types/api/api-generated`)
- Add default mock resolved values in `beforeEach` so tests without explicit mock setup still pass
- 22/22 tests pass ✅

## Epic 3: API Verification Script ✅ DONE (2026-03-23)
**File**: `scripts/verify-api-endpoints.sh`

Created comprehensive API endpoint verification script with:
- Health checks for /api/v1/* endpoints
- DDD API verification (/ddd/bounded-context, /ddd/domain-model, /ddd/business-flow)
- Homepage API check (/api/v1/homepage)
- Colored output, exit codes for CI integration

## Epic 4: Task Manager Agent Validation

### Task 4.1: Add agent validation ✅ DONE
**File**: `skills/team-tasks/scripts/task_manager.py`

```python
# In cmd_claim(), after finding the task:
assigned_agent = stage.get("agent", "")
claiming_agent = getattr(args, "agent", None) or stage_id.split("-")[0]
if assigned_agent and assigned_agent != claiming_agent:
    if getattr(args, "force", False):
        print(f"⚠️ Force claiming '{stage_id}' ...")
    else:
        print(f"❌ Cannot claim '{stage_id}': task assigned to '{assigned_agent}', you are '{claiming_agent}'")
        sys.exit(1)
```

### Task 4.2: Add --force flag ✅ DONE
```python
p.add_argument("--force", "-f", action="store_true", help="Force claim even if agent mismatch (coord only)")
```

### Task 4.3: Document claim rules ✅ DONE
**File**: `docs/task-claim-rules.md` — covers normal agent rules, coord override, usage examples, backwards compatibility.

### Task 4.4: Test ✅ DONE
- Wrong agent → `❌ Cannot claim 'test-pending': task assigned to 'dev', you are 'analyst'` ✅
- Correct agent → `✅ Claimed: test-pending` ✅
- Force flag → `⚠️ Force claiming... ✅ Claimed: test-pending` ✅

---

## Effort Summary

| Epic | Referenced | Effort | Status |
|------|-----------|--------|--------|
| Epic 1 | homepage-event-audit | ~4h (dev) | ✅ Done |
| Epic 2 | homepage-event-audit | ~2h (dev) | ✅ Done |
| Epic 3 | mvp-backend-analysis | ~0.5h (dev) | ✅ Done |
| Epic 4 | This doc | ~1h (dev) | ✅ Done |

**All Epics Complete** ✅
