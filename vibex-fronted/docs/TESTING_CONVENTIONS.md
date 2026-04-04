# Testing Naming Conventions & Directory Standards

> canvas-test-framework-standardize / Epic E5: 命名与目录规范

## Directory Structure

```
tests/
├── e2e/                    # End-to-end Playwright tests
│   ├── *.spec.ts           # Playwright spec files (naming: *.spec.ts)
│   └── *.test.ts          # Integration test files
├── unit/                   # Unit tests (co-located with source)
│   └── *.test.tsx         # Component/unit tests
└── contract/               # API contract tests
    ├── *.test.ts          # Contract test files
    └── *.schema.json      # JSON Schema files

src/
└── __tests__/             # Legacy test location (deprecating)
    └── *.test.ts          # Store & utility tests
```

## Naming Conventions

### Test Files

| Type | Pattern | Example |
|------|---------|---------|
| E2E | `*.spec.ts` | `undo-redo.spec.ts` |
| Unit | `*.test.ts` or `*.test.tsx` | `contextStore.test.ts` |
| Contract | `*.test.ts` | `mock-consistency.test.ts` |
| Integration | `*.integration.test.ts` | `canvas.integration.test.ts` |

### Test Names

```typescript
// ✅ Correct
test('should show conflict indicator when saveStatus is conflict', async () => {})
test('keeps local version when user clicks 保留本地', async () => {})

// ❌ Incorrect
test('conflict test', async () => {})
test('button works', async () => {})
```

### Describe Blocks

```typescript
// ✅ Component-level
describe('ConflictDialog', () => {
  test('renders with three action buttons', () => {})
  test('closes on cancel', () => {})
})

// ✅ Hook-level
describe('useCanvasStore', () => {
  test('returns initial state', () => {})
})

// ❌ Incorrect
describe('tests', () => {})  // Never use generic names
```

## Code Style

### Arrange-Act-Assert

```typescript
test('should update save status to conflict', async () => {
  // Arrange
  const { result } = renderHook(() => useSaveStore())

  // Act
  act(() => {
    result.current.setSaveStatus('conflict')
  })

  // Assert
  expect(result.current.saveStatus).toBe('conflict')
})
```

### Async Test Patterns

```typescript
// ✅ Correct: use async/await with waitFor
test('loads canvas page without crash', async () => {
  await page.goto('/canvas')
  await page.waitForLoadState('networkidle')
  await expect(page.locator('body')).toBeVisible()
})

// ✅ Correct: use findBy* queries
test('shows loading state', async () => {
  render(<CanvasPage />)
  const spinner = await screen.findByRole('progressbar')
  expect(spinner).toBeVisible()
})
```

## Flaky Test Handling

Tests marked with `@flaky` must include:
- `retries: 3` in playwright config
- Entry in `flaky-tests.json`
- TODO comment explaining why it's flaky

```typescript
// @flaky(reason: 'Intermittent timing issue with 3rd party API')
test('connects to real API', async () => {
  // ...
})
```

## Coverage Requirements

| Area | Minimum | Command |
|------|---------|---------|
| Stores | 80% branches | `pnpm jest --coverage` |
| Canvas hooks | 70% branches | `pnpm jest --coverage` |
| E2E smoke | 5 critical paths | `npx playwright test` |

## CI Quality Gates

```yaml
# .github/workflows/test.yml
- name: Coverage gate
  run: pnpm jest --coverage --coverageThreshold='{"global":{"branches":80}}'
```

---

Last updated: 2026-04-04
Epic: canvas-test-framework-standardize / E5
