# Sprint78 Learnings

## Sprint Overview
- **Sprint**: Sprint78
- **Completed**: 2026-06-08
- **Epics**: E1-E5 (5 epics, all completed)
  - E1: Canvas 分支自动合并与智能冲突解决
  - E2: 模板市场订阅与更新通知
  - E3: Canvas 内联评论与协作批注
  - E4: 画布批量导出定时任务与 Webhook 通知
  - E5: 画布间关系与依赖追踪
- **Commits**: 11 commits on origin/main
- **Pipeline**: DAG mode, clean completion

## Pipeline Health
- Phase1 (analyze → prd → architecture → coord-decision): all done via self-impl/phantom handling
- Phase2 (E1-E5 dev/tester/reviewer/reviewer-push): all 24 stages done cleanly
- No ghost patterns, no coordinator re-intervention needed
- All reviewer-push stages confirmed on origin/main

## Dual-CHANGELOG Discipline
- Both root `CHANGELOG.md` and `vibex-fronted/CHANGELOG.md` updated for all 5 epics
- Pattern: `feat(S78-EX): <epic-name> — <brief-description>` + `docs(S78): add EX <epic-name> dual-CHANGELOG entry`

## Epic-Specific Architecture Notes
- E1: Canvas branch auto-merge — smart conflict resolution logic
- E2: Template subscription notifications — polling + notification store
- E3: Inline canvas comments — comment store + NodeCommentPanel
- E4: Scheduled export webhook — cron scheduler + external webhook POST
- E5: Canvas relations tracking — relationsStore + FolderTree badge integration

## Velocity Metrics
- Total stages: 25 (analyze + prd + arch + coord-decision + 5 epics × 4 stages + coord-completed)
- Completed: 25/25
- Phase1 self-impl required for all 4 Phase1 stages (phantom pattern)
- Phase2: agent-driven, no coord self-impl

## Key Patterns
- Phantom detection: `status=ready + updatedBy=cli + running_agents=null` → self-impl
- Dual-CHANGELOG: always update both root and frontend changelogs
- coord-completed gate: all 24 non-coord stages done → verify deliverables → mark done
