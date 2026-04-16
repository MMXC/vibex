# Engineering Review Report
## Vibex Canvas UX Fix Plan — `2026-04-17-001-fix-vibex-canvas-ux-fix-plan.md`

**Reviewer:** architect (plan-eng-review skill)
**Date:** 2026-04-17
**Plan status:** Under review
**Files scanned:**
- `vibex-fronted/src/lib/canvas/api/canvasApi.ts`
- `vibex-fronted/src/components/canvas/BusinessFlowTree.tsx`
- `vibex-fronted/src/components/canvas/ProjectBar.tsx`
- `vibex-fronted/src/components/canvas/BoundedContextTree.tsx`

---

## GSTACK REVIEW REPORT

### Plan Completeness: ⚠️ INCOMPLETE — 3 Unaddressed Bugs Found

| Dimension | Score | Notes |
|-----------|-------|-------|
| Bug diagnosis accuracy | 7/10 | 4 confirmed bugs correct; 1 may be already fixed; 3 missed bugs |
| Implementation specificity | 8/10 | Units well-scoped; test scenarios present; edge cases named |
| Test coverage design | 6/10 | Test scenarios exist per unit but total test files are sparse |
| Risk identification | 7/10 | E4 `isActive` grep audit mentioned but grep not executed pre-merge |
| DRY violation awareness | 4/10 | Payload derivation logic duplicated in 3 places; plan doesn't flag it |
| Edge case completeness | 5/10 | 3 critical edge cases missed |

### Overall Verdict: CONDITIONAL APPROVAL — Address findings below before merge

---

## 1. Architecture Findings

### A. DRY Violations (Critical — Plan Doesn't Flag)

**`BusinessFlowTree.tsx` — Payload derivation logic duplicated in 3 places:**

| Location | Line | Logic |
|----------|------|-------|
| `handleContinueToComponents` handler | 773–787 | Filters `activeContexts` + `selectedContextSet` + `contextsToSend`; filters `activeFlows` + `selectedFlowSet` + `flowsToSend` |
| `canGenerateComponents` useMemo | 826–832 | Filters `activeContexts` + `selectedContextSet` + `validContexts`; **misses flow filtering entirely** |
| Tooltip/error derivation | 728–733 | Checks `allContextsActive` + finds `inactiveCtx` |

The duplication in handler vs. useMemo means **the button can say "enabled" but the handler can still bail out early**. This is the exact class of bug the plan's D1 is meant to fix — but the implementation approach (extract to `utils/canvasPayload.ts`) is the right call.

**The plan's Unit 3 (`computeTreePayload`) is correct and necessary.** Without it, any future change to the payload derivation in the handler will silently desync from the button's disabled state.

**BUT: the plan underestimates the scope.** It says the logic "already partially exists in `handleContinueToComponents`." That's true — but the partial implementation at lines 773–787 itself has the bug (uses `contextsToSend` but `canGenerateComponents` checks `validContexts.length > 0 && flowNodes.length > 0`). Extracting and fixing the logic simultaneously is non-trivial. Unit 3 is not a simple extraction — it's a re-implementation with a bugfix embedded.

**Recommendation:** Break Unit 3 into two sub-tasks: (3a) extract current logic verbatim; (3b) fix the missing flow check. Add integration test that asserts `canGenerateComponents` value matches handler bailout for all 4 edge cases before declaring 3a done.

---

### B. State Machine Inconsistency (Plan Correctly Identifies — Implementation Risk High)

The `isActive` field is used for two fundamentally different semantics across the codebase:

| Semantic | Where used | What it means |
|----------|-----------|---------------|
| Panel visibility gate | `BusinessFlowTree.tsx:834` — `if (!isActive) return` | Panel is visible/hidden |
| Confirmation state | `BoundedContextTree.tsx:463` — `allConfirmed` checks `isActive !== false` | User has confirmed this node |
| Partial activation state | `BusinessFlowTree.tsx:444` — counts `activeSteps` | Some steps in a flow are active |

These are three distinct concepts wearing the same field name. The plan's E4 decision (switch `allConfirmed` to check `status === 'confirmed'`) is correct, but it doesn't address the broader `isActive` semantics pollution.

**Risk:** After E4-F4.1, `BoundedContextTree` will check `status === 'confirmed'`, but `BusinessFlowTree`'s `allContextsActive` at line 728 and the tooltip check at line 733 will still check `isActive !== false`. The grep audit in F4.1 will catch this — but the plan doesn't specify the resolution for each found usage.

