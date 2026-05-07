# Sprint 25 Research Report

**项目**: vibex-proposals-sprint25-qa
**研究时间**: 2026-05-05
**研究者**: analyst subagent

---

## 历史 learnings

### onboarding / template / 模板

无专门 learns 文档。相关经验分散在 CHANGELOG.md 的 S23/S24 条目中：
- **S24 P003 (Onboarding 新手指引)**: T3.5 data-testid 覆盖已实施，T3.7 NewUserGuide 集成到 DDSCanvasPage。OnboardingModal.tsx + steps 全部含 data-testid。
- **S25 E1 (Onboarding + 模板捆绑)**: Step5 模板推荐 + auto-fill + 场景化过滤已完成。
- **关键教训（from canvas-testing-strategy.md）**: mockStore 不能过于简化，Zustand store 的实际行为需通过 `vi.mock()` 的 `mockReturnValue` 真实模拟，否则测试通过但运行时报错。→ E1 auto-fill 的 `useEffect` 测试需注意 localStorage 和 store 联动。

### canvas-diff / 跨项目 / diff

**learnings 相关**:
- `vibex-e2e-test-fix.md`: 警告 IMPLEMENTATION_PLAN scope drift 问题——PRD Epic 划分 vs 实际实现的颗粒度差异。当 Epic 之间存在实现依赖时，应合并 Epic 而非强行拆分。
- **S24 P005 (Canvas 对比)**: `/canvas-diff` 路由 + `CanvasDiffSelector` + 三树 diff 算法（context/flow/component）。6 UT 已覆盖。提交 e62f161fc。
- **S25 E2 (跨 Canvas Diff)**: 在 P005 基础上补全 data-testid + 引导文案 + 导出文件名。提交 2abe36e9f。
- **关键**: reviewDiff.ts 在 S23 实现，computeReviewDiff() 基于 item.id 比较。新增的 `compareCanvasProjects` 是独立函数，需确认两个函数不会冲突。

### dashboard / search / 搜索过滤

**learnings 相关**:
- `canvas-cors-preflight-500.md`: 警示中间件层级顺序问题。Options 处理必须在认证层之前。→ Dashboard 搜索 API 涉及 RBAC 权限，需注意 API 层级注册顺序。
- **S25 E4 (Dashboard 搜索过滤)**: `useProjectSearch` hook 已实现（S4.1 ✅），S4.2-4.4 UI 集成完成（checkboxed）。18 个 UT 全部通过。`data-testid="project-search-input"` 已挂载。
- **关键教训（from canvas-testing-strategy.md）**: Hook 单元测试的 TDD 价值——边界条件（null/undefined/empty）覆盖比集成测试更有价值。useProjectSearch 的 18 tests 应重点验证 filter=mine 时 ownerId 匹配逻辑。

### teams / rbac / 权限

无专门 learns 文档。相关经验在 CHANGELOG 中：
- **S25 E5 (Teams × Canvas 共享权限)**: F5.1 canvas-share API + F5.2 Team Canvas 列表 + F5.3 useCanvasRBAC 扩展 + F5.4 ShareToTeamModal + team badge 已全部完成。
- **权限模型**: Project Owner > Team Owner > Team Admin > Team Member > Viewer。useCanvasRBAC 已扩展 teamId 维度。
- **关键**: `useCanvasRBAC.ts` 的 5min LRU 缓存 key 需要包含 teamId 维度，需确认缓存逻辑正确。

### sprint 24 / 遗留项

**learnings 相关**:
- `vibex-e2e-test-fix.md`: 虚假完成检测——项目 status=completed 但 task chain 全 pending。→ E3 的 CHANGELOG 显示 "S3.4 CHANGELOG 更新" 已完成，但 E3 条目仍在 [Unreleased]，需确认是否需要正式 release 流程。
- **S25 E3 (Sprint 24 遗留收尾)**: S3.1 Slack E2E 报告验证 + S3.2 TS 审计确认 0 errors + S3.3 auth 测试补全至 30 cases + S3.4 CHANGELOG 更新。全部完成，但仍在 [Unreleased]。

---

## Git History 分析

### 最近 50 条提交特征

提交活跃，集中在 S25 epic 验证和 review：
- **主要 epic 完成期**: E1(ceb6cbf73) → E2(2abe36e9f) → E3(184f1d851) → E4(c43c1c09a, 42325c4b8) → E5(c5d6f5952)
- **QA 验证期**: 每个 epic 完成后有专门的 `review: vibex-proposals-sprint25 Ex DoD 验证 approved` + `review: vibex-proposals-sprint25 Ex 验收标准修复 approved` 双确认流程
- **近 20 commits 规模**: 41 个文件，+2554/-199 行。前端 dashboard/teams/onboarding/team-share 改动最集中

### Sprint 24/23 关联

- S24 P003 (Onboarding): `80b833c89` → `1f3276bbd` — P003 完成
- S24 P005 (Canvas 对比): `e62f161fc` — canvasDiff + skeleton loading 修复
- Sprint 23 commits 在 CHANGELOG 中有记录（E1-E5 全部 Released）

### 重点文件 git history

| 文件 | 历史 | 现状 |
|------|------|------|
| `reviewDiff.ts` | S23 E2 实现 computeReviewDiff | E2 复用，compareCanvasProjects 新增 |
| `OnboardingModal.tsx` | S24 P003 data-testid 覆盖 | S25 E1 Step5 模板推荐 |
| `dashboard/page.tsx` | 持续演进（207 行改动） | E4 搜索过滤 + E5 team badge |
| `useCanvasRBAC.ts` | S25 新建，F5.3 扩展 teamId | 当前实现见 git diff |
| `canvas-share.ts` (backend) | S25 E5 新建 | 225 行新文件 |

