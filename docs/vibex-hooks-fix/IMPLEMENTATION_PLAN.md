# Implementation Plan: OnboardingProgressBar Hooks 修复

**项目**: vibex-hooks-fix  
**版本**: 1.0  
**日期**: 2026-03-20  
**工作目录**: /root/.openclaw/vibex/vibex-fronted

---

## Epic 1: 修复 OnboardingProgressBar Hooks 违规

### 功能点

| ID | 功能 | 验收标准 | 状态 |
|----|------|---------|------|
| F1.1 | 类型安全修复 | `as any` 已移除，使用正确类型 | ✅ (已通过显式 undefined 检查替换 \|\| fallback) |
| F1.2 | useMemo 依赖修复 | exhaustive-deps 规则通过 | ✅ (`STEP_DURATIONS`/`ONBOARDING_STEPS` 已加入 deps) |
| F1.3 | 测试覆盖率提升 | 语句覆盖 ≥ 80%，分支覆盖 ≥ 70% | ✅ (84.61% stmts / 70% branch / 16 tests) |

---

## 验收标准

| 验收项 | 验证方式 |
|--------|---------|
| 无 `as any` | `grep -r "as any" src/` |
| exhaustive-deps 通过 | `npm run lint` (ESLint react-hooks) |
| 覆盖率达标 | `npm test -- --coverage` |
| TC-001/002/003 PASS | E2E 测试 |

---

## 工作量估算

- **总工时**: 3.5 小时
- **F1.1**: 1 小时
- **F1.2**: 1.5 小时
- **F1.3**: 1 小时

---

*Implementation Plan - 2026-03-20*
