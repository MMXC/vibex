# Analysis: BusinessFlowTree Hidden by Guard on Canvas Tab Switch

**Project**: canvas-flowtree-guard-fix  
**Stage**: analyze-requirements  
**Date**: 2026-04-05  
**Analyst**: analyst agent  

---

## 1. How Canvas Tab Switching Works

### Architecture Overview

The canvas uses a **three-tree parallel layout** with two navigation mechanisms:

| Mechanism | Component | Description |
|-----------|-----------|-------------|
| Phase progress | `PhaseProgressBar` | Vertical stages: input → context → flow → component → prototype |
| Tab bar | `TabBar` | Three tabs: 上下文 (context) / 流程 (flow) / 组件 (component) |

### State Management

State lives in `contextStore.ts` (Zustand), shared across three store slices:

```typescript
// contextStore.ts
activeTree: TreeType | null;  // 'context' | 'flow' | 'component' | null
setActiveTree: (tree: TreeType | null) => void;

// phase also lives here:
phase: Phase;  // 'input' | 'context' | 'flow' | 'component' | 'prototype'
setPhase: (phase: Phase) => void;
```

### Tab Switching Flow

1. User clicks TabBar tab → `setActiveTree(tabId)` is called
2. `activeTree` updates in store
3. `CanvasPage.tsx` computes derived flags:
   ```typescript
   const contextActive = activeTree === 'context' || activeTree === null;
   const flowActive   = activeTree === 'flow';          // ← strict equality
   const componentActive = activeTree === 'component';
   ```
4. These flags control `isActive` prop on `TreePanel` and `BusinessFlowTree`

### TreePanel Rendering

`TreePanel` has a CSS class system:
- `treePanelActive`: panel is active (full opacity, interactive)
- `treePanelDimmed`: panel is inactive (dimmed visually, but still rendered)

The panel **always renders** its children — it only changes CSS classes.

---

## 2. The Guard Condition Hiding the Flow Tree

### Guard Location

**File**: `BusinessFlowTree.tsx`, line 823–828

```tsx
if (!isActive) {
  return (
    <div className={styles.inactivePanel}>
      <p>请先完成上下文树后解锁</p>
    </div>
  );
}
```

### How `isActive` is Computed for BusinessFlowTree

In `CanvasPage.tsx`, `BusinessFlowTree` is rendered with:

```tsx
// Desktop layout (line 876)
<BusinessFlowTree isActive={flowActive || activeTree === null} />

// Mobile renderTabContent (line 575)
<BusinessFlowTree isActive={flowActive || activeTree === null} />
```

Where:
```typescript
const flowActive = activeTree === 'flow';  // line 605
```

### The Bug Trigger Sequence

1. User is on the **流程 (flow)** tab → `activeTree = 'flow'` → `flowActive = true` → Flow tree renders ✓
2. User clicks **上下文 (context)** tab → `setActiveTree('context')`
3. `activeTree = 'context'` → `flowActive = false`
4. Guard fires: `!isActive` → `!(false || null)` → `!(false)` → `false` → guard does NOT fire ✗
5. User clicks **组件 (component)** tab → `setActiveTree('component')`
6. `activeTree = 'component'` → `flowActive = false`
7. Guard fires: `!isActive` → `!(false || null)` → `!(false)` → `false` → guard does NOT fire ✗
8. User clicks back to **流程 (flow)** tab → `activeTree = 'flow'` → `flowActive = true` → Flow tree renders ✓

**Wait — let me reconsider.** The guard fires when `!isActive` is true, meaning when `isActive` is false. With `isActive={flowActive || activeTree === null}`:

- If `flowActive = false` AND `activeTree !== null`: `isActive = false || false = false`, `!isActive = true` → **GUARD FIRES**
- This happens when user switches FROM flow tab TO another tab (context or component)

So the flow tree gets hidden when:
1. User is on flow tab (flow tree visible) ✓
2. User clicks context tab → guard fires → flow tree shows "请先完成上下文树后解锁" message ✗

**Root scenario**: When user switches **away from** the flow tab, the guard hides the flow tree with a misleading message.

### Misleading Message

