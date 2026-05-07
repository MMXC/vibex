# 提案提交

**Agent**: analyst
**日期**: 2026-05-05
**项目**: vibex-proposals-sprint26
**仓库**: /root/.openclaw/vibex
**分析视角**: Analyst — 基于 Sprint 1-25 交付成果，识别下一批高优先级功能增强

---

## 1. 提案列表

| ID | 类别 | 标题 | 影响范围 | 优先级 |
|----|------|------|----------|--------|
| P001 | analysis | Onboarding 首次体验断点：Step 5 完成后跳转到空画布导致用户流失 | 新用户激活 | P0 |
| P002 | analysis | 跨项目 Canvas 版本历史缺失，无法回溯历史状态 | 协作场景 | P0 |
| P003 | improvement | Dashboard 项目卡片缺少批量操作（归档/删除/导出） | 多项目管理效率 | P1 |
| P004 | improvement | 移动端适配缺失，Canvas 编辑器在手机/平板上不可用 | 移动用户 | P1 |
| P005 | improvement | Canvas 组件属性面板在复杂项目（>100 nodes）下渲染卡顿 | 大型项目管理 | P1 |

---

## 2. 提案详情

### P001: Onboarding 首次体验断点

**问题描述**:
Sprint 25 E1 完成 Onboarding + 模板库捆绑交付，用户完成 Step 5 后被引导到"新建画布"页面，但此时画布为空（没有节点），用户面对空白画布无法理解下一步操作，导致激活率低。

**影响范围**:
新注册用户在完成 Onboarding 后 24h 内流失率。当前 Onboarding 完成率目标 > 60%，但无数据显示实际留存。

**验收标准**:
- 新用户完成 Onboarding → 跳转至画布页面时，画布已预填充推荐模板内容（至少 3 个节点）
- 画布页面展示引导提示气泡（data-testid="canvas-first-hint"），3s 后自动消失
- Onboarding 完成后 24h 回访率 > 40%（需埋点）

---

### P002: 跨项目 Canvas 版本历史缺失

**问题描述**:
Sprint 25 E2 完成跨 Canvas diff，但仅支持两个项目同一时刻的快照对比。实际协作场景中，用户需要查看同一个 Canvas 项目的历史版本（时间线回溯），当前完全没有版本历史功能。

**影响范围**:
需要回溯变更、协作审查、误操作恢复的用户场景。

**验收标准**:
- 每个 Canvas 项目有版本历史面板（data-testid="version-history-panel"），展示最近 20 个版本快照
- 用户可点击任意历史版本预览（含时间戳、修改者）
- 可将历史版本恢复到当前画布（需二次确认）
- 版本历史 API 支持 `/api/v1/projects/:id/versions` 返回版本列表

---

### P003: Dashboard 项目批量操作

**问题描述**:
Sprint 25 E4 完成 Dashboard 搜索过滤，但用户管理多项目（>20个）时，无法批量归档/删除/导出，只能逐个操作，效率极低。

**影响范围**:
拥有大量历史项目的用户，影响日常管理效率。

**验收标准**:
- Dashboard 支持多选（checkbox, data-testid="project-checkbox-{id}"）
- 批量操作栏（data-testid="bulk-action-bar"）：归档 / 删除 / 导出 JSON
- 批量删除需二次确认弹窗，显示将被删除的项目数量
- 批量导出生成包含所有选中项目元数据的 JSON 文件

---

### P004: 移动端适配

**问题描述**:
VibeX 当前 Canvas 编辑器使用固定视口宽度，在手机（<768px）和平板（768-1024px）上显示为桌面压缩版，无法正常使用。Sprint 6 交付了 AI Coding 集成，但移动端体验未覆盖。

**影响范围**:
移动/平板用户（预计占访问量 15-20%）。

**验收标准**:
- 断点响应式设计：<768px 显示简化导航 + 移动键盘适配；768-1024px 显示平板布局
- Canvas 编辑器在移动端可查看（只读模式，data-testid="canvas-readonly-mode"）
- 移动端写保护提示：data-testid="mobile-write-disabled-banner"，提示"请在桌面端编辑"
- `pnpm test:e2e` 在 375px / 768px 两个视口下均通过

---

### P005: 大型项目性能优化

