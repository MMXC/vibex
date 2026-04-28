# VibeX Sprint 16 — Implementation Plan

**Sprint**: Sprint 16 (2026-04-28)
**Prepared by**: Architect Agent
**Status**: 已采纳
**Project**: vibex-proposals-20260428-sprint16
**Date**: 2026-04-28

---

## 1. Implementation Order

Dependency-sorted epic sequencing based on build-order constraints and shared infrastructure:

```
[Week 1]
Week 1 Day 1–2  → S16-P2-2: MCP Tool Governance & Documentation  (foundation — all tools documented first)
Week 1 Day 2–4  → S16-P0-1: Design Review UI Integration          (uses documented review_design MCP tool)
Week 1 Day 4–5  → S16-P1-2: Code Generator Real Component Gen      (uses documented generate_code MCP tool)

[Week 2]
Week 2 Day 1–3  → S16-P0-2: Design-to-Code Bidirectional Sync     (uses P0-1 toolbar + P1-2 code gen)
Week 2 Day 3–4  → S16-P1-1: Firebase Mock + Config Path           (standalone, low risk — parallel if capacity)
Week 2 Day 4–5  → S16-P2-1: Canvas Version History Production     (uses canvas store, final integration)
```

**Dependency Graph (simplified)**:
```
P2-2 (docs) ──→ P0-1 (review_design MCP) ──→ P0-2 (bidirectional sync)
                └──→ P1-2 (generate_code MCP)
                                           └──→ P0-2 (bidirectional sync)
P1-1 (Firebase mock) ── standalone, can parallelize
P2-1 (Version History) ── depends on canvas store (already in tree)
```

---

## 2. Per-Epic Implementation Details

### S16-P2-2: MCP Tool Governance & Documentation
**Priority**: P2 | **Est. Size**: 3 days | **Owner**: Docs/Backend

#### Task Breakdown

**2-2.1 — Write `review_design.md`**
- File: `docs/mcp-tools/review_design.md`
- Content:
  - Tool name: `review_design`
  - Parameters: `{ figmaUrl: string, designTokens: DesignToken[] }`
  - Returns: `{ compliance: Issue[], accessibility: Issue[], reuse: Recommendation[] }`
  - Example request/response payload
  - Error codes

**2-2.2 — Write `figma_import.md`**
- File: `docs/mcp-tools/figma_import.md`
- Content:
  - Tool name: `figma_import`
  - Parameters: `{ fileKey: string, nodeIds?: string[] }`
  - Returns: `{ nodes: FigmaNode[], tokens: DesignToken[] }`
  - Rate limit notes, auth requirements

**2-2.3 — Write `generate_code.md`**
- File: `docs/mcp-tools/generate_code.md`
- Content:
  - Tool name: `generate_code`
  - Parameters: `{ componentSpec: ComponentSpec, framework: 'react'|'vue'|'solid', mode: 'flowstep'|'apientrypoint'|'statemachine' }`
  - Returns: `{ code: string, fileName: string, language: string }`
  - Example payloads per mode

**2-2.4 — Write `docs/mcp-tools/INDEX.md` (auto-generation script)**
- File: `packages/mcp-server/scripts/generate-tool-index.ts`
- Script scans `docs/mcp-tools/*.md`, generates frontmatter from tool names
- Outputs `docs/mcp-tools/INDEX.md` with table: Tool | File | Status | Last Updated

**2-2.5 — Health Check endpoint**
- File: `packages/mcp-server/src/index.ts`
- Endpoint: `GET /health`
- Returns: `{ status: 'ok', tools: ToolDescriptor[] }` (full tool list from registry)

#### File Changes Summary
| File | Action |
|------|--------|
| `docs/mcp-tools/review_design.md` | Create |
| `docs/mcp-tools/figma_import.md` | Create |
| `docs/mcp-tools/generate_code.md` | Create |
| `docs/mcp-tools/INDEX.md` | Create (generated) |
| `packages/mcp-server/scripts/generate-tool-index.ts` | Create |
| `packages/mcp-server/src/index.ts` | Modify — add /health |

#### Test Plan
- Unit: `npx vitest run generate-tool-index.test.ts` — validates INDEX.md structure
- Smoke: `curl http://localhost:<port>/health` — returns 200 with tool list

