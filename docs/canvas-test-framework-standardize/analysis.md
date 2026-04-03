# Analysis: canvas-test-framework-standardize

**任务**: 测试框架标准化
**角色**: Analyst（需求分析师）
**日期**: 2026-04-03 03:59 GMT+8
**工作目录**: /root/.openclaw/vibex
**产出物**: `/root/.openclaw/vibex/docs/canvas-test-framework-standardize/analysis.md`

---

## 1. 业务场景分析

### 1.1 问题背景

VibeX 前端项目当前采用 Jest（单元/集成测试）+ Playwright（E2E 测试）双框架并行，测试基础设施存在系统性缺陷，导致 CI 质量护栏失守。

### 1.2 核心痛点

| # | 痛点类型 | 具体描述 | 影响 |
|---|---------|---------|------|
| **P1** | 规范边界模糊 | Jest 和 Playwright 测试范围没有明确划分，出现重复测试（如 `basic.spec.ts` 在根目录和 `tests/e2e/` 各有一份），以及 Playwright 测试被当作单元测试使用 | 维护成本高，职责不清 |
| **P2** | CI Gate 不完善 | 现有 CI 仅包含 lint/type-check/RCA 脚本，无测试通过率强制 gate；E2E `retries: 1` 无法吸收 flaky 测试；Slack 无自动告警机制 | 失败传播到生产，响应滞后 4-8h |
| **P3** | 测试覆盖率低 | 整体行覆盖率 52.76%，分支覆盖率仅 33.75%，核心 canvas 模块分支覆盖 16-30% | Regression 风险高 |
| **P4** | 配置文件碎片化 | 存在 7 个 Playwright 配置文件（`playwright.config.ts`、`playwright.test.config.ts`、`playwright.ci.config.ts`、`playwright.a11y.config.ts`、`playwright-canvas-phase2.config.ts`、`playwright-canvas-crash-test.config.cjs`、`playwright.perf.config.ts`），部分配置重复、用途不清 | 开发者困惑，CI 难以选型 |
| **P5** | 命名不一致 | 测试文件命名混杂 `.spec.ts`、`.test.ts`、`*.spec.ts` 多种格式，Jest 配置中 `testPathIgnorePatterns` 依赖排除路径而非命名规范 | 代码风格不统一 |

### 1.3 数据支撑

- **E2E 测试文件**: 69 个（碎片化严重）
- **单元测试文件**: 7 个（覆盖率不足）
- **整体覆盖率**: 行 52.76% / 分支 33.75% / 函数 76.36%
- **Canvas 模块覆盖率**: 分支 16-63%（部分低至 16%）
- **Playwright 配置数量**: 7 个（正常项目 1-2 个）
- **CI 测试策略**: 仅 lint + type check，无测试 gate

---

## 2. 核心 JTBD（Jobs-To-Be-Done）

### JTBD 1: 建立测试边界规范

**用户**: dev、tester
**目标**: 明确 Jest（单元+集成）与 Playwright（E2E）的职责边界，消除重复测试
**信号**: `basic.spec.ts` 重复文件存在；`tests/basic.spec.ts` 和 `tests/e2e/basic.spec.ts` 功能重叠；`tests/performance/` 混用 `.spec.ts` 格式
**验收**: 配置文件从 7 个合并至 ≤3 个；无重复测试文件；目录结构符合规范

### JTBD 2: 修复 CI 质量门禁

**用户**: 所有开发者、PM
**目标**: 建立覆盖率阈值 gate、测试通过率 gate、Slack 失败告警，消除"CI 变绿但生产故障"
**信号**: 现有 CI 无测试 gate；历史 PR 合并后发现 regression 需 4-8h 才能感知；`rca-check.yml` 仅跑 RCA 脚本，无测试验证
**验收**: `npm test` 覆盖率低于阈值时 blocking merge；Slack 告警响应 < 5min；CI 通过率 ≥ 95%（不含 flaky）

### JTBD 3: 提升测试覆盖率

