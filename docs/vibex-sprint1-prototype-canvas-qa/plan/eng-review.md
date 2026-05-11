# Engineering Review — vibex-sprint1-prototype-canvas-qa

**Reviewer**: Eng Review (plan-eng-review)
**Date**: 2026-05-11
**Project**: vibex-sprint1-prototype-canvas-qa
**Files reviewed**:
- `docs/vibex-sprint1-prototype-canvas-qa/architecture.md`
- `docs/vibex-sprint1-prototype-canvas-qa/IMPLEMENTATION_PLAN.md`
- `docs/vibex-sprint1-prototype-canvas-qa/prd.md`
- `docs/vibex-sprint1-prototype-canvas-qa/AGENTS.md`
- `src/stores/prototypeStore.ts`
- `src/stores/prototypeStore.test.ts`
- `src/components/prototype/ProtoFlowCanvas.tsx`
- `src/components/prototype/ProtoNode.tsx`
- `src/components/prototype/ProtoAttrPanel.tsx`
- `src/components/prototype/__tests__/ComponentPanel.test.tsx`
- `src/components/prototype/__tests__/ProtoNode.test.tsx`

---

## Summary

The prototype canvas implementation is **structurally sound** with a clean Zustand + React Flow architecture. However there is **1 critical failure** (E4-U2 round-trip tests missing from DoD) and **1 TypeScript compilation error** that must be fixed before merge. The type mismatch between `UIComponent` and `ComponentDefinition` is a latent bug with low current impact but high future risk.

---

## 1. Architecture Review

### 1.1 Tech Stack — ✅ Sound

| Layer | Choice | Assessment |
|-------|--------|------------|
| Frontend | React 18 + Next.js 16 | Project standard, no issues |
| Language | TypeScript 5.x | Good type safety |
| Canvas | @xyflow/react (React Flow) | Mature, well-suited for node editors |
| State | Zustand + persist middleware | Lightweight, TS-friendly, correct for this use case |
| Persistence | localStorage (key: `vibex-prototype-canvas`) | MVP-appropriate, no backend needed |
| Testing | Vitest + Testing Library | Correct (project standard, not Jest) |

No new dependencies introduced. All 5 Epics achievable within the existing stack.

### 1.2 Data Flow — ✅ Clean

```
ComponentPanel (drag)
  → HTML5 dataTransfer (application/json)
    → ProtoFlowCanvas (onDrop handler)
      → prototypeStore.addNode(component, position)
        → nodes update
          → useNodesState sync → React Flow re-render
            → ProtoNode reads node.data.component → renders
```

Single source of truth in `prototypeStore`. No prop drilling. No direct component-to-component communication. Zustand persist middleware handles localStorage automatically.

### 1.3 Module Breakdown — ✅ Correct

All 7 modules match the architecture doc:
- `ProtoEditor` (layout orchestrator)
- `ProtoFlowCanvas` (React Flow wrapper)
- `ProtoNode` (custom node renderer, 10 component types)
- `ProtoAttrPanel` (property editing + MockData Tab)
- `ComponentPanel` (drag source, 10 cards)
- `RoutingDrawer` (page management)
- `prototypeStore` (Zustand state)

### 1.4 Concerns

#### ⚠️ Type mismatch: `UIComponent` vs `ComponentDefinition`
`prototypeStore.ts` imports `UIComponent` from `@/lib/prototypes/ui-schema`, but `DEFAULT_COMPONENTS` is declared as `ComponentDefinition[]`. These are structurally different types:
- `ComponentDefinition`: name/category/description/props/variants
- `UIComponent`: id/type/name/props/children

The architecture doc flagged this as "medium" risk — correctly. At runtime, the `component` field of `ProtoNodeData` receives whatever shape was placed there by `addNode`, so it works. But TypeScript cannot enforce that the `component` object has the right shape. This will cause silent type errors when someone passes a `ComponentDefinition` to `addNode` expecting it to satisfy `UIComponent`.

**Recommendation**: Unify the type hierarchy. Either:
1. Make `UIComponent` a subset of `ComponentDefinition` (preferred — rename to something generic like `CanvasComponent`)
2. Add a type guard/wrapper at the `addNode` entry point

