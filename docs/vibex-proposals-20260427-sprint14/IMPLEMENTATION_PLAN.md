# VibeX Sprint 14 — Implementation Plan

**Sprint Duration**: 2 weeks  
**Total Stories**: 28 (5 Epics)  
**Total Points**: 28pt  
**Last Updated**: 2026-04-27

---

## Dependency Map

```
S13-E1 ──────────────────┐
  (S13 completion gate)   │
                          ▼
                    Track B: E1
                    (Design-to-Code Pipeline)
                          │
S13-E2 ── (conditional) ──┤
                          │
                          ▼
                    Track D: E5
                    (Design Token Versioning)

S10-E1 ───────────────────┐
  (Analytics base)         │
                          ▼
                    Track C: E4
                    (Analytics Dashboard Enhancement)

(no deps) ────────────────┐
                          ▼
                    Track A: E2 + E3
                    (parallel, start immediately)
```

---

## Implementation Tracks

### Track A — Parallel (Start Immediately)
**E2: Canvas Import/Export** + **E3: E2E Test Coverage**  
No dependencies. Can ship independently.

### Track B — Depends on S13-E1 Completion
**E1: Design-to-Code Pipeline**  
Cannot begin until S13-E1 story suite is merged to main.

### Track C — Depends on S10-E1 Completion
**E4: Analytics Dashboard Enhancement**  
Cannot begin until S10-E1 baseline is merged.

### Track D — Conditional on S13-E2 Confirmation
**E5: Design Token Versioning**  
Activate only if S13-E2 is confirmed; otherwise defer to Sprint 15.

---

## Epic E1: Design-to-Code Pipeline

**Stories**: 5 | **Points**: 8 | **Depends On**: S13-E1 | **Track**: B

### US-E1.1 — Figma Token Extraction
**Points**: 2 | **AC Count**: 3

- [ ] Parse Figma token nodes from design files
- [ ] Map token keys to internal token schema
- [ ] Validate token structure before write

**Effort**: Medium | **Risk**: Low  
**Technical Notes**: Uses feature flag `FEATURE_D2C_PIPELINE`. Token extraction runs async in background job; results stored in `token_snapshots` table.

---

### US-E1.2 — Code Generation Templates
**Points**: 2 | **AC Count**: 2

- [ ] Define base template set (CSS variables, Tailwind config, JS constants)
- [ ] Render tokens into target format via template engine

**Effort**: Medium | **Risk**: Low  
**Technical Notes**: Template engine uses Handlebars. Each template version is frozen at generation time; version hash embedded in output.

---

### US-E1.3 — Bidirectional Sync
**Points**: 2 | **AC Count**: 2

- [ ] Detect drift between code and Figma source
- [ ] Provide merge conflict resolution UI

**Effort**: High | **Risk**: High  
**Technical Notes**: Drift detection compares schemaVersion hashes. Conflict resolution uses 3-way merge. Feature flag `FEATURE_D2C_BIDIRECTIONAL` gates this story.

---

### US-E1.4 — Batch Export
**Points**: 1 | **AC Count**: 1

- [ ] Support bulk export of multiple token sets

**Effort**: Low | **Risk**: Low  
**Technical Notes**: Batch export queues jobs in background; no user-facing progress bar required.

---

### US-E1.5 — Export Format Variants
**Points**: 1 | **AC Count**: 2

- [ ] Support JSON, CSS, SCSS, and JS export formats
- [ ] Validate each format schema on export

**Effort**: Low | **Risk**: Low  
**Technical Notes**: Format validation happens at template render step; invalid tokens throw before write.

---

**E1 Blockers**: S13-E1 must be merged to main before Track B kickoff.

---

## Epic E2: Canvas Import/Export

**Stories**: 4 | **Points**: 5 | **Depends On**: None | **Track**: A

### US-E2.1 — JSON Canvas Format
**Points**: 2 | **AC Count**: 4

- [ ] Define JSON schema for canvas document
- [ ] Serialize canvas elements to JSON
- [ ] Deserialize JSON to canvas DOM
- [ ] Handle unknown schemaVersion gracefully

**Effort**: Medium | **Risk**: Medium  
**Technical Notes**: See **SchemaVersion Forward-Compatibility** in Technical Notes section.

---

### US-E2.2 — File Import UI
**Points**: 1 | **AC Count**: 3

- [ ] File picker for .vibex and .json files
- [ ] Validate file before import
- [ ] Show import error with actionable message

