# Spec: E1 - Vitest exclude 修复规格

## E1.1 vitest.config.ts 检查

```typescript
// vitest.config.ts — exclude 规则检查
export default defineConfig({
  test: {
    // ❌ 错误配置（排除测试文件本身）
    exclude: [
      'node_modules',
      'dist',
      '.next',
      '*.test.ts',      // ← ❌ 错误：不应该排除测试文件
      '*.test.tsx',     // ← ❌ 错误
      '*.spec.ts',       // ← ❌ 错误
    ],
    
    // ✅ 正确配置
    exclude: [
      'node_modules',
      'dist',
      '.next',
      // 测试文件应该被包含！
    ],
  },
});
```

## E1.2 测试发现验证

```typescript
// 新测试文件发现验证
test('vitest 能发现新增测试文件', () => {
  // 创建临时测试文件
  const tempTest = path.join(__dirname, '__tests__/temp-verify.test.ts');
  fs.writeFileSync(tempTest, 'test("verify", () => expect(1).toBe(1))');
  
  // 运行 vitest，应该发现该文件
  const result = execSync('npx vitest --run --reporter=verbose', { encoding: 'utf8' });
  expect(result).toContain('temp-verify');
  
  // 清理
  fs.unlinkSync(tempTest);
});
```

## E1.3 现有测试通过

```bash
# 验证 52+ 现有测试通过
npx vitest run --reporter=verbose 2>&1 | grep -c "PASS"
# 期望: >= 52
```
