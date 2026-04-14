# PRD: VibeX Q2 Sprint 1 — P0清理 + 核心体验

**Project**: vibex-p0-q2-sprint1
**Stage**: create-prd
**PM**: PM Agent
**Date**: 2026-04-14
**Status**: Draft

---

## 执行决策
- **决策**: 已采纳
- **执行项目**: vibex-p0-q2-sprint1
- **执行日期**: 2026-04-14

---

## 1. 执行摘要

### 背景

VibeX Q2 Sprint 1 定位为"**清理 P0 债务 + 夯实核心体验**"。当前存在三类紧迫问题：
1. **门面问题**：Auth + /pagelist 视觉风格与主站完全割裂（浅色背景 vs 深色赛博朋克），损害专业品牌信任
2. **基础体验缺失**：项目搜索、AI 补全不智能、Canvas Phase 导航混乱、错误提示不统一
3. **CI 质量门禁损坏**：tsconfig 和 Vitest 配置问题导致 Dev 无法获得可信反馈

### 目标

| 目标 | 指标 |
|------|------|
| 品牌视觉统一 | Auth + /pagelist 使用 `var(--color-bg-primary)` 等 CSS 变量 |
| CI 质量门禁可信 | `tsc --noEmit` 前后端均无错误 |
| 核心体验增强 | 项目搜索响应 < 2s，AI 补全追问 ≤ 3 轮 |
| Sprint 交付 | 6 个 Epic 全部完成并部署到 vibex-app.pages.dev |

### 成功指标

| 指标 | 目标值 |
|------|--------|
| Auth + /pagelist 深色覆盖率 | 100% |
| `tsc --noEmit` 错误数 | 0 |
| Vitest 测试退出码 | 0 |
| Bundle size 增长 | < 200KB |
| Sprint 完成率 | ≥ 85%（6 Epic 中至少 5 个完成）|

---

## 2. Feature List（来自 Analysis）

| ID | 功能名 | 描述 | 根因关联 | 工时 |
|----|--------|------|---------|------|
| F1.1 | Auth 页面 CSS Module 迁移 | 将内联样式迁移到 CSS Module，应用 CSS 变量 | P-001 + A-P0-1 | 2h |
| F1.2 | /pagelist 页面重写 | 重写为符合 DESIGN.md 的深色主题 | A-P0-1 | 1h |
| F2.1 | tsconfig 插件移除 | 移除 `"next"` 相关插件引用 | Dev P0-1 | 1h |
| F2.2 | Vitest 测试文件 include 修复 | 移除 exclude 规则，确保测试文件被 tsc 检查 | Dev P0-2 | 2h |
| F2.3 | 项目 fuzzy 搜索 | 前端 fuzzy 搜索，debounce 300ms | P-003 | 2h |
| F3.1 | TabBar 无障碍后遗症修复 | 验证所有 tab 点击行为一致 | P-004 | 2h |
| F3.2 | Phase 导航 active 状态 | 高亮当前 Phase，刷新后保持 | P-004 | 1h |
| F4.1 | 后端 API 错误格式统一 | 统一为 `{ error: { code, message } }` | P-010 + A-P1-3 | 2h |
| F4.2 | 前端错误展示组件 | 统一使用 Toast/Inline 组件，人类可读文字 | P-010 | 2h |
| F5.1 | AI 澄清卡片 UI 组件 | 澄清问题展示卡片，支持用户回答 | P-002 | 2h |
| F5.2 | AI 追问 prompt 调优 | 设计追问 prompt，限制最大轮次 ≤ 3 | P-002 | 2h |
| F6.1 | Bundle 体积审计 | 识别 > 200KB 的直接依赖 | Dev P0-3 | 2h |
| F6.2 | Dynamic import 改造 | 对 3+ 个大组件实施动态导入 | Dev P0-3 | 4h |
| F6.3 | Bundle size CI 阈值测试 | 增长超限自动 fail CI | Dev P0-3 | 2h |
| **合计** | | | | **27h** |

---

## 3. Epic 拆分

