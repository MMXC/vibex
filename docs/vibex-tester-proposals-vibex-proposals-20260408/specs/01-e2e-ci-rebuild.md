# Spec: Epic 1 — E2E CI 重建

**项目**: vibex-tester-proposals-vibex-proposals-20260408  
**Epic**: E2E CI 重建  
**工时**: 4.5 人天  
**Owner**: Tester Agent / Dev Agent  

---

## 1. 概述与目标

Epic 1 聚焦于恢复 E2E 测试在 CI 管道中的执行能力。当前 35+ E2E 测试因 `@ci-blocking` 标记全部被跳过，Playwright canvas-e2e 项目配置错误指向不存在的目录，导致 PR 合入完全没有自动化保障。本 Epic 目标是在 4.5 人天内重建完整的 E2E CI 能力。

## 2. Story S1.1: 修复 @ci-blocking E2E 测试

### 目标
将 `@ci-blocking` 标记数量从 35+ 降至 ≤10，恢复至少 10 个 E2E 测试到 CI 管道，pass rate ≥ 95%。

### 执行步骤

#### Step 1: 审计 @ci-blocking 使用情况
```bash
grep -rn "@ci-blocking" tests/ --include="*.ts" -A2
```
输出格式：
```
tests/e2e/conflict-resolution.spec.ts:42: // @ci-blocking
tests/e2e/undo-redo.spec.ts:15: // @ci-blocking
...
```

分类为：
- **可修复**: mock 数据不完整、环境配置问题、临时性跳过
- **不可修复**: 依赖真实 AI API、第三方服务、已知外部依赖

#### Step 2: 修复优先级排序
优先修复：
1. `tests/e2e/auth/register.spec.ts` — 注册流程（核心用户路径）
2. `tests/e2e/canvas-quality-ci.spec.ts` — Canvas 质量检查
3. `tests/e2e/vue-components.spec.ts` — Vue 组件集成
4. `tests/e2e/conflict-resolution.spec.ts` 中稳定可运行的用例

#### Step 3: 逐个修复
- 对于 mock 数据问题：补充 mock 数据或使用 MSW (见 Epic 3)
- 对于环境配置问题：修复 baseURL、timeout 配置
- 对于不稳定测试：添加 retries 或改用更稳定的等待模式
- 修复完成后：移除 `// @ci-blocking` 注释，改为 `// @flaky-known` + `skip-reasons.md` 记录

#### Step 4: 创建 skip-reasons.md
```markdown
# E2E Test Skip Reasons

## @flaky-known
| Test | Reason | Ticket | Review Date |
|------|--------|--------|-------------|
| conflict-resolution/real-time-merge | 依赖真实 WebSocket | JIRA-XXX | 2026-04-15 |
| auth/sso-login | 第三方 SSO 不稳定 | JIRA-YYY | 2026-04-22 |
```

#### Step 5: 验证
```bash
# 确认 @ci-blocking 数量下降
grep -r "@ci-blocking" tests/ --include="*.ts" | wc -l
# 期望: ≤ 10

# 运行 E2E 测试验证 pass rate
CI=true npx playwright test --reporter=dot --timeout=30000
# 期望: pass rate ≥ 95%
```

### 验收标准
- [ ] `@ci-blocking` 标记数量从 35+ 降至 ≤10
- [ ] 恢复的 E2E 测试 pass rate ≥ 95%（10 次运行中 ≥9 次通过）
- [ ] `skip-reasons.md` 存在且记录了所有跳过的测试原因
- [ ] `grepInvert` 规则仍生效（CI 跳过 @ci-blocking，正式运行不过滤）

---

## 3. Story S1.2: 修复 Playwright canvas-e2e 项目路径

### 目标
修正 `playwright.config.ts` 中 `canvas-e2e` 项目的 `testDir` 指向，使其与实际 Canvas E2E 测试目录一致。

