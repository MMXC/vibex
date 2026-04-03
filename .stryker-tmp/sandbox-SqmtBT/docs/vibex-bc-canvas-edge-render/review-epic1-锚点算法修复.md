# Code Review Report: `vibex-bc-canvas-edge-render` / Epic1-锚点算法修复

**Agent**: reviewer
**Date**: 2026-03-30
**Commit**: `b6560e68` (`feat(canvas): vibex-bc-canvas-edge-render Epic1 - 锚点算法修复`)
**Status**: ✅ **PASSED**

---

## Summary

Fixes the BC tree edge rendering anomaly where multiple edges overlapped into a single vertical line. The root cause was the `bestAnchor()` threshold being too strict (`absDx >= absDy`), causing horizontal anchors to only be selected when horizontal distance was dominant. The fix relaxes this to `absDx >= absDy * 0.5`, allowing horizontal anchors when dx is at least 50% of dy.

**Problem**: All edges stacking vertically because `absDx >= absDy` is rarely satisfied when BC nodes are stacked vertically.
**Solution**: `absDx >= absDy * 0.5` — more often selects horizontal anchors (left/right), spreading edges horizontally.

---

## 🔴 Blockers

**None.**

---

## 🟡 Limitations

**1. gstack UI Verification — Blocked by Authentication**
- **Issue**: BC tree canvas requires login; gstack browse cannot authenticate
- **Attempted**: Production URL (vibex-app.pages.dev), localhost:3000, cookie import (Chromium not installed)
- **Mitigation**: 15/15 unit tests + 237 suites / 2997 integration tests provide strong evidence
- **Recommendation**: For future Epic reviews, set up a test account or bypass auth token for QA

---

## Verification Results

| Check | Result |
|-------|--------|
| edgePath tests | ✅ 15/15 passed |
| Full test suite | ✅ 237 suites, 2997 passed (3 skipped, 1 todo) |
| TypeScript (edgePath.ts) | ✅ 0 errors |
| ESLint (edgePath.ts) | ✅ 0 errors |
| Security | ✅ Safe — pure math algorithm, no user input |
| Algorithm logic | ✅ Threshold change mathematically sound |
| Commit message accuracy | ✅ Matches actual changes |

---

## Code Change Analysis

**File**: `vibex-fronted/src/lib/canvas/utils/edgePath.ts`

| Before | After |
|--------|-------|
| `absDx >= absDy` | `absDx >= absDy * 0.5` |
| `function bestAnchor` (private) | `export function bestAnchor` (exported) |
| Threshold: 100% dominance | Threshold: 50% dominance |

**Algorithm impact**:
- Previously: horizontal anchors only when `dx` dominates `dy`
- Now: horizontal anchors when `dx >= 0.5 * dy` — twice as often
- This means edges to BC nodes with large vertical separation but some horizontal offset will now use left/right anchors instead of bottom/top, spreading edges horizontally

**Test coverage** (15 tests, 9 scenarios):
- ✅ Horizontal right (dx > 0, dy ≈ 0)
- ✅ Horizontal left (dx < 0, dy ≈ 0)
- ✅ Vertical down (dx ≈ 0, dy > 0)
- ✅ Vertical up (dx ≈ 0, dy < 0)
- ✅ Diagonal: all 4 quadrants tested
- ✅ Edge cases: threshold boundary, narrow horizontal, narrow vertical

---

## Conclusion

**✅ PASSED**

The algorithm change is mathematically sound and well-tested. The `bestAnchor()` threshold relaxation from `absDx >= absDy` to `absDx >= absDy * 0.5` directly addresses the root cause of edges stacking vertically. All 15 unit tests pass covering the key dx/dy scenarios.

gstack UI verification was attempted but blocked by authentication requirements — this is a process limitation, not a code issue.

---

*Reviewer: CodeSentinel | Session: reviewer | Time: ~15 min*
