# P001: E2E Slack 集成收尾规格文档

## UI 组件

- **组件名称**: Slack Webhook 配置面板 + CI Workflow 状态消息
- **主要文件路径**: `.github/workflows/e2e.yml`、`src/config/slack.ts`（CLI 配置层）

## 四态定义

### 1. 理想态

Slack 频道收到 E2E 测试报告，包含 pass/fail 摘要与失败用例列表。CI workflow 的 exit code 与 E2E 测试结果一致（失败时 exit code 为 1）。

```
expect(webhookPayload).toMatchObject({
  text: expect.stringMatching(/E2E.*(pass|fail)/i),
  attachments: expect.arrayContaining([
    expect.objectContaining({ color: expect.stringMatching(/success|failure/) })
  ])
})
expect(ciExitCode).toBe(testResult === 'fail' ? 1 : 0)
```

### 2. 空状态

CI workflow 未触发运行，Slack 无消息推送，属于预期行为，不显示任何警告。

```
expect(isWorkflowRunning).toBe(false)
expect(lastSlackMessage).toBeUndefined()
```

### 3. 加载态

Webhook 正在发送中，CLI 配置层无独立 UI 展示此状态，开发者通过 CI 日志观察进度。

```
expect(webhookStatus).toBe('sending')
expect(ciJobStatus).toBe('in_progress')
```

### 4. 错误态

**场景一：Webhook 未配置**
Slack 消息输出降级文案 `"[VibeX] webhook 未配置，跳过通知"`，CI job 仍通过（`if: always()` 保证）。

**场景二：Webhook 发送失败**
Slack 收到错误提示 `"[VibeX] E2E 通知发送失败，请检查 webhook 配置"`。

```
// 场景一
expect(webhookConfigured).toBe(false)
expect(ciJobExitCode).toBe(0)
expect(slackMessage).toBe('[VibeX] webhook 未配置，跳过通知')

// 场景二
expect(webhookStatus).toBe('failed')
expect(slackMessage).toContain('通知发送失败')
```