# Spec: E5 - Svelte Framework 导出

## 概述
在 React2Vue 映射模式基础上增加 Svelte 支持，扩展多框架导出覆盖。

## F5.1: React2Svelte 映射表

### 规格
- 文件: `components/react2svelte/mappings.ts`
- 复用: `components/react2vue/` 的映射模式
- 组件: Button / Input / Card（初始 MVP）

### 映射表

| React | Svelte | 说明 |
|--------|--------|------|
| `<Button onClick={f}>` | `<Button on:click={f}>` | 事件语法不同 |
| `<Input value={v} onChange={f}>` | `<Input bind:value={v}>` | 双向绑定 |
| `<Card>{children}</Card>` | `<Card><slot /></Card>` | slot vs children |
| `className="x"` | `class="x"` | 属性名 |
| `style={{ width: 100 }}` | `style="width: 100px"` | style 格式 |

### 验收
```typescript
test('Button mapping exists', () => {
  const mappings = require('components/react2svelte/mappings');
  expect(mappings.Button).toBeDefined();
  expect(mappings.Button.eventSyntax).toBe('on:');
});

test('Input mapping uses bind:value', () => {
  const mappings = require('components/react2svelte/mappings');
  expect(mappings.Input.binding).toBe('bind:value');
});

test('Card mapping uses <slot />', () => {
  const mappings = require('components/react2svelte/mappings');
  expect(mappings.Card.children).toBe('<slot />');
});
```

---

## F5.2: 导出面板三框架切换

### 规格
- UI: RadioGroup（React | Vue | Svelte）
- 位置: 导出面板顶部框架选择区
- 默认: React

### 验收
```typescript
test('framework toggle shows React/Vue/Svelte', async ({ page }) => {
  await page.goto('/canvas/export');
  expect(page.locator('[data-testid="framework-react"]')).toBeVisible();
  expect(page.locator('[data-testid="framework-vue"]')).toBeVisible();
  expect(page.locator('[data-testid="framework-svelte"]')).toBeVisible();
});

test('switching to Svelte generates .svelte code', async ({ page }) => {
  await page.goto('/canvas/export');
  await page.click('[data-testid="framework-svelte"]');
  const code = await page.textContent('[data-testid="code-preview"]');
  expect(code).toContain('.svelte');
});
```

### 【需页面集成】✅

---

## F5.3: Svelte 组件生成

### 规格
- 输出格式: `.svelte` 单文件组件（`<script>`, `<template>`, `<style scoped>`）
- 语法: Svelte 4 compatible
- 验证: 生成代码可被 Svelte 编译器解析

### 验收
```typescript
test('generated code is valid Svelte SFC', async () => {
  const svelteCode = reactComponentToSvelte(ButtonReactComponent);
  expect(svelteCode).toContain('<script>');
  expect(svelteCode).toContain('<template>');
  expect(svelteCode).toContain('<style scoped>');
});

test('svelte code passes compiler check', async () => {
  const { compile } = require('svelte/compiler');
  const code = reactComponentToSvelte(ButtonReactComponent);
  expect(() => compile(code, { filename: 'Button.svelte' })).not.toThrow();
});
```

---

## F5.4: Svelte E2E 验证

### 规格
- 测试: Button / Input / Card 在 Svelte 下渲染
- 工具: Playwright + Svelte 测试 app（`svelte-test-app/`）

### 验收
```typescript
test('Button renders in Svelte', async ({ page }) => {
  await page.goto('/svelte-test-app');
  await page.click('[data-testid="vibex-svelte-btn"]');
  expect(page.locator('.toast')).toBeVisible();
});

test('Input renders in Svelte with bind:value', async ({ page }) => {
  await page.goto('/svelte-test-app');
  await page.fill('[data-testid="vibex-svelte-input"]', 'hello');
  expect(page.locator('[data-testid="vibex-svelte-input"]')).toHaveValue('hello');
});

test('Card renders in Svelte with slot content', async ({ page }) => {
  await page.goto('/svelte-test-app');
  expect(page.locator('[data-testid="vibex-svelte-card"]')).toBeVisible();
  expect(page.locator('[data-testid="vibex-svelte-card"]')).toContainText('Card Content');
});
```

---

## F5.5: 测试覆盖率

### 验收
```bash
cd components/react2svelte
npx jest --coverage --coverageThreshold='{"global":{"branches":80,"functions":80,"lines":80}}'
```
