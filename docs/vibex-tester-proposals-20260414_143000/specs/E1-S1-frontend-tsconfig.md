# Spec: E1.S1 — 前端 tsconfig 修复

**功能ID**: E1.S1.F1.1
**Epic**: E1 — CI 质量门禁修复
**类型**: Dev / P0
**预估工时**: 1.5h

---

## 1. 背景

前端 `tsconfig.json` 存在路径映射（paths/baseUrl）或 `include` 字段配置错误，导致 `tsc --noEmit` 失败，CI 类型检查红锁。

---

## 2. 验收标准

| # | 验收项 | 断言 |
|---|--------|------|
| 1 | `tsc --noEmit` 前端退出码为 0 | `expect(exitCode).toBe(0)` |
| 2 | 前端 TypeScript 错误数为 0 | `expect(errorCount).toBe(0)` |
| 3 | `include` 字段覆盖所有源代码目录 | 人工审查 |

---

## 3. 实施步骤

1. 读取 `frontend/tsconfig.json`，检查 `compilerOptions.paths` 和 `baseUrl`
2. 检查 `include` 字段是否遗漏 `src` 或 `app` 目录
3. 检查 `exclude` 是否误排了必要文件（如 `node_modules` 过度排除导致类型解析失败）
4. 修复后执行 `cd frontend && npx tsc --noEmit`
5. 若有残留错误，按以下优先级处理：
   - `Cannot find module` → 检查 paths/baseUrl
   - `Cannot find type` → 检查 `skipLibCheck` 或缺失的类型声明文件
   - `Duplicate identifier` → 检查多 tsconfig 合并问题
6. 在 CI 配置中确认 `tsc --noEmit` 步骤退出码检查

---

## 4. 测试用例

```typescript
// 无代码修改，仅运行类型检查
it('前端 tsconfig 无错误', () => {
  const result = execSync('cd frontend && npx tsc --noEmit', { encoding: 'utf-8' });
  expect(result.exitCode).toBe(0);
});
```

---

## 5. Definition of Done

- [ ] `tsc --noEmit` 前端退出码 0
- [ ] 前端类型错误清零
- [ ] CI 中对应步骤通过
