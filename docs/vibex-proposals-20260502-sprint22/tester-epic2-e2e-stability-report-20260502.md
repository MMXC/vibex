# TESTER 阶段任务报告 — E2 E2E Stability

**Agent**: TESTER
**创建时间**: 2026-05-02 15:25 GMT+8
**报告路径**: `/root/.openclaw/vibex/docs/vibex-proposals-20260502-sprint22/tester-epic2-e2e-stability-report-20260502.md`
**Commit**: 714d2b42b

---

## 项目信息

| 字段 | 内容 |
|------|------|
| 项目 | vibex-proposals-20260502-sprint22 |
| 阶段 | tester-epic2-e2e-stability |
| 任务描述 | E2 E2E 稳定性监控：flaky monitor 脚本 + CI 集成 |
| 验收标准 | `e2e:flaky:monitor` 正确计算 flaky rate、追踪历史、发送 Slack 告警 |

---

## 任务领取

```
📌 领取任务: vibex-proposals-20260502-sprint22/tester-epic2-e2e-stability
👤 Agent: tester
⏰ 时间: 2026-05-02 15:25 GMT+8
🎯 目标: E2 E2E 稳定性监控验证
```

---

## 执行过程

### Step 1 — Commit 审计

```
commit 714d2b42b
Files changed: 3
  - scripts/e2e-flaky-monitor.ts  (+201 lines)
  - package.json                   (e2e:flaky:monitor script)
  - .github/workflows/test.yml     (flaky monitor CI step)
```

### Step 2 — 代码审计

已读取：
- `scripts/e2e-flaky-monitor.ts` — 全文件（201 行）
- `e2e/playwright.config.ts` — reporter 配置
- `.github/workflows/test.yml` — CI flaky monitor step

### Step 3 — TypeScript 检查

```bash
pnpm exec tsc --noEmit scripts/e2e-flaky-monitor.ts
```

**结果: ✅ 0 errors**

### Step 4 — 运行时验证（用 mock data）

#### TC-1: 正常场景（flaky rate 8.8% > 5%）

```json
// playwright-report/results.json
{ "stats": { "passed": 50, "failed": 5, "skipped": 2 } }
```

```
[e2e-flaky-monitor] Results: 50 passed, 5 failed, 2 skipped (total: 57)
[e2e-flaky-monitor] Flaky rate: 8.8%
[e2e-flaky-monitor] Alert condition met — sending Slack notification
[e2e-flaky-monitor] SLACK_WEBHOOK_URL not set — skipping alert
[e2e-flaky-monitor] Done
```
✅ **PASS** — 计算正确，flaky rate 正确识别

#### TC-2: ⚠️ 场景（flaky rate 3% < 5%，但历史全失败）

```json
// results.json: flakyRate = 3/(97+3) = 3.0%
// flaky-history.json: [0.03, 0.06, 0.10] — 最近3次均有失败
```

```
[e2e-flaky-monitor] Results: 97 passed, 3 failed, 0 skipped (total: 100)
[e2e-flaky-monitor] Flaky rate: 3.0%
[e2e-flaky-monitor] Alert condition met — sending Slack notification  ← BUG!
[e2e-flaky-monitor] SLACK_WEBHOOK_URL not set — skipping alert
[e2e-flaky-monitor] Done
```
🔴 **BUG REPRODUCED** — flaky rate 3.0% < 5%，不应告警但仍然告警

### Step 5 — 根因分析

**BUG #2: `shouldAlert` 条件反向**

```typescript
// scripts/e2e-flaky-monitor.ts:184
const shouldAlert =
  flakyRate > FLaky_RATE_THRESHOLD ||
  (stats.failed > 0 && history.runs.filter(r => r.failed === 0).length === 0);
```

第二部分的逻辑：
- `history.runs.filter(r => r.failed === 0)` — 找出**没有失败**的历史运行
- `.length === 0` — 当没有"没有失败"的运行时为 true
- 即：**所有历史运行都有失败**时触发

问题：
1. **首次失败时即告警** — history 为空或全部失败时 `length === 0`，立即触发告警
2. **与 `formatSlackAlert` 中的逻辑不一致** — `formatSlackAlert` 正确使用 `history.runs.slice(-3).every(r => r.failed > 0)` 检查最近3次，但 `shouldAlert` 却在检查全部历史

正确的 `shouldAlert` 连续失败条件应该是：
```typescript
const recent = history.runs.slice(-CONSECUTIVE_FAILURES_FOR_ALERT);
const consecutiveFailed = recent.length >= CONSECUTIVE_FAILURES_FOR_ALERT &&
  recent.every(r => r.failed > 0);
const shouldAlert = flakyRate > FLAKY_RATE_THRESHOLD || consecutiveFailed;
```

