# VibeX Sprint 25 PRD

**Agent**: PM
**日期**: 2026-05-04
**项目**: vibex-proposals-sprint25
**状态**: Draft

---

## 1. 执行摘要

### 背景

VibeX 完成 Sprint 1-24，已交付 OnboardingModal.tsx（5步引导框架）、模板库（S23 E5）、reviewDiff.ts（S23 E2）、Dashboard page.tsx 含 searchQuery/sortBy 状态、Teams API（Sprint 13-14）、useCanvasRBAC.ts 等能力。Analyst Sprint 25 审查识别出 5 个待处理项：Onboarding 与模板库捆绑交付、跨 Canvas 项目版本对比、Sprint 24 遗留项收尾、Dashboard 搜索过滤、Teams × Canvas 共享。

### 目标

Sprint 25 落地以下改进：
- P001: Onboarding 与需求模板库捆绑交付，新用户引导终点为模板推荐与自动填充
- P002: 跨 Canvas 项目版本对比，任意两个 Canvas 可做 diff 分析
- P003: Sprint 24 遗留项收尾，确认 Slack E2E / TS 审计 / API 测试实际执行状态
- P004: Dashboard 项目搜索与过滤，解决多项目场景下的快速定位问题
- P005: Canvas 与 Team 共享，基于 Teams API 和 useCanvasRBAC 实现权限绑定

### 成功指标

| 指标 | 目标 |
|------|------|
| P001: Onboarding 完成率 | 新用户首次引导完成率 > 60%，模板选择后自动填充示例内容 |
| P002: 跨 Canvas diff | diff 视图可用，报告可导出 JSON |
| P003: Sprint 24 遗留 | CI run 后 Slack 收到 E2E 报告，TS 错误清单量化，API 测试各 ≥ 20 个用例 |
| P004: Dashboard 搜索 | 搜索框/过滤器/排序器可用，响应时间 < 300ms |
| P005: Teams × Canvas | Canvas 可分享给 Team，team badge 标识可见，权限生效 |
| P001-P005 全部 | `pnpm run build` → 0 errors |

---

## 2. Epic 拆分

### S25-E1: Onboarding + 需求模板库捆绑交付（P001）

| Story ID | 描述 | 工时 | 优先级 | 状态 |
|----------|------|------|--------|------|
| S25-S1.1 | Onboarding 末步接入模板推荐逻辑 | 1h | P0 | 新增 |
| S25-S1.2 | 模板选择后 requirement chapter 自动填充示例内容 | 2h | P0 | 新增 |
| S25-S1.3 | 场景化模板推荐（基于 Onboarding Step 2 用户选择） | 1h | P0 | 新增 |
| S25-S1.4 | Onboarding 完成后状态同步（store + localStorage） | 0.5h | P0 | 新增 |

**技术方案**: 方案 A — 捆绑交付。复用现有 `OnboardingModal.tsx` 和 `onboardingStore.ts`，在 Step 5（完成引导）增加"选择一个模板开始"卡片。模板选择后调用模板库 auto-fill 接口，自动填充对应模板的 requirement chapter JSON。场景推荐逻辑：Step 2（clarify）用户选择"新功能开发/重构/Bug修复/文档"时，推荐对应模板。

---

### S25-E2: 跨 Canvas 项目版本对比（P002）

| Story ID | 描述 | 工时 | 优先级 | 状态 |
|----------|------|------|--------|------|
| S25-S2.1 | 新建 /canvas-diff 路由页面 | 0.5h | P1 | 新增 |
| S25-S2.2 | 跨 Canvas 项目选择器（两个 Canvas A/B） | 1h | P1 | 新增 |
| S25-S2.3 | 跨项目 diff 算法（基于现有 reviewDiff.ts） | 2h | P1 | 新增 |
| S25-S2.4 | diff 视图（新增红/移除绿/修改黄）+ JSON 导出 | 1h | P1 | 新增 |

