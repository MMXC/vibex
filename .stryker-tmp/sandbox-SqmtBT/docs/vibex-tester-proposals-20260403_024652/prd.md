# PRD: VibeX Tester Proposals — Sprint 3 测试质量深化

**项目**: vibex-tester-proposals-20260403_024652
**日期**: 2026-04-03
**状态**: Draft
**Agent**: pm (subagent)
**总工时**: 20h（2.5d）

---

## 1. Executive Summary

### 背景

Sprint 3 测试深化阶段，VibeX 存在四个核心测试质量痛点：

1. **测试有效性无法量化** — 覆盖率数字≠测试有效性，缺乏突变测试机制
2. **E2E 测试不稳定** — canvas-phase2.spec.ts 等偶发失败，CI 通过率 70-80%，每次失败消耗 tester 精力
3. **前后端 API 契约不一致** — mock 数据与后端实际字段不同步，上线后才发现数据错乱
4. **Canvas 性能回归无护栏** — 三树组件在节点数增加时可能性能退化，CI 无法感知

### 目标

通过三大 Epic 在 2.5 人天内：
- 消除 E2E flaky 测试噪声，E2E 通过率稳定在 ≥95%
- 建立前后端 API 契约自动化校验机制，核心 API contract 测试用例 ≥20 条
- 验证测试有效性（kill rate ≥70%），证明 Epic 3 覆盖率成果有意义

### 成功指标

| 指标 | 当前值 | 目标值 |
|------|--------|--------|
| E2E 测试通过率（连续3次） | 70-80% | ≥95% |
| E2E flaky 测试数 | >5 个 | ≤1 个 |
| 核心 API Contract 测试用例数 | 0 | ≥20 条 |
| API Schema 覆盖 API 数 | 0 | ≥3 个核心 API |
| 突变测试 kill rate | N/A | ≥70% |

---

## 2. Epic Breakdown

### Epic E1: Flaky Test 治理
**优先级**: P0 | **工时**: 8h（1d）| **负责**: tester + dev

| 字段 | 内容 |
|------|------|
| Story | E1-S1: Playwright 配置优化 |
| 功能点 | 在 `playwright.config.ts` 中配置 `retries: 2`（CI 环境）和 `workers: 1`（消除并行竞争导致的 flaky）；添加全局 test hook 捕获 flaky 事件 |
| 验收标准 | `expect(playwrightConfig.retries).toBe(2)`; `expect(playwrightConfig.workers).toBe(1)` |
| 页面集成 | 无 |
| 工时 | 2h |
| 依赖 | 无 |

| 字段 | 内容 |
|------|------|
| Story | E1-S2: Stability Report 脚本 |
| 功能点 | 新增 `scripts/test-stability-report.sh`，运行 E2E 测试后解析 Playwright JSON 报告，输出 flaky 测试名单（pass 但有 retry 的测试）和 passRate 统计 |
| 验收标准 | `expect(fs.existsSync('scripts/test-stability-report.sh')).toBe(true)`; `expect(reportOutput).toContain('flaky')` |
| 页面集成 | 无 |
| 工时 | 3h |
| 依赖 | E1-S1 |

| 字段 | 内容 |
|------|------|
| Story | E1-S3: E2E 稳定性监控集成 |
| 功能点 | 将 stability report 输出集成到 HEARTBEAT 或 daily report，在 CI 日志中输出 E2E 通过率；记录 flaky 根因（timing 问题 vs 代码 bug）并报告给 dev |
| 验收标准 | `expect(dailyReport).toContain('E2E passRate')`; `expect(flakyTestCount).toBeLessThanOrEqual(1)` |
| 页面集成 | 无 |
| 工时 | 3h |
| 依赖 | E1-S1, E1-S2 |

---

### Epic E2: API Contract 测试
**优先级**: P1 | **工时**: 8h（1d）| **负责**: dev + tester

| 字段 | 内容 |
|------|------|
| Story | E2-S1: 核心 API JSON Schema 生成 |
| 功能点 | 从后端 route tests（279个）提取核心 API（domain-model、requirement、flow）的响应结构，生成 JSON Schema 文件到 `test/schemas/` 目录；Schema 包含字段名、类型、required 约束 |
| 验收标准 | `expect(fs.existsSync('test/schemas/domain-model.json')).toBe(true)`; `expect(schema.type).toBe('object')`; `expect(Object.keys(schema.properties).length).toBeGreaterThan(0)` |
| 页面集成 | 无 |
| 工时 | 3h |
| 依赖 | 无 |