**Recommendation:** As part of F4.1, explicitly document each `isActive` usage found by grep and classify it as:
- `status === 'confirmed'` (completion gate)
- `isActive !== false` (panel visibility gate)  
- Keep as-is

---

### C. `componentGenerating` State Without Cleanup

**Location:** `BusinessFlowTree.tsx:723`

```tsx
const [componentGenerating, setComponentGenerating] = useState(false);
```

The `finally` block at line 821 resets this on normal completion:
```tsx
} finally {
  setComponentGenerating(false);
}
```

**Missing:** No `useEffect` cleanup for unmount. If the component unmounts mid-generation (e.g., user navigates away), `componentGenerating` stays `true`. On remount, the button remains disabled because the state is stale.

The plan's Unit 4 correctly identifies this. The fix is one `useEffect` with empty deps. Low implementation risk. ✅

---

## 2. Code Quality Findings

### A. `handleResponseError` — Line Number Discrepancy (⚠️ Needs Verification)

The plan states the bug is at `canvasApi.ts:164` — `res.json()` without await.

**Actual grep result:** Line 166 in the current file:
```
166:    errData = await res.json();
```

The `await` IS present at line 166. Either:
1. The bug was already fixed (the file has been modified since the plan was written), or
2. The plan references a different version/line number

**Either way: the current `handleResponseError` (lines 163–173) already has `await res.json()`.** The plan's F1.1 ("Fix handleResponseError async/await") may already be done in the current codebase.

**⚠️ This must be verified against the actual git history before work begins.** If the fix is already in place, F1.1 should be replaced with a verification task (grep + unit test).

**Action required:** Run `git log --oneline -5 -- src/lib/canvas/api/canvasApi.ts` and confirm whether line 166 was modified post-plan-creation.

---

### B. Implicit `Promise` Returns on Non-`validatedFetch` Endpoints (⚠️ Plan Misses This)

The plan focuses on `handleResponseError` but doesn't audit the non-`validatedFetch` endpoints. All manual `res.json()` return paths (not wrapped in `validatedFetch`) use **implicit Promise wrapping** (no `await`, just `return res.json() as Promise<T>`):

| Line | Method | Issue |
|------|--------|-------|
| 234 | `createProject` | `return res.json() as Promise<CreateProjectOutput>` — implicit Promise, correct |
| 250 | `generate` | `return res.json() as Promise<GenerateOutput>` — implicit Promise, correct |
| 264 | `getStatus` | `return res.json() as Promise<StatusOutput>` — implicit Promise, correct |
| 386 | `createSnapshot` 409 path | `await res.json()` — correct (already awaited) |
| 394 | `createSnapshot` | `return res.json() as Promise<CreateSnapshotOutput>` — implicit Promise |
| 409 | `listSnapshots` | `return res.json() as Promise<ListSnapshotsOutput>` — implicit Promise |
| 421 | `getSnapshot` | `return res.json()` — **NO cast, NO await** — subtle TS error risk |
| 436 | `restoreSnapshot` | `return res.json() as Promise<RestoreSnapshotOutput>` — implicit Promise |
| 451 | `getLatestVersion` | `return res.json()` — **NO cast, NO await** |

These are all **technically correct** in async functions (implicit Promise return is valid), but they are inconsistent:
- Some have explicit `as Promise<T>` casts
- Two have neither cast nor `await`

The `as Promise<T>` cast on a non-awaited `res.json()` return is semantically correct but stylistically questionable — it tells TS "trust me, this will resolve to T" rather than letting the compiler verify it.

**Risk:** Low (all callers `await` these methods). But inconsistent style invites future bugs.

**Recommendation:** Standardize all non-`validatedFetch` returns to either:
- Option A: `return await res.json() as T;` (uniform, explicit)
- Option B: Keep implicit returns, standardize on `as Promise<T>` casts for all, remove the two uncast returns (421, 451)

**Unit 2's "global res.json() safety audit" should explicitly check for this inconsistency**, not just missing `await`.

---

### C. `handleConfirmAll` — No-Op Bug (Confirmed)

**Location:** `BoundedContextTree.tsx:458–459`

```tsx
const handleConfirmAll = useCallback(() => {
  // Advance phase (no confirm gating in Epic 3)
  advancePhase();
}, [contextNodes, advancePhase]);
```

This does **nothing to the nodes**. It calls `advancePhase()` but never calls `confirmContextNode(nodeId)` for any node. The `allConfirmed` derived at line 463:
```tsx
const allConfirmed = contextNodes.length > 0 && contextNodes.every((n) => n.isActive !== false);
```

