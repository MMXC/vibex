# AGENTS.md: Analyst Self-Check Improvement — 2026-03-23

**Project**: `vibex-proposals-20260322-selfcheck`

---

## Note

Epic 1-3 overlap with designs produced earlier today:
- `homepage-event-audit/architecture.md` → Epic 1 (ActionBar) + Epic 2 (useHomeGeneration)
- `mvp-backend-analysis/architecture.md` → Epic 3 (API verification script)

Only **Epic 4** (Task Manager validation) requires new implementation.

---

## Agent Responsibilities

### dev
- **Epic 4**: Add agent field validation to `task_manager.py claim`
- **Epic 4**: Add `--force` flag for coord override
- **Epic 4**: Create `docs/task-claim-rules.md`

### tester
- Test claim with wrong agent → error
- Test claim with correct agent → success
- Test `--force` for coord

### reviewer
- Review `task_manager.py` validation logic
- Confirm error messages are clear and actionable
