---
title: "fix: Vibex Canvas UX — Silent 400 / State Inconsistency"
type: fix
status: active
date: 2026-04-17
origin: docs/vibex-canvas-ux-fix/prd.md
---

# fix: Vibex Canvas UX — Silent 400 / State Inconsistency

## Overview

Fix 4 interconnected UX bugs in VibeX Canvas's 3-step flow (Context Tree → Flow Tree → Component Tree):
1. API 400 errors show generic toast, not backend detail
2. Component tree button disabled logic inconsistent with handler payload
3. Project creation button permanently disabled (hasAllNodes only checks length)
4. Confirm/Complete state fields out of sync (`isActive` vs `status: 'confirmed'`)

## Problem Frame

Users complete context tree → flow tree → click "继续·组件树" → backend returns 400 but toast shows only `"生成组件树失败"` — no hint what to fix. Separately, even after confirming all nodes, the creation button stays disabled and the next panel stays locked.

Root causes: async/await bug in error handler + three state derivation inconsistencies.

## Requirements Trace

- R1: Backend error messages must surface to toast (not swallowed by `res.json()` without await)
- R2: "继续·组件树" button disabled when no valid payload would be sent
- R3: "创建项目" button unlocks only when all nodes across all 3 trees are confirmed (`isActive !== false`)
- R4: "确认所有" triggers both panel unlock and button state change atomically

## Scope Boundaries

- **In scope**: Pure frontend fixes in `canvasApi.ts`, `BusinessFlowTree.tsx`, `ProjectBar.tsx`, `BoundedContextTree.tsx`
- **Not in scope**: Backend error message format changes, new API endpoints, database schema changes

## Context & Research

### Relevant Code and Patterns

| File | Relevant pattern |
|------|----------------|
| `vibex-fronted/src/lib/canvas/api/canvasApi.ts:164` | `handleResponseError` — `res.json()` without await |
| `vibex-fronted/src/components/canvas/BusinessFlowTree.tsx:825–832` | `canGenerateComponents` — checks `validContexts` only, missing `flowsToSend` |
| `vibex-fronted/src/components/canvas/ProjectBar.tsx:160` | `hasAllNodes` — checks `nodes.length > 0`, not `isActive` |
| `vibex-fronted/src/components/canvas/BoundedContextTree.tsx:463` | `allConfirmed` — checks `isActive !== false`, not `status: 'confirmed'` |
| `vibex-fronted/src/components/canvas/BoundedContextTree.tsx:458` | `handleConfirmAll` — calls `advancePhase()` without setting `status` |

### Institutional Learnings

From `vibex-canvas-silent-400` (sibling project): same `handleResponseError` bug confirmed, same `contextsToSend` empty check missing. This plan supersedes and combines both.

## Key Technical Decisions

- **D1**: Extract `computeTreePayload()` as a pure function shared by UI (useMemo for `canGenerateComponents`) and handler. Eliminates the "derived in one place, used differently in another" bug class entirely.
- **D2**: `handleResponseError` becomes `async function` returning `Promise<never>`. All call sites add `await`. Backward-compatible in that callers already `await` the canvas API methods.
- **D3**: `hasAllNodes` checks `every(isActive !== false)` per tree — mirrors button's intent: all nodes confirmed before project creation.
- **D4**: `allConfirmed` checks `every(status === 'confirmed')` — aligns with what the checkbox actually sets. `handleConfirmAll` atomically sets both `status: 'confirmed'` and `isActive: true` on each node before calling `advancePhase()`.

## High-Level Technical Design

```
API Error Flow (E1)
═══════════════════════════════════════════════
fetch() ──► Response ──► handleResponseError(res, defaultMsg)
                              │
                              ├── res.json() [with await] ──► { error | message | details }
                              │                                     │
                              └── throw Error(message)            │
                                                              │
                                              toast.showToast(message, 'error')

Button Readiness (E2)
═══════════════════════════════════════
selectedNodeIds.context[] ──┐
selectedNodeIds.flow[]    ──┼─► computeTreePayload() ──► contextsToSend[]
contextNodes[]           ──┤                           flowsToSend[]
flowNodes[]             ──┘                           │
                                                     ├── canGenerateComponents = length > 0 && length > 0
                                                     └── (useMemo in render) ──► button.disabled = !canGenerateComponents

State Semantics (E4)
═══════════════════════════════════════
User clicks "确认所有"
    │
    ├── forEach node: confirmContextNode(nodeId)  ──► sets status: 'confirmed', isActive: true
    └── advancePhase()
           │
           ├── allConfirmed = contextNodes.every(n => n.status === 'confirmed')  [F4.1]
           └── BusinessFlowTree.isActive prop = allConfirmed  [F4.3]
```

## Implementation Units

