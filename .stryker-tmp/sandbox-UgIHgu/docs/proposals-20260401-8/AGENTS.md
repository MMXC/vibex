# AGENTS.md — proposals-20260401-8

**Sprint 2 Implementation Guidelines for Dev Agents**
**Author**: Architect Agent
**Date**: 2026-04-01

---

## Epic 1: E2E Test Stability (4h)

### F1.1 — waitForSelector Requirements

**Rule**: Zero `waitForTimeout` calls in E2E test code. Every instance must be replaced.

**Replacement Map**:

| Original Pattern | Replace With | When to Use |
|------------------|-------------|-------------|
| `waitForTimeout(1000)` | `waitForSelector('[data-testid="target"]')` | Element must appear |
| `waitForTimeout(2000)` | `waitForResponse('**/api/**')` | API call must complete |
| `waitForTimeout(N)` where N < 100ms | `waitForTimeout(N)` + inline `// Animation wait` comment | Only for CSS animations |

**Requirements**:
- All interactive elements must have `data-testid` attributes added in the source code
- If the element is inside an overlay/interceptor, use `waitForSelector` with `{ state: 'visible' }` or `{ state: 'attached' }`
- ESLint rule `no-wait-for-timeout` should be enabled and report 0 errors

**Dev Checklist**:
- [ ] `grep -rn "waitForTimeout" tests/e2e/` returns empty
- [ ] All click targets have `data-testid`
- [ ] Tests are self-documenting — selector name reflects intent

---

### F1.2 — force:true Rules

**When to apply `force: true`**:

```typescript
// Case 1: Element covered by intercept layer (overlay, tooltip, modal backdrop)
await page.click('[data-testid="submit-btn"]', { force: true });

// Case 2: Element temporarily obscured by sticky header/footer
await page.fill('[data-testid="input-field"]', value, { force: true });

// Case 3: Element in transition state (CSS animation active)
await page.click('[data-testid="menu-item"]', { force: true });
```

**When NOT to apply**:
- Element is genuinely hidden (`display: none`, `visibility: hidden`) — fix the UI instead
- Element is disabled — test should fail, not force through

**Dev Checklist**:
- [ ] Every `force: true` has a comment explaining why
- [ ] `expect(hasForceOption).toBe(true)` test covers all force:true usages
- [ ] Review in PR: no unnecessary `force: true` masking real UX bugs

---

## Epic 2: Export Format Expansion (3h)

### F2.1 — React Native Export Naming Convention

**File Naming**:
```
ExportedCanvas.tsx          ← default component name
{ComponentName}.tsx         ← when componentName option provided
```

**Generated Code Structure**:
```typescript
import React from 'react';
import { View, StyleSheet, Text, Image } from 'react-native';

// Component name: PascalCase, alphanumeric only
// Default: ExportedCanvas
export const ${componentName || 'ExportedCanvas'}: React.FC = () => (
  <View style={styles.root}>
    {/* Canvas elements mapped to RN equivalents */}
    {/* Rectangle → View with backgroundColor */}
    {/* Text → Text with style */}
    {/* Image → Image with source */}
  </View>
);

const styles = StyleSheet.create({
  root: { width: ${width}, height: ${height} },
});
```

**Rules**:
- Component name: `PascalCase`, starts with uppercase letter
- No special characters except alphanumeric
- Default: `ExportedCanvas`
- RN-specific: use `react-native` built-ins only (no external deps in generated code)

---

### F2.2 — WebP Quality Settings

**Quality Levels**:

| Use Case | Quality | Notes |
|----------|---------|-------|
| UI preview / thumbnails | 0.70 | Max compression, fast |
| Standard export | 0.85 | Default — visually lossless for most UIs |
| High-fidelity / presentation | 0.92 | Larger file, minimal quality loss |
| Lossless | 1.0 | Use PNG instead (WebP lossy at 1.0 = still smaller than PNG) |

**Configuration**:
```typescript
interface WebPExportConfig {
  quality: number;        // 0.0–1.0, default 0.85
  pixelRatio: number;     // 1–3, default 2
  progressive: boolean;   // default: true
}

const DEFAULT_WEBP_CONFIG: WebPExportConfig = {
  quality: 0.85,
  pixelRatio: 2,
  progressive: true,
};
```

**Dev Checklist**:
- [ ] Quality slider in UI maps to 0.70–0.92 range
- [ ] Preview shows estimated file size before export
- [ ] `expect(hasWebPSupport).toBe(true)` in test
- [ ] `blob.type === 'image/webp'` in test

