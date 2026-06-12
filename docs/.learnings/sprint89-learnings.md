# Sprint89 Learnings

## Sprint Summary
**Date**: 2026-06-12 | **Mode**: Phase2 self-impl (5 Epic pipeline) | **Status**: completed

## Epic Outcomes
| Epic | Name | Outcome | Key Pattern |
|------|------|---------|-------------|
| E1 | Canvas Analytics Dashboard | ✅ Variant X' cascade | analyticsStore + stats API + UsageAnalyticsSection |
| E2 | AI Design Suggestions | ✅ Variant W''' extend | canvasAnalyticsStore + settings panel integration |
| E3 | Real-time Collaboration Presence | ✅ Variant W''' presence/collaboration | WebSocket presence wiring + config tuning |
| E4 | GitHub Integration Deep Link | ✅ Variant W' workspace-complete | workspace files correct, only CHANGELOG missing |
| E5 | Advanced Export Formats | ✅ Variant X' cascade | ExportDialog 6 formats + history panel + PPTX/JSON/Markdown |

## Key Patterns Discovered

### Variant W''' "presence/collaboration" (S89-E3)
81 presence/collaboration files on main — presenceStore.ts, CollaboratorCursors.tsx, CollaboratorAvatars.tsx, wsPresenceHandler.ts all exist. DoD described integration + config changes, not new features. Self-impl scope = integration wiring + constant tuning.

### Variant W''' "settings-integration" (S87-E1 → E2 reuse)
Existing panel component (NotificationPreferencesPanel.tsx, S80-E1) integrated into Settings page as section block. No new business logic needed — all store/API already wired.

### Variant W' "workspace files complete, CHANGELOG missing" (S89-E4)
Dev ghosted after producing correct files but forgetting CHANGELOG. Files were already correct on disk. Pattern: verify files compile + tests pass → git add by explicit path → commit → cherry-pick → dual-CHANGELOG → cascade.

### Variant X' "Code+Tests+CHANGELOG on Main, cascade needed" (S89-E5)
All commits already on main (feat + test + CHANGELOG). `dev-e5` showed phantom `in-progress, updatedBy=cli`. Direct-mark cascade: dev-e5 done → tester → reviewer → reviewer-push → coord-completed.

## vitest Patterns

### Pattern P (S89-E4) — `userEvent` clipboard API fails in JSDOM
`userEvent.setup()` throws `Cannot read properties of undefined (reading 'clipboard')` in jsdom. Use `fireEvent` for all interactions instead.

### Pattern Q (S89-E4) — `mockFetch` returning Response-like object
Hook calls `response.json()`. Plain object mock fails. Use `mockResponse(data)` helper returning `{ ok, status, json: vi.fn(() => Promise.resolve(data)) }`.

### Pattern R (S89-E4) — `data-testid` for ambiguous interactive elements
Multiple buttons/links with similar roles → use `getByTestId`. Always add `data-testid` to the specific interactive element you want to target.

### Pattern G — WebSocket mock with `addEventListener`
VibeX uses `ws.addEventListener()` NOT `ws.onopen = fn`. Mock must implement `addEventListener` + internal `_dispatch`.

## Pre-existing Test Failures (Do Not Fix in Sprint)
- `BatchExportPanel.test.tsx` — "calls cancelExport when cancel button" + "click outside panel" (S71-E5, unrelated)
- `ExportControls.test.tsx` — `vi.isolateModules` API not available
- `TemplateMarketplacePanel.e5.test.tsx` — `subscribedTemplates` mock undefined (S71-E5)
- `useCanvasSearch.test.ts` — infinite re-render (S87-E4)

## CHANGELOG Discipline
- Root CHANGELOG + frontend CHANGELOG both need S{N}-E{X} entries
- CHANGELOG commit must be separate from feat commit on epic branch → cherry-pick BOTH individually
- Watch for duplicate entries: if CHANGELOG already has the entry, don't append again

## Git Workflow
- Always `git add` by explicit path, never `git add -A` (contamination risk)
- Epic branch created from `origin/main` → cherry-pick to main → fast-forward merge epic back to main
- Check `git log origin/main --oneline | grep s{N}-e{X}` before any cherry-pick

## Velocity Metrics
- Sprint89: 5/5 epics completed in ~1 session (coord self-impl cascade)
- All epics: code + tests on main, dual-CHANGELOG entries, push verified
- coord-completed: all 5 reviewer-push stages verified, learnings written

## Next Sprint Recommendations
- S90 proposal should consider: Canvas version snapshot restore UI, Template marketplace search/filter improvements, Batch export progress notifications
- Variant W''' patterns (extend/integrate existing) are common — always pre-discover before dev dispatch
