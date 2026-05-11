# Spec E5: Design Review E2E 补全

## 概述

补全 Design Review 功能的 E2E 测试覆盖，包括 MCP 降级路径测试和评审结果三 Tab 验证。

## 现状分析

- `design-review-mcp.spec.ts` 已存在（覆盖 POST → 200 + mcp.called）
- `design-review.spec.ts` 存在（覆盖 Ctrl+Shift+R 触发 real POST 的 E2E）
- `ReviewReportPanel` 存在于 DDSCanvasPage（第 711 行）
- **缺失**：MCP 503 降级路径测试 + 三 Tab 数据渲染验证

## S5.1 降级路径 E2E 测试

### 文件位置
`vibex-fronted/tests/e2e/design-review-degradation.spec.ts`

### 实现要求

```typescript
import { test, expect } from '@playwright/test';

test.describe('Design Review degradation path', () => {
  test('shows degradation message when MCP server returns 503', async ({ page }) => {
    // Mock MCP server returning 503
    await page.route('**/api/mcp/review_design', async (route) => {
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Service Unavailable' }),
      });
    });

    await page.goto('/canvas/test-canvas-001');

    // Trigger design review via keyboard shortcut
    await page.keyboard.press('Control+Shift+R');

    // Wait for degradation message
    await expect(page.getByText(/AI 评审暂时不可用/i))
      .toBeInTheDocument({ timeout: 5000 });

    // Should NOT show error page or crash
    await expect(page.locator('[data-testid="canvas-container"]'))
      .toBeInTheDocument();
  });

  test('MCP 503 response status is correctly mocked', async ({ page }) => {
    let receivedStatus: number | null = null;

    await page.route('**/api/mcp/review_design', async (route) => {
      receivedStatus = 503;
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Service Unavailable' }),
      });
    });

    await page.goto('/canvas/test-canvas-001');
    await page.keyboard.press('Control+Shift+R');
    await page.waitForTimeout(1000);

    expect(receivedStatus).toBe(503);
  });
});
```

---

## S5.2 评审结果三 Tab E2E 验证

### 文件位置
`vibex-fronted/tests/e2e/design-review-tabs.spec.ts`

### 实现要求

```typescript
import { test, expect } from '@playwright/test';

test.describe('Design Review report tabs', () => {
  test.beforeEach(async ({ page }) => {
    // Mock successful response with full report data
    await page.route('**/api/mcp/review_design', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          compliance: {
            score: 85,
            issues: ['Color contrast ratio 3.2:1, expected ≥4.5:1'],
          },
          accessibility: {
            score: 78,
            issues: ['Missing alt text on hero image'],
          },
          reuse: {
            score: 62,
            suggestions: ['Button component can be extracted as shared component'],
          },
        }),
      });
    });

    await page.goto('/canvas/test-canvas-001');
  });

  test('compliance tab renders with score', async ({ page }) => {
    await page.keyboard.press('Control+Shift+R');

    // Wait for review panel
    await expect(page.getByRole('tab', { name: /compliance/i }))
      .toBeInTheDocument();

    await page.getByRole('tab', { name: /compliance/i }).click();

    await expect(page.getByTestId('compliance-score')).toBeInTheDocument();
  });

  test('accessibility tab renders with issues', async ({ page }) => {
    await page.keyboard.press('Control+Shift+R');

    await page.getByRole('tab', { name: /accessibility/i }).click();

    await expect(page.getByTestId('a11y-issues-list')).toBeInTheDocument();
  });

  test('reuse tab renders with reuse score and suggestions', async ({ page }) => {
    await page.keyboard.press('Control+Shift+R');

    await page.getByRole('tab', { name: /reuse/i }).click();

    await expect(page.getByTestId('reuse-score')).toBeInTheDocument();
    await expect(page.getByTestId('reuse-suggestions')).toBeInTheDocument();
  });

  test('tab switching does not reload page', async ({ page }) => {
    await page.keyboard.press('Control+Shift+R');
    await page.waitForTimeout(500);

    // Record navigation count
    let navCount = 0;
    page.on('navigation', () => navCount++);

    await page.getByRole('tab', { name: /accessibility/i }).click();
    await page.waitForTimeout(200);

    expect(navCount).toBe(0); // No page reload on tab switch
  });
});
```

### 数据结构（Mock Response）

```typescript
interface DesignReviewReport {
  compliance: {
    score: number; // 0-100
    issues: string[];
  };
  accessibility: {
    score: number;
    issues: string[];
  };
  reuse: {
    score: number;
    suggestions: string[];
  };
}
```

---

## DoD 检查清单

- [ ] `design-review-degradation.spec.ts` 文件存在且 2 个测试通过
- [ ] MCP 503 时页面显示"AI 评审暂时不可用"文案（非白屏/非 500 错误）
- [ ] `design-review-tabs.spec.ts` 文件存在且 4 个测试通过
- [ ] compliance / accessibility / reuse 三个 tab 均可切换
- [ ] Tab 切换不触发页面刷新（前端状态切换）
- [ ] `data-testid` 节点（reuse-score / compliance-score / a11y-issues-list）在对应 tab 中存在
- [ ] TypeScript 类型检查通过
