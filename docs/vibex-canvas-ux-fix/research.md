# Research: VibeX Canvas UX Fix

## Historical Learnings (from docs/learnings/)

### canvas-api-completion.md
**Relevance**: Medium

Key insight: Snapshot API lessons about route ordering and version conflict detection (`<` vs `<=`) are unrelated to the 4 UX issues, but one lesson is highly relevant:

- **Lesson**: When API returns 400, the error handling path on the frontend must be explicit. The current issue #1 (silent 400) is exactly this: the `handleContinueToComponents` catch block existed, but was not being reached because the button wasn't disabled.

**Action implication**: The fix needs both frontend guard (disabled button) AND catch block (toast on unexpected 400). Both are now in place per 68f80aaf.

### canvas-cors-preflight-500.md
**Relevance**: Low (infrastructure, not UX)

The OPTIONS preflight lesson is not directly relevant to these 4 UX issues. However, it establishes a pattern: **"silence = misdirection"**. Every silent failure hides the real problem. This applies to all 4 UX issues.

Key principle: "越早拦截 OPTIONS 越好，避免落入认证层" translates to UX: "越早暴露错误越好，避免落入静默失败"。

### canvas-testing-strategy.md
**Relevance**: High

Key lessons that directly apply:

1. **Mock store realism**: Tests used simplified mockStore (all fields return empty arrays) which passed but didn't reflect real behavior. This is likely why the button disabled logic wasn't caught before shipping.

2. **Boundary condition testing**: The `null/undefined/empty` edge cases for `contextNodes` and `flowNodes` were not covered. Issue #2 (button always disabled) could have been caught with proper boundary tests on `canGenerateComponents`.

3. **Coverage threshold**: 80% is the right starting point but needs to include state derivation functions like `canGenerateComponents`.

**Action implication**: Add unit tests for `canGenerateComponents` with all 4 scenarios:
- Empty contextNodes → disabled
- No flowNodes → disabled  
- Has contexts + flows + selections → enabled
- Has contexts + flows, no selection → enabled (uses all active)

### react-hydration-fix.md
**Relevance**: Low (empty file)

No applicable content.

### vibex-e2e-test-fix.md
**Relevance**: Medium

Key lesson: `@ci-blocking` skip pattern (`grepInvert: /@ci-blocking/`) shows that **runtime configuration should control behavior, not compile-time code changes**. This applies to UX: instead of just disabling the button, the system should show *why* it's disabled (tooltip + toast).

Also: "PRD Epic 划分 vs 实际实现的颗粒度差异" — this explains why the confirm ≠ complete issue persists: the Epic was about replacing `window.confirm`, but the `handleConfirmAll` function itself was never part of the Epic scope.

---

## Git History Findings

### BusinessFlowTree.tsx
```
68f80aaf fix(canvas): 修复组件树生成静默 400 错误
54fe5b54 feat(canvas): E4+E5 Sprint3 — 文案修复
07ad855d feat(canvas): P2 confirmDialog — replace all window.confirm with confirmDialogStore
70c3153c feat(canvas): BoundedContextTree 虚拟化 (vibex-third E2-S3)
dab897c0 feat(E4): add three-tree serialization and project loader
ef90882a feat(E3): add YAML export and import with round-trip validation
cb82559a fix(E1): useEffect depends on activeTree instead of dead activeTab state
4dbe738e feat(E1): reset phase on tab switch for E1-U1 Tab State
6d80bf4d fix(bug2): canvas tab state reset on switch
438af56f feat(canvas): Phase2 URL 注入 projectId — CanvasPage 深度修复
f3a68586 feat(canvas): Epic1 canvasApi 401 事件分发修复
13f7c706 fix(canvas): E1 - add skipHydration to 5 canvas stores + CanvasPage rehydrate
774a08cb fix(canvas): F1.1 connect onGenerateContext to real canvasApi.generateContexts
```

**Key pattern**: BusinessFlowTree has been modified many times with hotfixes (fix-E1, fix-bug2, fix(canvas) E1) — indicating the component has accumulated technical debt from rapid iteration without comprehensive test coverage. The 68f80aaf fix (2026-04-17 02:18) is the most recent and addresses issues #1 and partially #3.

### BoundedContextTree.tsx
```
07ad855d feat(canvas): P2 confirmDialog — replace all window.confirm with confirmDialogStore
70c3153c feat(canvas): BoundedContextTree 虚拟化 (vibex-third E2-S3)
```

