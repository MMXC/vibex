# Spec: E2 - 颜色对比度 WCAG 2.1 AA 修复

## 概述
解决 axe-core 揭示的颜色对比度违规（Serious），使 VibeX 符合 WCAG 2.1 AA 标准。

## F2.1: Playwright browser 安装

### 规格
- 修复: GitHub Actions CI 中添加 `npx playwright install chromium`
- 位置: `.github/workflows/a11y-ci.yml` 的 `setup` step

### 验收
```typescript
test('playwright install step exists in CI', () => {
  const ciFile = readFileSync('.github/workflows/a11y-ci.yml', 'utf-8');
  expect(ciFile).toContain('npx playwright install');
});
```

---

## F2.2: Homepage 对比度修复

### 规格
- 问题: 导航/按钮文本 vs 背景对比度 < 4.5:1
- 修复: 调整 CSS 颜色变量（`--color-primary-text`, `--color-bg`）
- 验证: axe DevTools 或 contrast checker 工具

### 验收
```typescript
test('homepage button contrast >= 4.5:1', async ({ page }) => {
  await page.goto('/');
  const results = await new AxeBuilder({ page })
    .include('[data-testid="primary-btn"]')
    .analyze();
  const contrastViolations = results.filter(r => r.id === 'color-contrast');
  expect(contrastViolations).toHaveLength(0);
});
```

### 【需页面集成】✅

---

## F2.3: Canvas 对比度修复

### 规格
- 问题: 三栏面板/按钮对比度 < 4.5:1
- 修复: 调整 `--canvas-panel-*` CSS 变量

### 验收
```typescript
test('canvas panel contrast >= 4.5:1', async ({ page }) => {
  await page.goto('/canvas');
  const results = await new AxeBuilder({ page })
    .include('.flow-panel')
    .analyze();
  expect(results.filter(r => r.id === 'color-contrast')).toHaveLength(0);
});
```

### 【需页面集成】✅

---

## F2.4: Export 对比度修复

### 规格
- 问题: 导出按钮对比度 < 4.5:1
- 修复: 调整 `--export-btn-*` CSS 变量

### 验收
```typescript
test('export button contrast >= 4.5:1', async ({ page }) => {
  await page.goto('/canvas/export');
  const results = await new AxeBuilder({ page })
    .include('[data-testid="export-submit-btn"]')
    .analyze();
  expect(results.filter(r => r.id === 'color-contrast')).toHaveLength(0);
});
```

### 【需页面集成】✅

---

## F2.5: axe-core 完整验证

### 规格
- 命令: `npx playwright test tests/a11y --project=chromium`
- 验证: Critical/Serious 违规 = 0

### 验收
```bash
cd vibex
npx playwright test tests/a11y --project=chromium --reporter=line
# Critical + Serious violations = 0
```
