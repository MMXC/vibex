# VibeX Dev Proposals — Development Standards (AGENTS.md)

**Project**: vibex-dev-proposals-20260414_143000
**Stage**: design-architecture
**Agent**: architect
**Date**: 2026-04-14

---

## 1. Development Constraints

### E1: CI Quality Gate

| Constraint | Rule |
|------------|------|
| TypeScript compilation | `tsc --noEmit` must exit 0 on both `vibex-fronted/` and `vibex-backend/` before any PR merges |
| Test file exclusion | **Never** add test files (`*.test.ts`, `*.spec.ts`, `*.test.tsx`) to `tsconfig.json`'s `exclude` array — they must be type-checked |
| `plugins` in tsconfig | Do **not** add `"plugins": [{ "name": "next" }]` to `vibex-backend/tsconfig.json` — that plugin is for Next.js only |
| Vitest discovery | All test patterns in `vitest.config.ts` `include` array must be kept in sync with the actual test file locations |

**Forbidden tsconfig patterns**:
```json
// ❌ NEVER DO THIS in vibex-backend/tsconfig.json
"plugins": [{ "name": "next" }]

// ❌ NEVER DO THIS in any tsconfig.json
"exclude": ["**/*.test.ts", "**/*.spec.ts"]
```

### E2: Bundle & Performance

| Constraint | Rule |
|------------|------|
| New dependencies | Any dependency adding > 100KB (gzip) must be reviewed by architect before merging |
| Dynamic imports | All `mermaid` usage must go through `dynamic()` with `ssr: false` — never import `mermaid` at the top level |
| Wrapper pattern | When creating a dynamic import wrapper, export the wrapper from `index.ts` at the component directory level; keep the original file for direct test import |
| Fallback required | Every `dynamic()` import must have a `loading` component to prevent layout shift |

**Allowed MermaidRenderer patterns**:
```tsx
// ✅ CORRECT — use the wrapper
import { MermaidDiagram } from '@/components/mermaid';

// ✅ CORRECT — dynamic import in a page
const Chart = dynamic(() => import('@/components/heavy/Chart'), {
  ssr: false,
  loading: () => <ChartSkeleton />
});

// ❌ FORBIDDEN — top-level mermaid import bloats the initial bundle
import { MermaidRenderer } from '@/components/mermaid/MermaidRenderer';
```

### E3: Development Standards

| Constraint | Rule |
|------------|------|
| Hook naming | All React hooks must follow `use{Entity}{Action}` pattern (e.g., `useProjectCreate`, `useCanvasSnapshot`) |
| Store exports | All Zustand stores must be exported from `src/stores/index.ts` — never import directly from individual store files |
| New stores | New Zustand stores must use the slice pattern with `create<T>()` typed generic |
| TODO format | All TODO comments must include a GitHub issue number: `// TODO: #<issue-number> <description>` |
| FIXME allowed | `// FIXME: <description>` is allowed without an issue (it denotes a known bug) |

**Hook naming rules**:
```
✅ useProjectCreate
✅ useCanvasSnapshot
✅ useDDDStreamQuery
✅ useAuthLogout

❌ useCreateProject    (entity after action)
❌ useSnapshot         (missing domain)
❌ useStream           (missing use prefix)
❌ use-get-projects    (kebab-case not allowed)
```

### E4: Security Baseline

| Constraint | Rule |
|------------|------|
| `console.log/debug/error` | **Forbidden** in `vibex-backend/src/` for non-test files — use `logger.info()` / `logger.error()` instead |
| Test files exempt | `console.*` is allowed in `__tests__/`, `*.test.ts`, `*.spec.ts` files only |
| Pre-commit hook | All commits must pass the Husky pre-commit hook which blocks `console.*` in non-test files |

**Logging standards**:
```typescript
// ✅ CORRECT — use project logger
import { logger } from '@/lib/logger';
logger.info('User logged in', { userId });
logger.error('API failed', { error: err.message });

// ❌ FORBIDDEN — hard console
console.log('User logged in');
console.error('API failed');
```

---

## 2. File Naming Conventions

### 2.1 TypeScript Config Files

| File | Purpose | Constraints |
|------|---------|-------------|
| `tsconfig.json` | Project-wide TypeScript config | Never exclude `*.test.*` files |
| `vitest.config.ts` | Vitest test runner config | Keep `include` patterns in sync with actual test locations |
| `.size-limit.json` | Bundle size thresholds | One entry per bundle segment; `gzip: true` required |
| `wrangler.toml` | Cloudflare Workers config | No changes needed for this epic |

### 2.2 Component & Hook Files

| Pattern | Example | Rule |
|---------|---------|------|
| React Hook | `use{Entity}{Action}.ts` | `useAuthLogin.ts`, `useProjectCreate.ts` |
| Store slice | `{entity}Slice.ts` | `projectSlice.ts`, `contextSlice.ts` |
| Dynamic wrapper | `index.tsx` (in component dir) | Export only the dynamic version; original file for tests |
| Skeleton | `{Component}Skeleton.tsx` | One per dynamic component |
| Test | `*.test.ts`, `*.test.tsx` | Co-located with the file under test |

