# Code Analysis: VibeX Canvas UX Fix

---

## Issue 1: P0 Component Tree Silent 400

**File**: BusinessFlowTree.tsx `handleContinueToComponents()` + canvasApi.ts `handleResponseError()`

### Root Cause

Two independent bugs combine to produce a silent failure:

**Bug 1a — `handleResponseError` async/await type mismatch** (`canvasApi.ts` line 145):

```typescript
function handleResponseError(res: Response, defaultMsg: string, returnTo?: string): never {
  // ... 401 and 404 handling ...
  const err = res.json().catch(() => ({ error: `HTTP ${res.status}` }));
  throw new Error((err as { error?: string }).error ?? defaultMsg);
}
```

`res.json()` is async, so `err` is a **Promise**, not the resolved object. `(err as {...}).error` is always `undefined`. The function always throws `defaultMsg` — the backend's actual error message is discarded. For 400s the user sees only `"API 请求失败: 400"` instead of the informative backend error.

**Bug 1b — `contextsToSend` can be empty while button stays enabled** (`BusinessFlowTree.tsx` lines 762–767):

```typescript
const activeContexts = contextNodes.filter((ctx) => ctx.isActive !== false);
const selectedContextSet = new Set(selectedNodeIds.context);
const contextsToSend = selectedContextSet.size > 0
  ? activeContexts.filter((ctx) => selectedContextSet.has(ctx.nodeId))
  : activeContexts;
```

If the user selects specific contexts, then deactivates all of them (but other active contexts remain), `contextsToSend` is empty while `canGenerateComponents` (line 825) still returns `true` because it counts ALL active contexts, not just the selected ones. The API receives `contexts: []` and returns 400.

### Code Reference

| Location | Line | Issue |
|---|---|---|
| `canvasApi.ts` | 145 | `res.json()` is async, `err` is always a Promise |
| `BusinessFlowTree.tsx` | 762–767 | `contextsToSend` empty but button enabled |
| `BusinessFlowTree.tsx` | 825–832 | `canGenerateComponents` doesn't guard `contextsToSend` emptiness |
| `BusinessFlowTree.tsx` | 906 | Button `disabled` doesn't check `contextsToSend.length > 0` |

### Fix

**Bug 1a** — canvasApi.ts line ~145: await the JSON parse before accessing it:

```typescript
async function handleResponseError(res: Response, defaultMsg: string, returnTo?: string): Promise<never> {
  // ... 401 handling stays the same ...
  // ... 404 handling stays the same ...
  let errData: { error?: string } = { error: `HTTP ${res.status}` };
  try { errData = await res.json(); } catch { /* use default */ }
  throw new Error(errData.error ?? defaultMsg);
}
```

Also change all callers to `await handleResponseError(...)`.

**Bug 1b** — BusinessFlowTree.tsx: add emptiness guard in `handleContinueToComponents` before the API call:

```typescript
// After building contextsToSend and flowsToSend (around line 780):
if (contextsToSend.length === 0 || flowsToSend.length === 0) {
  toast.showToast('请确保已选择有效的上下文和流程节点', 'error');
  setComponentGenerating(false);
  return;
}
```

Also add `contextsToSend.length > 0` to the `canGenerateComponents` check.

---

## Issue 2: P0 "Create Project" Button Always Disabled

**File**: ProjectBar.tsx

### Root Cause

The button disabled condition (`ProjectBar.tsx` line 346):

```typescript
disabled={!hasAllNodes || isCreating}
```

Where `hasAllNodes` (line 160) is:

```typescript
const hasAllNodes = hasNodes(contextNodes) && hasNodes(flowNodes) && hasNodes(componentNodes)
  && contextNodes.length > 0 && flowNodes.length > 0 && componentNodes.length > 0;
```

`hasNodes()` from `cascade/CascadeUpdateManager.ts` is `nodes.length > 0`. The button only checks **presence**, not **confirmation** (`isActive !== false`). This is intentional — but the problem is that when nodes exist with `isActive: false` (unconfirmed), the button is enabled, yet the title/tooltip says "请先确认所有三树节点". The UX is misleading.

