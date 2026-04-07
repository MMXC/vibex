# Spec: E2 - 代码质量审查

## F2.1: TypeScript 严格模式

### 验收
```bash
cd vibex-frontend
npx tsc --noEmit
# exitCode = 0
```

## F2.2: ESLint 检查

### 验收
```bash
npx eslint src/ --max-warnings=0
# exitCode = 0
```

## F2.3: 键盘冲突检查

### 验收
```typescript
test('Ctrl+G 无键盘冲突', () => {
  // 检查 Ctrl+G 未绑定其他全局事件
  const conflicts = checkGlobalConflicts('Control+g');
  expect(conflicts).toHaveLength(0);
});
```

## F2.4: 内存泄漏检查

### 验收
```typescript
test('rAF 有 cleanup', () => {
  const content = readFileSync('pages/canvas.tsx', 'utf-8');
  // rAF 调用应有 cancelAnimationFrame
  expect(content).toMatch(/cancelAnimationFrame/);
});
```
