# Spec: Epic 3 — Store Improvements & CLI

**Epic ID**: E-A3
**Epic Name**: Store Improvements & CLI Tooling
**Parent**: vibex-analyst-proposals-vibex-proposals-20260410
**Stories**: S3.1, S3.2
**Total Estimated Hours**: 2h
**Priority**: P1 (Sprint Day 2, morning)

---

## Story S3.1: componentStore Batch Methods

**ID**: S3.1
**Title**: Bulk Operations for componentStore
**Proposal**: A-P1-3
**Estimated Hours**: 1h
**Assignee**: Dev

### Problem Statement

`componentStore.addComponent()` only accepts a single component. Bulk importing 100+ components requires 100+ individual calls, causing severe performance degradation and UI lag during project imports.

### Technical Specification

#### Current API

```typescript
// Only single-item operations exist
componentStore.addComponent(component: Component): void;
componentStore.removeComponent(id: string): void;
```

#### Target API

```typescript
// Single-item operations (existing)
componentStore.addComponent(component: Component): void;
componentStore.removeComponent(id: string): void;

// NEW: batch operations
componentStore.addComponents(components: Component[]): void;
componentStore.removeComponents(ids: string[]): void;
componentStore.updateComponents(updates: Array<{ id: string; changes: Partial<Component> }>): void;
```

#### Implementation Strategy

For `addComponents`:
```typescript
addComponents(components: Component[]): void {
  if (components.length === 0) return;
  
  // Batch into transaction if store supports it
  this.components = new Map([
    ...this.components,
    ...components.map(c => [c.id, c])
  ]);
  
  // Single notification for entire batch (not N notifications)
  this.notify();
}
```

#### Performance Requirement

| Operation | Input Size | Max Duration |
|-----------|-----------|---------------|
| addComponents | 100 components | < 100ms |
| removeComponents | 100 IDs | < 50ms |

#### Acceptance Criteria

```
Given: 100 components are added via addComponents([])
When:  the operation completes
Then:  all 100 components are stored
  AND: total execution time < 100ms
  AND: only ONE notification is emitted (not 100)

Given: componentStore has 3 components [c1, c2, c3]
When:  removeComponents(['c1', 'c2']) is called
Then:  c1 and c2 are removed
  AND: c3 remains
  AND: execution time < 50ms

Given: addComponents receives empty array []
When:  the method is called
Then:  no error thrown
  AND: existing components unchanged
  AND: no notification emitted
```

### Implementation Notes

- Batch operations should be atomic — all succeed or all fail
- Single notification after batch (not per-item) to prevent React re-render storm
- Add performance benchmark test in `tests/unit/componentStore.bench.ts` (optional)

---

## Story S3.2: proposal-tracker update Subcommand

**ID**: S3.2
**Title**: Close the Proposal Lifecycle Loop
**Proposal**: A-P1-4
**Estimated Hours**: 1h
**Assignee**: Dev

### Problem Statement

`scripts/proposal-tracker.py` (from Epic E6) was created but lacks an `update` subcommand. TRACKING.md is still manually maintained, and the CLI is unused. The proposal tracking system is broken at the update step.

### Technical Specification

#### Command Interface

```bash
# Usage
python3 scripts/proposal_tracker.py update <proposal_id> <status>

# Valid statuses: proposed, in-progress, review, done, failed, blocked

# Examples
python3 scripts/proposal_tracker.py update A-P0-1 done
python3 scripts/proposal_tracker.py update A-P0-2 in-progress
python3 scripts/proposal_tracker.py update A-P0-3 blocked --reason "Waiting for API spec"
```

#### TRACKING.md Format (assumed)

```markdown
| ID | Priority | Status | Date | Owner |
|----|----------|--------|------|-------|
| A-P0-1 | P0 | done | 2026-04-10 | Dev |
```

#### Implementation

```python
# scripts/proposal_tracker.py — add update subcommand

def update_proposal(proposal_id: str, status: str, reason: str = None):
    """Update proposal status in TRACKING.md"""
    
    valid_statuses = ['proposed', 'in-progress', 'review', 'done', 'failed', 'blocked']
    if status not in valid_statuses:
        raise ValueError(f"Invalid status. Must be one of: {valid_statuses}")
    
    # Parse TRACKING.md
    # Find row with proposal_id
    # Update Status column
    # If blocked, append reason in a new column or parenthetical
    
    # Write back atomically (temp file + rename)
    with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.md') as f:
        f.write(updated_content)
        temp_path = f.name
    
    shutil.move(temp_path, TRACKING_MD_PATH)
```

#### Help Text

```
$ python3 scripts/proposal_tracker.py --help
usage: proposal_tracker.py <command> [<args>]

Commands:
  list                          List all proposals
  show <proposal_id>            Show proposal details
  update <id> <status>          Update proposal status
  stats                         Show proposal statistics

$ python3 scripts/proposal_tracker.py update --help
usage: proposal_tracker.py update <proposal_id> <status>

Updates the status of a proposal in TRACKING.md.

Statuses: proposed, in-progress, review, done, failed, blocked
Example: proposal_tracker.py update A-P0-1 done
```

#### Acceptance Criteria

```
Given: a valid proposal ID and status
When:  running "proposal_tracker.py update A-P0-1 done"
Then:  exit code is 0
  AND: TRACKING.md shows A-P0-1 status = "done"
  AND: other proposals are unchanged

Given: an invalid proposal ID
When:  running "proposal_tracker.py update INVALID done"
Then:  exit code is non-zero
  AND: error message: "Proposal INVALID not found in TRACKING.md"

Given: an invalid status
When:  running "proposal_tracker.py update A-P0-1 maybe"
Then:  exit code is non-zero
  AND: error message lists valid statuses

Given: proposal_tracker.py --help is run
When:  output is displayed
Then:  "update" command is listed with brief description
```

### Implementation Notes

- Atomic file write: write to temp file, then `shutil.move` to prevent corruption
- Preserve TRACKING.md formatting (don't reformat the whole file)
- Validate proposal ID format: `A-P\d-\d+` or similar
- Add integration test: `tests/cli/proposal-tracker.test.ts`

---

## Epic 3 DoD Checklist

- [ ] S3.1: `componentStore.addComponents([])` method exists and works
- [ ] S3.1: `componentStore.removeComponents([])` method exists and works
- [ ] S3.1: 100-component batch operation < 100ms
- [ ] S3.1: Only one notification emitted per batch operation
- [ ] S3.2: `python3 scripts/proposal_tracker.py update <id> done` succeeds
- [ ] S3.2: `proposal_tracker.py --help` shows update subcommand
- [ ] S3.2: Invalid ID/status returns non-zero exit code
- [ ] S3.2: TRACKING.md updated atomically (no partial writes)
- [ ] All 2 proposals updated in TRACKING.md
