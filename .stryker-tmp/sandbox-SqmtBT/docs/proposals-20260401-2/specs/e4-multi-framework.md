# Spec: E4 - Multi-Framework 导出

## 概述
在 React 导出基础上增加 Vue 框架支持，覆盖更广泛用户群体。

## F4.1: Vue 代码生成器

### 规格
- 文件: `components/react2vue/mappings.ts`
- 映射: React 组件 → Vue 组件（Button → Button, Card → Card, etc.）
- 样式: CSS → Scoped CSS (Vue SFC 格式)
- 输出: `.vue` 单文件组件

### 映射表（初始 MVP）

| React 组件 | Vue 组件 | 状态 |
|-------------|----------|------|
| Button | `<Button>` | ✅ |
| Input | `<Input>` | ✅ |
| Card | `<div class="card">` | ✅ |
| Modal | `<Teleport to="body">` | ✅ |

### 验收
```typescript
test('Button mapping exists', () => {
  const mappings = require('components/react2vue/mappings');
  expect(mappings.Button).toBeDefined();
  expect(mappings.Button.vueTag).toBe('Button');
});

test('generated Vue SFC is valid', () => {
  const vue = reactComponentToVue(ButtonReactComponent);
  expect(vue).toContain('<template>');
  expect(vue).toContain('<script setup>');
  expect(vue).toContain('<style scoped>');
});
```

---

## F4.2: 导出面板框架切换

### 规格
- UI: 导出面板顶部 RadioGroup（React | Vue）
- 状态: 默认 React，切换后重新生成代码
- 验证: 切换框架不影响已选节点

### 验收
```typescript
test('framework toggle visible in export panel', async ({ page }) => {
  await page.goto('/canvas/export');
  expect(page.locator('[data-testid="framework-toggle"]')).toBeVisible();
});

test('switching to Vue regenerates code', async ({ page }) => {
  await page.goto('/canvas/export');
  const reactCode = await page.textContent('[data-testid="code-preview"]');
  await page.click('[data-testid="vue-option"]');
  const vueCode = await page.textContent('[data-testid="code-preview"]');
  expect(vueCode).not.toBe(reactCode);
  expect(vueCode).toContain('.vue');
});
```

### 【需页面集成】✅

---

## F4.3: Vue 运行验证

### 规格
- 验证: 导出的 Vue 代码可在 Vite + Vue 3 项目中运行
- 测试: Playwright E2E 验证 Button/Input/Card 渲染

### 验收
```typescript
test('Button component renders in Vue', async ({ page }) => {
  await page.goto('/vue-test-app');
  await page.click('[data-testid="vibex-btn"]');
  expect(page.locator('.toast')).toBeVisible();
});

test('Input component renders in Vue', async ({ page }) => {
  await page.goto('/vue-test-app');
  await page.fill('[data-testid="vibex-input"]', 'test');
  expect(page.locator('[data-testid="vibex-input"]')).toHaveValue('test');
});

test('Card component renders in Vue', async ({ page }) => {
  await page.goto('/vue-test-app');
  expect(page.locator('[data-testid="vibex-card"]')).toBeVisible();
});
```

---

## F4.4: 测试覆盖率

### 验收
```bash
cd components/react2vue
npx jest --coverage --coverageThreshold='{"global":{"branches":80,"functions":80,"lines":80}}'
```
