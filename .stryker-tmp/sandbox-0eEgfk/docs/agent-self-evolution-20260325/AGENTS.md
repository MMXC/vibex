# AGENTS.md — Agent Self-Evolution Framework Coordination

**Project**: agent-self-evolution-20260325  
**Date**: 2026-03-25  
**Version**: 1.0

---

## Role Responsibilities

### analyst
- **Self-check focus**: Requirements analysis quality, insight extraction, task verification
- **Proposals**: Process improvements, analysis tooling, data quality
- **Deliverable**: `analyst-report-YYYYMMDD.md` by 10:00 AM (or within 1h of heartbeat)
- **Escalation**: Unclear requirements → pm; missing data → coord

### architect
- **Self-check focus**: Architecture design quality, documentation timeliness, tech debt tracking
- **Proposals**: Infrastructure, technical debt, cross-cutting concerns
- **Deliverable**: `architect-report-YYYYMMDD.md` by 10:00 AM
- **Escalation**: Competing priorities → coord; ambiguous PRD → pm

### dev
- **Self-check focus**: Code quality, velocity, bug introduction rate, tech debt cleanup
- **Proposals**: DX improvements, build speed, refactoring opportunities
- **Deliverable**: `dev-report-YYYYMMDD.md` by 10:00 AM
- **Escalation**: Blocked by architecture → architect; blocked by testing → tester

### pm
- **Self-check focus**: PRD quality, prioritization accuracy, delivery predictability
- **Proposals**: Process, tooling, stakeholder communication
- **Deliverable**: `pm-report-YYYYMMDD.md` by 10:00 AM; PRD updates within 4h of request
- **Escalation**: Conflicting priorities → coord; scope changes → analyst

### tester
- **Self-check focus**: Test coverage, bug discovery rate, false positive rate
- **Proposals**: Testing tooling, automation, CI reliability
- **Deliverable**: `tester-report-YYYYMMDD.md` by 10:00 AM
- **Escalation**: Flaky tests → dev; missing requirements → analyst

### reviewer
- **Self-check focus**: Review quality, security findings, process adherence
- **Proposals**: Code quality standards, security, review process
- **Deliverable**: `reviewer-report-YYYYMMDD.md` by 10:00 AM
- **Escalation**: Architectural issues → architect; test gaps → tester

### coord
- **Self-check focus**: Project delivery, blocker resolution, team collaboration
- **Proposals**: Workflow automation, team communication, process improvement
- **Deliverable**: `coord-report-YYYYMMDD.md` by 10:00 AM; heartbeat reports every 5 min
- **Escalation**: Cross-agent conflicts → user; resource constraints → user

---

## Handoff Rules

### When PRD is ready → Architect
1. PM marks `create-prd` as `done` in task_manager
2. Heartbeat detects ready task → wakes architect
3. Architect has **30 minutes** to claim `design-architecture`
4. Architect creates `architecture.md` + `IMPLEMENTATION_PLAN.md`
5. Architect marks `design-architecture` done → coord auto-wakes

### When Architecture is ready → Coord Decision
1. Architect marks `design-architecture` done
2. Coord reads architecture.md + IMPLEMENTATION_PLAN.md
3. Coord decides: approved / needs-revision / rejected
4. If approved → Phase 2 project created via `task_manager.py phase2`
5. Coord marks `coord-decision` done

### Proposal Submission
1. Agent completes self-check report
2. Agent extracts proposals → writes to `proposals/YYYYMMDD-<agent>-proposals.md`
3. Agent updates `FEATURE_REQUESTS.md` with new proposals (status: `submitted`)
4. Analyst reviews all proposals → triages, flags duplicates
5. PM assigns priority → `approved` or `rejected`
6. Coord creates Phase 2 project for `approved` proposals

---

## SLA Expectations

| Task Type | SLA | Measured By |
|-----------|-----|------------|
| Daily self-check report | 60 min from heartbeat | File timestamp |
| Design-architecture | 30 min from PRDs ready | task_manager status |
| Proposal review (analyst) | 2h from submission | task_manager status |
| Proposal decision (pm) | 4h from analyst review | task_manager status |
| Epic creation (coord) | 1h from approved proposals | task_manager status |
| Phase 2 dev task | 24h from dispatch | task_manager status |

---

## Quality Gates

| Gate | Who Checks | What | Pass Criteria |
|------|-----------|------|---------------|
| G1: Report completeness | self (agent) | JSON schema + required fields | All fields present, scores in range |
| G2: Proposal validity | analyst | Title uniqueness + priority consistency | No duplicate titles, P0-P3 valid |
| G3: PRD quality | architect | Scope clarity + acceptance criteria | Each story has expect() assertions |
| G4: Architecture quality | pm + coord | Feasibility + integration risk | IMPLEMENTATION_PLAN < 60h total |
| G5: Code review | reviewer | Security + quality + changelog | 0 security issues, changelog updated |

---

## Anti-Patterns (Avoid)

| Anti-Pattern | Why Bad | Correct Approach |
|-------------|---------|-----------------|
| Skip self-check for "small" days | Misses incremental improvements | Always submit report, even brief |
| Submit vague proposals | Wastes analyst triage time | Include: title, rationale, acceptance criteria, priority |
| Bypass task_manager for "quick fixes" | Breaks traceability | All work through task_manager pipeline |
| Skip LEARNINGS/MEMORY updates | Institutional memory loss | Update within 24h of significant decision |
| Merge without reviewer sign-off | Quality regression | Always through reviewer → reviewer-push |
