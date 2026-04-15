# Technical Review Report

## Bug 1 Analysis: ACCURATE

### Finding
The `/api/v1/dds/chapters` 404 root cause analysis is correct. Backend routing (`app.route('/api/v1', v1)` → `protected_` → `/dds` → `ddsChapters`) is verified correct in `chapters.ts`. The `_redirects` file exists with the correct rule (`/api/* → https://api.vibex.top/api/:splat 200`). The bug is correctly identified as residing in the Cloudflare Pages → Workers proxy layer — static `_redirects` may behave differently under Next.js static export, or Pages routing rules need manual dashboard configuration.

### Severity: Critical

### Recommendation
No changes needed to the diagnosis. The two-tier fix strategy (A: verify Pages routing config → B: Next.js API Route proxy) is appropriate. Ensure B1-U2 (Next.js API Route proxy) is created as a fallback regardless of U1 outcome, so the fix is fully code-based and not dependent on manual Cloudflare dashboard configuration.

---

## Bug 2 Analysis: PARTIAL

### Finding 1 — `queuePanelExpanded` default value bug is accurate
In `useCanvasPanels.ts` line 24: `const [queuePanelExpanded, setQueuePanelExpanded] = useState(true);` — initialized to `true`, meaning the Prototype accordion is open by default. This is confirmed as a bug.

### Finding 2 — Mobile TabBar analysis contains a factual error
The architecture doc (Section 2) states: `"setActiveTab('flow')` only changes `activeTab` (TabBar indicator), doesn't change `phase`". However, examining the actual CanvasPage.tsx mobile TabBar onClick (lines 666-668):

```typescript
onClick={() => {
  if (t === 'context') { setPhase('context'); setActiveTree('context'); }
  else if (t === 'flow') { setPhase('flow'); setActiveTree('flow'); }
  else { setPhase('component'); setActiveTree('component'); }
}}
```

The mobile TabBar **already** calls `setPhase()` simultaneously with `setActiveTree()`. The architecture's stated problem ("doesn't change phase") does not match the actual code for the context/flow/component tabs. The real bug for mobile is the missing `setQueuePanelExpanded(false)` call.

### Finding 3 — Prototype tab button is missing `queuePanelExpanded` reset
The Prototype tab onClick (line 681): `onClick={() => { setPhase('prototype'); setActiveTree('component'); }}` — also missing `setQueuePanelExpanded`. Both regular tabs and the Prototype tab need this reset.

### Finding 4 — Desktop mode PhaseIndicator not analyzed
The architecture doc only covers mobile (`useTabMode=true`) TabBar for Bug 2. Desktop mode (`useTabMode=false`) uses `PhaseIndicator` which calls `setPhase`. Whether `queuePanelExpanded` needs reset on desktop phase switches is not analyzed. Given that `queuePanelExpanded` controls the `PrototypeQueuePanel` (which renders at `phase === 'prototype'`), a desktop user navigating to prototype phase from PhaseIndicator would also encounter the accordion state bug — but the architecture doc is silent on this.

### Severity: Medium (Bug 2 root cause diagnosis is 60% correct: default value is right, mobile Phase analysis has one inaccurate claim, desktop is unanalyzed)

### Recommendation
- **Correct the Bug 2 diagnosis**: Remove the claim that "setActiveTab('flow') only changes activeTab, doesn't change phase". Mobile TabBar already syncs both. State the real bug: TabBar onClick does NOT reset `queuePanelExpanded`.
- **Add Prototype tab to Bug 2**: The Prototype tab button's onClick is equally missing `setQueuePanelExpanded(false)`.
- **Add desktop PhaseIndicator analysis**: Determine if desktop phase switching should also reset `queuePanelExpanded`. If `PrototypeQueuePanel` is accessible from desktop, desktop Tab switching needs the same fix.
- **Update architecture diagram**: Remove the "phase ← 不变" arrow from mobile TabBar. Replace with "queuePanelExpanded ← 不变" (the real bug).

