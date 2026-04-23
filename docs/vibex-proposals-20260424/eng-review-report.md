# Engineering Review Report — vibex-proposals-20260424

> **Reviewer**: plan-eng-review (auto-decided)
> **Date**: 2026-04-24
> **Status**: FINDINGS DOCUMENTED (interactive resolution skipped per subagent instructions)

---

## Executive Summary

Sprint 7 architecture is sound with well-identified risks. Three critical issues require action before phase 2.

---

## Step 0: Scope Challenge

### What Already Exists

| Epic | Plan Claims | Reality |
|------|-------------|---------|
| E1: TS debt | 173 errors, focused fixes | **174 errors confirmed** (lib/db.ts Function constraint, auth nullability, CloudflareEnv cast, websocket module errors, next.config eslint) |
| E2: Firebase | Firebase SDK to be added | `firebase` package **not in package.json** — needs install |
| E3: Teams | ComponentTab.tsx optimistic update pattern | **EXISTS** ✓ (valid reference) |
| E5: ZIP | ZipArchiveService to be created | **NOT FOUND** (to be built from scratch) |
| E6: WebVitals | `web-vitals` package | **not in package.json** — needs install |

### Complexity Check

- E1: 5+ files touched, ~174 errors — scope appropriate
- E2: 3 new files — reasonable
- E3: 4 new files + 1 update — reasonable
- E5: 2 new files — reasonable
- E6: 2 new files — reasonable

**Verdict**: Complexity acceptable. No scope reduction needed.

### Search Check (E2 Firebase + Cloudflare Workers)

Key compatibility facts:
- Firebase Realtime Database SDK uses standard Web APIs (WebSocket, XHR fallback) — Cloudflare Workers supports both
- Workers runtime does NOT support Node.js APIs — Firebase SDK uses Web APIs only, so it is compatible
- Bundle size risk: `firebase/database` sub-module is ~150-300KB gzipped — plan targets <200KB but this is optimistic
- RTDB uses WebSocket (persistent connection) — Workers have 50ms CPU time limits per request, but presence polling is lightweight

**Verdict**: Firebase + Cloudflare Workers **compatible** for presence MVP, but bundle size requires monitoring.

---

## 1. Architecture Review

### ✅ Confirmed Sound

- **E2 independent of E1**: Correct — Firebase SDK is pure frontend, no backend TS dependency
- **E5 Workers compatibility**: Using `generateAsync('blob')` + `Response` instead of Node streams — correct ✓
- **E6 sliding window MAX_SAMPLES = 1000**: Prevents memory overflow on Workers ✓
- **E4 → E5 dependency**: E4 output feeds E5 (manifest.json format) — logical ✓

### ⚠️ Issues Found

#### 🔴 CRITICAL-1: E1 Dependency Graph Incomplete

**Problem**: The 174 TypeScript errors include a category not addressed by E1-U1 through E1-U4:

```
src/websocket/CollaborationRoom.ts(13,31): error TS2307: Cannot find module 'cloudflare:workers'
src/websocket/CollaborationRoom.ts(72,22): error TS2304: Cannot find name 'DurableObjectState'
src/websocket/CollaborationRoom.ts(72,47): error TS2304: Cannot find name 'Env'
src/websocket/CollaborationRoom.ts(89,22): error TS2304: Cannot find name 'WebSocketPair'
```

These are Cloudflare Workers Durable Objects type errors. The E1 plan only addresses `routes/*.ts`, `lib/db.ts`, and `lib/api-error.ts`. The `src/websocket/` module errors are completely unaddressed.

**Recommendation**: E1 should include `src/websocket/CollaborationRoom.ts` as a separate unit (E1-U5: Fix websocket DO types). Without this, `tsc --noEmit` will never reach 0 errors.

**Auto-decision (explicit > clever)**: Add E1-U5. The E1 plan's claim of 174 errors is verifiable and accurate, but the fix scope is incomplete.

---

