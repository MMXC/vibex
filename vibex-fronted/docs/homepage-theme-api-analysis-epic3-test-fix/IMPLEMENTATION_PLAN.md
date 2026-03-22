# Implementation Plan: Epic3 API Binding Test Fix

**Project**: `homepage-theme-api-analysis-epic3-test-fix`  
**Phase**: design-architecture → dev implementation

---

## Dev Checklist

### Task 1: Create `src/services/__mocks__/homepageAPI.ts`

```typescript
import type { ThemeMode } from '../types/theme';
import type { HomepageAPIResponse } from '../homepageAPI';

export const STUB_DATA: HomepageAPIResponse = {
  theme: 'dark',
};

export async function smartFetch(): Promise<Response> {
  if (typeof global.fetch === 'function') {
    try {
      const result = await (global.fetch as Function)();
      // Validate Response-like shape
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

### Task 2: Verify

```bash
cd /root/.openclaw/vibex/vibex-fronted
npm test -- --coverage=false --watchAll=false --testPathPattern="theme-binding"
```

Expected: **3/3 tests pass**

### Task 3: Full suite regression

```bash
npm test -- --coverage=false --watchAll=false --testPathPattern="homepageAPI|ThemeWrapper|theme-binding"
```

### Task 4: Commit & PR

- Commit: `fix(epic3): smartFetch mock detection — resolves theme-binding test failures`
- Create PR with reference to this epic

---

## Reviewer Checklist

- [ ] Mock file follows Jest manual mock conventions
- [ ] No Jest internal properties used (no `._isMockFunction`, `.mock`)
- [ ] Stub fallback is safe
- [ ] All 3 tests pass
- [ ] No regressions in related tests
