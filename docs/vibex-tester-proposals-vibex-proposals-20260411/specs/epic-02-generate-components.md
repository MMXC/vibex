# Epic 2: generate-components flowId E2E 测试

**Epic ID**: E2
**项目**: vibex-tester-proposals-vibex-proposals-20260411
**优先级**: P0
**工时**: 2h
**关联 Features**: F4
**关联 T-P0-4**: generate-components flowId 修复无 E2E 验证

---

## 1. Story: E2-S1 — 创建 ai-generate-components.spec.ts

### 上下文

2026-04-06 的 P0 修复了 `generate-components` 的 `flowId` 缺失问题（flowId 用于追踪 AI 生成请求链路），但该修复**没有对应的 E2E 测试验证**。本次需补充测试覆盖，确保 flowId 正确传递。

### 测试文件位置

`vibex-fronted/tests/e2e/ai-generate-components.spec.ts`

### 测试内容

#### 测试 1: flowId 存在于请求 body 中

验证 AI 生成组件时，请求 body 包含 `flowId` 字段。

```ts
test('generate-components should include flowId in request body', async ({ page }) => {
  await page.goto('/canvas');

  const [request] = await Promise.all([
    page.waitForRequest(/\/api\/.*generate-components/),
    page.click('[data-testid="generate-components-btn"]'),
    page.fill('[data-testid="requirement-input"]', '生成一个登录表单'),
    page.click('[data-testid="generate-submit"]'),
  ]);

  const postData = request.postData();
  expect(postData).toBeDefined();
  const body = JSON.parse(postData);
  expect(body.flowId).toBeDefined();
});
```

#### 测试 2: flowId 为 UUID v4 格式

验证 flowId 符合 UUID v4 规范（用于唯一追踪）。

```ts
test('generate-components flowId should be UUID v4 format', async ({ page }) => {
  await page.goto('/canvas');

  const [request] = await Promise.all([
    page.waitForRequest(/\/api\/.*generate-components/),
    page.click('[data-testid="generate-components-btn"]'),
    page.fill('[data-testid="requirement-input"]', '生成一个登录表单'),
    page.click('[data-testid="generate-submit"]'),
  ]);

  const body = JSON.parse(request.postData());
  // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
  expect(body.flowId).toMatch(
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
  );
});
```

#### 测试 3: 多次请求生成不同的 flowId

验证每次生成请求使用独立的 flowId。

```ts
test('generate-components should use unique flowId per request', async ({ page }) => {
  await page.goto('/canvas');
  await page.click('[data-testid="generate-components-btn"]');
  await page.fill('[data-testid="requirement-input"]', '生成登录表单');
  await page.click('[data-testid="generate-submit"]');

  const [req1] = await Promise.all([
    page.waitForRequest(/\/api\/.*generate-components/),
  ]);

  // Clear and send second request
  await page.click('[data-testid="generate-components-btn"]');
  await page.fill('[data-testid="requirement-input"]', '生成注册表单');
  await page.click('[data-testid="generate-submit"]');

  const [req2] = await Promise.all([
    page.waitForRequest(/\/api\/.*generate-components/),
  ]);

  const body1 = JSON.parse(req1.postData());
  const body2 = JSON.parse(req2.postData());
  expect(body1.flowId).not.toBe(body2.flowId);
});
```

#### 测试 4: flowId 响应中也被返回（可选，验证追踪链路）

```ts
test('generate-components response should include flowId for tracing', async ({ page }) => {
  await page.goto('/canvas');

  const [response] = await Promise.all([
    page.waitForResponse(/\/api\/.*generate-components/),
    page.click('[data-testid="generate-components-btn"]'),
    page.fill('[data-testid="requirement-input"]', '生成登录表单'),
    page.click('[data-testid="generate-submit"]'),
  ]);

  const json = await response.json();
  expect(json.flowId).toBeDefined();
  expect(json.flowId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
});
```

### 数据属性要求

为确保测试能正确定位元素，Canvas 页面需提供以下 `data-testid`：

| testid | 元素 | 用途 |
|--------|------|------|
| `generate-components-btn` | AI 生成按钮 | 触发生成流程 |
| `requirement-input` | 需求输入框 | 输入生成需求文本 |
| `generate-submit` | 提交按钮 | 提交生成请求 |

### 验收标准

```ts
// 验收 1: 测试文件存在
const specExists = existsSync('tests/e2e/ai-generate-components.spec.ts');
expect(specExists).toBe(true);

// 验收 2: 测试能被 Playwright 发现
const listResult = execSync(
  'npx playwright test ai-generate-components.spec.ts --list 2>&1',
  { cwd: 'vibex-fronted' }
).toString();
expect(listResult).toContain('flowId');
expect(listResult).not.toContain('0 tests');

// 验收 3: 测试在 CI 环境下能通过
// （flowId 已在 20260406 修复，应为绿色）
const ciResult = execSync(
  'CI=true npx playwright test ai-generate-components.spec.ts --reporter=line 2>&1',
  { cwd: 'vibex-fronted', timeout: 60000 }
).toString();
expect(ciResult).not.toContain('FAILED');
expect(ciResult).toContain('passed');
```

### 依赖

- E1-S1/S2（CI 配置正确）— 必须先完成，否则 CI 无法运行此测试
- Canvas 页面 `/canvas` 已可访问
- `generate-components` API endpoint 存在
- `data-testid` 属性已在 Canvas 组件上添加（需协调 dev）
