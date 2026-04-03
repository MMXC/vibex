# Spec: E3 - Undo/Redo 完整实现

## 概述
在 Sprint 1 E4 ShortcutBar 基础上增加 Undo/Redo 快捷键和 UndoBar UI。

## F3.1: Ctrl+Z 撤销快捷键

### 规格
- 触发: `keydown` event，Ctrl+Z / Cmd+Z
- 行为: 从 historyStack pop 最近状态，应用到 canvas
- 记录: 被撤销的操作 push 到 redoStack

### 验收
```typescript
test('Ctrl+Z triggers undo', async ({ page }) => {
  await page.goto('/canvas');
  await page.click('[data-testid="add-node-btn"]');
  const historyBefore = await page.evaluate(() => store.getState().historyStack.length);
  
  await page.keyboard.press('Control+z');
  const historyAfter = await page.evaluate(() => store.getState().historyStack.length);
  
  expect(historyAfter).toBe(historyBefore - 1);
});

test('adding node is undoable', async ({ page }) => {
  await page.goto('/canvas');
  await page.click('[data-testid="add-node-btn"]');
  const nodeCountBefore = await page.locator('[data-testid="flow-node"]').count();
  
  await page.keyboard.press('Control+z');
  await page.waitForTimeout(100);
  const nodeCountAfter = await page.locator('[data-testid="flow-node"]').count();
  
  expect(nodeCountAfter).toBe(nodeCountBefore - 1);
});
```

### 【需页面集成】✅

---

## F3.2: Ctrl+Y 重做快捷键

### 规格
- 触发: `keydown` event，Ctrl+Y / Cmd+Y
- 行为: 从 redoStack pop 状态，应用到 canvas
- 清空: 任何新操作（添加/删除/编辑）清空 redoStack

### 验收
```typescript
test('Ctrl+Y triggers redo', async ({ page }) => {
  await page.goto('/canvas');
  await page.click('[data-testid="add-node-btn"]');
  await page.keyboard.press('Control+z'); // undo
  const redoBefore = await page.evaluate(() => store.getState().redoStack.length);
  
  await page.keyboard.press('Control+y');
  const redoAfter = await page.evaluate(() => store.getState().redoStack.length);
  
  expect(redoAfter).toBe(redoBefore - 1);
});

test('new operation clears redo stack', async ({ page }) => {
  await page.goto('/canvas');
  await page.click('[data-testid="add-node-btn"]');
  await page.keyboard.press('Control+z');
  const redoStackSize = await page.evaluate(() => store.getState().redoStack.length);
  
  await page.click('[data-testid="add-node-btn"]'); // new op
  const newRedoSize = await page.evaluate(() => store.getState().redoStack.length);
  
  expect(newRedoSize).toBe(0);
});
```

### 【需页面集成】✅

---

## F3.3: UndoBar UI

### 规格
- 位置: ShortcutBar（`components/ShortcutBar.tsx`）右侧
- 按钮: Undo（↶）+ Redo（↷）+ 步数 Badge
- 状态: 无可撤销时按钮 disabled

### 验收
```typescript
test('UndoBar visible in ShortcutBar', async ({ page }) => {
  await page.goto('/canvas');
  expect(page.locator('[data-testid="undo-bar"]')).toBeVisible();
});

test('Undo button disabled when no history', async ({ page }) => {
  await page.goto('/canvas');
  // Fresh canvas, no history
  expect(page.locator('[data-testid="undo-btn"]')).toBeDisabled();
});

test('step badge shows correct count', async ({ page }) => {
  await page.goto('/canvas');
  await page.click('[data-testid="add-node-btn"]');
  await page.click('[data-testid="add-node-btn"]');
  const badge = await page.textContent('[data-testid="undo-badge"]');
  expect(parseInt(badge || '0')).toBe(2);
});
```

### 【需页面集成】✅

---

## F3.4: 历史栈限制

### 规格
- maxLength: 50
- 超出: shift() 移除最旧记录
- 验证: push 后检查 length，超出则 shift

### 验收
```typescript
test('history stack max 50 items', () => {
  const stack = new HistoryStack(50);
  for (let i = 0; i < 60; i++) {
    stack.push({ id: `op-${i}`, timestamp: Date.now() });
  }
  expect(stack.length).toBe(50);
  expect(stack.items[0].id).toBe('op-10'); // first 10 removed
});
```
