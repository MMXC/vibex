# Vibex PM Proposals — 2026-04-07 Sprint Cycle

**Prepared by:** Analyst  
**Date:** 2026-04-05  
**Cycle:** 2026-04-07

---

## Executive Summary

Based on today's analysis across 7 active projects, we have identified **5 high-priority proposals** for the 2026-04-07 sprint. Two are P0 (blocking user-facing value delivery), two are P1 (development velocity), and one is P2 (technical debt).

**Key insight:** 72% of Canvas API endpoints are missing, which blocks Epic E4 user value. Meanwhile, accumulated technical debt (3757 lines in 3 component trees, 20+ Zustand stores) threatens development velocity. These should be addressed in parallel — not sequentially.

---

## Proposal 1: P0 — Canvas API Phase1: Snapshot CRUD

### Problem / Opportunity

72% of Canvas API endpoints are currently missing. The system cannot persist or retrieve canvas state — every refresh wipes user work. Epic E4 (user-facing canvas value) is fully blocked.

### Solution

Implement Phase1 of the Canvas API focusing on Snapshot CRUD operations. This enables basic canvas state persistence and is the foundation for all downstream canvas features.

### Impact

| | Estimate |
|---|---|
| **Engineering** | ~7 days (one sprint) |
| **User-facing value** | Unblocks Epic E4 entirely |
| **Risk** | Low — CRUD is well-understood, can be mocked for UI development |

### Implementation Sketch

```
Phase 1.1: API Skeleton (1d)
  - Define request/response types for Snapshot entity
  - Scaffold CRUD endpoints: POST /snapshots, GET /snapshots/:id, PUT /snapshots/:id, DELETE /snapshots/:id

Phase 1.2: Persistence Layer (2d)
  - Integrate with existing data store (PostgreSQL via Prisma)
  - Add snapshot versioning schema

Phase 1.3: API Integration (2d)
  - Wire canvas state to Snapshot API
  - Add auto-save debouncing (save on change, debounce 2s)

Phase 1.4: Error Handling + Testing (2d)
  - Handle 409 Conflict (concurrent edits)
  - Unit + integration tests for all CRUD paths
```

### Verification Criteria

- [ ] All 4 CRUD endpoints return 2xx with valid payloads
- [ ] Canvas state persists across page refresh
- [ ] Auto-save triggers within 3s of user interaction
- [ ] E2E test: create canvas → refresh → canvas state intact
- [ ] API documentation auto-generated (OpenAPI)

### Dependencies

- None (this unblocks others)

### Metrics

| Metric | Target |
|---|---|
| Snapshot save success rate | ≥ 99.5% |
| Save latency (p95) | < 500ms |
| API test coverage | ≥ 90% |

---

## Proposal 2: P0 — Test Coverage Gate Enforcement

### Problem / Opportunity

Current Vitest configuration has dead code paths, and overall line coverage is 79% — below the healthy threshold of 85%. As the codebase grows (7 active projects, multiple canvases, Zustand stores), untested code accumulates silently, increasing regression risk and slowing feature development.

### Solution

Fix the Vitest configuration dead code and enforce a coverage gate in CI at 85% line coverage. Block merges that drop coverage below threshold.

### Impact

| | Estimate |
|---|---|
| **Engineering** | 1-2 days |
| **User-facing value** | Indirect — prevents bad code from reaching users |
| **Risk** | Low — tooling only, no behavioral change |

### Implementation Sketch

```
Step 1: Diagnose dead code in Vitest config (0.5d)
  - Run vitest --coverage --reportCoverageOnChanges
  - Identify which config options map to dead code

Step 2: Fix Vitest configuration (0.5d)
  - Remove broken coverage reporters / thresholds
  - Enable proper source mapping

Step 3: Baseline current coverage (0.25d)
  - Record current 79% as new baseline

Step 4: Raise threshold + add CI gate (0.5d)
  - Set threshold._lines: 85 in vitest.config.ts
  - Add GitHub Actions step: fail on coverage drop

Step 5: Address low-coverage hotspots (0.25-1d)
  - Focus on high-risk areas: canvas hooks, Zustand stores
```

### Verification Criteria

