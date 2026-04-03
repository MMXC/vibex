# VibeX 测试改进提案分析

**文档版本**: v1.0
**分析日期**: 2026-04-02
**分析角色**: Analyst
**提案来源**: tester-proposals.md
**产出路径**: docs/vibex-tester-proposals-20260402_061709/analysis.md

---

## 1. 业务场景分析

### 1.1 VibeX 目标用户

| 用户类型 | 描述 | 核心诉求 |
|---------|------|---------|
| 产品设计师 | 需要快速生成 UI 原型的设计师 | 无需写代码即可完成高保真原型 |
| 前端开发者 | 使用 VibeX 验证和实现设计稿的开发者 | 组件代码准确、流程可追溯 |
| AI/ML 工程师 | 构建和优化 AI 原型生成能力的工程师 | 系统可测试、可观测 |

**目标用户画像**: 有设计sense但不想手写UI代码的产品人，或需要快速验证AI生成效果的开发者。

### 1.2 VibeX 核心价值

- **AI 驱动**: 将自然语言需求转化为结构化组件树
- **流程闭环**: 需求 → 限界上下文 → 领域模型 → 流程图 → 组件树
- **Canvas 可视化**: 三棵树（ContextTree / FlowTree / ComponentTree）在 Canvas 上实时联动
- **代码生成**: 从组件树生成可运行的 React 代码

### 1.3 当前测试现状

| 测试层级 | 覆盖情况 | 主要问题 |
|---------|---------|---------|
| 单元测试（组件） | ✅ 已有基础覆盖 | 测试与实现不同步；mock 过重（canvasStore） |
| 集成测试 | ⚠️ 部分覆盖 | npm test >120s，环境不稳定 |
| E2E 测试 | ❌ 几乎无覆盖 | 无 Playwright 用例覆盖核心 Canvas 交互 |
| 视觉回归测试 | ❌ 无 | 样式变更无自动化截图对比 |
| 用户旅程测试 | ❌ 无 | 全流程端到端无验证 |

---

## 2. 核心 JTBD（Jobs To Be Done）

### JTBD-1: 验证 Canvas 三棵树联动的正确性
**角色**: 开发者 / AI 系统
**触发**: 用户操作后，需要确保 ContextTree / FlowTree / ComponentTree 状态一致
**期望**: 三棵树状态始终同步，任意一棵树变更不影响其他树的数据完整性

### JTBD-2: 保障组件代码变更不破坏已有功能
**角色**: 开发者
**触发**: 每次提交代码前，需要验证核心功能未退化
**期望**: 单元测试快速反馈（<10s），CI 自动拦截失败的测试

### JTBD-3: E2E 验证核心用户操作路径
**角色**: 开发者 / QA
**触发**: 新功能上线前，需要端到端验证用户操作路径
**期望**: Playwright 覆盖主要用户旅程（创建项目 → 添加上下文 → 生成组件 → 预览）

### JTBD-4: 快速识别视觉/样式回归
**角色**: 开发者 / 设计师
**触发**: 样式变更后，需要确认 UI 符合设计规范
**期望**: CI 自动截图对比，发现视觉差异立即告警

### JTBD-5: 测试文件与代码实现同步演进
**角色**: 开发者 / tester
**触发**: 代码重构或功能迭代时
**期望**: 测试准备纳入 DoD，测试文件与实现代码同步更新

---

## 3. 技术方案选项

### 方案 A: 渐进式测试完善（推荐）

**策略**: 不追求一步到位，而是分优先级逐层完善测试覆盖。

**Phase 1 — 修复当前阻塞问题**（1-2 天）

| 行动项 | 工作量 | 优先级 |
|-------|-------|-------|
| 修复 vitest 导入路径问题（`@/lib/canvas/canvasStore`） | 0.5 天 | P0 |
| 修复 canvas-checkbox-style-unify 测试文件（E1/E2 缺失用例） | 0.5 天 | P0 |
| 统一 AGENTS.md 测试责任归属（DoD 中明确测试准备） | 0.25 天 | P1 |
| 优化 npm test 速度（分离快慢测试套件） | 0.5 天 | P1 |

**Phase 2 — 建立 Playwright E2E 基础**（2-3 天）

| 行动项 | 工作量 | 优先级 |
|-------|-------|-------|
| 配置 Playwright（chromium only，避免 macOS browser 不稳定） | 0.5 天 | P1 |
| 编写 Canvas 核心交互 E2E（节点选择、确认反馈、样式变化） | 1 天 | P1 |
| 集成 E2E 到 CI（GitHub Actions + `playwright-canvas-crash-test.config.cjs`） | 0.5 天 | P1 |
| 修复 canvasStore mock 脆弱性问题（改为 Zustand mock store） | 1 天 | P2 |

**Phase 3 — 视觉回归 + 用户旅程**（3-4 天）

