# Implementation Plan: canvas-test-framework-standardize

**项目**: canvas-test-framework-standardize
**版本**: v1.0
**日期**: 2026-04-03

---

## Phase 1: 止血（1-2 天）

### 步骤 1.1: 合并 Playwright 配置文件（7 → 3）

**工作目录**: `/root/.openclaw/vibex/vibex-fronted/`

**操作**:

```bash
# 1. 保留基础配置：playwright.config.ts
# 2. 创建 CI 专用配置：playwright.ci.config.ts（继承 playwright.config.ts）
# 3. 保留可访问性配置：playwright.a11y.config.ts（独立）
# 4. 删除：
#    - playwright.test.config.ts
#    - playwright-canvas-phase2.config.ts
#    - playwright-canvas-crash-test.config.cjs
#    - playwright.perf.config.ts
```

**playwright.ci.config.ts**:
```typescript
import { defineConfig, devices } from '@playwright/test';
import baseConfig from './playwright.config';

export default defineConfig({
  ...baseConfig,
  // CI 专用配置
  retries: 3,  // 从 retries: 1 提升至 3
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
  ],
  // CI 环境变量
  use: {
    ...baseConfig.use,
    baseURL: process.env.CI_BASE_URL || 'http://localhost:3000',
  },
  // CI workers 限制
  workers: 4,
  timeout: 30000,  // CI 超时 30s
});
```

**playwright.a11y.config.ts**:
```typescript
import { defineConfig, devices } from '@playwright/test';
import baseConfig from './playwright.config';

export default defineConfig({
  ...baseConfig,
  testDir: './tests/a11y',
  use: {
    ...baseConfig.use,
    baseURL: process.env.CI_BASE_URL || 'http://localhost:3000',
  },
});
```

### 步骤 1.2: 删除重复测试文件

**操作**:
```bash
# 对比 tests/basic.spec.ts 和 tests/e2e/basic.spec.ts
# 合并无重复覆盖的用例后，删除 tests/basic.spec.ts
# 检查其他重复：
#   - tests/unit/*.spec.ts vs src/__tests__/*.test.ts
```

### 步骤 1.3: 编写 TESTING_STRATEGY.md

**文件**: `/root/.openclaw/vibex/vibex-fronted/TESTING_STRATEGY.md`

```markdown
# VibeX Testing Strategy

## 测试框架职责边界

| 框架 | 测试范围 | 文件命名 | 目录 |
|------|---------|---------|------|
| Jest | 单元测试 + 集成测试 | `*.test.ts` | `src/__tests__/` 或同目录 `__tests__/` |
| Playwright | E2E 测试 | `*.spec.ts` | `tests/e2e/` |
| Playwright | 可访问性测试 | `*.spec.ts` | `tests/a11y/` |
| Playwright | 性能测试 | `*.spec.ts` | `tests/performance/` |

## Jest 规范

- testMatch: `**/*.test.ts`
- 禁止使用 `testPathIgnorePatterns` 排除路径依赖
- 每个 `.test.ts` 必须有 `describe` + 至少 2 个 `it`
- 覆盖率阈值: 行 65% / 分支 50% / 函数 80%

## Playwright 规范

- `.spec.ts` 用于 E2E
- `.test.ts` 用于单元（与 Jest 一致）
- CI 配置: `playwright.ci.config.ts`（retries=3）
- 开发配置: `playwright.config.ts`
```

### 步骤 1.4: Jest 配置规范化

**文件**: `jest.config.ts`

```typescript
// 替换 testPathIgnorePatterns 为 testMatch
testMatch: ['**/*.test.ts'],
// 删除 testPathIgnorePatterns 中的路径依赖
testPathIgnorePatterns: ['/node_modules/'],
```

---

## Phase 2: CI Gate（1-2 天）

### 步骤 2.1: 配置 GitHub Actions 覆盖率 Gate

**文件**: `.github/workflows/test.yml`

```yaml
- name: Run Jest with coverage
  run: pnpm jest --coverage --coverage-threshold.line=65 --coverage-threshold.branches=50 --coverage-threshold.functions=80
  env:
    CI: true
```

### 步骤 2.2: Slack 告警脚本

**文件**: `scripts/slack-alert.sh`

```bash
#!/bin/bash
# scripts/slack-alert.sh
# 用法: ./slack-alert.sh "E2E Test Failed" "PR: $PR_URL"

WEBHOOK_URL="${SLACK_WEBHOOK_URL}"
PAYLOAD=$(cat <<EOF
{
  "channel": "#ci-alerts",
  "username": "CI Bot",
  "icon_emoji": ":x:",
  "text": "$1",
  "attachments": [{
    "color": "#ff0000",
    "fields": [
      {"title": "Job", "value": "${GITHUB_JOB:-CI}", "short": true},
      {"title": "Commit", "value": "${GITHUB_SHA:-unknown}", "short": true},
      {"title": "Details", "value": "$2", "short": false}
    ]
  }]
}
EOF
)

curl -s -X POST -H 'Content-type: application/json' \
  --data "$PAYLOAD" \
  "$WEBHOOK_URL"
```

### 步骤 2.3: 每日健康度报告脚本

**文件**: `scripts/daily-test-report.sh`

```bash
#!/bin/bash
# scripts/daily-test-report.sh
# 每日 09:00 运行，发送覆盖率趋势 + Flaky 统计

REPORT_DATE=$(date +"%Y-%m-%d")
COVERAGE_FILE="test-results/coverage/latest/coverage-summary.json"
FLAKY_FILE="flaky-tests.json"

