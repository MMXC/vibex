# Spec: E1 - 树面板 scrollTop 重置

## 概述
在 TreePanel 组件中添加 scrollTop 重置逻辑，覆盖 BoundedContextTree、BusinessFlowTree、ComponentTree 三个面板。

## F1.1: TreePanel scrollTop 重置逻辑

### 规格
- 文件: `components/canvas/TreePanel.tsx`
- 方式: `useEffect` 监听 `collapsed` 状态，`collapsed` 从 `true` → `false` 时执行 `panelBodyRef.current.scrollTop = 0`
- 动画兼容: 使用 `setTimeout(0)` 将重置延迟到下一帧，避免视觉闪烁

### 验收
```typescript
// e2e/tree-panel-scroll.spec.ts
test('Context panel resets scrollTop on expand', async ({ page }) => {
  await page.goto('/canvas');
  // 展开 Context 面板
  await page.click('[data-testid="toggle-context-panel"]');
  // 滚动到中间
  await page.evaluate(() => {
    const panel = document.querySelector('[class*="boundedContextTree"]');
    panel!.scrollTop = 200;
  });
  // 折叠
  await page.click('[data-testid="toggle-context-panel"]');
  // 再次展开
  await page.click('[data-testid="toggle-context-panel"]');
  
  const scrollTop = await page.evaluate(() => {
    const panel = document.querySelector('[class*="boundedContextTree"]');
    return panel!.scrollTop;
  });
  expect(scrollTop).toBe(0);
});
```

### 【需页面集成】✅

---

## F1.2: 三面板覆盖验证

### 规格
- 三个面板均使用相同 TreePanel 组件，修复一次覆盖三个
- 验证: Context / Flow / Component 三个面板在折叠→展开后 scrollTop 均为 0

### 验收
```typescript
test('Flow panel resets scrollTop on expand', async ({ page }) => {
  await page.goto('/canvas');
  await page.click('[data-testid="toggle-flow-panel"]');
  await page.evaluate(() => {
    const panel = document.querySelector('[class*="businessFlowTree"]');
    panel!.scrollTop = 300;
  });
  await page.click('[data-testid="toggle-flow-panel"]');
  await page.click('[data-testid="toggle-flow-panel"]');
  const scrollTop = await page.evaluate(() => {
    const panel = document.querySelector('[class*="businessFlowTree"]');
    return panel!.scrollTop;
  });
  expect(scrollTop).toBe(0);
});

test('Component panel resets scrollTop on expand', async ({ page }) => {
  await page.goto('/canvas');
  await page.click('[data-testid="toggle-component-panel"]');
  await page.evaluate(() => {
    const panel = document.querySelector('[class*="componentTree"]');
    panel!.scrollTop = 150;
  });
  await page.click('[data-testid="toggle-component-panel"]');
  await page.click('[data-testid="toggle-component-panel"]');
  const scrollTop = await page.evaluate(() => {
    const panel = document.querySelector('[class*="componentTree"]');
    return panel!.scrollTop;
  });
  expect(scrollTop).toBe(0);
});
```

### 【需页面集成】✅

---

## F1.3: 动画兼容

### 规格
- 展开动画（CSS transition）期间不重置，避免闪烁
- 方式: `setTimeout(0)` 或监听 `transitionend`

### 验收
```typescript
test('no flicker on expand', async ({ page }) => {
  await page.goto('/canvas');
  await page.click('[data-testid="toggle-context-panel"]');
  // 滚动
  await page.evaluate(() => {
    const panel = document.querySelector('[class*="boundedContextTree"]');
    panel!.scrollTop = 200;
  });
  // 折叠
  await page.click('[data-testid="toggle-context-panel"]');
  
  // 监听闪烁：展开期间不应出现 scrollTop 不为 0 的中间状态
  let midScrollTop = -1;
  page.on('evaluate', () => {
    // 在 setTimeout 期间捕获中间状态
  });
  
  await page.click('[data-testid="toggle-context-panel"]');
  // 等待动画完成
  await page.waitForTimeout(300);
  const finalScrollTop = await page.evaluate(() => {
    const panel = document.querySelector('[class*="boundedContextTree"]');
    return panel!.scrollTop;
  });
  expect(finalScrollTop).toBe(0);
});
```

### 【需页面集成】✅
