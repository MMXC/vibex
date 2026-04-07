# Spec: E1 - Canvas Checkbox 统一修复

## F1.1: confirmContextNode 双向切换

### 验收
```typescript
test('confirmContextNode toggles both directions', async ({ page }) => {
  await page.goto('/canvas');
  await page.click('[data-testid="context-node-checkbox"]');
  const confirmed = await page.evaluate(() => store.getState().selectedNodeIds[0].confirmed);
  expect(confirmed).toBe(true);
  
  await page.click('[data-testid="context-node-checkbox"]');
  const unconfirmed = await page.evaluate(() => store.getState().selectedNodeIds[0].confirmed);
  expect(unconfirmed).toBe(false);
});
```

### 【需页面集成】✅

---

## F1.2: FlowCard 勾选联动

### 验收
```typescript
test('FlowCard toggle syncs sub-steps', async ({ page }) => {
  await page.goto('/canvas/flow');
  await page.click('[data-testid="flow-card-checkbox"]');
  const subSteps = await page.evaluate(() => store.getState().subStepsConfirmed);
  expect(subSteps.every(s => s.confirmed)).toBe(true);
});
```

### 【需页面集成】✅