---

## 关键文件摘要

### CHANGELOG.md 状态

**所有 S25 Epic（E1-E5）全部在 [Unreleased] 中**，状态如下：

| Epic | 内容 | DoD | 提交 |
|------|------|-----|------|
| E5 | Teams × Canvas 共享权限 | ✅ canvas-share API 200, team-canvas-list, useCanvasRBAC team, share-to-team-btn, team-project-badge, TS 0 errors | c5d6f5952 + 57da72128 |
| E4 | Dashboard 搜索过滤 | ✅ useProjectSearch hook, 18/18 tests, TS 0 errors | 42325c4b8 |
| E3 | Sprint 24 遗留收尾 | ✅ S3.1-S3.4 全部完成 | 184f1d851 |
| E2 | 跨 Canvas 项目版本对比 | ✅ /canvas-diff, data-testid, diff 三色, export, TS 0 errors | 2abe36e9f |
| E1 | Onboarding + 模板捆绑 | ✅ Step5 模板卡片, auto-fill, 场景化推荐, localStorage, TS 0 errors, ESLint 0 | ceb6cbf73 + fixes |

**S23/S24 条目**: 全部移出 [Unreleased]，已在 `## [Released] vibex-proposals — 2026-05-03` 下。

### IMPLEMENTATION_PLAN.md 状态

**总计 77 checkboxed [x]，34 checkboxed [ ]**（纯数字统计，忽略 checkbox 类型）。

**E4 未完成项（6.1.x）**: S4.1 hook 的 checkbox 显示 [ ]（未被 checked），但 CHANGELOG 明确标记 S4.1 ✅，且 git commit `42325c4b8 test(E4): useProjectSearch 单元测试 18/18 通过` 存在。**结论**: IMPLEMENTATION_PLAN 中 E4 6.1.x checkbox 未同步，但代码和测试均已完成。

**E5 未完成项（7.1.x-7.4.x）**: 全部 [ ] unchecked。但 CHANGELOG 显示 E5 F5.1-F5.4 全部 DoD ✅，git diff 显示 `canvas-share.ts`(+225)、`ShareToTeamModal.tsx`(+218)、`useCanvasRBAC.ts`(+50/-)、`DDSToolbar.tsx`(+30) 已实现。**结论**: IMPLEMENTATION_PLAN E5 section 是 stale copy，代码已完成但 checklist 未更新。

---

## 风险识别

### 高风险

1. **E5 实现与 plan 不一致**: IMPLEMENTATION_PLAN 中 E5 (Section 7) 的全部 20+ 条 checklist 显示 [ ]，但 CHANGELOG 和 git diff 证明所有功能已实现。**风险**: QA 如果按 IMPLEMENTATION_PLAN checklist 检查，会误判为未完成。建议 QA 以 CHANGELOG DoD 条目为基准，以 git diff 为代码证据。

2. **E4 S4.1 checkbox 不同步**: 同上，6.1.x checkbox 未被 checked，但 commit 证明已完成。**风险**: 同上。

3. **[Unreleased] 堆积**: E1-E5 全部在 [Unreleased] 中，S23/S24 已 release。S25 sprint 完成后可能需要正式 release 流程确认。

### 中风险

4. **canvas-share.ts 无单元测试**: CHANGELOG DoD 中未列出 UT 覆盖率要求（vs E4 的 18/18 tests）。backend API routes 是否需要独立 UT？目前不清楚。**建议**: QA 验证时检查 API endpoint 是否有测试覆盖。

5. **useCanvasRBAC teamId 扩展的缓存 key 变更**: 新增 teamId 后缓存 key 结构变化，需确认 LRU 缓存能正确区分 `canvasId` 和 `canvasId+teamId` 的缓存条目。

6. **ShareToTeamModal 无 UT**: CHANGELOG DoD 无 UT 要求，但 modal 包含用户交互逻辑。**建议**: QA 手动验证团队选择 + 权限选择 + POST 流程。

### 低风险

7. **E2 compareCanvasProjects vs reviewDiff computeReviewDiff**: 两个 diff 函数并存，需确认命名空间不冲突。

8. **E1 auto-fill 链路**: templateRequirement localStorage → ChapterPanel useEffect → parseRequirementContent → UserStoryCard。中间任何一环断裂都会导致 auto-fill 失效。**建议**: 端到端覆盖测试。

9. **Teams × Canvas 数据一致性**: canvas_team_mapping 是 in-memory Map（S25 实现），重启后丢失。**判断**: 这是已知限制（MVP 阶段），不是 bug。

---

## 参考链接

- CHANGELOG: `/root/.openclaw/vibex/CHANGELOG.md`
- IMPLEMENTATION_PLAN: `/root/.openclaw/vibex/docs/vibex-proposals-sprint25/IMPLEMENTATION_PLAN.md`
- E5 Epic 验证报告: `/root/.openclaw/vibex/docs/vibex-proposals-sprint25/dev-epic5-teams-canvas-report-20260505-0443.md`
- S24 遗留项: `/root/.openclaw/vibex/docs/vibex-proposals-sprint24/`
- learnings: `/root/.openclaw/vibex/docs/learnings/`
