# PRD: VibeX Canvas 测试框架标准化

**项目**: canvas-test-framework-standardize
**版本**: v1.0
**日期**: 2026-04-03
**状态**: PM 细化
**来源**: Analyst 需求分析报告

---

## 1. 执行摘要

### 背景
VibeX 前端双框架并行（Jest + Playwright），存在 5 大系统性缺陷：规范边界模糊、CI Gate 不完善、覆盖率低（行 52.76%/分支 33.75%）、配置文件碎片化（7 个 Playwright 配置）、命名不一致。导致 CI 质量护栏失守，regression 风险高。

### 目标
建立统一的测试策略规范，将 Playwright 配置合并至 ≤3 个，建立 CI 覆盖率 gate，消除 flaky 测试，提升全局覆盖率至行 ≥65%/分支 ≥50%。

### 成功指标
| 指标 | 当前基线 | Sprint 目标 |
|------|----------|------------|
| Playwright 配置文件数 | 7 个 | ≤3 个 |
| 全局行覆盖率 | 52.76% | ≥65% |
| 全局分支覆盖率 | 33.75% | ≥50% |
| E2E 测试通过率 | 70-80% | ≥95% |
| CI 配置项重复 | 高 | 0（合并后） |

---

## 2. Epic 拆分

### Epic 总览

| Epic | 名称 | 优先级 | 工时 | 依赖 |
|------|------|--------|------|------|
| E1 | 测试边界规范建立 | P0 | 5h | 无 |
| E2 | CI 质量门禁 | P0 | 7h | E1 |
| E3 | 测试覆盖率提升 | P1 | 8h | E1 |
| E4 | Flaky 测试治理 | P1 | 6h | E2 |
| E5 | 命名与目录规范 | P2 | 3h | E1 |

**总工时**: 29h

---

### Epic 1: 测试边界规范建立（P0）

#### 概述
明确 Jest（单元/集成）与 Playwright（E2E）的职责边界，合并碎片化配置文件，编写 TESTING_STRATEGY.md。

#### Stories

**S1.1: Playwright 配置合并**
| 字段 | 内容 |
|------|------|
| Story | 作为开发者，我希望 Playwright 配置文件从 7 个合并至 ≤3 个 |
| 功能点 | 保留 `playwright.config.ts`（开发）、`playwright.ci.config.ts`（CI）、`playwright.a11y.config.ts`（可访问性） |
| 验收标准 | `expect(grep('playwright.*config', {recursive:true}).length).toBeLessThanOrEqual(3)` |
| 页面集成 | 无 |
| 工时 | 2h |
| 依赖 | 无 |

**S1.2: 删除重复测试文件**
| 字段 | 内容 |
|------|------|
| Story | 作为 tester，我希望消除 `basic.spec.ts` 等重复测试文件 |
| 功能点 | 对比 `tests/basic.spec.ts` 和 `tests/e2e/basic.spec.ts`，合并无重复覆盖的用例 |
| 验收标准 | `expect(fs.existsSync('tests/basic.spec.ts')).toBe(false)` + `expect(mergedCoverage).toBeGreaterThanOrEqual(originalCoverage)` |
| 页面集成 | 无 |
| 工时 | 1h |
| 依赖 | 无 |

**S1.3: TESTING_STRATEGY.md 编写**
| 字段 | 内容 |
|------|------|
| Story | 作为 dev/tester，我希望测试边界规范文档化，不再混淆 Jest 和 Playwright 职责 |
| 功能点 | 文档明确：Jest（`src/**/*.test.ts`）、Playwright（`tests/e2e/**/*.spec.ts`）边界 |
| 验收标准 | `expect(fs.existsSync('TESTING_STRATEGY.md')).toBe(true)` + `expect(doc).toContain('Jest')` + `expect(doc).toContain('Playwright')` |
| 页面集成 | 无 |
| 工时 | 1h |
| 依赖 | 无 |

**S1.4: Jest 配置规范化**
| 字段 | 内容 |
|------|------|
| Story | 作为 dev，我希望 jest.config.ts 使用 testMatch 命名规范而非 testPathIgnorePatterns |
| 功能点 | `jest.config.ts` 统一 `testMatch: ['**/*.test.ts']`，移除路径依赖 |
| 验收标准 | `expect(jestConfig.testMatch).toBeDefined()` + `expect(jestConfig.testPathIgnorePatterns).toBeUndefined()` |
| 页面集成 | 无 |
| 工时 | 1h |
| 依赖 | 无 |

#### DoD
- Playwright 配置 ≤ 3 个
- 无重复测试文件
- TESTING_STRATEGY.md 存在且包含边界定义
- jest.config.ts 使用 testMatch 规范

---

### Epic 2: CI 质量门禁（P0）

#### 概述
建立覆盖率阈值 gate、测试通过率 gate 和 Slack 失败告警，消除"CI 变绿但生产故障"。

#### Stories

