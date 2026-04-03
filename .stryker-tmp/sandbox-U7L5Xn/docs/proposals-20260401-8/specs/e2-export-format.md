# Spec: E2 - 导出格式扩展

## F2.1: React Native 导出

### 验收
```typescript
test('导出面板包含 React Native 选项', async ({ page }) => {
  await page.goto('/canvas/export');
  const options = await page.locator('[data-testid="format-select"] option').allTextContents();
  expect(options).toContain('React Native');
});

test('React Native 代码可编译', async () => {
  const code = generateReactNativeCode();
  expect(() => babel.transform(code, { presets: ['@babel/preset-react'] })).not.toThrow();
});
```

### 【需页面集成】✅

---

## F2.2: WebP 导出

### 验收
```typescript
test('导出面板支持 WebP', async ({ page }) => {
  await page.goto('/canvas/export');
  const options = await page.locator('[data-testid="format-select"] option').allTextContents();
  expect(options).toContain('WebP');
});
```

### 【需页面集成】✅