**技术方案**: 方案 A — 复用 reviewDiff.ts。现有 `reviewDiff.ts` 的 `computeReviewDiff` 支持单项目两版本 diff，扩展为 `compareCanvasProjects(A_id, B_id)` 跨项目对比函数。基于 S23 E2 diff 降级策略：JSON 结构 diff，不做语义对比。

---

### S25-E3: Sprint 24 遗留项收尾（P003）

| Story ID | 描述 | 工时 | 优先级 | 状态 |
|----------|------|------|--------|------|
| S25-S3.1 | E2E Slack: 验证 CI run 后 #analyst-channel 收到报告 | 0.5h | P1 | 待验证 |
| S25-S3.2 | TS: 全面审计并量化所有包 TS 错误清单 | 1h | P1 | 待验证 |
| S25-S3.3 | API 测试: auth.ts / project.ts 各补 ≥ 20 个用例 | 2h | P1 | 待开发 |
| S25-S3.4 | CHANGELOG S23/S24 条目移出 [Unreleased] | 0.5h | P1 | 待更新 |

**技术方案**: 方案 A — 验证 + 补全。通过 CHANGELOG 回推 S24 是否真正执行：检查 Slack 历史记录确认 E2E 报告链路；运行 `pnpm -r exec tsc --noEmit` 量化错误；基于 S24 P004 spec 补写 auth/project Vitest 测试用例。

---

### S25-E4: 项目搜索与过滤（Dashboard）（P004）

| Story ID | 描述 | 工时 | 优先级 | 状态 |
|----------|------|------|--------|------|
| S25-S4.1 | 新增 `useProjectSearch` hook（搜索 + 过滤 + 排序） | 1h | P2 | 新增 |
| S25-S4.2 | Dashboard 搜索框 UI（data-testid="project-search-input"） | 0.5h | P2 | 新增 |
| S25-S4.3 | 过滤器 UI（全部/最近7天/最近30天/我创建的） | 0.5h | P2 | 新增 |
| S25-S4.4 | 排序 UI（最新更新/最早更新/名称 A-Z） | 0.5h | P2 | 新增 |

**技术方案**: 方案 A — 客户端过滤。`Dashboard page.tsx` 已有 `searchQuery`/`sortBy` state，直接扩展为 `useProjectSearch` hook。debounce 300ms 防止频繁渲染。搜索范围：项目名称（包含匹配，过滤范围：创建时间 + 创建者，排序：时间/名称）。

---

### S25-E5: 团队协作空间（Teams × Canvas）（P005）

| Story ID | 描述 | 工时 | 优先级 | 状态 |
|----------|------|------|--------|------|
| S25-S5.1 | Canvas 分享给 Team API（基于现有 Teams API） | 1.5h | P2 | 新增 |
| S25-S5.2 | Team 成员查看团队 Canvas 项目列表 | 1h | P2 | 新增 |
| S25-S5.3 | Team 权限（owner/admin/member）× Canvas 操作权限绑定 | 1.5h | P2 | 新增 |
| S25-S5.4 | Canvas 项目 team badge 标识 UI | 0.5h | P2 | 新增 |

**技术方案**: 方案 A — 复用 Teams API。新增 `/canvas-share` API endpoint 调用现有 Teams API，将 Canvas 与 Team 关联。基于 `useCanvasRBAC.ts` 绑定权限：owner=全部操作，admin=编辑/导出，member=只读。分享后的 Canvas 在项目卡片显示 team badge。

---

