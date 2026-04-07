# Implementation Plan: Homepage Event Binding Audit & Fix

**Project**: `homepage-event-audit`

---

## Phase 1: Core Callbacks (P0) — ~4h

### Task 1.1: HomePage.tsx — Wire all stubs
**Agent**: dev
**File**: `src/components/homepage/HomePage.tsx`

Changes:
- Add `isMenuOpen`, `isAIPanelOpen` state
- Implement 8 BottomPanel handlers
- Implement 2 Navbar handlers  
- Implement 2 AIPanel handlers
- Add `handleBottomPanelSend` → `generateContexts` pipeline

### Task 1.2: useHomePage.ts — Fix auto-step trigger
**Agent**: dev
**File**: `src/components/homepage/hooks/useHomePage.ts`

Changes:
- Fix auto-trigger for Step 2→3, 3→4 (currently gated on `domainModels.length === 0`)
- Add handlers for diagnose/optimize/save/history/createProject

### Task 1.3: BottomPanel.tsx — Fix handleSend
**Agent**: dev
**File**: `src/components/homepage/BottomPanel/BottomPanel.tsx`

Changes:
- `handleSend` → call `onSendMessage(value)` instead of local stub
- `handleQuickAsk` → auto-call `handleSend`
- `handleHistoryExpand` → auto-call `handleSend`

### Task 1.4: API client — New endpoints
**Agent**: dev
**File**: `src/services/api/index.ts`

Add:
```typescript
export async function postDiagnosis(req: DiagnosisRequest): Promise<DiagnosisResponse>
export async function postOptimize(req: OptimizeRequest): Promise<OptimizeResponse>
export async function postChat(req: ChatRequest): Promise<ChatResponse>
export async function createProject(req: CreateProjectRequest): Promise<CreateProjectResponse>
```

---

## Phase 2: Quick Features (P1) — ~6h

### Task 2.1: Integrate FloatingMode
**Agent**: dev
**File**: `src/components/homepage/HomePage.tsx`

```tsx
import { FloatingMode } from './FloatingMode';
const { isFloating } = useFloatingMode({ threshold: 0.5, resumeDelay: 1000, enabled: true });

<FloatingMode enabled={true} bottomPanelRef={bottomPanelRef}>
  <div className={styles.bottomPanel}>
    <BottomPanel ... />
  </div>
</FloatingMode>
```

### Task 2.2: Fix SSE timeout
**Agent**: dev
**File**: `src/services/ddd/stream-service.ts`

Add `AbortSignal.timeout(60000)` to all fetch calls.

### Task 2.3: Error boundary + retry UI
**Agent**: dev
**Files**: `PreviewArea.tsx`, new `ErrorBoundary.tsx`

---

## Dev Checklist

| # | Task | Output |
|---|------|--------|
| 1.1 | HomePage.tsx stub → real | All 14 callbacks wired |
| 1.2 | useHomePage.ts handlers | diagnose/optimize/save/history/createProject |
| 1.3 | BottomPanel handleSend | Sends to parent via onSendMessage |
| 1.4 | API client | 4 new endpoints |
| 2.1 | FloatingMode | Integrated |
| 2.2 | SSE timeout | AbortSignal.timeout(60000) |
| 2.3 | Error boundary | Retry UI on SSE failure |

---

## Reviewer Checklist

- [ ] All 14 stubs replaced (no empty `() => {}`)
- [ ] `handleBottomPanelSend` → `generateContexts` pipeline complete
- [ ] AbortSignal.timeout on all fetch calls
- [ ] No `console.error` without user feedback
- [ ] Cypress E2E tests cover button → API flow
- [ ] No breaking changes to existing SSE streams
