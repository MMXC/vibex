# Implementation Plan: VibeX Sprint 2026-04-13

**Project:** vibex-sprint-0413
**Output:** `/root/.openclaw/vibex/docs/vibex-sprint-0413/`
**Files produced:** `architecture.md` (this plan), `IMPLEMENTATION_PLAN.md`, `AGENTS.md`

---

## Execution Summary

**Sprint duration:** ~1.5 days (6.5h estimated)
**Scope:** CSS-only refactor — no JS/TSX logic changes
**Tech stack:** CSS Modules + `theme-utilities.css` (plain CSS), Vitest, Playwright

---

## Sprint Timeline

### Day 1 — AM
- [x] **U1:** Create `vibex-fronted/src/styles/theme-utilities.css` — ✅ 71a65f7f (214行, 40+工具类)
  - Define 16 `.vx-` utility classes covering glass, neon hover, toolbar, search, row states, buttons, empty state, divider
  - Follow `design-tokens.css` variable conventions
  - Use `@supports` for `backdrop-filter` gracefully

### Day 1 — PM
- [x] **U2:** Refactor `JsonTreeRenderer.module.css` — ✅ 71a65f7f (270→142行, 47%减少, 0 hex残留)
  - Apply all 26 token mappings from the CSS variable mapping table in `architecture.md`
  - Adopt ≥10 utility classes from `theme-utilities.css` via `:global()` or class composition
  - Add `backdrop-filter: blur(12px)` to `.renderer` with `@supports` fallback
  - Verify: non-empty line count ≤149, zero prohibited hex values
  - Run Vitest to confirm no regressions

### Day 2 — Morning
- [ ] **U3:** `ComponentTree.module.css` partial adoption
  - Replace ≥1 hardcoded style block with a `.vx-*` utility class
  - Run existing `ComponentTree.test.tsx` to confirm no breakage

### Day 2 — Afternoon
- [ ] **U4:** CI validation + visual regression
  - `pnpm lint` → 0 errors
  - `pnpm test` → 0 failures
  - Playwright visual regression on Canvas page

---

## Key Commands

```bash
# Run unit tests
cd vibex-fronted && pnpm test

# Run linting
cd vibex-fronted && pnpm lint

# Run Playwright visual regression
cd vibex-fronted && pnpm playwright test

# Check CSS line count (non-empty lines)
grep -cv '^[[:space:]]*$' vibex-fronted/src/components/visualization/JsonTreeRenderer/JsonTreeRenderer.module.css

# Verify no prohibited hex values
grep -E '#(fafaf9|fafafa|f3f4f6|dbeafe|fef9c3|fde047|6b7280|9ca3af|1f2937|374151|059669|2563eb|3b82f6|7c3aed|e5e7eb|d1d5db|f9fafb)' \
  vibex-fronted/src/components/visualization/JsonTreeRenderer/JsonTreeRenderer.module.css
# Expected: no output (no matches)
```

---

## Definition of Done

- [ ] `theme-utilities.css` exists with ≥15 `.vx-` classes
- [ ] `JsonTreeRenderer.module.css` uses 0 hardcoded hex values from the prohibited list
- [ ] `JsonTreeRenderer.module.css` line count ≤149 (non-empty lines)
- [ ] `backdrop-filter: blur(12px)` present on `.renderer` with `@supports` fallback
- [ ] `ComponentTree.module.css` references ≥1 `.vx-` utility class
- [ ] All Vitest tests pass
- [ ] `pnpm lint` passes
- [ ] PR includes before/after screenshot of Canvas page
- [ ] No regression in existing Canvas page functionality
