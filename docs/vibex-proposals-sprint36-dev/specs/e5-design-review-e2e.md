# Spec E5: Design Review E2E 补全

## S5.1 降级路径 E2E 测试

### 实现位置
`vibex-fronted/tests/e2e/design-review-degradation.spec.ts`（新建）

### 四态定义（ReviewReportPanel — 降级场景）

| 状态 | 触发条件 | UI 表现 | 引导文案 |
|------|----------|--------|----------|
| 理想态 | MCP 返回 200，reviewData 存在 | 三个 tab 可切换，评分和详情正确显示 | — |
| 空状态（无评分数据）| reviewData 为空或 null | 显示空状态 | "暂无评分，请先生成设计评审" |
| 加载态 | 等待 MCP 响应 | 骨架屏占位（禁止转圈，会抖动）| — |
| 错误态（503）| MCP server 不可达 | 显示降级文案，Canvas 可继续编辑 | "AI 评审暂时不可用，请稍后重试" |
| 错误态（其他 5xx）| MCP 返回其他错误码 | 显示通用错误文案 | "评审失败，请重试或联系支持" |

### 实现要求

```typescript
// design-review-degradation.spec.ts

test('shows degradation message when MCP server returns 503', async ({ page }) => {
  await page.route('**/api/mcp/review_design', async (route) => {
    await route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Service Unavailable' }),
    });
  });

  await page.goto('/canvas/test-canvas-001');
  await page.keyboard.press('Control+Shift+R');

  // Degradation message visible — NOT a white screen or 500 error page
  await expect(page.getByText(/AI 评审暂时不可用/i))
    .toBeInTheDocument({ timeout: 5000 });

  // Canvas still functional — user can continue editing
  await expect(page.locator('[data-testid="canvas-container"]'))
    .toBeInTheDocument();
});

test('MCP 503 response status is correctly mocked', async ({ page }) => {
  let receivedStatus: number | null = null;

  await page.route('**/api/mcp/review_design', async (route) => {
    receivedStatus = 503;
    await route.fulfill({
      status: 503,
      body: JSON.stringify({ error: 'Service Unavailable' }),
    });
  });

  await page.goto('/canvas/test-canvas-001');
  await page.keyboard.press('Control+Shift+R');
  await page.waitForTimeout(1000);

  expect(receivedStatus).toBe(503);
});
```

---

## S5.2 评审结果三 Tab E2E 验证

### 实现位置
`vibex-fronted/tests/e2e/design-review-tabs.spec.ts`（新建）

### 四态定义（ReviewReportPanel — Tab 场景）

| 状态 | 触发条件 | UI 表现 | 引导文案 |
|------|----------|--------|----------|
| 理想态 | reviewData 完整（compliance/accessibility/reuse）| 三个 tab 存在，切换后数据显示正确 | — |
| 空状态（单个 tab 无数据）| 某个 tab 数据为空 | 该 tab 显示"暂无数据" | "暂无 [tabName] 数据" |
| 加载态 | Tab 切换时数据加载中 | 骨架屏（禁止转圈）| — |
| 错误态 | Tab 数据损坏 | 显示降级文案，该 tab 不可点击 | "数据加载失败" |

### 实现要求

```typescript
// design-review-tabs.spec.ts

test.describe('Design Review report tabs', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/mcp/review_design', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          compliance: { score: 85, issues: ['Color contrast issue'] },
          accessibility: { score: 78, issues: ['Missing alt text'] },
          reuse: { score: 62, suggestions: ['Button can be extracted'] },
        }),
      });
    });

    await page.goto('/canvas/test-canvas-001');
  });

  test('compliance tab renders with score', async ({ page }) => {
    await page.keyboard.press('Control+Shift+R');
    await expect(page.getByRole('tab', { name: /compliance/i })).toBeInTheDocument();
    await page.getByRole('tab', { name: /compliance/i }).click();
    await expect(page.getByTestId('compliance-score')).toBeInTheDocument();
  });

  test('reuse tab renders with score and suggestions', async ({ page }) => {
    await page.keyboard.press('Control+Shift+R');
    await page.getByRole('tab', { name: /reuse/i }).click();
    await expect(page.getByTestId('reuse-score')).toBeInTheDocument();
    await expect(page.getByTestId('reuse-suggestions')).toBeInTheDocument();
  });

  test('tab switching does not reload page', async ({ page }) => {
    await page.keyboard.press('Control+Shift+R');
    let navCount = 0;
    page.on('navigation', () => navCount++);
    await page.getByRole('tab', { name: /accessibility/i }).click();
    await page.waitForTimeout(200);
    expect(navCount).toBe(0); // No page reload
  });
});
```

---

## DoD 检查清单

- [ ] `design-review-degradation.spec.ts` 文件存在且 2 个测试通过
- [ ] MCP 503 时页面显示"AI 评审暂时不可用"文案（非白屏/非 500 错误）
- [ ] Canvas 在降级后仍可继续编辑（canvas-container 正常）
- [ ] `design-review-tabs.spec.ts` 文件存在且 4 个测试通过
- [ ] compliance / accessibility / reuse 三个 tab 均可切换
- [ ] Tab 切换不触发页面刷新（前端状态切换）
- [ ] `data-testid` 节点（reuse-score / compliance-score / a11y-issues-list）在对应 tab 中存在
- [ ] TypeScript 类型检查通过
- [ ] 四态定义完整（ReviewReportPanel — 降级 + Tab 场景）