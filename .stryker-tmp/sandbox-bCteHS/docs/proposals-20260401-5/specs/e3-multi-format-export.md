# Spec: E3 - PNG/SVG 批量导出

## F3.1-F3.2: 导出面板增强

### 规格
- 导出面板增加 PNG/SVG 选择项
- 与现有 React/Vue/Svelte 框架选择并行

### 验收
```typescript
test('导出面板包含 PNG 选项', async ({ page }) => {
  await page.goto('/canvas/export');
  const options = await page.locator('[data-testid="format-select"] option').allTextContents();
  expect(options).toContain('PNG');
});

test('导出面板包含 SVG 选项', async ({ page }) => {
  await page.goto('/canvas/export');
  const options = await page.locator('[data-testid="format-select"] option').allTextContents();
  expect(options).toContain('SVG');
});
```

### 【需页面集成】✅

---

## F3.3-F3.4: 批量导出到 zip

### 规格
- 全部节点导出为 zip 文件
- 每个节点一个 PNG/SVG 文件

### 验收
```typescript
test('批量导出生成 zip 文件', async ({ page }) => {
  await page.goto('/canvas');
  await page.click('[data-testid="add-node"]');
  await page.click('[data-testid="add-node"]'); // 至少 2 个节点
  
  await page.goto('/canvas/export');
  await page.selectOption('[data-testid="format-select"]', 'PNG');
  await page.click('[data-testid="export-all-btn"]');
  
  const download = await page.waitForEvent('download');
  expect(download.suggestedFilename()).toMatch(/\.zip$/);
});

test('zip 包含所有节点文件', async ({ page }) => {
  const zip = new JSZip();
  const nodeCount = await page.locator('[data-testid="node"]').count();
  
  await exportAsZip(); // 触发导出
  const downloaded = await download();
  const content = await downloaded.json();
  
  // zip 中文件数量应等于节点数量
  const fileCount = Object.keys(content.files).length;
  expect(fileCount).toBe(nodeCount);
});
```

### 【需页面集成】✅
