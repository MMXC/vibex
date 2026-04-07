# Spec: E4 - 画布引导体系

## 概述
为新用户提供画布引导体系，降低首次使用门槛。

## F4.1: 新用户引导流程

### 规格
- 触发: 用户首次打开画布（无 localStorage 记录）
- 步骤: 3 步引导（① 添加节点 → ② 连接边 → ③ 发送）
- 时限: 首次触发 < 30s
- 完成率目标: ≥ 80%

### 验收
```typescript
// e4-s1 验收
test('guidance triggers within 30s for new user', async ({ page }) => {
  // 清除 localStorage
  await page.evaluate(() => localStorage.clear());
  await page.goto('/canvas');
  
  const start = Date.now();
  await page.waitForSelector('[data-testid="guidance-overlay"]', { timeout: 35000 });
  const latency = Date.now() - start;
  
  expect(latency).toBeLessThan(30000);
});

test('guidance completion rate >= 80%', async ({ page }) => {
  // 模拟完整引导流程
  const completions = 0;
  const total = 100;
  // ... 统计完成数
  expect(completions / total).toBeGreaterThanOrEqual(0.8);
});
```

### 【需页面集成】✅

---

## F4.2: 快捷键提示

### 规格
- 入口: 画布工具栏右侧快捷键按钮
- 显示: overlay 展示 ⌘+Z, ⌘+C, ⌘+V, ⌘+S 等
- 可折叠: 点击外部或 Esc 关闭

### 验收
```typescript
test('shortcut panel visible after click', async ({ page }) => {
  await page.goto('/canvas');
  await page.click('[data-testid="shortcut-btn"]');
  expect(page.locator('[data-testid="shortcut-panel"]')).toBeVisible();
});
```

### 【需页面集成】✅

---

## F4.3: 节点 Tooltip

### 规格
- 触发: Hover 节点 200ms 后显示
- 内容: 节点名称、类型、创建时间
- 延迟: < 200ms（100 节点下）

### 验收
```typescript
test('node tooltip appears within 200ms', async ({ page }) => {
  await page.goto('/canvas');
  await page.hover('[data-testid="flow-node-0"]');
  const start = Date.now();
  await page.waitForSelector('[data-testid="node-tooltip"]');
  expect(Date.now() - start).toBeLessThan(200);
});
```

### 【需页面集成】✅
