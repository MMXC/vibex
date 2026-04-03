# Spec: E1 - Ctrl+G 快速生成命令

## 概述
在 Canvas 页面绑定 Ctrl+G 快捷键，一键触发三树（Context → Flow → Component）级联生成。

## F1.1: Ctrl+G 快捷键绑定

### 规格
- CanvasPage.tsx 使用 useEffect 监听 keydown
- 快捷键: Ctrl+G（Windows/Linux）/ Cmd+G（Mac）
- 阻止默认浏览器行为（避免 Ctrl+G 触发其他操作）

### 验收
```typescript
test('Ctrl+G triggers quick generate', async ({ page }) => {
  await page.goto('/canvas');
  await page.fill('[data-testid="requirement-input"]', '用户登录功能');
  
  await page.keyboard.press('Control+g');
  await page.waitForTimeout(500);
  
  // 验证生成已开始（节点出现或 toast 显示）
  const toastOrNodes = await Promise.race([
    page.waitForSelector('[data-testid="toast"]', { timeout: 1000 }).then(() => 'toast'),
    page.waitForSelector('[data-testid="context-node"]', { timeout: 3000 }).then(() => 'nodes')
  ]);
  expect(['toast', 'nodes']).toContain(toastOrNodes);
});
```

### 【需页面集成】✅

---

## F1.2: 空输入检测

### 规格
- requirementInput 为空时按 Ctrl+G 显示 toast：「请先输入需求」
- 类型: warning

### 验收
```typescript
test('empty input shows warning toast', async ({ page }) => {
  await page.goto('/canvas');
  // 不输入任何内容
  
  await page.keyboard.press('Control+g');
  
  await page.waitForSelector('[data-testid="toast"]');
  const toastText = await page.textContent('[data-testid="toast"]');
  expect(toastText).toContain('请先输入需求');
});
```

### 【需页面集成】✅

---

## F1.3: 三树级联生成

### 规格
- 依次调用: generateContexts → autoGenerateFlows → generateComponent
- 每次成功后才进行下一步
- 最终生成 Context/Flow/Component 三类节点

### 验收
```typescript
test('three trees generated in sequence', async ({ page }) => {
  await page.goto('/canvas');
  await page.fill('[data-testid="requirement-input"]', '用户登录注册功能');
  
  await page.keyboard.press('Control+g');
  
  // 等待生成完成
  await page.waitForTimeout(5000);
  
  // 检查三类节点是否存在
  const contextNodes = await page.locator('[data-testid="context-node"]').count();
  const flowNodes = await page.locator('[data-testid="flow-node"]').count();
  const componentNodes = await page.locator('[data-testid="component-node"]').count();
  
  expect(contextNodes).toBeGreaterThan(0);
  expect(flowNodes).toBeGreaterThan(0);
  expect(componentNodes).toBeGreaterThan(0);
});
```

### 【需页面集成】✅

---

## F1.4: 生成中状态阻止重复触发

### 规格
- isGenerating 状态为 true 时，忽略 Ctrl+G
- 显示「生成中...」toast 或静默忽略

### 验收
```typescript
test('repeat Ctrl+G ignored during generation', async ({ page }) => {
  await page.goto('/canvas');
  await page.fill('[data-testid="requirement-input"]', '测试');
  
  await page.keyboard.press('Control+g');
  await page.waitForTimeout(100);
  await page.keyboard.press('Control+g');
  
  // 只触发一次生成，不应生成双倍节点
  const contextNodes = await page.locator('[data-testid="context-node"]').count();
  expect(contextNodes).toBeLessThanOrEqual(1); // 最多 1 次生成
});
```

### 【需页面集成】✅

---

## F1.5: ShortcutHintPanel 更新

### 规格
- ShortcutHintPanel.tsx 添加 Ctrl+G 说明
- 格式: "Ctrl+G: 快速生成"

### 验收
```typescript
test('ShortcutHintPanel shows Ctrl+G', async ({ page }) => {
  await page.goto('/canvas');
  await page.click('[data-testid="shortcut-hint-btn"]');
  
  const hintText = await page.textContent('[data-testid="shortcut-hint-panel"]');
  expect(hintText).toContain('Ctrl+G');
});
```

### 【需页面集成】✅