---

## Test Review: INCOMPLETE

### Finding 1 — Bug 2 test assertion is insufficient
The spec checks `await expect(page.locator('[data-phase="context"]')).toBeVisible()`. This is a weak assertion because: (a) the `data-phase` attribute may always be present in the DOM (rendered from initial state), not reflecting the post-click state, and (b) the test doesn't verify `queuePanelExpanded` is `false` after switching away from Prototype.

### Finding 2 — Bug 2 test misses key scenario: switching FROM Prototype tab
The test in the implementation plan only tests "switching from Prototype tab to other tab closes accordion" — but the test case shown in Section 7.3 is the accordion expansion/collapse scenario, not the default-value bug. The default-value bug (`queuePanelExpanded === true` on first load at prototype phase) has no explicit test.

### Finding 3 — Bug 2 test uses non-existent `data-panel` attribute
The test uses `page.locator('[data-panel="prototype-queue"]')` and expects `data-expanded="false"`. No such attributes exist in the codebase. The actual PrototypeQueuePanel uses `expanded` prop (boolean) and renders to class-based `aria-expanded` on the toggle button. The test will fail on selector mismatch.

### Finding 4 — Bug 1 test endpoint path is wrong
The E2E test uses `page.goto('/design/dds-canvas?projectId=...')`. Looking at `_redirects`, there is no rule for `/design/dds-canvas`. The DDSCanvasPage component is mounted at `/design/dds-canvas/page.tsx` but without a `_redirects` rule it may be a 404. Additionally, `DDSCanvasPage.tsx` receives `projectId` as a prop (not from URL searchParams directly) — the page.tsx wrapper must extract `projectId` from `searchParams`. This path needs verification.

### Finding 5 — E2E spec paths listed in AGENTS.md conflict with IMPLEMENTATION_PLAN
AGENTS.md says: `vibex-fronted/e2e/dds-canvas-load.spec.ts` and `vibex-fronted/e2e/canvas-tab-state.spec.ts`. IMPLEMENTATION_PLAN says the same. No conflict, but worth noting the paths are consistent.

### Severity: Critical (tests reference non-existent selectors and miss key scenarios)