| 行动项 | 工作量 | 优先级 |
|-------|-------|-------|
| 引入 pixelmatch 截图对比（`playwright screenshot` + diff） | 1 天 | P2 |
| 编写用户旅程测试（创建项目 → 生成 → 导出） | 1.5 天 | P2 |
| 建立 Playwright baseline 截图管理（快照更新机制） | 0.5 天 | P2 |
| 补充组件状态命名规范（TypeScript strict + lint 规则） | 0.5 天 | P2 |

**总工时**: 约 6-9 人天

**优点**:
- 风险可控，每阶段可验证交付
- 先修阻塞问题，开发者体验优先
- E2E 覆盖核心场景，不贪多

**缺点**:
- 耗时较长（约 2 周）
- 需要 tester 持续参与

---

### 方案 B: 激进式测试体系建设

**策略**: 一次性建立完整的测试金字塔。

| 行动项 | 工作量 | 优先级 |
|-------|-------|-------|
| 升级测试框架（Jest → Vitest，路径别名统一） | 1 天 | P0 |
| 重构所有 canvasStore mock（改为 fixture + Zustand mock） | 2 天 | P1 |
| 一次性编写全部 E2E 测试（20+ 测试用例） | 3 天 | P1 |
| 集成 Playwright + 视觉回归到 CI | 1.5 天 | P1 |
| 一次性修复所有测试-实现不同步问题 | 1 天 | P1 |
| 建立测试文档站（所有测试用例 + 覆盖报告） | 1 天 | P2 |

**总工时**: 约 9.5 人天

**优点**:
- 测试体系一步到位
- CI 完整性高

**缺点**:
- 前期投入大，dev 体验受影响
- 高风险：重构 mock 可能引入新问题
- tester 介入成本高（需密集参与）

---

### 方案对比

| 维度 | 方案 A（渐进式） | 方案 B（激进式） |
|-----|----------------|----------------|
| 总工时 | 6-9 人天 | ~10 人天 |
| 风险等级 | 🟡 中 | 🔴 高 |
| 开发者体验 | 🟢 好（分阶段，阻塞先修） | 🟡 中（前期重构影响开发节奏） |
| 交付速度 | 🟡 中（需 2 周，但每阶段有产出） | 🟢 快（集中开发，1 周完成） |
| 可持续性 | 🟢 好（流程改进配套） | 🟡 中（技术改进优先） |
| 推荐场景 | 持续迭代中的项目 | 稳定期集中建设 |

---

## 4. 可行性评估

### 4.1 技术可行性

| 维度 | 评估 | 说明 |
|-----|------|------|
| Playwright E2E | ✅ 可行 | 项目已有 `playwright-canvas-crash-test.config.cjs`，基础配置存在 |
| Vitest 路径别名 | ✅ 可行 | 只需修复 `vitest.config.ts` 中的 alias 配置 |
| 视觉回归 | ✅ 可行 | Playwright 内置 `screenshot` + pixelmatch 库即可 |
| Zustand mock | ✅ 可行 | Vitest 支持直接 mock Zustand store |
| CI 集成 | ✅ 可行 | GitHub Actions + `playwright test` 命令 |

### 4.2 资源可行性

| 资源 | 需求 | 当前状态 |
|-----|------|---------|
| Tester 参与 | 1 人，6-9 人天 | 需要 coord 确认 tester 时间投入 |
| Dev 支持 | 约 2 人天配合（mock 重构） | 可在 Phase 1 同步进行 |
| CI 资源 | GitHub Actions（免费额度足够） | 已有配置，无额外成本 |
| Playwright browsers | `npx playwright install chromium` | 仅安装 chromium，避免 macOS 不稳定问题 |

### 4.3 流程可行性

| 维度 | 评估 |
|-----|------|
| 将测试纳入 DoD | ✅ 可行（需在 AGENTS.md 中明确，coord 授权即可） |
| Tester 提前介入 | ✅ 可行（tester 参与 design review 阶段，需修改流程） |
| 测试-实现同步机制 | ⚠️ 需建立规范（建议用 PR checklist） |

---

## 5. 风险识别

| # | 风险 | 等级 | 缓解措施 |
|---|-----|------|---------|
| R1 | Playwright 测试在 CI 中不稳定（浏览器差异） | 🟡 中 | 统一使用 `chromium`，禁止使用 `@firefox` / `@webkit` |
| R2 | canvasStore mock 重构破坏现有测试 | 🔴 高 | 先建立 fixture 库，渐进式迁移（方案 A 分 2 步） |
| R3 | 测试用例与实现持续不同步 | 🟡 中 | 纳入 DoD + PR checklist + reviewer 强制检查 |
| R4 | npm test 速度未改善（>120s） | 🟡 中 | 分离快慢测试，CI 并行执行 |
| R5 | 视觉回归误报率高（UI 随机变化） | 🟡 中 | 使用 `pixelmatch` 设置合理的 `threshold`，关键页面才做视觉对比 |
| R6 | tester 人力不足，无法完成所有阶段 | 🟠 中高 | 优先完成 Phase 1（阻塞修复），Phase 2-3 可与 dev 协作 |
| R7 | 视觉回归基准截图管理混乱 | 🟢 低 | 建立 `tests/visual-baselines/` 目录，用 git lfs 管理大文件 |