More critically: **the button stays disabled whenever ANY of the three arrays is empty**. If a user has confirmed contexts and flows but has 0 component nodes (because the component tree API call failed silently from Issue 1), `hasAllNodes` is `false` and the button is permanently disabled even after the user generates components.

### Code Reference

| Location | Line | Issue |
|---|---|---|
| `ProjectBar.tsx` | 160–161 | `hasAllNodes` only checks `nodes.length > 0`, ignores `isActive` |
| `ProjectBar.tsx` | 346 | Button disabled uses `hasAllNodes` |
| `ProjectBar.tsx` | 165–198 | `handleCreateProject` also guards on `hasAllNodes` |

### Fix

Update `hasAllNodes` to require all nodes to be in active/confirmed state:

```typescript
const allContextConfirmed = contextNodes.length > 0 && contextNodes.every((n) => n.isActive !== false);
const allFlowConfirmed = flowNodes.length > 0 && flowNodes.every((n) => n.isActive !== false);
const allComponentConfirmed = componentNodes.length > 0 && componentNodes.every((n) => n.isActive !== false);
const hasAllNodes = allContextConfirmed && allFlowConfirmed && allComponentConfirmed;
```

Also update the tooltip title to match the actual condition.

---

## Issue 3: Medium "Confirm" ≠ "Complete"

**File**: BoundedContextTree.tsx

### Root Cause

The `allConfirmed` variable at line 463 checks `isActive !== false`, but the confirmation checkbox (`ContextCard`) sets `status === 'confirmed'`. These are two different fields tracking two different concerns:

```typescript
// Line 463 — BoundedContextTree.tsx
const allConfirmed = contextNodes.length > 0 && contextNodes.every((n) => n.isActive !== false);
```

The checkbox in ContextCard (line 237) calls `toggleContextNode(node.nodeId)`, which (via the store) sets both `status: 'confirmed'` AND `isActive: true`. However:

1. `isActive` can be set to `false` by other operations (cascade, AI regeneration, etc.) independently of `status`
2. The dual-condition means a node can have `status: 'confirmed'` but `isActive: false` (button says "confirmed" but "allConfirmed" is false)

The panel lock mechanism in `BusinessFlowTree.tsx` uses `isActive`:

```typescript
// BusinessFlowTree.tsx — panel lock
if (!isActive) {
  return <div className={styles.inactivePanel}><p>请先完成上下文树后解锁</p></div>;
}
```

This lock reads `isActive`, not `status`. If `isActive` falls out of sync with `status`, users see confirmed (green) nodes but the flow panel is still locked.

### Code Reference

| Location | Line | Issue |
|---|---|---|
| `BoundedContextTree.tsx` | 463 | `allConfirmed` checks `isActive !== false` |
| `BoundedContextTree.tsx` | 237 | Checkbox sets `status: 'confirmed'` via `toggleContextNode` |
| `BusinessFlowTree.tsx` | ~800 | Panel lock reads `isActive`, not `status` |

### Fix

**Option A (recommended)**: Make `allConfirmed` consistent — check `status === 'confirmed'`:

```typescript
const allConfirmed = contextNodes.length > 0 && contextNodes.every((n) => n.status === 'confirmed');
```

**Option B**: Ensure `toggleContextNode` always sets both `status: 'confirmed'` and `isActive: true` atomically, and document that `isActive` is the canonical "done" flag.

Also audit all callers of `isActive !== false` (especially BusinessFlowTree panel lock) to use the same flag as `allConfirmed`.

---

## Issue 4: Medium "Continue → Component Tree" Button Unresponsive

**File**: BusinessFlowTree.tsx

### Root Cause

Two sub-issues:

**Sub-issue 4a — Early-return in handler** (`BusinessFlowTree.tsx` line 759):

```typescript
const handleContinueToComponents = useCallback(async () => {
  if (componentGenerating || flowNodes.length === 0) return;  // ← early return
  setComponentGenerating(true);
  // ...
});
```

