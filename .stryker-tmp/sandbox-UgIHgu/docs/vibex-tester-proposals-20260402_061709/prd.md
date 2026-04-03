# VibeX 测试改进 PRD

**文档版本**: v1.0  
**编写日期**: 2026-04-02  
**编写角色**: PM  
**分析来源**: vibex-tester-proposals-20260402_061709/analysis.md  
**方案**: 方案 A — 渐进式测试完善（推荐）  
**总工时估算**: 6-9 人天

---

## 1. 执行摘要

### 背景

VibeX 当前处于功能快速迭代期，但测试体系严重滞后，存在以下核心问题：

- **测试与实现不同步**：代码重构后测试用例未同步更新，导致测试失去参考价值
- **vitest 导入路径失败**：`@/lib/canvas/canvasStore` 路径别名解析失败，npm test 无法通过
- **npm test 超时**：完整测试套件运行 >120s，开发者等待成本高，CI 反馈周期长
- **E2E 几乎无覆盖**：Canvas 三棵树联动（ContextTree / FlowTree / ComponentTree）的核心交互无 Playwright 测试
- **视觉回归无**：样式变更依赖人工检查，无法自动化发现 UI 退化
- **用户旅程无**：全流程端到端（创建项目 → 生成组件 → 导出代码）无验证

### 目标

建立可持续的渐进式测试体系，分三个阶段修复阻塞问题 → 建立 E2E 基础 → 完善视觉回归与用户旅程验证。

### 成功指标

| 指标 | 当前值 | 目标值 |
|-----|-------|-------|
| npm test 运行时间 | >120s | <60s（单元），<120s（全量） |
| vitest 导入路径错误 | 有 | 0 个错误 |
| Canvas 核心交互 E2E 覆盖率 | 0% | ≥80% |
| E2E 测试稳定率（flaky rate） | N/A | <5% |
| 视觉回归基线覆盖 | 0 个页面 | 关键页面（Canvas 首页、设计系统组件） |
| 测试与实现同步率 | 0% | 100%（DoD 强制约束） |
| 单元测试通过率 | <100% | 100% |

---

## 2. Epic / Story 分解

### Epic 1 — 修复测试阻塞问题（Phase 1）

> **目标**: 解决当前 npm test 失败、导入路径错误、测试与实现不同步等阻塞问题  
> **工时**: 1-2 人天  
> **负责人**: dev + tester 协作

| ID | Story | 工时 | 验收标准（expect 断言） | 页面集成 |
|----|-------|------|----------------------|---------|
| S1.1 | 修复 vitest 路径别名 | 0.5d | `expect(vitestConfig.resolve.alias['@']).toBeDefined()` | ❌ |
| S1.2 | 修复 canvas-checkbox-style-unify 测试文件（E1/E2 缺失用例） | 0.5d | `expect(screen.queryAllByRole('checkbox')).toHaveLength(1)` <br> `expect(container.querySelector('.checkbox')).toBeInTheDocument()` | ✅ Canvas |
| S1.3 | 明确 DoD 测试准备要求 | 0.25d | AGENTS.md 中测试准备为 DoD 必选项 | ❌ |
| S1.4 | 优化 npm test 速度（分离快慢套件） | 0.5d | `expect(exec('npm test').duration).toBeLessThan(60000)` | ❌ |

---

### Epic 2 — 建立 Playwright E2E 基础（Phase 2）

> **目标**: 配置 Playwright 并覆盖 Canvas 核心交互场景  
> **工时**: 2-3 人天  
> **负责人**: tester + dev 协作

