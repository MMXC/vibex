# Implementation Plan: Vibex Simplified Flow

**Project**: `vibex-simplified-flow`

---

## Phase 1: Infrastructure (P0) — ~2h

### Task 1.1: Term translation layer ✅ (2026-03-23 02:50)
**Files**: `src/config/termMap.ts`, `src/hooks/useTermTranslation.ts`
**Agent**: dev
**Commit**: `8f0de4b9`

```typescript
// termMap.ts — DDD → Business language
export const TERM_MAP = {
  'bounded-context': '业务领域',
  'core-domain': '核心业务',
  'supporting-domain': '支撑业务',
  'aggregate-root': '核心实体',
  'domain-event': '业务事件',
  'domain-model': '数据结构',
  // ... 30+ mappings
};
```

### Task 1.2: Zustand store ✅ (2026-03-23 02:50)
**File**: `src/stores/simplifiedFlowStore.ts`
**Agent**: dev
**Commit**: `8f0de4b9`

```typescript
interface SimplifiedFlowState {
  step1: { domains: BusinessDomain[]; flow: FlowData };
  step2: { questions: Clarification[]; answers: Record<string, string> };
  step3: { selectedComponents: string[]; projectId?: string };
  currentStep: 1 | 2 | 3;
  // actions
  setDomains: (domains: BusinessDomain[]) => void;
  toggleFeature: (domainId: string, featureId: string) => void;
  editNodeName: (nodeId: string, name: string) => void;
  addNode: (node: FlowNode) => void;
  // ...
}
```

### Task 1.3: Feature Flag ✅ (2026-03-23 02:50)
**File**: `.env.local`
**Agent**: dev
**Commit**: `8f0de4b9`

```
NEXT_PUBLIC_ENABLE_SIMPLIFIED_FLOW=false
```

---

## Phase 2: API Contracts (P0) — ~4h

### Task 2.1: Backend — POST /ddd/business-domain
**File**: `src/routes/ddd/business-domain.ts` (or similar)
**Agent**: dev

Parallel generation of domains + flow. See architecture.md §3.

### Task 2.2: API verification
**Command**:
```bash
curl -X POST https://api.vibex.top/ddd/business-domain \
  -H "Content-Type: application/json" \
  -d '{"requirement":"用户登录系统"}'
# Verify: success=true, domains=[...], flow={nodes:[],edges:[]}
```

---

## Phase 3: Step 1 Components (P0) — ~4h

### Task 3.1: Step 1 route + page
**File**: `src/app/create/step1/page.tsx`
**Agent**: dev

### Task 3.2: DomainCard component
**File**: `src/components/create/DomainCard.tsx`
**Agent**: dev

### Task 3.3: FlowChart (ReactFlow)
**File**: `src/components/create/FlowChart.tsx`
**Agent**: dev

### Task 3.4: Node edit + feature check
**In**: `simplifiedFlowStore.ts` + `DomainCard.tsx` + `FlowChart.tsx`
**Agent**: dev

---

## Phase 4: Step 2 & 3 + Integration (P1) — ~3h

### Task 4.1: Step 2 & 3 routes
**Files**: `src/app/create/step2/page.tsx`, `src/app/create/step3/page.tsx`
**Agent**: dev

### Task 4.2: PageCardList component
**File**: `src/components/create/PageCardList.tsx`
**Agent**: dev

### Task 4.3: Old routes — Feature Flag guard
**Files**: `src/app/design/bounded-context/page.tsx`, etc.
**Agent**: dev

```tsx
// At top of old pages
if (process.env.NEXT_PUBLIC_ENABLE_SIMPLIFIED_FLOW === 'true') {
  redirect('/create/step1');
}
```

---

## Phase 5: E2E + Regression (P0) — ~2h

### Task 5.1: Cypress E2E
**File**: `cypress/e2e/simplified-flow.cy.js`
**Agent**: tester

### Task 5.2: Regression test (flag=false)
**Agent**: tester

---

## Dev Checklist

| # | Task | Output |
|---|------|--------|
| 1.1 | termMap.ts + useTermTranslation.ts | ✅ Translation works (8f0de4b9) |
| 1.2 | simplifiedFlowStore.ts | ✅ Store works (8f0de4b9) |
| 1.3 | Feature Flag env var | ✅ Flag configurable (8f0de4b9) |
| 2.1 | /ddd/business-domain backend | API returns valid |
| 3.1 | Step 1 page + route | Page renders |
| 3.2 | DomainCard | Domain display + check |
| 3.3 | FlowChart | ReactFlow visualization |
| 3.4 | Node edit + feature check | Interactive |
| 4.1 | Step 2 & 3 pages | Steps wired |
| 4.2 | PageCardList | Component list |
| 4.3 | Old routes guard | Flag-aware |

---

## Reviewer Checklist

- [ ] `TERM_MAP` covers all user-visible DDD terms
- [ ] API response has no DDD terms (translated)
- [ ] Old routes redirect when flag=true
- [ ] Cypress E2E covers full 3-step flow
- [ ] npm test passes
- [ ] npm run build succeeds