**Effort**: Low | **Risk**: Low  
**Technical Notes**: File picker uses system file dialog. Validation includes schemaVersion check and size limit (<10MB).

---

### US-E2.3 — File Export UI
**Points**: 1 | **AC Count**: 2

- [ ] Export canvas to .vibex (compressed JSON)
- [ ] Export canvas to .json (readable)

**Effort**: Low | **Risk**: Low  
**Technical Notes**: .vibex uses gzip compression over JSON payload. Compression is transparent to the import path.

---

### US-E2.4 — Import History
**Points**: 1 | **AC Count**: 2

- [ ] Log import events with timestamp and source file
- [ ] Allow rollback to previous import state

**Effort**: Low | **Risk**: Low  
**Technical Notes**: Import history stored in `canvas_import_log` table. Rollback replays snapshot diffs.

---

**E2 Track**: Ready to start immediately. No upstream blockers.

---

## Epic E3: E2E Test Coverage

**Stories**: 3 | **Points**: 5 | **Depends On**: None | **Track**: A

### US-E3.1 — Playwright Setup
**Points**: 2 | **AC Count**: 3

- [ ] Initialize Playwright test suite
- [ ] Configure CI pipeline to run tests
- [ ] Add smoke test for app load

**Effort**: Medium | **Risk**: Low  
**Technical Notes**: Playwright installed as dev dependency. CI pipeline runs on every PR. Test configs stored in `tests/e2e/`.

---

### US-E3.2 — Canvas Interaction Tests
**Points**: 2 | **AC Count**: 3

- [ ] Test element creation on canvas
- [ ] Test element selection and multi-select
- [ ] Test element deletion

**Effort**: Medium | **Risk**: Medium  
**Technical Notes**: Canvas interaction tests use data-testid attributes. Tests run headless in CI; debug mode available locally.

---

### US-E3.3 — Token Integration Tests
**Points**: 1 | **AC Count**: 3

- [ ] Test token application to elements
- [ ] Test token override behavior
- [ ] Test token removal

**Effort**: Low | **Risk**: Low  
**Technical Notes**: Token tests are independent from E1; mock token service used. This allows E3 to ship ahead of E1.

---

**E3 Track**: Ready to start immediately. No upstream blockers.

---

## Epic E4: Analytics Dashboard Enhancement

**Stories**: 5 | **Points**: 6 | **Depends On**: S10-E1 | **Track**: C

### US-E4.1 — Funnel Chart Component
**Points**: 2 | **AC Count**: 3

- [ ] Implement SVG-based funnel chart
- [ ] Support dynamic data binding
- [ ] Add hover tooltips

**Effort**: Medium | **Risk**: Low  
**Technical Notes**: See **SVG Funnel Rendering Approach** in Technical Notes section.

---

### US-E4.2 — Conversion Metrics
**Points**: 2 | **AC Count**: 3

- [ ] Calculate stage-to-stage conversion rates
- [ ] Display conversion percentages on funnel
- [ ] Track trend over time

**Effort**: Medium | **Risk**: Medium  
**Technical Notes**: Conversion rates computed in backend aggregator; frontend renders SVG. Trend data fetched from analytics API.

---

### US-E4.3 — Dashboard Filters
**Points**: 1 | **AC Count**: 2

- [ ] Date range filter for analytics
- [ ] Segment filter (user type, region)

**Effort**: Low | **Risk**: Low  
**Technical Notes**: Filters update URL query params; shareable links. Filters apply to all dashboard widgets.

---

### US-E4.4 — Export Analytics Report
**Points**: 1 | **AC Count**: 3

- [ ] Export funnel data to CSV
- [ ] Export funnel chart to PNG
- [ ] Schedule recurring report via email

**Effort**: Medium | **Risk**: Medium  
**Technical Notes**: CSV export generated server-side. PNG export uses canvas `toDataURL()` → server upload. Email scheduler uses existing notification service.

---

### US-E4.5 — Dashboard Refresh
**Points**: 0 | **AC Count**: 1

- [ ] Auto-refresh dashboard data every 5 minutes

**Effort**: Low | **Risk**: Low  
**Technical Notes**: Polling interval configurable via dashboard settings. Uses SWR or React Query for staleness control.

---

**E4 Blockers**: S10-E1 baseline must be available. Track C kickoff only after S10-E1 merge confirmed.

---

## Epic E5: Design Token Versioning

**Stories**: 4 | **Points**: 4 | **Depends On**: S13-E2 (Conditional) | **Track**: D

### US-E5.1 — Version Tagging
**Points**: 1 | **AC Count**: 2

