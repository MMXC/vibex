# Implementation Plan — proposals-20260401-8

**Sprint 2: E2E Stability, Export Formats, Tech Debt**
**Author**: Architect Agent
**Date**: 2026-04-01
**Total Estimate**: 10h (E1: 4h | E2: 3h | E3: 3h)

---

## Overview

Three Epics execute in parallel (E2 + E3 can run concurrently). E1 is P0 and gates the Sprint.

```
Week 1 (10h Sprint)
├── E1: E2E Test Stability (4h)  ████████████░░░░░░░░░  P0 — sequential
├── E2: Export Format Expansion (3h)  ██████████░░░░░░░░  P1 — parallel with E3
└── E3: Tech Debt Cleanup (3h)     ██████████░░░░░░░░  P1 — parallel with E2
```

---

## Epic 1: E2E Test Stability (4h)

**Goal**: Eliminate timing-based flakiness; achieve 3 consecutive green CI runs.

### F1.1 — Replace waitForTimeout (1.5h)

**Step 1** (0.5h): Audit all `waitForTimeout` usages.
```bash
grep -rn "waitForTimeout" tests/e2e/
```
Categorize into:
- DOM-dependent → replace with `waitForSelector`
- Network-dependent → replace with `waitForResponse`
- Animation/render → keep `waitForTimeout` with inline comment

**Step 2** (0.5h): Run ESLint rule or unit check:
```typescript
// tests/e2e/utils/noTimeout.ts — custom rule to enforce no waitForTimeout
expect(waitForTimeoutCount).toBe(0);
```

**Step 3** (0.5h): Verify in CI — run tests 3×, all must pass.

---

### F1.2 — Add force:true to Intercept Elements (0.5h)

**Step 1** (0.2h): Identify click/fill calls on intercept elements (overlays, tooltips, modals).
```bash
grep -rn "page\\.click\\|page\\.fill" tests/e2e/
```

**Step 2** (0.2h): Add `force: true` where element is covered by another.
```typescript
// Before
await page.click('[data-testid="submit-btn"]');

// After
await page.click('[data-testid="submit-btn"]', { force: true });
```

**Step 3** (0.1h): Verify with test assertion:
```typescript
expect(hasForceOption).toBe(true); // coverage check
```

---

### F1.3 — CI Timeout Configuration (0.5h)

**Step 1** (0.2h): Update `playwright.config.ts`.
```typescript
// playwright.config.ts
const config: PlaywrightConfig = {
  timeout: 30000,         // F1.3: CI timeout >= 30000
  expect: {
    timeout: 10000,
  },
  // ...
};
```

**Step 2** (0.2h): Validate in CI:
```bash
# In CI script
expect(ciTimeout).toBeGreaterThanOrEqual(30000);
```

**Step 3** (0.1h): Document in `CLAUDE.md` or `CONTRIBUTING.md` that timeout is CI-enforced.

---

### F1.4 — 3× Stability Verification (1.5h)

**Step 1** (0.5h): Write flaky detector script (`tests/e2e/flaky-detector.ts`).

**Step 2** (0.5h): Trigger CI run × 3:
```bash
for i in 1 2 3; do
  npx playwright test --reporter=list
  # check stability-report.json: expect(flakyCount).toBe(0)
done
```

**Step 3** (0.5h): Publish `stability-report.json` as CI artifact.

**Exit Criteria**:
- `waitForTimeoutCount === 0`
- `flakyCount === 0` for 3 consecutive runs

---

## Epic 2: Export Format Expansion (3h)

**Goal**: React Native export + WebP compression, both verified by tests.

### F2.1 — React Native Export Option (1h)

**Step 1** (0.3h): Extend `ExportOptions` type in `types/export.ts`:
```typescript
type ExportFormat = 'png' | 'jpeg' | 'webp' | 'react-native';
```

**Step 2** (0.3h): Add "React Native" to export panel UI:
```tsx
<ExportPanel formats={['png', 'jpeg', 'webp', 'react-native']} />
```

**Step 3** (0.2h): Wire export handler:
```typescript
expect(exportOptions).toContain('react-native');
```

**Step 4** (0.2h): Add `data-testid` for E2E to verify panel renders.

---

### F2.2 — WebP Export (1h)

**Step 1** (0.3h): Implement WebP encode path using html-to-image:
```typescript
// src/export/webp.ts
export async function exportToWebP(
  element: HTMLElement,
  options: ExportOptions
): Promise<Blob> {
  return htmlToImage.toBlob(element, {
    pixelRatio: options.pixelRatio ?? 2,
    quality: options.quality ?? 0.85,  // F2.2: default 0.85
    filter: options.cloneOptions?.filter,
  });
}
```

**Step 2** (0.3h): Add WebP option to export panel.

**Step 3** (0.2h): Write test:
```typescript
expect(hasWebPSupport).toBe(true);
const blob = await exportToWebP(element, { quality: 0.85 });
expect(blob.type).toBe('image/webp');
```

**Step 4** (0.2h): Performance baseline — document encode time vs PNG/JPEG.

---

### F2.3 — React Native Code Compile Verification (1h)

**Step 1** (0.3h): Generate RN component code from canvas data:
```typescript
// src/export/rn-generator.ts
export function generateRNComponent(canvasData: CanvasData): string {
  return `import React from 'react';
