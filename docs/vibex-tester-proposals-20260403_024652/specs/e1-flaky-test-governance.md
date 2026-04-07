# Spec: E1 Flaky Test 治理

**文件名**: `specs/e1-flaky-test-governance.md`
**Epic**: E1 — Flaky Test 治理
**优先级**: P0 | **工时**: 8h（1d）| **负责**: tester + dev

---

## 1. 目标

消除 E2E 测试不稳定噪声，将 E2E 通过率从 70-80% 提升至 ≥95%，flaky 测试数从 >5 个降至 ≤1 个。

---

## 2. 功能规格

### E1-S1: Playwright 配置优化

#### 技术规格

| 字段 | 值 |
|------|-----|
| 文件 | `playwright.config.ts` |
| 修改项 | `retries: 2`（CI 环境）；`workers: 1`（消除并行竞争）|
| 新增项 | 全局 `test.describe` 配置 `timeout: 30000`；JSON reporter 用于解析 |
| 条件判断 | 本地 `workers: 4`；CI 环境 `workers: 1` |

#### 代码示例

```typescript
// playwright.config.ts
const config: PlaywrightTestConfig = {
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 4,
  timeout: 30000,
  reporter: [
    ['list'],
    ['json', { outputFile: 'test-results/results.json' }],
  ],
  use: {
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },
};
```

#### 验收标准

```typescript
expect(config.retries).toBe(2);           // E1-S1-AC1
expect(config.workers).toBe(1);           // E1-S1-AC2
expect(config.timeout).toBe(30000);       // E1-S1-AC3
expect(config.reporter).toContain('json'); // E1-S1-AC4
```

---

### E1-S2: Stability Report 脚本

#### 技术规格

| 字段 | 值 |
|------|-----|
| 文件 | `scripts/test-stability-report.sh` |
| 输入 | `test-results/results.json`（Playwright JSON 报告）|
| 输出 | stdout 或 JSON 格式 stability 报告 |
| 功能 | 统计 passRate、flaky 测试名单（pass 但有 retry 的测试）、总运行次数 |

#### 报告格式

```json
{
  "timestamp": "2026-04-03T10:00:00Z",
  "total": 50,
  "passed": 48,
  "failed": 2,
  "passRate": 0.96,
  "flakyTests": [
    {
      "name": "canvas-phase2.spec.ts › drag node",
      "retries": 2,
      "finalStatus": "passed"
    }
  ],
  "runs": 3
}
```

#### 验收标准

```typescript
expect(fs.existsSync('scripts/test-stability-report.sh')).toBe(true); // E1-S2-AC1
const report = execSync('bash scripts/test-stability-report.sh --json');
const data = JSON.parse(report);
expect(data.passRate).toBeDefined();         // E1-S2-AC2
expect(data.flakyTests).toBeInstanceOf(Array); // E1-S2-AC3
expect(data.runs).toBeGreaterThanOrEqual(1);  // E1-S2-AC4
```

---

### E1-S3: E2E 稳定性监控集成

#### 技术规格

| 字段 | 值 |
|------|-----|
| 集成点 | HEARTBEAT daily report 或独立 `scripts/e2e-stability-report.ts` |
| 触发条件 | E2E 测试完成后自动执行 stability report |
| 告警阈值 | passRate < 0.95 或 flakyTests.length > 1 |
| 根因分类 | timing 问题（加 wait）vs 代码 bug（report 给 dev）|

#### 验收标准

```typescript
const stability = JSON.parse(execSync('bash scripts/test-stability-report.sh --json'));
expect(stability.passRate).toBeGreaterThanOrEqual(0.95);   // E1-S3-AC1
expect(stability.flakyTests.length).toBeLessThanOrEqual(1); // E1-S3-AC2
expect(stability.runs).toBeGreaterThanOrEqual(3);          // E1-S3-AC3
```

---

## 3. 验收清单

- [ ] E1-S1: `playwright.config.ts` 中 `retries: 2`, `workers: 1` 已生效
- [ ] E1-S1: 本地运行 `npx playwright test` 正常
- [ ] E1-S2: `scripts/test-stability-report.sh --json` 输出有效 JSON
- [ ] E1-S2: 报告包含 flaky 测试名单
- [ ] E1-S3: E2E 测试连续 3 次运行 passRate ≥ 95%
- [ ] E1-S3: flaky 测试数 ≤ 1
- [ ] E1-S3: stability report 输出在 daily report 中可见

---

## 4. 测试用例

| TC ID | 场景 | 输入 | 预期输出 |
|-------|------|------|----------|
| TC-E1-01 | Playwright CI 配置 | CI=true 环境变量 | retries=2, workers=1 |
| TC-E1-02 | Playwright 本地配置 | 无 CI 环境变量 | retries=0, workers=4 |
| TC-E1-03 | Stability report 执行 | 存在 test-results/results.json | 输出 passRate 和 flakyTests |
| TC-E1-04 | 稳定性基线 | 运行 3 次 E2E | passRate ≥ 95%, flaky ≤ 1 |