| ID | Story | 工时 | 验收标准（expect 断言） | 页面集成 |
|----|-------|------|----------------------|---------|
| S2.1 | 配置 Playwright（chromium only） | 0.5d | `expect(playwright.config.browsers).toContain('chromium')` <br> `expect(exec('npx playwright install chromium').exitCode).toBe(0)` | ❌ |
| S2.2 | E2E — 验证 Canvas 三棵树加载 | 0.25d | `await expect(page.locator('.context-tree')).toBeVisible()` <br> `await expect(page.locator('.flow-tree')).toBeVisible()` <br> `await expect(page.locator('.component-tree')).toBeVisible()` | ✅ Canvas |
| S2.3 | E2E — 验证节点选择（单选 checkbox） | 0.25d | `await expect(page.locator('.checkbox')).toHaveCount(1)` <br> `await page.click('.node-item')` <br> `await expect(page.locator('.checkbox.checked')).toHaveCount(1)` | ✅ Canvas |
| S2.4 | E2E — 验证节点确认反馈（isActive 状态变化） | 0.25d | `await page.click('.confirm-btn')` <br> `await expect(page.locator('.node-item.active')).toHaveClass(/isActive/)` | ✅ Canvas |
| S2.5 | E2E — 验证样式变更（黄色边框移除） | 0.25d | `await page.click('.style-change-btn')` <br> `await expect(page.locator('.node-item')).not.toHaveClass(/yellow-border/)` | ✅ Canvas |
| S2.6 | 集成 Playwright E2E 到 CI | 0.5d | `expect(githubActionsWorkflow.steps).toContainEqual(expect.objectContaining({ run: expect.stringContaining('playwright test') }))` | ❌ |
| S2.7 | 重构 canvasStore mock（Zustand fixture） | 1d | `expect(useCanvasStore.getState().nodes).toEqual([])` <br> `expect(useCanvasStore.setState({ nodes: [mockNode] })).toBeDefined()` | ❌ |

---

### Epic 3 — 视觉回归 + 用户旅程（Phase 3）

> **目标**: 引入视觉回归测试和端到端用户旅程验证  
> **工时**: 3-4 人天  
> **负责人**: tester

| ID | Story | 工时 | 验收标准（expect 断言） | 页面集成 |
|----|-------|------|----------------------|---------|
| S3.1 | 引入 pixelmatch 截图对比 | 1d | `expect(diffPixels / totalPixels).toBeLessThan(0.01)`（差异 <1%） | ✅ Canvas |
| S3.2 | 建立视觉回归 baseline 管理机制 | 0.5d | `expect(fs.existsSync('tests/visual-baselines/')).toBe(true)` <br> `expect(fs.existsSync('tests/visual-baselines/canvas-homepage.png')).toBe(true)` | ❌ |
| S3.3 | E2E — 用户旅程：创建项目 → 添加限界上下文 | 0.5d | `await page.click('[data-testid="new-project-btn"]')` <br> `await expect(page.locator('.project-created')).toBeVisible()` <br> `await page.click('[data-testid="add-context-btn"]')` <br> `await expect(page.locator('.bounded-context')).toHaveCount(1)` | ✅ Canvas |
| S3.4 | E2E — 用户旅程：生成组件树 → 导出代码 | 1d | `await page.click('[data-testid="generate-btn"]')` <br> `await expect(page.locator('.component-tree .node')).toHaveCount(gt(0))` <br> `await page.click('[data-testid="export-btn"]')` <br> `await expect(page.locator('.export-success')).toBeVisible()` | ✅ Canvas |
| S3.5 | 补充组件状态命名规范 + TS strict | 0.5d | `expect(tsConfig.compilerOptions.strict).toBe(true)` <br> `expect(lintRules['@typescript-eslint/no-unnecessary-condition']).toBe('error')` | ❌ |
| S3.6 | 建立 commit message lint 规则 | 0.25d | `expect(commitLintConfig.rules['body-case']).toEqual([2, 'always', 'sentence-case'])` | ❌ |

---

## 3. 验收标准

### Phase 1 — 修复测试阻塞问题

| # | 验收条件 | 验证方式 |
|---|---------|---------|
| AC1.1 | npm test 在 <60s 内完成（优化前 >120s） | CI 日志时间戳差值 |
| AC1.2 | vitest 无 "Cannot find package '@/lib/canvas/canvasStore'" 错误 | `npm test` 退出码为 0 |
| AC1.3 | BoundedContextTree.test.tsx 包含 E1 测试用例（验证 1 个 checkbox） | `expect(screen.queryAllByRole('checkbox')).toHaveLength(1)` 通过 |
| AC1.4 | ComponentTree.test.tsx 包含 E2 checkbox 位置验证 | 组件树 checkbox 数量断言通过 |
| AC1.5 | AGENTS.md 中明确测试准备为 DoD 的一部分 | AGENTS.md 包含 "测试准备" 在 DoD 列表中 |