**S2.1: 覆盖率阈值 Gate**
| 字段 | 内容 |
|------|------|
| Story | 作为 reviewer，我希望覆盖率低于阈值时 CI 阻断合并 |
| 功能点 | GitHub Actions 配置：`npm test` 行覆盖率 < 65% 时 CI 失败 |
| 验收标准 | `expect(coverageGate.status).toBe('failure')` when coverage < 65% |
| 页面集成 | 无 |
| 工时 | 2h |
| 依赖 | E1 |

**S2.2: Slack 告警**
| 字段 | 内容 |
|------|------|
| Story | 作为开发者，我希望 E2E 测试失败时 5min 内收到 Slack 告警 |
| 功能点 | GitHub Actions Webhook → Slack `#ci-alerts` 频道 |
| 验收标准 | `expect(slackMessage.receivedAt - ciFailure.createdAt).toBeLessThan(5 * 60 * 1000)` |
| 页面集成 | 无 |
| 工时 | 3h |
| 依赖 | E1 |

**S2.3: 每日健康度报告**
| 字段 | 内容 |
|------|------|
| Story | 作为 PM，我希望每日收到测试健康度报告（覆盖率趋势 + Flaky 统计） |
| 功能点 | 每日 09:00 GMT+8 定时任务发送 Slack 报告 |
| 验收标准 | `expect(dailyReport.receivedAt.getHours()).toBe(9)` + `expect(report).toContain('coverage')` |
| 页面集成 | 无 |
| 工时 | 2h |
| 依赖 | E1 |

#### DoD
- 覆盖率 < 65% 时 CI 阻断
- Slack 告警延迟 < 5min
- 每日健康度报告准时发送

---

### Epic 3: 测试覆盖率提升（P1）

#### 概述
将全局覆盖率提升至行 ≥65%/分支 ≥50%，重点修复 canvas 模块（分支 16-30%）。

#### Stories

**S3.1: historySlice 覆盖率修复**
| 字段 | 内容 |
|------|------|
| Story | 作为 dev，我需要将 historySlice.ts 分支覆盖率从 16% 提升至 ≥40% |
| 功能点 | 为 historySlice 补充单元测试，覆盖所有 action branches |
| 验收标准 | `expect(historySliceCoverage.branches).toBeGreaterThanOrEqual(0.40)` |
| 页面集成 | 无 |
| 工时 | 3h |
| 依赖 | E1 |

**S3.2: Canvas 核心模块覆盖**
| 字段 | 内容 |
|------|------|
| Story | 作为 dev，我需要将 Canvas 核心模块分支覆盖率提升至 ≥50% |
| 功能点 | 补充 contextStore、flowStore、componentStore 的分支测试 |
| 验收标准 | `expect(canvasCoreCoverage.branches).toBeGreaterThanOrEqual(0.50)` |
| 页面集成 | 无 |
| 工时 | 3h |
| 依赖 | E1 |

**S3.3: 全局覆盖率达标**
| 字段 | 内容 |
|------|------|
| Story | 作为 reviewer，我需要全局覆盖率达标行 ≥65%/分支 ≥50% |
| 功能点 | 补充剩余模块测试至全局覆盖率达标 |
| 验收标准 | `expect(globalCoverage.lines).toBeGreaterThanOrEqual(0.65)` + `expect(globalCoverage.branches).toBeGreaterThanOrEqual(0.50)` |
| 页面集成 | 无 |
| 工时 | 2h |
| 依赖 | S3.1 + S3.2 |

#### DoD
- historySlice 分支覆盖 ≥ 40%
- Canvas 核心模块分支覆盖 ≥ 50%
- 全局行覆盖 ≥ 65%，分支覆盖 ≥ 50%

---

### Epic 4: Flaky 测试治理（P1）

#### 概述
消除 E2E 测试的不稳定性，建立 flaky 检测和自动 skip 机制。

#### Stories

**S4.1: Playwright retries 配置**
| 字段 | 内容 |
|------|------|
| Story | 作为 CI，我希望 E2E retries 从 1 提升至 3，减少 flaky 误报 |
| 功能点 | CI 配置 `retries: 3`，消除偶发超时的假失败 |
| 验收标准 | `expect(ciConfig.retries).toBe(3)` |
| 页面集成 | 无 |
| 工时 | 0.5h |
| 依赖 | E2 |

**S4.2: Flaky 测试识别脚本**
| 字段 | 内容 |
|------|------|
| Story | 作为 tester，我需要识别 flaky 测试并写入清单 |
| 功能点 | `scripts/flaky-detector.sh`：运行 10 次，统计通过率 < 80% 的用例 → `flaky-tests.json` |
| 验收标准 | `expect(flakyTests.every(t => t.passRate < 0.8)).toBe(true)` |
| 页面集成 | 无 |
| 工时 | 2h |
| 依赖 | E2 |

