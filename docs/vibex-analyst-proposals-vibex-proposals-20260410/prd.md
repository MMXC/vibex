# PRD: Vibex Analyst Proposals — Sprint Debt Clearance 2026-04-10

**Project**: vibex-analyst-proposals-vibex-proposals-20260410
**Author**: PM (from Analyst analysis)
**Date**: 2026-04-10
**Status**: Draft → Ready for Sprint Planning
**Recommended Approach**: Option A — 2-day concentrated Sprint (2026-04-10 ~ 2026-04-12)

---

## 1. Executive Summary

### Background

The 2026-04-09 sprint (E1-E6: Backend data integrity + KV migration) completed successfully, resolving critical concurrency and deployment stability issues. However, **proposal execution debt** from 2026-04-06 through 2026-04-08 has accumulated at a 63% backlog rate (7/19 proposals completed). Two P0 blockers remain unresolved, directly impacting team collaboration velocity.

### Goal

Clear all 9 pending analyst proposals (A-P0-1 through A-P2-2) within a 2-day concentrated Sprint, establishing a TypeScript type-safety baseline and operational tooling foundation for the team to proceed without technical debt friction.

### Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| P0 proposals resolved | 3/3 (A-P0-1, A-P0-2, A-P0-3) | TRACKING.md status |
| `git push` success rate | 100% (no secret scanning blocks) | CI/CD pipeline |
| `tsc --noEmit` errors | 0 type-safety violations | CI pipeline |
| `pnpm test` pass rate | 100% | CI pipeline |
| proposal-tracker CLI usage | 100% of proposal updates | TRACKING.md audit |
| Sprint completion | ≤ 2 days | Task manager timestamps |

---

## 2. Feature List

| ID | Feature Name | Description | Root Cause | Est. Hours | Priority |
|----|-------------|-------------|-----------|------------|----------|
| F01 | GitHub Secret Scanning Fix | Migrate hardcoded Slack token (xoxp-) from task_manager.py to env var | A-P0-1 | 1h | P0 |
| F02 | ESLint no-explicit-any Cleanup | Remove explicit `any` from 9+ TS files, establish type safety baseline | A-P0-2 | 2h | P0 |
| F03 | generate-components flowId E2E | Add Playwright E2E verifying AI-generated components attach to correct flowId | A-P0-3 | 1h | P0 |
| F04 | Tree Component Button Unification | Extract shared Button component for Context/Flow/Component Tree toolbars | A-P1-1 | 2h | P1 |
| F05 | selectedNodeIds Type Unification | Consolidate `selectedNodeIds` to treeStore with `Set<string>`, remove canvasStore duplicate | A-P1-2 | 1h | P1 |
| F06 | componentStore Batch Methods | Add `addComponents([])`, `removeComponents([])` for bulk operations | A-P1-3 | 1h | P1 |
| F07 | proposal-tracker update Command | Implement `update` subcommand to close the proposal lifecycle loop | A-P1-4 | 1h | P1 |
| F08 | ComponentRegistry HMR Support | Enable hot module replacement for new components in JsonRenderPreview | A-P2-1 | 3h | P2 |
| F09 | Reviewer Task Dedup | Prevent duplicate reviewer subagent assignment for the same PR | A-P2-2 | 1h | P2 |
| **Total** | | | | **13h** | |

---

## 3. Epic Breakdown

### Epic 1: P0 Blocker Clearance (3 proposals, 4h)

| Story | Title | Est. | Acceptance Criteria |
|-------|-------|------|---------------------|
| S1.1 | Migrate Slack Token to Env Var | 1h | `grep -r "xoxp-" scripts/task_manager.py` returns empty; `.env.example` has `SLACK_TOKEN=`; `git push` succeeds after modifying task_manager.py |
| S1.2 | ESLint no-explicit-any Cleanup | 2h | `npx tsc --noEmit` passes; `pnpm lint` passes with `no-explicit-any` rule enabled; 9+ files cleaned |
| S1.3 | flowId E2E Verification | 1h | `tests/e2e/generate-components-flowid.test.ts` exists and passes; all AI-generated components have correct flowId |

### Epic 2: UI Consistency & Type Safety (2 proposals, 3h)

| Story | Title | Est. | Acceptance Criteria |
|-------|-------|------|---------------------|
| S2.1 | Tree Button Unification | 2h | BoundedContextTree/FlowTree/ComponentTree all use shared Button component; icon library unified; `pnpm test` passes; Playwright E2E for button interactions |
| S2.2 | selectedNodeIds Type Consolidation | 1h | `selectedNodeIds` defined only in treeStore; type is `Set<string>`; no canvasStore duplicate; `pnpm test` passes |