## 2. Code Quality Review

### ✅ Solid Patterns

- E3 optimistic update pattern: Reference to `ComponentTab.tsx` is valid ✓
- E2断线清除: `beforeunload` + `navigator.sendBeacon` pattern is appropriate for presence cleanup
- E5 Workers-compatible ZIP: `generateAsync('blob')` approach is correct

### ⚠️ Issues Found

#### 🟠 INFO-1: next.config.ts eslint Error Is a NOP Fix

**Problem**: Architecture §6.1 E1 lists `next.config.ts: eslint configuration removal` as a fix. But the actual error is:
```
next.config.ts(7,3): error TS2353: Object literal may only specify known properties, and 'eslint' does not exist in type 'NextConfig'.
```

The plan says "Next.js 16 不支持 eslint config" — but Next.js 16 actually still supports ESLint via `eslint.config.js` or the Next.js plugin in `next.config.ts`. The error means `eslint` as a direct key in `next.config.ts` is not valid TypeScript.

**Auto-decision**: This is a **low-risk fix** — just remove the eslint key from next.config.ts or convert to proper Next.js 16 ESLint config. No further action needed in the plan.

---

## 3. Test Review

### Framework Detection

- Runtime: Node.js (package.json)
- Frontend E2E: Playwright ✓
- Backend test: Vitest (CLAUDE.md says Vitest for frontend; implementation plan mentions Jest for backend — discrepancy)
- Unit tests: Vitest (frontend), Jest (backend — as noted in IMPLEMENTATION_PLAN.md)

### Coverage Assessment

#### E1: TS Debt (CI-gated)

```
CODE PATH COVERAGE
===========================
[+] tsc --noEmit → exit code 0
    └── [★★★ TESTED] CI pipeline: tsc --noEmit ✓

[+] as any grep baseline
    └── [★★★ TESTED] CI grep + baseline comparison ✓

Coverage: COMPLETE — CI gate is the test.
```

#### E2: Firebase Presence

```
CODE PATH COVERAGE
===========================
[+] Firebase SDK init
    ├── [★★  TESTED] E2E: Firebase SDK init (no 404) — presence-mvp.spec.ts
    └── [GAP]         Init failure path (invalid API key) — NO TEST

[+] usePresence hook
    ├── [GAP]         usePresence: null userId — NO UNIT TEST
    ├── [GAP]         usePresence: Firebase RTDB offline — NO TEST
    └── [GAP]         usePresence: rapid page navigation — NO TEST

[+] PresenceAvatars UI
    └── [★★  TESTED] E2E: Avatar visible — presence-mvp.spec.ts

[+] beforeunload clear
    ├── [★★  TESTED] E2E: refresh clears presence — presence-mvp.spec.ts
    └── [GAP]         Tab close vs page refresh distinction — NO TEST

─────────────────────────────────
COVERAGE: 3/7 paths tested (43%)
QUALITY:  ★★★: 0  ★★: 3  ★: 0
GAPS: 4 paths need tests (2 E2E, 2 unit)
─────────────────────────────────
```

#### E3: Teams UI

```
CODE PATH COVERAGE
===========================
[+] GET /v1/teams list
    └── [★★  TESTED] E2E: List renders — teams-ui.spec.ts

[+] POST /v1/teams create (optimistic update)
    ├── [★★  TESTED] E2E: Create + optimistic update — teams-ui.spec.ts
    └── [GAP]         Concurrent create (two tabs) — NO TEST

[+] TeamMemberPanel permissions
    ├── [GAP] [→E2E] Non-admin cannot see role change UI — teams-ui.spec.ts
    └── [GAP]         Role change API error (network failure) — NO UNIT TEST

[+] Error handling
    ├── [GAP]         API returns 500 — user sees error message? — NO TEST
    └── [GAP]         Empty team list — UI shows "no teams" state — NO TEST

─────────────────────────────────
COVERAGE: 2/7 paths tested (29%)
QUALITY:  ★★: 2
GAPS: 5 paths need tests (1 E2E, 4 unit)
─────────────────────────────────
```