---

### S16-P0-1: Design Review UI Integration
**Priority**: P0 | **Est. Size**: 4 days | **Owner**: Frontend

#### Task Breakdown

**2-3.1 — Add Design Review button to DDSToolbar** ✅
- File: `src/components/dds/DDSToolbar/DDSToolbar.tsx`
- File: `src/components/dds/DDSToolbar/DDSToolbar.module.css`
- Add `<button data-testid="design-review-btn">Design Review</button>` to toolbar
- Style with existing glassmorphism tokens

**2-3.2 — Integrate `review_design` MCP tool call** ✅
- File: `src/hooks/useDesignReview.ts` (new)
- Wraps MCP client call: `mcpClient.call('review_design', { figmaUrl, designTokens })`
- Returns `{ compliance: Issue[], accessibility: Issue[], reuse: Recommendation[] }`
- Loading / error states

**2-3.3 — Build `ReviewReportPanel` component** ✅
- File: `src/components/design-review/ReviewReportPanel.tsx` (new)
- File: `src/components/design-review/ReviewReportPanel.module.css` (new)
- Three accordion/section tabs: **Compliance**, **Accessibility**, **Reuse**
- Each section renders issue list with severity badge (critical/warning/info)
- Cyberpunk/Glassmorphism styling consistent with existing design system

**2-3.4 — Add Ctrl+Shift+R shortcut** ✅
- File: `src/hooks/useKeyboardShortcuts.ts`
- Register `ctrl+shift+r` / `cmd+shift+r` → trigger design review
- Prevent default browser behavior
- Show toast "Design Review triggered" on activation

**2-3.5 — Unit tests for ReviewReportPanel components** ✅
- File: `src/components/codegen/CodeGenPanel.test.tsx` (new, or extend existing)
- Test cases:
  1. `renders CodeGenPanel with default props`
  2. `shows loading state while generating`
  3. `displays generated code output`
  4. `handles generation error gracefully`
  5. `calls MCP generate_code on button click`
  6. `updates code preview on prop change`
  7. `renders framework selector options`
  8. `disables generate button while loading`
  9. `copies code to clipboard on copy click`
  10. `renders FlowStepCard with correct props`
  11. `renders APIEndpointCard with correct props`
  12. `renders StateMachineCard with correct props`
  13. `handles empty node data gracefully`
- Run: `npx vitest run src/components/codegen/CodeGenPanel.test.tsx`

**2-3.6 — E2E: `design-review.spec.ts`** ✅
- File: `e2e/design-review.spec.ts` (new)
- Test cases:
  1. Opens canvas, clicks `data-testid="design-review-btn"` → ReviewReportPanel opens
  2. Ctrl+Shift+R triggers review panel
  3. Panel shows Compliance/Accessibility/Reuse tabs
  4. Clicking tab shows filtered issues
  5. Close button dismisses panel
- Run: `npx playwright test e2e/design-review.spec.ts`

#### File Changes Summary
| File | Action |
|------|--------|
| `src/components/dds/DDSToolbar/DDSToolbar.tsx` | Modify |
| `src/components/dds/DDSToolbar/DDSToolbar.module.css` | Modify |
| `src/hooks/useDesignReview.ts` | Create |
| `src/components/design-review/ReviewReportPanel.tsx` | Create |
| `src/components/design-review/ReviewReportPanel.module.css` | Create |
| `src/hooks/useKeyboardShortcuts.ts` | Modify |
| `src/components/codegen/CodeGenPanel.test.tsx` | Create |
| `e2e/design-review.spec.ts` | Create |

#### Test Plan
- Unit: `npx vitest run src/components/codegen/CodeGenPanel.test.tsx` (≥10 tests pass)
- E2E: `npx playwright test e2e/design-review.spec.ts`

---

### S16-P1-2: Code Generator Real Component Generation
**Priority**: P1 | **Est. Size**: 4 days | **Owner**: Frontend + MCP

#### Task Breakdown

