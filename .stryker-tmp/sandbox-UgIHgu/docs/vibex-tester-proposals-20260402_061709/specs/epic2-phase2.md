# Epic 2: 建立 Playwright E2E 基础（Phase 2）

## Spec 规格

### S2.1: 配置 Playwright（chromium only）

**工时**: 0.5d  
**负责人**: tester

**修复方案**:

```javascript
// playwright.config.ts
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
  reporter: [['html'], ['list']],
})
```

**验收标准**:
- `expect(playwright.config.projects[0].use.browserName).toBe('chromium')`
- `npx playwright install chromium` 成功
- `npx playwright test` 在本地通过

---

### S2.2–S2.5: Canvas 核心交互 E2E 测试

**工时**: 1d（0.25d × 4）  
**负责人**: tester

#### T1: 验证 Canvas 三棵树加载

```typescript
// tests/e2e/canvas-tree-load.spec.ts
import { test, expect } from '@playwright/test'

test('T1: 三棵树（ContextTree / FlowTree / ComponentTree）均正常加载', async ({ page }) => {
  await page.goto('/canvas')
  await page.waitForLoadState('networkidle')
  
  await expect(page.locator('.context-tree')).toBeVisible()
  await expect(page.locator('.flow-tree')).toBeVisible()
  await expect(page.locator('.component-tree')).toBeVisible()
})
```

#### T2: 验证节点选择（单选 checkbox）

```typescript
// tests/e2e/canvas-node-select.spec.ts
import { test, expect } from '@playwright/test'

test('T2: 选择节点，验证同一时间只有一个 checkbox 被选中', async ({ page }) => {
  await page.goto('/canvas')
  await page.waitForLoadState('networkidle')

  // 初始状态：1 个 checkbox
  await expect(page.locator('.checkbox')).toHaveCount(1)

  // 点击节点
  await page.click('.node-item')
  await expect(page.locator('.checkbox.checked')).toHaveCount(1)

  // 点击另一个节点，第一个取消选中
  const nodes = page.locator('.node-item')
  const count = await nodes.count()
  if (count > 1) {
    await nodes.nth(1).click()
    await expect(page.locator('.checkbox.checked')).toHaveCount(1)
  }
})
```

#### T3: 验证节点确认反馈（isActive 状态变化）

```typescript
// tests/e2e/canvas-node-confirm.spec.ts
import { test, expect } from '@playwright/test'

test('T3: 确认节点，验证 isActive 状态正确切换', async ({ page }) => {
  await page.goto('/canvas')
  await page.waitForLoadState('networkidle')

  // 选择节点
  await page.click('.node-item')
  
  // 点击确认按钮
  await page.click('.confirm-btn')
  
  // 验证 isActive class
  await expect(page.locator('.node-item.active')).toHaveClass(/isActive/)
})
```

#### T4: 验证样式变更（黄色边框移除）

```typescript
// tests/e2e/canvas-style-change.spec.ts
import { test, expect } from '@playwright/test'

test('T4: 样式变更后，验证黄色边框正确移除', async ({ page }) => {
  await page.goto('/canvas')
  await page.waitForLoadState('networkidle')

  // 初始可能有黄色边框
  const node = page.locator('.node-item').first()
  
  // 触发样式变更
  await page.click('.style-change-btn')
  
  // 验证黄色边框移除
  await expect(node).not.toHaveClass(/yellow-border/)
})
```

---

### S2.6: 集成 Playwright E2E 到 CI

**工时**: 0.5d  
**负责人**: dev + tester

**修复方案**:

```yaml
# .github/workflows/e2e.yml
name: E2E Tests
on: [push, pull_request]
jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run dev &
        sleep 10
      - run: npx playwright test
```

**验收标准**:
- `expect(githubActionsWorkflow.jobs.e2e.steps).toContainEqual(expect.objectContaining({ run: expect.stringContaining('playwright test') }))`

---

### S2.7: 重构 canvasStore mock（Zustand fixture）

**工时**: 1d  
**负责人**: dev

**当前问题**: canvasStore mock 过重，导致测试脆弱。

**修复方案**:

```typescript
// tests/fixtures/canvasStore.fixture.ts
import { useCanvasStore } from '@/lib/canvas/canvasStore'

export const createMockCanvasStore = (initialState = {}) => {
  const mockNode = {
    id: 'node-1',
    label: 'Test Node',
    type: 'bounded-context' as const,
    isActive: false,
  }

  beforeEach(() => {
    useCanvasStore.setState({
      nodes: [mockNode],
      selectedNodeId: null,
      ...initialState,
    })
  })

  afterEach(() => {
    useCanvasStore.reset()
  })

  return { mockNode }
}
```

**验收标准**:
- `expect(useCanvasStore.getState().nodes).toEqual([])`
- `expect(useCanvasStore.setState({ nodes: [mockNode] })).toBeDefined()`
- 所有单元测试通过