- [ ] `vitest --coverage` runs without dead-code warnings
- [ ] CI pipeline fails if coverage < 85%
- [ ] Coverage report accessible in CI artifacts
- [ ] No regression: existing tests still pass

### Dependencies

- None

### Metrics

| Metric | Target |
|---|---|
| Line coverage | ≥ 85% |
| Dead code in config | 0 warnings |
| CI gate false positive rate | 0% (verified by 3 consecutive runs) |

---

## Proposal 3: P1 — Reviewer Process Standardization

### Problem / Opportunity

There are **5 different code review entrypoints** and **8 identified inconsistencies** across the review workflow. Reviewers waste time determining which process to follow, authors get inconsistent feedback, and the feedback loop is slower than it should be.

### Solution

Standardize the reviewer process into a single, clear workflow with consistent entrypoints and output formats. Consolidate the 5 entrypoints into 1 primary path (with documented exceptions).

### Impact

| | Estimate |
|---|---|
| **Engineering** | 3-4 days |
| **User-facing value** | Faster PR feedback → faster feature delivery |
| **Risk** | Low — process improvement, no code changes |

### Implementation Sketch

```
Step 1: Document the canonical review flow (1d)
  - Map all 5 current entrypoints
  - Identify which should be primary vs. exception
  - Write CLAUDE.md / REVIEW_GUIDE.md entry

Step 2: Consolidate entrypoints (1d)
  - Redirect 4 secondary entrypoints to primary
  - Add automation hints in PR templates

Step 3: Standardize output format (1d)
  - Define consistent comment format (severity: blocker/critical/warning/nit)
  - Add reviewer checklist to PR template

Step 4: Publish + train (0.5-1d)
  - Share new process in #eng channel
  - Run a retro on first sprint using new process
```

### Verification Criteria

- [ ] All PRs route through single entrypoint within 2 sprints
- [ ] Reviewer onboarding doc covers the full process in < 10 minutes
- [ ] Time-to-first-review decreases by ≥ 20% (measure for 2 sprints)
- [ ] 8 inconsistencies resolved (verified by checklist)

### Dependencies

- None

### Metrics

| Metric | Target |
|---|---|
| Review entrypoints | 1 primary + ≤2 documented exceptions |
| Inconsistencies resolved | 8/8 |
| Avg time-to-first-review | < 4 hours (from current baseline) |
| Reviewer satisfaction score | ≥ 4/5 (survey after 2 sprints) |

---

## Proposal 4: P1 — Subagent Resilience: Timeout + Checkpoint Strategy

### Problem / Opportunity

The `sessions_spawn` system currently lacks proper timeout handling and checkpoint/recovery mechanisms. Long-running subagents can fail silently, losing work. This directly threatens ongoing development velocity — especially for complex multi-step tasks.

### Solution

Implement a timeout + checkpoint strategy for `sessions_spawn`:
1. Add configurable per-task timeouts
2. Implement checkpoint saving at key milestones
3. Enable recovery from last checkpoint on failure

### Impact

| | Estimate |
|---|---|
| **Engineering** | 3-5 days |
| **User-facing value** | Indirect — protects developer velocity |
| **Risk** | Low-Medium — changes to core execution model |

### Implementation Sketch

```
Step 1: Timeout infrastructure (1.5d)
  - Add timeout parameter to sessions_spawn API
  - Implement default timeouts per task type
  - Add timeout warning at 80% threshold

Step 2: Checkpoint system (1.5d)
  - Define checkpoint schema (task_id, milestone, state, timestamp)
  - Implement checkpoint save at configurable milestones
  - Add checkpoint listing and inspection tools

Step 3: Recovery flow (1d)
  - Detect subagent failure before timeout
  - Resume from last checkpoint on retry
  - Handle partial state gracefully

Step 4: Testing + docs (1-1.5d)
  - Chaos test: kill subagent mid-task, verify recovery
  - Document timeout + checkpoint config in AGENTS.md
```

### Verification Criteria

- [ ] Subagent killed at 95% of timeout recovers to last checkpoint
- [ ] No work loss on simulated failure (verified by state comparison)
- [ ] Timeout warnings appear at 80% of threshold
- [ ] Docs cover all new config options

