# VibeX Testing Strategy

**Version**: v1.0
**Updated**: 2026-04-03
**Status**: Active

---

## Testing Pyramid

```
        ┌─────────────┐
        │     E2E     │  Playwright: User flows, critical paths
        │  (Playwright)│  ~20% of test effort
        ├─────────────┤
        │  Integration  │  Jest: Store integration, API contracts
        │    (Jest)     │  ~30% of test effort
        ├─────────────┤
        │   Unit Tests   │  Jest: Components, hooks, utils
        │    (Jest)     │  ~50% of test effort
        └─────────────┘
```

---

## Framework Responsibilities

| Framework | Test Type | File Pattern | Directory | CI Gate |
|-----------|-----------|-------------|-----------|---------|
| **Jest** | Unit + Integration | `*.test.ts` | `src/__tests__/` or co-located | ✅ |
| **Playwright** | E2E | `*.spec.ts` | `tests/e2e/` | ✅ |
| **Playwright** | Accessibility | `*.spec.ts` | `tests/a11y/` | ⚠️ |
| **Playwright** | Performance | `*.spec.ts` | `tests/performance/` | ⚠️ |

---

## Playwright Configuration Strategy

### Config Files (3)

| Config | Purpose | Usage |
|--------|---------|-------|
| `playwright.config.ts` | Base config | Local development |
| `playwright.ci.config.ts` | CI optimized | GitHub Actions, retries=3 |
| `playwright.a11y.config.ts` | Accessibility | Dedicated a11y testing |

**Deleted Redundant Configs** (2026-04-03):
- `playwright.test.config.ts` → merged into base
- `playwright-canvas-phase2.config.ts` → merged into base  
- `playwright.perf.config.ts` → merged into CI

### Running Tests

```bash
# Local development
pnpm playwright test

# CI environment
pnpm playwright test --config=playwright.ci.config.ts

# Accessibility tests
pnpm playwright test --config=playwright.a11y.config.ts
```

---

## Jest Standards

### File Conventions

- Unit/component tests: `*.test.ts` co-located with source
- Integration/store tests: `src/__tests__/` directory
- Test patterns: `describe` + `it` structure, minimum 2 `it` blocks per describe

### Coverage Thresholds

```yaml
lines: 65%
branches: 50%
functions: 80%
```

### Configuration

```typescript
// jest.config.ts
{
  testMatch: ['**/*.test.ts'],  // Required: explicit pattern
  testPathIgnorePatterns: ['/node_modules/'],  // Only node_modules
  coverageThreshold: {
    lines: 65,
    branches: 50,
    functions: 80,
  }
}
```

**Rule**: Never use `testPathIgnorePatterns` to skip specific test files — each test must run in CI.

---

## E2E Test Standards

### Naming Conventions

- E2E tests: `*.spec.ts` (Playwright)
- Integration tests: `*.test.ts` (Jest)

### Test Structure

```typescript
// ✅ Correct: describe = feature, it = specific behavior
describe('Canvas Auto-save', () => {
  it('shows "保存中" during debounce delay', async () => { ... });
  it('shows "已保存" after successful save', async () => { ... });
});

// ❌ Incorrect: implementation-focused naming
describe('useAutoSave hook', () => {
  it('calls fetch with correct payload', async () => { ... });
});
```

### Flaky Test Handling

```typescript
// playwright.setup.ts — skip flaky tests automatically
import flakyTests from '../flaky-tests.json';

flakyTests.forEach(ft => {
  if (ft.skip) {
    test.skip(ft.test, `Flaky: pass rate ${ft.passRate}`);
  }
});
```

### CI Configuration

```yaml
# GitHub Actions
- name: Playwright Tests
  run: pnpm playwright test --config=playwright.ci.config.ts
  env:
    CI: true
```

---

## Coverage Requirements

### Canvas Core Modules

| Module | Branch Target | Current | Gap |
|--------|-------------|---------|-----|
| `contextStore.ts` | 50% | ~25% | +15 |
| `flowStore.ts` | 50% | ~30% | +10 |
| `componentStore.ts` | 50% | ~25% | +15 |
| `historySlice` | 40% | ~25% | +15 |

### Priority

1. **Canvas stores** (context, flow, component) — highest impact
2. **Auto-save hook** — critical user path
3. **Conflict resolution** — new feature

---

## Test Data Management

### Mock Strategy

- Use `msw` (Mock Service Worker) for API mocking
- Avoid real network calls in unit tests
- E2E tests use real API against staging environment

### Factory Pattern

```typescript
// ✅ Correct: Factory for test data
function createMockCanvasData(overrides?: Partial<CanvasData>): CanvasData {
  return {
    contextNodes: [],
    flowNodes: [],
    componentNodes: [],
    ...overrides,
  };
}

// ❌ Incorrect: Hardcoded test data scattered in tests
const canvasData = { contextNodes: [...], ... };
```

---

## CI/CD Integration

### Coverage Gate

```yaml
- name: Jest Coverage
  run: pnpm jest --coverage --coverage-threshold.line=65 --coverage-threshold.branches=50
```

### Slack Alerts

- E2E failure → #coord within 5 minutes
- Coverage regression → PR comment

### Daily Report

- Coverage trend tracking
- Flaky test count
- Sent to #coord at 09:00 GMT+8

---

## Anti-Patterns

| Anti-Pattern | Problem | Solution |
|-------------|---------|----------|
| `test.skip()` without reason | Hidden failures | Add comment explaining why |
| `test.only()` in committed code | Skips in CI | ESLint `forbidOnly: true` |
| `sleep()` instead of `waitFor` | Flaky tests | Use `waitForResponse`/`waitForSelector` |
| `any` type in tests | Type safety gap | Define proper mock types |
| Duplicate tests in 2 files | Maintenance burden | Single source of truth |

---

## Test File Location Guide

```
src/
├── components/
│   └── Canvas/
│       ├── CanvasPage.tsx
│       └── __tests__/
│           └── CanvasPage.test.tsx    # ✅ Component unit test
├── lib/
│   └── canvas/
│       ├── stores/
│       │   ├── contextStore.ts
│       │   └── __tests__/
│       │       └── contextStore.test.ts  # ✅ Store integration test
│       └── hooks/
│           ├── useAutoSave.ts
│           └── __tests__/
│               └── useAutoSave.test.ts    # ✅ Hook unit test
tests/
├── e2e/
│   └── canvas-autosave.spec.ts          # ✅ E2E test
└── a11y/
    └── canvas-accessibility.spec.ts     # ✅ A11y test
```

---

*Last updated: 2026-04-03*
*Owner: Dev Agent*