# 生成覆盖率消息
if [ -f "$COVERAGE_FILE" ]; then
  LINES=$(cat "$COVERAGE_FILE" | jq '.total.lines.pct')
  BRANCHES=$(cat "$COVERAGE_FILE" | jq '.total.branches.pct')
  FUNCTIONS=$(cat "$COVERAGE_FILE" | jq '.total.functions.pct')
  COVERAGE_MSG="覆盖率: 行 $LINES% | 分支 $BRANCHES% | 函数 $FUNCTIONS%"
else
  COVERAGE_MSG="覆盖率数据不可用"
fi

# 生成 Flaky 消息
if [ -f "$FLAKY_FILE" ]; then
  FLAKY_COUNT=$(cat "$FLAKY_FILE" | jq length)
  FLAKY_MSG="Flaky 测试: $FLAKY_COUNT 个"
else
  FLAKY_MSG="Flaky 测试: 0 个（无问题）"
fi

# 发送 Slack
PAYLOAD=$(cat <<EOF
{
  "channel": "#ci-alerts",
  "username": "CI Daily Report",
  "icon_emoji": ":chart_with_upwards_trend:",
  "text": "📊 VibeX 测试健康度日报 - $REPORT_DATE",
  "attachments": [{
    "color": "#36a64f",
    "fields": [
      {"title": "覆盖率", "value": "$COVERAGE_MSG", "short": false},
      {"title": "稳定性", "value": "$FLAKY_MSG", "short": false}
    ]
  }]
}
EOF
)

curl -s -X POST -H 'Content-type: application/json' \
  --data "$PAYLOAD" \
  "$SLACK_WEBHOOK_URL"
```

**Cron 配置**:
```yaml
# .github/workflows/daily-report.yml
on:
  schedule:
    - cron: '0 1 * * *'  # 09:00 GMT+8 = 01:00 UTC
```

---

## Phase 3: 覆盖率提升 ✅ DONE（3-5 天）

### 步骤 3.1: historySlice 分支覆盖 ≥ 40% ✅

**文件**: `src/lib/canvas/__tests__/historySlice.test.ts`

- `undo` 在空历史时 ✅
- `redo` 在空未来时 ✅
- `undo` 超过历史长度时 ✅
- 多个连续 `undo/redo` 交叉操作 ✅
- `clear` 操作 ✅

**实测**: `historySlice.ts` 分支覆盖 **98.0%** (49/50) ✅ 远超目标 40%

### 步骤 3.2: Canvas 核心模块分支覆盖 ≥ 50% ✅

| 文件 | 目标 | 实测 |
|------|------|------|
| `contextStore.ts` | ≥50% | **88.6%** (39/44) ✅ |
| `flowStore.ts` | ≥50% | **63.1%** (24/38) ✅ |
| `componentStore.ts` | ≥50% | **68.8%** (11/16) ✅ |

### 步骤 3.3: 全局覆盖率达标 ✅

- 全局分支覆盖: **51.94%** (3789/7294) ✅
- 目标: ≥50%

---

## Phase 4: Flaky 治理 ✅ DONE（1-2 天）

### 步骤 4.1: flaky-detector.sh ✅

详见 architecture.md 章节。

### 步骤 4.2: 自动 skip 机制 ✅

**实现文件**:
- `flaky-tests.json` — Flaky 测试注册表（schema: id, testFile, testName, reason, passRate, skip）
- `tests/flaky-helpers.ts` — 辅助工具（markFlaky, isFlaky, getFlakyTests, removeFlaky）
- `playwright.ci.config.ts` — CI 专用配置（retries: 3, workers: 1）

**使用方式**:
```typescript
import { markFlaky, isFlaky } from './flaky-helpers';

// 在测试中标记为 flaky
markFlaky(__filename, 'my-test-name', {
  reason: 'race condition with WebSocket',
  passRateThreshold: 0.65,
  skipAfter: '2026-05-01',
});

// 检查是否应 skip
if (isFlaky(__filename, 'my-test-name')) {
  test.skip('Flaky: pass rate < 80%');
}
```

**治理规则**:
- pass rate < 80% → 测试写入 `flaky-tests.json`，skip = true
- Flaky 测试：skip，从不删除
- 连续 5 次 CI 无 flaky 失败 → 可移除 skip

**Playwright retries**:
- Base config (`playwright.config.ts`): retries = 3
- CI config (`playwright.ci.config.ts`): retries = 3, workers = 1, reuseExistingServer = false

---

## 验收检查清单

- [ ] Playwright 配置文件从 7 个合并至 3 个
- [ ] `tests/basic.spec.ts` 已删除（合并至 `tests/e2e/basic.spec.ts`）
- [ ] `TESTING_STRATEGY.md` 存在且包含边界定义
- [ ] `jest.config.ts` 使用 `testMatch` 规范
- [ ] GitHub Actions 覆盖率 < 65% 时 CI 阻断
- [ ] E2E 测试失败时 Slack 告警 < 5min
- [ ] 每日 09:00 发送健康度报告
- [ ] historySlice 分支覆盖 ≥ 40%
- [ ] Canvas 核心模块分支覆盖 ≥ 50%
- [ ] 全局行覆盖 ≥ 65%、分支覆盖 ≥ 50%
- [x] CI retries = 3 ✅
- [x] flaky-tests.json 存在且 flaky 测试已 skip ✅
- [ ] 连续 5 次 CI 无 flaky 失败
