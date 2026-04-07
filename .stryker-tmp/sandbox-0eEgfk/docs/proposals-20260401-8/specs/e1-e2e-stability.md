# Spec: E1 - E2E 测试稳定性提升

## F1.1: waitForSelector 替换

### 验收
```typescript
test('no waitForTimeout in E2E tests', () => {
  const testFiles = glob.sync('e2e/**/*.spec.ts');
  for (const f of testFiles) {
    const content = readFileSync(f, 'utf-8');
    expect(content).not.toMatch(/waitForTimeout\s*\(/);
  }
});
```

---

## F1.2: force:true 处理

### 验收
```typescript
test('intercepted elements use force:true', () => {
  const content = readFileSync('e2e/canvas.spec.ts', 'utf-8');
  expect(content).toMatch(/force:\s*true/);
});
```

---

## F1.3: CI 超时配置

### 验收
```yaml
# playwright.config.ts
expect timeout >= 30000
```
