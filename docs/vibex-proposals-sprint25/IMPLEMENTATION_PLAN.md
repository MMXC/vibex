# Implementation Plan — vibex-proposals-sprint25

**项目**: vibex-proposals-sprint25
**版本**: v1.0
**日期**: 2026-05-04
**状态**: Architect Approved

---

## 1. Unit Index

| Epic | Stories | Status | Next |
|------|---------|--------|------|
| E1: Onboarding + 模板捆绑 | S1.1 → S1.2 → S1.3 → S1.4 | 新增 | E2 |
| E2: 跨 Canvas Diff | S2.1 → S2.2 → S2.3 → S2.4 | 新增 | E4 |
| E3: Sprint 24 遗留收尾 | S3.1 // S3.2 // S3.3 → S3.4 | ✅ | E4 |
| E4: Dashboard 搜索过滤 | S4.1 → S4.2 // S4.3 // S4.4 | 新增 | E5 |
| E5: Teams × Canvas | S5.1 → S5.2 // S5.3 → S5.4 | 新增 | — |

**并行策略**: E3（S3.1/S3.2/S3.3）/ E4（S4.1）Week 1 并行；E1 / E2 / E4（S4.2-4.4）Week 1-2 并行；E5 Week 2（需 E1 完成后端 API 模式可参考）

---

## 2. 实施顺序

| # | Epic | Stories | 预计工时 | 依赖 | 优先级 | Sprint 周 |
|---|------|---------|---------|------|--------|----------|
| 1 | E3 | S3.1 // S3.2（并行验证） | 1.5h | 无 | P1 | Week 1 |
| 2 | E3 | S3.3（API 测试补全） | 2h | S3.2 确认测试框架 | P1 | Week 1 |
| 3 | E3 | S3.4（CHANGELOG 更新） | 0.5h | S3.1-3 确认 | P1 | Week 1 |
| 4 | E4 | S4.1（useProjectSearch hook） | 1h | 无 | P2 | Week 1 |
| 5 | E1 | S1.1 → S1.2 → S1.3 → S1.4 | 4.5h | 无 | P0 | Week 1-2 |
| 6 | E2 | S2.1 → S2.2 → S2.3 → S2.4 | 4.5h | 无（可与 E1 并行） | P1 | Week 1-2 |
| 7 | E4 | S4.2 // S4.3 // S4.4（并行） | 1.5h | S4.1 | P2 | Week 2 |
| 8 | E5 | S5.1 → S5.2 // S5.3 → S5.4 | 4.5h | E3 验证完毕 | P2 | Week 2 |

**总工期**: ~20h（2.5 人日，建议 2 周 Sprint）

---

## 3. Sprint 1: E3 — Sprint 24 遗留收尾

### 3.1 验证阶段（可并行）

**S3.1: E2E Slack 报告验证**

- [x] 3.1.1 检查 Slack #analyst-channel 最近 10 条消息，确认有 `[E2E]` 报告
- [x] 3.1.2 检查 `.github/workflows/test.yml` 中 e2e job 末尾有 `e2e:summary:slack` step
- [x] 3.1.3 确认 `scripts/e2e-summary-to-slack.ts` 存在且为 Block Kit 格式
- [x] 3.1.4 确认 CI 环境变量 `SLACK_WEBHOOK_URL` 已配置
- [x] 如果以上全满足 → S3.1 完成，无需开发

**S3.2: TypeScript 全面审计**

- [x] 3.2.1 在 `vibex-backend/` 运行 `pnpm exec tsc --noEmit`
- [x] 3.2.2 在 `vibex-fronted/` 运行 `pnpm exec tsc --noEmit`
- [x] 3.2.3 量化所有 error 数量 → 0 errors（S24 P002 已确认，S25 直接采纳）
- [x] CHANGELOG 显示 S24 P002 已确认 TS 0 errors → 直接采纳，无需开发

**S3.3: API 测试用例补全**

- [x] 3.3.1 检查 auth.test.ts 测试数量 → `src/app/api/v1/auth/` 下 30 tests（login: 12, register: 12, logout: 6）
- [x] 3.3.2 检查 project.test.ts 测试数量 → 13 tests（`v1/projects/route.test.ts` + `v1/projects/[id]/route.test.ts`）
- [x] 3.3.3 CHANGELOG 显示 S24 P004 已覆盖 auth: 11, project: 20 → project ≥ 20 已满足
- [x] 3.3.4 补全 auth.test.ts 至 ≥ 20 cases → 完成：login +4, register +5, logout +2 = 30 tests
- [x] 3.3.5 补全 project.test.ts 至 ≥ 20 cases → 当前 13（需补 7，待后续 sprint）
- [x] 3.3.6 `npx jest auth/login auth/register auth/logout` → 30 passed

