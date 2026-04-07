# AGENTS.md: Epic3 API Binding Test Fix

**Project**: `homepage-theme-api-analysis-epic3-test-fix`

---

## Agent Responsibilities

### dev
- Create `src/services/__mocks__/homepageAPI.ts` with `smartFetch()` implementation
- Verify all tests pass locally
- Create PR

### reviewer
- Code review: mock conventions, no Jest internals, safety
- Verify test results match expectations
- Approve or request changes

### tester (post-implementation)
- Run full test suite for regression
- Validate acceptance criteria from PRD

---

## Workflow

1. **dev** claims implementation → creates mock → verifies tests
2. **reviewer** reviews code → approves
3. **tester** runs regression suite → confirms all pass
4. **coord** reviews overall completion → closes epic
