# AGENTS.md — agent-self-evolution-20260328

**Project**: Agent Self-Evolution Pipeline Improvements  
**Date**: 2026-03-28  
**Mode**: DAG (all 5 Epics are independent, can run in parallel)  

---

## Role Assignments

| Epic | Owner | Reviewer | Tester | Constraints |
|------|-------|----------|--------|-------------|
| Epic 1: HEARTBEAT.md Format Fix | dev | reviewer | tester | Gstack verify format before push |
| Epic 2: task_manager complete cmd | dev | reviewer | tester | Backward compatible, no breaking changes |
| Epic 3: Batch Notification | dev | reviewer | tester | Slack + Feishu dual channel |
| Epic 4: Template Standardization | analyst | reviewer | tester | Template must be approved by architect first |
| Epic 5: Topological Sort | dev | reviewer | tester | Cycle detection required |

---

## Communication Rules

- **Slack channel**: `#coord` for all completion notifications
- **Batch notification**: Epic 3 aggregates all completions into one Slack message
- **No direct agent-to-agent messaging** — all coordination via task_manager
- **Reviewer gate**: Each Epic requires both `review` + `reviewer-push` steps

---

## Definition of Done (per Epic)

| Epic | DoD |
|------|-----|
| Epic 1 | `grep -c '\\n' HEARTBEAT.md` returns 0 |
| Epic 2 | `task_manager.py complete test-proj test-stage done` succeeds |
| Epic 3 | 5 simulated completions → exactly 1 Slack batch message |
| Epic 4 | `validate_analysis.sh` returns 0 violations |
| Epic 5 | Topological sort tests pass (linear + parallel + cycle) |

---

## Skill Requirements

- **dev**: Bash, Python, pytest, git
- **tester**: pytest, bash scripting, gstack
- **reviewer**: git, code review, security scan
- **analyst**: Markdown, template design
