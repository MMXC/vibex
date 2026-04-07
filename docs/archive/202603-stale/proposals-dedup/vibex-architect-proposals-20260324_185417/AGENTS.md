# AGENTS.md — Development Constraints for vibex-architect-proposals-20260324_185417

**Project**: vibex-architect-proposals-20260324_185417  
**Architect**: Architect Agent  
**Date**: 2026-03-24

---

## 1. General Rules

### 1.1 Critical Path

- **Epic 1 task_manager fix** is P0. Do NOT start Epic 2 or Epic 3 work until Epic 1 Sprint 0 is complete and verified.
- **Epic 3 Batch 1** must pass architect review before Batch 2 starts. No shortcuts.

### 1.2 No Direct Code Pushing

All code changes MUST go through PR → Review → Merge. No agent may push directly to `main`.

### 1.3 Verification Before Done

Before marking any task as `done`, verify:
1. All tests pass (`npm test` / `pytest`)
2. No linting errors
3. Git commit exists with clear message
4. No uncommitted changes (`git status --porcelain` should be empty)

---

## 2. Epic-Specific Constraints

### 2.1 Epic 1: Toolchain Hemostasis

| Rule | Rationale |
|------|-----------|
| **timeout = 5s** for all task_manager subprocess calls | Prevents hanging |
| **max_retries = 3** for deadlock detection | Prevents infinite loops |
| **stale threshold = 15 min** for in_progress tasks | Keeps heartbeat accurate |
| **Never bypass verification** (`verify-fake-completion.sh`) | Prevents false completions |
| Test file MUST be at `tests/toolchain/test_*.py` | Organized test structure |

**Commit Message Format**:
```
Epic1-<task>: <short description>

<optional body>

Epic: Epic 1
Task: <task-id>
```

### 2.2 Epic 2: Frontend Quality

| Rule | Rationale |
|------|-----------|
| **Coverage ≥ 85%** for CardTreeNode before marking done | Quality gate |
| **ErrorBoundary dedup**: Keep old copies until new is validated | Safe migration |
| **E2E tests** must run in CI (GitHub Actions) | Catch regressions |
| **No `// @ts-ignore`** without architect approval | Type safety |
| **Playwright config** must use headless mode | CI compatibility |

**Test File Location**: `src/__tests__/CardTreeNode.test.tsx`

**Commit Message Format**:
```
Epic2-<component>: <short description>

Epic: Epic 2
Coverage: <before> → <after>
```

### 2.3 Epic 3: Architecture Debt ⚠️

| Rule | Rationale |
|------|-----------|
| **Never modify more than one batch at a time** | Controlled risk |
| **Proxy layer must remain functional** throughout all batches | Backward compatibility |
| **localStorage migration must be additive** (never delete data) | User data safety |
| **Each batch PR requires architect review** | High-risk changes |
| **Rollback plan** must be documented in each PR | Safety net |
| **No refactor of unrelated code** in batch PRs | Focus |

**Batch PR Checklist**:
- [ ] `state.ts` / `selectors.ts` / `effects.ts` size limits respected
- [ ] `useConfirmationStore` proxy still works
- [ ] All existing tests pass
- [ ] localStorage reads both old and new formats
- [ ] No breaking changes documented
- [ ] Architect approved

**Commit Message Format**:
```
Epic3-Batch<num>: <description>

Batch: <1|2|3>
Risk: HIGH
Breaking: <yes/no>
Rollback: <instructions>

Epic: Epic 3
```

### 2.4 Epic 4: AI Agent Governance

| Rule | Rationale |
|------|-----------|
| **Proposal format** must include all 7 required fields | Quality gate |
| **MEMORY.md** must not contain PII or secrets | Security |
| **SHARED_MEMORY.md** must be reviewed by at least 2 agents | Accuracy |
| **No proposal should be older than 7 days** without update | Freshness |

---

## 3. Code Review Constraints

### 3.1 Reviewer Gate

All PRs must pass:

| Check | Tool | Required |
|-------|------|----------|
| Tests pass | `npm test` / `pytest` | ✅ |
| Coverage threshold | `--coverage` | ✅ (Epic 2) |
| Linting | `npm run lint` / `flake8` | ✅ |
| Security scan | `npm audit` / `bandit` | ✅ |
| Type check | `npm run typecheck` | ✅ |
| Architect review | Manual | ✅ (Epic 3 only) |

### 3.2 Rejection Criteria

A PR will be rejected if:

- ❌ No tests for new functionality
- ❌ Tests pass but coverage decreased
- ❌ Breaking change not documented
- ❌ Epic 3: architect not consulted
- ❌ Epic 1: no timeout handling for subprocess calls
- ❌ Any `console.error` in error handling code without `onError` handler

---

## 4. Testing Constraints

### 4.1 Unit Tests

All new code MUST have unit tests. Framework:
- **Backend/toolchain**: pytest
- **Frontend**: Jest + React Testing Library
- **E2E**: Playwright

### 4.2 Test Naming

```
test_<what>_<condition>_<expected>
```

Example:
```python
def test_list_returns_within_5_seconds():
    ...

def test_claim_prevents_duplicate_when_same_agent():
    ...
```

### 4.3 Coverage Requirements

| Area | Threshold | Measurement |
|------|-----------|-------------|
| CardTreeNode | ≥ 85% | Statements |
| confirmationStore (post-split) | ≥ 80% | Statements |
| task_manager | N/A | Functional tests only |
| useConfirmationStore proxy | 100% | Path coverage |

---

## 5. Git Workflow

### 5.1 Branch Naming

```
<epic>-<task>-<description>
```

Examples:
```
epic1-task_manager-timeout
epic2-cardtree-coverage
epic3-batch1-state-extraction
```

### 5.2 Commit Frequency

- **Minimum**: 1 commit per task
- **Maximum**: 10 commits per PR (keep PRs small)
- **Epic 3**: 1 commit per batch (traceable)

### 5.3 PR Size

| Epic | Max Files Changed | Max Lines Changed |
|------|-------------------|-------------------|
| Epic 1 | 5 | 200 |
| Epic 2 | 10 | 500 |
| Epic 3 | 15 | 300 |
| Epic 4 | 5 | 100 |

---

## 6. Communication Protocol

### 6.1 Blockers

If blocked, follow this escalation:

1. Check project docs and shared memory
2. Ask in team Slack channel (`#vibex-dev`)
3. File a GitHub issue with `blocker` label
4. Escalate to coord (only if > 2 hours stuck)

### 6.2 Status Updates

Every task in-progress must have:
- A GitHub PR (even draft) within 4 hours of starting
- A comment on the team-tasks task with progress

### 6.3 Questions

- **Architecture questions** → `#vibex-architect` Slack channel
- **Testing questions** → `#vibex-test` Slack channel
- **Toolchain questions** → `#vibex-dev` Slack channel

---

## 7. Definitions

| Term | Definition |
|------|------------|
| **Proxy Layer** | `useConfirmationStore` hook that delegates to new modules |
| **Batch** | One discrete PR for Epic 3 (1, 2, or 3) |
| **Stale Task** | Task in `in-progress` with no update in 15+ minutes |
| **Ghost Task** | Task claimed but no agent actively working on it |
| **Verification** | Automated check via `verify-fake-completion.sh` |
