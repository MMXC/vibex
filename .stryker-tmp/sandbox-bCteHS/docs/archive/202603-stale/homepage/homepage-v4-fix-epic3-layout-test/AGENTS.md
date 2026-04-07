# 开发约束: homepage-v4-fix-epic3-layout-test

> **项目**: homepage-v4-fix-epic3-layout-test  
> **版本**: v1.0  
> **日期**: 2026-03-22

---

## 1. 驳回红线

| 规则 | 原因 |
|------|------|
| ❌ pnpm test 退出码 ≠ 0 | 测试套件失败 |
| ❌ .spec.ts 文件被 Jest 运行 | 配置未生效 |
| ❌ Babel "Parser.parse" 错误仍存在 | 解析失败 |
| ❌ 破坏已有测试 | 回归风险 |

---

## 2. PR 审查清单

- [ ] `jest.config.js` 存在且包含完整配置
- [ ] `testPathIgnorePatterns` 包含 `/\.spec\.(ts|tsx)$/`
- [ ] `pnpm test` 退出码为 0
- [ ] 无 "Parser.parse" 错误
- [ ] `package.json` 中 jest 配置已移除
- [ ] babel.config.js 正确（preset-typescript 已配置）

---

## 3. 验收映射

| Story | 验收标准 |
|-------|----------|
| ST-1.1 | `testPathIgnorePatterns` 包含 `/\.spec\.(ts|tsx)$/` |
| ST-1.2 | `pnpm test` 无 Babel 解析错误，退出码 0 |
| ST-1.3 | Epic3 布局组件测试通过 |
