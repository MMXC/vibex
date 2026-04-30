# Spec: E19-1-S4 — E2E 真实路径测试

**Story**: E19-1-S4
**验收标准**: AS4.1–AS4.3
**工时**: 0.5d

---

## 概述

补充 Playwright E2E 测试，确保 `tests/e2e/design-review.spec.ts` 验证的是真实 API 调用路径，而非 mock 数据。

---

## 测试用例

### TC1: 真实 API 调用验证

```typescript
test('Ctrl+Shift+R 触发真实 API 调用', async ({ page }) => {
  const fetchSpy = page.waitForRequest(req => req.url().includes('/api/mcp/review_design'));
  await page.keyboard.press('Control+Shift+R');
  const req = await fetchSpy;
  expect(req.method()).toBe('POST');
  expect(JSON.parse(req.postData() || '{}')).toHaveProperty('canvasId');
});
```

### TC2: 真实结果显示

```typescript
test('评审结果显示真实数据（非 mock）', async ({ page }) => {
  await page.goto('/canvas/test-canvas');
  await page.keyboard.press('Control+Shift+R');
  await page.waitForSelector('[data-testid="review-report"]', { timeout: 10000 });
  const text = await page.locator('[data-testid="review-report"]').textContent();
  // 验证不是预设的假数据 "Primary color does not meet WCAG AA"
  expect(text).not.toContain('Primary color does not meet WCAG AA contrast ratio (3.2:1');
});
```

### TC3: 优雅降级验证

```typescript
test('API 错误时显示降级文案', async ({ page }) => {
  await page.route('/api/mcp/review_design', route => route.fulfill({ status: 500 }));
  await page.goto('/canvas/test-canvas');
  await page.keyboard.press('Control+Shift+R');
  await expect(page.getByText(/暂时不可用/i)).toBeVisible({ timeout: 5000 });
});
```

---

## DoD

- [ ] TC1–TC3 全部通过 `pnpm playwright test`
- [ ] 测试文件无 `skip` / `only` 等临时标记