...checks `isActive !== false`, but `handleConfirmAll` doesn't set `isActive` on any node. So `allConfirmed` will only be `true` if nodes were individually activated via checkbox — not via "确认所有".

The plan correctly identifies this as E4-F4.2. The fix is to add a loop calling `confirmContextNode` before `advancePhase`.

**⚠️ Note:** `confirmContextNode` is called `confirmContextNode` in the plan but I need to verify the actual store method name. The grep scan didn't surface the store definition. Confirm the actual method name in the Zustand store before implementing.

---

### D. `isActive` vs `status` Semantic Mismatch in `BoundedContextTree`

**Location:** `BoundedContextTree.tsx:463`

```tsx
const allConfirmed = contextNodes.length > 0 && contextNodes.every((n) => n.isActive !== false);
```

The comment above (line 458) says `"确认所有"` but the actual effect sets neither `isActive` nor `status`. The plan's F4.1 switches to `status === 'confirmed'`, which aligns with what the checkbox actually sets.

**However:** The plan's F4.2 says `handleConfirmAll` should "call `confirmContextNode(nodeId)` for each node (sets `status: 'confirmed'` and `isActive: true` if store supports it)". The "**if store supports it**" hedge is problematic — it means the implementation might only set `status` and not `isActive`, leaving the `isActive`-reading code paths broken.

**Recommendation:** F4.2 must mandate that the Zustand store's `confirmContextNode` sets **both** `status: 'confirmed'` AND `isActive: true` atomically. If the store doesn't support this, the store must be extended as part of this fix. "If store supports it" is not acceptable — it creates a partial fix that passes tests but still breaks in production.

---

### E. `canGenerateComponents` Misses Flow Filtering (Confirmed Bug)

**Location:** `BusinessFlowTree.tsx:826–832`

```tsx
const canGenerateComponents = useMemo(() => {
  const activeContexts = contextNodes.filter((ctx) => ctx.isActive !== false);
  const selectedContextSet = new Set(selectedNodeIds.context);
  const validContexts = selectedContextSet.size > 0
    ? activeContexts.filter((ctx) => selectedContextSet.has(ctx.nodeId))
    : activeContexts;
  return validContexts.length > 0 && flowNodes.length > 0;  // ← BUG
}, [contextNodes, selectedNodeIds.context, flowNodes.length]);
```

**The bug:** `flowNodes.length > 0` is checked but NOT `flowsToSend.length > 0`. The handler (lines 773–787) checks if flows are active AND selected:
```tsx
const activeFlows = flowNodes.filter((f) => f.isActive !== false);
const selectedFlowSet = new Set(selectedNodeIds.flow);
const flowsToSend = selectedFlowSet.size > 0
  ? activeFlows.filter((f) => selectedFlowSet.has(f.nodeId))
  : activeFlows;
```

So if the user has deselected all flows, `flowsToSend` is empty, but `canGenerateComponents` still returns `true` (because `flowNodes.length > 0` even if all are inactive). The button stays enabled, the handler bails out with "请先选择流程节点", creating exactly the UX bug described.

**Plan Unit 3 (computeTreePayload) fixes this correctly.** The extracted function should derive both `contextsToSend` and `flowsToSend` with identical selection-aware logic, and `canGenerateComponents` should check `contextsToSend.length > 0 && flowsToSend.length > 0`.

---

### F. `hasAllNodes` — Length Check Only, No State Check (Confirmed Bug)

**Location:** `ProjectBar.tsx:160`

```tsx
const hasAllNodes = hasNodes(contextNodes) && hasNodes(flowNodes) && hasNodes(componentNodes)
  && contextNodes.length > 0 && flowNodes.length > 0 && componentNodes.length > 0;
```

This only checks `length > 0`. Per the plan's R3: "创建项目 button unlocks only when all nodes across all 3 trees are confirmed (`isActive !== false`)". The plan correctly identifies that this should check `every(n => n.isActive !== false)` per tree.

**BUT** the plan's D3 says `hasAllNodes` should check `every(isActive !== false)` — but the plan's E4 says `allConfirmed` should check `status === 'confirmed'`. These are inconsistent. After E4 lands:
- `allConfirmed` in `BoundedContextTree` checks `status === 'confirmed'`
- `hasAllNodes` in `ProjectBar` would check `isActive !== false`

