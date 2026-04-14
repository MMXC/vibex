# Spec: E1.S2 — 后端 tsconfig 修复

**功能ID**: E1.S2.F2.1
**Epic**: E1 — CI 质量门禁修复
**类型**: Dev / P0
**预估工时**: 1.5h

---

## 1. 背景

后端 `tsconfig.json` 存在配置问题（如 `rootDir`/`outDir` 冲突、缺失的 `types`、重复的 `compilerOptions`），导致 `tsc --noEmit` 失败。

---

## 2. 验收标准

| # | 验收项 | 断言 |
|---|--------|------|
| 1 | `tsc --noEmit` 后端退出码为 0 | `expect(exitCode).toBe(0)` |
| 2 | 后端 TypeScript 错误数为 0 | `expect(errorCount).toBe(0)` |
| 3 | `rootDir` 与 `include` 匹配，无 outDir 冲突 | 人工审查 |

---

## 3. 实施步骤

1. 读取 `backend/tsconfig.json`
2. 检查 `rootDirs` vs `rootDir` 冲突
3. 检查 `outDir` 是否与源码目录重叠（导致循环引用）
4. 检查 `paths` 或 `baseUrl` 是否引用了不存在的前端目录
5. 修复后执行 `cd backend && npx tsc --noEmit`
6. 确认 CI 配置中后端类型检查步骤退出码

---

## 4. 测试用例

```typescript
it('后端 tsconfig 无错误', () => {
  const result = execSync('cd backend && npx tsc --noEmit', { encoding: 'utf-8' });
  expect(result.exitCode).toBe(0);
});
```

---

## 5. Definition of Done

- [ ] `tsc --noEmit` 后端退出码 0
- [ ] 后端类型错误清零
- [ ] CI 中对应步骤通过
