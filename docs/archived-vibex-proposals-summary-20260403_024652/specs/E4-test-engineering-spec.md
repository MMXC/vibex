# E4 Spec: 测试工程化

## S4.1 E2E Flaky 治理

### Playwright 配置变更
```js
// playwright.config.ts
export default defineConfig({
  retries: 2,        // CI 环境重试 2 次
  workers: 1,        // 并行度 1，消除 flaky
  timeout: 30000,
});
```

### Stability Report 脚本
```bash
#!/bin/bash
# scripts/test-stability-report.sh
npx playwright test --reporter=json > test-results.json
# 分析 flaky 测试并输出报告
```

## S4.2 API Contract 测试

### 核心 API Schema
```typescript
// POST /api/canvas/snapshots
const snapshotSchema = z.object({
  projectId: z.string().uuid(),
  data: z.object({
    boundedContexts: z.array(contextNodeSchema),
    businessFlows: z.array(flowNodeSchema),
    components: z.array(componentNodeSchema),
  }),
  version: z.number().int().nonnegative(),
});

// GET /api/canvas/snapshots/:id
const snapshotResponseSchema = snapshotSchema.extend({
  id: z.string().uuid(),
  createdAt: z.number(),
  updatedAt: z.number(),
});
```

### 校验流程
1. 前端 mock 数据通过 schema 校验
2. CI 中 contract tests 运行
3. schema 破坏 → CI 失败

## S4.3 auto-save E2E

### 测试用例
```typescript
// e2e/auto-save.spec.ts
test('编辑后 2s 自动保存', async ({ page }) => {
  await page.goto('/canvas');
  await page.locator('[data-node]').first().fill('test');
  await page.waitForResponse(
    r => r.url().includes('/api/canvas/snapshots') && r.status() === 200,
    { timeout: 5000 }
  );
});

test('页面离开前 beacon 触发', async ({ page }) => {
  // 使用 playwright evaluate 监听 sendBeacon
  const beaconCalls: string[] = [];
  await page.exposeFunction('__recordBeacon', (url: string) => beaconCalls.push(url));
  await page.evaluate(() => {
    const orig = navigator.sendBeacon.bind(navigator);
    navigator.sendBeacon = (url, data) => {
      (window as any).__recordBeacon(url);
      return orig(url, data);
    };
  });
  await page.close();
  expect(beaconCalls.some(u => u.includes('/api/canvas/snapshots'))).toBe(true);
});
```