**用户**: dev、reviewer
**目标**: 将核心模块覆盖率提升至安全水平，为代码变更提供质量护栏
**信号**: Canvas 模块分支覆盖率 16-30%；`historySlice.ts` 分支仅 16%；`jest.config.ts` 中设定了阈值但从未达标
**验收**: 全局覆盖率行 ≥ 65%、分支 ≥ 50%；Canvas 核心模块分支 ≥ 50%；`npm test` 阈值 gate 通过

### JTBD 4: 消除 Flaky 测试

**用户**: CI/CD、dev
**目标**: 减少 E2E 测试的不稳定性，提升 CI 可靠性
**信号**: `retries: 1` 仅重试一次；历史 e2e 测试存在偶发超时；多浏览器配置在 CI 中引入不确定性
**验收**: 连续 5 次 CI 运行无 flaky 失败；E2E 测试 `timeout` 统一配置；不稳定测试自动 skip 并标记

### JTBD 5: 统一测试命名与目录规范

**用户**: dev、reviewer
**目标**: 建立清晰的测试文件命名和目录规范，降低团队协作摩擦
**信号**: 7 个配置文件命名各异；`.spec.ts` 和 `.test.ts` 混用无规律；`jest.config.ts` 中排除路径依赖文件位置而非命名
**验收**: 所有新测试遵循统一命名；目录结构文档化；Lint 规则强制命名规范

---

## 3. 技术方案选项

### 方案 A：渐进式标准化（推荐）

**核心理念**: 小步快走，先止血再优化，不破坏现有功能。

#### 阶段 1：止血（1-2 天）
| 动作 | 描述 | 工时 |
|------|------|------|
| A1.1 | 合并 Playwright 配置文件为 3 个：`playwright.config.ts`（开发）、`playwright.ci.config.ts`（CI）、`playwright.a11y.config.ts`（可访问性） | 2h |
| A1.2 | 删除重复测试文件：`tests/basic.spec.ts` vs `tests/e2e/basic.spec.ts` 合并 | 1h |
| A1.3 | 编写 `TESTING_STRATEGY.md`：明确 Jest（`src/` 下的 `.test.ts`）和 Playwright（`tests/e2e/` 下的 `.spec.ts`）边界 | 1h |
| A1.4 | 在 `jest.config.ts` 中统一 `testMatch` 命名规范，移除对路径的依赖 | 1h |
| A1.5 | 添加覆盖率阈值至 GitHub Actions，未达标则 CI 失败 | 2h |

#### 阶段 2：CI Gate 完善（1-2 天）
| 动作 | 描述 | 工时 |
|------|------|------|
| A2.1 | 添加 Slack 告警脚本：测试失败时在 5min 内通知 `#ci-alerts` 频道 | 2h |
| A2.2 | 将 E2E 测试结果（PASS/FAIL/coverage）写入 `test-results/summary.json`，供 CI 消费 | 2h |
| A2.3 | 添加每日测试健康度报告脚本（覆盖率趋势、Flaky 统计） | 3h |
| A2.4 | 修复 canvas 模块低覆盖率测试（`historySlice.ts` 等优先） | 4h |

#### 阶段 3：质量提升（3-5 天）
| 动作 | 描述 | 工时 |
|------|------|------|
| A3.1 | 添加 `vitest` 作为 Playwright 并行框架验证工具（可选，对比稳定性） | 2h |
| A3.2 | 覆盖率提升专项：重点模块补充单元测试，目标全局行覆盖 ≥ 65% | 8h |
| A3.3 | Flaky 测试识别与修复：运行 10 次 E2E 测试，定位不稳定用例并修复 | 6h |

**总工时**: 32h（约 5 个工作日）

**优点**:
- 风险低，每步可独立验证
- 不破坏现有功能
- 可并行 dev/tester 协作

**缺点**:
- 周期较长（5 天）
- 覆盖率目标保守（65% 行 / 50% 分支）

---