### Epic 总览

| Epic | 描述 | 工时 | 优先级 | Stories |
|------|------|------|--------|---------|
| E1 | 品牌一致性 | 3h | P0 | S1.1, S1.2 |
| E2 | 核心体验基础 | 5h | P0 | S2.1, S2.2, S2.3 |
| E3 | Canvas 操作体验 | 3h | P1 | S3.1, S3.2 |
| E4 | 错误体验统一 | 4h | P1 | S4.1, S4.2 |
| E5 | AI 核心能力 | 4h | P1 | S5.1, S5.2 |
| E6 | 性能基线 | 8h | P2 | S6.1, S6.2, S6.3 |

**总工时**: 27h（含 3h 缓冲）

---

### Epic 1: 品牌一致性（P0）

**目标**: Auth + /pagelist 页面视觉与 VibeX 深色赛博朋克风格完全统一。

#### Story S1.1: Auth 页面 CSS Module 迁移

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | auth.module.css 创建 | 创建 `auth.module.css`，复用 Dashboard 背景系统 | `expect(fs.existsSync('auth.module.css')).toBe(true)` | 【需页面集成 /auth】 |
| F1.1.1 | 背景系统迁移 | 网格叠加层 + 发光球，变量使用 `--color-bg-primary` | `expect(css).toContain('--color-bg-primary')` | 【需页面集成 /auth】 |
| F1.1.2 | 玻璃态卡片 | 登录卡片使用 `backdrop-filter: blur(20px)` | `expect(cardCss).toContain('backdrop-filter')` | 【需页面集成 /auth】 |
| F1.1.3 | 按钮霓虹发光 | 主按钮使用 `--gradient-primary` + 霓虹发光 | `expect(buttonCss).toContain('--gradient-primary')` | 【需页面集成 /auth】 |
| F1.1.4 | 内联样式移除 | 原有内联 `style={{}}` 全部迁移到 CSS Module | `expect(inlineStyleCount).toBe(0)` | 【需页面集成 /auth】 |

**DoD**: `/auth` 页面无内联样式，全部使用 CSS 变量，视觉与 `/canvas` 一致。

#### Story S1.2: /pagelist 页面重写

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.2 | /pagelist 重写 | 重写为符合 DESIGN.md 的深色主题 | `expect(bgColor).toBe('var(--color-bg-primary)')` | 【需页面集成 /pagelist】 |
| F1.2.1 | 路由保留确认 | Coord 确认 /pagelist 路由保留（非删除） | `expect(routeExists).toBe(true)` | 【需页面集成 /pagelist】 |
| F1.2.2 | 深色背景 | 移除 `#f8fafc` 等浅色背景值 | `expect(pageBg).not.toContain('#f8fafc')` | 【需页面集成 /pagelist】 |
| F1.2.3 | 视觉回归测试 | 截图对比 /pagelist 与 /dashboard 风格一致性 | `expect(screenshotSimilar).toBe(true)` | 【需页面集成 /pagelist】 |

**DoD**: `/pagelist` 页面背景为 `var(--color-bg-primary)`，卡片为玻璃态，无浅色元素。

---

### Epic 2: 核心体验基础（P0）

**目标**: 修复 CI 质量门禁 + 实现项目搜索，是 Sprint 所有其他任务的质量前提。

#### Story S2.1: tsconfig 插件移除

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F2.1 | tsconfig.json 修复 | 移除前后端 tsconfig 中的 `"next"` 相关插件引用 | `expect(tscErrors).toBe(0)` | 否 |
| F2.1.1 | 前端 tsconfig | 验证 `tsconfig.json` 中无 `"next"` 相关 plugin | `expect(config).not.toContain('next')` | 否 |
| F2.1.2 | 后端 tsconfig | 验证 `tsconfig.json` 中无 `"next"` 相关 plugin | `expect(config).not.toContain('next')` | 否 |
| F2.1.3 | tsc --noEmit 验证 | `tsc --noEmit` 前后端均返回退出码 0 | `expect(exitCode).toBe(0)` | 否 |

