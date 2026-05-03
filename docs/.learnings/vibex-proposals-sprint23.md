---
title: "Sprint 23: 5 Epic 单日交付 (E1-E5 E2E CI / Design Review Diff / Firebase Cursor / Export Formats / Template Library)"
date: "2026-05-03"
module: "vibex"
problem_type: "best_practice"
component: "development_workflow"
severity: "high"
applies_when:
  - "Sprint 23 项目交付，包含 E1-E5 五个 Epic 的完整开发链路"
  - "coord-completed 收口检查：git commit + npm test + changelog + remote push 四项验证"
  - "DAG pipeline 多 Epic 并行开发 + reviewer-push 里程碑模式"
tags:
  - "sprint-23"
  - "epic-delivery"
  - "coord-completed"
  - "e2e-ci-slack"
  - "firebase-cursor"
  - "design-review-diff"
  - "export-formats"
  - "template-library"
---

# Sprint 23: 5 Epic 单日交付 (E1-E5)

## Context

Sprint 23 是 VibeX 的第 23 个开发周期，包含 5 个 Epic 的完整开发链路：
- **E1**: E2E CI Slack 报告（Block Kit + GitHub Actions 集成）
- **E2**: Design Review Diff 视图（Re-Review 按钮 + DiffView 组件 + reviewDiff.ts）
- **E3**: Firebase Cursor Sync（无 SDK 依赖的远程光标同步）
- **E4**: Export Formats（PlantUML + JSON Schema + SVG 三格式导出）
- **E5**: Template Library（模板导出/导入/版本历史）

所有 Epic 采用 DAG pipeline 并行开发，通过 `coord-completed` 阶段完成收口。

## 交付成果

### E1: E2E CI Slack 报告
- `e2e-summary-to-slack.ts` — Playwright results.json → Block Kit Slack 消息
- `.github/workflows/test.yml` — e2e job 后执行 `e2e:summary:slack`，`if:always()` 确保 pass/fail 都运行
- 传递 `SLACK_WEBHOOK_URL` / `CI` / `GITHUB_RUN_NUMBER` / `GITHUB_RUN_URL`
- 提交: `276f1ba26`

### E2: Design Review Diff 视图
- Re-Review Button: `ReviewReportPanel.tsx` — `data-testid="re-review-btn"`
- Diff State: `useDesignReview.ts` — diffResult state + previousReportId，首次 review 后 diffResult=null
- DiffView: `DiffView.tsx` + `DiffView.module.css` — Added(红)/Removed(绿)/Unchanged 三区
- reviewDiff.ts: `computeReviewDiff()` — 基于 item.id 比较，flattern compliance/accessibility/reuse
- 提交: `4da2805b6`

### E3: Firebase Cursor Sync
- `presence.ts` cursor 扩展：nodeId + timestamp；REST API PATCH 零 SDK 依赖；EventSource SSE 流式订阅 + 2s polling fallback；visibilitychange 清除
- `RemoteCursor.tsx`: SVG arrow cursor + username label，isMockMode guard
- `useCursorSync.ts`: 100ms debounce cursor write；subscribeToOthers 订阅远程；swallow 错误
- 提交: `5430f7394`

### E4: Export Formats
- PlantUML: `plantuml.ts` — class/sequence/usecase diagram，pumlEscape() 防注入，validatePlantUML() 语法检查
- JSON Schema: `json-schema.ts` — ComponentNode → draft-2020-12，properties/definitions/required 完整
- SVG: `svg.ts` — 1200×800 canvas SVG，contextSvg 分色 + flowSvg，generateSVG() try-catch fallback
- DDSToolbar 集成：plantuml/schema/svg export 按钮
- 提交: `7539b2763`

### E5: Template Library
- `useTemplateManager.ts`: exportTemplate (Blob download)/importTemplate (JSON validate)/getHistory/createSnapshot (MAX 10)/deleteSnapshot
- `TemplateHistoryPanel.tsx`: history-item data-testid，formatDate() 格式化，restore/delete 按钮
- TemplateGallery 集成：export/import/history 按钮 + 10 个快照上限
- 提交: `0a076d3c5`

## coord-completed 收口检查流程

### 虚假完成检查清单
每个 Epic 必须验证以下 4 项产出物：

| 检查项 | 命令 | 通过标准 |
|--------|------|---------|
| Dev commit 存在 | `git log --oneline` | Epic feat commit 存在 |
| 测试通过 | `cd vibex-fronted && node scripts/test-with-exit-code.js` | exit 0，test results 显示 passed |
| Changelog 已更新 | `grep -cF "## [" CHANGELOG.md` | > 0，表示有版本记录 |
| 远程 push 验证 | `git fetch && git log origin/main` | remote commit 存在 |

### E2E 测试环境隔离
- `BASE_URL` 严格来自 `${{ vars.BASE_URL }}`，禁止生产 fallback
- staging health check: curl 3 次重试，确保可达后才运行 E2E
- 域名验证 step: 检测到 vibex.top 直接 exit 1

## 关键经验

### 1. reviewer-push 里程碑模式有效
每个 Epic 的完整 chain：
```
dev → tester → reviewer → reviewer-push
```
reviewer-push 验证远程 push 成功后，`coord-completed` 才解锁。
这个模式确保没有任何 Epic 的 commit 卡在本地。

### 2. npm test wrapper 解决 Vitest exit code 问题
`scripts/test-with-exit-code.js` 解决了 Vitest 4.x 已知问题：
- Worker thread serialized errors 导致 exit code 0 despite test failures
- 解决方案：检测输出中的 FAIL 关键字，强制非零退出码
- 在 CI 环境中这是必须的 gate

### 3. 虚假完成检查必须执行全部 4 项
不能跳过 npm test（因为可能有人改坏了）或远程 push 验证（因为可能没 push）。

### 4. Snapshot 上限防误用
Template History MAX 10 snapshots，防止 localStorage 无限制增长。

### 5. Firebase cursor 零 SDK 依赖
REST API PATCH + EventSource SSE，不依赖 Firebase SDK，避免额外依赖和版本兼容问题。

## 相关

- [vibex-proposals-20260502-sprint22](vibex-proposals-20260502-sprint22.md) — Sprint 22: 5 Epic 单日交付经验（Design Review MCP / E2E Stability / Teams Collab UI / Template Library / Agent E2E）
- [vibex-proposals-20260428-sprint16-qa](vibex-proposals-20260428-sprint16-qa.md) — Sprint 16 QA 收口教训（reviewer-push merge gap）