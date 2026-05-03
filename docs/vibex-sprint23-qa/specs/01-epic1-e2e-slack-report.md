# E1: E2E CI → Slack 报告链路 规格文档

**项目**: vibex-sprint23-qa
**Epic**: E1
**QA 阶段**: 功能验收
**上游产出**: prd.md (S1.1/S1.2), architecture.md §2, IMPLEMENTATION_PLAN.md §3

---

## UI 组件

| 组件 | 位置 | 说明 |
|------|------|------|
| 无前端 UI 组件 | — | E1 为 CI/CD 配置层，Slack 消息由 `scripts/e2e-summary-slack.ts` 在 CI 环境生成 |
| Slack #analyst-channel 消息 | 外部 | Block Kit 消息到达 Slack channel，用户在 Slack 端消费 |

**关键文件**:
- `.github/workflows/test.yml` — e2e job 末尾调用脚本
- `scripts/e2e-summary-slack.ts` — Block Kit 消息生成 + Webhook POST
- `playwright-report.json` — 输入数据源（CI 生成）

---

## 四态定义

### 1. 理想态

**描述**: E2E 测试完成后，`scripts/e2e-summary-slack.ts` 读取 Playwright JSON 报告，生成 Block Kit payload，POST 到 `SLACK_WEBHOOK_URL`，Slack #analyst-channel 收到结构化消息，含 pass/fail 摘要 + 失败用例列表。

**Slack 消息内容**:
```
📊 VibeX E2E 测试报告

✅ Passed: 47
❌ Failed: 2
⏭️  Skipped: 0
⏱️  耗时: 3m 24s

失败用例:
• auth.login.spec.ts → should show error on invalid credentials
• canvas.export.spec.ts → should export plantuml file
```

**验收 expect()**:

```typescript
// 1. CI workflow 调用脚本
expect(readFileSync('.github/workflows/test.yml', 'utf8'))
  .toContain('e2e:summary:slack');

// 2. 脚本存在
expect(existsSync('scripts/e2e-summary-slack.ts')).toBe(true);

// 3. 环境变量存在（CI 注入）
expect(process.env.SLACK_WEBHOOK_URL).toBeTruthy();

// 4. Block Kit 消息结构
expect(slackPayload.blocks).toBeDefined();
expect(slackPayload.blocks.some(b => b.type === 'section')).toBe(true);
expect(slackPayload.text).toMatch(/✅.*\d+|❌.*\d+/);

// 5. 失败用例列表存在（当 failed > 0）
if (failedCount > 0) {
  expect(slackPayload.blocks.some(b =>
    b.text?.text?.includes('Failed:') && b.text?.text?.includes('.spec.ts')
  )).toBe(true);
}

// 6. CI exit code 与 E2E 结果一致（CI 不会因报告脚本失败而失败）
expect(ciExitCode).toBe(e2eExitCode); // 或 always() 让 CI 通过
```

---

### 2. 空状态

**描述**: CI 未运行（无 push/PR trigger）或 E2E 测试无报告输出时，Slack 无消息送达。这是预期行为，不需要空状态 UI。

Slack 端用户看到无消息 = 系统处于静默状态，不代表错误。

**验收 expect()**:

```typescript
// CI 未触发时，不应有 Webhook 调用
// → 无需 expect()，由 CI trigger 控制

// 若 webhook 为空字符串（未配置），脚本应静默退出，不抛异常
expect(() => runE2eSummarySlack()).not.toThrow();
```

---

### 3. 加载态

**描述**: `e2e:summary:slack` 脚本在 CI 中执行时，需要完成：读取 JSON 报告 → 解析 pass/fail → 生成 Block Kit → POST Webhook。全过程在 CI job 末尾作为额外步骤执行，耗时约 3-5s。

**验收 expect()**:

```typescript
// 脚本执行期间 CI 状态显示 "Sending report..."
// （无实际 UI，由 CI log 可见）

// 脚本执行后 Webhook 收到 200 OK
expect(webhookResponse.status).toBe(200);

// Slack message 创建时间戳在 CI 结束后 5s 内
expect(slackMessage.timestamp).toBeGreaterThan(ciEndTime);
expect(slackMessage.timestamp - ciEndTime).toBeLessThan(10000); // 10s
```

---

### 4. 错误态

**覆盖场景**:

| 错误场景 | 处理策略 |
|---------|---------|
| Slack Webhook 不可用（404/403/timeout） | 脚本捕获异常，打印错误日志，**CI 仍通过**（`if: always()`） |
| `SLACK_WEBHOOK_URL` 未配置或为空 | 脚本静默跳过，不发送消息，CI 继续 |
| Playwright JSON 报告缺失 | 脚本输出警告，不阻塞 CI |
| Block Kit 格式错误 | Webhook 返回 400，脚本捕获，CI 仍通过 |

**引导文案**（CI log 输出）:
```
[warn] Slack webhook unavailable, skipping notification.
[warn] E2E report not found, skipping notification.
```

**验收 expect()**:

```typescript
// Slack webhook 失败时 CI 不应失败
describe('E1 error handling', () => {
  it('should not fail CI when Slack webhook is unavailable', async () => {
    const originalWebhookUrl = process.env.SLACK_WEBHOOK_URL;
    process.env.SLACK_WEBHOOK_URL = 'https://hooks.slack.com/fake';

    const ciResult = await runCI();
    expect(ciResult.exitCode).toBe(0); // CI 通过

    process.env.SLACK_WEBHOOK_URL = originalWebhookUrl;
  });

  it('should log warning when webhook is unavailable', async () => {
    const logs = await runScriptWithFakeWebhook();
    expect(logs).toContain('[warn] Slack webhook unavailable');
  });
});

// JSON 报告缺失时的处理
it('should not throw when playwright report is missing', () => {
  const logs = runScriptWithoutReport();
  expect(logs).toContain('[warn] E2E report not found');
});
```

---

## 页面情绪地图（老妈测试）

- **用户进入时的情绪**: "我在 Slack 里突然看到一个报告消息——哦，原来是 CI 跑完了。" 这是无缝的，不需要用户主动去查 CI 日志。
- **用户迷路时的引导**: 如果用户没看到消息（Slack 通知被静音），他会知道去问："CI 有没有跑完？" → 可以加一条 Slack reminder 或 channel description 说明 E2E 报告会在 CI 完成后自动推送。
- **用户出错时的兜底**: Slack 消息没到？用户打开 GitHub Actions 查看 E2E job log（`actions/runs`），报告脚本会在 log 中打印 `[warn]` 或 `[info]`。只要 CI 绿了，功能就是好的，报告只是锦上添花。

---

## 测试覆盖清单

| ID | 测试点 | 方法 |
|----|--------|------|
| E1-T1 | CI workflow 调用 e2e:summary:slack | 文件内容检查 |
| E1-T2 | 脚本解析 Playwright JSON 生成 Block Kit | 单元测试（mock JSON → assert payload） |
| E1-T3 | Webhook POST 格式正确 | Mock fetch + assert payload |
| E1-T4 | Slack 消息含 pass/fail 摘要 | 断言 blocks 结构 |
| E1-T5 | 失败用例列表正确显示 | 当 failed>0 时检查包含 `.spec.ts` 文字 |
| E1-T6 | Webhook 失败不阻塞 CI | CI exit code = 0 when webhook fails |
| E1-T7 | 无 SLACK_WEBHOOK_URL 时静默跳过 | 脚本不抛异常 |