### Dependencies

- None

### Metrics

| Metric | Target |
|---|---|
| Recovery time after failure | < 30 seconds |
| Work loss on failure | 0% (full state restoration) |
| Timeout warning accuracy | ≥ 95% (warns before actual timeout) |
| Subagent failure rate (recoverable) | 100% recoverable (from current baseline) |

---

## Proposal 5: P2 — Canvas Component Split: Reduce Monolith Trees

### Problem / Opportunity

Three component trees contain a combined **3757 lines** of tightly coupled code. The Zustand store architecture has **20 legacy stores** overlapping with **5 new canvas stores**. This is unmaintainable — adding features requires understanding massive, tangled component trees.

### Solution

Split the three large component trees into focused, single-responsibility components. Consolidate overlapping Zustand stores. Target: each component tree ≤ 500 lines, each store has a clear, non-overlapping domain.

### Impact

| | Estimate |
|---|---|
| **Engineering** | 5-7 days (one sprint) |
| **User-facing value** | Indirect — faster future feature development |
| **Risk** | Medium — refactoring, must not change behavior |

### Implementation Sketch

```
Step 1: Map current state (1d)
  - Tree-shake the three component trees: identify logical boundaries
  - Map all 25 Zustand stores: which slices overlap?

Step 2: Define new component boundaries (1d)
  - Split Tree A → 4 focused components
  - Split Tree B → 3 focused components
  - Split Tree C → 3 focused components

Step 3: Define new store structure (1d)
  - Consolidate 20+ stores into ≤ 10 well-scoped stores
  - Document each store's domain in STORE_GUIDE.md

Step 4: Implement component splits (2-3d)
  - Extract components with zero behavior change
  - Update imports across codebase
  - Add integration tests for each new component

Step 5: Zustand migration (1d)
  - Migrate consumers to new store structure
  - Remove old store files
  - Verify all state flows correctly
```

### Verification Criteria

- [ ] No component tree exceeds 500 lines
- [ ] No Zustand stores have overlapping state (verified by code inspection)
- [ ] All existing features work identically (E2E regression suite passes)
- [ ] New components have dedicated test files
- [ ] STORE_GUIDE.md documents all stores with their domains

### Dependencies

- **Blocker:** Canvas API Phase1 must be complete (API stabilizes the data model before refactoring)

### Metrics

| Metric | Target |
|---|---|
| Max component tree size | ≤ 500 lines (from ~1250 avg) |
| Zustand store count | ≤ 10 (from 25+) |
| Store overlap count | 0 |
| Regression test pass rate | 100% |

---

## Sprint Planning Recommendation

### Suggested Allocation (5-day sprint)

| Proposal | Priority | Suggested Days | Rationale |
|---|---|---|---|
| Canvas API Phase1 | P0 | 5 days (full sprint) | Blocks Epic E4, highest user value |
| Test Coverage Gate | P0 | 1-2 days | Quick win, protects quality — run in parallel |
| Reviewer Standardization | P1 | 2-3 days | Process work, can overlap with API |
| Subagent Resilience | P1 | 3-5 days | Complex, start early in sprint |
| Canvas Component Split | P2 | 0 (defer to next sprint) | Needs API stability first |

**Recommended approach:** 
- **Sprint 1 (2026-04-07):** Canvas API Phase1 (primary) + Test Coverage Gate (parallel) + Reviewer Standardization (parallel/process track)
- **Sprint 2 (2026-04-14):** Subagent Resilience + Canvas Component Split (after API stabilizes the data model)

---

## Appendix: Cross-Project Dependencies

```
Canvas API Phase1 ─────────────────┐
    (unblocks)                    │
                                  ▼
Canvas Testing Strategy ────► Canvas Component Split (P2)
                              (needs stable API first)

Test Coverage Gate ──────────────────────┐
    (protects quality)                   │
                                          ▼
All projects benefit from CI coverage gate

Reviewer Standardization ────► Faster feedback ────► All projects
Subagent Resilience ─────────► Developer velocity ──► All projects
```

---

*Generated by Analyst on 2026-04-05 based on analysis of 7 active projects.*