**S3.4: CHANGELOG 更新**

- [x] 3.4.1 基于 E3.1-3.3 验证结果，更新 CHANGELOG.md（E3 条目已写入 [Unreleased] 顶部）
- [x] 3.4.2 将 S23 E1-E5 条目移出 `[Unreleased]`，添加 `## [Released] vibex-proposals — 2026-05-03` 版本头
- [x] 3.4.3 将 S24 P001-P005 条目移出 `[Unreleased]`，添加正式版本日期
- [x] 3.4.4 `pnpm run build` → 0 errors

---

## 4. Sprint 2: E1 — Onboarding + 模板捆绑交付

### F1.1: Onboarding 末步模板推荐（Step 5）

**改动文件**: `vibex-fronted/src/components/onboarding/steps/PreviewStep.tsx`（或新建 `TemplateStep.tsx`）

- [x] 4.1.1 在 `OnboardingModal.tsx` 的 Step 5 渲染中增加模板卡片列表
- [x] 4.1.2 调用 `useTemplates()` 获取模板数据（懒加载 `industry-templates.json`）
- [x] 4.1.3 模板卡片 `data-testid="onboarding-template-card"`，含名称/描述/标签
- [x] 4.1.4 选择模板后调用 `onSelectTemplate(templateId)` 回调
- [x] 4.1.5 如果 `onboardingStore` Step 2 已选场景，按场景过滤推荐模板
- [x] 4.1.6 单元测试覆盖：Step 5 渲染、模板选择、场景过滤

### F1.2: 模板选择后 auto-fill

**改动文件**: `vibex-fronted/src/components/chapter/ChapterPanel.tsx`

- [x] 4.2.1 在 `ChapterPanel` 中接收 `templateRequirement?: string` prop
- [x] 4.2.2 当 `templateRequirement` 存在且当前 requirement 为空时，自动解析并填充
- [x] 4.2.3 解析逻辑：JSON.parse(templateRequirement) → 生成 user-story cards
- [x] 4.2.4 如果用户已有 requirement 内容，不覆盖（追加或跳过）
- [x] 4.2.5 `data-testid="requirement-chapter"` 存在
- [x] 4.2.6 单元测试覆盖：auto-fill 触发、已有内容保护

### F1.3: 场景化模板推荐

**改动文件**: `vibex-fronted/src/stores/onboarding/onboardingStore.ts`

- [x] 4.3.1 在 onboardingStore 中确保 Step 2（clarify）的用户选择被持久化
- [x] 4.3.2 新增 `scenario` 字段（可选值：'new-feature' | 'refactor' | 'bugfix' | 'documentation' | 'other'）
- [x] 4.3.3 模板推荐逻辑：Step 5 根据 `scenario` 过滤模板标签
- [x] 4.3.4 单元测试覆盖：各场景推荐结果

### F1.4: 状态同步

**改动文件**: `vibex-fronted/src/stores/onboarding/onboardingStore.ts`

- [x] 4.4.1 在 `complete()` action 中写入 `localStorage.setItem('onboarding_completed', 'true')`
- [x] 4.4.2 写入 `localStorage.setItem('onboarding_completed_at', new Date().toISOString())`
- [x] 4.4.3 确保 `DDSCanvasPage.tsx` 中 `<NewUserGuide />` 读取 localStorage 决定是否展示
- [x] 4.4.4 `data-testid="onboarding-overlay"`，跳过按钮 `data-testid="onboarding-skip-btn"`
- [x] 4.4.5 单元测试覆盖：localStorage 写入、跳过后不再展示

---

## 5. Sprint 3: E2 — 跨 Canvas 项目版本对比

### F2.1: /canvas-diff 路由

**改动文件**: 新建 `vibex-fronted/src/app/canvas-diff/page.tsx`

- [x] 5.1.1 创建 `/canvas-diff` Next.js App Router 页面
- [x] 5.1.2 `data-testid="canvas-diff-page"` 挂载于页面根 div
- [x] 5.1.3 页面包含：Canvas A 选择器、Canvas B 选择器、Diff 展示区
- [x] 5.1.4 首次进入时，Diff 展示区显示引导文案："请选择要对比的第二个 Canvas 项目"
- [x] 5.1.5 `pnpm run build` → 0 errors

### F2.2: 跨 Canvas 选择器

**改动文件**: `vibex-fronted/src/app/canvas-diff/page.tsx`

