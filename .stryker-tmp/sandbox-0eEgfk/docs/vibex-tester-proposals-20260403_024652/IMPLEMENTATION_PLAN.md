# VibeX 测试质量深化 — 实施计划

**项目**: vibex-tester-proposals-20260403_024652
**版本**: v1.0
**日期**: 2026-04-03

---

## 执行决策

- **决策**: 已采纳
- **执行项目**: vibex-tester-proposals-20260403_024652
- **执行日期**: 2026-04-03

---

## 1. Sprint 规划总览

| Day | Sprint | Epics | 总工时 | 目标 |
|------|--------|-------|--------|------|
| Day 1 (04-03) | Sprint 3-1 | E1 Flaky 治理 | 8h | Playwright 配置 + Stability Report |
| Day 2 (04-04) | Sprint 3-2 | E2 Contract 测试 | 8h | Schema 生成 + Mock 校验 + CI Gate |
| Day 3 (04-07) | Sprint 3-3 | E3 突变测试 + 验收 | 4h | 突变测试 + 有效性报告 |

**总工时**: 20h

---

## 2. Day 1: E1 Flaky 治理 (8h)

### E1-S1: Playwright 配置优化 (2h)

```
T1.1.1: 修改 playwright.config.ts
  文件: playwright.config.ts (根目录)
  变更:
    retries: 0 → 2
    workers: 1 (确认已是 workers: 1)
    reporter: 添加 ['json', 'html'] 用于 stability report
  验证: grep "retries" playwright.config.ts

T1.1.2: 验证现有配置
  确认: workers: 1 已配置（两个 config 都已是 workers: 1）
  确认: 现有 E2E 测试可通过 playwright test
```

**验收标准**:
- `expect(playwrightConfig.retries).toBe(2)`
- `expect(playwrightConfig.workers).toBe(1)`

---

### E1-S2: Stability Report 脚本 (3h)

```
T1.2.1: 创建 scripts/test-stability-report.sh
  功能:
    1. 运行 E2E 测试 (npx playwright test)
    2. 解析 test-results/results.json
    3. 统计 passRate, flakyTests
    4. 输出 Markdown 摘要
    5. 追加到 docs/daily-stability.md

  脚本结构:
    #!/bin/bash
    set -e
    PLAYWRIGHT_DIR="${1:-.}"
    REPORT_FILE="$PLAYWRIGHT_DIR/test-results/results.json"

    # 运行测试
    npx playwright test --reporter=json

    # 解析 JSON
    python3 scripts/parse-playwright-report.py "$REPORT_FILE"

    # 输出摘要
    echo "## E2E Stability Report $(date +%Y-%m-%d)"
    echo "passRate: $passRate"
    echo "flaky: $flaky_count"

T1.2.2: 创建 scripts/parse-playwright-report.py
  功能:
    1. 读取 Playwright JSON report
    2. 识别 flaky: 同一测试多次运行，有 retry 记录
    3. 计算 passRate = passed / total
    4. 输出 JSON 供 shell 使用

T1.2.3: 创建 docs/daily-stability.md 模板
  格式:
    ## Daily Stability Log

    | Date | PassRate | Total | Passed | Failed | Flaky |
    |------|----------|-------|--------|--------|-------|
    | 2026-04-03 | 95% | 20 | 19 | 1 | 0 |
```

**验收标准**:
- `expect(fs.existsSync('scripts/test-stability-report.sh')).toBe(true)`
- `expect(fs.existsSync('scripts/parse-playwright-report.py')).toBe(true)`
- `bash scripts/test-stability-report.sh` 输出 passRate 和 flaky 数量

---

### E1-S3: E2E 稳定性监控集成 (3h)

```
T1.3.1: 将 stability report 集成到 GitHub Actions
  文件: .github/workflows/playwright.yml (新增 step)
  新增:
    - name: Stability Report
      run: bash scripts/test-stability-report.sh
      continue-on-error: true

T1.3.2: 连续运行基线验证
  目标: 运行 E2E 测试 3 次，确认 passRate >= 95%
  操作: 本地运行 bash scripts/test-stability-report.sh 3次
  记录: 3次 passRate 写入 docs/daily-stability.md

T1.3.3: Flaky 根因识别
  目标: 对 flaky 测试归类（timing 问题 vs 代码 bug）
  操作:
    1. 查看 Playwright trace (test-results/traces/)
    2. 判断: wait 不足 → timing; 断言错误 → 代码 bug
  输出: 每条 flaky 测试记录根因到 daily-stability.md
```

**验收标准**:
- `expect(dailyStability.passRate).toBeGreaterThanOrEqual(0.95)`
- `expect(dailyStability.flakyTests.length).toBeLessThanOrEqual(1)`
- `expect(dailyStability.runs).toBeGreaterThanOrEqual(3)`