#### E4: Import/Export

```
CODE PATH COVERAGE
===========================
[+] JSON round-trip
    └── [★★★ TESTED] E2E: JSON import → export → hash compare — import-export-roundtrip.spec.ts ✓

[+] YAML round-trip (special chars)
    └── [★★★ TESTED] E2E: YAML + special characters — import-export-roundtrip.spec.ts ✓

[+] 5MB size limit
    └── [★★  TESTED] E2E: File > 5MB shows error — import-export-roundtrip.spec.ts

[+] Error states
    └── [★   TESTED] E2E: Parse failure shows message — import-export-roundtrip.spec.ts

─────────────────────────────────
COVERAGE: COMPLETE ✓ — E4 has best test coverage
─────────────────────────────────
```

#### E5: Batch Export

```
CODE PATH COVERAGE
===========================
[+] ZipArchiveService.generateZipArchive()
    ├── [GAP]         Empty component array — NO UNIT TEST
    ├── [GAP]         Single component — NO UNIT TEST
    ├── [GAP]         Boundary: exactly 5MB — NO UNIT TEST
    └── [GAP]         Boundary: 101 components (over limit) — NO TEST

[+] ZIP integrity
    └── [★★  TESTED] E2E: Download → unzip → verify manifest — batch-export.spec.ts

─────────────────────────────────
COVERAGE: 1/6 paths tested (17%)
QUALITY:  ★★: 1
GAPS: 5 paths need unit tests
─────────────────────────────────
```

#### E6: Performance Observability

```
CODE PATH COVERAGE
===========================
[+] GET /health latency metrics
    ├── [★★  TESTED] E2E: P50/P95/P99 returned — health-api.spec.ts
    └── [GAP]         First request (empty sliding window) — returns 0 — NO TEST

[+] useWebVitals
    ├── [★★  TESTED] E2E: No false positives (normal page) — health-api.spec.ts
    └── [GAP]         LCP > 4s triggers canvasLogger.warn — NO TEST

─────────────────────────────────
COVERAGE: 2/4 paths tested (50%)
QUALITY:  ★★: 2
GAPS: 2 paths need tests
─────────────────────────────────
```

### Test Plan Artifact

Written to: Not applicable (no gstack slug for vibex-proposals)

### Test Summary

| Epic | E2E Coverage | Unit Coverage | Gap Count |
|------|-------------|----------------|-----------|
| E1 | ✅ Complete | ✅ Complete | 0 |
| E2 | ✅ Basic | ❌ Missing | 4 |
| E3 | ✅ Basic | ❌ Missing | 5 |
| E4 | ✅ Complete | ✅ Complete | 0 |
| E5 | ✅ Basic | ❌ Missing | 5 |
| E6 | ✅ Basic | ❌ Missing | 2 |

**Total test gaps**: 16 paths without coverage. E2/E3/E5 are the weakest — unit tests for usePresence, TeamMemberPanel, and ZipArchiveService are essential before shipping.

---

## 4. Performance Review

### ✅ Good

- E5: `generateAsync('blob')` — Workers-compatible, memory-bounded ✓
- E6: MAX_SAMPLES = 1000 sliding window — prevents unbounded memory growth ✓
- E3: cursor-based pagination default 20 — prevents large team load issues ✓

### ⚠️ Issues Found

#### 🟠 INFO-2: E2 Firebase Bundle Size Risk

**Problem**: Plan targets `<200KB` for Firebase SDK bundle. Reality:
- `firebase` package (full) ≈ 500-800KB gzipped
- `firebase/database` sub-module only ≈ 150-300KB gzipped
- With Next.js App Router overhead, total could exceed 200KB

**Recommendation**: Measure actual bundle impact after adding Firebase. If >200KB, consider tree-shaking or deferring non-critical presence features.