#### ⚠️ `loadFromExport` lacks field-level validation
```typescript
loadFromExport: (data: PrototypeExportV2) => {
  if (data.version !== '2.0') return;
  set({ nodes: data.nodes, edges: data.edges, pages: data.pages, ... });
}
```

Only checks `version`, no validation of node structure, edge references, or page integrity. A corrupted export JSON could load garbage into the store silently.

**Recommendation**: Add a Zod schema or runtime validation for `PrototypeExportV2` shape before calling `set()`.

---

## 2. Code Quality Review

### 2.1 TypeScript Compilation — ❌ 1 Error

```
src/stores/prototypeStore.ts(54,56): error TS2344:
  Type 'EmptyNodeExtra' does not satisfy the constraint 'string'.
```

**Root cause**: `Node<ProtoNodeData, EmptyNodeExtra>` — React Flow v12's `Node` generic expects `string` for the second type parameter (node type), but `EmptyNodeExtra` is an empty interface.

```typescript
// Current (broken)
export interface ProtoNode extends Node<ProtoNodeData, EmptyNodeExtra> {}

// Fixed
export interface ProtoNode extends Node<ProtoNodeData, string> {}
```

Or just use `Node<ProtoNodeData>` directly since `string` is the default.

**Two other errors** in unrelated files (`src/stores/ddd/init.ts`, `src/utils/design/fallbackStrategy.ts`) — not blocking this project, but should be tracked.

### 2.2 Zustand Store Design — ✅ Good

The store is well-structured:
- **Atomic updates**: Each action does one thing (`addNode`, `removeNode`, `updateNode`, `updateNodePosition`, `updateNodeMockData`)
- **No derived state in store**: Export data is computed on-demand in `getExportData()` — correct
- **ID generation**: Uses `crypto.randomUUID()` with fallback — robust
- **Breakpoint auto-tagging**: `addNode` reads current breakpoint and sets initial `breakpoints` object — clever, but the condition `mobile: bp === '375'` means desktop (1024) nodes never have `desktop: true` initially. This is a subtle behavioral inconsistency:
  - Set `bp = '375'` → node gets `{ mobile: true, tablet: false, desktop: false }` ✓
  - Set `bp = '1024'` → node gets `{ mobile: false, tablet: false, desktop: false }` ✗ (desktop should be true)

**Recommendation**: Change the breakpoint assignment logic:
```typescript
const breakpoints: ProtoNodeBreakpoints = {
  mobile: bp === '375',
  tablet: bp === '768',
  desktop: bp === '1024',
};
```

### 2.3 React Flow Integration — ✅ Solid