## 3. 功能点详细规格

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| S25-F001 | Onboarding 末步模板推荐 | Step 5 增加模板卡片，用户选模板后自动填充 | expect(screen.getByTestId('onboarding-template-card')).toBeVisible() | OnboardingModal.tsx |
| S25-F002 | 模板 auto-fill | 模板选择后 requirement chapter 自动填充示例 JSON | expect(canvasStore.requirements).toContain('requirement') | Canvas 编辑器 |
| S25-F003 | 场景化推荐 | Step 2 选择场景后，Step 5 推荐对应模板 | expect(templateCards).toHaveLength(expectedByScenario) | OnboardingModal.tsx |
| S25-F004 | /canvas-diff 页面 | 新建路由，显示跨 Canvas diff 界面 | expect(screen.getByTestId('canvas-diff-page')).toBeVisible() | 新增路由 |
| S25-F005 | 跨 Canvas 选择器 | 用户选择两个 Canvas A/B 进行对比 | expect(screen.getByTestId('canvas-a-selector')).toBeVisible() | /canvas-diff 页面 |
| S25-F006 | 跨项目 diff 算法 | 新增/移除/修改节点 diff 输出 | expect(diffResult.added.length).toBeGreaterThanOrEqual(0) | /canvas-diff 页面 |
| S25-F007 | diff 视图 | 新增（红）/ 移除（绿）/ 修改（黄）节点渲染 | expect(screen.getByTestId('diff-item-added')).toHaveClass(/text-red/) | /canvas-diff 页面 |
| S25-F008 | diff JSON 导出 | diff 报告导出为 .json 文件 | expect(screen.getByTestId('diff-export-btn')).toBeVisible() | /canvas-diff 页面 |
| S25-F009 | Slack E2E 报告验证 | 最近 CI run 后 Slack 收到 E2E 报告 | expect(slackMessage).toContain('[E2E]') | 【需 Slack 验证】 |
| S25-F010 | TS 全面审计 | `pnpm -r exec tsc --noEmit` 所有包错误量化 | expect(tsErrors.filter(e => e.severity === 'error')).toHaveLength(0) | 【无需页面集成】 |
| S25-F011 | API 测试用例补全 | auth.ts / project.ts 各 ≥ 20 个新测试用例 | expect(authTestCases).toBeGreaterThanOrEqual(20) | 【无需页面集成】 |
| S25-F012 | CHANGELOG 更新 | S23/S24 条目移出 [Unreleased] | expect(changelog).not.toContain('[Unreleased]') | 【无需页面集成】 |
| S25-F013 | useProjectSearch hook | 搜索 + 过滤 + 排序逻辑封装 | expect(existsSync('src/hooks/useProjectSearch.ts')).toBe(true) | Dashboard |
| S25-F014 | 搜索框 UI | 实时搜索输入框 | expect(screen.getByTestId('project-search-input')).toBeVisible() | Dashboard |
| S25-F015 | 过滤器 UI | 时间范围/创建者过滤 | expect(screen.getByTestId('project-filter-btn')).toBeVisible() | Dashboard |
| S25-F016 | 排序 UI | 排序下拉选择器 | expect(screen.getByTestId('project-sort-select')).toBeVisible() | Dashboard |
| S25-F017 | Canvas 分享 API | Canvas 与 Team 关联 endpoint | expect(apiResponse.status).toBe(200) | Canvas 分享按钮 |
| S25-F018 | Team Canvas 列表 | Team 成员查看团队项目 | expect(screen.getByTestId('team-canvas-list')).toBeVisible() | Teams 页面 |
| S25-F019 | Team RBAC 绑定 | owner/admin/member 权限在 Canvas 中生效 | expect(canvasPermissions.read).toBe(true) | Canvas 编辑器 |
| S25-F020 | team badge 标识 | Canvas 项目卡片的 Team 标签 | expect(screen.getByTestId('team-project-badge')).toBeVisible() | Dashboard / 项目卡片 |

---

## 4. 验收标准（expect() 断言）

### S25-E1 验收标准

