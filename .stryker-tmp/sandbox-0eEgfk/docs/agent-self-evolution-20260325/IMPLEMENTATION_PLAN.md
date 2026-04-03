# Implementation Plan — Agent Self-Evolution Framework
**Project**: agent-self-evolution-20260325  
**Status**: Proposed  
**Author**: architect  
**Date**: 2026-03-25

---

## Overview

Phased implementation over 3 sprints. Each phase delivers working value and is reversible.

| Phase | Focus | Duration | Key Deliverable |
|-------|-------|----------|----------------|
| **Phase 1** | Templates + Heartbeat Integration | Week 1 | All 7 agent templates live, heartbeat dispatch working |
| **Phase 2** | Proposal Pipeline + Lifecycle | Week 2 | Proposals tracked in task_manager, lifecycle automated |
| **Phase 3** | Metrics + Process Refinement | Week 3 | Dashboard, trend analysis, process tuning |

---

## Phase 1: Templates + Heartbeat Integration

### Goal
Standardize self-check reports and integrate with existing heartbeat infrastructure.

### Tasks

| ID | Task | Owner | Effort | Priority |
|----|------|-------|--------|----------|
| P1-T1 | Create 7 agent-specific templates | analyst | 2h | P0 |
| P1-T2 | Integrate template rendering into heartbeat-v8.sh | coord | 2h | P0 |
| P1-T3 | Add `generate-self-check-report` command to task_manager.py | dev | 4h | P1 |
| P1-T4 | Template validation schema (JSON Schema) | architect | 2h | P1 |
| P1-T5 | Documentation: `docs/self-check-guide.md` | pm | 1h | P2 |
| P1-T6 | Dry-run self-check cycle (all 7 agents) | coord | 2h | P0 |

### Acceptance Criteria
- [ ] All 7 agent templates exist under `specs/templates/`
- [ ] `heartbeat-v8.sh` can trigger self-check for a specific agent
- [ ] Report JSON validates against `report-schema.json`
- [ ] `docs/self-check-guide.md` exists and is reviewed

### File Changes
```
docs/agent-self-evolution-YYYYMMDD/
├── specs/templates/analyst-template.md
├── specs/templates/architect-template.md
├── specs/templates/dev-template.md
├── specs/templates/pm-template.md
├── specs/templates/reviewer-template.md
├── specs/templates/tester-template.md
├── specs/templates/coord-template.md
├── specs/schemas/report-schema.json
└── docs/self-check-guide.md
```

---

## Phase 2: Proposal Pipeline + Lifecycle

### Goal
Convert self-check proposals into tracked tasks with full lifecycle management.

### Tasks

| ID | Task | Owner | Effort | Priority |
|----|------|-------|--------|----------|
| P2-T1 | Add proposal lifecycle states to task_manager.py | dev | 4h | P0 |
| P2-T2 | Auto-extract proposals from reports → FEATURE_REQUESTS.md | coord | 3h | P0 |
| P2-T3 | Proposal deduplication logic (by title + owner) | dev | 2h | P1 |
| P2-T4 | Proposal priority auto-assignment (based on impact) | analyst | 2h | P2 |
| P2-T5 | Proposal review workflow (analyst → pm → coord) | coord | 2h | P1 |
| P2-T6 | Integration test: report → proposal → task | tester | 3h | P0 |

### Acceptance Criteria
- [ ] Proposals auto-extracted from reports within 5 min of completion
- [ ] Proposal lifecycle: draft → submitted → reviewing → approved → implementing → completed
- [ ] Duplicate proposals detected and flagged
- [ ] `FEATURE_REQUESTS.md` updated automatically
- [ ] `npm test` passes for proposal extraction logic

### File Changes
```
scripts/
├── extract-proposals.py      # Parse reports, extract proposals
├── proposal-dedup.py         # Deduplication logic
└── proposal-lifecycle.py     # State machine

docs/agent-self-evolution-YYYYMMDD/
└── specs/
    └── proposal-lifecycle.md  # State diagram and transitions
```

---

## Phase 3: Metrics + Process Refinement

### Goal
Visibility into team health and continuous process improvement.

### Tasks

| ID | Task | Owner | Effort | Priority |
|----|------|-------|--------|----------|
| P3-T1 | Metrics aggregation script (weekly) | analyst | 3h | P1 |
| P3-T2 | Self-check completion rate dashboard (Markdown) | coord | 2h | P1 |
| P3-T3 | Proposal success rate tracking | pm | 2h | P2 |
| P3-T4 | LEARNINGS.md auto-sync from proposals | analyst | 2h | P2 |
| P3-T5 | Process retrospective (30-day review) | coord | 1h | P0 |
| P3-T6 | Template refinement based on feedback | analyst | 2h | P1 |

### Acceptance Criteria
- [ ] Weekly metrics report generated automatically
- [ ] Dashboard shows: completion rate, proposal count, priority distribution
- [ ] 30-day retrospective document created
- [ ] Templates updated based on agent feedback

---

## Resource Estimate

| Resource | Phase 1 | Phase 2 | Phase 3 | Total |
|----------|---------|---------|---------|-------|
| analyst | 3h | 4h | 7h | 14h |
| architect | 4h | 1h | 1h | 6h |
| dev | 4h | 8h | 0h | 12h |
| pm | 1h | 2h | 4h | 7h |
| coord | 3h | 5h | 5h | 13h |
| tester | 0h | 3h | 0h | 3h |
| **Total** | **15h** | **23h** | **17h** | **55h** |

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Agent adoption resistance | Medium | High | Clear template + guide; start with voluntary cycle |
| Proposal flooding (low quality) | Medium | Medium | P3 threshold + analyst triage in Phase 2 |
| Template drift (agents ignore format) | High | Low | Heartbeat validation; gentle reminders |
| Heartbeat overload (too many agents checking) | Low | Medium | Standby counter prevents spam; 5-min cooldown |
| Duplicate proposals across agents | Medium | Low | Dedup logic in Phase 2 |

---

## Dependencies

```
Phase 1
└── task_manager.py (existing) — no new deps
    └── self-check templates — parallel work

Phase 2
└── Phase 1 complete (templates needed for extraction)
    └── FEATURE_REQUESTS.md (existing structure)

Phase 3
└── Phase 2 complete (proposal data needed for metrics)
    └── LEARNINGS.md (existing)
```