| 字段 | 内容 |
|------|------|
| Story | E2-S2: 前端 Mock 一致性校验 |
| 功能点 | 新增 `test/contract/mock-consistency.test.ts`，读取 `test/schemas/*.json` 和前端 `services/api/*.test.ts` 中的 mock 数据，断言两者字段一致性；运行 Jest 验证前端 mock 与 Schema 对齐 |
| 验收标准 | `expect(mockConsistencyResult.errors).toHaveLength(0)`; `expect(JestResult.numPassingTests).toBeGreaterThanOrEqual(20)` |
| 页面集成 | 无 |
| 工时 | 3h |
| 依赖 | E2-S1 |

| 字段 | 内容 |
|------|------|
| Story | E2-S3: Schema 变更 CI 拦截 |
| 功能点 | 在 `package.json` 中添加 pre-commit hook 或 GitHub Actions workflow，当 `test/schemas/` 中的 Schema 文件变更时，自动触发 contract 测试；Schema 变更但前端 mock 未同步时 CI 失败 |
| 验收标准 | `expect(ciResult.status).toBe('failure')` when schema changed but mock not updated |
| 页面集成 | 无 |
| 工时 | 2h |
| 依赖 | E2-S1, E2-S2 |

---

### Epic E3: 突变测试（抽样）
**优先级**: P2 | **工时**: 4h（0.5d）| **负责**: tester

| 字段 | 内容 |
|------|------|
| Story | E3-S1: 突变测试工具集成 |
| 功能点 | 在项目中集成 stryker-mutator（或 jest-stryker），配置 `stryker.conf.json`，仅对 `src/stores/` 中的 canvasStore 和 contextStore 进行抽样突变测试，设置超时 10min |
| 验收标准 | `expect(fs.existsSync('stryker.conf.json')).toBe(true)`; `expect(strykerConfig.mutate).toContain('src/stores/canvasStore.ts')` |
| 页面集成 | 无 |
| 工时 | 1h |
| 依赖 | 无 |

| 字段 | 内容 |
|------|------|
| Story | E3-S2: 核心 Store 突变测试执行 |
| 功能点 | 对 canvasStore 和 contextStore 运行突变测试，统计 kill rate；对于 kill rate <70% 的测试路径，补充缺失的 assertion；记录结果到 `docs/test-quality-report.md` |
| 验收标准 | `expect(killRate).toBeGreaterThanOrEqual(0.7)`; `expect(fs.existsSync('docs/test-quality-report.md')).toBe(true)` |
| 页面集成 | 无 |
| 工时 | 2h |
| 依赖 | E3-S1 |

| 字段 | 内容 |
|------|------|
| Story | E3-S3: 测试有效性验证报告 |
| 功能点 | 将突变测试结果与 Epic 3 覆盖率报告对比分析，验证"覆盖率 ≥80%"的测试套件是否真正有效；输出测试有效性评分（0-100），作为 Sprint 3 质量总结的一部分 |
| 验收标准 | `expect(testQualityReport.effectivenessScore).toBeGreaterThanOrEqual(70)`; `expect(report.coverageVsEffectiveness).toBeDefined()` |
| 页面集成 | 无 |
| 工时 | 1h |
| 依赖 | E3-S2 |

---

## 3. Story 汇总表

| ID | Story | Epic | 优先级 | 工时 | 依赖 |
|----|-------|------|--------|------|------|
| E1-S1 | Playwright 配置优化 | E1 Flaky治理 | P0 | 2h | - |
| E1-S2 | Stability Report 脚本 | E1 Flaky治理 | P0 | 3h | E1-S1 |
| E1-S3 | E2E 稳定性监控集成 | E1 Flaky治理 | P0 | 3h | E1-S1, E1-S2 |
| E2-S1 | 核心 API JSON Schema 生成 | E2 Contract测试 | P1 | 3h | - |
| E2-S2 | 前端 Mock 一致性校验 | E2 Contract测试 | P1 | 3h | E2-S1 |
| E2-S3 | Schema 变更 CI 拦截 | E2 Contract测试 | P1 | 2h | E2-S1, E2-S2 |
| E3-S1 | 突变测试工具集成 | E3 突变测试 | P2 | 1h | - |
| E3-S2 | 核心 Store 突变测试执行 | E3 突变测试 | P2 | 2h | E3-S1 |
| E3-S3 | 测试有效性验证报告 | E3 突变测试 | P2 | 1h | E3-S2 |
| **合计** | | | | **20h** | |

