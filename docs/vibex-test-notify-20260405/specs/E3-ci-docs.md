# E3: CI 集成文档 - 详细规格

## S3.1 CI 集成文档

### 目标
编写 `vibex-fronted/scripts/README.md`，说明 `--notify` 的用法和环境变量配置。

### 文档内容

```markdown
# VibeX Test Notify

测试结果 Slack 通知脚本。

## 用法

```bash
# 安装依赖（如果需要）
npm install

# 发送成功通知
node scripts/test-notify.js --status passed --duration 120s --tests 50

# 发送失败通知
node scripts/test-notify.js --status failed --duration 120s --tests 50 --errors 3
```

## 环境变量

| 变量 | 必填 | 说明 |
|------|------|------|
| `CI_NOTIFY_WEBHOOK` | 是 | Slack Incoming Webhook URL |
| `CI_NOTIFY_ENABLED` | 否 | `true` 启用通知，默认 `false` |
| `CI` | 否 | 设置为 `true` 时自动启用通知 |

## 本地开发

本地环境默认不发送通知。如需测试：

```bash
CI_NOTIFY_ENABLED=true CI_NOTIFY_WEBHOOK=https://hooks.slack.com/... \
  node scripts/test-notify.js --status passed --duration 1s --tests 10
```

## CI 集成示例

### GitHub Actions

```yaml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run tests
        run: npm test
        
      - name: Send notification
        if: always() # 无论成功失败都发送
        env:
          CI: true
          CI_NOTIFY_WEBHOOK: ${{ secrets.SLACK_WEBHOOK }}
        run: |
          STATUS="passed"
          if [ "${{ job.status }}" == "failed" ]; then
            STATUS="failed"
          fi
          node scripts/test-notify.js --status $STATUS --duration ${{ github.event.inputs.duration || '5m' }} --tests 100
```

### GitLab CI

```yaml
test:
  stage: test
  script:
    - npm ci
    - npm test
  after_script:
    - |
      if [ -n "$CI_NOTIFY_WEBHOOK" ]; then
        STATUS="passed"
        if [ "$CI_JOB_STATUS" == "failed" ]; then
          STATUS="failed"
        fi
        node scripts/test-notify.js --status $STATUS --duration $CI_PIPELINE_DURATION --tests 50
      fi
  variables:
    CI: "true"
  only:
    - main
    - merge_requests
```

## 去重机制

通知脚本内置 5 分钟去重机制：
- 相同状态的消息在 5 分钟内只发送一次
- 避免 CI 重试导致重复通知
- 缓存文件：`.dedup-cache.json`

## 故障排查

### 通知未发送

1. 检查 `CI_NOTIFY_WEBHOOK` 是否正确配置
2. 检查 `CI=true` 是否设置
3. 查看构建日志中的 `[Notify]` 前缀消息

### Webhook 错误

```
[Notify] All 4 attempts failed: HTTP 400: Bad Request
```

检查 Webhook URL 是否正确，是否有权限发送消息。

## API

### `test-notify.js`

```
--status <passed|failed>    测试状态
--duration <time>           测试耗时（如 120s, 2m）
--tests <number>            测试数量
--errors <number>           错误数量（可选，failed 时使用）
```
