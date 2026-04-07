# Spec: E1 - Canvas 运行时崩溃修复

## 概述
修复 Canvas 页面运行时崩溃（Critical Bug），ErrorBoundary 揭示 `Cannot read properties of undefined (reading 'length')`。

## F1.1: 根因定位

### 规格
- 错误信息: `Cannot read properties of undefined (reading 'length')`
- 错误码: `ERR-MNFL1ABY`
- 调查路径:
  1. 检查 `panel collapse` 相关代码（最可能来源）
  2. 检查 `store migration` 代码中的 `.length` 调用
  3. 检查 `useNodes()` / `useEdges()` hook 返回值的防御性访问

### 验收
```typescript
// 找到根因代码文件
test('root cause file identified', () => {
  // grep 结果应包含具体的 .tsx/.ts 文件
  const results = execSync(
    "grep -rn '\\.length' components/canvas/ stores/ --include='*.ts' --include='*.tsx'",
    { encoding: 'utf-8' }
  );
  expect(results.trim().length).toBeGreaterThan(0);
});
```

---

## F1.2: 崩溃修复

### 规格
- 修复方式: 在所有 `.length` 调用前加可选链 `?.length` 或空值检查
- 验证: Canvas 页面加载（staging）无崩溃

### 验收
```typescript
test('canvas loads without undefined.length error', async ({ page }) => {
  await page.goto('/canvas');
  const errors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  await page.waitForTimeout(3000);
  const crashErrors = errors.filter(e => e.includes('undefined') && e.includes('length'));
  expect(crashErrors.length).toBe(0);
});
```

### 【需页面集成】✅

---

## F1.3: ErrorBoundary 验证

### 规格
- 监控: staging 环境 ErrorBoundary 错误率 < 0.1%
- 验证: 连续 1000 次 canvas 加载，崩溃次数 < 1

### 验收
```typescript
test('error boundary crash rate < 0.1%', async () => {
  const crashes = 0;
  const total = 1000;
  for (let i = 0; i < total; i++) {
    const result = await checkCanvasLoad();
    if (result.crashed) crashes++;
  }
  expect(crashes / total).toBeLessThan(0.001); // < 0.1%
});
```