import { View, StyleSheet } from 'react-native';

export const ExportedCanvas: React.FC = () => (
  <View style={styles.canvas}>
    {/* parsed canvas elements */}
  </View>
);

const styles = StyleSheet.create({
  canvas: { width: ${canvasData.width}, height: ${canvasData.height} },
});
`;
```

**Step 2** (0.3h): Write test that imports generated code and validates TSX compiles:
```typescript
// integration/export-rn.test.ts
it('RN code compiles without errors', () => {
  const rnCode = generateRNComponent(mockCanvasData);
  // Use @babel/parser or tsc to validate syntax
  expect(rnCodeCompiles).toBe(true);
});
```

**Step 3** (0.2h): Add RN code generation to export pipeline and verify end-to-end.

---

## Epic 3: Tech Debt Cleanup (3h)

**Goal**: canvasApi throws errors, MSW at HTTP level, Playwright installed in CI.

### F3.1 — canvasApi Error Handling (1h)

**Step 1** (0.3h): Define `CanvasValidationError` and `CanvasApiError` types (see architecture.md §3.3).

**Step 2** (0.4h): Audit `canvasApi.validate()` and `canvasApi.render()` — replace silent fallback with explicit throw:
```typescript
// Before (silent fallback)
if (!valid) return defaultValue;

// After (explicit error)
if (!valid) {
  throw new CanvasValidationError(
    `Canvas validation failed for field: ${field}`,
    field,
    value
  );
}
```

**Step 3** (0.2h): Write unit tests:
```typescript
it('throws CanvasValidationError on invalid width', () => {
  expect(() => validate({ width: -1, height: 600 })).toThrow(CanvasValidationError);
});
expect(throwsError).toBe(true);
```

---

### F3.2 — MSW HTTP-Level Interception (1h)

**Step 1** (0.3h): Replace function-level mocks with `setupServer` + `http` from `msw@2.x`:
```typescript
// See architecture.md §3.4 for full server setup
import { http, HttpResponse } from 'msw';
```

**Step 2** (0.3h): Update all test files using old `rest.get` / `rest.post` syntax:
```typescript
// Before (function-level)
const mockHandler = jest.fn(() => ({ data: 'mock' }));
useMock(mockHandler);

// After (HTTP-level)
server.use(
  http.get('/api/canvas', () => HttpResponse.json({ id: 'mock-1' }))
);
```

**Step 3** (0.2h): Verify HTTP intercept:
```typescript
expect(mswInterceptsHttp).toBe(true);
// Verify by checking server.requests Handled count
```

---

### F3.3 — Playwright install in CI (1h)

**Step 1** (0.2h): Add browser cache to GitHub Actions:
```yaml
# .github/workflows/e2e.yml
- uses: actions/cache@v4
  with:
    path: ~/.cache/ms-playwright
    key: playwright-${{ hashFiles('package-lock.json') }}
- run: npx playwright install --with-deps chromium
```

**Step 2** (0.2h): Verify the install step exists:
```typescript
expect(hasInstallStep).toBe(true);
```

**Step 3** (0.3h): Test in CI — verify no "browser not found" errors.

**Step 4** (0.3h): Document in `CONTRIBUTING.md`:
```markdown
## E2E Tests
1. `npx playwright install` — install browsers (first run or after cache miss)
2. `npx playwright test` — run E2E suite
```

---

## Task Dependency Graph

```
E1 (4h, P0) ──────────────────────────► Sprint Gate ✅
  ├─ F1.1 (1.5h)
  ├─ F1.2 (0.5h)
  ├─ F1.3 (0.5h)
  └─ F1.4 (1.5h, needs all F1.x)

E2 (3h, P1) ──────────────────────────► Sprint Gate ✅
  ├─ F2.1 (1h)
  ├─ F2.2 (1h)
  └─ F2.3 (1h, needs F2.1)

E3 (3h, P1) ──────────────────────────► Sprint Gate ✅
  ├─ F3.1 (1h)
  ├─ F3.2 (1h)
  └─ F3.3 (1h)
```

---

## Timeline

| Day | Hour | E1 | E2 | E3 |
|-----|------|----|----|-----|
| Day 1 | 0–2h | F1.1 | — | — |
| Day 1 | 2–3.5h | F1.1 cont | F2.1 | F3.1 |
| Day 1 | 3.5–5h | F1.2 + F1.3 | F2.1 cont | F3.1 cont |
| Day 1 | 5–7h | F1.4 (×3 runs) | F2.2 | F3.2 |
| Day 2 | 7–8h | — | F2.3 | F3.3 |
| Day 2 | 8–10h | Verification | Verification | Verification |

---

## Exit Criteria

| Epic | Exit Condition |
|------|---------------|
| E1 | `waitForTimeoutCount === 0`, `flakyCount === 0` (3 runs) |
| E2 | React Native in export panel, WebP downloads correctly, RN code compiles |
| E3 | `throwsError === true`, `mswInterceptsHttp === true`, `hasInstallStep === true` |

---

## 执行决策

- **决策**: 已采纳
- **执行项目**: proposals-20260401-8
- **执行日期**: 2026-04-01