**DoD**: `cd vibex-frontend && tsc --noEmit` + `cd vibex-backend && tsc --noEmit` 均无错误。

#### Story S2.2: Vitest 测试文件 include 修复

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F2.2 | vitest 配置修复 | 移除 exclude 规则，确保测试文件被正确包含 | `expect(vitestRun.exitCode).toBe(0)` | 否 |
| F2.2.1 | exclude 规则清理 | vitest.config.ts 中无不合理 exclude | `expect(excludeRules).toBeDefined()` | 否 |
| F2.2.2 | 现有测试通过 | 所有现有测试（52 个通过）仍然通过 | `expect(testPassCount).toBeGreaterThanOrEqual(52)` | 否 |
| F2.2.3 | 新测试文件被发现 | 新增测试文件时 vitest 能自动发现 | `expect(newTestDiscovered).toBe(true)` | 否 |

**DoD**: Vitest 能发现并运行所有测试文件，退出码 0。

#### Story S2.3: 项目 fuzzy 搜索

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F2.3 | 项目搜索 UI | Dashboard 项目列表增加搜索输入框 | `expect(searchInput).toBeVisible()` | 【需页面集成 /dashboard】 |
| F2.3.1 | Fuzzy 搜索实现 | 输入关键词后过滤项目名称，debounce 300ms | `expect(filterTime).toBeLessThan(200)` | 【需页面集成 /dashboard】 |
| F2.3.2 | 空结果处理 | 无搜索结果时显示友好提示（非空白/崩溃）| `expect(emptyMessage).toContain('暂无')` | 【需页面集成 /dashboard】 |
| F2.3.3 | 搜索响应时间 | 关键词响应 < 2s（含渲染） | `expect(responseTime).toBeLessThan(2000)` | 【需页面集成 /dashboard】 |

**DoD**: Dashboard 项目列表支持 fuzzy 搜索，响应 < 2s。

---

### Epic 3: Canvas 操作体验（P1）

**目标**: Canvas Phase 导航清晰化，修复 TabBar 无障碍化后遗症。

#### Story S3.1: TabBar 无障碍后遗症修复

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F3.1 | TabBar 行为一致性 | 所有 tab 点击后 setPhase + setActiveTree 行为对称 | `expect(behaviorConsistent).toBe(true)` | 【需页面集成 /canvas】 |
| F3.1.1 | E2E 基线测试 | TabBar 切换 E2E 测试在修改前通过（基线）| `expect(e2eBaseline).toBe('passing')` | 【需页面集成 /canvas】 |
| F3.1.2 | Tab 点击响应 | 每个 tab 点击后 phase 状态正确更新 | `expect(phaseUpdate).toBeCorrect())` | 【需页面集成 /canvas】 |
| F3.1.3 | Mobile prototype tab | 移动端 prototype tab 与桌面端行为一致 | `expect(mobileBehavior).toEqual(desktopBehavior)` | 【需页面集成 /canvas】 |

**DoD**: TabBar 所有 tab 点击行为一致，E2E 测试通过。

#### Story S3.2: Phase 导航 active 状态

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F3.2 | Phase 进度指示 | 导航栏/工具栏高亮当前 Phase（active 状态）| `expect(activePhase).toBeHighlighted()` | 【需页面集成 /canvas】 |
| F3.2.1 | Active 高亮 | 当前 Phase tab 的视觉样式（背景/边框/颜色）与非 active 状态区分 | `expect(activeStyle).not.toEqual(inactiveStyle)` | 【需页面集成 /canvas】 |
| F3.2.2 | 刷新后保持 | 页面刷新后 active Phase 状态保持 | `expect(stateAfterRefresh).toEqual(stateBeforeRefresh)` | 【需页面集成 /canvas】 |
| F3.2.3 | Phase 切换动画 | Phase 切换有 200ms ease-out 过渡动画 | `expect(transitionDuration).toBe(200)` | 【需页面集成 /canvas】 |

**DoD**: Canvas Phase 导航清晰显示当前阶段，高亮 + 过渡动画完整。

