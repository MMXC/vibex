# Architecture: Analyst Self-Check Improvement — 2026-03-23

**Project**: `vibex-proposals-20260322-selfcheck`  
**Architect**: architect  
**Date**: 2026-03-22  
**Status**: design-architecture

---

## 1. Context

This self-check proposal captures 4 improvement areas from analyst's daily review. Most overlap with architect's own work today — this doc serves as a **cross-reference** and adds the missing Epic 4 (Task Manager validation).

### Cross-Reference: Already Designed

| Epic | Already Covered By | Status |
|------|-------------------|--------|
| Epic 1: ActionBar bindings | `homepage-event-audit/architecture.md` | ✅ Designed |
| Epic 2: useHomeGeneration stubs | `homepage-event-audit/architecture.md` | ✅ Designed |
| Epic 3: API verification script | `mvp-backend-analysis/architecture.md` (§5.2 `verify-backend-apis.sh`) | ✅ Designed |
| Epic 4: Task Manager validation | **New** | 📋 This doc |

**Decision**: Epic 1-3 are already architecturally designed. This doc focuses on Epic 4 and provides a unified implementation reference.

---

## 2. Architecture: Epic 4 — Task Manager Agent Field Validation

### 2.1 Current Problem

Task `vibex-proposals-20260322/dev-epic3-knowledgebase` was incorrectly assigned to `analyst` (should be `dev`). Analyst re-marked it done without actual dev involvement. Root cause: `task_manager.py claim` does not validate agent field against the requesting agent.

### 2.2 Solution: Agent Field Validation

**Modified `task_manager.py claim` logic:**

```python
# skills/team-tasks/scripts/task_manager.py

def do_claim(project: str, stage: str, agent: str = None):
    tasks = load_tasks(project)
    task = find_task(tasks, stage)
    
    if task is None:
        print(f"Task '{stage}' not found in project '{project}'")
        return
    
    # NEW: Validate agent field matches requesting agent
    assigned_agent = task.get('agent', '')
    if assigned_agent and assigned_agent != agent:
        print(f"❌ Cannot claim: task assigned to '{assigned_agent}', you are '{agent}'")
        print(f"💡 Use --force to override (coord only)")
        sys.exit(1)
    
    task['status'] = 'in-progress'
    save_tasks(project, tasks)
    print(f"✅ Claimed: {stage}")
```

### 2.3 Optional: Force Claim for Coord

```python
def do_claim(project: str, stage: str, agent: str = None, force: bool = False):
    # ...
    if assigned_agent and assigned_agent != agent and not force:
        print(f"❌ Cannot claim: task assigned to '{assigned_agent}'")
        sys.exit(1)
```

### 2.4 Implementation Plan (Epic 4)

| Task | Description | Agent |
|------|-------------|-------|
| S4.1 | Add agent validation to `task_manager.py claim` | dev |
| S4.2 | Add `--force` flag for coord override | dev |
| S4.3 | Write `docs/task-claim-rules.md` | dev |
| S4.4 | Test: claim wrong agent → error; correct agent → success | tester |

---

## 3. Epic 1-3 Implementation Reference

### Epic 1: ActionBar Bindings
→ **See**: `docs/homepage-event-audit/architecture.md` §3 (Implementation Phases)

### Epic 2: useHomeGeneration Stubs
→ **See**: `docs/homepage-event-audit/architecture.md` §3.1 (Data Flow Fix)

### Epic 3: API Verification Script
→ **See**: `docs/mvp-backend-analysis/architecture.md` §5.2 (`verify-backend-apis.sh`)

---

## 4. Unified Implementation Plan

| Epic | Key Action | Referenced Design | Effort |
|------|-----------|-------------------|--------|
| Epic 1 | HomePage.tsx: wire 14 stub callbacks | `homepage-event-audit` | ~4h |
| Epic 2 | useHomePage.ts: replace stubs with API calls | `homepage-event-audit` | ~2h |
| Epic 3 | `scripts/verify-api-endpoints.sh` | `mvp-backend-analysis` | ~0.5h |
| Epic 4 | `task_manager.py` agent validation | **This doc** | ~1h |

**Note**: Epic 1-3 were already architecturally designed today. Epic 4 is the new addition from this self-check.

---

## 5. Verification Checklist

- [ ] Epic 1: All 14 ActionBar/Navbar/AIPanel stubs replaced (from `homepage-event-audit`)
- [ ] Epic 2: `generateContexts` calls real API (from `homepage-event-audit`)
- [ ] Epic 3: `verify-api-endpoints.sh` runs and reports (from `mvp-backend-analysis`)
- [ ] Epic 4: `task_manager.py claim` with wrong agent → error message
- [ ] Epic 4: `task_manager.py claim --force` works for coord
- [ ] Epic 4: `task-claim-rules.md` documents the rules
