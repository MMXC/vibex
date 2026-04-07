# AGENTS.md: VibeX Tester Proposals 2026-04-11

> **项目**: vibex-tester-proposals-vibex-proposals-20260411  
> **作者**: Architect  
> **日期**: 2026-04-11  
> **版本**: v1.0

---

## Dev 职责

### 提交规范

```bash
git commit -m "fix(test): E1 delete tests/e2e/playwright.config.ts"
git commit -m "fix(test): E1-S3 fix stability.spec.ts glob path"
git commit -m "test(E2): add flowId E2E verification"
git commit -m "refactor(test): E3 replace waitForTimeout with smart waits"
git commit -m "test(E4): add ai-service JSON parsing unit tests"
```

### 禁止事项

| 禁止 | 正确 |
|------|------|
| `tests/e2e/playwright.config.ts` | 单一根配置 |
| `waitForTimeout(n)` | 智能等待 |
| `grepInvert` | 全部测试运行 |

---

## Reviewer 职责

```bash
# R-01: Playwright 配置唯一
find . -name "playwright.config.ts" | wc -l  # 应为 1

# R-02: 无 grepInvert
grep "grepInvert" playwright.config.ts | wc -l  # 应为 0

# R-03: 无 waitForTimeout
grep -rn "waitForTimeout" tests/e2e/ | wc -l  # 应为 0

# R-04: CI 测试数
pnpm playwright test --list | wc -l  # 应 >= 50
```

---

## DoD

- [ ] Playwright 配置唯一
- [ ] 无 grepInvert
- [ ] waitForTimeout → 0
- [ ] CI 运行 >= 50 测试
- [ ] flowId E2E 通过
- [ ] Vitest 全部通过

---

*文档版本: v1.0 | 最后更新: 2026-04-11*