**2-4.1 — Define TypeScript prop interfaces** ✅
- File: `src/types/codegen.ts` (new or extend)
```typescript
interface FlowStepProps {
  stepName: string;
  actor: string;
  pre: string;
  post: string;
}
interface APIEndpointProps {
  method: 'GET'|'POST'|'PUT'|'DELETE';
  path: string;
  summary: string;
}
interface StateMachineProps {
  states: string[];
  transitions: Array<{ from: string; to: string; event: string }>;
}
```

**2-4.2 — Update card components to use real props** ✅
- File: `src/components/codegen/cards/FlowStepCard.tsx`
  - Read `node.stepName`, `node.actor`, `node.pre`, `node.post` properties
  - Render as actual component, not placeholder comments
- File: `src/components/codegen/cards/APIEndpointCard.tsx`
  - Read `node.method`, `node.path`, `node.summary`
  - Render as actual component
- File: `src/components/codegen/cards/StateMachineCard.tsx`
  - Read `node.states`, `node.transitions`
  - Render state diagram as actual SVG/div

**2-4.3 — Integrate `generate_code` MCP tool (real generation)** ✅
- File: `src/hooks/useCodeGenerator.ts`
- Replace placeholder generation with: `mcpClient.call('generate_code', { componentSpec, framework, mode })`
- Framework param: React (default) / Vue / Solid selector in UI

**2-4.4 — Framework selector UI** ✅
- File: `src/components/codegen/CodeGenPanel.tsx`
- Add `<select data-testid="framework-selector">` with options: React, Vue, Solid
- Pass selected framework to `useCodeGenerator`

**2-4.5 — Code output verification** ✅
- Generated TSX files written to temp dir
- Run: `npx tsc --noEmit <generated-file>` to verify no type errors
- Run: VS Code open + ESLint check passes

**2-4.6 — Unit + E2E for code generator** ✅
- File: `src/components/codegen/codeGenerator.test.ts` (new)
- Tests: mock MCP response, verify correct props → code output mapping
- Run: `npx vitest run codeGenerator.test.ts`
- E2E: covered by existing or new `e2e/design-to-code-e2e.spec.ts` (see P0-2)

#### File Changes Summary
| File | Action |
|------|--------|
| `src/types/codegen.ts` | Create/Extend |
| `src/components/codegen/cards/FlowStepCard.tsx` | Modify |
| `src/components/codegen/cards/APIEndpointCard.tsx` | Modify |
| `src/components/codegen/cards/StateMachineCard.tsx` | Modify |
| `src/hooks/useCodeGenerator.ts` | Modify |
| `src/components/codegen/CodeGenPanel.tsx` | Modify |
| `src/components/codegen/codeGenerator.test.ts` | Create |

#### Test Plan
- Unit: `npx vitest run codeGenerator.test.ts`
- E2E: `npx playwright test e2e/design-to-code-e2e.spec.ts` (see P0-2)

---

### S16-P0-2: Design-to-Code Bidirectional Sync
**Priority**: P0 | **Est. Size**: 5 days | **Owner**: Frontend

#### Task Breakdown

**2-5.1 — Build `ConflictResolutionDialog` three-panel diff UI** ✅
- File: `src/components/conflict/ConflictResolutionDialog.tsx` (new)
- File: `src/components/conflict/ConflictResolutionDialog.module.css` (new)
- Layout: Three columns — **Design** | **Token** | **Code**
- Each column shows diff view (green added, red removed, yellow modified)
- Action buttons: "Accept Design", "Accept Code", "Accept Token", "Merge All"
- Callbacks trigger Zustand store updates

**2-5.2 — Drift Detection logic** ✅
- File: `src/store/designSyncStore.ts` (new or extend)
- On each sync cycle:
  1. Figma import → design tokens
  2. Compare tokens against last-known-good code tokens
  3. Detect: added / removed / modified token properties
  4. Flag drift if mismatch detected
- Target: < 10% false positive rate across 3 scenarios:
  - Scenario A: Token renamed (should flag as drift)
  - Scenario B: Code refactored without design change (should flag as drift)
  - Scenario C: Same token in design and code (no drift)
- File: `src/utils/driftDetector.test.ts` — unit test the 3 scenarios

**2-5.3 — Batch Export: 50 concurrent components** ✅
- File: `src/utils/batchExporter.ts` (new)
- Use `Promise.allSettled` with concurrency limit of 50
- Progress indicator via Zustand
- Memory leak prevention: stream results, release references
- Run: `npx vitest run batchExporter.test.ts` — 50 concurrent, heap stable