### 方案 B：激进式重建

**核心理念**: 重新定义测试策略，迁移至 Vitest（统一框架），彻底消除 Jest/Playwright 边界问题。

#### 阶段 1：框架迁移（3-5 天）
| 动作 | 描述 | 工时 |
|------|------|------|
| B1.1 | 安装配置 Vitest：`vitest --config vitest.config.ts` 替代 `npm test`（Jest）| 3h |
| B1.2 | 迁移现有 Jest 测试（7 个 `.test.ts` 文件）到 Vitest，修复兼容性问题 | 4h |
| B1.3 | 合并 Playwright E2E 保留，Vitest 仅处理单元/集成测试 | 2h |
| B1.4 | 更新 `npm test` script，统一入口 | 1h |

#### 阶段 2：规范重构（2-3 天）
| 动作 | 描述 | 工时 |
|------|------|------|
| B2.1 | 删除所有 7 个 Playwright 配置，合并为 2 个（`playwright.config.ts` + `playwright.a11y.config.ts`） | 2h |
| B2.2 | 删除重复测试文件，统一目录结构 | 2h |
| B2.3 | 编写 `TESTING_STRATEGY.md` 和 `TEST_NAMING_CONVENTIONS.md` | 2h |

#### 阶段 3：CI 与覆盖（2-3 天）
| 动作 | 描述 | 工时 |
|------|------|------|
| B3.1 | 配置 Vitest 内置覆盖率（V8/Istanbul）+ CI threshold gate | 2h |
| B3.2 | Slack 告警 + 每日健康度报告 | 4h |
| B3.3 | 覆盖率提升 | 6h |

**总工时**: 28h（约 4 个工作日）

**优点**:
- 框架统一，长期维护成本低
- Vitest 速度是 Jest 的 10 倍
- 一次解决所有边界问题

**缺点**:
- Vitest 迁移有破坏风险（7 个测试文件 + Jest setup 兼容性）
- 团队需学习新框架
- 激进变更可能引入 regression

---

### 方案对比

| 维度 | 方案 A（渐进式） | 方案 B（激进式） |
|------|----------------|----------------|
| **总工时** | 32h（5d） | 28h（4d） |
| **风险** | 低（每步独立验证） | 中高（Vitest 迁移风险） |
| **覆盖率目标** | 行 65% / 分支 50% | 行 65% / 分支 50% |
| **CI Gate** | 完整 | 完整 |
| **框架变更** | 保持 Jest + Playwright | 迁移至 Vitest + Playwright |
| **维护成本** | 中（双框架持续维护） | 低（统一框架） |
| **建议场景** | 当前功能稳定，保守迭代 | 允许 1-2 周技术迭代窗口 |

**推荐方案 A**：VibeX 目前处于功能开发期，激进迁移 Vitest 风险大于收益。方案 A 可在 5 天内系统性解决所有问题，同时保持现有功能稳定。

---

## 4. 可行性评估

| 维度 | 评估 | 说明 |
|------|------|------|
| **技术可行性** | ✅ 高 | Jest/Playwright 均为成熟框架，配置合并有大量最佳实践可参考 |
| **资源可行性** | ✅ 高 | dev + tester 可并行，AI 辅助测试生成可加速覆盖率提升 |
| **时间可行性** | ✅ 高 | 5 天完成，Scrum Sprint 可覆盖 |
| **依赖风险** | 🟡 中 | 覆盖率提升需 dev 配合写测试；Slack 告警需运维确认 webhook |
| **向后兼容** | ✅ 高 | 方案 A 不改变现有测试代码，仅修改配置和规范 |

---

## 5. 初步风险识别

### 5.1 风险矩阵