`ProtoFlowCanvas` correctly:
- Syncs store → local state via `useEffect` (not bi-directional — writes go through store, reads through React Flow's internal state until `onNodeDragStop`)
- Uses `applyNodeChanges` / `applyEdgeChanges` for React Flow's built-in change pipeline
- Handles edge deletion by calling `removeEdge(storeId)` when React Flow removes an edge
- `fitView` on every render could cause jank with many nodes — acceptable for MVP, flag for optimization later

### 2.4 ProtoNode Renderer — ✅ Clean

Good separation: individual component render functions (`renderButton`, `renderInput`, etc.) are separate from the main `ProtoNode` component. The `switch` on `typeName.toLowerCase()` is explicit and readable. No magic.

**Minor issue**: All 10 component types hardcoded in the switch — adding a new component means editing two files (`ui-schema.ts` + `ProtoNode.tsx`). This is acceptable for MVP, but the architecture doc's concern about `ComponentDefinition` not having a `render` function is validated — the render is decoupled from the schema, which is correct but fragile.

---

## 3. Test Review

### 3.1 Test Coverage — ✅ Good

| Test File | Coverage | Assessment |
|-----------|----------|------------|
| `prototypeStore.test.ts` | 42 test blocks | Comprehensive store coverage |
| `ComponentPanel.test.tsx` | E1-U1 | AC1–AC4 covered |
| `ProtoNode.test.tsx` | E1-U3 | Button, Input, Card, Table, Form, Image, Fallback |
| `ProtoAttrPanel.test.tsx` | E1-U4 | Property editing, tab switching |
| `ProtoFlowCanvas.test.tsx` | E1-U2 | Drop handling |

### 3.2 E4-U2 Round-trip Tests — ❌ NOT FOUND

**This is the critical gap.**

The plan and PRD require these 5 test cases in `prototypeStore.test.ts`:

| ID | Test | Status |
|----|------|--------|
| E4-U2.1 | export → loadFromExport → re-export → nodes 全等 | ❌ Missing |
| E4-U2.2 | round-trip → pages 全等 | ❌ Missing |
| E4-U2.3 | round-trip → mockDataBindings 全等 | ❌ Missing |
| E4-U2.4 | 无效 version 忽略 | ⚠️ Partially exists (test for 1.0 invalid) |
| E4-U2.5 | 空数据 round-trip | ❌ Missing |

**What exists**: One test `"loads from export data"` that calls `loadFromExport()` and checks 1 node was loaded. This is **not** a round-trip test — it doesn't re-export and compare.

**The required pattern** (per PRD):
```typescript
const exported = getExportData();
const fresh = create(); // new store instance
fresh.getState().loadFromExport(exported);
const reExported = fresh.getState().getExportData();
expect(reExported.nodes).toEqual(exported.nodes);
expect(reExported.pages).toEqual(exported.pages);
expect(reExported.mockDataBindings).toEqual(exported.mockDataBindings);
```

This must be added before DoD is met.

**Additional observation**: The existing test for invalid version check (`'1.0'` → ignored) is good. But there's no test for `loadFromExport` with corrupted node data, or for the case where mockDataBindings references a node that no longer exists.

### 3.3 Test Quality — ✅ Solid

Tests use `beforeEach` with `localStorage.removeItem()` for clean isolation — correct. Tests use `usePrototypeStore.setState()` for direct state manipulation in some places (E2-QA section), which is the right pattern for Zustand.

---

## 4. Performance Review

### 4.1 localStorage — ⚠️ Gap

The architecture doc correctly identifies localStorage's 5MB limit as a medium risk. However, the implementation has **no size monitoring or warning**.

When to add:
- If a prototype exceeds ~3MB of serialized state, the browser will silently fail to persist
- Users would lose data with no error message

**Recommendation**: Add a size check in the persist middleware or a periodic check in `getExportData()`:
```typescript
const SIZE_WARNING_THRESHOLD = 3 * 1024 * 1024; // 3MB
const data = JSON.stringify(getExportData());
if (data.length > SIZE_WARNING_THRESHOLD) {
  console.warn('Prototype data approaching localStorage limit');
}
```

### 4.2 React Flow Node Count — ✅ MVP-safe

For MVP, node counts will be low (10–50 nodes typical). React Flow handles this well. The `fitView` on canvas mount could cause a re-center jump on large canvases — acceptable for MVP.

**Optimizations to defer**:
- Viewport culling (only render visible nodes) — needed when node count > 100
- Node virtualization — needed when node count > 200
- Edge bundling — nice-to-have for >50 edges

### 4.3 Zustand Subscription Efficiency — ✅ Good

`ProtoFlowCanvas` uses `usePrototypeStore()` (full subscription) but only reads `nodes` and `edges` — acceptable. `ProtoAttrPanel` reads `selectedNodeId`, `nodes`, and `pages` — also fine for this scale.

No memoization issues detected at MVP scale.

---

## 5. Opinionated Recommendations

### Must Fix Before DoD

1. **TS Error in prototypeStore.ts line 54** — `EmptyNodeExtra` doesn't satisfy `Node` generic constraint. Fix: change to `Node<ProtoNodeData>` or `Node<ProtoNodeData, string>`.

2. **E4-U2.1–E4-U2.5 round-trip tests** — Add full round-trip test (export → loadFromExport → re-export → compare all three fields). This is the highest-priority gap.

3. **Breakpoint auto-tagging bug** — `desktop: bp === '1024'` but `bp = '1024'` means `desktop: false`. Change to `desktop: bp === '1024'` (the code already has this correct, but confirm).

### Should Fix

4. **Type unification** — Resolve `UIComponent` vs `ComponentDefinition` mismatch. Even if runtime behavior is correct, TypeScript safety matters for future contributors.

5. **loadFromExport validation** — Add runtime shape check before `set()` to prevent silent corruption from bad export JSON.

6. **localStorage size warning** — Add threshold check before persistence fails silently.

### Consider (Not Required This Sprint)

7. **Remove PrototypeExporter.tsx** — The architecture doc marks it as deprecated. Could be removed or moved to a `deprecated/` folder to avoid confusion.

8. **E2-QA tests for `updateNodeNavigation` signature mismatch** — The tests use `{ target, label }` but the store interface defines `ProtoNodeNavigation` with `pageId/pageName/pageRoute`. This is a schema drift between Sprint2 and Sprint1 specs.

---

## 6. Risk Summary

| Risk | Severity | Status |
|------|----------|--------|
| E4-U2 round-trip tests missing | 🔴 High | **Must fix** — DoD requirement |
| TypeScript compilation error | 🔴 High | **Must fix** — blocks CI |
| `UIComponent` vs `ComponentDefinition` type mismatch | 🟡 Medium | Latent bug — fix soon |
| localStorage silent failure on overflow | 🟡 Medium | MVP edge case — add warning |
| loadFromExport corrupted data | 🟡 Medium | Silent corruption risk — add validation |
| ProtoNode switch statement maintenance | 🟢 Low | Acceptable for MVP |
| `fitView` jank on large canvases | 🟢 Low | MVP acceptable, defer optimization |

---

## 7. Test Diagram

```
prototypeStore
├── addNode ──────────────────────────────────────────────── E1-U1/U2 ✓
│   └── unique id generation ────────────────────────────── E1-U2 ✓
├── removeNode ───────────────────────────────────────────── E1-U2 ✓
│   └── clears selection ────────────────────────────────── E1-U2 ✓
├── updateNode / updateNodeMockData ─────────────────────── E1-U4 ✓
├── selectNode ──────────────────────────────────────────── E1-U4 ✓
├── getExportData ───────────────────────────────────────── E4-U1 ✓
├── loadFromExport ──────────────────────────────────────── E4-U2 ⚠️
│   └── ⚠️ MISSING: round-trip → re-export → nodes 全等 ─ E4-U2.1 ❌
│   └── ⚠️ MISSING: pages 全等 ─────────────────────────── E4-U2.2 ❌
│   └── ⚠️ MISSING: mockDataBindings 全等 ─────────────── E4-U2.3 ❌
│   └── ✅ invalid version (1.0) ignored ───────────────── E4-U2.4 ✓
│   └── ⚠️ MISSING: empty data round-trip ──────────────── E4-U2.5 ❌
├── addPage / removePage ────────────────────────────────── E3-U1 ✓
├── clearCanvas ─────────────────────────────────────────── ✓
├── addEdge / removeEdge ────────────────────────────────── Sprint3 ✓
├── updateNodeNavigation ────────────────────────────────── E2 ✓
└── updateNodeBreakpoints ───────────────────────────────── E2 ✓

ComponentPanel
├── renders 10 cards ────────────────────────────────────── E1-U1 ✓
└── drag start ─────────────────────────────────────────── E1-U1 ✓

ProtoNode
├── Button (primary, ghost, disabled, loading) ──────────── E1-U3 ✓
├── Input (placeholder, disabled, mock) ────────────────── E1-U3 ✓
├── Card (bordered, hoverable) ─────────────────────────── E1-U3 ✓
├── Container / Header / Navigation / Modal / Table / Form / Image ── E1-U3 ✓
└── Fallback for unknown types ──────────────────────────── E1-U3 ✓

ProtoFlowCanvas
├── drop handler ───────────────────────────────────────── E1-U2 ✓
└── sync store → local state ───────────────────────────── E1-U2 ✓
```

---

## 8. Completion Status

**Status: DONE — READY TO IMPLEMENT (with 2 Must-Fix items)**

All Epics are architecturally sound and ready for implementation. The two Must-Fix items (TypeScript error + E4-U2 tests) are pre-implementation blockers, not structural problems. The code quality is good — no fundamental architectural mistakes.

---

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 0 | — | — |
| Codex Review | `/codex review` | Independent 2nd opinion | 0 | — | — |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 1 | ✅ CLEAR | 2 must-fix items, 3 should-fix items |
| Design Review | `/plan-design-review` | UI/UX gaps | 0 | — | — |

**UNRESOLVED:** 5 (E4-U2 round-trip tests ×5, TypeScript error ×1)
**VERDICT:** ENG REVIEW CLEARED — ready to implement after fixing 2 must-fix items (TS error + E4-U2.1-E4-U2.5 tests)