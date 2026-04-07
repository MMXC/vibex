# Spec: Epic 2 — UI Consistency & Type Safety

**Epic ID**: E-A2
**Epic Name**: UI Consistency & Type Safety
**Parent**: vibex-analyst-proposals-vibex-proposals-20260410
**Stories**: S2.1, S2.2
**Total Estimated Hours**: 3h
**Priority**: P1 (Sprint Day 1, afternoon)

---

## Story S2.1: Tree Component Button Unification

**ID**: S2.1
**Title**: Unified Tree Toolbar Button Component
**Proposal**: A-P1-1
**Estimated Hours**: 2h
**Assignee**: Dev

### Problem Statement

`BoundedContextTree`, `FlowTree`, and `ComponentTree` each have their own Toolbar button implementations with inconsistent styles, different icon libraries (Heroicons vs Lucide vs inline SVGs), and duplicated code. This creates maintenance burden and visual inconsistency.

### Technical Specification

#### Current State

```
src/
  components/trees/
    BoundedContextTree/
      Toolbar.tsx      # Has own button implementation (Heroicons)
    FlowTree/
      Toolbar.tsx      # Has own button implementation (Lucide)
    ComponentTree/
      Toolbar.tsx      # Has own button implementation (inline SVG)
```

#### Target State

```
src/
  components/ui/
    TreeButton.tsx     # NEW: shared button component
  components/trees/
    BoundedContextTree/
      Toolbar.tsx      # Use TreeButton
    FlowTree/
      Toolbar.tsx      # Use TreeButton
    ComponentTree/
      Toolbar.tsx      # Use TreeButton
```

#### TreeButton Component Interface

```typescript
// src/components/ui/TreeButton.tsx
interface TreeButtonProps {
  icon: 'add' | 'delete' | 'edit' | 'collapse' | 'expand';
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  title?: string; // for accessibility
}
```

#### Icon Library Decision
Pick one icon library (recommend **Lucide React**) and migrate all Tree buttons to it. Remove Heroicons and inline SVG duplicates from tree components.

#### Migration Steps

1. Create `src/components/ui/TreeButton.tsx`
2. Migrate one Tree (recommend `FlowTree`) first to validate
3. Migrate remaining two Trees
4. Remove old button implementations
5. Update Playwright E2E tests

#### Acceptance Criteria

```
Given: BoundedContextTree, FlowTree, or ComponentTree renders
When:  the toolbar is displayed
Then:  all toolbar buttons are instances of TreeButton
  AND: only one icon library is used (Lucide React)
  AND: button styles are visually consistent across all three Trees

Given: a user clicks the add button on any Tree
When:  the click is registered
Then:  the onClick handler is called exactly once
  AND: no click event is lost or doubled

Given: pnpm test runs
When:  tests complete
Then:  all Tree component tests pass
  AND: button behavior is unchanged (not just style)

Given: Playwright E2E runs
When:  clicking add/delete/edit buttons on each Tree type
Then:  expected actions are triggered correctly
```

### Implementation Notes

- Button style changes should NOT affect onClick behavior — this is purely a UI refactor
- Maintain `data-testid` attributes for E2E stability
- Ensure accessibility: `aria-label`, keyboard navigation (Tab, Enter, Space)

---

## Story S2.2: selectedNodeIds Type Consolidation

**ID**: S2.2
**Title**: selectedNodeIds Single Source of Truth
**Proposal**: A-P1-2
**Estimated Hours**: 1h
**Assignee**: Dev

### Problem Statement

`selectedNodeIds` is defined in both `treeStore.ts` (as `Set<string>`) and `canvasStore.ts` (as `string[]`). The type mismatch requires manual conversion when accessing from different stores, and the two definitions can get out of sync.

### Technical Specification

#### Decision: Consolidate to treeStore as single source of truth

#### Before

```typescript
// treeStore.ts
selectedNodeIds: Set<string> = new Set();

// canvasStore.ts
selectedNodeIds: string[] = [];
```

#### After

```typescript
// treeStore.ts — DEFINITIVE SOURCE
selectedNodeIds: Set<string> = new Set();
selectedNodeIdsArray: () => string[]; // getter for Array consumers

// canvasStore.ts — READ ONLY via treeStore
// selectedNodeIds removed entirely; use treeStore.selectedNodeIds
```

#### Migration Steps

1. Identify all usages of `canvasStore.selectedNodeIds`
2. Replace with `treeStore.selectedNodeIds`
3. If canvasStore needs array form, use `treeStore.selectedNodeIdsArray()`
4. Remove `selectedNodeIds` from canvasStore
5. Verify no TypeScript errors

#### Type Definition

```typescript
// The Set<string> type is correct because:
// - O(1) lookup for selection state checks
// - Automatic deduplication
// - Standard JavaScript built-in

type NodeId = string;
type NodeIdSet = Set<NodeId>;
```

#### Acceptance Criteria

```
Given: the codebase is type-checked
When:  tsc --noEmit runs
Then:  no "Property 'selectedNodeIds' does not exist on type 'CanvasStore'" error
  AND: no "Type 'Set<string>' is not assignable to type 'string[]'" errors

Given: selectedNodeIds is used anywhere in the codebase
When:  a node is selected
Then:  the Set in treeStore is the only source of truth
  AND: canvasStore does not maintain a separate copy

Given: pnpm test runs
When:  tests access selectedNodeIds
Then:  all tests pass
  AND: selection behavior is unchanged

Given: a developer imports selectedNodeIds from canvasStore
When:  they try to access it
Then:  TypeScript error: "Property 'selectedNodeIds' does not exist"
```

### Implementation Notes

- `Set` operations to know: `add()`, `delete()`, `has()`, `clear()`, `size`, spread `[...set]`
- Provide `treeStore.selectedNodeIdsArray()` helper if needed for array consumers
- Search entire codebase: `rg "selectedNodeIds" --type ts --type tsx`
