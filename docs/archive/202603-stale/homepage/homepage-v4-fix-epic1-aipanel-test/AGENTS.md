# 开发约束: homepage-v4-fix-epic1-aipanel-test

> **项目**: homepage-v4-fix-epic1-aipanel-test  
> **版本**: v1.0  
> **日期**: 2026-03-22

---

## 1. 驳回红线

| 规则 | 原因 |
|------|------|
| ❌ pnpm test 退出码 ≠ 0 | 测试套件失败 |
| ❌ e2e 测试被 Jest 运行 | 配置未生效 |
| ❌ 破坏已有测试 | 回归风险 |

---

## 2. PR 审查清单

- [ ] `jest.config.js` 存在且包含完整配置
- [ ] `testPathIgnorePatterns` 包含 e2e 正则
- [ ] `pnpm test` 退出码为 0
- [ ] `pnpm test:e2e` 正常运行
- [ ] `package.json` 中 jest 配置已移除
- [ ] babel.config.js 未被修改

---

## 3. 验收映射

| Story | 验收标准 |
|-------|----------|
| ST-1.1 | `testPathIgnorePatterns` 包含 `\\.e2e\\.` 或 `/e2e/` |
| ST-1.2 | `pnpm test` 退出码 0 |
| ST-1.3 | `pnpm test:e2e` 正常运行 |
