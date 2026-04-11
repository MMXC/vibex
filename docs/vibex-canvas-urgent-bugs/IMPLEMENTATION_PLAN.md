# Implementation Plan: VibeX Canvas Urgent Bugs — P0 紧急修复

**Agent**: Architect
**Date**: 2026-04-11
**Project**: vibex-canvas-urgent-bugs
**Baseline**: `79ebe010`

---

## Phase 1: Epic 1 — Hooks 安全重构

### Story 1.1: Hook 调用顺序重构 ✅

**Status:** ✅ DONE — 提交 54dab01b

**Goal:** 重构 `CanvasOnboardingOverlay.tsx`，消除架构临界状态

**Requirements:** R1, R2 (来自 PRD)

**Dependencies:** None

**Files:**
- Modify: `vibex-fronted/src/components/guidance/CanvasOnboardingOverlay.tsx`
- Test: `vibex-fronted/src/components/guidance/__tests__/CanvasOnboardingOverlay.test.tsx`

**Verification:** ✅
- [x] ESLint `react-hooks/rules-of-hooks` 0 errors
- [x] `npx vitest run CanvasOnboardingOverlay.test.tsx` 22/22 passed
- [x] 所有 Hook 移至顶部，条件 return 后置
- [x] handleDismiss/handleComplete 移除 localStorage.setItem
- [x] Keyboard useEffect 直接调用 store action

---

### Story 1.2: Jest 单元测试 ✅

**Status:** ✅ DONE — 提交 54dab01b

**Goal:** 为 `CanvasOnboardingOverlay` 添加完整单元测试

**Requirements:** R1, R2 (来自 PRD)

**Dependencies:** Story 1.1

**Files:**
- Create: `vibex-fronted/src/components/guidance/__tests__/CanvasOnboardingOverlay.test.tsx`

**Verification:** ✅
- [x] 22 tests covering all interaction paths
- [x] Edge cases: completed/dismissed/currentStep=0 不渲染
- [x] Keyboard: ESC/ArrowRight/Enter/ArrowLeft
- [x] Rapid clicks: 5x no crash
- [x] localStorage.setItem NOT called in handlers

---

## Phase 2: Epic 2 — 404 资源修复

### Story 2.1: gstack 验证 (前置条件) ✅

**Status:** ✅ DONE

**Report**: `docs/vibex-canvas-urgent-bugs/404-verification-report.md`

**Result**: Canvas 页面无 404 资源。根因为 `preview.module.css` CSS Module 违规导致 build 失败。

### Story 2.2: 针对性修复 ✅

**Status:** ✅ DONE — 根因已修复

**Root Cause**: `src/app/preview/preview.module.css:665` 包含 bare `*` 选择器，违反 CSS Modules 纯度规则

**Fix Applied**:
- 移除 `preview.module.css` 中的 `* { transition... }` 和 `@media (prefers-reduced-motion) { * {...} }`
- 将规则移至 `globals.css`

**Verification:**
- [x] `pnpm build` → ✅ Compiled successfully
- [x] Canvas 页面无 404（Playwright 验证）
- [x] Preview 页面无 404
- [x] Console 无错误

---

## 工时估算汇总

| Epic | Story | 工时 | 状态 |
|------|-------|------|------|
| Epic 1 | Story 1.1: Hook 重构 | 1h | ✅ 立即执行 |
| Epic 1 | Story 1.2: Jest 测试 | 1h | ✅ Story 1.1 后执行 |
| Epic 2 | Story 2.1: gstack 验证 | 1h | ✅ 完成 |
| Epic 2 | Story 2.2: 修复 404 | 0.5h | ✅ 完成（CSS Module 修复） |
| **合计** | | **3h + TBD** | |