- [ ] **Unit 1: E1-F1.1 — Fix handleResponseError async/await**

**Goal:** Backend error detail surfaces to toast instead of generic "API 请求失败: 400"

**Requirements:** R1

**Dependencies:** None

**Files:**
- Modify: `vibex-fronted/src/lib/canvas/api/canvasApi.ts`
- Test: `vibex-fronted/src/lib/canvas/api/canvasApi.test.ts`

**Approach:**
- Change `handleResponseError` from sync to `async function` returning `Promise<never>`
- `res.json()` wrapped in `try/catch` with `await`
- Extract error from `error`, `message`, or `details` field (in that priority)
- Fallback to `defaultMsg` on parse failure
- Add `await` to all 3 call sites inside `canvasApi.ts`

**Patterns to follow:**
- Existing `validatedFetch` pattern in same file uses `await res.json()` correctly — mirror that

**Test scenarios:**
- Happy path: backend returns `{ "error": "上下文节点不能为空" }` → `Error.message` contains that string
- Edge case: backend returns `{ "message": "session 已过期" }` → extracts `message` field
- Edge case: backend returns 400 with no JSON body → fallback to `defaultMsg`
- Error path: `res.json()` throws → fallback to `HTTP {status}`
- Integration: call site `await handleResponseError(res, 'default')` returns `Promise<never>` and throws

**Verification:**
- `yarn test canvasApi.test.ts` passes all AC
- `grep -n "handleResponseError" canvasApi.ts` shows all call sites use `await`

---

- [ ] **Unit 2: E1-F1.2 — Global res.json() safety audit**

**Goal:** Ensure no other `res.json()` calls in `canvasApi.ts` are missing `await`

**Requirements:** R1

**Dependencies:** E1-F1.1

**Files:**
- Scan: `vibex-fronted/src/lib/canvas/api/canvasApi.ts`

**Approach:**
- `grep -n "res\.json()" canvasApi.ts` — enumerate all call sites
- Verify each is either in an `async` function or after `await` or inside `handleResponseError` (which is now fixed)

**Test scenarios:**
- Scan: each `res.json()` call is safe (verified by grep + manual review)

**Verification:**
- Grep output shows 0 unsafe calls

---

- [ ] **Unit 3: E2-F2.1 — computeTreePayload shared pure function**

**Goal:** `canGenerateComponents` and `handleContinueToComponents` use identical payload derivation logic

**Requirements:** R2

**Dependencies:** None

**Files:**
- Create: `vibex-fronted/src/utils/canvasPayload.ts`
- Modify: `vibex-fronted/src/components/canvas/BusinessFlowTree.tsx`
- Test: `vibex-fronted/src/components/canvas/BusinessFlowTree.test.tsx`

**Approach:**
- Extract `computeTreePayload(contextNodes, flowNodes, selectedNodeIds)` as exported pure function
- Logic: `activeContexts = filter(isActive !== false)`; apply selection filter if set, else use all; same for flows
- `canGenerateComponents` useMemo calls `computeTreePayload`, derives `contextsToSend.length > 0 && flowsToSend.length > 0`
- `handleContinueToComponents` calls `computeTreePayload` once, reuses result for both API call and validation

**Technical design:**
```typescript
// Directional guidance — implementer writes actual code
export function computeTreePayload(nodes, flows, selected) {
  // Derive active + selected contexts
  // Derive active + selected flows
  // Return { contextsToSend, flowsToSend }
}
```

**Patterns to follow:**
- Pure function in `utils/` directory — no React hooks, no store access

**Test scenarios:**
- Happy path: active contexts + active flows (no selection) → both arrays non-empty
- Edge case: all contexts inactive → contextsToSend empty
- Edge case: all flows inactive → flowsToSend empty
- Edge case: selection set but all selected nodes inactive → contextsToSend empty (same for flows)
- Happy path: partial active + partial selection → sends only active-selected nodes

**Verification:**
- `canGenerateComponents` value matches `handleContinueToComponents` validation outcome for all 4 edge cases
- Unit tests pass

---

- [ ] **Unit 4: E2-F2.2 — componentGenerating unmount cleanup**

**Goal:** Prevent stale `componentGenerating === true` from permanently disabling the button

**Requirements:** R2

**Dependencies:** E2-F2.1

**Files:**
- Modify: `vibex-fronted/src/components/canvas/BusinessFlowTree.tsx`
- Test: `vibex-fronted/src/components/canvas/BusinessFlowTree.test.tsx`

**Approach:**
- Add `useEffect(() => () => setComponentGenerating(false), [])` for unmount cleanup
- Add test that unmounts component mid-generation and verifies button state resets on remount

**Test scenarios:**
- Integration: component unmounts while `componentGenerating === true` → button enabled on remount

**Verification:**
- Test passes; button state correct on remount

---

