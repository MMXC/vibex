# PRD: vibex-pre-existing-test-failures

## Problem
Two pre-existing test suites fail in vibex-fronted:
1. `CardTreeView.test.tsx` — 7 tests failing
2. `Navbar.test.tsx` — 3 tests failing

## Scope

### 包含
- CardTreeView.test.tsx — Fix mock setup and data-testid expectations
- Navbar.test.tsx — Fix auth guard test assertions to match component DOM

### 不包含
- Component code changes (only test fixes)
- Changes to unrelated test files

## 验收标准
- [ ] CardTreeView.test.tsx: 7 tests pass
- [ ] Navbar.test.tsx: 3 tests pass
- [ ] Full test suite: 2669/2669 pass (100%)