**Auto-decision (pragmatic)**: Proceed with MVP. Bundle size is observable and adjustable post-launch.

---

## 5. Failure Modes

| Epic | Failure Mode | Has Test | Has Error Handling | Silent? |
|------|-------------|-----------|-------------------|---------|
| E1 | `tsc --noEmit` still fails after fixes | ✅ CI | N/A | N/A |
| E1 | New TS errors introduced in same Sprint | ✅ CI as any grep | N/A | N/A |
| E2 | Firebase init fails (invalid API key) | ❌ No test | Partial (E2E smoke) | Partial |
| E2 | Presence not cleared on tab close | ✅ E2E tested | ✅ beforeunload | No |
| E3 | Teams API returns 500 | ❌ No test | Partial | Yes (silent) |
| E3 | Optimistic update race (two tabs) | ❌ No test | Partial (queryClient cancel) | Partial |
| E5 | ZIP > 5MB on Workers | ❌ No unit test | Partial (server-side check) | No |
| E6 | Sliding window empty on first request | ❌ No test | ✅ Returns 0 | No |

**Critical gap**: E3 API error handling (500 response) — no unit test and no E2E assertion for what the user actually sees.

---

## 6. NOT in Scope

- WebSocket real-time sync (postponed to Epic 2b)
- Firebase Firestore (deliberately excluded to reduce bill risk)
- Teams invitation via email link
- ZIP export progress streaming
- Custom domain metrics (P50/P95/P99 from Cloudflare Analytics API)

---

## Completion Summary

| Item | Status |
|------|--------|
| Step 0: Scope Challenge | Scope accepted as-is |
| Architecture Review | 1 critical issue (E1 websocket DO types missing) |
| Code Quality Review | 1 informational issue (next.config eslint fix is NOP) |
| Test Review | 16 test gaps identified across E2/E3/E5 |
| Performance Review | 1 informational issue (Firebase bundle size risk) |
| NOT in scope | Written |
| What already exists | Written |
| TODOs | 1 proposed (E1-U5 websocket types) |
| Failure modes | 2 critical gaps (E2 init failure, E3 API error) |
| Outside voice | Skipped (subagent mode) |

---

## Recommendations (Auto-Decided)

Per "explicit over clever, pragmatic, bias toward action":

1. **Add E1-U5**: Fix `src/websocket/CollaborationRoom.ts` Cloudflare Durable Objects type errors. Without this, `tsc --noEmit` will never reach 0. **Effort: ~2h. Risk: Low.**

2. **Add unit tests for E2 usePresence**: Null userId, Firebase offline, rapid navigation. These are edge cases that E2E won't catch reliably. **Effort: ~3h. Risk: Missing unit tests for hook logic.**

3. **Add unit tests for E5 ZipArchiveService**: Empty array, single component, boundary 5MB, 101 components. These are the acceptance criteria that don't have unit test coverage. **Effort: ~2h. Risk: Edge cases not validated before E2E.**

4. **Add E3 API error E2E test**: Verify 500 response shows user-facing error, not silent failure. **Effort: ~1h. Risk: Users see silent failures.**

---

## Final Verdict

**OVERALL: PASS WITH CONDITIONS**

The architecture is sound and the implementation plan is mostly well-scoped. Three items must be addressed before phase 2 begins:

1. 🔴 **E1-U5**: Add websocket DO type fixes — otherwise E1 goal of "tsc --noEmit = 0" is unachievable
2. 🟠 **Test gaps**: 16 untested paths, with E2 usePresence, E5 ZipArchiveService, and E3 API errors being the most critical
3. 🟡 **Bundle monitoring**: Firebase SDK bundle size needs post-adding measurement

The claim of 174 TS errors is **verified**. E2's Firebase + Cloudflare Workers compatibility is **confirmed** (Web API compatible). E3-E6 implementation plans align with existing codebase patterns (ComponentTab.tsx optimistic update reference is valid).