```typescript
// S25-S1.1: Onboarding 末步模板推荐
expect(screen.getByTestId('onboarding-step-5')).toBeVisible()
expect(screen.getByTestId('onboarding-template-card')).toBeInTheDocument()

// S25-S1.2: 模板 auto-fill
userEvent.click(screen.getByTestId('onboarding-template-card'))
expect(canvasStore.requirements).toContain('requirement')
expect(canvasStore.requirements.length).toBeGreaterThan(0)

// S25-S1.3: 场景化推荐（用户选"新功能开发"，推荐含"feature"标签模板）
userEvent.click(screen.getByTestId('onboarding-step-2-option-new-feature'))
userEvent.click(screen.getByTestId('onboarding-next-btn'))
// step 3
userEvent.click(screen.getByTestId('onboarding-next-btn'))
// step 4
userEvent.click(screen.getByTestId('onboarding-next-btn'))
// step 5
const featureTemplates = screen.getAllByTestId('onboarding-template-card')
expect(featureTemplates.length).toBeGreaterThan(0)

// S25-S1.4: 状态同步
userEvent.click(screen.getByTestId('onboarding-template-card'))
expect(onboardingStore.getState().completed).toBe(true)
expect(localStorage.getItem('onboarding_completed')).toBe('true')
```

### S25-E2 验收标准

```typescript
// S25-S2.1: /canvas-diff 页面路由
expect(screen.getByTestId('canvas-diff-page')).toBeVisible()
expect(window.location.pathname).toBe('/canvas-diff')

// S25-S2.2: 跨 Canvas 选择器
expect(screen.getByTestId('canvas-a-selector')).toBeVisible()
expect(screen.getByTestId('canvas-b-selector')).toBeVisible()

// S25-S2.3: 跨项目 diff 算法（基于 reviewDiff.ts 扩展）
const result = compareCanvasProjects('canvas-id-A', 'canvas-id-B')
expect(result).toHaveProperty('added')
expect(result).toHaveProperty('removed')
expect(result).toHaveProperty('changed')

// S25-S2.4: diff 视图 + 导出
expect(screen.getByTestId('diff-view')).toBeInTheDocument()
expect(screen.getByTestId('diff-item-added')).toHaveClass(/text-red/)
expect(screen.getByTestId('diff-item-removed')).toHaveClass(/text-green/)
expect(screen.getByTestId('diff-item-changed')).toHaveClass(/text-yellow/)
expect(screen.getByTestId('diff-export-btn')).toBeVisible()
userEvent.click(screen.getByTestId('diff-export-btn'))
expect(downloadedBlob.type).toBe('application/json')
```

### S25-E3 验收标准

```typescript
// S25-S3.1: Slack E2E 报告（需 Slack 真实验证）
// 验证 Slack #analyst-channel 最近消息包含 [E2E] 报告
// expect(slackMessages[0]).toContain('[E2E] Report')
// expect(slackMessages[0]).toContain('passed')

// S25-S3.2: TS 全面审计
const tsResults = execSync('pnpm -r exec tsc --noEmit', { encoding: 'utf8' })
const tsErrors = parseTSCErrors(tsResults)
expect(tsErrors.filter(e => e.severity === 'error')).toHaveLength(0)

// S25-S3.3: API 测试用例
expect(existsSync('vibex-backend/src/services/auth.test.ts')).toBe(true)
expect(existsSync('vibex-backend/src/services/project.test.ts')).toBe(true)
const authTests = countTestCases('vibex-backend/src/services/auth.test.ts')
const projectTests = countTestCases('vibex-backend/src/services/project.test.ts')
expect(authTests).toBeGreaterThanOrEqual(20)
expect(projectTests).toBeGreaterThanOrEqual(20)

// S25-S3.4: CHANGELOG 更新
const changelog = readFileSync('CHANGELOG.md', 'utf8')
expect(changelog).not.toMatch(/## \[Unreleased\]/s)
```

### S25-E4 验收标准

```typescript
// S25-S4.1: useProjectSearch hook
expect(existsSync('vibex-fronted/src/hooks/useProjectSearch.ts')).toBe(true)

// S25-S4.2: 搜索框
expect(screen.getByTestId('project-search-input')).toBeVisible()
userEvent.type(screen.getByTestId('project-search-input'), ' PRD')
await waitFor(() => {
  expect(screen.queryByText('Loading')).not.toBeInTheDocument()
})
const visibleProjects = screen.getAllByTestId('project-card')
expect(visibleProjects.length).toBeLessThanOrEqual(totalProjects)

// S25-S4.3: 过滤器
expect(screen.getByTestId('project-filter-btn')).toBeVisible()
userEvent.click(screen.getByTestId('project-filter-btn'))
expect(screen.getByTestId('filter-option-last-7-days')).toBeInTheDocument()
userEvent.click(screen.getByTestId('filter-option-last-7-days'))
// 验证过滤后项目在最近7天

// S25-S4.4: 排序
expect(screen.getByTestId('project-sort-select')).toBeVisible()
userEvent.selectOptions(screen.getByTestId('project-sort-select'), 'name-asc')
// 验证项目列表按名称升序排列
```

