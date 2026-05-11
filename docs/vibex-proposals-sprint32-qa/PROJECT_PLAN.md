# VibeX Sprint 32 QA — 项目计划书

**Project**: vibex-proposals-sprint32-qa
**Date**: 2026-05-09
**Status**: Phase 2 — QA Verification (Pending coord-decision)

---

## 执行摘要

Sprint 32 QA 验证阶段，修复 Sprint 32 实现中遗留的 3 个 E2E 可测试性缺口（Q1/Q2/Q3），补充 F1.3 单元测试覆盖率，生成 baseline screenshots，使 QA 五层全部通过。

---

## 产出物清单

| 文件 | Epic | 行数 | 状态 |
|------|------|------|------|
| `CanvasThumbnail.tsx` | F1.1 | 248 | ✅ 已实现，待 Q1 修复 |
| `OfflineBanner.tsx` | F1.4 | 146 | ✅ 已扩展，待 Q2/Q3 修复 |
| `offline-queue.ts` | F1.3 | 229 | ✅ 已实现，待单元测试 |
| `sw.js` | F1.3 | +167 | ✅ 已扩展 |
| `ai-review.yml` | F1.2 | 86 | ✅ 已实现 |
| `visual-regression.yml` | F2.2 | 59 | ✅ 已实现 |
| `visual-regression.spec.ts` | F2.2 | 140 | ✅ 已实现，待 baseline |
| `ChapterPanel.test.tsx` | F2.1 | 574 | ✅ 85 tests 全绿 |
| `DDSCanvasStore.test.ts` | F2.1 | 566 | ✅ 全绿 |

---

## 必须修复项（Q1/Q2/Q3）

| ID | 问题 | 修复方案 |
|----|------|----------|
| Q1 | `data-testid="canvas-thumbnail"` 缺失 | 在 `CanvasThumbnail.tsx` 外层 div 添加属性 |
| Q2 | `data-sync-progress` 属性缺失 | 在 `OfflineBanner.tsx` 进度条 div 添加属性 |
| Q3 | retryCount 未显示在错误消息中 | 拼接 `"第 N 次失败"` 格式 |

---

## QA 验收检查单

| Layer | 验收项 | 验证方式 |
|-------|--------|----------|
| L1 | TS 编译 0 errors | `pnpm run type-check` |
| L1 | F2.1 85 tests 全绿 | `pnpm run test:unit -- ChapterPanel` |
| L1 | F1.3 单元测试 coverage ≥ 80% | `pnpm run test:unit -- offline-queue --coverage` |
| L2 | `data-testid="canvas-thumbnail"` 存在 | `grep` |
| L2 | `data-sync-progress` 存在 | `grep` |
| L2 | retryCount 显示在错误消息 | `grep` |
| L2 | 2 个 .snap 文件签入 | `git ls-files` |
| L3 | F1.1 E2E 验证 | gstack browse |
| L3 | F1.4 E2E 验证 | gstack browse |
| F2.2 | baseline screenshots 签入 | `git ls-files` |