---

## 3. Day 2: E2 Contract 测试 (8h)

### E2-S1: 核心 API JSON Schema 生成 (3h)

```
T2.1.1: 创建 scripts/generate-schemas.ts
  逻辑:
    1. 扫描 backend route tests 目录
    2. 从 test fixtures 中提取响应结构
    3. 生成 JSON Schema (使用 ajv 或手动)
    4. 输出到 test/schemas/

  示例:
    # 从 domain-entities.ts backend test 提取
    npx tsx scripts/generate-schemas.ts domain-model

T2.1.2: 生成 3 个核心 API Schema
  目标 API:
    1. domain-model: GET /api/domain-model/{projectId}
    2. requirement: GET /api/requirements/{projectId}
    3. flow: GET /api/flows/{projectId}

  输出:
    test/schemas/domain-model.json
    test/schemas/requirement.json
    test/schemas/flow.json

T2.1.3: 创建 test/schemas/README.md
  内容: 说明 Schema 来源、生成方式、更新时间
```

**验收标准**:
- `expect(fs.existsSync('test/schemas/domain-model.json')).toBe(true)`
- `expect(fs.existsSync('test/schemas/requirement.json')).toBe(true)`
- `expect(fs.existsSync('test/schemas/flow.json')).toBe(true)`
- `expect(schema.type).toBe('object')`
- `expect(schema.required).toBeDefined()`

---

### E2-S2: 前端 Mock 一致性校验 (3h)

```
T2.2.1: 创建 test/contract/ 目录和配置
  文件: test/contract/jest.config.ts
  配置:
    testEnvironment: 'node'
    testMatch: ['**/mock-consistency.test.ts']
    transform: { '^.+\\.tsx?$': 'ts-jest' }

T2.2.2: 创建 test/contract/mock-consistency.test.ts
  测试用例:
    1. 加载 test/schemas/*.json
    2. 加载前端 services/api/*.test.ts 中的 mock 数据
    3. 对比字段名、类型、required 一致性
    4. 每个 Schema 生成多个 assert

  断言示例:
    it('domain-model mock matches schema', () => {
      const schema = loadSchema('domain-model');
      const mock = loadMock('domain-entity');
      expect(Object.keys(mock)).toIncludeAllMembers(schema.required);
    });

  目标: >= 20 条测试用例

T2.2.3: 安装 ajv 用于 Schema 校验
  包: ajv, ajv-formats
  用法: 在 mock-consistency.test.ts 中用 ajv 验证
```

**验收标准**:
- `expect(contractTestResults.numPassingTests).toBeGreaterThanOrEqual(20)`
- `expect(contractTestResults.numFailingTests).toBe(0)`
- `npm run test:contract` 退出码为 0

---

### E2-S3: Schema 变更 CI 拦截 (2h)

```
T2.3.1: 创建 .github/workflows/schema-contract-gate.yml
  触发: push 时 test/schemas/*.json 变更
  动作:
    - name: Contract Tests
      run: npm run test:contract
    - name: Mock Sync Check
      run: node scripts/check-mock-sync.js

  关键: 使用 paths filter 确保仅 Schema 变更时触发

T2.3.2: 创建 scripts/check-mock-sync.js
  逻辑:
    1. 检测 test/schemas/*.json 变更
    2. 检测前端 services/api/*.test.ts 是否同步更新
    3. 若 Schema 变更但 mock 未变 → CI 失败

T2.3.3: 更新 package.json scripts
  新增:
    "test:contract": "jest --config test/contract/jest.config.ts",
    "test:contract:ci": "npm run test:contract && node scripts/check-mock-sync.js"
```

**验收标准**:
- `expect(ciResult.status).toBe('failure')` when schema changed but mock not updated
- `expect(ciResult.status).toBe('success')` when schema and mock both updated

---

## 4. Day 3: E3 突变测试 + 验收 (4h)

### E3-S1: 突变测试工具集成 (1h)

```
T3.1.1: 安装 stryker-mutator
  命令: npm install --save-dev @stryker-mutator/core @stryker-mutator/jest-runner
  注意: 检查与 Jest 29+ 兼容性

T3.1.2: 创建 stryker.conf.json
  配置:
    {
      "testRunner": "jest",
      "jest": {
        "projectType": "ts"
      },
      "mutate": [
        "src/lib/canvas/canvasStore.ts",
        "src/stores/contextStore.ts"
      ],
      "timeout": 600000,
      "timeoutFactor": 1.5,
      "thresholds": {
        "break": 70,
        "high": 90,
        "low": 60
      }
    }

T3.1.3: 验证 stryker 可运行
  命令: npx stryker run --dryRun
  预期: 输出 mutation 数量和预估时间
```

