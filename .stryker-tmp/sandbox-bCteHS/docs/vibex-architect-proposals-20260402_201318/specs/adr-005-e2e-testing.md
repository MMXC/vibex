# Spec: ADR-005 E2E 测试基础设施

**ADR**: ADR-005  
**Status**: 待实施  
**Sprint**: Sprint 1（Sprint 0 稳定后开始）

---

## 1. 背景

**问题**: E2E 覆盖率 ~0%，视觉回归无自动化，关键用户旅程无保障。

---

## 2. Playwright 配置

### 2.1 基础配置

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  baseURL: 'http://localhost:3000',
  timeout: 30000,
  retries: process.env.CI ? 2 : 0,
  reporter: [
    ['html'],
    ['list'],
  ],
  use: {
    headless: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
    actionTimeout: 5000,
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 60000,
  },
});
```

### 2.2 package.json scripts

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:debug": "playwright test --debug"
  }
}
```

---

## 3. 核心旅程测试

### 3.1 journey-create-context.spec.ts

**旅程**: 创建 BoundedContext → 勾选 → 导出

```typescript
import { test, expect } from '@playwright/test';

test.describe('Create Context Journey', () => {
  test('完整流程: 创建 → 勾选 → 导出', async ({ page }) => {
    // 1. 登录/访问首页
    await page.goto('/');
    
    // 2. 创建 BoundedContext
    await page.click('[data-testid="create-context-btn"]');
    await page.fill('[data-testid="context-name-input"]', 'Test Context');
    await page.click('[data-testid="confirm-create-btn"]');
    
    // 3. 验证节点出现
    await expect(page.locator('[data-testid="context-node-Test Context"]')).toBeVisible();
    
    // 4. 勾选节点
    await page.click('[data-testid="context-node-Test Context"] [data-testid="checkbox"]');
    
    // 5. 验证勾选状态
    await expect(page.locator('[data-testid="context-node-Test Context"]')).toHaveAttribute('data-selected', 'true');
    
    // 6. 导出
    await page.click('[data-testid="export-btn"]');
    await page.click('[data-testid="export-confirm-btn"]');
    
    // 7. 验证导出成功
    await expect(page.locator('[data-testid="export-success-toast"]')).toBeVisible();
  });
});
```

### 3.2 journey-generate-flow.spec.ts

**旅程**: 创建流程 → 多选 → 生成

```typescript
test.describe('Generate Flow Journey', () => {
  test('完整流程: 创建流程 → 多选节点 → 生成 Flow', async ({ page }) => {
    // 1. 创建多个 Context
    await setupTestContexts(page, 3);
    
    // 2. 创建 Flow
    await page.click('[data-testid="create-flow-btn"]');
    await page.fill('[data-testid="flow-name-input"]', 'Test Flow');
    await page.click('[data-testid="confirm-create-flow-btn"]');
    
    // 3. 多选节点 (Ctrl+Click)
    await page.keyboard.down('Control');
    await page.click('[data-testid="context-node-0"]');
    await page.click('[data-testid="context-node-1"]');
    await page.keyboard.up('Control');
    
    // 4. 验证多选状态
    const selectedCount = await page.locator('[data-selected="true"]').count();
    expect(selectedCount).toBe(2);
    
    // 5. 点击生成
    await page.click('[data-testid="generate-flow-btn"]');
    
    // 6. 等待生成完成
    await expect(page.locator('[data-testid="flow-generated-toast"]')).toBeVisible({ timeout: 30000 });
    
    // 7. 验证 Flow 节点出现
    await expect(page.locator('[data-testid="flow-node-Test Flow"]')).toBeVisible();
  });
});
```

### 3.3 journey-multi-select.spec.ts

**旅程**: Ctrl+Click 多选 → 级联勾选 → 批量操作

```typescript
test.describe('Multi-Select Journey', () => {
  test('Ctrl+Click 多选 + 级联勾选 + 批量操作', async ({ page }) => {
    // 1. 创建父子节点结构
    await setupNestedContexts(page);
    
    // 2. Ctrl+Click 多选
    await page.keyboard.down('Control');
    await page.click('[data-testid="parent-node"]');
    await page.click('[data-testid="child-node-1"]');
    await page.click('[data-testid="child-node-2"]');
    await page.keyboard.up('Control');
    
    // 3. 验证父节点显示 indeterminate 状态（部分子节点被选中）
    await expect(page.locator('[data-testid="parent-checkbox"]')).toHaveAttribute('data-indeterminate', 'true');
    
    // 4. 批量删除
    await page.click('[data-testid="batch-delete-btn"]');
    await page.click('[data-testid="confirm-delete-btn"]');
    
    // 5. 验证所有节点已删除
    await expect(page.locator('[data-testid="parent-node"]')).not.toBeAttached();
    await expect(page.locator('[data-testid="child-node-1"]')).not.toBeAttached();
  });
});
```

---

## 4. CI 集成

### 4.1 GitHub Actions

```yaml
# .github/workflows/e2e.yml
name: E2E Tests
on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - run: npm ci
      - run: npx playwright install --with-deps
      
      - name: Run E2E tests
        run: npm run test:e2e
        
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7
```

### 4.2 Pre-deploy Gate

```yaml
# land-and-deploy 配置中
e2e_gate:
  enabled: true
  command: "npm run test:e2e"
  timeout: 300
  blocking: true
  required_coverage: 60
```

---

## 5. 覆盖率目标

| 旅程 | 路径覆盖目标 | 关键节点 |
|------|------------|---------|
| journey-create-context | ≥ 60% | 创建/勾选/导出 |
| journey-generate-flow | ≥ 60% | 创建/多选/生成 |
| journey-multi-select | ≥ 60% | Ctrl+Click/级联/批量 |

**总计**: 3 个核心旅程 ≥ 60% 覆盖

---

## 6. 验收标准

- [ ] Playwright 配置完成，`npm run test:e2e` 可执行
- [ ] 3 个核心旅程 spec 文件创建
- [ ] 3 个核心旅程测试通过
- [ ] CI 中 pre-deploy gate 生效，失败阻断部署
- [ ] 覆盖率报告生成（≥ 60%）
- [ ] 测试失败自动生成截图和 trace

---

## 7. 未来扩展

- 移动端响应式测试（Playwright device emulation）
- 性能测试（LCP, FID, CLS）
- 视觉回归测试（Percy/Playwright screenshot）
