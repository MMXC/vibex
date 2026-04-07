# E2 Spec: CI 质量门禁

## S2.1 覆盖率阈值配置

```yaml
# .github/workflows/test.yml
- name: Test and Coverage
  run: npm test -- --coverage --coverageThreshold='{"global":{"lines":65,"branches":50}}'
```

## S2.2 Slack 告警

```typescript
// scripts/slack-alert.ts
const payload = {
  channel: '#ci-alerts',
  text: `❌ E2E Test Failed`,
  blocks: [{
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `*Project*: ${process.env.GITHUB_REPO}\n*Commit*: ${process.env.GITHUB_SHA}\n*Failed*: ${failedTests.length} tests`
    }
  }]
};
```

## S2.3 健康度报告

```typescript
// scripts/health-report.ts
// 每日 09:00 GMT+8 发送
const report = {
  date: new Date().toISOString(),
  coverage: getCoverageSummary(),
  flakyRate: getFlakyStats(),
  ciPassRate: getCIPassRate(),
};
// 发送到 Slack #ci-alerts
```