**2-5.4 — E2E: Full flow `design-to-code-e2e.spec.ts`** ✅
- File: `e2e/design-to-code-e2e.spec.ts` (new)
- Steps:
  1. Open VibeX canvas
  2. Import Figma design (`figma-import` action)
  3. Trigger token generation
  4. Detect drift (confirm no false positive in scenario C)
  5. Trigger code generation
  6. Batch export 50 components
  7. Verify ConflictResolutionDialog appears on drift
- Run: `npx playwright test e2e/design-to-code-e2e.spec.ts`

**2-5.5 — Write verification doc** ✅
- File: `docs/vibex-sprint16/design-to-code-verification.md`
- Document test scenarios, expected vs actual results, false positive rate measurement

#### File Changes Summary
| File | Action |
|------|--------|
| `src/components/conflict/ConflictResolutionDialog.tsx` | Create |
| `src/components/conflict/ConflictResolutionDialog.module.css` | Create |
| `src/store/designSyncStore.ts` | Create/Extend |
| `src/utils/driftDetector.test.ts` | Create |
| `src/utils/batchExporter.ts` | Create |
| `src/utils/batchExporter.test.ts` | Create |
| `e2e/design-to-code-e2e.spec.ts` | Create |
| `docs/vibex-sprint16/design-to-code-verification.md` | Create |

#### Test Plan
- Unit: `npx vitest run src/utils/driftDetector.test.ts src/utils/batchExporter.test.ts`
- E2E: `npx playwright test e2e/design-to-code-e2e.spec.ts`
- Memory: Monitor heap during batch export (no >10% growth over baseline)

---

### S16-P1-1: Firebase Mock + Config Path
**Priority**: P1 | **Est. Size**: 4 days | **Owner**: Frontend + Backend

#### Task Breakdown

**2-6.1 — Firebase mock server** ✅

**2-6.2 — 5-user concurrent presence E2E** ✅
- File: `tests/e2e/firebase-presence.spec.ts` (new)
- Launch 5 Playwright browser contexts
- Each connects to app in mock mode
- Verify: all 5 presence indicators update within 1s

**2-6.3 — ConflictBubble in mock scenarios** ✅
- File: `src/components/collaboration/ConflictBubble.tsx` (new)
- DISCONNECTED → "Offline — changes queued"
- RECONNECTING → "Reconnecting..."
- CONNECTED → "Synced" then auto-dismiss 2s

**2-6.4 — Cold start < 500ms or fallback** ✅
- File: `src/hooks/useFirebase.ts` (new)
- Measure initial connection time; > 500ms → local-only fallback
- Documented in `docs/vibex-sprint16/firebase-config-path.md`

**2-6.5 — Firebase config path confirmation doc** ✅
- File: `docs/vibex-sprint16/firebase-config-path.md` (created above)

#### File Changes Summary
| File | Action |
|------|--------|
| `packages/mcp-server/src/mocks/firebaseMock.ts` | Create |
| `src/hooks/useFirebase.ts` | Create/Extend |
| `src/components/collaboration/ConflictBubble.tsx` | Create/Extend |
| `e2e/firebase-presence.spec.ts` | Create |
| `docs/vibex-sprint16/firebase-config-path.md` | Create |

#### Test Plan
- Unit: `npx vitest run useFirebase.test.ts` — mock state transitions
- E2E: `npx playwright test e2e/firebase-presence.spec.ts`
- Cold start: `node -e "const start = Date.now(); require('./mock'); console.log(Date.now() - start);"` — target < 500ms

---

### S16-P2-1: Canvas Version History Production
**Priority**: P2 | **Est. Size**: 4 days | **Owner**: Frontend

#### Task Breakdown

**2-7.1 — Auto-snapshot with 30s debounce** ✅
- File: `src/hooks/useVersionHistory.ts` (new or extend)
- Debounced save: reset 30s timer on each canvas change
- Snapshot stored to D1 via Cloudflare Worker
- Snapshot data: `{ id, projectId, canvasState, timestamp, type: 'auto'|'manual' }`