### 2.3 ESLint & Scripts

| Pattern | Example | Rule |
|---------|---------|------|
| Custom ESLint rules | `scripts/rules/{rule-name}.js` | Must export `{ meta, create }` object |
| CI scripts | `scripts/pre-submit-check.sh` | Exit 0 on pass, exit 1 on fail |

### 2.4 CI Workflows

| File | Trigger | Required checks |
|------|---------|----------------|
| `.github/workflows/typescript-check.yml` | Push + PR (main, develop) | `tsc --noEmit` (FE + BE), `vitest run` |
| `.github/workflows/bundle-check.yml` | Push + PR | `size-limit --ci` |
| `.github/workflows/pre-submit.yml` | Push + PR | ESLint, Stylelint, TODO grep |

---

## 3. Testing Requirements

### 3.1 Test Types & Coverage

| Test Type | Framework | Command | Coverage Gate |
|-----------|-----------|---------|---------------|
| Frontend unit | Vitest | `npm run test:unit` | Maintain existing 52+ tests |
| Frontend type | `tsc --noEmit` | `npx tsc --noEmit` | 0 errors |
| Backend type | `tsc --noEmit` | `cd vibex-backend && npx tsc --noEmit` | 0 errors |
| Bundle size | size-limit | `npm run size` | < baseline + 200KB |
| Lint | ESLint | `npm run lint` | 0 warnings |

### 3.2 Required Test Scenarios per Epic

**E1 — TypeScript & Vitest**:
```
Given: Any PR
When: tsc --noEmit runs
Then: Exit code 0 on both vibex-fronted and vibex-backend

Given: Vitest run
When: vitest run executes
Then: Exit code 0, ≥ 52 tests discovered and passing
```

**E2 — Bundle**:
```
Given: npm run build
When: size-limit compares against baseline
Then: Exit code 0, all segments within threshold

Given: npm run build
When: ANALYZE=true npm run build runs
Then: .next/analyze/bundle.html generated with size breakdown
```

**E3 — Naming & TODO**:
```
Given: New hook file created in src/hooks/
When: npm run lint runs
Then: Hook name matches use{Entity}{Action} pattern OR has eslint-disable comment

Given: TODO comment added without #<number>
When: npm run lint runs
Then: ESLint error: "TODO must reference a GitHub issue: TODO: #<issue-number>"
```

**E4 — Console Log**:
```
Given: console.log added to vibex-backend/src/routes/
When: git commit --allow-empty -m "test" runs
Then: Husky pre-commit hook blocks commit with error message

Given: console.log added to vibex-backend/src/__tests__/file.test.ts
When: git commit --allow-empty -m "test" runs
Then: Commit succeeds (test files are exempt)
```

### 3.3 CI Gate Requirements

All gates are **required** (blocking) for merge to `main`:

```
✅ TypeScript (frontend): tsc --noEmit → 0 errors
✅ TypeScript (backend): tsc --noEmit → 0 errors
✅ Vitest: vitest run → 0 failures
✅ ESLint: npm run lint → 0 errors
✅ Bundle size: npm run size → within threshold
✅ Husky pre-commit: no console.* in src/ (non-test files)
✅ TODO grep: all TODOs reference GitHub issue
```

**Non-blocking (advisory)**:
- Stylelint CSS quality gate (warning only in current pre-submit)
- Chromatic visual regression (runs on main push, auto-accepts on main)
- Accessibility tests (runs but does not block)

---

## 4. CI Pipeline Reference

### 4.1 GitHub Actions Workflows (vibex-fronted)

**`typescript-check.yml`** — New workflow:
```yaml
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  frontend-types:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
          cache-dependency-path: vibex-fronted/package-lock.json
      - run: cd vibex-fronted && npm ci
      - run: cd vibex-fronted && npx tsc --noEmit
      - run: cd vibex-fronted && npx vitest run

  backend-types:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
          cache-dependency-path: vibex-backend/package-lock.json
      - run: cd vibex-backend && npm ci
      - run: cd vibex-backend && npx tsc --noEmit
```

**`bundle-check.yml`** — New workflow:
```yaml
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  bundle:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
          cache-dependency-path: vibex-fronted/package-lock.json
      - run: cd vibex-fronted && npm ci
      - run: cd vibex-fronted && npm run build
      - run: cd vibex-fronted && npm run size:ci
```

### 4.2 GitHub Actions Workflows (vibex-backend)

