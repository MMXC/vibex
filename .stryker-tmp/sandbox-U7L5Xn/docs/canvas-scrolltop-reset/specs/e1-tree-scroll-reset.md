# Spec: E1 - 树面板 scrollTop 重置

## 概述
在 TreePanel 组件中添加 scrollTop 重置逻辑，折叠→展开时自动归零。

## F1.1: TreePanel useEffect

### 规格
- 文件: `TreePanel.tsx`
- 时机: `collapsed` 状态从 `true` → `false`
- 方式: `panelBodyRef.current.scrollTop = 0`

### 验收
```typescript
test('scrollTop resets when panel expands', async ({ page }) => {
  await page.goto('/canvas');
  
  // 滚动面板
  const panelBody = page.locator('[data-testid="tree-panel-body"]');
  await panelBody.evaluate(el => el.scrollTop = 200);
  
  // 折叠面板
  await page.click('[data-testid="collapse-btn"]');
  await page.waitForTimeout(100);
  
  // 展开面板
  await page.click('[data-testid="collapse-btn"]');
  await page.waitForTimeout(100);
  
  const scrollTop = await panelBody.evaluate(el => el.scrollTop);
  expect(scrollTop).toBe(0);
});
```

### 【需页面集成】✅

---

## F1.2: 三面板全部验证

### 规格
- 验证: BoundedContextTree / BusinessFlowTree / ComponentTree 全部生效

### 验收
```typescript
test('all three tree panels reset scrollTop', async ({ page }) => {
  await page.goto('/canvas');
  
  for (const panel of ['context', 'flow', 'component']) {
    const panelBody = page.locator(`[data-testid="tree-panel-body-${panel}"]`);
    await panelBody.evaluate(el => el.scrollTop = 150);
    await page.click(`[data-testid="collapse-${panel}"]`);
    await page.waitForTimeout(100);
    await page.click(`[data-testid="collapse-${panel}"]`);
    await page.waitForTimeout(100);
    const scrollTop = await panelBody.evaluate(el => el.scrollTop);
    expect(scrollTop).toBe(0);
  }
});
```

### 【需页面集成】✅