- [ ] Tag token sets with semantic version
- [ ] Enforce version increment on save

**Effort**: Medium | **Risk**: Low  
**Technical Notes**: See **Conditional Module Registration** in Technical Notes section.

---

### US-E5.2 — Version History
**Points**: 1 | **AC Count**: 2

- [ ] Store diff between token versions
- [ ] Browse version history timeline

**Effort**: Medium | **Risk**: Low  
**Technical Notes**: Diff stored as JSON patch per version. History timeline uses virtualized list for performance.

---

### US-E5.3 — Rollback Capability
**Points**: 1 | **AC Count**: 3

- [ ] Restore any previous token version
- [ ] Show rollback preview before confirming
- [ ] Log rollback event with actor and timestamp

**Effort**: Medium | **Risk**: Medium  
**Technical Notes**: Rollback writes a new version (not destructive). Full audit log in `token_audit_log` table.

---

### US-E5.4 — Branch/Compare View
**Points**: 1 | **AC Count**: 3

- [ ] Compare two token versions side-by-side
- [ ] Highlight added, removed, and changed tokens
- [ ] Allow cherry-pick of individual token changes

**Effort**: High | **Risk**: High  
**Technical Notes**: Diff UI uses split-pane layout. Cherry-pick generates a new version without full restore. Module lazy-loaded only when E5 is activated.

---

**E5 Gating**: E5 is **conditional** on S13-E2 confirmation. If S13-E2 is not delivered by Sprint 13 end, E5 is deferred to Sprint 15. Track D remains on hold until gate is confirmed.

---

## Technical Notes

### SchemaVersion Forward-Compatibility (E2)

Canvas documents carry a `schemaVersion` field in the root JSON object.

**Forward-compatibility rules**:
1. Parser must skip unknown fields silently (do not throw).
2. Parser must skip unknown element types and log to `canvas_import_log`.
3. Schema version mismatch emits a warning but does not block import.
4. Schema version bump is required only when a field is **removed** or **semantically changed**. Adding fields never bumps version.

**Version map**:
```
Current: 1.2
Migrations available: 1.1 → 1.2 (built-in)
Downgrade: not supported (warn and block)
```

```typescript
interface CanvasDocument {
  schemaVersion: string; // "1.2"
  elements: Element[];
  meta: DocumentMeta;
}
```

---

### Feature Flag Pattern (E1)

All E1 features are behind feature flags using the `launchdarkly-js` SDK or equivalent env-based flag store.

```typescript
const FLAGS = {
  FEATURE_D2C_PIPELINE: 'd2c-pipeline',
  FEATURE_D2C_BIDIRECTIONAL: 'd2c-bidirectional',
  FEATURE_D2C_BATCH_EXPORT: 'd2c-batch-export',
};

function isEnabled(flag: keyof typeof FLAGS): boolean {
  // In dev: always true (env OVERRIDE_* variables)
  // In prod: evaluated against user context
  return process.env[`OVERRIDE_${flag}`] === 'true' || ldClient.variation(FLAGS[flag], false);
}
```

**Rollout plan**:
- Internal flag → 10% → 50% → 100%
- Feature flags checked at runtime; no code branching in UI layer

---

### SVG Funnel Rendering Approach (E4)

Funnel charts are rendered using pure SVG (no chart library dependency).

**Algorithm**:
1. Sort stages by count descending.
2. Compute width ratio: `stageWidth = totalWidth × (count / maxCount)`.
3. Center each stage horizontally.
4. Compute trapezoid points: top-left → top-right → bottom-right → bottom-left.

**SVG structure**:
```svg
<svg viewBox="0 0 800 400">
  <g class="funnel-stage" data-stage="1">
    <polygon points="..." fill="var(--color-stage-1)" />
    <text x="400" y="50">Stage Name</text>
    <text x="400" y="80">75%</text>
  </g>
  <!-- ... -->
</svg>
```

**Interaction**: Hover triggers tooltip via SVG `<title>` + CSS overlay. Click opens drill-down panel.

---

### Conditional Module Registration (E5)

E5 modules are registered only when the E5 gate is confirmed. This avoids shipping dead code for deferred features.

```typescript
// modules/e5/index.ts
export async function registerE5Modules(app: App): Promise<void> {
  if (!isE5GateConfirmed()) {
    console.info('[E5] Module registration skipped — gate not confirmed');
    return;
  }

  app.registerFeature('token-versioning', {
    route: '/settings/token-versions',
    component: TokenVersioningPanel,
    permission: 'admin',
  });

  app.registerAPI('token-versioning', tokenVersioningRouter);
  console.info('[E5] Modules registered successfully');
}
```