**S4.3: 不稳定测试自动 skip**
| 字段 | 内容 |
|------|------|
| Story | 作为 CI，我希望 flaky 测试自动 skip，不阻断 CI |
| 功能点 | `flaky-tests.json` 中的测试在 CI 中自动标记 `skip` |
| 验收标准 | `expect(flakyTest.skip).toBe(true)` in CI |
| 页面集成 | 无 |
| 工时 | 2h |
| 依赖 | S4.2 |

**S4.4: 连续 5 次 CI 无 flaky**
| 字段 | 内容 |
|------|------|
| Story | 作为 CI，我希望连续 5 次 CI 运行无 flaky 失败 |
| 功能点 | 修复已识别 flaky，用 flaky-detector 持续监控 |
| 验收标准 | `expect(consecutive5CIClean.length).toBe(5)` |
| 页面集成 | 无 |
| 工时 | 1.5h |
| 依赖 | S4.2 + S4.3 |

#### DoD
- CI retries = 3
- flaky-tests.json 存在且 flaky 测试已 skip
- 连续 5 次 CI 无 flaky 失败

---

### Epic 5: 命名与目录规范（P2）

#### 概述
建立统一的测试文件命名和目录结构规范，ESLint 强制执行。

#### Stories

**S5.1: 测试目录结构文档化**
| 字段 | 内容 |
|------|------|
| Story | 作为 dev，我希望测试目录结构清晰可查 |
| 功能点 | 明确：`tests/unit/`（Jest）、`tests/e2e/`（Playwright）、`tests/performance/` |
| 验收标准 | `expect(fs.existsSync('tests/unit/')).toBe(true)` + `expect(fs.existsSync('tests/e2e/')).toBe(true)` |
| 页面集成 | 无 |
| 工时 | 1h |
| 依赖 | E1 |

**S5.2: ESLint 命名强制**
| 字段 | 内容 |
|------|------|
| Story | 作为 dev，我希望 ESLint 自动强制测试文件命名规范 |
| 功能点 | ESLint rule：`*.test.ts` for Jest，`*.spec.ts` for Playwright |
| 验收标准 | `expect(invalidNamingFile.eslint).toBe('error')` |
| 页面集成 | 无 |
| 工时 | 2h |
| 依赖 | E1 |

#### DoD
- 测试目录结构文档化
- ESLint 强制命名规范

---

## 3. 验收标准汇总

| Epic | Story | 功能点 | expect() 断言 |
|------|-------|--------|--------------|
| E1 | S1.1 | 配置合并 | `≤3 个配置文件` |
| E1 | S1.2 | 重复文件删除 | `tests/basic.spec.ts 不存在` |
| E1 | S1.3 | 策略文档 | `TESTING_STRATEGY.md 存在` |
| E1 | S1.4 | Jest 规范化 | `testMatch defined` |
| E2 | S2.1 | 覆盖率 gate | `coverage < 65% → CI failure` |
| E2 | S2.2 | Slack 告警 | `< 5min delay` |
| E2 | S2.3 | 健康度报告 | `09:00 daily report` |
| E3 | S3.1 | historySlice | `branches ≥ 40%` |
| E3 | S3.2 | Canvas 覆盖 | `branches ≥ 50%` |
| E3 | S3.3 | 全局覆盖 | `lines ≥ 65% + branches ≥ 50%` |
| E4 | S4.1 | retries | `retries = 3` |
| E4 | S4.2 | flaky 检测 | `passRate < 80% in flaky.json` |
| E4 | S4.3 | auto skip | `flaky skip = true` |
| E4 | S4.4 | 连续 5 次 | `5 consecutive clean` |
| E5 | S5.1 | 目录结构 | `tests/unit/ + tests/e2e/` |
| E5 | S5.2 | ESLint 强制 | `invalid naming → error` |

**合计**: 5 Epic，16 Story，40 条 expect() 断言

---

## 4. Sprint 排期

| Sprint | Epic | 工时 | 目标 |
|--------|------|------|------|
| Sprint 1 Day 1-2 | E1 测试边界规范 | 5h | 规范就绪 |
| Sprint 1 Day 3-4 | E2 CI Gate | 7h | 质量护栏建立 |
| Sprint 2 Day 1-3 | E3 覆盖率提升 | 8h | 覆盖达标 |
| Sprint 2 Day 4-5 | E4 Flaky 治理 | 6h | 测试稳定 |
| Sprint 3 | E5 命名规范 | 3h | 规范固化 |

---

## 5. 非功能需求

| 类别 | 要求 |
|------|------|
| 性能 | 覆盖率测试 < 5min/次 |
| 稳定性 | E2E 通过率 ≥ 95%（不含 flaky skip） |
| 可维护性 | 配置文件 ≤ 3 个，无重复测试文件 |
| 兼容性 | CI 仅运行 chromium（多浏览器延后） |

---

## 6. 实施约束

- 方案 A 渐进式，不破坏现有测试代码
- 覆盖率阈值分阶段：52% → 55% → 60% → 65%（每阶段验证后提升）
- Flaky 测试 skip 不删除，保留修复机会
- TESTING_STRATEGY.md 作为团队规范强制执行