### S25-E5 验收标准

```typescript
// S25-S5.1: Canvas 分享 API
const shareResult = await api.post('/canvas-share', { canvasId: 'xxx', teamId: 'yyy' })
expect(shareResult.status).toBe(200)
expect(shareResult.data.canvasId).toBe('xxx')
expect(shareResult.data.teamId).toBe('yyy')

// S25-S5.2: Team Canvas 列表
expect(screen.getByTestId('team-canvas-list')).toBeVisible()
const teamProjects = screen.getAllByTestId('team-project-item')
expect(teamProjects.length).toBeGreaterThan(0)

// S25-S5.3: RBAC 权限绑定
// member 角色
expect(canvasPermissions.edit).toBe(false)
expect(canvasPermissions.delete).toBe(false)
// admin 角色
expect(canvasPermissions.edit).toBe(true)
expect(canvasPermissions.delete).toBe(false)
// owner 角色
expect(canvasPermissions.edit).toBe(true)
expect(canvasPermissions.delete).toBe(true)

// S25-S5.4: team badge 标识
expect(screen.getByTestId('team-project-badge')).toBeVisible()
expect(screen.getByTestId('share-to-team-btn')).toBeVisible()
userEvent.click(screen.getByTestId('share-to-team-btn'))
expect(screen.getByTestId('team-share-modal')).toBeInTheDocument()
```

---

## 5. Specs 目录引用

> 详细四态规格见 specs/ 目录：
> - `specs/01-p001-onboarding-template.md`
> - `specs/02-p002-cross-canvas-diff.md`
> - `specs/03-p003-sprint24-leftovers.md`
> - `specs/04-p004-dashboard-search.md`
> - `specs/05-p005-teams-canvas.md`

---

## 6. 依赖关系图

```
S25-E1: S25-S1.1 ──▶ S25-S1.2 ──▶ S25-S1.3 ──▶ S25-S1.4（串行）
S25-E2: S25-S2.1 ──▶ S25-S2.2 ──▶ S25-S2.3 ──▶ S25-S2.4（串行）
S25-E3: S25-S3.1 // S25-S3.2（可并行验证）──▶ S25-S3.3 ──▶ S25-S3.4（串行）
S25-E4: S25-S4.1 ──▶ S25-S4.2 // S25-S4.3 // S25-S4.4（可并行）
S25-E5: S25-S5.1 ──▶ S25-S5.2 // S25-S5.3（可并行）──▶ S25-S5.4（串行）

跨 Epic 依赖:
  S25-E3（S25-S3.3 auth/project 测试）──需── S25-E5（P005 Team 权限测试复用测试框架）
```

**并行度**: S25-E3（S3.1/S3.2）/ S25-E4（S4.1）Week 1 并行；S25-E1 / S25-E2 / S25-E4（S4.2-4.4）Week 1-2 并行；S25-E5 Week 2

---

## 7. 工时汇总

| Epic | 故事数 | 总工时 | 说明 |
|------|--------|--------|------|
| S25-E1 | 4 | 4.5h | 模板捆绑交付，复用现有 OnboardingModal |
| S25-E2 | 4 | 4.5h | diff 页面 + 算法扩展，复用 reviewDiff.ts |
| S25-E3 | 4 | 4h | 验证 + 补全，需先确认 Sprint 24 实际执行状态 |
| S25-E4 | 4 | 2.5h | useProjectSearch hook + Dashboard UI |
| S25-E5 | 4 | 4.5h | 复用 Teams API，权限绑定为主 |
| **合计** | **20** | **~20h（2.5人日）** | |