**验收标准**:
- `expect(fs.existsSync('stryker.conf.json')).toBe(true)`
- `expect(strykerConfig.mutate).toContain('src/lib/canvas/canvasStore.ts')`
- `expect(strykerConfig.mutate).toContain('src/stores/contextStore.ts')`
- `expect(strykerConfig.timeout).toBe(600000)`

---

### E3-S2: 核心 Store 突变测试执行 (2h)

```
T3.2.1: 运行突变测试
  命令: npx stryker run
  目标: kill rate >= 70%
  超时: 10min

T3.2.2: 分析 Survived 突变
  目标: 识别 kill rate < 70% 的测试路径
  操作:
    1. 阅读 reports/mutation/index.html 中的 survived 列表
    2. 判断: 是测试不足还是测试正确
    3. 对测试不足的路径补充 assertion

T3.2.3: 创建 docs/test-quality-report.md
  内容:
    ## 突变测试结果

    | Store | Kill Rate | Total | Killed | Survived |
    |-------|-----------|-------|--------|----------|
    | canvasStore | 75% | 100 | 75 | 25 |
    | contextStore | 80% | 50 | 40 | 10 |

    ## 测试有效性评分: 77%
```

**验收标准**:
- `expect(killRate).toBeGreaterThanOrEqual(0.70)`
- `expect(fs.existsSync('reports/mutation/mutation.json')).toBe(true)`
- `expect(fs.existsSync('docs/test-quality-report.md')).toBe(true)`

---

### E3-S3: 测试有效性验证报告 (1h)

```
T3.3.1: 对比覆盖率与有效性
  指标:
    1. Epic 3 行覆盖率: >= 80%
    2. E3 突变 kill rate: >= 70%
    3. 测试有效性评分 = kill rate (%)
  分析:
    覆盖率 ≠ 有效性，但 kill rate >= 70% 说明测试有实际防护能力

T3.3.2: 更新 docs/test-quality-report.md
  新增:
    ## 覆盖率 vs 有效性

    | 指标 | 值 | 状态 |
    |------|-----|------|
    | 行覆盖率 | 82% | ✅ >= 80% |
    | Kill Rate | 77% | ✅ >= 70% |
    | 测试有效性评分 | 77/100 | ✅ >= 70 |

  结论:
    Epic 3 覆盖率成果有效，测试套件具备真实缺陷检测能力。
```

**验收标准**:
- `expect(testQualityReport.effectivenessScore).toBeGreaterThanOrEqual(70)`
- `expect(report.coverageVsEffectiveness).toBeDefined()`

---

## 5. 测试策略

### 5.1 测试覆盖矩阵

| Epic | Story | 单元测试 | 集成测试 | E2E | 验收标准 |
|------|-------|---------|---------|-----|---------|
| E1 | S1 | Playwright config | E2E 运行验证 | 3次连续运行 | passRate >= 95% |
| E1 | S2 | — | report 解析脚本 | — | 输出 flaky 列表 |
| E1 | S3 | — | CI 集成验证 | 连续3次运行 | flaky <= 1 |
| E2 | S1 | Schema 生成脚本 | Schema 文件验证 | — | >= 3 schemas |
| E2 | S2 | Mock 对比 | Jest contract tests | — | >= 20 tests pass |
| E2 | S3 | — | CI gate 验证 | Schema 变更测试 | CI 正确阻断 |
| E3 | S1 | stryker 配置 | dryRun 验证 | — | kill rate >= 70% |
| E3 | S2 | 突变测试 | mutation.json | — | kill rate >= 70% |
| E3 | S3 | 有效性评分 | 覆盖率对比 | — | score >= 70 |

### 5.2 CI 集成方案

```
GitHub Actions Workflows:
1. playwright.yml (已有)
   - 添加 stability report step
   - 添加 contract test step (条件: test/schemas 变更)
   - 添加 mutation test step (条件: src/stores 变更, scheduled)

2. schema-contract-gate.yml (新增)
   - 触发: test/schemas/*.json 变更
   - 运行: npm run test:contract
```

---

## 6. 风险与缓解

| 风险 | 概率 | 影响 | 缓解 |
|------|------|------|------|
| stryker-mutator 与 Jest 29+ 不兼容 | 中 | 中 | 先在 dryRun 模式验证；备用方案 jest-mutate |
| 突变测试运行时间 > 10min | 中 | 低 | 限制 mutate 范围，不全量测试 |
| Schema 生成脚本覆盖不全 | 中 | 高 | 从 route tests fixtures 提取，覆盖率依赖现有测试 |
| Flaky 根因是代码 bug，非测试问题 | 高 | 中 | 识别后立即 report 给 dev，不阻塞 E1-S3 |
| Contract 测试误报（Schema 字段合理变更） | 低 | 中 | CI 失败仅在 Schema 变更但 mock 未同步时触发 |
