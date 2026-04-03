# Spec: E4 - 键盘快捷键全覆盖

## F4.1: Ctrl+Shift+C 确认卡片

### 验收
```typescript
test('Ctrl+Shift+C confirms card', async ({ page }) => {
  await page.goto('/canvas');
  await page.keyboard.press('Control+Shift+c');
  const confirmed = await page.evaluate(() => store.getState().lastConfirmed);
  expect(confirmed).toBe(true);
});
```

### 【需页面集成】✅

---

## F4.2: Ctrl+Shift+G 生成上下文

### 验收
```typescript
test('Ctrl+Shift+G generates context', async ({ page }) => {
  await page.goto('/canvas');
  await page.keyboard.press('Control+Shift+g');
  const contextCount = await page.evaluate(() => store.getState().contextNodes.length);
  expect(contextCount).toBeGreaterThan(0);
});
```

### 【需页面集成】✅

---

## F4.3: / 唤起命令面板

### 验收
```typescript
test('/ opens command panel', async ({ page }) => {
  await page.goto('/canvas');
  await page.keyboard.press('/');
  const panelVisible = await page.locator('[data-testid="command-panel"]').isVisible();
  expect(panelVisible).toBe(true);
});
```

### 【需页面集成】✅