---

## 8. DoD (Definition of Done)

### S25-E1 DoD
- [ ] Onboarding Step 5 显示模板推荐卡片（`data-testid="onboarding-template-card"`）
- [ ] 用户选择模板后 requirement chapter 自动填充示例内容（非空）
- [ ] Step 2 场景选择影响 Step 5 推荐模板（场景化推荐生效）
- [ ] Onboarding 完成后 `onboarding_completed` flag 写入 localStorage
- [ ] `pnpm run build` → 0 errors

### S25-E2 DoD
- [ ] `/canvas-diff` 路由页面存在（`data-testid="canvas-diff-page"`）
- [ ] 用户可选择两个 Canvas 进行跨项目 diff
- [ ] DiffView 显示新增（红）/ 移除（绿）/ 修改（黄）节点
- [ ] diff 报告可导出 JSON（`data-testid="diff-export-btn"`）
- [ ] 首次选择时 diff 区域显示引导文案"请选择要对比的第二个 Canvas 项目"
- [ ] `pnpm run build` → 0 errors

### S25-E3 DoD
- [ ] 最近一次 CI run 后 Slack #analyst-channel 收到 E2E 报告（包含 [E2E]）
- [ ] `pnpm -r exec tsc --noEmit` 所有包 TS 错误已量化（error 清单 ≤ 0 或有记录）
- [ ] `vibex-backend/src/services/auth.test.ts` ≥ 20 个测试用例
- [ ] `vibex-backend/src/services/project.test.ts` ≥ 20 个测试用例
- [ ] CHANGELOG.md 中 S23/S24 条目移出 `[Unreleased]`
- [ ] `pnpm run build` → 0 errors

### S25-E4 DoD
- [ ] `vibex-fronted/src/hooks/useProjectSearch.ts` 存在
- [ ] 搜索框可用（`data-testid="project-search-input"`），按名称实时过滤
- [ ] 过滤器可用（`data-testid="project-filter-btn"`）：全部/最近7天/最近30天/我创建的
- [ ] 排序可用（`data-testid="project-sort-select"`）：最新更新/最早更新/名称 A-Z
- [ ] 搜索响应时间 < 300ms（debounce）
- [ ] `pnpm run build` → 0 errors

### S25-E5 DoD
- [ ] Canvas 可分享给 Team（`data-testid="share-to-team-btn"`，API 返回 200）
- [ ] Team 成员列表页面可查看团队 Canvas 项目（`data-testid="team-canvas-list"`）
- [ ] Team 权限（owner/admin/member）在 Canvas 操作中生效（RBAC 断言通过）
- [ ] 分享后的 Canvas 项目有 team badge 标识（`data-testid="team-project-badge"`）
- [ ] `pnpm run build` → 0 errors

---

## 9. 识别的问题

| 问题 | Epic | 影响 | 行动 |
|------|------|------|------|
| S25-E3 Sprint 24 状态不可见 | S25-E3 | 高 | 通过 CHANGELOG + Slack 历史倒推，先验证 S24 是否真正执行，再决定补全范围 |
| S25-E5 Teams × Canvas 权限边界 | S25-E5 | 中 | Architect 确认 Canvas 与 Team 的多对多关系设计（一个 Canvas 能否属于多个 Team？） |
| S25-E2 跨项目 diff 数据层 | S25-E2 | 低 | 已降级为 JSON 结构 diff，不做语义对比 |
| S25-E1 模板 auto-fill 边界 | S25-E1 | 低 | 模板 auto-fill 需与 S23 E5 模板库 spec 对齐，避免覆盖用户已有内容 |

---

## 10. 执行决策

- **决策**: 待评审
- **执行项目**: vibex-proposals-sprint25
- **执行日期**: 待定

---

*生成时间: 2026-05-04 11:11 GMT+8*
*PM Agent | VibeX Sprint 25 PRD*