### Epic 3: Store Improvements & CLI (2 proposals, 2h)

| Story | Title | Est. | Acceptance Criteria |
|-------|-------|------|---------------------|
| S3.1 | componentStore Batch Methods | 1h | `addComponents(components[])` and `removeComponents(ids[])` methods exist and work; 100-component batch < 100ms |
| S3.2 | proposal-tracker update Subcommand | 1h | `python3 scripts/proposal_tracker.py update <id> done/failed/blocked` works; TRACKING.md updates atomically; `proposal_tracker.py --help` shows update docs |

### Epic 4: Technical Debt & Process (2 proposals, 4h)

| Story | Title | Est. | Acceptance Criteria |
|-------|-------|------|---------------------|
| S4.1 | ComponentRegistry HMR Support | 3h | New component added to vibexCanvasCatalog appears in JsonRenderPreview without server restart; documentation added |
| S4.2 | Reviewer Task Dedup | 1h | Same PR ID does not appear in multiple `status=pending` review tasks; Coord heartbeat rejects duplicate PR reviews |

---

## 4. Acceptance Criteria (Detailed)

### S1.1 — Slack Token Migration

```
# When: developer modifies scripts/task_manager.py
# Then: git push succeeds without GitHub secret scanning failure
expect(grep("xoxp-", "scripts/task_manager.py")).toBeEmpty()
expect(exec("git push").exitCode).toBe(0)

# When: CI/CD runs without SLACK_TOKEN in env
# Then: task_manager.py uses empty string gracefully (no crash)
expect(() => runTaskManager()).not.toThrow()

# When: new developer clones repo
# Then: .env.example contains SLACK_TOKEN= line
expect(read(".env.example")).toContain("SLACK_TOKEN=")
```

### S1.2 — ESLint any Cleanup

```
# When: running tsc --noEmit on entire codebase
# Then: zero explicit-any errors (excluding @ts-ignore)
expect(exec("npx tsc --noEmit").exitCode).toBe(0)

# When: running pnpm lint
# Then: no no-explicit-any violations
expect(exec("pnpm lint").exitCode).toBe(0)

# File count: at least 9 files cleaned
expect(cleanedFilesCount).toBeGreaterThanOrEqual(9)
```

### S1.3 — flowId E2E Verification

```
# When: AI generates components for flowId="flow-123"
# Then: all components have flowId === "flow-123" in database
# And: Canvas UI shows components under correct Flow node
const response = await canvasApi.generateComponents({ flowId: "flow-123" });
expect(response.components.every(c => c.flowId === "flow-123")).toBe(true);
```

### S2.1 — Tree Button Unification

```
# When: rendering BoundedContextTree, FlowTree, or ComponentTree
# Then: all toolbar buttons use shared <TreeButton> component
# And: no mixed icon libraries (Heroicons vs Lucide)
expect(TreeButton).toBeUsedIn(BoundedContextTree);
expect(TreeButton).toBeUsedIn(FlowTree);
expect(TreeButton).toBeUsedIn(ComponentTree);
```

### S2.2 — selectedNodeIds Consolidation

```
# When: type-checking the codebase
# Then: selectedNodeIds is defined only in treeStore
# And: its type is Set<string>
# And: canvasStore does not redefine it
expect(treeStore.selectedNodeIds).toBeDefined();
expect(canvasStore.selectedNodeIds).toBeUndefined();
expect(typeof treeStore.selectedNodeIds).toBe("object"); // Set
```

### S3.1 — componentStore Batch Methods

```
# When: adding 100 components in one call
# Then: operation completes in < 100ms
const start = Date.now();
await componentStore.addComponents(generate100Components());
expect(Date.now() - start).toBeLessThan(100);

// When: removing multiple components
# Then: all removed successfully
await componentStore.addComponents([c1, c2, c3]);
await componentStore.removeComponents([c1.id, c2.id]);
expect(componentStore.getById(c1.id)).toBeUndefined();
expect(componentStore.getById(c3.id)).toBeDefined();
```

### S3.2 — proposal-tracker update Command

