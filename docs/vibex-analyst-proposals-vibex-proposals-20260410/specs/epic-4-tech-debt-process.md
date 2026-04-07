# Spec: Epic 4 — Technical Debt & Process Improvements

**Epic ID**: E-A4
**Epic Name**: Technical Debt & Process Improvements
**Parent**: vibex-analyst-proposals-vibex-proposals-20260410
**Stories**: S4.1, S4.2
**Total Estimated Hours**: 4h
**Priority**: P2 (Sprint Day 2, afternoon)

---

## Story S4.1: ComponentRegistry HMR Support

**ID**: S4.1
**Title**: Hot Module Replacement for Canvas Component Catalog
**Proposal**: A-P2-1
**Estimated Hours**: 3h
**Assignee**: Dev

### Problem Statement

`@json-render/core` and `@json-render/react` are integrated (from Epic E1), and `vibexCanvasCatalog` is the registry of available components. However, adding a new component to the catalog requires a full Dev Server restart because the catalog is not HMR-aware. This degrades the developer experience during component iteration.

### Technical Specification

#### Current State (HMR Incompatible)

```typescript
// JsonRenderPreview.tsx
import { vibexCanvasCatalog } from '@/catalog/vibex';

// vibexCanvasCatalog is a static object — changes require restart
const catalog = vibexCanvasCatalog;
```

#### Target State (HMR Compatible)

```typescript
// JsonRenderPreview.tsx — dynamic import with HMR support
import { createComponentRegistry } from '@json-render/core';

// Create a mutable registry that can accept hot updates
const catalog = createComponentRegistry(vibexCanvasCatalog);

// HMR: When vibexCanvasCatalog is updated, notify the registry
if (module.hot) {
  module.hot.accept('@/catalog/vibex', () => {
    const updatedCatalog = require('@/catalog/vibex').vibexCanvasCatalog;
    catalog.sync(updatedCatalog); // Update registry without unmount
  });
}
```

#### ComponentRegistry API Extension

```typescript
interface ComponentRegistry {
  register(component: ComponentDefinition): void;
  get(name: string): ComponentDefinition | undefined;
  list(): ComponentDefinition[];
  sync(components: ComponentDefinition[]): void; // NEW: bulk sync for HMR
}
```

#### Registration Flow

```
Developer adds component to vibexCanvasCatalog
    ↓
Vite HMR detects change in @/catalog/vibex
    ↓
module.hot.accept callback fires
    ↓
catalog.sync(updatedComponents)
    ↓
JsonRenderPreview re-renders with new component
    ↓
No server restart needed ✓
```

#### Documentation

Add `docs/developer/COMPONENT_REGISTRATION.md`:
```markdown
# Registering a New Canvas Component

1. Add component definition to `src/catalog/vibex.ts`
2. Component appears in JsonRenderPreview immediately (HMR)
3. No restart required

## Component Definition Schema

```typescript
{
  name: string;        // Unique identifier, e.g., "BoundedContext"
  label: string;      // Display name in UI
  schema: Schema;     // JSON Schema for properties
  renderer: string;   // React component name
}
```
```

#### Acceptance Criteria

```
Given: a developer adds a new component to vibexCanvasCatalog
When:  the file is saved
Then:  JsonRenderPreview reflects the new component within 1 second
  AND: no Dev Server restart occurs
  AND: existing components remain functional

Given: JsonRenderPreview is rendering with vibexCanvasCatalog
When:  a new component is added to the catalog
Then:  HMR updates the preview without full remount
  AND: local state is preserved

Given: a new developer reads COMPONENT_REGISTRATION.md
When:  they want to add a component
Then:  the documentation provides clear steps and schema reference
```

### Implementation Notes

- Use `createComponentRegistry` from `@json-render/core` if available; otherwise create a thin wrapper
- Test HMR in development mode: add a component while JsonRenderPreview is open, verify no flicker
- Ensure SSR compatibility: `module.hot` only in browser context

