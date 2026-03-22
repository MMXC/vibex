# Implementation Plan: Analyst Self-Check Improvement — 2026-03-23

**Project**: `vibex-proposals-20260322-selfcheck`

---

## Epic 1: ActionBar Bindings
→ See: `docs/homepage-event-audit/IMPLEMENTATION_PLAN.md`

## Epic 2: useHomeGeneration Stub Replacement
→ See: `docs/homepage-event-audit/IMPLEMENTATION_PLAN.md`

## Epic 3: API Verification Script
→ See: `docs/mvp-backend-analysis/IMPLEMENTATION_PLAN.md`

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

| Epic | Referenced | Effort |
|------|-----------|--------|
| Epic 1 | homepage-event-audit | ~4h (dev) |
| Epic 2 | homepage-event-audit | ~2h (dev) |
| Epic 3 | mvp-backend-analysis | ~0.5h (dev) |
| Epic 4 | This doc | ~1h (dev) |
