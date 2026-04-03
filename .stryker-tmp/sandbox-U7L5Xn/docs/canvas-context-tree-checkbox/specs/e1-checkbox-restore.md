# Spec: E1 - Checkbox 恢复

## 概述
恢复 BoundedContextTree 卡片 header 的 checkbox，与 BusinessFlowTree 行为保持一致。

## F1.1: Checkbox 渲染

### 验收
```typescript
test('checkbox visible in BoundedContextTree card', async ({ page }) => {
  await page.goto('/canvas');
  const checkbox = page.locator('[data-testid="context-card-checkbox"]').first();
  await expect(checkbox).toBeVisible();
});
```

### 【需页面集成】✅

---

## F1.2: 点击选中/取消

### 验收
```typescript
test('checkbox click toggles selection', async ({ page }) => {
  await page.goto('/canvas');
  const checkbox = page.locator('[data-testid="context-card-checkbox"]').first();
  
  await checkbox.check();
  await expect(checkbox).toBeChecked();
  
  await checkbox.uncheck();
  await expect(checkbox).not.toBeChecked();
});
```

### 【需页面集成】✅

---

## F1.3: Ctrl+Click 兼容

### 验收
```typescript
test('Ctrl+Click body still works', async ({ page }) => {
  await page.goto('/canvas');
  const card = page.locator('[data-testid="context-card"]').first();
  await card.click({ modifiers: ['Control'] });
  const checkbox = page.locator('[data-testid="context-card-checkbox"]').first();
  await expect(checkbox).toBeChecked();
});
```

### 【需页面集成】✅