### Phase 2 — 建立 Playwright E2E 基础

| # | 验收条件 | 验证方式 |
|---|---------|---------|
| AC2.1 | Playwright 配置完成，chromium 稳定运行 | `npx playwright test` 在 CI 中通过 |
| AC2.2 | T1: 打开 Canvas，验证三棵树加载 | 三棵树元素均可见 |
| AC2.3 | T2: 选择节点，验证 checkbox 显示正确（1 个） | checkbox 数量为 1 |
| AC2.4 | T3: 确认节点，验证 isActive 状态变化 | active 节点 class 包含 isActive |
| AC2.5 | T4: 样式变更，验证黄色边框移除 | 节点不再包含 yellow-border class |
| AC2.6 | CI 中 Playwright 测试通过（flaky < 5%） | CI 重复运行 10 次统计 |
| AC2.7 | canvasStore mock 重构完成，所有单元测试通过 | `npm test` 退出码为 0 |

### Phase 3 — 视觉回归 + 用户旅程

| # | 验收条件 | 验证方式 |
|---|---------|---------|
| AC3.1 | 关键页面有 baseline 截图（Canvas 首页、设计系统组件） | `tests/visual-baselines/` 目录包含对应 PNG |
| AC3.2 | CI 中自动对比，差异 >1% 触发告警 | pixelmatch diff ratio < 0.01 |
| AC3.3 | 用户旅程测试：创建项目 → 添加限界上下文 → 生成组件树 → 导出代码 | 全流程无 JS 错误，组件树节点数正确 |
| AC3.4 | TypeScript strict 模式开启，无组件状态命名不一致警告 | `npx tsc --strict` 退出码为 0 |
| AC3.5 | Commit message lint 规则生效（符合 conventional commits） | `commitlint --from HEAD~1 --to HEAD` 通过 |

---

## 4. DoD（Definition of Done）

### 4.1 功能点详细清单

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|-------|------|---------|---------|
| F1 | vitest 路径别名修复 | 修复 `@/lib/canvas/canvasStore` 导入路径解析失败 | `expect(vitestConfig.resolve.alias['@']).toBeDefined()` 且 `npm test` 通过 | ❌ |
| F2 | BoundedContextTree E1 测试 | 验证单个 checkbox 渲染（无重复） | `expect(screen.queryAllByRole('checkbox')).toHaveLength(1)` | ✅ Canvas |
| F3 | ComponentTree E2 测试 | 验证 checkbox 位置在节点内（非标题后） | `expect(container.querySelector('.checkbox')).toBeInTheDocument()` | ✅ Canvas |
| F4 | DoD 测试准备明确 | AGENTS.md 中规定测试准备为 DoD 必选项 | PR checklist 包含测试相关项 | ❌ |
| F5 | npm test 快慢套件分离 | 将 >120s 测试拆分为快套件（<60s）和慢套件（E2E） | `npm run test:unit` <60s，`npm test` <120s | ❌ |
| F6 | Playwright chromium 配置 | 仅使用 chromium 浏览器，避免 macOS 不稳定 | `playwright.config.ts browsers: ['chromium']` | ❌ |
| F7 | E2E: 三棵树加载验证 | 验证 ContextTree / FlowTree / ComponentTree 均正常渲染 | 三者 `isVisible()` 断言均通过 | ✅ Canvas |
| F8 | E2E: 节点单选验证 | 验证同一时间只有一个 checkbox 被选中 | `toHaveCount(1)` 断言 | ✅ Canvas |
| F9 | E2E: 节点确认 isActive 状态 | 确认操作后节点 isActive class 正确切换 | `toHaveClass(/isActive/)` 断言 | ✅ Canvas |
| F10 | E2E: 样式变更验证 | 样式变更后黄色边框正确移除 | `not.toHaveClass(/yellow-border/)` 断言 | ✅ Canvas |
| F11 | Playwright CI 集成 | GitHub Actions 中运行 Playwright E2E | `playwright test` 在 CI 中通过 | ❌ |
| F12 | canvasStore Zustand mock 重构 | 将过重的 mock 改为 Zustand fixture store | 所有单元测试通过 | ❌ |
| F13 | pixelmatch 视觉回归 | 关键页面截图对比，差异 >1% 告警 | `diffPixels/totalPixels < 0.01` | ✅ Canvas |
| F14 | 视觉 baseline 管理 | 建立 `tests/visual-baselines/` 目录管理快照 | 目录存在且包含关键页面基线 | ❌ |
| F15 | 用户旅程：创建项目 | 从首页到创建新项目全流程 | 项目创建成功且 URL 正确 | ✅ Canvas |
| F16 | 用户旅程：添加限界上下文 | 在项目中添加一个 bounded context | 组件数量为 1 | ✅ Canvas |
| F17 | 用户旅程：生成组件树 | 触发组件树生成并验证节点存在 | 节点数 >0 | ✅ Canvas |
| F18 | 用户旅程：导出代码 | 触发代码导出并验证导出成功 | `.export-success` 元素可见 | ✅ Canvas |
| F19 | TS strict 模式 | 开启 TypeScript strict，修复组件状态命名 | `npx tsc --strict` 通过 | ❌ |
| F20 | Commit message lint | 强制 conventional commits 格式 | `commitlint` 通过 | ❌ |

