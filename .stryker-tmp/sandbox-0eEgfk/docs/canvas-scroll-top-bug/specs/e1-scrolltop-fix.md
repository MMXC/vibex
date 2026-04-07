# Spec: E1 - scrollTop 归零修复

## 概述
修复页面切换时 `canvasContainer.scrollTop` 未归零导致的工具栏不可见问题。

## F1.1: scrollTop 归零修复

### 问题
从「需求输入」切换到「画布」模式时，`canvasContainer.scrollTop = 946`，导致顶部工具栏被推出视口。

### 规格
- 时机: canvas 组件 mount 时（`useEffect`）
- 目标: `canvasContainer.scrollTop = 0`
- 方式: `document.querySelector('[class*=canvasContainer]')?.scrollTo(0, 0)`

### 验收
```typescript
// canvas-scroll.spec.ts
test('scrollTop is 0 after switching to canvas', async ({ page }) => {
  await page.goto('/');
  // 滚动需求输入页
  await page.evaluate(() => window.scrollTo(0, 500));
  // 切换到画布
  await page.click('[data-testid="switch-to-canvas"]');
  await page.waitForURL('**/canvas');
  
  const scrollTop = await page.evaluate(() => {
    const container = document.querySelector('[class*="canvasContainer"]');
    return container?.scrollTop ?? -1;
  });
  expect(scrollTop).toBe(0);
});
```

### 【需页面集成】✅

---

## F1.2: 工具栏可见验证

### 规格
- 验证: 阶段进度条 top ≥ 0，Tab 栏 top ≥ 0，工具栏 top ≥ 0
- 验证: 三栏面板区域 top ≥ 0

### 验收
```typescript
test('all toolbar elements visible after switching to canvas', async ({ page }) => {
  await page.goto('/canvas');
  
  const progressBar = page.locator('[data-testid="progress-bar"]');
  const tabBar = page.locator('[data-testid="tab-bar"]');
  const toolbar = page.locator('[data-testid="canvas-toolbar"]');
  
  const progressBox = await progressBar.boundingBox();
  const tabBox = await tabBar.boundingBox();
  const toolbarBox = await toolbar.boundingBox();
  
  expect(progressBox?.top ?? -1).toBeGreaterThanOrEqual(0);
  expect(tabBox?.top ?? -1).toBeGreaterThanOrEqual(0);
  expect(toolbarBox?.top ?? -1).toBeGreaterThanOrEqual(0);
});
```

### 【需页面集成】✅

---

## F1.3: 回归验证（多次切换）

### 规格
- 反复切换 10 次，scrollTop 每次都为 0
- 验证无累积效应

### 验收
```typescript
test('scrollTop stays 0 after repeated switches', async ({ page }) => {
  await page.goto('/');
  for (let i = 0; i < 10; i++) {
    await page.click('[data-testid="switch-to-canvas"]');
    await page.waitForURL('**/canvas');
    await page.waitForTimeout(100);
    
    const scrollTop = await page.evaluate(() => {
      const c = document.querySelector('[class*="canvasContainer"]');
      return c?.scrollTop ?? -1;
    });
    expect(scrollTop).toBe(0);
    
    await page.click('[data-testid="switch-to-requirements"]');
    await page.waitForURL('**/');
  }
});
```

### 【需页面集成】✅