---

### Epic 4: 错误体验统一（P1）

**目标**: 前后端 API 错误格式统一，前端展示人类可读错误提示。

#### Story S4.1: 后端 API 错误格式统一

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F4.1 | 统一错误格式 | 后端所有 API 错误响应格式为 `{ error: { code, message } }` | `expect(errorFormat).toMatch(/\{.*error.*code.*message.*\}/s)` | 否 |
| F4.1.1 | 错误码映射表 | HTTP 状态码 → 人类可读文字映射表 | `expect(mappingTable).toBeDefined()` | 否 |
| F4.1.2 | 所有路由覆盖 | 检查 61 个后端路由，错误响应格式统一 | `expect(allRoutesUseFormat).toBe(true)` | 否 |
| F4.1.3 | Zod schema 验证 | 错误响应通过 Zod schema 验证 | `expect(schemaValid).toBe(true)` | 否 |

**DoD**: 后端所有 API 错误响应符合统一格式 `{ error: { code, message } }`。

#### Story S4.2: 前端错误展示组件

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F4.2 | Toast 错误组件 | 全站使用统一的 `useToast` 组件展示错误 | `expect(toastComponent).toBeUsedGlobally()` | 【需页面集成 全站】 |
| F4.2.1 | 人类可读文字 | 错误消息通过映射表转为用户可理解文字 | `expect(displayMessage).not.toContain('401 Unauthorized')` | 【需页面集成 全站】 |
| F4.2.2 | 重试按钮 | 可恢复错误（如 5xx）显示重试按钮 | `expect(retryButton).toBeVisible()` | 【需页面集成 全站】 |
| F4.2.3 | Inline 错误样式 | Input 错误时显示红色边框 + 错误文字 | `expect(inlineError).toBeVisible()` | 【需页面集成 全站】 |

**DoD**: 全站错误提示样式统一，人类可读，包含重试按钮（可恢复错误）。

---

### Epic 5: AI 核心能力（P1）

**目标**: 实现需求智能补全，提升 AI 生成质量。

#### Story S5.1: AI 澄清卡片 UI 组件

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F5.1 | 澄清卡片组件 | 需求输入页显示 AI 澄清问题卡片 | `expect(clarificationCard).toBeVisible()` | 【需页面集成 /confirm】 |
| F5.1.1 | 卡片样式 | 卡片使用 DESIGN.md 玻璃态样式 | `expect(cardStyle).toContain('backdrop-filter')` | 【需页面集成 /confirm】 |
| F5.1.2 | 问题展示 | 每张卡片显示 1 个具体澄清问题 | `expect(cardContent).toBeSpecificQuestion())` | 【需页面集成 /confirm】 |
| F5.1.3 | 用户回答输入 | 每张卡片支持用户输入回答 | `expect(answerInput).toBeVisible()` | 【需页面集成 /confirm】 |
| F5.1.4 | 跳过功能 | 用户可选择跳过澄清继续生成 | `expect(skipButton).toBeVisible()` | 【需页面集成 /confirm】 |

**DoD**: 需求输入页显示 AI 澄清卡片，用户可回答或跳过。

#### Story S5.2: AI 追问 prompt 调优

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F5.2 | 追问 prompt 设计 | 设计 AI 追问 prompt，提取缺失关键信息 | `expect(prompt).toBeDefined()` | 否 |
| F5.2.1 | 最大轮次限制 | 追问最多 ≤ 3 轮，超出自动结束 | `expect(maxRounds).toBeLessThanOrEqual(3)` | 否 |
| F5.2.2 | 自动结束逻辑 | 连续 2 轮无新信息时自动结束追问 | `expect(autoEnd).toBe(true)` | 否 |
| F5.2.3 | 追问质量评估 | 经澄清后的需求，AI 生成评分 ≥ 4/5 | `expect(clarifiedQuality).toBeGreaterThanOrEqual(4)` | 【需页面集成 /confirm】 |

**DoD**: AI 追问最大 3 轮，有自动结束逻辑。

