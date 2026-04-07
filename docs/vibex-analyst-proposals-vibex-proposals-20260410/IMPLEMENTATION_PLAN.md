# Implementation Plan: Vibex Analyst Proposals — Sprint Debt Clearance 2026-04-10

**Project**: vibex-analyst-proposals-vibex-proposals-20260410
**Author**: Architect
**Date**: 2026-04-10
**Sprint Duration**: 2 days (2026-04-10 ~ 2026-04-11)
**Total Estimated Hours**: 13h

---

## 1. Sprint Overview

```mermaid
gantt
    title Sprint Debt Clearance 2026-04-10
    dateFormat  YYYY-MM-DD
    axisFormat  %H:%M

    section Day 1
    S1.1 Slack Token Migration          :done, 09:00, 1h
    S1.2 ESLint no-explicit-any Cleanup :crit, 10:00, 2h
    S1.3 flowId E2E Test               :active, 13:00, 1h
    S2.1 Tree Button Unification        :crit, 14:00, 2h
    S2.2 selectedNodeIds Consolidation  :15:00, 1h

    section Day 2
    S3.1 componentStore Batch Methods   :09:00, 1h
    S3.2 proposal-tracker update        :10:00, 1h
    S4.1 ComponentRegistry HMR          :11:00, 2h
    S4.2 Reviewer Task Dedup            :13:00, 1h
    Regression: test + tsc + lint       :14:00, 2h
```

---

## 2. Epic 1: P0 Blocker Clearance (4h, Day 1)

### S1.1: Slack Token Migration (1h)

**Owner**: Dev
**Proposal**: A-P0-1
**Acceptance**: `grep xoxp- scripts/task_manager.py` returns empty

**Prerequisites**: None
**Dependencies**: None

**Detailed Tasks**:

| Step | Task | File(s) | Verification |
|------|------|---------|-------------|
| 1.1.1 | Read current task_manager.py, locate hardcoded `SLACK_TOKEN` | `scripts/task_manager.py` | — |
| 1.1.2 | Replace `SLACK_TOKEN = "xoxp-..."` with `os.environ.get('SLACK_TOKEN', '')` | `scripts/task_manager.py` | `grep "xoxp-" task_manager.py` empty |
| 1.1.3 | Verify all Slack API calls handle empty token gracefully | `scripts/task_manager.py` | No crash with empty env |
| 1.1.4 | Add `SLACK_TOKEN=` to `.env.example` | `.env.example` | File contains line |
| 1.1.5 | Commit with message: `fix(A-P0-1): migrate Slack token to env var` | git | `git push` succeeds |
| 1.1.6 | Update TRACKING.md: `proposal_tracker.py update A-P0-1 done` | `docs/TRACKING.md` | Row shows `done` |

**Edge Cases**:
- If `SLACK_TOKEN` is unset, Slack notifications will silently fail — add log warning
- CI/CD must inject `SLACK_TOKEN` via GitHub Actions secrets

---

### S1.2: ESLint no-explicit-any Cleanup (2h)

**Owner**: Dev
**Proposal**: A-P0-2
**Acceptance**: `pnpm lint` passes with `no-explicit-any` rule enabled; `npx tsc --noEmit` passes

**Prerequisites**: None
**Dependencies**: S1.1 (token fix enables push for this work)

**Detailed Tasks**:

| Step | Task | File(s) | Verification |
|------|------|---------|-------------|
| 1.2.1 | Run baseline scan: `grep -rn " : any\| :any" vibex-fronted/ vibex-backend/` | 9+ TS files | Count files with explicit any |
| 1.2.2 | Enable `typescript-eslint/no-explicit-any: error` in ESLint config | `eslint.config.mjs` | CI fails before fix |
| 1.2.3 | Categorize each explicit any: simple type, object type, function type | All 9+ files | — |
| 1.2.4 | Fix each file — replace explicit any with proper types | All 9+ files | — |
| 1.2.5 | Run `pnpm lint` — all clear | CI | Exit code 0 |
| 1.2.6 | Run `npx tsc --noEmit` — all clear | CI | Exit code 0 |
| 1.2.7 | Commit: `fix(A-P0-2): remove explicit any from N TypeScript files` | git | Push succeeds |
| 1.2.8 | Update TRACKING.md: `proposal_tracker.py update A-P0-2 done` | `docs/TRACKING.md` | Row shows `done` |

