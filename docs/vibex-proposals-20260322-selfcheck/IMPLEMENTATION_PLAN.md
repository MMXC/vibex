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

### Task 4.1: Add agent validation
**File**: `skills/team-tasks/scripts/task_manager.py`

```python
# In do_claim(), after finding the task:
assigned_agent = task.get('agent', '')
if assigned_agent and assigned_agent != agent:
    print(f"❌ Cannot claim: task assigned to '{assigned_agent}', you are '{agent}'")
    sys.exit(1)
```

### Task 4.2: Add --force flag
```python
def do_claim(project: str, stage: str, agent: str = None, force: bool = False):
    # ...
    if assigned_agent and assigned_agent != agent and not force:
        print(f"❌ Cannot claim: task assigned to '{assigned_agent}'")
        sys.exit(1)
    elif force:
        print(f"⚠️ Force claiming task assigned to '{assigned_agent}'")
```

### Task 4.3: Document claim rules
**File**: `docs/task-claim-rules.md`

```markdown
# Task Claim Rules

## Normal Agent
- Can only claim tasks where `agent` field matches your agent name
- Claim attempt for wrong agent → error message

## Coord Agent
- Can use `--force` to claim any task
- Coord is responsible for re-assignment

## Example
```bash
# Correct agent
python3 task_manager.py claim my-project design-architecture --agent architect
# ✅ Claimed: design-architecture

# Wrong agent
python3 task_manager.py claim my-project design-architecture --agent dev
# ❌ Cannot claim: task assigned to 'architect', you are 'dev'
```
```

### Task 4.4: Test
```bash
# Test wrong agent → error
python3 task_manager.py claim vibex-proposals-20260322 dev-epic3 --agent analyst
# Expected: ❌ Cannot claim: task assigned to 'dev'

# Test correct agent → success
python3 task_manager.py claim vibex-proposals-20260322 dev-epic3 --agent dev
# Expected: ✅ Claimed: dev-epic3

# Test force → success
python3 task_manager.py claim vibex-proposals-20260322 dev-epic3 --agent coord --force
# Expected: ⚠️ Force claiming... ✅
```

---

## Effort Summary

| Epic | Referenced | Effort |
|------|-----------|--------|
| Epic 1 | homepage-event-audit | ~4h (dev) |
| Epic 2 | homepage-event-audit | ~2h (dev) |
| Epic 3 | mvp-backend-analysis | ~0.5h (dev) |
| Epic 4 | This doc | ~1h (dev) |