---

## 6. 验收标准（具体可测试）

### 6.1 Phase 1 验收（阻塞修复）

```
✅ npm test 在 <60s 内完成（优化前 >120s）
✅ vitest 无 "Cannot find package '@/lib/canvas/canvasStore'" 错误
✅ BoundedContextTree.test.tsx 包含 E1 测试用例（验证 1 个 checkbox）
✅ ComponentTree.test.tsx 包含 E2 checkbox 位置验证
✅ AGENTS.md 中明确测试准备为 DoD 的一部分
```

### 6.2 Phase 2 验收（E2E 基础）

```
✅ Playwright 配置完成，chromium 稳定运行
✅ E2E 测试覆盖：
   - T1: 打开 Canvas，验证三棵树加载
   - T2: 选择节点，验证 checkbox 显示正确（1 个）
   - T3: 确认节点，验证 isActive 状态变化
   - T4: 样式变更，验证黄色边框移除
✅ CI 中 Playwright 测试通过（flaky < 5%）
✅ canvasStore mock 重构完成，所有单元测试通过
```

### 6.3 Phase 3 验收（视觉回归 + 旅程）

```
✅ 视觉回归测试：
   - 关键页面（Canvas 首页、设计系统组件）有 baseline 截图
   - CI 中自动对比，差异 >1% 触发告警
✅ 用户旅程测试通过：
   - 场景：创建项目 → 添加限界上下文 → 生成组件树 → 导出代码
   - 验证：所有步骤无 JS 错误，组件树节点数量正确
✅ TypeScript strict 模式开启，无组件状态命名不一致警告
✅ commit message lint 规则生效（全部小写或符合 conventional commits）
```

### 6.4 覆盖率指标

| 指标 | 目标值 | 测量方式 |
|-----|-------|---------|
| Canvas 核心交互 E2E 覆盖率 | ≥ 80% | Playwright 测试用例数 / 核心交互场景数 |
| 单元测试通过率 | 100% | `npm test` 退出码 |
| E2E 测试稳定率（flaky rate） | < 5% | CI 重复运行 10 次统计 |
| 测试与实现同步率 | 100% | PR checklist 记录 |
| npm test 运行时间 | < 60s（单元），< 120s（全量） | CI 日志时间戳差值 |

---

## 7. 建议行动项（优先级排序）

| 优先级 | 行动项 | 负责角色 | 预计工时 |
|-------|-------|---------|---------|
| P0 | 修复 vitest 导入路径别名 | dev | 0.5 天 |
| P0 | 修复 canvas-checkbox-style-unify 测试文件（E1/E2） | tester + dev | 0.5 天 |
| P1 | 将测试准备纳入 DoD + PR checklist | coord + dev | 0.25 天 |
| P1 | 优化 npm test 速度（分离快慢套件） | dev | 0.5 天 |
| P1 | 配置 Playwright E2E + 4 个核心交互测试 | tester | 1.5 天 |
| P1 | 重构 canvasStore mock（Zustand fixture） | dev | 1 天 |
| P2 | 集成 Playwright 到 CI | dev + tester | 0.5 天 |
| P2 | 引入视觉回归测试 | tester | 1 天 |
| P2 | 编写用户旅程测试 | tester | 1.5 天 |
| P3 | 建立组件状态命名规范 + TS strict | dev | 0.5 天 |
| P3 | 建立 commit message lint 规则 | dev | 0.25 天 |

---

## 8. 附录：Tester 提案要点摘要

| # | 问题 | 来源 | 对应行动 |
|---|-----|------|---------|
| T1 | 测试用例与代码实现不同步 | §1.1 | 纳入 DoD + PR checklist |
| T2 | vitest 导入路径解析失败 | §1.2 | 修复 vitest.config.ts alias |
| T3 | npm test >120s | §1.2 | 分离快慢测试套件 |
| T4 | 组件状态命名不一致（status vs isActive） | §2.1 | TypeScript strict + 规范文档 |
| T5 | E2E 测试缺失 | §3.1 | Playwright E2E 建设（Phase 2） |
| T6 | 视觉回归测试缺失 | §3.2 | pixelmatch + CI 截图对比 |
| T7 | 测试用例描述不具体 | §4.1 | 改为可执行断言描述 |
| T8 | Implementation Plan 缺测试步骤 | §4.2 | 补充测试验证命令 |
| T9 | Tester 介入太晚 | §5.1 | tester 参与 design review 阶段 |
| T10 | Commit message 大小写混用 | §2.2 | lint 规则强制检查 |

---

*分析完成。产出物：vibex-tester-proposals-20260402_061709/analysis.md*