---

## Story S4.2: Reviewer Task Deduplication

**ID**: S4.2
**Title**: Prevent Duplicate Reviewer Subagent Assignment
**Proposal**: A-P2-2
**Estimated Hours**: 1h
**Assignee**: Dev

### Problem Statement

The same PR can be assigned to multiple reviewer subagents simultaneously, causing duplicate reviews, wasted compute, and conflicting comments. The Coord heartbeat should reject duplicate PR review assignments.

### Technical Specification

#### Current Behavior (Broken)

```
PR #42 opened
  ↓
Reviewer-A picks up review task for PR #42 → status=pending
  ↓
Reviewer-B picks up review task for PR #42 → status=pending (DUPLICATE!)
  ↓
Both reviewers work simultaneously → wasted compute + conflicting comments
```

#### Target Behavior (Fixed)

```
PR #42 opened
  ↓
Reviewer-A picks up review task for PR #42 → status=pending
  ↓
Coord heartbeat scans pending review tasks
  ↓
Reviewer-B tries to pick up PR #42
  ↓
Coord rejects: "PR #42 already has a pending review task"
  ↓
Reviewer-B skips or picks next available task
```

#### Implementation in team-tasks Coord Logic

```python
# In task_manager.py or a new dedup function
def get_pending_review_tasks():
    """Get all pending review tasks, deduplicated by PR ID."""
    all_tasks = load_tasks()
    seen_pr_ids = set()
    unique_tasks = []
    
    for task in all_tasks:
        if task['type'] == 'review' and task['status'] == 'pending':
            pr_id = extract_pr_id(task)  # e.g., from task description
            
            if pr_id in seen_pr_ids:
                # Log warning, reject assignment
                logger.warning(f"Duplicate review task for PR {pr_id}, skipping")
                continue
            
            seen_pr_ids.add(pr_id)
            unique_tasks.append(task)
    
    return unique_tasks

def can_assign_review_task(pr_id: str) -> bool:
    """Check if PR already has a pending review task."""
    pending_reviews = get_pending_review_tasks()
    return pr_id not in {extract_pr_id(t) for t in pending_reviews}
```

#### Acceptance Criteria

```
Given: PR #42 has one pending review task assigned to Reviewer-A
When:  Reviewer-B attempts to pick up a review task for PR #42
Then:  the assignment is rejected
  AND: a warning is logged: "Duplicate review task for PR #42"
  AND: Reviewer-B picks the next available task instead

Given: Coord heartbeat runs a full scan
When:  it finds duplicate PR review tasks
Then:  it logs each duplicate with warning level
  AND: it does NOT auto-resolve (human reviews decision)

Given: no pending review tasks exist
When:  a reviewer picks up a new task
Then:  no deduplication check is triggered
  AND: the task is assigned normally
```

### Implementation Notes

- Extract PR ID from task description using regex: `pr[#:](\d+)` or parse GitHub URL
- The dedup check should be in `task_manager.py` `assign_task()` function
- Add a `--dedup` flag to `list` command to show duplicate warnings
- No automatic task cancellation — just prevent new assignments

---

## Epic 4 DoD Checklist

- [ ] S4.1: New component added to vibexCanvasCatalog appears in JsonRenderPreview without restart
- [ ] S4.1: `catalog.sync()` method implemented and tested
- [ ] S4.1: `docs/developer/COMPONENT_REGISTRATION.md` created with schema docs
- [ ] S4.1: HMR tested manually: add component, verify no restart needed
- [ ] S4.2: Same PR ID does not appear in multiple `status=pending` review tasks
- [ ] S4.2: Coord heartbeat logs warning for duplicate PR reviews
- [ ] S4.2: `can_assign_review_task()` returns `false` for duplicate PR
- [ ] All 2 proposals updated in TRACKING.md via `proposal_tracker.py update <id> done`