**`typescript-check.yml`** — New workflow:
```yaml
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
          cache-dependency-path: vibex-backend/package-lock.json
      - run: cd vibex-backend && npm ci
      - run: cd vibex-backend && npx tsc --noEmit

  console-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: |
          VIOLATIONS=$(grep -rn "console\.\(log\|debug\)" vibex-backend/src/ \
            --include="*.ts" \
            --exclude-dir=node_modules \
            --exclude-dir=__tests__ \
            --exclude="*.test.ts" --exclude="*.spec.ts" 2>/dev/null | wc -l)
          if [ "$VIOLATIONS" -gt 0 ]; then
            echo "::error::Found $VIOLATIONS console.* calls in src/"
            grep -rn "console\.\(log\|debug\)" vibex-backend/src/ \
              --include="*.ts" \
              --exclude-dir=node_modules \
              --exclude-dir=__tests__ \
              --exclude="*.test.ts" --exclude="*.spec.ts"
            exit 1
          fi
```

### 4.3 Husky Pre-commit Hook (vibex-backend)

**`.husky/pre-commit`**:
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "🔍 Checking for console.log/debug/error..."
if grep -rn "console\.\(log\|debug\|error\)" . \
  --include="*.ts" \
  --exclude-dir=node_modules \
  --exclude-dir=__tests__ \
  --exclude="*.test.ts" --exclude="*.spec.ts"; then
  echo "❌ console.log/debug/error found in src/ — use logger instead"
  echo "✅ Allowed in __tests__/ and *.test.ts / *.spec.ts files"
  exit 1
fi
echo "✅ No console.* statements in src/ (non-test files)"
```

---

## 5. Command Reference

```bash
# Type checking
cd vibex-fronted && npx tsc --noEmit
cd vibex-backend  && npx tsc --noEmit

# Testing
cd vibex-fronted && npx vitest run
cd vibex-fronted && npm run test:unit -- --coverage

# Linting
cd vibex-fronted && npm run lint
cd vibex-backend  && npm run lint

# Bundle analysis
cd vibex-fronted && ANALYZE=true npm run build
cd vibex-fronted && npm run build && npm run size

# TODO check
grep -rEn "TODO(?!.*#[0-9]+)" src/ --include="*.ts" --include="*.tsx"

# Console.log check (backend)
grep -rn "console\.\(log\|debug\)" vibex-backend/src/ \
  --include="*.ts" --exclude-dir=__tests__ --exclude="*.test.ts"

# Husky
npx husky install
git commit -m "..."  # triggers .husky/pre-commit

# Install new deps
cd vibex-backend && npm install --save-dev @cloudflare/workers-types @types/node
cd vibex-fronted && npm install --save-dev @size-limit/preset-app size-limit
```

---

## 6. File Patterns Summary

| Category | Pattern | Examples |
|----------|---------|---------|
| React hooks | `use{Entity}{Action}.ts` | `useAuthLogin.ts`, `useProjectCreate.ts` |
| Store slices | `{entity}Slice.ts` | `projectSlice.ts`, `contextSlice.ts` |
| Store index | `src/stores/index.ts` | Single export point |
| Dynamic wrapper | `{Component}/index.tsx` | `mermaid/index.tsx` (exports dynamic) |
| Skeleton | `{Component}Skeleton.tsx` | `MermaidSkeleton.tsx` |
| ESLint rules | `scripts/rules/*.js` | `no-todo-without-issue.js` |
| Bundle config | `.size-limit.json` | size-limit thresholds |
| CI workflow | `.github/workflows/*.yml` | `typescript-check.yml`, `bundle-check.yml` |
| Husky hook | `.husky/pre-commit` | Console log gate |
| tsconfig FE | `tsconfig.json` | No `plugins`, no test excludes |
| tsconfig BE | `tsconfig.json` | No `next` plugin, has `@cloudflare/workers-types` |

---

## 7. Definition of Done Checklist

Before marking any Epic complete, verify:

**E1**:
- [ ] `tsc --noEmit` exits 0 in both vibex-fronted and vibex-backend
- [ ] `vitest run` exits 0 with ≥ 52 tests passing
- [ ] `typescript-check.yml` workflow exists and passes on PR
- [ ] No test files in any `tsconfig.json` `exclude` array

**E2**:
- [ ] `bundle-audit-*.json` report generated and saved to `reports/`
- [ ] All 3 MermaidRenderer instances use `dynamic()` with `ssr: false`
- [ ] `npm run size` exits 0 against baseline
- [ ] `.size-limit.json` exists with threshold ≤ 200KB per page chunk

**E3**:
- [ ] `eslint-plugin-naming-convention` installed and configured
- [ ] `src/stores/index.ts` exports all stores
- [ ] All existing TODOs have `#<issue-number>` (or removed/converted to FIXME)
- [ ] CI greps TODOs without issue → fails

**E4**:
- [ ] `.husky/pre-commit` installed in vibex-backend
- [ ] `grep -rn "console\." vibex-backend/src/` returns 0 (non-test files)
- [ ] `logger.ts` used instead of `console.*` in all routes
- [ ] Pre-commit hook tested: `console.log` in non-test file → blocked