**问题描述**:
当 Canvas 项目节点数 > 100 时，属性面板渲染卡顿（React re-render 风暴），用户操作延迟明显。Sprint 4 的状态机可视化在大型 API 规格项目中已出现性能问题。

**影响范围**:
大型 API 规格项目（> 100 endpoints）和复杂业务规则项目用户。

**验收标准**:
- 节点数 100-500 项目，属性面板交互响应 < 200ms
- 使用虚拟化列表（react-window）渲染属性面板，DOM 节点数 < 500
- 页面性能指标：LCP < 2.5s，FID < 100ms（ Lighthouse 移动端）
- 大型项目（> 200 nodes）加载时显示进度指示器（data-testid="loading-progress"）

---

## 3. 相关文件

- Sprint 25 PRD: `docs/vibex-proposals-sprint25/prd.md`
- Sprint 25 AGENTS: `docs/vibex-proposals-sprint25/AGENTS.md`
- 设计系统: `DESIGN.md`

---

## 根因分析

### P001: Onboarding 完成但留存低

#### 根因
Sprint 25 E1 的验收标准中"模板选择后自动填充"只覆盖了 `requirement chapter`，未覆盖 Canvas 画布初始状态。Onboarding → 模板选择 → 跳转画布时，画布是空的，缺少引导性内容。

#### 证据
- `OnboardingModal.tsx` Step 5 跳转到 `/canvas/{projectId}` 时，`projectId` 对应项目无节点
- Sprint 25 PRD E1 验收标准无"画布预填充内容"要求
- `docs/vibex-proposals-sprint25/AGENTS.md` E1 Developer 职责未提及画布预填充逻辑

---

### P002: 缺少版本历史

#### 根因
Sprint 25 E2 跨 Canvas diff 的实现是"两个项目同一时刻对比"，而非"单一项目历史版本对比"。数据模型中缺少 `project_versions` 表或等效存储，无法支撑版本历史功能。

#### 证据
- `canvas-diff` 组件仅接受两个 `projectId` 参数，无时间维度
- Cloudflare D1 数据库 schema 中无 `project_versions` 表定义
- Sprint 6 的 AI Coding 集成也未涉及版本历史

---

### P003: Dashboard 批量操作缺失

#### 根因
Sprint 25 E4 的 scope 是搜索 + 过滤 + 排序，批量操作未纳入 Sprint 25 的 PRD。Dashboard `page.tsx` 的 state 结构不支持多选集合。

#### 证据
- `docs/vibex-proposals-sprint25/prd.md` E4 Stories 中无批量操作相关条目
- `dashboard/page.tsx` 当前只有单个项目的操作按钮（无 checkbox 选择集合）

---

### P004: 移动端未适配

#### 根因
VibeX 从 Sprint 1 开始就以桌面端为核心设计，所有布局使用固定宽度和绝对定位，从未进行过移动端适配测试。

#### 证据
- `DESIGN.md` 中无移动端断点定义
- `viewport` meta tag 为 `width=device-width, initial-scale=1`，未锁定缩放
- Playwright E2E 测试套件中无移动端视口测试（`test:e2e` 默认 1280px）

---

### P005: 大型项目性能问题

#### 根因
属性面板（ChapterPanel/PropertyPanel）使用全量渲染策略，节点数增加时 React 重新渲染整个面板。Sprint 4 的 API 端点拖拽设计（> 100 endpoints）已经暴露性能问题，但当时未解决。

#### 证据
- `ChapterPanel.tsx` 无 memo/useMemo 优化，props 变化时全量 re-render
- Sprint 4 PRD 无大型项目性能验收标准
- `DESIGN.md` 无性能预算（performance budget）约束

---

## 建议方案

### P001: Onboarding → 画布预填充

#### 方案 A（推荐）
- 描述：在 Onboarding Step 5 跳转画布前，调用模板 auto-fill API，同时填充 `canvas_nodes` JSON（含模板推荐的结构化节点）。用户到达画布页面时已有预置内容。
- 实施成本：低（2-3h）
- 风险：低（不改变现有 API）
- 回滚计划：关闭 auto-fill 逻辑即可

#### 方案 B
- 描述：在画布页面检测到空项目时，自动展示引导教程气泡（独立于 Onboarding），引导用户添加第一个节点。
- 实施成本：中（需要新的引导组件）
- 风险：中（新增 UI 组件需维护）
- 回滚计划：隐藏引导组件

