# Architecture: Epic3 API Binding Test Fix

**Project**: `homepage-theme-api-analysis-epic3-test-fix`  
**Architect**: architect  
**Date**: 2026-03-22  
**Status**: design-architecture

---

## 1. Context & Problem Statement

### Problem
3 tests in `src/components/__tests__/theme-binding.test.tsx` fail because `fetchHomepageData()` does not correctly detect Jest mocks set via `global.fetch = jest.fn()`. The mock detection relies on internal Jest properties (`._isMockFunction`), which is fragile and version-dependent.

### Root Cause
Current detection in the mock layer:
```typescript
if (
  typeof fetch === 'function' &&
  (fetch as any).mock &&
  (fetch as any)._isMockFunction
) {
  // mock handling
}
```
This relies on Jest internals. When Jest mock detection fails, `fetchHomepageData()` falls back to a stub with `{ theme: 'dark' }` (missing `userPreferences`), causing the tests to see the wrong data.

### Scope
- **In scope**: Fix mock detection in the homepage API layer; ensure tests pass
- **Out of scope**: Modify `ThemeContext`, `ThemeWrapper`, `resolveMergedTheme`, type definitions

---

## 2. Tech Stack

| Component | Choice | Rationale |
|-----------|--------|-----------|
| Language | TypeScript 5.x | Existing codebase |
| Test Framework | Jest + @testing-library/react | Existing infra |
| Mock Strategy | Try-call + Response shape check | Avoids Jest internals |
| Target File | `src/services/__mocks__/homepageAPI.ts` | Jest's manual mock per module |

**Version constraints**: No dependency changes. Pure logic fix in existing test/mock infrastructure.

---

## 3. Architecture

### 3.1 Component Diagram

```
theme-binding.test.tsx
  │
  ├─ setupFetchMock() → global.fetch = jest.fn().mockResolvedValue(...)
  │
  ├─ render(<ThemeWrapper>) → useTheme() → fetchHomepageData()
  │                                      │
  │                                      └─→ smartFetch() [via __mocks__]
  │                                              │
  │                                              ├─ try-call global.fetch()
  │                                              ├─ validate Response shape
  │                                              └─ return valid Response || STUB
  │
  └─ Consumer → assert theme.mode === 'dark'
```

### 3.2 File Structure

```
src/services/
  ├─ homepageAPI.ts           # fetchHomepageData() — unchanged
  └─ __mocks__/
        └─ homepageAPI.ts     # NEW: smartFetch() mock with robust detection
```

### 3.3 Mock Detection Strategy (Core Algorithm)

**Principle**: Don't detect Jest — detect valid data.

```typescript
// src/services/__mocks__/homepageAPI.ts

async function smartFetch(): Promise<Response> {
  if (typeof global.fetch === 'function') {
    try {
      const result = await (global.fetch as Function)();
      // Check for Response-like shape (has json method)
      if (result && typeof result === 'object' && 'json' in result) {
        return result as Response;
      }
    } catch {
      // fetch threw or returned invalid shape → fall through to stub
    }
  }

  // Fallback: safe stub
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    json: () => Promise.resolve(STUB_DATA),
  } as Response;
}
```

**Why this works**:
- Direct call → if `global.fetch` is a Jest mock (`jest.fn().mockResolvedValue(...)`), it returns the mock value immediately
- Shape validation → ensures even weird mocks are filtered out
- No Jest internals → works across Jest versions
- Fail-safe stub → always returns valid data

### 3.4 Stub Data

```typescript
const STUB_DATA = {
  theme: 'dark' as ThemeMode,
};
```