**Type Fix Patterns**:

```typescript
// Pattern 1: Simple type
const value: any          → const value: unknown
const value: any = 5       → const value: number = 5

// Pattern 2: Object type
const obj: any            → const obj: Record<string, unknown>
const obj: any = {a: 1}   → const obj: {a: number}

// Pattern 3: Function argument
function foo(arg: any)     → function foo(arg: unknown)
// or: function foo(arg: SpecificType) if known

// Pattern 4: Array of any
const arr: any[]          → const arr: unknown[]
// or: const arr: SpecificType[]

// Pattern 5: Return type
function foo(): any        → function foo(): unknown
```

**Note**: If full cleanup of all files is too aggressive for 2h, prioritize:
1. Files that fail `tsc --noEmit` first
2. Files in `packages/types/` (most critical for shared types)
3. Files in `vibex-backend/` (API layer)

---

### S1.3: flowId E2E Verification (1h)

**Owner**: Tester
**Proposal**: A-P0-3
**Acceptance**: `tests/e2e/generate-components-flowid.test.ts` exists and passes

**Prerequisites**: Dev environment running (`pnpm dev`)
**Dependencies**: None

**Detailed Tasks**:

| Step | Task | File(s) | Verification |
|------|------|---------|-------------|
| 1.3.1 | Create `tests/e2e/generate-components-flowid.test.ts` | New file | File created |
| 1.3.2 | Implement test: generate components for specific flowId, verify all have correct flowId | New file | All assertions pass |
| 1.3.3 | Verify Canvas UI shows components under correct Flow node | Manual | Visual check |
| 1.3.4 | Run: `pnpm test:e2e tests/e2e/generate-components-flowid.test.ts` | CI | Exit code 0 |
| 1.3.5 | Commit: `test(A-P0-3): add flowId E2E for component generation` | git | — |
| 1.3.6 | Update TRACKING.md: `proposal_tracker.py update A-P0-3 done` | `docs/TRACKING.md` | Row shows `done` |

**Test Implementation**:

```typescript
// tests/e2e/generate-components-flowid.test.ts
import { test, expect } from '@playwright/test';
import { canvasApi } from '@/lib/canvas/api/canvasApi';

test.describe('generate-components flowId association', () => {
  test('AI generates components with correct flowId', async ({ page }) => {
    // Navigate to canvas
    await page.goto('/canvas/project/test-flowid-e2e');

    // Trigger component generation
    await page.click('[data-testid="generate-components"]');
    await page.waitForResponse('**/api/canvas/generate');

    // Call canvas API directly to verify data
    const response = await canvasApi.generateComponents({
      flowId: 'flow-e2e-test-001',
      componentSpec: 'button primary',
      count: 3,
    });

    // Assert all components have correct flowId
    expect(response.components.length).toBe(3);
    expect(response.components.every(c => c.flowId === 'flow-e2e-test-001')).toBe(true);
  });

  test('Canvas shows components under correct Flow node', async ({ page }) => {
    await page.goto('/canvas/project/test-flowid-e2e');

    // Expand the flow node
    const flowNode = page.locator('[data-testid="flow-node-flow-e2e-test-001"]');
    await flowNode.click();

    // Verify component count matches generated
    const childComponents = flowNode.locator('[data-testid^="component-node-"]');
    await expect(childComponents).toHaveCount(3);
  });
});
```

---

## 3. Epic 2: UI Consistency & Type Safety (3h, Day 1)

### S2.1: Tree Button Unification (2h)

**Owner**: Dev
**Proposal**: A-P1-1
**Acceptance**: BoundedContextTree/FlowTree/ComponentTree all use shared `<TreeButton>` component

**Prerequisites**: None
**Dependencies**: S1.2 (type safety baseline)

**Detailed Tasks**:

| Step | Task | File(s) | Verification |
|------|------|---------|-------------|
| 2.1.1 | Audit current button usage in each tree: `BoundedContextTree`, `FlowTree`, `ComponentTree` | `vibex-fronted/src/` | 3 trees audited |
| 2.1.2 | Identify shared button patterns (add, delete, edit, expand, collapse) | — | Button types identified |
| 2.1.3 | Create shared `TreeButton` component with unified icon set | `vibex-fronted/src/components/ui/TreeButton.tsx` | Component exists |
| 2.1.4 | Replace all tree toolbar buttons with `<TreeButton>` in each tree | 3 tree files | No raw `<button>` in toolbars |
| 2.1.5 | Audit icon library: ensure all trees use same icon library (prefer Lucide) | — | No mixed icons |
| 2.1.6 | Run `pnpm test` — all pass | CI | Exit code 0 |
| 2.1.7 | Playwright E2E: verify button interactions in all 3 trees | `tests/e2e/` | All pass |
| 2.1.8 | Commit: `refactor(A-P1-1): unify Tree toolbar buttons` | git | — |
| 2.1.9 | Update TRACKING.md: `proposal_tracker.py update A-P1-1 done` | `docs/TRACKING.md` | Row shows `done` |

**Icon Library Decision**: Use Lucide React (already in use in some trees). Do NOT mix Heroicons and Lucide.

---

### S2.2: selectedNodeIds Type Consolidation (1h)

**Owner**: Dev
**Proposal**: A-P1-2
**Acceptance**: `selectedNodeIds` only in treeStore as `Set<string>`

**Prerequisites**: None
**Dependencies**: S2.1 (may need to check tree interactions)

**Detailed Tasks**:

| Step | Task | File(s) | Verification |
|------|------|---------|-------------|
| 2.2.1 | Locate all `selectedNodeIds` definitions across codebase | `vibex-fronted/src/` | Found in treeStore, canvasStore |
| 2.2.2 | Audit all consumers of `selectedNodeIds` from both stores | — | Full consumer list |
| 2.2.3 | Migrate canvasStore consumers to treeStore | consumers | All point to treeStore |
| 2.2.4 | Remove `selectedNodeIds` from canvasStore | `canvasStore.ts` | Only treeStore has it |
| 2.2.5 | Verify type is `Set<string>` (not `string[]`) | `treeStore.ts` | TypeScript confirms |
| 2.2.6 | Run `pnpm test` — all pass | CI | Exit code 0 |
| 2.2.7 | Commit: `refactor(A-P1-2): consolidate selectedNodeIds to treeStore as Set` | git | — |
| 2.2.8 | Update TRACKING.md: `proposal_tracker.py update A-P1-2 done` | `docs/TRACKING.md` | Row shows `done` |

---

## 4. Epic 3: Store Improvements & CLI (2h, Day 2)

### S3.1: componentStore Batch Methods (1h)

**Owner**: Dev
**Proposal**: A-P1-3
**Acceptance**: `addComponents([])` and `removeComponents([])` exist; 100-component batch < 100ms

**Prerequisites**: None
**Dependencies**: None

**Detailed Tasks**:

| Step | Task | File(s) | Verification |
|------|------|---------|-------------|
| 3.1.1 | Read current `componentStore.ts` — understand single-item methods | `vibex-fronted/src/lib/canvas/stores/componentStore.ts` | — |
| 3.1.2 | Add `addComponents(components: Component[]): void` method | `componentStore.ts` | Method exists |
| 3.1.3 | Add `removeComponents(ids: string[]): void` method | `componentStore.ts` | Method exists |
| 3.1.4 | Write unit test: 100-component batch < 100ms | `tests/unit/stores/componentStore.test.ts` | Test passes |
| 3.1.5 | Write unit test: removeComponents removes all specified | `tests/unit/stores/componentStore.test.ts` | Test passes |
| 3.1.6 | Run `pnpm test` — all pass | CI | Exit code 0 |
| 3.1.7 | Commit: `feat(A-P1-3): add batch methods to componentStore` | git | — |
| 3.1.8 | Update TRACKING.md: `proposal_tracker.py update A-P1-3 done` | `docs/TRACKING.md` | Row shows `done` |

**Implementation**:

```typescript
// componentStore.ts
addComponents(components: Component[]): void {
  const start = Date.now();
  components.forEach(c => {
    if (!this.components.has(c.id)) {
      this.components.set(c.id, c);
    }
  });
  const elapsed = Date.now() - start;
  if (elapsed > 100) {
    console.warn(`addComponents(${components.length}) took ${elapsed}ms — target < 100ms`);
  }
}

removeComponents(ids: string[]): void {
  ids.forEach(id => this.components.delete(id));
}
```

---

### S3.2: proposal-tracker update Subcommand (1h)

**Owner**: Dev
**Proposal**: A-P1-4
**Acceptance**: `proposal_tracker.py update <id> <status>` works; TRACKING.md updates atomically

**Prerequisites**: None
**Dependencies**: None

**Detailed Tasks**:

| Step | Task | File(s) | Verification |
|------|------|---------|-------------|
| 3.2.1 | Read current `proposal_tracker.py` — understand `list`/`show` subcommands | `scripts/proposal_tracker.py` | — |
| 3.2.2 | Implement `update` subcommand with status validation | `scripts/proposal_tracker.py` | Subcommand exists |
| 3.2.3 | Implement atomic write: read → modify → temp file → rename | `scripts/proposal_tracker.py` | File corruption prevented |
| 3.2.4 | Add `--message` optional flag for audit trail | `scripts/proposal_tracker.py` | Flag works |
| 3.2.5 | Update `--help` output to document `update` subcommand | `scripts/proposal_tracker.py` | Help text visible |
| 3.2.6 | Integration test: run `proposal_tracker.py update A-P1-4 done` | Manual | TRACKING.md updated |
| 3.2.7 | Integration test: run with invalid id — should error | Manual | Non-zero exit |
| 3.2.8 | Commit: `feat(A-P1-4): add update subcommand to proposal-tracker` | git | — |
| 3.2.9 | Update TRACKING.md: `proposal_tracker.py update A-P1-4 done` | `docs/TRACKING.md` | Row shows `done` |

**Atomic Write Pattern**:

```python
def update_proposal(id: str, status: str, message: str = None):
    # 1. Read full TRACKING.md
    with open(TRACKING_PATH, 'r') as f:
        lines = f.readlines()

    # 2. Find and modify the row
    updated = False
    new_lines = []
    for line in lines:
        if id in line and line.startswith('|'):
            # Replace status column
            parts = line.split('|')
            parts[2] = f' {status} '  # status column
            if message:
                parts[4] = f' {message} '  # notes column
            line = '|'.join(parts)
            updated = True
        new_lines.append(line)

    if not updated:
        print(f"ERROR: Proposal {id} not found", file=sys.stderr)
        sys.exit(1)

    # 3. Atomic write (temp file + rename)
    tmp_path = TRACKING_PATH + '.tmp'
    with open(tmp_path, 'w') as f:
        f.writelines(new_lines)
    os.replace(tmp_path, TRACKING_PATH)  # atomic on POSIX
    print(f"Updated {id} → {status}")
```

---

## 5. Epic 4: Technical Debt & Process (4h, Day 2)

### S4.1: ComponentRegistry HMR Support (3h)

**Owner**: Dev
**Proposal**: A-P2-1
**Acceptance**: New component in `vibexCanvasCatalog` visible in JsonRenderPreview without server restart

**Prerequisites**: `pnpm dev` running
**Dependencies**: None

**Detailed Tasks**:

| Step | Task | File(s) | Verification |
|------|------|---------|-------------|
| 4.1.1 | Read current `JsonRenderPreview` and `vibexCanvasCatalog` | `vibex-fronted/src/` | Understand current loading |
| 4.1.2 | Implement HMR-friendly registry with module-level Map | `vibex-fronted/src/lib/canvas/ComponentRegistry.ts` | Registry exists |
| 4.1.3 | Wire up `import.meta.hot` acceptance in `JsonRenderPreview` | `JsonRenderPreview.tsx` | HMR event handled |
| 4.1.4 | Test: add new component to catalog → verify appears in preview without restart | Manual | Works without restart |
| 4.1.5 | Write documentation: how to register new components | `docs/DEVELOPER.md` | Docs explain the process |
| 4.1.6 | Commit: `feat(A-P2-1): add HMR support to ComponentRegistry` | git | — |
| 4.1.7 | Update TRACKING.md: `proposal_tracker.py update A-P2-1 done` | `docs/TRACKING.md` | Row shows `done` |