```
# When: running proposal_tracker.py update with valid id and status
# Then: TRACKING.md atomically updated; exit code 0
expect(exec("python3 scripts/proposal_tracker.py update A-20260408-02 done").exitCode).toBe(0);
expect(read("TRACKING.md")).toContain("A-20260408-02 | P0 | done");

# When: running with invalid id
# Then: error message printed; exit code non-zero
expect(exec("python3 scripts/proposal_tracker.py update INVALID done").exitCode).not.toBe(0);
```

### S4.1 — ComponentRegistry HMR

```
# When: developer adds component to vibexCanvasCatalog
# Then: JsonRenderPreview reflects change without restart (HMR)
# And: documentation explains registration process
```

### S4.2 — Reviewer Dedup

```
# When: Coord heartbeat scans for pending reviewer tasks
# Then: same PR ID appears at most once across all pending review tasks
# And: duplicate assignment is rejected with warning log
```

---

## 5. Definition of Done (DoD)

A proposal is **Done** when ALL of the following are satisfied:

- [ ] Code change committed with descriptive commit message referencing proposal ID
- [ ] All unit/integration tests pass (`pnpm test`)
- [ ] TypeScript compilation passes (`npx tsc --noEmit`)
- [ ] Lint passes (`pnpm lint`)
- [ ] E2E tests pass (if applicable)
- [ ] TRACKING.md updated via `proposal_tracker.py update <id> done`
- [ ] No new `any` types introduced in changed files
- [ ] PR created (if multi-file change) with reference to proposal ID
- [ ] Reviewer approved the change

---

## 6. 功能点汇总表（含页面集成标注）

| Epic | Feature | Pages/Modules Affected | Integration Notes |
|------|---------|------------------------|-------------------|
| E1 | F01 Secret Scanning | scripts/task_manager.py | CI/CD env var injection |
| E1 | F02 ESLint Cleanup | packages/*, services/* (9+ files) | CI pipeline gate |
| E1 | F03 flowId E2E | Canvas page, canvasApi | Playwright test |
| E2 | F04 Tree Buttons | BoundedContextTree, FlowTree, ComponentTree | Shared component |
| E2 | F05 selectedNodeIds | treeStore, canvasStore | Type migration |
| E3 | F06 componentStore Batch | componentStore, Canvas editor | Performance critical |
| E3 | F07 proposal-tracker | scripts/proposal_tracker.py, TRACKING.md | CLI workflow |
| E4 | F08 ComponentRegistry HMR | JsonRenderPreview, vibexCanvasCatalog | Dev experience |
| E4 | F09 Reviewer Dedup | team-tasks Coord scanning logic | Process automation |

---

## 7. 实施计划（Sprint 排期）

**Sprint Name**: Sprint Debt Clearance 2026-04-10
**Sprint Duration**: 2 days (2026-04-10 ~ 2026-04-11)
**Total Capacity**: 13h across 2 engineers

### Sprint Day 1 (2026-04-10)

| Time | Task | Owner | Deliverable |
|------|------|-------|-------------|
| 09:00-10:00 | S1.1: Slack token migration | Dev | PR merged, git push verified |
| 10:00-12:00 | S1.2: ESLint any cleanup | Dev | All 9+ files cleaned, tsc passes |
| 13:00-14:00 | S1.3: flowId E2E test | Tester | E2E test written and passing |
| 14:00-16:00 | S2.1: Tree button unification | Dev | Shared Button component, E2E |
| 16:00-17:00 | S2.2: selectedNodeIds consolidation | Dev | treeStore only, Set<string> |

### Sprint Day 2 (2026-04-11)

| Time | Task | Owner | Deliverable |
|------|------|-------|-------------|
| 09:00-10:00 | S3.1: componentStore batch | Dev | addComponents/removeComponents |
| 10:00-11:00 | S3.2: proposal-tracker update | Dev | CLI update subcommand |
| 11:00-12:00 | S4.1: ComponentRegistry HMR | Dev | HMR working, docs added |
| 13:00-14:00 | S4.2: Reviewer dedup | Dev | Coord dedup logic |
| 14:00-16:00 | Full regression: pnpm test + tsc + lint | All | All green, Sprint closed |

### Open Questions (to resolve before Sprint start)

| # | Question | Owner | Needed By |
|---|----------|-------|-----------|
| Q1 | A-P0-2 any cleanup: full cleanup or only new `any`? | Dev | Day 1 start |
| Q2 | CI/CD SLACK_TOKEN injection method? | Dev + Ops | S1.1 start |
| Q3 | Sprint overlaps with feature dev? | Coord | Before kickoff |

---

*PM — 2026-04-10*