---

### Epic 6: 性能基线（P2）

**目标**: 建立 Bundle 体积监控，防止性能随迭代退化。

#### Story S6.1: Bundle 体积审计

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F6.1 | Bundle 审计工具 | 分析前后端 bundle，识别 > 200KB 的直接依赖 | `expect(auditTool).toRun()` | 否 |
| F6.1.1 | 体积报告 | 生成 bundle 体积报告，标注 top 10 依赖 | `expect(report).toBeGenerated()` | 否 |
| F6.1.2 | 目标依赖识别 | 识别 3+ 个 > 200KB 可动态导入的组件 | `expect(targetCount).toBeGreaterThanOrEqual(3)` | 否 |

**DoD**: Bundle 审计完成，目标依赖清单已确定。

#### Story S6.2: Dynamic import 改造

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F6.2 | Dynamic import | 对 3+ 个大组件（> 200KB）实施 `dynamic()` 动态导入 | `expect(dynamicImportCount).toBeGreaterThanOrEqual(3)` | 【需页面集成 全站】 |
| F6.2.1 | 功能验证 | 动态导入组件在需要时能正常渲染 | `expect(lazyComponent).toRenderCorrectly()` | 【需页面集成 全站】 |
| F6.2.2 | 首屏性能 | 使用 Lighthouse CI，LCP < 2.5s | `expect(lcp).toBeLessThan(2500)` | 否 |
| F6.2.3 | 回滚计划 | dynamic import 失败时有 fallback UI | `expect(fallback).toBeDefined()` | 【需页面集成 全站】 |

**DoD**: 3+ 大组件改为动态导入，首屏性能不劣化。

#### Story S6.3: Bundle size CI 阈值测试

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F6.3 | CI 阈值测试 | Bundle 增长超限（> 200KB）时 CI 自动 fail | `expect(ciFailOnGrowth).toBe(true)` | 否 |
| F6.3.1 | 阈值配置 | 在 `bundlesize` 或 `size-limit` 中配置阈值 | `expect(threshold).toBeDefined()` | 否 |
| F6.3.2 | CI 集成 | 阈值检查集成到 CI pipeline | `expect(ciIntegrated).toBe(true)` | 否 |
| F6.3.3 | 基线记录 | 当前 bundle 大小记录为基线，后续增长对比基线 | `expect(baseline).toBeRecorded()` | 否 |

**DoD**: Bundle size 增长 > 200KB 时 CI 自动 fail。

---

## 4. 验收标准汇总

| ID | Given | When | Then | 优先级 |
|----|-------|------|------|--------|
| AC1 | 访问 /auth | 页面加载 | 背景为深色，CSS 变量覆盖，无内联样式 | P0 |
| AC2 | 访问 /pagelist | 页面加载 | 背景为深色，与 /dashboard 风格一致 | P0 |
| AC3 | tsc --noEmit | 前后端分别运行 | 无错误输出，退出码 0 | P0 |
| AC4 | Vitest 运行 | 测试套件执行 | 退出码 0，所有测试通过 | P0 |
| AC5 | Dashboard 项目列表 | 输入关键词 | 2s 内过滤结果，无搜索结果显示友好提示 | P0 |
| AC6 | TabBar 点击 | 点击任意 tab | phase 状态正确更新，行为一致 | P1 |
| AC7 | Canvas Phase 切换 | 切换 Phase | active 高亮显示，刷新后状态保持 | P1 |
| AC8 | API 错误 | 后端返回错误 | 格式为 `{ error: { code, message } }` | P1 |
| AC9 | 错误展示 | 前端收到错误 | 显示人类可读文字，非 HTTP 技术描述 | P1 |
| AC10 | 需求输入 | 用户输入不完整需求 | AI 显示澄清卡片（≤ 3 条） | P1 |
| AC11 | AI 追问 | 连续 2 轮无新信息 | 自动结束追问 | P1 |
| AC12 | Bundle 增长 | CI 运行 | 增长 < 200KB，超限 CI fail | P2 |

