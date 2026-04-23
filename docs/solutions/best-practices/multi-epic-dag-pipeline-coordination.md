---
title: Multi-Epic DAG Pipeline Coordination Pattern
date: 2026-04-24
category: docs/solutions/coordination
module: ce:compound pipeline
problem_type: workflow_issue
component: pipeline-pattern
severity: high
applies_when:
  - Project has 3+ epics with inter-epic dependencies
  - Multiple agents work in parallel across epics
  - Coordination spans dev → tester → reviewer → reviewer-push per epic
tags: [coordination, dag-pipeline, multi-epic, team-tasks, phase2]
---

# Multi-Epic DAG Pipeline Coordination Pattern

## Context

VibeX Canvas Evolution (2026-04-23) executed a 5-epic project where each epic required independent pipeline stages (dev → tester → reviewer → reviewer-push), and epics had DAG dependencies (Epic2 blocked by Epic1, Epic3 blocked by Epic2, etc.). Without disciplined coordination, this pattern risks broken chains, false completions, and CHANGELOG drift.

## Guidance

### Core Pipeline Pattern

Every epic runs through a fixed 4-stage pipeline per epic:

```
coord-decision → dev → tester → reviewer → reviewer-push
```

The `coord-decision` stage gates ALL epics at once. After all pass, phase2 task chains spawn per Epic in DAG order. Each epic's pipeline is independent — dev/tester/reviewer/reviewer-push run per epic, not per project.

### DAG Dependency Enforcement

Dependencies flow per Epic:
- **Epic1** → unblocked (no upstream)
- **Epic2** → blocked until `reviewer-push-epic1` completes
- **Epic3** → blocked until `reviewer-push-epic2` completes
- **Epic4** → blocked until `reviewer-push-epic3` completes
- **Epic5** → blocked until `reviewer-push-epic4` completes

At `coord-decision`, use `task allow <project> coord-decision` to create the full task graph for all epics simultaneously. The task system reads the epic list from IMPLEMENTATION_PLAN.md and creates the full DAG of dev/tester/reviewer/reviewer-push tasks per epic.

### Phase Sequence

1. **Phase1** (coord-decision): gate all epics — read analysis.md + prd.md + architecture.md → pass or reject
2. **Phase2** (per epic pipeline): for each epic in DAG order — dev → tester → reviewer → reviewer-push
3. **coord-completed**: verify all pipelines complete → check git push success → mark project completed

### CHANGELOG Discipline

At the `reviewer` stage, CHANGELOG.md must be updated before marking done. If missing, the reviewer issues a **CONDITIONAL PASS** — code quality passes but CHANGELOG is pending. The coordinator fixes it in the `coord-completed` phase rather than blocking the epic pipeline.

### Verification Gates

| Stage | Verification | Pass Criteria |
|-------|-------------|---------------|
| tester | `npm test` | 100% tests pass for epic scope |
| reviewer | Code review + CHANGELOG | Code quality + changelog updated |
| reviewer-push | `git push` | Remote commit verified |
| coord-completed | `git log --oneline -n` + remote fetch | All epics pushed to remote |

### Phantom Epic Detection (coord-decision)

Before creating phase2 tasks, verify each Epic in IMPLEMENTATION_PLAN.md has independent code output. An Epic with no file changes (git diff shows empty) and no Epic-specific commit is a **phantom Epic** — it should be merged into the upstream Epic or removed. Reject at coord-decision if phantom Epic exists.

```bash
# In coord-decision: check for phantom Epic
git diff HEAD~1 --name-only
# Empty output → Epic has no code changes → reject
```

## Why This Matters

- **DAG ordering** prevents cascading failures where Epic3 builds on incomplete Epic2 output
- **Independent pipelines** per epic allow parallel work while respecting dependencies
- **CONDITIONAL PASS for CHANGELOG** prevents blocking quality code for a documentation issue, while still ensuring accountability
- **Phantom Epic detection** prevents creating task chains for Epic-like-things that produce no code

## When to Apply

- Projects with 3+ epics and inter-epic dependencies
- When each epic requires its own code review and QA cycle
- When the same agent pool (dev/tester/reviewer) must handle multiple epics in sequence
- When you need to track which Epic's work is in which pipeline stage at any given time

## Examples

### Epic1 Pipeline (vibex-canvas-evolution — verified)

```
coord-decision (2026-04-23 20:46) ──→ dev-epic1样式统一 (done, 2026-04-23 13:52)
                                    ├→ tester-epic1样式统一 (done, 2026-04-23 14:18)
                                    ├→ reviewer-epic1样式统一 (CONDITIONAL PASS, CHANGELOG pending)
                                    └→ reviewer-push-epic1样式统一 (done, 2026-04-23 14:27)

coord-completed (2026-04-23 22:21) → fixed CHANGELOG.md → project marked completed
```

### Phantom Epic Rejection

During coord-decision, if git diff shows no changes for an Epic and no Epic-specific commit exists, reject with: "Epic has no independent code output — merge into upstream Epic or remove from IMPLEMENTATION_PLAN.md before phase2."

### DAG Sequential Unblock (Epic2 on Epic1)

Epic2 dev task has `dependsOn: ["coord-decision", "reviewer-push-epic1样式统一"]`. It stays `pending` until both conditions are met. When Epic1 reviewer-push completes, Epic2 dev automatically becomes `ready`.

## Related

- [HEARTBEAT.md](/root/.openclaw/workspace-coord/HEARTBEAT.md) — Coord heartbeat and coord-completed logic
- [vibex-canvas-evolution task graph](/root/.openclaw/workspace-coord/team-tasks/vibex-canvas-evolution.json) — Full 5-epic DAG definition
- [vibex-canvas-evolution reviewer report (Epic1)](vibex-canvas-evolution/reviewer-epic1样式统一-report-20260423-2221.md) — CONDITIONAL PASS example with CHANGELOG flag
- [vibex-canvas-evolution tester report (Epic1)](vibex-canvas-evolution/tester-tester-epic1样式统一-report-20260423-215312.md) — tester phase verification with 44 tests