- [ ] **Unit 5: E3-F3.1 — hasAllNodes checks every(isActive !== false)**

**Goal:** "创建项目" button unlocks only when all nodes across all 3 trees are confirmed

**Requirements:** R3

**Dependencies:** None

**Files:**
- Modify: `vibex-fronted/src/components/canvas/ProjectBar.tsx`
- Test: `vibex-fronted/src/components/canvas/ProjectBar.test.tsx`

**Approach:**
- Change `hasAllNodes` from `nodes.length > 0` to `nodes.every(n => n.isActive !== false)` per tree
- Keep `length > 0` as prerequisite (empty tree means nothing generated yet)
- Button `disabled` and tooltip both derive from `hasAllNodes`

**Patterns to follow:**
- Existing `hasNodes()` helper in same file — chain `every()` calls

**Test scenarios:**
- Happy path: all 3 trees have nodes, all `isActive !== false` → button enabled
- Edge case: 3 trees have nodes but some `isActive === false` → button disabled
- Edge case: component tree empty → button disabled (even if other 2 trees ready)
- Regression: existing normal-path users unaffected (active nodes → enabled)

**Verification:**
- Tests pass; button state matches `hasAllNodes` derivation

---

- [ ] **Unit 6: E3-F3.2 — Button tooltip reflects actual hasAllNodes failure reason**

**Goal:** Tooltip tells users why the button is disabled, not a generic message

**Requirements:** R3

**Dependencies:** E3-F3.1

**Files:**
- Modify: `vibex-fronted/src/components/canvas/ProjectBar.tsx`
- Test: `vibex-fronted/src/components/canvas/ProjectBar.test.tsx`

**Approach:**
- Update tooltip to derive specific reason from which tree(s) fail `hasAllNodes`:
  - All empty → "请先生成组件树"
  - Context inactive → "请先确认所有上下文节点"
  - Flow inactive → "请先确认所有流程节点"
  - Component inactive → "请先确认所有组件节点"
  - Mixed → first failure wins (prioritized: context > flow > component)

**Test scenarios:**
- Edge case: component tree empty → tooltip shows "请先生成组件树"
- Edge case: context nodes inactive → tooltip shows specific context message

**Verification:**
- Tooltip text matches actual failure condition

---

- [ ] **Unit 7: E4-F4.1 — allConfirmed checks status === 'confirmed'**

**Goal:** Panel unlock and button state both reflect the user's explicit confirm action

**Requirements:** R4

**Dependencies:** None

**Files:**
- Modify: `vibex-fronted/src/components/canvas/BoundedContextTree.tsx`
- Audit: `vibex-fronted/src/components/canvas/` (grep isActive usages)
- Test: `vibex-fronted/src/components/canvas/BoundedContextTree.test.tsx`

**Approach:**
- Change `allConfirmed` from `contextNodes.every(n => n.isActive !== false)` to `contextNodes.every(n => n.status === 'confirmed')`
- Run `grep -rn "isActive" components/canvas/` to find all usages — flag any that check completion state differently
- Document findings in AGENTS.md ADR

**Patterns to follow:**
- `node.status === 'confirmed'` already used in checkbox `checked` attribute — consistency with existing pattern

**Test scenarios:**
- Happy path: all nodes `status === 'confirmed'` → `allConfirmed === true`
- Edge case: all `isActive !== false` but none `status === 'confirmed'` → `allConfirmed === false`
- Regression: existing checkbox-to-confirmation behavior unchanged

**Verification:**
- Tests pass; grep audit complete; findings documented

---

- [ ] **Unit 8: E4-F4.2 — handleConfirmAll atomically sets both status and isActive**

**Goal:** "确认所有" triggers both the confirmation state and the panel unlock signal in one atomic operation

**Requirements:** R4

**Dependencies:** E4-F4.1

**Files:**
- Modify: `vibex-fronted/src/components/canvas/BoundedContextTree.tsx`
- Test: `vibex-fronted/src/components/canvas/BoundedContextTree.test.tsx`

**Approach:**
- `handleConfirmAll` calls `confirmContextNode(nodeId)` for each node (sets `status: 'confirmed'` and `isActive: true` if store supports it)
- Then calls `advancePhase()`
- Order: confirm first, then advance — avoids brief panel unlock/lock flicker

**Test scenarios:**
- Integration: calling `handleConfirmAll` → all nodes `status === 'confirmed'` AND `allConfirmed === true` immediately after
- Happy path: click "确认所有" → button text changes to "✓ 已确认 → 继续到流程树" instantly

**Verification:**
- Tests pass; `allConfirmed` immediately true after call; no panel flicker

---

- [ ] **Unit 9: E4-F4.3 — Panel lock uses same flag as allConfirmed**

**Goal:** `BusinessFlowTree`'s `inactivePanel` shows/hides based on `allConfirmed` outcome, not an independent `isActive` prop