### 4.2 页面集成清单

以下功能点【需页面集成】（在 Canvas 页面或相关 UI 中验证）：

| ID | 功能点 | 集成页面 |
|----|-------|---------|
| F2 | BoundedContextTree E1 测试 | Canvas / ContextTree 面板 |
| F3 | ComponentTree E2 测试 | Canvas / ComponentTree 面板 |
| F7 | E2E: 三棵树加载验证 | Canvas 首页 |
| F8 | E2E: 节点单选验证 | Canvas / 节点交互 |
| F9 | E2E: 节点确认 isActive 状态 | Canvas / 节点交互 |
| F10 | E2E: 样式变更验证 | Canvas / 样式面板 |
| F13 | pixelmatch 视觉回归 | Canvas 首页、设计系统组件 |
| F15 | 用户旅程：创建项目 | Canvas 首页 |
| F16 | 用户旅程：添加限界上下文 | Canvas / Context 编辑面板 |
| F17 | 用户旅程：生成组件树 | Canvas / ComponentTree 面板 |
| F18 | 用户旅程：导出代码 | Canvas / 导出面板 |

---

## 5. 工时汇总

| Epic | Story | 工时 | 负责角色 |
|------|-------|------|---------|
| Epic 1 | S1.1–S1.4 | 1.75d | dev + tester |
| Epic 2 | S2.1–S2.7 | 3d | tester + dev |
| Epic 3 | S3.1–S3.6 | 3.75d | tester |
| **合计** | **20 个功能点** | **8.5 人天**（范围 6-9 人天） | |

---

## 6. 风险缓解

| 风险 | 等级 | 缓解措施 |
|-----|------|---------|
| Playwright CI 不稳定 | 🟡 中 | 统一 chromium，禁止 @firefox/@webkit |
| canvasStore mock 重构破坏现有测试 | 🔴 高 | 渐进式迁移，先建 fixture 库 |
| 测试与实现持续不同步 | 🟡 中 | 纳入 DoD + PR checklist |
| npm test 速度未改善 | 🟡 中 | 分离快慢套件，CI 并行执行 |
| 视觉回归误报率高 | 🟡 中 | pixelmatch threshold=0.01，仅关键页面对比 |
| tester 人力不足 | 🟠 中高 | 优先 Phase 1，Phase 2-3 与 dev 协作 |

---

## 7. 技术规格

| 维度 | 技术选型 |
|-----|---------|
| 单元测试框架 | Vitest（已有） |
| E2E 测试框架 | Playwright（已有基础配置） |
| 视觉对比引擎 | pixelmatch |
| Mock 方案 | Zustand mock store fixture |
| CI | GitHub Actions |
| Baseline 管理 | `tests/visual-baselines/` + git lfs |
| TS 严格模式 | TypeScript strict + @typescript-eslint |
| Commit lint | commitlint + conventional commits |

---

*PRD 完成。产出物：vibex-tester-proposals-20260402_061709/prd.md*