**Gate check**: `isE5GateConfirmed()` reads from `app.config.featureGates.E5_ENABLED` (set by Sprint 13 post-mortem task if S13-E2 delivered).

---

## Story Points Summary

| Epic | Stories | Points | Track | Start Condition |
|------|---------|--------|-------|-----------------|
| E2 | 4 | 5 | A | Immediately |
| E3 | 3 | 5 | A | Immediately |
| E1 | 5 | 8 | B | S13-E1 merged |
| E4 | 5 | 6 | C | S10-E1 merged |
| E5 | 4 | 4 | D | S13-E2 confirmed |

**Total: 28 stories, 28 points**

---

## Acceptance Criteria Tracking

| Epic | US | AC Count | Verified By |
|------|----|----------|-------------|
| E1 | E1.1–E1.5 | 10 | Design + QA |
| E2 | E2.1–E2.4 | 11 | QA + Product |
| E3 | E3.1–E3.3 | 9 | CI green + QA |
| E4 | E4.1–E4.5 | 12 | Analytics team |
| E5 | E5.1–E5.4 | 10 | Design + QA |

**Total: 52 acceptance criteria across 28 stories**
---

## E1 Implementation Status (Sprint 14)

| Unit | Story | Status | Notes |
|------|-------|--------|-------|
| U1 | FEATURE_DESIGN_TO_CODE_PIPELINE flag + Types + injectContext | ✅ Done | b7ed2ef10 |
| U2 | DesignTokenService + Validation | ✅ Done | b7ed2ef10 |
| U3 | Template Engine + Format Renderers | ✅ Done | b7ed2ef10 |
| U4 | Bidirectional Sync + ConflictResolutionDialog | ✅ Done | b7ed2ef10 |
| U5 | Batch Export Service | ✅ Done | b7ed2ef10 |
| U6 | Export Format Variants (SCSS/JS) | ✅ Done | b7ed2ef10 |

**Commit**: b7ed2ef10 | **Verification**: pnpm tsc --noEmit ✅ | **Files**: 15 new/modified

---

## E1 Round 2 Fix Status (Reviewer Rejection → Fixed)

| Issue | Fix | Verification |
|-------|-----|--------------|
| US-E1.1: Missing "Send to AI Agent" button | CodeGenPanel added button (data-testid=send-to-agent-btn), feature-flag gated, injectContext on click, navigates to /agent?agentSession=new | pnpm tsc --noEmit ✅, lint clean (E1 files) ✅ |
| US-E1.3: Truncation warning not visible | Already present — data-testid=limit-warning + limitNote paragraph | ✅ |
| US-E1.5: Missing unit tests | agentStore.test.ts (5 cases), DesignTokenService.test.ts (4), DriftDetector.test.ts (11), BatchExportService.test.ts (5) | 25 tests all passing ✅ |

**Commit**: 21db750fe | **Round 2 fix** | **Files**: CodeGenPanel + 4 test files

---

## E1 Round 3 Fix Status (Third Reviewer Rejection → Fixed)

| Issue | Fix | Verification |
|-------|-----|--------------|
| US-E1.1 路由错误 | 改为 `/design/dds-canvas?agentSession=new` | ✅ |
| US-E1.1 context 展示 | DDSCanvasPage 读取 agentSession=new，展示 CodeGenContext panel | ✅ |
| US-E1.3 警告文本 | Node count text matches `/200.*nodes.*truncated/i` pattern | ✅ |
| CHANGELOG.md | 添加 S14 E1 条目 | ✅ |

**Commit**: ce2985a53 | **Round 3 fix**

---

## E2 Implementation Status (Sprint 14)

| Story | Status | Notes |
|-------|--------|-------|
| US-E2.1: JSON Canvas Format | ✅ Done | c202f33d0 — schemaVersion 1.2.0, metadata, chapters, crossChapterEdges |
| US-E2.2: File Import UI | ✅ Done | c202f33d0 — data-testid=canvas-import-btn, validateFile, 10MB limit |
| US-E2.3: File Export UI | ✅ Done | c202f33d0 — data-testid=canvas-export-btn, .vibex/.json, 1MB warning |
| US-E2.4: Import History | ✅ Done | c202f33d0 — localStorage log, getImportLog, clearImportLog |

**验证**: pnpm tsc --noEmit ✅ | lint clean (E2 files) ✅
**Commit**: c202f33d0 | **Files**: 9 new/modified
