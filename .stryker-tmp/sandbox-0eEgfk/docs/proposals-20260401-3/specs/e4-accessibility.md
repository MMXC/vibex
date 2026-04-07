# Spec: E4 - Accessibility 测试基线

## 概述
建立 axe-core accessibility 测试体系，覆盖核心页面。

## F4.1: axe-core Playwright 配置

### 规格
- 包: `@axe-core/playwright`
- 配置: `tests/a11y/axe.config.ts`
- 违规级别: Critical / Serious → CI failure

### 验收
```typescript
test('axe-core is configured', () => {
  const config = require('tests/a11y/axe.config');
  expect(config.reporter).toContain('json');
  expect(config.rules).toBeDefined();
});
```

---

## F4.2: Homepage Accessibility 检查

### 规格
- 页面: `/`
- axe 扫描: Critical/Serious 违规 0 条
- 常见问题: img alt 缺失、button 无 accessible name、color 对比度不足

### 验收
```typescript
test('homepage has no Critical/Serious violations', async ({ page }) => {
  const violations = await new AxeBuilder({ page })
    .include('body')
    .analyze();
  
  const criticalSerious = violations.filter(v => 
    v.impact === 'critical' || v.impact === 'serious'
  );
  expect(violations.length).toBe(0);
});
```

---

## F4.3: Canvas Accessibility 检查

### 规格
- 页面: `/canvas`
- axe 扫描: Critical/Serious 违规 0 条
- React Flow 节点: 每个节点需有 aria-label

### 验收
```typescript
test('canvas has no Critical/Serious violations', async ({ page }) => {
  await page.goto('/canvas');
  const violations = await new AxeBuilder({ page })
    .include('[data-testid="flow-node"]')
    .analyze();
  expect(violations.filter(v => v.impact === 'critical')).toHaveLength(0);
});
```

---

## F4.4: Export Accessibility 检查

### 规格
- 页面: `/canvas/export`
- axe 扫描: Critical/Serious 违规 0 条
- 重点: RadioGroup/Checkbox 的 label 关联

### 验收
```typescript
test('export page has no Critical/Serious violations', async ({ page }) => {
  await page.goto('/canvas/export');
  const violations = await new AxeBuilder({ page }).analyze();
  expect(violations.filter(v => v.impact === 'critical' || v.impact === 'serious')).toHaveLength(0);
});
```

---

## F4.5: CI Accessibility Gate

### 规格
- GitHub Actions: `a11y-ci.yml`
- 触发: PR 到 main
- 失败: axe 扫描 Critical/Serious → workflow failure
- 报告: `reports/a11y/` 目录输出 JSON 报告

### 验收
```yaml
# .github/workflows/a11y-ci.yml (验证)
- name: Run axe accessibility tests
  run: npx playwright test tests/a11y/ --reporter=json
  # Critical/Serious → exit 1

- name: Check violations
  run: |
    VIOLATIONS=$(cat reports/a11y/results.json | jq '[.[] | select(.impact == "critical" or .impact == "serious")] | length')
    if [ "$VIOLATIONS" -gt 0 ]; then exit 1; fi
```
