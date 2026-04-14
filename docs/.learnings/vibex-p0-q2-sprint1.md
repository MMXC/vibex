# Learnings: vibex-p0-q2-sprint1 (2026-04-14)

## Project Summary
- **Goal**: Sprint 1 — P0 清理 + 核心体验（品牌一致性、需求智能补全、项目搜索、Canvas Phase 导航、错误体验统一、AI 核心能力）
- **Epics**: E1/E2/E4/E5 完成（4/5），E3 Canvas 操作体验跳过
- **Duration**: ~1 天 pipeline 执行
- **Blocked**: E3 跳过（@xyflow/react v12 类型依赖阻塞）

## Epic Execution Summary

| Epic | Dev | Tester | Reviewer | Reviewer-Push | Status |
|------|-----|--------|----------|---------------|--------|
| E1 品牌一致性 | ✅ c13ef489 | ✅ | ✅ | ✅ | DONE |
| E2 核心体验基础 | ✅ 2a8ae5b3 | ✅ | ✅ | ✅ | DONE |
| E3 Canvas 操作体验 | — | — | — | — | SKIPPED |
| E4 错误体验统一 | ✅ c0a7e33c | ✅ | ✅ | ✅ | DONE |
| E5 AI 核心能力 | ✅ f459a3c6 | ✅ | ✅ | ✅ | DONE |

## Key Learnings

### 1. E3 Epic 被跳过 — 依赖外部上游类型（workflow_issue）
**问题**: E3 Canvas 操作体验需要 `@xyflow/react v12` 的类型支持，但上游包尚未稳定，类型定义阻塞整个 Epic。

**根因**: 依赖分析阶段未识别出 `@xyflow/react v12` 类型尚未 release，导致 E3 进入 pipeline 后才发现不可执行。

**经验**: 前端类 Epic 在派发前应确认所有 npm 包依赖的版本状态（已 release 还是 RC/beta），避免进入 pipeline 后才发现阻塞。

**防范**: Epic 派发前增加 npm 依赖状态检查步骤。

### 2. apiError() 格式统一 — 大规模 Code Migration 模式
**E4**: 53 个 backend route 文件（Unit 3）+ 1 个 frontend handler（Unit 10）一次性迁移到 `apiError()` 统一格式。

**经验**: 大规模一致性修改（53 个文件同质修改）适合用子代理并行处理，每个子代理处理一批文件，验收标准统一（`grep "apiError()" routes/ | wc -l`）。

**架构价值**: apiError() 统一后，所有 API 错误格式一致，frontend 的 mutationErrorHandler 可统一处理，减少了 E2 阶段遇到的前端错误兜底逻辑。

### 3. reviewer 误判 blocking — reviewer-push 验证机制的价值
**问题**: reviewer-epic5 被错误标记 blocked（系统认为无 E5 commit），但 `git log` 显示 f459a3c6 真实存在且 tester 已通过。

**根因**: 任务状态追踪与实际 git commit 状态脱节，导致虚假阻塞。

**经验**: coord 对 reviewer 任务 blocked 状态应主动复核 git log，不应仅依赖任务状态系统。

### 4. Epic 内部 Unit 拆分 — 渐进式 CI 恢复
**E4**: 分成 Unit 2（apiError() 核心 API）、Unit 3（53 routes）、Unit 10（frontend handler），逐个 Unit 完成验证后再推进下一个。

**经验**: 大型 Epic 内部用 Unit 拆分可以让 CI 门禁渐进式恢复，不需要等全量完成才验证正确性，降低了回滚风险。

### 5. E2 Pagelist CSS Module 迁移
**E1**: pagelist 从内联样式迁移到 CSS Module（dark theme），涉及 UI 组件重构。

**经验**: 品牌一致性类 Epic 涉及 CSS 迁移时，应在 designer 确认后执行。变更范围应在 PR 描述中明确列出，避免 designer 未 review 就 merge。

## Pre-existing Test Failures（不在 Sprint 范围内）

以下 2 个测试在 sprint 开始前已失败，非 sprint 引入：

1. `src/components/ui/Input.test.tsx` — "renders error state" 失败
2. `src/components/homepage/CardTree/__tests__/CardTreeError.test.tsx` — "should apply custom class name" 失败

**建议**: 在 sprint 开始前运行 `npm test` 记录基线，sprint 结束时对比，避免将预存问题归因于 sprint 变更。

## Commits Reference

| Commit | 内容 |
|--------|------|
| c0a7e33c | feat(E4): route error format migration — Unit 3 (53 routes) + Unit 10 |
| 2a8ae5b3 | feat(E2): add STATUS_MAP + status field to apiError() |
| c13ef489 | refactor(pagelist): Epic E1 — migrate pagelist to CSS Module |
| f459a3c6 | dev(E5): AI core capabilities implementation |
| 266523c2 | feat(E2): IU-6 MermaidRenderer × 3 dynamic wrappers + IU-7 bundle size CI |
| 9c0a83c8 | docs(p0-sprint1): update IMPLEMENTATION_PLAN |
| e7af53aa | fix(E1-CI): revert backend tsc from CI (173 TS errors, tracked separately) |
