# E4 Spec: Flaky 测试治理

## S4.1 CI retries 配置
```typescript
// playwright.ci.config.ts
export default defineConfig({
  retries: 3,
  workers: 1,  // 消除并行不确定性
  timeout: 30000,
});
```

## S4.2 Flaky 检测脚本
```bash
#!/bin/bash
# scripts/flaky-detector.sh
for i in {1..10}; do
  npx playwright test --reporter=json >> results_$i.json
done
node scripts/analyze-flaky.js  # 输出 flaky-tests.json
```

## S4.3 Flaky 清单格式
```json
{
  "flakyTests": [
    {
      "name": "canvas-flow.spec.ts can add node",
      "passRate": 0.7,
      "runs": 10,
      "skip": true,
      "reason": "偶发超时"
    }
  ]
}
```