| 风险 ID | 描述 | 概率 | 影响 | 等级 | 缓解策略 |
|---------|------|------|------|------|---------|
| **R1** | 覆盖率提升占用 dev 工时，影响功能开发 | 高 | 中 | 🟡 中 | 与 PM 协商，工时从 Sprint 预留技术债中扣除 |
| **R2** | Flaky 测试根因复杂（网络/时钟/状态），无法在 5 天内完全消除 | 高 | 中 | 🟡 中 | 优先修复高频 flaky，设置 `retries: 3`，低频 flaky 标记 skip |
| **R3** | Playwright 多浏览器配置（chromium/firefox/webkit）在 CI 中不稳定 | 中 | 高 | 🟡 中 | CI 阶段仅跑 chromium，稳定后逐步增加多浏览器 |
| **R4** | Slack 告警 webhook 需外部授权，可能遇到审批延迟 | 低 | 低 | 🟢 低 | Slack webhook 可使用现有 CI 频道，1h 内可配置 |
| **R5** | 删除重复测试文件时误删有价值的测试用例 | 低 | 高 | 🟡 中 | 删除前对比两个文件的测试用例集合，确保无覆盖遗漏 |
| **R6** | 覆盖率阈值设高后 CI 频繁 blocking，影响开发节奏 | 中 | 中 | 🟡 中 | 阈值从当前实际值（行 52% → 目标 65%）分阶段设限（先 55%，再 60%，最后 65%）|

---

## 6. 验收标准（具体可测试）

### 6.1 规范边界
- [ ] `playwright.config.ts` 配置文件数量 ≤ 3 个（不含 `*.crash-test.config.cjs` 等临时配置）
- [ ] `TESTING_STRATEGY.md` 文档存在且包含 Jest/Playwright 边界定义
- [ ] 无重复测试文件（`basic.spec.ts` 类重复已合并）
- [ ] `jest.config.ts` 使用 `testMatch` 命名规范，不再依赖 `testPathIgnorePatterns` 路径排除

### 6.2 CI Gate
- [ ] GitHub Actions 运行 `npm test` 时，行覆盖率 < 65% 则 CI 失败
- [ ] E2E 测试失败时，Slack `#ci-alerts` 频道在 5min 内收到告警消息
- [ ] 每日 09:00 GMT+8 定时发送测试健康度报告（覆盖率趋势 + Flaky 统计）到 Slack
- [ ] CI 通过率（不含 flaky skip）≥ 95%（连续 3 天计算）

### 6.3 测试覆盖率
- [ ] 全局行覆盖率 ≥ 65%（当前 52.76%）
- [ ] 全局分支覆盖率 ≥ 50%（当前 33.75%）
- [ ] `historySlice.ts` 分支覆盖率 ≥ 40%（当前 16%）
- [ ] Canvas 核心模块分支覆盖率 ≥ 50%（当前部分 < 30%）

### 6.4 Flaky 测试治理
- [ ] E2E 测试 `retries` 在 CI 配置中为 3
- [ ] 连续 5 次 CI 运行无 flaky 失败
- [ ] 不稳定测试自动 skip 并写入 `flaky-tests.json` 清单

### 6.5 命名规范
- [ ] 所有新测试文件遵循统一命名（Jest: `.test.ts`，Playwright E2E: `.spec.ts`）
- [ ] ESLint 规则强制测试文件命名规范
- [ ] 测试目录结构文档化（`tests/unit/` / `tests/e2e/` / `tests/performance/`）

---

## 7. 下一步建议

| 角色 | 动作 |
|------|------|
| **PM** | 基于本分析创建 PRD，定义 Epic/Story 拆分，确认工时分配 |
| **Dev** | 优先执行 A1.1（配置文件合并）和 A1.3（TESTING_STRATEGY.md），止血先行 |
| **Tester** | 执行 A2.1（Slack 告警）和 A2.3（每日报告），建立监控护栏 |
| **Architect** | 评审测试策略文档，确认 Vitest 迁移是否在后续 Sprint 考虑 |

---

*本文档由 Analyst Agent 生成于 2026-04-03 03:59 GMT+8*
*数据来源: jest.config.ts、playwright.config.ts、coverage-summary.json、CI 配置、历史提案文档*
