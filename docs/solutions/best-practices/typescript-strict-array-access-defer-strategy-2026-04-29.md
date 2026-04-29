---
title: "Enable Strict Array Access Checks — Then Defer the Fixes"
date: 2026-04-29
problem_type: best_practice
component: tooling
module: "TypeScript / Developer Workflow"
severity: medium
applies_when:
  - "Enabling noUncheckedIndexedAccess or similar strict TS flags mid-sprint"
  - "New sprint starting with a type-safety theme"
  - "Refactoring data-access or store layers with non-trivial array access patterns"
tags:
  - typescript
  - developer-experience
  - tooling
  - best-practice
  - tsconfig
  - deferred-work
  - no-unchecked-indexed-access
related_sprints:
  - sprint: "S16"
    note: "ESLint @typescript-eslint/no-explicit-any — same enable-then-defer pattern applied"
  - sprint: "S18"
    note: "E3-U2/U3 — TS error cascade fixes (342 errors)"
---

# Enable Strict Array Access Checks — Then Defer the Fixes

## Context

TypeScript's `noUncheckedIndexedAccess` flag (TS 4.1+) changes the type of every array index access from `T` to `T | undefined`. This is the **semantically correct** behavior — accessing an index that doesn't exist is a real runtime possibility — but it catches virtually every codebase off guard.

In Sprint 17, enabling this flag on VibeX produced **342 TypeScript errors** across the codebase. The team faced a classic tradeoff:

- **Option A**: Fix all 342 errors immediately → blow the sprint budget
- **Option B**: Skip the flag entirely → accumulate silent type-system debt
- **Option C**: Enable now, defer fixes, add guardrails → ✅

## Guidance

**Enable `noUncheckedIndexedAccess` immediately. Defer the fixes to the next sprint, but add E2E guardrails.**

The repeatable decision framework:

| Step | Action | Sprint 17 Result |
|------|--------|-----------------|
| 1. Enable flag | Flip `noUncheckedIndexedAccess: true` in `tsconfig.json` | ✅ Done (U1) |
| 2. Count errors | Run `tsc --noEmit` | 342 errors identified |
| 3. Assess scope | Does fix scope fit current sprint? | No — requires ~2-3d full-scopes work |
| 4. Defer | Mark remaining U-stories for next sprint | E3-U2/U3 → Sprint 18 |
| 5. Add guardrails | E2E tests covering affected code paths | `analytics-dashboard.spec.ts` (7 tests) |
| 6. Execute | Next sprint closes null guard fixes systematically | Sprint 18 |

**Key discipline**: Never enable the flag without a plan to fix it or guard it. Leaving it unfixed without test coverage is how silent runtime bugs get introduced.

## Why This Matters

- Without `noUncheckedIndexedAccess`, TypeScript allows `arr[0]` as `T` even when `arr` is empty — a **lie the type system tells you**
- Every `arr[i]` access where `i` is computed or user-controlled is a potential `undefined` at runtime
- Enabling the flag immediately makes the codebase safer for all **future** changes, even if the current fix is deferred
- E2E tests act as the regression catch-net during the deferral window

Not enabling it means accumulating technical debt in the type system that will eventually surface as real runtime bugs in production.

## When to Apply

- Any codebase with non-trivial array access patterns (dashboards, analytics, lists, loops)
- When starting a new sprint cycle and wanting to do a "type safety sprint" as a focused theme
- When refactoring data-access or store layers — enabling the flag **before** refactoring prevents regressions from being typed over
- **Anti-pattern to avoid**: enabling strict flags without counting errors first — you need the error count to size the defer scope

## Examples

### tsconfig.json — before

```json
{
  "compilerOptions": {
    "strict": true
    // noUncheckedIndexedAccess defaults to false
  }
}
```

### tsconfig.json — after (Sprint 17)

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true
  }
}
```

### confirmationStore null guard (Sprint 17 fix applied)

```typescript
// ❌ Before — TS error under noUncheckedIndexedAccess:
// Type 'string | undefined' is not assignable to type 'string'.
const id = ids[0];

// ✅ After — null guard applied in Sprint 17 U3:
// Safe: explicit check before use
const id = ids[0];
if (!id) return false;
```

### Decision record (Sprint 17)

```
Flag:     noUncheckedIndexedAccess = true
Errors:   342 TypeScript errors
Fix scope: ~2-3d full-scopes work (exceeds sprint budget)
Decision: ✅ Enable flag (U1) + defer fixes (E3-U2/U3 → Sprint 18)
Guard:    7 E2E tests in analytics-dashboard.spec.ts
```

## Related

- **Same pattern, same team**: [`.learnings/vibex-ts-any-cleanup.md`](file://.learnings/vibex-ts-any-cleanup.md) — ESLint `@typescript-eslint/no-explicit-any` enable-then-defer applied in Sprint 16
- **Same pattern, earlier spec**: `vibex-architect-proposals-20260403_024652/specs/E3-ts-strict.md` — `tsconfig.json` strict mode enable → defer in phases (written Apr 3)
- **Same pattern, PM perspective**: `vibex-pm-proposals-20260402_061709/specs/E10-typescript-strict.md` — Epic 10 calls out "渐进启用 TypeScript strict" in 3 phases: warn → error → strict
- **Related: vibex-sprint16-mock-driven-dev-patterns-20260428.md** — "Code Generator Type Safety" section demonstrates TS rigor mindset; most recent (Apr 28)

This is the **3rd+ application** of the same `enable → defer → phase` strategy in VibeX. The pattern is now well-established: count errors, size the fix, defer if needed, guard with tests.
