# AGENTS.md: VibeX Reviewer Proposals 2026-04-11

> **项目**: vibex-reviewer-proposals-vibex-proposals-20260411  
> **作者**: Architect  
> **日期**: 2026-04-11  
> **版本**: v1.0

---

## Dev 职责

### 提交规范

```bash
git commit -m "fix(type): S1.1 remove as any from catalog.ts"
git commit -m "fix(type): S1.2 remove as any from registry.tsx"
git commit -m "fix(type): S1.3 add explicit types to useDDDStateRestore"
git commit -m "fix(error): S2.1 add logging to NotificationService catch"
git commit -m "fix(error): S2.2 add logging to PrototypePage catch"
git commit -m "chore(lint): E3 add @typescript-eslint rules"
```

### 禁止事项

| 禁止 | 正确 |
|------|------|
| `as any` | `unknown` + 类型守卫 |
| 空 catch | 有日志的 catch |
| 新的 eslint-disable | 评审后添加 |

---

## Reviewer 职责

```bash
# R-01: 无 as any
grep -rn "as any" vibex-fronted/src/ vibex-backend/src/ | wc -l  # 应为 0

# R-02: 无空 catch
grep -rn "} catch { }" vibex-fronted/src/ vibex-backend/src/ | wc -l  # 应为 0

# R-03: tsc 通过
pnpm exec tsc --noEmit  # 0 errors
```

---

## DoD

- [ ] `as any` → 0 结果
- [ ] 空 catch → 0 结果
- [ ] tsc --noEmit → 0 errors
- [ ] lint → 0 errors

---

*文档版本: v1.0 | 最后更新: 2026-04-11*
