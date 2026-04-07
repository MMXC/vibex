# Spec: E1 - PNG/SVG 批量导出

## F1.1: PNG 导出选项

### 规格
- 导出面板增加 PNG 选项（与 React/Vue/Svelte 并列）
- 使用 html2canvas 截图

### 验收
```typescript
test('导出面板包含 PNG 选项', async ({ page }) => {
  await page.goto('/canvas/export');
  const options = await page.locator('[data-testid="format-select"] option').allTextContents();
  expect(options).toContain('PNG');
});
```

### 【需页面集成】✅

---

## F1.2: SVG 导出选项

### 规格
- SVG 原生导出（无损）
- React Flow 节点序列化

### 验收
```typescript
test('导出面板包含 SVG 选项', async ({ page }) => {
  await page.goto('/canvas/export');
  const options = await page.locator('[data-testid="format-select"] option').allTextContents();
  expect(options).toContain('SVG');
});
```

### 【需页面集成】✅

---

## F1.3: 批量 zip 导出

### 规格
- 导出全部节点为 zip 文件
- 每个节点一个 PNG/SVG 文件

### 验收
```typescript
test('批量导出生成 zip 文件', async ({ page }) => {
  await page.goto('/canvas/export');
  await page.selectOption('[data-testid="format-select"]', 'PNG');
  await page.click('[data-testid="export-all-btn"]');
  const download = await page.waitForEvent('download');
  expect(download.suggestedFilename()).toMatch(/\.zip$/);
});
```

### 【需页面集成】✅