If `componentGenerating` is `true` (from a previous failed/pending call that didn't clear the flag), the button click does nothing. The `finally` block should always clear this flag, but if the component remounts or the state is stale, the button appears dead.

**Sub-issue 4b — `canGenerateComponents` misalignment** (`BusinessFlowTree.tsx` line 825):

```typescript
const canGenerateComponents = useMemo(() => {
  const activeContexts = contextNodes.filter((ctx) => ctx.isActive !== false);
  const selectedContextSet = new Set(selectedNodeIds.context);
  const validContexts = selectedContextSet.size > 0
    ? activeContexts.filter((ctx) => selectedContextSet.has(ctx.nodeId))
    : activeContexts;
  return validContexts.length > 0 && flowNodes.length > 0;
}, [...]);
```

Button disabled: `!canGenerateComponents || componentGenerating` (line 906).

The mismatch: `canGenerateComponents` checks `validContexts.length > 0` (active contexts OR selected active contexts), but `handleContinueToComponents` sends `contextsToSend` which may be empty (user selected deactivated contexts). The button is enabled, the click fires, the API returns 400 silently (Issue 1), and the toast shows an unexplained generic error. From the user's perspective the button "didn't work."

### Code Reference

| Location | Line | Issue |
|---|---|---|
| `BusinessFlowTree.tsx` | 759 | `if (componentGenerating) return` — stale state makes button dead |
| `BusinessFlowTree.tsx` | 825–832 | `canGenerateComponents` checks validContexts, not contextsToSend |
| `BusinessFlowTree.tsx` | 906 | Button disabled reads `canGenerateComponents` |

### Fix

**4a**: Add a visual indicator that generation is in-progress (button already shows `'◌ 生成中...'`). Add a cleanup effect to reset `componentGenerating` on unmount:

```typescript
useEffect(() => {
  return () => setComponentGenerating(false);
}, []);
```

**4b**: Synchronize `canGenerateComponents` with what `handleContinueToComponents` actually sends:

```typescript
const canGenerateComponents = useMemo(() => {
  const activeContexts = contextNodes.filter((ctx) => ctx.isActive !== false);
  const selectedContextSet = new Set(selectedNodeIds.context);
  const contextsToSend = selectedContextSet.size > 0
    ? activeContexts.filter((ctx) => selectedContextSet.has(ctx.nodeId))
    : activeContexts;
  const activeFlows = flowNodes.filter((f) => f.isActive !== false);
  const selectedFlowSet = new Set(selectedNodeIds.flow);
  const flowsToSend = selectedFlowSet.size > 0
    ? activeFlows.filter((f) => selectedFlowSet.has(f.nodeId))
    : activeFlows;
  return contextsToSend.length > 0 && flowsToSend.length > 0;
}, [contextNodes, flowNodes, selectedNodeIds]);
```

---

## Summary of All Fixes

| # | Priority | File | Line(s) | 1-Sentence Fix |
|---|---|---|---|---|
| 1a | P0 | `canvasApi.ts` | ~145 | Make `handleResponseError` properly `async` and `await res.json()` before accessing error message |
| 1b | P0 | `BusinessFlowTree.tsx` | ~780 | Guard `handleContinueToComponents` with `if (contextsToSend.length === 0 \|\| flowsToSend.length === 0)` before API call |
| 2 | P0 | `ProjectBar.tsx` | 160–161 | Change `hasAllNodes` to require `isActive !== false` on all nodes, not just non-empty arrays |
| 3 | Medium | `BoundedContextTree.tsx` | 463 | Change `allConfirmed` to check `status === 'confirmed'` (matching the checkbox) instead of `isActive !== false` |
| 4a | Medium | `BusinessFlowTree.tsx` | ~759 | Add `useEffect` cleanup to reset `componentGenerating` on unmount to prevent stale dead button |
| 4b | Medium | `BusinessFlowTree.tsx` | 825–832 | Make `canGenerateComponents` mirror the actual `contextsToSend`/`flowsToSend` logic used in the handler |