---

## 4. Acceptance Criteria（expect() 格式）

### E1: Flaky Test 治理

```typescript
// E1-S1
expect(playwrightConfig.retries).toBe(2);
expect(playwrightConfig.workers).toBe(1);
expect(playwrightConfig.reporter).toContain('json');

// E1-S2
expect(fs.existsSync('scripts/test-stability-report.sh')).toBe(true);
const report = execSync('bash scripts/test-stability-report.sh', { cwd: projectRoot });
expect(report.toString()).toContain('passRate');
expect(report.toString()).toMatch(/flaky/i);

// E1-S3
const stabilityReport = JSON.parse(execSync('bash scripts/test-stability-report.sh --json'));
expect(stabilityReport.passRate).toBeGreaterThanOrEqual(0.95);
expect(stabilityReport.flakyTests.length).toBeLessThanOrEqual(1);
expect(stabilityReport.runs).toBeGreaterThanOrEqual(3);
```

### E2: API Contract 测试

```typescript
// E2-S1
expect(fs.existsSync('test/schemas/domain-model.json')).toBe(true);
expect(fs.existsSync('test/schemas/requirement.json')).toBe(true);
expect(fs.existsSync('test/schemas/flow.json')).toBe(true);
const schema = JSON.parse(fs.readFileSync('test/schemas/domain-model.json'));
expect(schema.type).toBe('object');
expect(schema.required).toBeDefined();
expect(Object.keys(schema.properties).length).toBeGreaterThan(0);

// E2-S2
const result = execSync('npm run test:contract', { cwd: projectRoot });
expect(result.exitCode).toBe(0);
const jestResult = JSON.parse(fs.readFileSync('test-results/contract.json'));
expect(jestResult.numPassingTests).toBeGreaterThanOrEqual(20);
expect(jestResult.numFailingTests).toBe(0);

// E2-S3
// Simulate schema change without mock update
execSync('cp test/schemas/domain-model.json test/schemas/domain-model.json.bak');
fs.writeFileSync('test/schemas/domain-model.json', JSON.stringify({ ...schema, version: '2' }));
const ciResult = execSync('npm run test:contract', { cwd: projectRoot, expectFailure: true });
expect(ciResult.exitCode).not.toBe(0);
// Restore
execSync('mv test/schemas/domain-model.json.bak test/schemas/domain-model.json');
```

### E3: 突变测试

```typescript
// E3-S1
expect(fs.existsSync('stryker.conf.json')).toBe(true);
const strykerConfig = JSON.parse(fs.readFileSync('stryker.conf.json'));
expect(strykerConfig.mutate).toContain('src/stores/canvasStore.ts');
expect(strykerConfig.mutate).toContain('src/stores/contextStore.ts');
expect(strykerConfig.timeout).toBe(60000);

// E3-S2
const mutationResult = execSync('npx stryker run', { cwd: projectRoot, timeout: 600000 });
const report = JSON.parse(fs.readFileSync('reports/mutation/mutation.json'));
expect(report.totalMetrics.killRate).toBeGreaterThanOrEqual(0.70);
expect(fs.existsSync('docs/test-quality-report.md')).toBe(true);

// E3-S3
const qualityReport = fs.readFileSync('docs/test-quality-report.md', 'utf-8');
expect(qualityReport).toContain('kill rate');
expect(qualityReport).toContain('coverage');
expect(qualityReport).toMatch(/effectiveness.*70|70.*%/i);
```

---

## 5. DoD（Definition of Done）

### Epic E1: Flaky Test 治理
- [ ] `playwright.config.ts` 配置 `retries=2`, `workers=1` 已生效
- [ ] `scripts/test-stability-report.sh` 存在并可执行
- [ ] E2E 测试连续 3 次运行 passRate ≥ 95%
- [ ] flaky 测试数 ≤ 1
- [ ] stability report 输出在 daily report 中可见