**2-7.2 — `VersionHistoryPanel` distinguishes auto vs manual** ✅
- File: `src/components/version-history/VersionHistoryPanel.tsx` (new)
- File: `src/components/version-history/VersionHistoryPanel.module.css` (new)
- List items show icon + label: "Auto-saved 2 min ago" vs "Manual snapshot"
- Auto-save entries: subtle/grey style
- Manual entries: highlighted with accent

**2-7.3 — `projectId=null` guide UI** ✅
- File: `src/components/version-history/VersionHistoryPanel.tsx`
- When `projectId === null` → show inline guide:
  - Icon: warning or info
  - Text: "Version history requires a project. Create or open a project to enable snapshots."
  - CTA button: "Create Project"

**2-7.4 — Snapshot restore correctness** ✅
- File: `src/hooks/useVersionHistory.ts`
- `restoreSnapshot(id)`: fetch from D1, deep-compare, apply to canvas store
- Confirmation dialog before restore
- Undo-friendly: current state backed up before restore

**2-7.5 — E2E: `version-history-e2e.spec.ts`** ✅
- File: `e2e/version-history-e2e.spec.ts` (new)
- Test cases:
  1. Auto-snapshot fires after 30s debounce on canvas change
  2. VersionHistoryPanel shows auto vs manual entries
  3. `projectId=null` shows guide UI
  4. Restore snapshot → canvas state matches snapshot
  5. Restore older snapshot → history preserved
- Run: `npx playwright test e2e/version-history-e2e.spec.ts`

#### File Changes Summary
| File | Action |
|------|--------|
| `src/hooks/useVersionHistory.ts` | Create/Extend |
| `src/components/version-history/VersionHistoryPanel.tsx` | Create |
| `src/components/version-history/VersionHistoryPanel.module.css` | Create |
| `e2e/version-history-e2e.spec.ts` | Create |
| Cloudflare Worker (TBD path: `workers/version-history/`) | Create/Extend |

#### Test Plan
- Unit: `npx vitest run useVersionHistory.test.ts`
- E2E: `npx playwright test e2e/version-history-e2e.spec.ts`

---

## 3. Test Plan Summary

| Epic | Unit Command | E2E Command |
|------|-------------|-------------|
| S16-P2-2 | `npx vitest run generate-tool-index.test.ts` | `curl http://localhost:<port>/health` |
| S16-P0-1 | `npx vitest run src/components/codegen/CodeGenPanel.test.tsx` | `npx playwright test e2e/design-review.spec.ts` |
| S16-P1-2 | `npx vitest run codeGenerator.test.ts` | `npx playwright test e2e/design-to-code-e2e.spec.ts` |
| S16-P0-2 | `npx vitest run src/utils/driftDetector.test.ts src/utils/batchExporter.test.ts` | `npx playwright test e2e/design-to-code-e2e.spec.ts` |
| S16-P1-1 | `npx vitest run useFirebase.test.ts` | `npx playwright test e2e/firebase-presence.spec.ts` |
| S16-P2-1 | `npx vitest run useVersionHistory.test.ts` | `npx playwright test e2e/version-history-e2e.spec.ts` |

**All E2E commands**: `npx playwright test` from repo root, config in `playwright.config.ts`.

---

## 4. Rollback Plan

| Epic | Rollback Trigger | Rollback Action |
|------|----------------|----------------|
| S16-P2-2 | `/health` returns non-200 | Revert `packages/mcp-server/src/index.ts` changes; keep docs |
| S16-P0-1 | E2E `design-review.spec.ts` fails on main | `git revert` DDSToolbar + ReviewReportPanel changes |
| S16-P1-2 | Generated TSX causes type errors | Revert prop interface changes; restore placeholder comments |
| S16-P0-2 | Drift false positive > 10% | Disable drift detection toggle; keep ConflictResolutionDialog |
| S16-P1-1 | Cold start > 500ms consistently | Disable Firebase mock; show "Firebase unavailable" banner |
| S16-P2-1 | Restore causes canvas corruption | Disable restore button; mark snapshots as read-only |

**General**: All epics gated behind feature flags in `src/config/featureFlags.ts`. Disable via env var without deploy.

---

## 5. DoD Checklist

