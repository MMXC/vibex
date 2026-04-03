# AGENTS.md: VibeX Sprint 0 — P0 快速修复

**项目**: vibex-p0-quick-fixes
**版本**: v1.0
**日期**: 2026-04-02

---

## Dev 约束

### TypeScript 修复
- ✅ 优先恢复污染文件，如无法恢复则删除
- ❌ 禁止引入新的 TS 错误

### ESLint 修复
- ✅ 使用 `npm run lint -- --fix` 自动修复
- ❌ 禁止使用 `--no-errors-on-unmatched-pattern` 绕过检查

### DOMPurify
- ✅ 使用 `overrides` 而非 `resolutions`

---

## Reviewer 约束

### 审查重点
- [ ] `npx tsc --noEmit` 退出码 0
- [ ] `npm run lint` 退出码 0
- [ ] `npm run test` 全绿
- [ ] `npm audit` 无 high/critical

### 驳回条件
- ❌ 引入新的 TS 错误
- ❌ 绕过 ESLint 检查
- ❌ 引入安全漏洞

---

## 文件变更清单

| 文件 | 操作 |
|------|------|
| `tests/e2e/canvas-expand.spec.ts` | 恢复或删除 |
| `.eslintrc.js` | 如需修复 |
| `package.json` | 如需添加 overrides |