### Epic E2: API Contract 测试
- [ ] `test/schemas/` 下有 ≥3 个核心 API 的 JSON Schema
- [ ] `npm run test:contract` 通过，≥20 条测试用例
- [ ] Schema 变更触发 CI 失败（mock 未同步时）
- [ ] 核心 API（domain-model, requirement, flow）字段与前端 mock 一致性 100%

### Epic E3: 突变测试
- [ ] `stryker.conf.json` 配置完成，仅对 canvasStore/contextStore 抽样
- [ ] 突变测试运行完成，kill rate ≥ 70%
- [ ] `docs/test-quality-report.md` 包含 kill rate、覆盖率对比分析
- [ ] 测试有效性评分 ≥ 70

### 全局 DoD
- [ ] 所有新增测试文件通过 ESLint + Prettier
- [ ] GitHub Actions CI 中 contract 测试和 stability report 正常运行
- [ ] 无新增 console.error 或 unhandled promise rejection
- [ ] 文档已更新（test-quality-report.md）

---

## 6. Non-Functional Requirements

| 类别 | 要求 |
|------|------|
| **性能** | 突变测试单次运行 ≤ 10min；E2E 测试总时长 ≤ 15min |
| **稳定性** | E2E 通过率 ≥ 95%（连续3次）；flaky 测试数 ≤ 1 |
| **覆盖率** | Contract 测试用例 ≥ 20 条；Schema 覆盖核心 API ≥ 3 个 |
| **可维护性** | Schema 文件集中管理在 `test/schemas/`；stability report 脚本可独立运行 |
| **可观测性** | daily report 包含 E2E passRate；test-quality-report.md 记录测试有效性指标 |
| **CI 集成** | contract 测试和 stability report 集成到 GitHub Actions |
| **兼容性** | Playwright config 兼容 Node.js 20+；stryker-mutator 兼容 Jest 29+ |

---

## 7. Implementation Constraints

| 约束类型 | 描述 |
|----------|------|
| **技术栈约束** | 仅使用 Playwright（已安装）、Jest（已安装）、stryker-mutator |
| **范围约束** | 突变测试仅对 canvasStore 和 contextStore 抽样，不覆盖全量代码 |
| **Schema 范围** | 仅生成 3 个核心 API（domain-model, requirement, flow）的 Schema，不做全量 API |
| **CI 约束** | 不修改现有 CI pipeline 结构，仅在现有 workflow 中新增 step |
| **数据约束** | 不使用真实用户数据，所有测试数据使用 mock/factory 生成 |
| **时间约束** | 总工时控制在 20h（2.5d）内，E1 优先完成 |
| **向后兼容** | 不删除或修改现有测试文件，只新增配置文件和测试文件 |
| **可回滚** | 所有配置变更（playwright.config.ts、stryker.conf.json）需可回滚 |

---

## 8. 与昨日提案关系

| 昨日 Epic | 今日 Epic | 关系 |
|-----------|-----------|------|
| Epic 3 (Store 覆盖率 ≥80%) | E3 (突变测试) | **互补**：覆盖率解决"测了多少"，突变解决"测得是否有效" |
| Epic 4 (Canvas E2E 基础) | E1 (Flaky 治理) | **递进**：先建立 E2E，再稳定 E2E |
| Epic 1 (DoD 约束) | E2 (Contract 测试) | **深化**：DoD 要求更新测试，Contract 要求测试内容正确 |

---

## 9. Sprint 3 排期

```
Day 1 (04-03): E1 Flaky 治理
  上午: Playwright 配置优化 (E1-S1, 2h)
  下午: Stability Report 脚本 (E1-S2, 3h) + 连续运行基线验证 (E1-S3 前置, 1h)

Day 2 (04-04): E2 Contract 测试
  上午: 生成核心 API JSON Schema (E2-S1, 3h)
  下午: 前端 mock 对齐 + 校验 (E2-S2, 3h) + CI 拦截 (E2-S3, 2h)

Day 3 (04-07): E3 突变测试 + 整体验收
  上午: 抽样 store 突变测试 (E3-S1, 1h + E3-S2, 2h)
  下午: 有效性报告 (E3-S3, 1h) + DoD 验收清单 + 文档更新
```