### 当前状态
```typescript
// playwright.config.ts (错误的)
const config: PlaywrightTestConfig = {
  projects: [
    {
      name: 'canvas-e2e',
      testDir: './e2e', // ❌ 目录不存在
      use: { ... }
    }
  ]
};
```

### 修复方案
确认 Canvas E2E 测试实际位置：
```bash
find tests/ -name "*.spec.ts" | xargs grep -l "canvas\|Canvas" | head -20
```

根据实际情况调整 `playwright.config.ts`：
```typescript
const config: PlaywrightTestConfig = {
  projects: [
    {
      name: 'canvas-e2e',
      testDir: './tests/e2e', // 或 './tests/e2e/canvas/'
      testMatch: /.*canvas.*\.spec\.ts/,
      use: {
        baseURL: 'http://localhost:3000',
        trace: 'on-first-retry',
      }
    },
    {
      name: 'chromium',
      use: { ... }
    }
  ]
};
```

### 验收标准
- [ ] `npx playwright test --project=canvas-e2e --list` 无 "does not exist" 错误
- [ ] `npx playwright test --project=canvas-e2e` 正常运行（非报错）
- [ ] Canvas E2E 测试可独立于其他 E2E 测试单独运行

---

## 4. Story S1.3: 创建 GitHub Actions E2E workflow

### 目标
在 `.github/workflows/e2e.yml` 创建完整的 E2E CI workflow，支持 push/PR/schedule 触发，集成 Slack 通知。

### 文件结构
```
.github/workflows/
  e2e.yml
```

### e2e.yml 内容规范

```yaml
name: E2E Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  schedule:
    # 每周一至周五凌晨 2:00 UTC (= 10:00 CST)
    - cron: '0 2 * * 1-5'
  workflow_dispatch: # 手动触发

env:
  CI: true
  NODE_ENV: test

jobs:
  e2e:
    name: Playwright E2E
    timeout-minutes: 60
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Install Playwright browsers
        run: pnpm playwright install --with-deps chromium

      - name: Build application
        run: pnpm build
        env:
          NEXT_PUBLIC_API_URL: http://localhost:3000

      - name: Start dev server
        run: pnpm start &
        env:
          PORT: 3000
        timeout:
          wait: 30

      - name: Wait for server
        run: npx wait-on http://localhost:3000 --timeout 60000

      - name: Run E2E tests
        run: pnpm playwright test --reporter=list
        timeout:
          minutes: 30

      - name: Run stability report
        run: bash scripts/test-stability-report.sh

      - name: Upload stability report
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: stability-report
          path: daily-stability.md

      - name: Upload Playwright Report
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 14

      - name: Upload test results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: test-results
          path: test-results/
          retention-days: 7

      - name: Slack Notification
        if: failure()
        uses: slackapi/slack-github-action@v1.26.0
        with:
          channel-id: 'C0APZP2JX2L' # dev 频道
          slack-message: |
            :x: E2E CI Failed on ${{ github.ref_name }}
            :runner: <${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}|View Run>
            :chart_with_upwards_trend: <${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}/artifacts|View Report>
        env:
          SLACK_BOT_TOKEN: ${{ secrets.SLACK_BOT_TOKEN }}
```

### 验收标准
- [ ] `.github/workflows/e2e.yml` 文件存在
- [ ] workflow 在 push main 和 PR 时触发
- [ ] 包含 `schedule` 触发（每日）
- [ ] 包含 `workflow_dispatch` 手动触发
- [ ] 失败时发送 Slack 通知到 #dev 频道
- [ ] 上传 playwright-report 和 test-results artifacts
- [ ] 执行 `bash scripts/test-stability-report.sh`

---

## 5. Story S1.4: waitForTimeout 清理

### 目标
清除所有硬编码的 `waitForTimeout` 模式，替换为确定性等待。

### 扫描
```bash
grep -rn "waitForTimeout" tests/ --include="*.ts" -B2 -A2
```

### 替换规则

