# AGENTS.md: VibeX Analyst Proposals — Execution Closure 2026-04-11

> **项目**: vibex-analyst-proposals-vibex-proposals-20260411  
> **作者**: Architect  
> **日期**: 2026-04-11  
> **版本**: v1.0

---

## Dev 职责

### 提交规范

```bash
git commit -m "fix(P0): S1.1 migrate Slack token to env var"
git commit -m "fix(P0): S1.2 clear ESLint no-explicit-any"
git commit -m "fix(P0): S1.3 add PrismaClient Workers guard"
git commit -m "fix(P0): S1.4 remove @ci-blocking skip"
git commit -m "feat(cli): E2 integrate proposal tracking in CI"
```

### 禁止事项

| 禁止 | 正确 |
|------|------|
| 硬编码 token | 环境变量 |
| `as any` | 具体类型 |
| `grepInvert` | 全部测试 |

---

## Reviewer 职责

```bash
# R-01: 无硬编码 token
grep -rn "xoxp" scripts/ | wc -l  # 应为 0

# R-02: tsc 通过
pnpm exec tsc --noEmit  # 0 errors

# R-03: deploy 成功
pnpm run deploy  # 成功

# R-04: 无 @ci-blocking
grep "@ci-blocking" tests/ | wc -l  # 应为 0
```

---

## DoD

- [ ] task_manager.py 无 xoxp 字符串
- [ ] tsc --noEmit 0 errors
- [ ] wrangler deploy 成功
- [ ] 无 @ci-blocking 跳过

---

*文档版本: v1.0 | 最后更新: 2026-04-11*