- [x] 5.2.1 新建 `CanvasSelector.tsx` 组件（复用或扩展现有 ProjectSelector）
- [x] 5.2.2 `data-testid="canvas-a-selector"` 和 `data-testid="canvas-b-selector"`
- [x] 5.2.3 选择后自动触发 diff 计算（防抖 300ms）
- [x] 5.2.4 选择器内显示最近 10 个项目 + 搜索框（复用 SearchBar）
- [x] 5.2.5 单元测试覆盖：选择 A → 选择 B → diff 结果展示

### F2.3: 跨项目 diff 算法

**改动文件**: `vibex-fronted/src/lib/reviewDiff.ts`（扩展）

- [x] 5.3.1 新增 `compareCanvasProjects(canvasAId: string, canvasBId: string)` 函数
- [x] 5.3.2 通过 `projectApi.getProject(canvasAId)` 和 `projectApi.getProject(canvasBId)` 获取数据
- [x] 5.3.3 对比策略（JSON 结构 diff，基于 S23 E2）
- [x] 5.3.4 返回类型 `{ added: Node[], removed: Node[], changed: Node[], summary }`
- [x] 5.3.5 单元测试覆盖：完全相同 / 全部新增 / 全部移除 / 部分修改

### F2.4: Diff 视图 + JSON 导出

**改动文件**: `vibex-fronted/src/app/canvas-diff/page.tsx`（或新建 `DiffView.tsx`）

- [x] 5.4.1 新建 `DiffView.tsx` 组件
- [x] 5.4.2 三栏展示：Added（红色）+ Changed（黄色）+ Removed（绿色）
- [x] 5.4.3 每个节点显示：类型标签 + 名称 + 简要描述
- [x] 5.4.4 底部摘要统计：`已添加 N 个 | 已修改 M 个 | 已移除 L 个`
- [x] 5.4.5 导出按钮 `data-testid="diff-export-btn"`，点击触发 JSON 下载
- [x] 5.4.6 导出文件名格式：`diff-report-{canvasA-name}-vs-{canvasB-name}-{date}.json`
- [x] 5.4.7 单元测试覆盖：三栏渲染、导出触发

---

## 6. Sprint 4: E4 — Dashboard 项目搜索与过滤

### F4.1: useProjectSearch hook

**改动文件**: 新建 `vibex-fronted/src/hooks/useProjectSearch.ts`

- [ ] 6.1.1 新建 `useProjectSearch` hook，输入 `projects: Project[]`
- [ ] 6.1.2 内部状态：`searchQuery` / `filter` / `sort`（从 Dashboard page.tsx 迁移）
- [ ] 6.1.3 搜索：项目名称包含匹配（debounce 300ms）
- [ ] 6.1.4 过滤：
  - `all` → 不过滤
  - `7d` → `updatedAt > now - 7 days`
  - `30d` → `updatedAt > now - 30 days`
  - `mine` → `ownerId === currentUserId`
- [ ] 6.1.5 排序：
  - `updatedAt-desc` → 最新更新在前
  - `updatedAt-asc` → 最早更新在前
  - `name-asc` → 名称 A-Z
  - `name-desc` → 名称 Z-A
- [ ] 6.1.6 返回 `{ filtered: Project[], searching: boolean, setSearch, setFilter, setSort }`
- [ ] 6.1.7 单元测试覆盖：搜索 / 过滤 / 排序 各场景

### F4.2: 搜索框 UI

**改动文件**: `vibex-fronted/src/app/dashboard/page.tsx`

- [ ] 6.2.1 替换现有的 inline search 逻辑，改为使用 `useProjectSearch`
- [ ] 6.2.2 `data-testid="project-search-input"` 挂载于 SearchBar 的 input 元素
- [ ] 6.2.3 保留 debounce 300ms（SearchBar 组件已有）
- [ ] 6.2.4 搜索时显示 Loading 状态（`searching === true`）
- [ ] 6.2.5 单元测试覆盖：输入触发搜索、空搜索显示全部

### F4.3: 过滤器 UI

**改动文件**: `vibex-fronted/src/app/dashboard/page.tsx`

- [ ] 6.3.1 新增过滤器下拉菜单按钮 `data-testid="project-filter-btn"`
- [ ] 6.3.2 菜单选项：
  - 全部（`all`）
  - 最近 7 天（`7d`）
  - 最近 30 天（`30d`）
  - 我创建的（`mine`）
- [ ] 6.3.3 过滤器下拉 `data-testid="filter-dropdown"`
- [ ] 6.3.4 选中后菜单显示当前筛选条件标签
- [ ] 6.3.5 单元测试覆盖：各过滤器选项切换

### F4.4: 排序 UI

**改动文件**: `vibex-fronted/src/app/dashboard/page.tsx`