The guard message says "请先完成上下文树后解锁" (Complete context tree first to unlock), but this is:
- **Incorrect**: The flow tree data already exists and is valid
- **Misleading**: User already completed context tree to reach this phase
- **Inconsistent**: `ComponentTree` and `BoundedContextTree` do NOT have this guard (they ignore `isActive`)

---

## 3. Root Cause Analysis

### Primary Root Cause

The guard condition in `BusinessFlowTree.tsx` is **overly restrictive and semantically wrong**:

```tsx
if (!isActive) {
  return ( <div className={styles.inactivePanel}>...</div> );
}
```

The intent appears to be: *"Show inactive message when the flow tree is not the current active tab."*

But the actual effect: *"Completely hide the flow tree with a misleading lock message whenever the flow tab is not selected."*

### Contributing Factors

1. **Inconsistent design**: `BoundedContextTree` and `ComponentTree` do NOT guard on `isActive`. Only `BusinessFlowTree` has this guard, making it an outlier.

2. **Wrong message**: The lock message ("请先完成上下文树后解锁") is copy-pasted from a phase-gating design but is applied to a tab-switching scenario. The message implies the user hasn't completed the context phase, when they actually have.

3. **`flowActive` is strict equality**: `flowActive = activeTree === 'flow'` means the flow tree is only "active" when explicitly on the flow tab. There's no fallback for when flow data exists but the user is viewing another tab.

4. **No phase-based guard**: The guard should be based on `phase` (e.g., block flow tree in 'input' phase), not on `activeTree`. Currently there's no phase-based guard at all.

### Data Flow of the Bug

```
TabBar click → setActiveTree('context')
    ↓
CanvasPage re-renders
    ↓
flowActive = (activeTree === 'flow') = false
    ↓
BusinessFlowTree isActive = (flowActive || activeTree === null) = false
    ↓
Guard fires: !isActive = true
    ↓
Returns inactivePanel with "请先完成上下文树后解锁"
    ↓
Flow tree HIDDEN — data exists but inaccessible
```

---

## 4. Fix Options

### Option A: Remove the Guard Entirely (Remove `if (!isActive)` block)

**Description**: Remove the `if (!isActive)` guard from `BusinessFlowTree` entirely, aligning it with `BoundedContextTree` and `ComponentTree`.

**Behavior after fix**:
- Flow tree always renders its content (nodes, cards, drag-drop)
- `TreePanel` wrapper still handles `isActive` via CSS class (`.treePanelDimmed`)
- No lock message shown
- Flow tree stays visible and interactive across tab switches

**Work estimate**: ~0.5h (remove 6 lines of code + test)

**Pros**:
- Simplest fix, minimal code change
- Consistent with other two tree components
- Tab switching becomes seamless
- Flow data remains accessible and manipulable from any tab

**Cons**:
- Removes any phase-gating protection (if that was intentional)
- Flow tree could be modified while viewing another tab (debate: is this desired?)

---

### Option B: Fix the Guard — Use Phase-Based Gating Instead of Tab-Based Gating

**Description**: Replace the tab-based `isActive` guard with a phase-based guard that only blocks the flow tree in the 'input' phase.

**New guard logic**:
```tsx
// In BusinessFlowTree.tsx
const phase = useContextStore((s) => s.phase);

if (phase === 'input') {
  return (
    <div className={styles.inactivePanel}>
      <p>请先录入需求以解锁流程树</p>
    </div>
  );
}
```

Or more flexibly:
```tsx
// Only block if no context nodes AND not in input phase
if (!contextNodes || contextNodes.length === 0) {
  return (
    <div className={styles.inactivePanel}>
      <p>请先生成上下文树</p>
    </div>
  );
}
```

**Work estimate**: ~1h (replace guard logic + update message + test)

**Pros**:
- Guard is now semantically correct (blocks based on prerequisites, not tab selection)
- Message accurately describes the actual prerequisite
- Preserves phase-gating intent if that was the original design goal

**Cons**:
- More complex change
- Still needs careful consideration of edge cases

---

### Option C: Soft Dimming Instead of Hard Guard

**Description**: Remove the hard guard but ensure `TreePanel` dimming is visible and adequate.