If a node is confirmed (checkbox clicked), `status` becomes `'confirmed'` AND `isActive` becomes `true`. These should be consistent. But the plan doesn't verify this consistency between F3.1 and F4.1.

**Recommendation:** F3.1 and F4.1 must be designed together. `hasAllNodes` in ProjectBar should check the same field as `allConfirmed` in BoundedContextTree. If F4.1 switches to `status === 'confirmed'`, then F3.1 should too — or the store must guarantee both fields are always in sync.

---

## 3. Test Coverage Assessment

### Existing Tests

| File | Lines | Coverage Quality |
|------|-------|-----------------|
| `canvasApi.test.ts` | 173 | Partial — covers validation, 401; missing error path for `handleResponseError` with `error`/`message`/`details` fields |
| `BusinessFlowTree.test.tsx` | 269 | Partial — likely covers basic rendering; missing tests for `canGenerateComponents` edge cases, `componentGenerating` unmount |
| `BoundedContextTree.test.tsx` | 130 | Thin — 130 lines suggests basic smoke tests only |
| `ProjectBar` | **No test file found** | **Zero coverage** |

### Critical Missing Tests (per plan's own test scenarios)

| Unit | Test Scenario | Status |
|------|--------------|--------|
| E1-F1.1 | Backend returns `{ "error": "上下文节点不能为空" }` → Error.message contains that | **Missing** |
| E1-F1.1 | Backend returns 400 with no JSON body → fallback to defaultMsg | **Missing** |
| E1-F1.1 | `res.json()` throws → fallback to `HTTP {status}` | **Missing** |
| E2-F2.1 | All contexts inactive → `contextsToSend` empty → button disabled | **Missing** |
| E2-F2.1 | Selection set but all selected nodes inactive → button disabled | **Missing** |
| E2-F2.2 | Component unmounts mid-generation → button enabled on remount | **Missing** |
| E3-F3.1 | 3 trees have nodes but some `isActive === false` → button disabled | **Missing** |
| E3-F3.2 | Component tree empty → tooltip "请先生成组件树" | **Missing** |
| E4-F4.1 | All `isActive !== false` but none `status === 'confirmed'` → `allConfirmed === false` | **Missing** |
| E4-F4.2 | `handleConfirmAll` → all nodes `status === 'confirmed'` AND `allConfirmed === true` | **Missing** |
| E4-F4.3 | `inactivePanel` visibility matches `status === 'confirmed'` | **Missing** |

**Total new tests needed: ~15 (minimum)**

**Risk:** Unit 5 (F3.1 — `hasAllNodes`) has **zero existing test coverage** and **no test file exists for ProjectBar**. This is the component that fires the "创建项目" action — the most critical user-facing button. Shipping F3.1 without tests means the next regression silently breaks project creation.

---

## 4. Performance Assessment

### `computeTreePayload` Extraction

The plan's D1 decision to extract `computeTreePayload` as a pure function in `utils/canvasPayload.ts` is architecturally sound:
- Pure function = no React hooks, no store access → easy to unit test
- `useMemo` in component for `canGenerateComponents` ensures it only recomputes when inputs change
- Handler calls the same function once = O(n) where n = nodes.length, same as current

**No performance regression expected.** In fact, the extraction may reduce redundant filtering since the handler currently filters contexts and flows independently of the button state check.

### `canGenerateComponents` useMemo Dependency Array

**Potential bug in existing code:**
```tsx
}, [contextNodes, selectedNodeIds.context, flowNodes.length]);
```

This only includes `flowNodes.length`, not `flowNodes` or `selectedNodeIds.flow`. If a flow's `isActive` changes but length stays the same, `canGenerateComponents` won't recompute. 

**Scenario:** User toggles flow node active state (via individual flow checkbox). `flowNodes.length` unchanged → useMemo doesn't re-run → button state stale.

**Recommendation:** The useMemo deps should be `[contextNodes, selectedNodeIds, flowNodes]` (full objects, or at minimum `selectedNodeIds.flow`). This is a bug in the existing code that the plan's refactoring should fix as part of Unit 3.

---

## 5. Concrete Recommendations Per Issue

### Issue E1: Silent 400 Errors

| # | Recommendation | Priority |
|---|---------------|----------|
| E1-R1 | Verify `handleResponseError` line 166 actually needs fixing vs. already fixed | **P0 — Block E1-F1.1** |
| E1-R2 | Expand Unit 2 scope: check all implicit Promise returns for consistency, not just missing `await` | P1 |
| E1-R3 | Add `handleResponseError` test with 4 field variants: `error`, `message`, `details`, none | P1 |
| E1-R4 | The `validatedFetch` pattern at line 128–134 already handles error parsing correctly. Consider migrating remaining endpoints to use it. | P2 (future) |