---

### P002: Canvas 版本历史

#### 方案 A（推荐）
- 描述：引入 D1 数据库 `project_versions` 表，每次 Canvas 保存时生成快照（最多保留 50 个版本）。版本历史面板展示时间线，支持预览和恢复。
- 实施成本：高（需要 D1 迁移 + 前后端联动）
- 风险：中（存储空间增长需要配额管理）
- 回滚计划：版本历史面板隐藏，旧数据保留

#### 方案 B
- 描述：基于 Git 的版本历史方案，利用现有 Git 仓库存储 Canvas JSON，通过 git diff 实现版本对比（不需要数据库改动）。
- 实施成本：中（前端展示 + git log 集成）
- 风险：高（Canvas JSON 提交频率高，git log 噪音大）
- 回滚计划：关闭 git 版本历史展示

---

### P003: Dashboard 批量操作

#### 方案 A（推荐）
- 描述：在 `Dashboard page.tsx` 引入 `selectedProjectIds` state，每个项目卡片增加 checkbox。底部固定批量操作栏，支持归档/删除/导出。
- 实施成本：低（1-2h）
- 风险：低
- 回滚计划：隐藏 checkbox 和操作栏

---

### P004: 移动端适配

#### 方案 A（推荐）
- 描述：采用渐进增强策略。移动端 Canvas 强制只读模式，PC 端负责所有编辑操作。添加 `data-testid` 标识移动端写保护状态。
- 实施成本：中（需要 CSS 断点 + 只读模式逻辑）
- 风险：低（不改变桌面端）
- 回滚计划：移除 CSS 断点即可

#### 方案 B
- 描述：完全重构 Canvas 编辑器为响应式布局，适配所有视口。
- 实施成本：极高（> 2 周）
- 风险：高
- 回滚计划：回退到当前版本

---

### P005: 大型项目性能优化

#### 方案 A（推荐）
- 描述：属性面板引入 `react-window` 虚拟化列表 + `React.memo` 优化渲染路径。针对大型项目（> 200 nodes）添加骨架屏进度指示器。
- 实施成本：中（3-4h）
- 风险：低
- 回滚计划：移除虚拟化组件即可

---

## 执行依赖

### P001
- [ ] 需要修改的文件: `OnboardingModal.tsx`, `canvasNodesStore.ts`
- [ ] 前置依赖: Sprint 25 E1 Onboarding 模板 auto-fill（已完成）
- [ ] 需要权限: 无
- [ ] 预计工时: 2h
- [ ] 测试验证命令: Playwright E2E：完成 Onboarding → 进入画布 → 验证画布节点数 > 0

### P002
- [ ] 需要修改的文件: D1 schema, `/api/v1/projects/:id/versions` API, `canvas-diff/VersionHistory.tsx`
- [ ] 前置依赖: Sprint 25 E2 跨 Canvas diff（已完成）
- [ ] 需要权限: D1 数据库写权限
- [ ] 预计工时: 6h
- [ ] 测试验证命令: 创建项目 → 修改 → 打开版本历史 → 验证版本列表 API 返回 ≥ 2 条

### P003
- [ ] 需要修改的文件: `dashboard/page.tsx`, `DashboardCard.tsx`
- [ ] 前置依赖: Sprint 25 E4 Dashboard 搜索（已完成）
- [ ] 需要权限: 无
- [ ] 预计工时: 1.5h
- [ ] 测试验证命令: Playwright E2E：选择 3 个项目 → 批量导出 → 验证 JSON 包含 3 个项目

### P004
- [ ] 需要修改的文件: `*.module.css`（全局响应式布局）, `CanvasEditor.tsx`（只读模式）
- [ ] 前置依赖: 无
- [ ] 需要权限: 无
- [ ] 预计工时: 4h
- [ ] 测试验证命令: `pnpm test:e2e --project=mobile` 在 375px / 768px 视口通过

### P005
- [ ] 需要修改的文件: `ChapterPanel.tsx`, `PropertyPanel.tsx`, `package.json`（新增 react-window）
- [ ] 前置依赖: 无
- [ ] 需要权限: 无
- [ ] 预计工时: 3h
- [ ] 测试验证命令: Lighthouse 移动端性能审计：LCP < 2.5s

---

*Analyst Agent | VibeX Sprint 26 提案 | 2026-05-05*