**Requirements:** R4

**Dependencies:** E4-F4.1, E4-F4.2

**Files:**
- Audit: `vibex-fronted/src/components/canvas/BusinessFlowTree.tsx` (inactivePanel prop source)
- Test: `vibex-fronted/src/components/canvas/BusinessFlowTree.test.tsx`

**Approach:**
- Trace `inactivePanel` prop origin: currently passed as `isActive={!allConfirmed}` from parent `CanvasPage.tsx`
- Confirm this is consistent with the F4.1 semantic change
- Update test to assert `inactivePanel` visibility matches `status === 'confirmed'` outcome

**Test scenarios:**
- Happy path: all nodes confirmed → `inactivePanel` not rendered
- Edge case: partial confirmation → `inactivePanel` still shown

**Verification:**
- Panel lock behavior consistent with `allConfirmed`

## System-Wide Impact

- **Interaction graph:** No new callbacks or event emitters. State changes flow through existing Zustand stores.
- **Error propagation:** E1 fix changes error shape from `Error('API 请求失败: 400')` to `Error(<backend detail>)` — callers already catch `Error`, no interface change.
- **State lifecycle risks:** E4 semantic change (`isActive` → `status`) could affect any component that reads `isActive` as a completion flag. Full grep audit in F4.1 mitigates.
- **API surface parity:** No API changes. Frontend-only.
- **Unchanged invariants:** Normal flow (all nodes active + confirmed) — button enabled, panel unlocked, API success → unchanged.

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| E4 semantic change (`isActive` → `status`) breaks other `isActive` consumers | Mandatory grep audit in F4.1 before merge |
| `hasAllNodes` new behavior locks existing users with inactive nodes | PM confirmed: all-confirmed is correct product intent |
| `handleResponseError` type change cascades to callers | Verified all 3 call sites are inside `async` functions |
| `componentGenerating` cleanup causes brief flash when remounting | `setComponentGenerating(false)` on unmount is instant, no visual artifact |

## Documentation / Operational Notes

- Update AGENTS.md with new ADR entries (already done in project docs)
- No runbooks, monitoring, or migration needed — pure frontend behavior fix

## NOT in scope

- Backend error message format changes (E1 fix handles any backend error shape)
- Adding i18n for toast messages (hardcoded Chinese acceptable per project convention)
- Refactoring `BoundedContextTree`'s checkbox state machine (separate Epic)
- Unit Index table format in IMPLEMENTATION_PLAN.md (handled separately per task spec)

## What already exists

- `useToast` hook — used by existing code, no new infrastructure needed
- Zustand stores (`useContextStore`, `useFlowStore`, `useComponentStore`) — existing, no changes
- `vi.mock` pattern in existing test files — follow existing conventions
- `computeTreePayload` logic already partially exists in `handleContinueToComponents` — extracted, not invented

## Sources & References

- **Origin document:** `docs/vibex-canvas-ux-fix/prd.md`
- **Sibling project:** `docs/vibex-canvas-silent-400/` (same bugs, different scope)
- Related code: `canvasApi.ts`, `BusinessFlowTree.tsx`, `ProjectBar.tsx`, `BoundedContextTree.tsx`

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 0 | — | — |
| Codex Review | `/codex review` | Independent 2nd opinion | 0 | — | — |
| Eng Review | `/plan-eng-review` | Architecture & tests | 1 | issues_found | 4 blocking, 4 important |
| Design Review | `/plan-design-review` | UI/UX gaps | 0 | — | — |

- **CODEX:** Not run
- **CROSS-MODEL:** N/A
- **UNRESOLVED:** 0 (all decisions resolved via AskUserQuestion)
- **VERDICT:** CONDITIONAL APPROVAL — 4 blocking items must be addressed before merge

### Execution Gates (Must Pass Before Merge)

- [x] Plan written: `2026-04-17-001-fix-vibex-canvas-ux-fix-plan.md`
- [ ] **B1**: Verify `handleResponseError` line 166 actually needs fixing vs. already fixed (`git log`)
- [ ] **B2**: Verify store method `confirmContextNode` sets both `status` and `isActive`
- [ ] **B3**: Create `ProjectBar.test.tsx` **before** implementing F3.1
- [ ] **B4**: Classify every `isActive` usage found in grep audit (A/B/C)
- [ ] **I1**: Fix useMemo deps (`flowNodes.length` → `flowNodes` + `selectedNodeIds.flow`)
- [ ] **I2**: F4.2 must mandate store sets both fields — no "if store supports it" hedge
- [ ] **I3**: Unit 2 scope expansion — standardize implicit Promise returns
- [ ] **I4**: F4.1 must update `BusinessFlowTree.tsx:728` and `733` alongside the semantic change