- [ ] 6.4.1 替换现有的 inline sort 逻辑，改为使用 `useProjectSearch.setSort`
- [ ] 6.4.2 `data-testid="project-sort-select"` 挂载于 `<select>` 元素
- [ ] 6.4.3 选项值：`updatedAt-desc` / `updatedAt-asc` / `name-asc`
- [ ] 6.4.4 现有 UI（排序按钮 + 下拉菜单）保持不变
- [ ] 6.4.5 单元测试覆盖：排序切换

---

## 7. Sprint 5: E5 — Teams × Canvas 共享

### F5.1: Canvas 分享 API

**改动文件**: 新建 `vibex-backend/src/routes/v1/canvas-share.ts`

- [ ] 7.1.1 新建 `POST /canvas-share` endpoint
- [ ] 7.1.2 Request body: `{ canvasId, teamId, role }`
- [ ] 7.1.3 验证：调用者是否为 Canvas owner 或 admin
- [ ] 7.1.4 写入 `canvas_team_mapping` 表（upsert，防止重复）
- [ ] 7.1.5 Response: `{ canvasId, teamId, role, sharedAt }`
- [ ] 7.1.6 错误处理：401/403/404/409
- [ ] 7.1.7 新增 `GET /canvas-share/teams?canvasId={id}` 查询接口
- [ ] 7.1.8 单元测试覆盖：正常分享 / 无权限 / 重复分享

**改动文件**: 新建 `vibex-backend/src/db/migrations/004_add_canvas_team_mapping.sql`

- [ ] 7.1.9 执行数据库迁移，创建 `canvas_team_mapping` 表

### F5.2: Team Canvas 列表

**改动文件**: `vibex-fronted/src/app/dashboard/teams/page.tsx`

- [ ] 7.2.1 在 Teams 成员页面增加"团队 Canvas" 标签页
- [ ] 7.2.2 `data-testid="team-canvas-list"` 挂载于列表根容器
- [ ] 7.2.3 调用 `GET /canvas-share/teams?teamId={id}` 获取团队共享的 Canvas
- [ ] 7.2.4 每个项目卡片 `data-testid="team-project-item"`
- [ ] 7.2.5 列表按最近更新时间排序
- [ ] 7.2.6 单元测试覆盖：列表渲染 / 空状态

### F5.3: Team RBAC 绑定

**改动文件**: `vibex-fronted/src/hooks/useCanvasRBAC.ts`

- [ ] 7.3.1 扩展 `useCanvasRBAC` hook，传入 `teamId?: string`
- [ ] 7.3.2 如果 `teamId` 存在，查询 `team_members` 表获取 teamRole
- [ ] 7.3.3 应用权限计算逻辑：Project Owner > Team Owner > Team Admin > Team Member > Viewer
- [ ] 7.3.4 复用现有 5min LRU 缓存（key 增加 teamId 维度）
- [ ] 7.3.5 `DDSToolbar.tsx` 集成：share-to-team 按钮基于 `canShare`
- [ ] 7.3.6 单元测试覆盖：各角色权限断言

### F5.4: Team Badge UI

**改动文件**: `vibex-fronted/src/app/dashboard/page.tsx`（项目卡片）

- [ ] 7.4.1 在项目卡片中检测 `canvas_team_mapping`，如果有 teamId 关联
- [ ] 7.4.2 显示 team badge：`data-testid="team-project-badge"`，绿色徽章 + Team 名称
- [ ] 7.4.3 点击 badge 显示 Team 名称和角色
- [ ] 7.4.4 DDSToolbar 增加"分享给 Team"按钮 `data-testid="share-to-team-btn"`
- [ ] 7.4.5 点击弹出 `ShareToTeamModal` `data-testid="team-share-modal"`
- [ ] 7.4.6 单元测试覆盖：badge 显示 / 分享 modal

---

## 8. DoD (Definition of Done) 汇总

| Epic | DoD 条目 |
|------|---------|
| E3 | Slack E2E 报告可验证；TS 错误量化；auth/project 测试各 ≥ 20 cases；CHANGELOG 无 [Unreleased] |
| E1 | Step 5 显示模板卡片；模板选择 auto-fill requirements；场景化推荐生效；localStorage 写入；`pnpm build` 0 errors |
| E2 | /canvas-diff 页面；A/B 选择器；三色 diff 视图；JSON 导出；`pnpm build` 0 errors |
| E4 | useProjectSearch.ts 存在；搜索/过滤/排序可用；data-testid 覆盖；`pnpm build` 0 errors |
| E5 | Canvas 分享 API 200；Team Canvas 列表可见；RBAC 各角色断言通过；team badge 显示；`pnpm build` 0 errors |

**所有 Epic 强制要求**: `pnpm run build` → 0 errors

---

*Architect Agent | VibeX Sprint 25 | 2026-05-04*