| 原模式 | 替换方案 |
|--------|---------|
| `waitForTimeout(500)` | `page.waitForLoadState('networkidle')` |
| `waitForTimeout(1000)` | `page.waitForResponse(predicate, { timeout: 1000 })` |
| `waitForTimeout(2000)` | `page.waitForSelector(selector, { state: 'visible', timeout: 2000 })` |
| `waitForTimeout(X)` 等待网络 | `page.waitForResponse(r => r.url().includes('api'), { timeout: X })` |
| `waitForTimeout(X)` 等待元素 | `page.waitForSelector(selector, { timeout: X })` |

### 示例

**Before:**
```typescript
await page.goto('/canvas/123');
await page.waitForTimeout(1000); // ❌ 非确定性
const canvas = page.locator('.canvas-container');
```

**After:**
```typescript
await page.goto('/canvas/123');
await page.waitForLoadState('networkidle');
const canvas = page.locator('.canvas-container');
await expect(canvas).toBeVisible(); // 确定性断言
```

### 验收标准
- [ ] `grep -rn "waitForTimeout" tests/ --include="*.ts" | grep -v "flaky-helpers\|FIXME\|comment"` 返回 0 条结果
- [ ] 所有被替换的等待逻辑在本地 `npx playwright test` 下仍能正常工作
- [ ] 无新增的 flaky 测试（相同测试运行 3 次均通过）

---

## 6. Story S1.5: 稳定性监控 CI 集成

### 目标
将 `scripts/test-stability-report.sh` 集成到 E2E CI，每次运行后自动更新 `daily-stability.md`。

### 当前 test-stability-report.sh 逻辑（推测）
```bash
#!/bin/bash
DATE=$(date +%Y-%m-%d)
PASS_RATE=$(npx playwright test --reporter=dot 2>&1 | grep -oP '\d+(?= passed)')
echo "| $DATE | $PASS_RATE |" >> daily-stability.md
```

### CI 集成
在 `.github/workflows/e2e.yml` 中添加步骤（见 S1.3）。

### daily-stability.md 格式
```markdown
# Daily Test Stability Report

## Daily Log

| Date | Pass Rate | Flaky | Notes |
|------|-----------|-------|-------|
| 2026-04-08 | 95% | 1/20 | Restored 10 @ci-blocking tests |
| 2026-04-07 | — | — | — |

## Trend (Last 7 Days)

...
```

### 验收标准
- [ ] `scripts/test-stability-report.sh` 在 E2E CI workflow 中执行
- [ ] `daily-stability.md` 包含当日运行记录（pass rate、flaky count）
- [ ] pass rate < 95% 或 flaky > 1 时，CI 失败并发送 Slack 告警
- [ ] 本地 `bash scripts/test-stability-report.sh` 可独立运行

---

## 7. 技术约束

1. **不破坏现有测试**: 所有修改必须保证现有通过的测试仍然通过
2. **向后兼容**: playwright.config.ts 的修改不能影响 `npx playwright test` 的默认行为
3. **幂等性**: test-stability-report.sh 可多次执行而不产生重复记录
4. **环境一致性**: GitHub Actions 环境与本地环境尽量一致（使用相同的 Node 版本、pnpm 版本）
5. **Secrets 管理**: SLACK_BOT_TOKEN 必须通过 GitHub Secrets 管理，不硬编码

## 8. 交付物清单

| 文件 | 类型 | 说明 |
|------|------|------|
| `.github/workflows/e2e.yml` | 新增 | E2E GitHub Actions workflow |
| `tests/skip-reasons.md` | 新增 | 跳过测试原因记录 |
| `daily-stability.md` | 修改 | 集成 CI 运行数据 |
| `playwright.config.ts` | 修改 | canvas-e2e 项目路径修复 |
| `tests/e2e/*.spec.ts` | 修改 | @ci-blocking 移除（多个文件）|

---

*Spec 由 PM Agent 生成于 2026-04-08*