---

### S4.2: Reviewer Task Dedup (1h)

**Owner**: Dev
**Proposal**: A-P2-2
**Acceptance**: Same PR ID appears at most once across all pending review tasks

**Prerequisites**: None
**Dependencies**: None

**Detailed Tasks**:

| Step | Task | File(s) | Verification |
|------|------|---------|-------------|
| 4.2.1 | Read Coord heartbeat scanning logic | `scripts/heartbeat-scanner.ts` or similar | Understand current scan |
| 4.2.2 | Add prId deduplication check in reviewer task scan | Coord scanning logic | Dedup logic added |
| 4.2.3 | When duplicate detected: log warning, reject assignment | Coord scanning logic | Warning logged |
| 4.2.4 | Write unit test for dedup: same prId → only first assigned | `tests/unit/dedup.test.ts` | Test passes |
| 4.2.5 | Commit: `fix(A-P2-2): dedupe reviewer tasks by PR ID` | git | — |
| 4.2.6 | Update TRACKING.md: `proposal_tracker.py update A-P2-2 done` | `docs/TRACKING.md` | Row shows `done` |

**Dedup Logic**:

```typescript
// In Coord heartbeat scanner
function scanReviewerTasks(tasks: ReviewTask[]): ReviewTask[] {
  const seenPrIds = new Set<string>();
  const deduplicated: ReviewTask[] = [];

  for (const task of tasks) {
    if (task.type === 'review' && task.status === 'pending') {
      if (seenPrIds.has(task.prId)) {
        console.warn(
          `[Dedup] Rejecting duplicate reviewer task ${task.id} ` +
          `for PR ${task.prId} — already assigned`
        );
        // Reject or skip
        rejectTask(task.id, 'duplicate_pr_review');
      } else {
        seenPrIds.add(task.prId);
        deduplicated.push(task);
      }
    }
  }
  return deduplicated;
}
```

---

## 6. Regression Sprint (2h, Day 2 End)

### Full Regression Checklist

| Check | Command | Pass Criteria |
|-------|---------|---------------|
| Type safety | `npx tsc --noEmit` | Exit code 0, no errors |
| Lint | `pnpm lint` | Exit code 0, no warnings |
| Unit tests | `pnpm test:unit` | All pass, coverage > 80% |
| E2E tests | `pnpm test:e2e` | All pass |
| Git push | `git push` | No secret scanning blocks |
| TRACKING.md audit | `proposal_tracker.py list --status=done` | 9 proposals marked done |

### Final Verification Commands

```bash
# Type check
npx tsc --noEmit --project vibex-fronted/tsconfig.json
npx tsc --noEmit --project vibex-backend/tsconfig.json

# Lint
pnpm lint --dir vibex-fronted
pnpm lint --dir vibex-backend

# Unit tests with coverage
pnpm test:unit --coverage

# E2E
pnpm test:e2e --reporter=html

# Proposal tracker final check
python3 scripts/proposal_tracker.py list --status=done
```

---

## 7. Risk Register

| Risk | Impact | Likelihood | Mitigation |
|------|--------|-----------|-----------|
| S1.2 ESLint cleanup hits edge cases | High | Medium | Timebox to 2h; defer remaining files to follow-up |
| S4.1 HMR breaks existing component rendering | Medium | Low | Manual test each tree after change |
| S1.1 token migration breaks Slack notifications | Medium | Low | Add fallback log warning; CI tests won't catch notification failures |
| S4.2 dedup changes Coord heartbeat timing | Low | Low | Add unit test; run heartbeat manually after |

---

## 8. Open Questions (Pre-Sprint)

| # | Question | Owner | Needed By |
|---|----------|-------|-----------|
| Q1 | S1.2: full cleanup or only files failing `tsc`? | Dev | Day 1 start |
| Q2 | S1.1: CI/CD `SLACK_TOKEN` injection method? | Dev + Ops | S1.1 start |
| Q3 | S4.2: dedup scanner location — team-tasks or Coord heartbeat? | Coord | S4.2 start |

---

*Architect — 2026-04-10*