---

## 🔴 BUG #1 (CRITICAL): Playwright 未生成 JSON 报告

**位置**: `e2e/playwright.config.ts:10`

```typescript
reporter: 'list',
```

**问题**: `reporter: 'list'` 只输出到控制台，不生成 JSON 文件。

**影响**: `playwright-report/results.json` 永远不存在（除非手动创建）。

**证据**: `loadResults()` 在文件不存在时返回 `{passed: 0, failed: 0, skipped: 0}`，导致：

```typescript
if (total === 0) {
  console.log('[e2e-flaky-monitor] No test results found — skipping');
  return;  // ← 永远提前返回！
}
```

**实际行为**: flaky monitor 永远报 "No test results found" 并退出，**从未真正监控过 flaky rate**。

**修复建议**: `e2e/playwright.config.ts` 的 reporter 配置需要改为：
```typescript
reporter: [
  'list',
  ['json', { outputFile: 'playwright-report/results.json' }]
],
```

---

## 🔴 BUG #2: `shouldAlert` 连续失败检查逻辑反向

**位置**: `scripts/e2e-flaky-monitor.ts:184`

```typescript
const shouldAlert =
  flakyRate > FLaky_RATE_THRESHOLD ||
  (stats.failed > 0 && history.runs.filter(r => r.failed === 0).length === 0);
```

**正确逻辑**（参考 `formatSlackAlert`）:
```typescript
const recent = history.runs.slice(-CONSECUTIVE_FAILURES_FOR_ALERT);
const consecutiveFailed = recent.length >= CONSECUTIVE_FAILURES_FOR_ALERT &&
  recent.every(r => r.failed > 0);
const shouldAlert = flakyRate > FLaky_RATE_THRESHOLD || consecutiveFailed;
```

---

## 🟡 BUG #3: `FLaky_RATE_THRESHOLD` 命名拼写错误

**位置**: `scripts/e2e-flaky-monitor.ts:39`

```typescript
const FLaky_RATE_THRESHOLD = 0.05; // 5% — alert if >5% tests fail
```

应为 `FLAKY_RATE_THRESHOLD`（与 `FLAKY_REGISTRY_FILE` 命名一致）。TypeScript 不报错因为是 const 变量名。

---

## 测试结果汇总

| # | 验证项 | 预期 | 实际 | 状态 |
|---|--------|------|------|------|
| 1 | TypeScript 类型检查 | 0 errors | 0 errors ✅ | ✅ PASS |
| 2 | Flaky rate 计算 (50p/5f) | 8.8% | 8.8% ✅ | ✅ PASS |
| 3 | Alert 触发 (rate > 5%) | true | true ✅ | ✅ PASS |
| 4 | Alert 跳过 (rate < 5%, 无连续失败) | false | **true** | 🔴 FAIL |
| 5 | Playwright 生成 results.json | 存在 | **不存在** | 🔴 FAIL |
| 6 | CI 集成 (`test.yml` flaky step) | 存在 | 存在 ✅ | ✅ PASS |
| 7 | `e2e:flaky:monitor` script | 存在 | 存在 ✅ | ✅ PASS |
| 8 | `FLaky_RATE_THRESHOLD` 命名 | FLAKY | FLaky | 🟡 WARN |

---

## 结论

| 状态 | 说明 |
|------|------|
| ❌ **REJECTED — 产出不达标** | 2 个 CRITICAL bugs 导致功能无法工作 |

**失败原因**:
1. `e2e/playwright.config.ts` 使用 `reporter: 'list'`，不生成 `playwright-report/results.json`，导致 flaky monitor 永远报 "No test results found" 并提前退出
2. `shouldAlert` 的连续失败条件 `(stats.failed > 0 && history.runs.filter(r => r.failed === 0).length === 0)` 逻辑反向，导致 flaky rate < 5% 但历史有失败时误报

**通过验证**:
- ✅ Flaky rate 计算公式正确
- ✅ Alert 阈值 (5%) 正确
- ✅ Slack 格式化函数正确（使用 `recentFails.every(r => r.failed > 0)`）
- ✅ TypeScript 类型检查通过
- ✅ CI step 集成正确

**需要修复**:
- [ ] **CRITICAL**: 在 `e2e/playwright.config.ts` 的 `reporter` 中添加 `['json', { outputFile: 'playwright-report/results.json' }]`
- [ ] 修复 `shouldAlert` 的连续失败条件为：`history.runs.slice(-3).every(r => r.failed > 0)`
- [ ] 修正 `FLaky_RATE_THRESHOLD` 为 `FLAKY_RATE_THRESHOLD`

---

*报告生成时间: 2026-05-02 15:30 GMT+8*
*TESTER Agent | VibeX Sprint 22*