**Changes**:
1. Remove `if (!isActive)` block from `BusinessFlowTree`
2. Ensure `TreePanel` properly dims the flow tree panel via `.treePanelDimmed` CSS class
3. Add visual indicator that flow tree exists but is dimmed

**Work estimate**: ~1h

**Pros**:
- Maintains visual distinction between active and inactive panels
- No hard blocking — data always accessible
- Follows existing TreePanel pattern

**Cons**:
- If user switches to flow tab expecting to see data, they might be confused why panel is dimmed

---

## 5. Recommended Solution

**Recommendation: Option A — Remove the Guard Entirely**

Rationale:
1. **Consistency**: `BoundedContextTree` and `ComponentTree` don't have this guard. `BusinessFlowTree` is the outlier. Removing the guard makes all three trees behave consistently.

2. **Usability**: Flow tree data should be accessible regardless of which tab is currently active. Users may want to reference flow data while editing context nodes.

3. **Simplicity**: Smallest code change, lowest risk, fastest to verify.

4. **Precedent**: The `TreePanel` CSS already handles active/inactive visual states via `.treePanelDimmed` class. The guard was likely an over-engineered solution to a problem already solved by CSS.

5. **No evidence of intentional phase gating**: The lock message ("请先完成上下文树后解锁") suggests the guard was meant to enforce phase progression, but there's no equivalent guard in the other trees. If phase gating is truly needed, it should be implemented consistently across all trees.

**The fix** (`BusinessFlowTree.tsx`, line 823-828):
```tsx
// REMOVE:
if (!isActive) {
  return (
    <div className={styles.inactivePanel}>
      <p>请先完成上下文树后解锁</p>
    </div>
  );
}
```

The `TreePanel` wrapper in `CanvasPage.tsx` already passes `isActive` to control the panel's CSS class, providing visual feedback without hard-hiding the content.

---

## 6. Acceptance Criteria

| # | Criteria | Verification |
|---|----------|-------------|
| AC1 | Flow tree content (flow cards, steps, drag-drop) remains visible when switching from flow tab to context or component tab | Manual test: open flow tab, add/edit a flow card, switch to context tab, switch back — flow data preserved |
| AC2 | "请先完成上下文树后解锁" lock message no longer appears when switching tabs | Manual test: visit each tab, verify no lock message overlay |
| AC3 | Flow tree is visually dimmed (via TreePanel `.treePanelDimmed` CSS) when not the active tab | Visual check: non-active flow tab should show dimmed panel |
| AC4 | Flow tree fully interactive when flow tab is active | Manual test: drag-drop, add/edit/delete flow cards all work on flow tab |
| AC5 | Existing flow tree data persists after tab switching | Manual test: create flow data, switch tabs multiple times, return to flow tab — data unchanged |
| AC6 | No regression in other tree components (context, component) | Smoke test: switch between all tabs, verify all trees work correctly |
| AC7 | Phase-based blocking still works for 'input' phase | If in 'input' phase, flow tree panel should show empty state (not lock message) |

---

## Appendix: Key File References

| File | Line | Role |
|------|------|------|
| `BusinessFlowTree.tsx` | 823–828 | Guard condition (to be removed) |
| `BusinessFlowTree.tsx` | 587 | `isActive` prop definition |
| `CanvasPage.tsx` | 605 | `flowActive` computation |
| `CanvasPage.tsx` | 876 | Desktop `BusinessFlowTree` render with `isActive` |
| `CanvasPage.tsx` | 575 | Mobile `BusinessFlowTree` render with `isActive` |
| `CanvasPage.tsx` | 559 | `TreePanel` flow tree with `isActive={flowActive}` |
| `TreePanel.tsx` | 82–84 | CSS class: `activeClass = isActive ? treePanelActive : treePanelDimmed` |
| `TabBar.tsx` | 43 | `setActiveTree(tabId)` on tab click |
| `contextStore.ts` | 30–31 | `activeTree` state definition |
| `canvas.module.css` | 1891 | `.inactivePanel` styles |
| `canvas.module.css` | 446–452 | `.treePanelActive` / `.treePanelDimmed` |