Note: `userPreferences` is intentionally omitted in stub (matches the bug's stub data, but this is acceptable since stub is only used when fetch completely fails).

---

## 4. API Definitions

### `smartFetch(): Promise<Response>`

| Input | Behavior |
|-------|----------|
| `global.fetch` is a Jest mock with valid Response | Returns mock's resolved value as Response |
| `global.fetch` is real fetch | Calls real fetch, validates shape |
| `global.fetch` is broken mock (rejects / wrong shape) | Returns STUB_DATA Response |
| `global.fetch` is undefined | Returns STUB_DATA Response |

### Return Type

```typescript
interface SmartFetchResponse extends Response {
  // Standard Response interface
  ok: boolean;
  status: number;
  statusText: string;
  json(): Promise<HomepageAPIResponse>;
}
```

---

## 5. Integration with Tests

The `smartFetch` mock is Jest's **manual mock** for `homepageAPI.ts`. When placed at `src/services/__mocks__/homepageAPI.ts`, Jest automatically uses it instead of the real module in tests that import from `homepageAPI`.

**No test changes required** — the existing `setupFetchMock` in `theme-binding.test.tsx` sets `global.fetch`, and `smartFetch` will correctly detect and use it.

---

## 6. Testing Strategy

### 6.1 Test Framework
Jest (existing)

### 6.2 Coverage Targets
- `smartFetch`: 100% line coverage
- `theme-binding.test.tsx`: 3 currently-failing tests → pass

### 6.3 Core Test Cases

| ID | Description | Input | Expected |
|----|-------------|-------|----------|
| TC1 | Jest mock detected correctly | `setupFetchMock({ theme: 'dark', userPreferences: { theme: 'light' } })` | `smartFetch().json()` resolves to full object |
| TC2 | Mock with userPreferences overrides default | `setupFetchMock({ theme: 'light', userPreferences: { theme: 'dark' } })` | Consumer mode='dark' |
| TC3 | API default used (no userPreferences) | `setupFetchMock({ theme: 'dark' })` | Consumer mode='dark' |
| TC4 | Stub fallback on broken fetch | `global.fetch = jest.fn().mockRejectedValue(...)` | Returns STUB_DATA |
| TC5 | Stub fallback when fetch is not a function | `global.fetch = undefined` | Returns STUB_DATA |
| TC6 | localStorage persistence | mock + localStorage dark | Consumer mode='dark', setItem called |

### 6.4 Verification Command

```bash
npm test -- --coverage=false --watchAll=false --testPathPattern="theme-binding"
```

Expected: **3/3 tests pass**

---

## 7. Implementation Plan

### Phase 1: Create mock file
- File: `src/services/__mocks__/homepageAPI.ts`
- Implement `smartFetch()` with try-call + shape validation
- Export `smartFetch` as named export

### Phase 2: Verify tests
- Run `theme-binding.test.tsx` — expect 3/3 pass
- Run full homepageAPI + ThemeWrapper test suite — expect 100% pass

### Phase 3: Update DoD
- All acceptance criteria from PRD satisfied
- PR created and reviewed

---

## 8. Trade-offs

| Decision | Trade-off |
|----------|-----------|
| Try-call detection vs Jest internals | ✅ Version-independent, robust; ⚠️ Slight overhead (one call) |
| Stub with missing `userPreferences` | ✅ Safe fallback; ⚠️ Tests relying on stub get partial data (acceptable) |
| No changes to `fetchHomepageData()` | ✅ Minimal blast radius; ⚠️ Only works via Jest mock (correct for this epic's scope) |

---

## 9. Output Artifacts

| Artifact | Path |
|----------|------|
| This document | `docs/homepage-theme-api-analysis-epic3-test-fix/architecture.md` |
| Mock implementation | `src/services/__mocks__/homepageAPI.ts` (to be created by dev) |
| Implementation plan | `docs/homepage-theme-api-analysis-epic3-test-fix/IMPLEMENTATION_PLAN.md` |
| Agents definition | `docs/homepage-theme-api-analysis-epic3-test-fix/AGENTS.md` |

---

## 10. Verification Checklist

- [ ] `smartFetch()` correctly detects Jest mocks via try-call
- [ ] Shape validation filters broken mocks
- [ ] Stub fallback is safe and returns valid Response
- [ ] No changes to `homepageAPI.ts` (no coupling)
- [ ] All 3 failing tests pass after mock is in place
- [ ] Full test suite passes (no regressions)
