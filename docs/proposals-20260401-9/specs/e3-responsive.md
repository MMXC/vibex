# Spec: E3 - 响应式布局与移动端体验

## F3.1: 768px 断点

### 验收
```typescript
test('768px breakpoint shows 2 columns', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto('/canvas');
  const layout = await page.evaluate(() => getComputedLayout());
  expect(layout.columns).toBe(2);
});
```

### 【需页面集成】✅

---

## F3.2: 375px 断点

### 验收
```typescript
test('375px breakpoint shows 1 column with tabs', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/canvas');
  const layout = await page.evaluate(() => getComputedLayout());
  expect(layout.columns).toBe(1);
  expect(layout.hasTabs).toBe(true);
});
```

### 【需页面集成】✅
