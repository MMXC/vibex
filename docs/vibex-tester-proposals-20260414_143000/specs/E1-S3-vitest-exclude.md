# Spec: E1.S3 — Vitest exclude 配置修复

**功能ID**: E1.S3.F3.1
**Epic**: E1 — CI 质量门禁修复
**类型**: Dev / P0
**预估工时**: 1h

---

## 1. 背景

`vite.config.ts` 中 `test.exclude` 配置不完整，导致 Vitest 误跑 node_modules、dist 或其他非测试文件，产生大量误报错误。

---

## 2. 验收标准

| # | 验收项 | 断言 |
|---|--------|------|
| 1 | `vitest run` 退出码为 0 | `expect(exitCode).toBe(0)` |
| 2 | 测试文件数量符合预期（无 node_modules/dist 文件） | `expect(testFileCount).toBeLessThan(100)` |
| 3 | 无 `Cannot find module` 来自 exclude 区域 | `expect(errors.filter(e => e.includes('node_modules'))).toHaveLength(0)` |

---

## 3. 实施步骤

1. 读取 `vite.config.ts`，定位 `test.exclude` 数组
2. 确保以下已排除：
   ```ts
   exclude: [
     '**/node_modules/**',
     '**/dist/**',
     '**/.git/**',
     '**/dist-ssr/**',
     '**/public/**',   // 通常不含测试
   ]
   ```
3. 检查是否有 tsconfig 别名（如 `#test-utils`）导致误匹配
4. 运行 `vitest run --reporter=verbose` 确认只运行目标测试文件
5. 验证 CI 配置中的 Vitest 步骤

---

## 4. 测试用例

```typescript
it('vitest 只运行测试文件，退出码0', () => {
  const result = execSync('cd frontend && npx vitest run --reporter=verbose', {
    encoding: 'utf-8',
    timeout: 60000,
  });
  expect(result.exitCode).toBe(0);
  // 确保没有跑 node_modules
  expect(result.stdout).not.toContain('node_modules');
});
```

---

## 5. Definition of Done

- [ ] `vitest run` 退出码 0
- [ ] 测试文件数量在合理范围
- [ ] 无 node_modules / dist 文件被误跑
- [ ] CI 步骤通过
