# Spec: E1 - Click Outside 监听

## F1.1-F1.3: 点击空白区域清空选中

### 验收
```typescript
test('click outside nodes clears selection', async ({ page }) => {
  await page.goto('/canvas');
  
  // 选中一个节点
  await page.click('[data-testid="node-card-1"]');
  
  // 点击空白区域
  await page.click('[data-testid="canvas-blank-area"]');
  
  // 验证选中已清空
  const selectedCount = await page.evaluate(() => 
    window.__canvasStore.getState().selectedNodeIds.length
  );
  expect(selectedCount).toBe(0);
});
```

### 【需页面集成】✅