### Issue E2: Button Inconsistent with Handler

| # | Recommendation | Priority |
|---|---------------|----------|
| E2-R1 | Unit 3 sub-task 3a: extract `computeTreePayload` verbatim; 3b: fix missing flow check | **P0 — Core fix** |
| E2-R2 | Fix useMemo deps: change `flowNodes.length` to `flowNodes` and add `selectedNodeIds.flow` | **P0 — Existing bug** |
| E2-R3 | Unit 4: Add unmount cleanup `useEffect(() => () => setComponentGenerating(false), [])` | P1 |
| E2-R4 | Integration test: verify button state matches handler bailout for all edge cases | P1 |

### Issue E3: Project Creation Button Disabled

| # | Recommendation | Priority |
|---|---------------|----------|
| E3-R1 | **Create ProjectBar.test.tsx** before implementing F3.1 — no coverage, high risk | **P0 — Must do first** |
| E3-R2 | F3.1: change `hasAllNodes` to `every(n => n.isActive !== false)` per tree, keep `length > 0` prerequisite | P1 |
| E3-R3 | Coordinate F3.1 and F4.1: pick ONE field (`status` or `isActive`) and use consistently | **P0 — Cross-component** |
| E3-R4 | F3.2: tooltip derivation with prioritized failure reasons | P1 |

### Issue E4: State Field Out of Sync

| # | Recommendation | Priority |
|---|---------------|----------|
| E4-R1 | **Verify store method name** (`confirmContextNode` vs. actual store API) before F4.2 implementation | **P0 — Block F4.2** |
| E4-R2 | F4.2 must mandate `confirmContextNode` sets BOTH `status: 'confirmed'` AND `isActive: true` — no "if store supports it" | **P0 — Requirement** |
| E4-R3 | F4.1 grep audit: classify each `isActive` usage found (completion gate / visibility gate / keep-as-is) | P1 |
| E4-R4 | E4 semantic change may break `BusinessFlowTree.tsx:728` (`allContextsActive`) and line 733 (`inactiveCtx`). These must be updated as part of F4.1 scope. | **P0 — Incomplete scope** |

---

## 6. What Already Exists

| Item | Assessment |
|------|-----------|
| `useToast` hook | ✅ Exists — used by handler and other components, no new infrastructure needed |
| Zustand stores (`useContextStore`, `useFlowStore`, `useComponentStore`) | ✅ Exist — plan correctly avoids modifying stores, changes are derivation-only |
| `vi.mock` pattern in test files | ✅ Exists — follow existing conventions |
| `validatedFetch` with Zod schema | ✅ Exists at line 128-134 — already correct, error handling good |
| `handleResponseError` with `await res.json()` | ✅ Already present at line 166 — may not need fixing |
| `canGenerateComponents` useMemo | ✅ Already exists at line 825 — just needs fixing (missing flow check) |
| `handleContinueToComponents` handler | ✅ Already has selection-aware logic at lines 773-787 — needs DRY extraction + bugfix |
| `allConfirmed` derivation | ✅ Already exists at line 463 — needs semantic fix to `status === 'confirmed'` |
| `hasAllNodes` in ProjectBar | ✅ Already exists at line 160 — needs state check addition |
| Toast usage in error paths | ✅ Handler already shows `err.message` — fix is in error message content, not toast infrastructure |
| Test files (partial) | ⚠️ Exist but thin — `canvasApi.test.ts` (173L), `BusinessFlowTree.test.tsx` (269L), `BoundedContextTree.test.tsx` (130L), **ProjectBar — none** |

---

## 7. NOT in Scope (Correct)

The plan's NOT in scope list is appropriate:
- ✅ Backend error format changes — frontend handles any shape (error/message/details fields)
- ✅ i18n — hardcoded Chinese is project convention
- ✅ BoundedContextTree checkbox state machine refactor — separate Epic

**Additional items that should also be explicitly NOT in scope:**

- Migration of remaining `res.json()` calls to `validatedFetch` pattern (future work, P2)
- `isActive` field cleanup across all canvas components (separate Epic — semantic pollution is broader than this fix)
- `BusinessFlowTree` panel visibility gate (`if (!isActive) return`) refactor to use `status` — separate Epic

---

## 8. Plan Risks Not Adequately Addressed