### S16-P0-1: Design Review UI Integration
- [ ] `data-testid="design-review-btn"` button renders in DDSToolbar
- [ ] `review_design` MCP tool called successfully (mock or real)
- [ ] ReviewReportPanel renders 3 tabs (Compliance/Accessibility/Reuse)
- [ ] Ctrl+Shift+R triggers review panel
- [ ] ≥ 10 unit tests pass for CodeGenPanel components
- [ ] `npx playwright test e2e/design-review.spec.ts` passes

### S16-P0-2: Design-to-Code Bidirectional Sync
- [ ] ConflictResolutionDialog renders 3-column diff
- [ ] Drift detection flags scenarios A and B, not C (< 10% false positive)
- [ ] Batch export handles 50 concurrent components without OOM
- [ ] `npx playwright test e2e/design-to-code-e2e.spec.ts` passes full flow
- [ ] `docs/vibex-sprint16/design-to-code-verification.md` exists and is complete

### S16-P1-1: Firebase Mock + Config Path
- [ ] 5-user presence E2E passes in mock mode
- [ ] All 4 mock states (CONNECTED/DEGRADED/DISCONNECTED/RECONNECTING) transition correctly
- [ ] ConflictBubble visible in DISCONNECTED and RECONNECTING states
- [ ] Cold start < 500ms or graceful fallback to local-only mode
- [ ] `docs/vibex-sprint16/firebase-config-path.md` documents env vars and toggle

### S16-P1-2: Code Generator Real Component Generation
- [ ] FlowStepCard, APIEndpointCard, StateMachineCard render from real node properties
- [ ] Generated TSX uses property values (not placeholder comments)
- [ ] Framework selector (React/Vue/Solid) visible and functional
- [ ] `npx vitest run codeGenerator.test.ts` passes
- [ ] Generated code passes `tsc --noEmit` without errors

### S16-P2-1: Canvas Version History Production
- [ ] Auto-snapshot fires after 30s debounce on canvas change
- [ ] VersionHistoryPanel distinguishes auto-save vs manual-save entries
- [ ] `projectId=null` guide UI renders with CTA button
- [ ] Snapshot restore correctly restores canvas state
- [ ] `npx playwright test e2e/version-history-e2e.spec.ts` passes

### S16-P2-2: MCP Tool Governance & Documentation
- [ ] `docs/mcp-tools/review_design.md` exists with params/examples/returns
- [ ] `docs/mcp-tools/figma_import.md` exists with params/examples/returns
- [ ] `docs/mcp-tools/generate_code.md` exists with params/examples/returns
- [ ] `docs/mcp-tools/INDEX.md` auto-generated or manually complete
- [ ] `GET /health` returns full tool list with 200 status

---

## 6. Resource Estimation

| Epic | Dev Days | Files (new/mod) | Test Files | Risk |
|------|----------|----------------|------------|------|
| S16-P2-2 | 3 | 6 | 1 | Low |
| S16-P0-1 | 4 | 8 | 2 | Medium |
| S16-P1-2 | 4 | 7 | 1 | Medium |
| S16-P0-2 | 5 | 8 | 3 | High (drift detection tuning) |
| S16-P1-1 | 4 | 5 | 2 | Low |
| S16-P2-1 | 4 | 5 | 2 | Medium |
| **Total** | **24** | **39** | **11** | |

**Team**: 2 frontend engineers, 1 backend/DevOps, 1 QA.
**Sprint duration**: 2 weeks.
**Bottleneck**: S16-P0-2 (drift detection tuning + ConflictResolutionDialog UI).

---

## 7. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Drift detection false positive > 10% | High | High | Iterate on detection algorithm in P0-2; add whitelist for known-safe changes |
| Firebase mock cold start > 500ms | Medium | Medium | Pre-warm mock module; lazy-load on first use |
| Batch export OOM at 50 components | Medium | High | Stream results; cap concurrency at 50; monitor heap in CI |
| ConflictResolutionDialog UX unclear | Medium | Medium | User test early; add tooltip explanations for each action |
| Feature flag sprawl | Low | Medium | Consolidate flags in `src/config/featureFlags.ts`; document each |

---

## 执行决策

- **决策**: 已采纳
- **执行项目**: vibex-proposals-20260428-sprint16
- **执行日期**: 2026-04-28