**Key finding**: Only 2 commits in the relevant period. The `confirmDialog` commit only replaced `window.confirm` in delete operations — the `handleConfirmAll` function was NOT changed by this commit. The comment in current code says "Advance phase (no confirm gating in Epic 3)" — this is the root cause of issue #3.

### CanvasPage.tsx
```
68f80aaf fix(canvas): 修复组件树生成静默 400 错误
438af56f feat(canvas): Phase2 URL 注入 projectId — CanvasPage 深度修复
f3a68586 feat(canvas): Epic1 canvasApi 401 事件分发修复
40b3158a feat(canvas): Epic1 TabBar 无障碍化改造
13f7c706 fix(canvas): E1 - add skipHydration to 5 canvas stores + CanvasPage rehydrate
422560da [S2-1] feat: useAIController Phase 2+3 UI integration and tests
63a4f939 [S1-7] fix: CanvasPage renderContextTreeToolbar useCallback memoization
```

### ComponentTreeCard.tsx
```
(2 recent commits — limited history)
```

---

## Key Insights & Lessons Learned

### 1. Issue #1 (Silent 400) — ALREADY PARTIALLY FIXED
Commit `68f80aaf` (2026-04-17 02:18) added:
- **F1.1**: `contextsToSend` empty array pre-validation with toast error
- **F1.2**: `canGenerateComponents` derived state controls button disabled

**Remaining risk**: The `canGenerateComponents` useMemo only checks `contextNodes.length > 0` via `validContexts.length > 0`. If `contextNodes` has items but ALL have `isActive === false`, the button will be enabled but `contextsToSend` will be empty → 400 again. Need test coverage for this edge case.

### 2. Issue #2 (Create project button always disabled) — CASCADING FROM #1/#4
The button requires: `contextNodes.length > 0 && flowNodes.length > 0 && componentNodes.length > 0`. The `componentNodes` will always be empty if:
- User never clicked "Continue → Component tree" (button unresponsive — issue #4)
- User clicked but API returned 400 (issue #1 — now fixed)

**Root cause is likely #4**: The button worked for users who had already completed the flow before the recent changes. For new users, the chain breaks at step 3.

### 3. Issue #3 (Confirm ≠ Complete) — SCOPE MISMATCH
The `handleConfirmAll` function:
```javascript
const handleConfirmAll = useCallback(() => {
    // Advance phase (no confirm gating in Epic 3)
    advancePhase();
}, [contextNodes, advancePhase]);
```
- Does NOT set `isActive` on any nodes
- Does NOT use `confirmDialogStore`
- Comment explicitly says "no confirm gating" — this is a known gap

The button label shows `allConfirmed` (checks `isActive !== false`), but clicking does NOT set `isActive`. This was a scope mismatch: Epic 3 (confirmDialog) scoped only to replace `window.confirm` in delete flows, not to fix the confirm-all action.

### 4. Issue #4 (Continue button unresponsive) — POSSIBLE RACE CONDITION
The button `disabled` condition: `!canGenerateComponents || componentGenerating`. If `componentGenerating` state gets stuck (e.g., API call hangs without error), the button stays disabled. Need to verify:
1. Does `componentGenerating` reset in the `finally` block? → YES (line 831)
2. Does the `handleContinueToComponents` return early if `componentGenerating` is true? → YES (line 760)
3. Could the component re-render and call the callback with stale closure? → useCallback has correct deps

**Most likely cause**: The `canGenerateComponents` useMemo has stale dependencies. It depends on `selectedNodeIds.context` (a Set), but if `selectedNodeIds.context` is an array, Set comparison by reference will always be a new reference → useMemo always recalculates → could cause flash of disabled state.

---

## Don't Repeat These Mistakes

- **No empty-array guard before API calls**: Issue #1's root cause. Always validate payload before `await`.
- **Test mocks that don't reflect real store behavior**: canvas-testing-strategy lesson. Mock stores must use `mockReturnValue` per-test, not global empty mocks.
- **Epic scope that misses the actual bug**: Issue #3. confirmDialog refactor scoped to delete buttons but the bug was in handleConfirmAll (different function). Always map bug to function, not to Epic name.
- **Button disabled logic not matching API validation logic**: Issue #1 secondary cause. The `canGenerateComponents` check and `handleContinueToComponents` internal check must be identical.
- **No toast for expected error paths**: Silent failures (400 without toast) hide the problem from users. Every API error path must surface to UI.
- **State derivation scattered across useMemo and inline conditions**: `canGenerateComponents` is now centralized, but `hasAllNodes` in ProjectBar duplicates similar logic. Consolidate into a single source of truth for tree readiness state.