### Recommendation
- Replace `[data-phase="context"]` with a reliable selector (e.g., check the PhaseIndicator or tab button's `aria-selected` attribute for the target tab)
- Replace `[data-panel="prototype-queue"]` and `data-expanded="false"` with `aria-expanded="false"` on the PrototypeQueuePanel toggle button
- Add a test for Bug 2 default value: "on first load at prototype phase, accordion should be collapsed" (i.e., `queuePanelExpanded === false` by default)
- Verify `/design/dds-canvas` URL is valid; check `vibex-fronted/src/app/design/dds-canvas/page.tsx` routing

---

## Implementation Plan Review: SOUND (with corrections)

### Finding 1 — B2 code changes are mostly correct
The proposed modification to `useCanvasPanels.ts` (default `queuePanelExpanded = false`, adding `resetPanelState`) is correct. The proposed TabBar onClick changes are directionally right.

### Finding 2 — B2 uses `setActiveTree` not `setActiveTab`
CanvasPage.tsx uses `setActiveTree` (from `useCanvasStore`), not `setActiveTab` (from `useCanvasPanels`). The implementation plan correctly references `setActiveTree` in the TabBar onClick modification, which matches the actual codebase. Good.

### Finding 3 — B2 onClick modification should cover Prototype tab too
The implementation plan only shows changes for the context/flow/component tab onClick. The Prototype tab button's onClick (line 681) also needs `setQueuePanelExpanded(false)`. This is missing.

### Finding 4 — B1-U2 Next.js API Route proxy design is sound
Server-side fetch to `api.vibex.top`, correct GET method, response forwarding — correct approach. Using a relative path in `useDDSAPI.ts` makes the fix transparent to callers.

### Finding 5 — B1-U1 validation step is executable
The `curl` command to test `api.vibex.top` directly is the correct first step. Good.

### Overall Assessment
The implementation plan is executable but needs two corrections: (1) B2 TabBar fix must also cover Prototype tab button, (2) B2 diagnosis text must be corrected per the Bug 2 Finding above.

---

## AGENTS.md Review: SUFFICIENT (with minor gaps)

### Finding 1 — Red lines are well-defined and strong
The prohibition on `useEffect` sync (must use onClick), no backend changes for Bug1, no global dependency additions — all correct and specific.

### Finding 2 — File path table is comprehensive and accurate
All referenced files match actual codebase paths. Good.

### Finding 3 — Missing: Prototype tab onClick constraint
AGENTS.md section 3.2 says "Tab onClick 必须调用 `setPhase()` + `setActiveTree()` + `setQueuePanelExpanded(false)`" but doesn't explicitly mention the Prototype tab button. The Prototype tab button's onClick also needs `setQueuePanelExpanded(false)`. This should be made explicit.

### Finding 4 — Missing: desktop mode PhaseIndicator consideration
The desktop mode (`useTabMode=false`) is mentioned but whether `queuePanelExpanded` needs reset on desktop PhaseIndicator phase changes is not covered. This could lead to inconsistent behavior if a coder only implements the mobile TabBar fix.

### Finding 5 — Missing: Bug 2 default-value bug is not explicitly stated as a constraint
The AGENTS.md focuses on the Tab onClick reset behavior but doesn't explicitly call out "Bug 2 root cause #1: `queuePanelExpanded` must initialize to `false`". A developer could miss this and only fix the onClick behavior.

### Severity: Medium (overall guidance is solid; three specific gaps could lead to incomplete fixes)

### Recommendation
- Add explicit note: "Prototype tab button onClick also requires `setQueuePanelExpanded(false)`"
- Add explicit note: "Bug 2 root cause #1: `queuePanelExpanded` must be initialized to `false` in `useCanvasPanels`"
- Add a row to the constraint table: "Desktop PhaseIndicator: if switching TO prototype phase, reset `queuePanelExpanded = false`; if switching AWAY FROM prototype phase, also reset `queuePanelExpanded = false`"

---

## Overall Verdict: NEEDS_REVISION

## Required Changes

### Priority 1 (must fix before implementation)

1. **Architecture doc — Bug 2 diagnosis**: Remove the incorrect claim that mobile TabBar "doesn't change phase". Correct it to: "TabBar onClick does NOT reset `queuePanelExpanded`". Add Prototype tab to the bug scope. Add desktop PhaseIndicator analysis.
2. **Architecture doc — Bug 2 diagram**: Fix the "phase ← 不变" arrow in the Bug 2 Mermaid diagram. Replace with "queuePanelExpanded ← 不变" for mobile TabBar.
3. **Test specs — Bug 2 selectors**: Replace `data-phase`, `data-panel`, `data-expanded` selectors with correct selectors (`aria-selected`, `aria-expanded`). Verify actual DOM attributes from PrototypeQueuePanel implementation.
4. **Test specs — Missing default value test**: Add a test case for Bug 2 verifying `queuePanelExpanded === false` on first load (default value fix).
5. **Test specs — Bug 1 URL verification**: Verify `/design/dds-canvas` URL resolves correctly; check if `_redirects` needs an entry or if Next.js App Router handles it natively.

### Priority 2 (should fix before implementation)

6. **Implementation Plan — B2**: Extend the TabBar onClick fix to also cover the Prototype tab button's onClick (line 681 in CanvasPage.tsx).
7. **AGENTS.md**: Add explicit "Prototype tab button onClick" constraint. Add explicit "default value constraint". Add desktop PhaseIndicator constraint row.
8. **AGENTS.md — review checklist**: Add a line: "[ ] `queuePanelExpanded` initializes to `false`" to the 必查项.