| Risk | Why Underaddressed | Required Action |
|------|-------------------|-----------------|
| **E4 is a semantic field change that affects 3 components** | The grep audit (F4.1) only finds usages — it doesn't mandate resolution for each. `BusinessFlowTree.tsx:728`, `733` will break silently. | Explicit ADR entry: each found `isActive` usage must be classified as (A) switch to `status === 'confirmed'`, (B) keep as visibility gate, or (C) needs separate Epic |
| **Store method `confirmContextNode` may not exist** | Plan says "call `confirmContextNode(nodeId)` for each node" — if this method doesn't set `isActive: true`, the fix is incomplete | Pre-implementation audit: find `confirmContextNode` in store, verify it sets both fields or extend store |
| **F3.1 has zero test coverage** | ProjectBar has no test file. The "创建项目" button is the final user action. A regression here is catastrophic. | Mandatory: create `ProjectBar.test.tsx` BEFORE implementing F3.1 |
| **`componentGenerating` unmount cleanup may cause brief flash** | Plan says "no visual artifact" but doesn't explain why. If setState fires after paint, brief disabled flash is possible. | Add `setTimeout` fallback or ensure synchronous state reset, add test |
| **F4.2 atomicity assumption** | `handleConfirmAll` loops over nodes and calls `confirmContextNode` — if store update is async (Zustand can have middleware), panel might flicker. | Verify store update is synchronous, or use `flushSync` from react-dom if needed |

---

## 9. Completion Summary

### Issues the Plan Gets Right

1. ✅ **Root cause diagnosis is accurate** for E2, E3, E4 — line numbers match actual bugs
2. ✅ **D1 (computeTreePayload extraction)** is the correct architectural solution — eliminates the class of "derived in one place, used differently in another" bugs
3. ✅ **D2 (handleResponseError async)** is sound — even if already done, explicit unit test ensures regression protection
4. ✅ **Test scenarios per unit** are well-defined and cover the stated edge cases
5. ✅ **Scope is correctly bounded** — pure frontend, no backend/API changes, no schema changes
6. ✅ **No new infrastructure** — leverages existing `useToast`, Zustand stores, `vi.mock` conventions

### Issues the Plan Misses or Underaddresses

1. 🔴 **`handleResponseError` line number discrepancy** — plan says line 164 bug, grep shows line 166 already awaited. Must verify before starting.
2. 🔴 **Store method `confirmContextNode` not verified** — F4.2 implementation depends on this method; must confirm it exists and sets both fields.
3. 🔴 **F3.1 (ProjectBar) has zero test coverage** — `ProjectBar.test.tsx` must be created before the fix, not after.
4. 🔴 **E4 grep audit doesn't define resolution** — finding usages without mandating what to do with each is insufficient.
5. 🟡 **DRY violations not explicitly flagged** — the plan's D1 is correct but underestimates the complexity (extraction + bugfix simultaneously).
6. 🟡 **useMemo dependency array bug** — `flowNodes.length` in deps misses active-state changes; existing bug that should be fixed in scope.
7. 🟡 **Implicit Promise returns inconsistency** — 9 endpoints use implicit returns, 2 have no type cast; Unit 2 should standardize.

### Estimated Test Count to Add

| Unit | New tests |
|------|-----------|
| E1-F1.1 | 4 |
| E1-F1.2 | 0 (grep audit) |
| E2-F2.1 | 5 (4 edge cases + integration) |
| E2-F2.2 | 1 |
| E3-F3.1 | 3 (edge cases + regression) |
| E3-F3.2 | 2 |
| E4-F4.1 | 2 |
| E4-F4.2 | 1 |
| E4-F4.3 | 2 |
| **Total** | **~20 new tests** + mandatory `ProjectBar.test.tsx` (~8 tests) |

**Total test count:** ~28 new/modified tests across 4 test files.

---

## Execution Gate (Must Pass Before Merge)

- [ ] **Verify** `handleResponseError` actually needs fixing vs. already done
- [ ] **Verify** store method `confirmContextNode` exists and sets both `status` and `isActive`
- [ ] **Create** `ProjectBar.test.tsx` before implementing F3.1
- [ ] **Classify** every `isActive` usage found in grep audit before writing code
- [ ] **Fix** useMemo deps (`flowNodes.length` → `flowNodes` + `selectedNodeIds.flow`)
- [ ] **Standardize** implicit Promise returns (Unit 2 scope expansion)

---

*Report generated by architect (plan-eng-review skill)*
