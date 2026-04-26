# AGENTS.md — VibeX Sprint 14

> Developer Constraints & Implementation Standards

All code shipped in Sprint 14 must adhere to the constraints below. These are **hard requirements** — deviations require explicit approval from the Architect.

---

## E1 — Design-to-Code Pipeline

| Rule | Detail |
|------|--------|
| Feature flag | Register `FEATURE_DESIGN_TO_CODE_PIPELINE` in config; default `false` |
| Context validation | `agentStore.injectContext()` must validate the context shape; throw on invalid input |
| CodeGenContext type | Must match exactly: `{ type: 'codegen', generatedCode: string, nodes: DesignNode[], schemaVersion: string, exportedAt: string }` |
| Node truncation | Truncate at 200 nodes; threshold must be configurable; **warn** on truncation, do not error |
| URL param `agentSession=new` | Triggers context pre-fill; must handle gracefully when param is absent or context is empty |
| data-testid | All new buttons **must** include a `data-testid` attribute |

---

## E2 — Canvas Import/Export

| Rule | Detail |
|------|--------|
| Export JSON fields | **Must** include: `schemaVersion`, `metadata`, `chapters`, `crossChapterEdges` |
| schemaVersion format | `"1.x.x"` — semver-like string |
| Forward compatibility | Import: ignore unknown fields; **warn** on schema mismatch; **never throw** |
| Import overwrite | Always show native `window.confirm()` dialog before overwriting |
| data-testid | Export button = `data-testid="canvas-export-btn"`; Import button = `data-testid="canvas-import-btn"` |
| File size warning | Show warning for exports exceeding 1 MB |

---

## E3 — E2E Test Coverage

| Rule | Detail |
|------|--------|
| Playwright config | `headless: true`; `viewport: { width: 1280, height: 720 }` |
| MockAgentService | Document mock scope in a header comment at the top of every test file using it |
| Selectors | **All** test selectors must use `data-testid`; no CSS selector chaining |
| Spec file coverage | Each spec file must contain **≥ 3** test cases, each with real assertions |
| Test isolation | Each test case must run independently; no shared state between cases |

---

## E4 — Analytics Dashboard

| Rule | Detail |
|------|--------|
| Funnel API | `GET /api/v1/analytics/funnel`; query param: `range=7d\|30d` |
| API response schema | `{ success: boolean, data: { steps: Array<{ name: string, count: number, rate: number }> } }` |
| rate calculation | Relative to previous step; range `0.0–1.0`; first step always `1.0` |
| FunnelWidget | Pure SVG; **no external chart library**; CSS for styling only |
| Empty state | Show when any step has `< 3` records; text: `"数据不足以计算漏斗"` |
| data-testid | Analytics trigger button on DDSCanvasPage = `data-testid="canvas-analytics-btn"`; empty state = `data-testid="funnel-empty-state"` |
| Performance | API response time < 200 ms p95; cache with 5-minute TTL recommended |

---

## E5 — Design Token Versioning (Conditional)

| Rule | Detail |
|------|--------|
| Guard flag | `E5_VERSIONING_ENABLED`; register the module **only** if S13-E2 is active |
| Version entry shape | `{ id: uuid, timestamp: ISO-string, author: string, tokens: TokenMap, description: string }` |
| Rollback — initial | Cannot rollback the initial version; **warn** + no-op |
| Rollback — subsequent | Creates a **new** version entry (self-documenting history) |
| Decoupling | Token Palette Manager must remain fully decoupled from the E5 versioning module |

---

## General Standards

| Rule | Detail |
|------|--------|
| Lint | `pnpm lint` — **zero errors**, warnings acceptable |
| Type check | `pnpm tsc --noEmit` — must pass |
| Residue | **No** `TODO` or `FIXME` comments in any shipped file |
| Client components | All new components must include `'use client'` directive |
| Router | Must be compatible with **Next.js App Router** |
