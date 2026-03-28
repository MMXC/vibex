# Architecture: OnboardingProgressBar Hooks 修复

**项目**: vibex-hooks-fix  
**版本**: 1.0  
**日期**: 2026-03-20

---

## 1. 问题概述

修复 OnboardingProgressBar 组件的三类问题：
1. `as any` 类型断言
2. useMemo 依赖数组不完整
3. 测试覆盖率仅 16%

---

## 2. Tech Stack

| 类别 | 工具 | 说明 |
|------|------|------|
| Linter | ESLint | react-hooks 规则 |
| 测试 | Jest + RTL | 单元测试 |
| 类型检查 | TypeScript | strict 模式 |

---

## 3. 修复策略

### 3.1 类型安全修复

```typescript
// Before
const step = data as any;

// After
const step = data as OnboardingStep;
```

### 3.2 Hook 依赖修复

```typescript
// Before
const value = useMemo(() => compute(a, b), [a]);

// After
const value = useMemo(() => compute(a, b), [a, b]);
```

---

## 4. 测试覆盖目标

| 指标 | 当前 | 目标 |
|------|------|------|
| 语句覆盖 | 16% | ≥ 80% |
| 分支覆盖 | - | ≥ 70% |
| 函数覆盖 | - | ≥ 80% |

---

## 5. 验收标准

| 标准 | 验证方式 |
|------|----------|
| 无 `as any` | grep 检查 |
| exhaustive-deps 通过 | ESLint |
| 覆盖率达标 | Jest coverage |
| TC-001/002/003 PASS | E2E 测试 |

---

## 6. 工作量

**3.5 小时**

---

*Architecture - 2026-03-20*