---

## 5. DoD (Definition of Done)

### E1 完成标准

- [ ] `auth.module.css` 存在，替换所有内联样式
- [ ] `/auth` 页面无 `style={{` 内联样式
- [ ] `/auth` 使用 `--color-bg-primary`、玻璃态卡片、`--gradient-primary` 按钮
- [ ] `/pagelist` 背景为 `var(--color-bg-primary)`，无浅色元素
- [ ] 截图对比 `/auth` 与 `/canvas` 视觉一致

### E2 完成标准

- [ ] 前后端 `tsconfig.json` 无 `"next"` 插件引用
- [ ] `tsc --noEmit` 前后端退出码 0
- [ ] Vitest 能发现并运行所有测试文件
- [ ] 52+ 个现有测试全部通过
- [ ] Dashboard 搜索框 debounce 300ms，响应 < 2s

### E3 完成标准

- [ ] TabBar 所有 tab 点击行为一致（E2E 测试通过）
- [ ] 当前 Phase 高亮显示（active 样式区分）
- [ ] 刷新后 active Phase 保持
- [ ] Phase 切换有过渡动画（200ms ease-out）

### E4 完成标准

- [ ] 后端所有路由错误响应格式统一
- [ ] 错误码映射表存在并被前端使用
- [ ] 前端错误展示使用统一 Toast 组件
- [ ] 5xx 错误显示重试按钮
- [ ] Inline 错误使用红色边框 + 错误文字样式

### E5 完成标准

- [ ] AI 澄清卡片组件存在且可渲染
- [ ] 追问最大轮次 ≤ 3
- [ ] 连续 2 轮无新信息自动结束
- [ ] 用户可跳过澄清继续生成

### E6 完成标准

- [ ] Bundle 审计报告生成
- [ ] 3+ 大组件改为 `dynamic()` 导入
- [ ] 首屏性能（LCP）不劣化
- [ ] CI 阈值测试配置完成，Bundle 增长超限 CI fail

### Sprint 整体 DoD

- [ ] 所有 6 个 Epic DoD 达成
- [ ] 所有 12 条验收标准通过
- [ ] `vibex-app.pages.dev` 部署验证通过
- [ ] CHANGELOG.md 更新所有 Epic 完成记录
- [ ] Sprint 完成率 ≥ 85%

---

## 6. Sprint 执行顺序

| Day | 内容 | Epic | 说明 |
|-----|------|------|------|
| Day 1 | Core UX 基础 | E2（S2.1 + S2.2）| CI 门禁优先，是所有任务前提 |
| Day 2 | Brand Consistency | E1（S1.1 + S1.2）| 门面问题，用户感知最强 |
| Day 2-3 | Error Experience | E4（S4.1 + S4.2）| 前后端并行 |
| Day 3-4 | Canvas Health | E3（S3.1 + S3.2）| 需要 E2 基线测试前置 |
| Day 4-5 | AI Core Value | E5（S5.1 + S5.2）| 需要 PM prompt 配合 |
| Day 5-6 | Performance Base | E6（S6.1 + S6.2 + S6.3）| 最后执行，有充足 buffer |
| Day 7 | Sprint 回顾 + 部署 | 全部 | |

---

## 7. 规格文件（Specs）

详细规格见 `specs/` 目录：

| 文件 | 内容 |
|------|------|
| `specs/E1-auth-style-guide.md` | Auth 页面 CSS Module 迁移详细规格 |
| `specs/E2-search-spec.md` | Dashboard fuzzy 搜索详细规格 |
| `specs/E3-canvas-nav-spec.md` | Canvas Phase 导航 + TabBar 修复规格 |
| `specs/E4-error-format.md` | API 错误格式 + 前端展示规格 |
| `specs/E5-ai-clarification.md` | AI 澄清卡片 + prompt 设计规格 |
| `specs/E6-bundle-audit.md` | Bundle 审计 + dynamic import 规格 |

---

*PRD Version: 1.0*
*Created by: PM Agent*
*Last Updated: 2026-04-14*
