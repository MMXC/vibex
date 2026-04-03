# Spec: E2 - 画布消息抽屉 Phase1

## F2.1: Chat 风格抽屉

### 验收
```typescript
test('drawer width is 200px', async ({ page }) => {
  await page.goto('/canvas');
  const box = await page.locator('[data-testid="msg-drawer"]').boundingBox();
  expect(box?.width).toBe(200);
});
```

### 【需页面集成】✅

---

## F2.2: /submit 命令

### 验收
```typescript
test('/submit triggers event', async ({ page }) => {
  await page.goto('/canvas');
  await page.fill('[data-testid="drawer-input"]', '/submit');
  await page.press('[data-testid="drawer-input"]', 'Enter');
  const eventFired = await page.evaluate(() => window.__eventLog.length > 0);
  expect(eventFired).toBe(true);
});
```

### 【需页面集成】✅

---

## F2.3: 节点关联命令过滤

### 验收
```typescript
test('commands filtered when card selected', async ({ page }) => {
  await page.goto('/canvas');
  await page.click('[data-testid="context-node"]'); // select card
  const allCmds = await getAllCommands();
  const filteredCmds = await getFilteredCommands();
  expect(filteredCmds.length).toBeLessThan(allCmds.length);
});
```

### 【需页面集成】✅