---

## Epic 3: Tech Debt Cleanup (3h)

### F3.1 — canvasApi Error Throw Requirement

**Rule**: canvasApi MUST throw a typed Error on validation failure. Silent fallback is prohibited.

**Required Error Types**:

```typescript
// F3.1 — must be defined in src/errors/canvas-errors.ts

export class CanvasValidationError extends Error {
  readonly code = 'CANVAS_VALIDATION_FAILED';
  constructor(
    message: string,
    public readonly field: string,
    public readonly value: unknown
  ) {
    super(message);
    this.name = 'CanvasValidationError';
  }
}

export class CanvasApiError extends Error {
  readonly code = 'CANVAS_API_ERROR';
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'CanvasApiError';
  }
}
```

**Validation Rules**:
```typescript
function validate(canvasData: CanvasData): void {
  if (!canvasData.width || canvasData.width <= 0 || canvasData.width > 16384) {
    throw new CanvasValidationError(
      `Invalid canvas width: ${canvasData.width}`,
      'width',
      canvasData.width
    );
  }
  if (!canvasData.height || canvasData.height <= 0 || canvasData.height > 16384) {
    throw new CanvasValidationError(
      `Invalid canvas height: ${canvasData.height}`,
      'height',
      canvasData.height
    );
  }
  if (!Array.isArray(canvasData.elements)) {
    throw new CanvasValidationError(
      'Canvas elements must be an array',
      'elements',
      canvasData.elements
    );
  }
  // ...
}
```

**Dev Checklist**:
- [ ] `expect(throwsError).toBe(true)` in unit test
- [ ] All `catch` blocks handle `CanvasValidationError` explicitly
- [ ] Error includes `field` and `value` in `CanvasValidationError`
- [ ] No `return defaultValue` or silent fallback patterns remain

---

### F3.2 — MSW Intercept Level

**Rule**: All mock setup must use HTTP-level interception via `msw@2.x`. Function-level `jest.fn()` mocking is deprecated for HTTP calls.

**Correct Pattern**:
```typescript
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

export const server = setupServer(
  http.get('/api/canvas', () => {
    return HttpResponse.json({ id: 'mock-1', width: 800, height: 600 });
  }),
  http.post('/api/export', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ exportId: 'mock-export-1' });
  })
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

**Intercept Level**: HTTP (network layer)
- ✓ Catches real HTTP client calls (`fetch`, `XMLHttpRequest`)
- ✓ Works with any HTTP client library
- ✗ Does NOT catch function calls directly (no more `jest.fn()` mock functions)

**Override Pattern** (for specific tests):
```typescript
it('handles export error', async () => {
  server.use(
    http.post('/api/export', () => HttpResponse.error())
  );
  // Test error path
});
```

**Dev Checklist**:
- [ ] `expect(mswInterceptsHttp).toBe(true)` in integration test
- [ ] No `jest.fn()` mocks for HTTP calls remaining
- [ ] `server.listen({ onUnhandledRequest: 'error' })` — unhandled requests fail fast
- [ ] `server.resetHandlers()` called in `afterEach` to prevent cross-test pollution

---

## Shared Dev Guidelines

### Test Structure
```
tests/
├── e2e/
│   └── playwright.config.ts       # F1.3: timeout >= 30000
├── unit/
│   ├── canvasApi.test.ts          # F3.1
│   └── msw.test.ts               # F3.2
└── integration/
    └── export-rn.test.ts          # F2.1, F2.3
```

### Lint & Type Check (Gate)
```bash
# Must pass before PR is merged
npm run lint        # 0 errors
npx tsc --noEmit    # 0 errors
npx playwright test # E1: all pass, flakyCount === 0
```

### PR Checklist
- [ ] F1.1: No `waitForTimeout` in E2E test files
- [ ] F1.2: `force: true` documented with comment
- [ ] F1.3: `playwright.config.ts` has `timeout: 30000`
- [ ] F1.4: `stability-report.json` artifact in CI
- [ ] F2.1: RN export in export panel with correct naming
- [ ] F2.2: WebP quality defaults to 0.85
- [ ] F2.3: RN code compiles via `@babel/parser` or `tsc`
- [ ] F3.1: `CanvasValidationError` thrown, not silently handled
- [ ] F3.2: MSW server setup in test utilities
- [ ] F3.3: `npx playwright install` in CI workflow YAML

---

## 执行决策

- **决策**: 已采纳
- **执行项目**: proposals-20260401-8
- **执行日期**: 2026-04-01
