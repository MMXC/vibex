# PRD: vibex-hooks-fix

## 1. 执行摘要

| 属性 | 值 |
|------|-----|
| **项目** | vibex-hooks-fix |
| **类型** | Bug 修复 |
| **目标** | 修复 OnboardingProgressBar Hooks 违规问题 |
| **完成标准** | ESLint react-hooks 检查通过，测试覆盖率 ≥ 80% |
| **工作量** | 3.5 小时 |
| **页面集成** | 【需页面集成】OnboardingProgressBar (首页) |

---

## 2. 问题陈述

OnboardingProgressBar 组件存在三类问题：
1. `as any` 类型断言绕过类型检查
2. useMemo 依赖数组不完整
3. 测试覆盖率仅 16%

影响：TC-001/002/003 E2E 测试全部 FAIL

---

## 3. Epic 拆分

### Epic 1: 类型安全修复 (P0)

**Story F1.1**: 移除 as any 类型断言
- 文件: `OnboardingProgressBar.tsx:25`
- **验收标准**:
  - `expect(grep('OnboardingProgressBar.tsx', 'as any').length).toBe(0)`
  - `expect(grep('OnboardingProgressBar.tsx', 'as OnboardingStep').length).toBeGreaterThan(0)`

### Epic 2: Hook 依赖修复 (P0)

**Story F2.1**: 修复 useMemo 依赖数组
- **验收标准**:
  - `expect(useMemoCalls).toMatchDependencies()` // 所有依赖项完整
  - `expect(exec('npm run lint -- --rule "react-hooks/exhaustive-deps": "error"').exitCode).toBe(0)`

### Epic 3: 测试覆盖提升 (P1)

**Story F3.1**: 添加单元测试
- 新增 `OnboardingProgressBar.test.tsx`
- **验收标准**:
  - `expect(exec('npx jest OnboardingProgressBar --coverage').exitCode).toBe(0)`
  - `expect(statementCoverage).toBeGreaterThanOrEqual(80)`
  - `expect(branchCoverage).toBeGreaterThanOrEqual(70)`
  - `expect(functionCoverage).toBeGreaterThanOrEqual(80)`

**Story F3.2**: 测试用例覆盖
- **验收标准**:
  - `expect(test('renders progress bar when status is in-progress')).toBeDefined()`
  - `expect(test('calculates progress percentage correctly')).toBeDefined()`
  - `expect(test('returns null when status is not in-progress')).toBeDefined()`

### Epic 4: CI 验证 (P0)

**Story F4.1**: ESLint react-hooks 规则启用
- **验收标准**:
  - `expect(eslintConfig).toContain('react-hooks/exhaustive-deps')`
  - `expect(exec('npm run lint').exitCode).toBe(0)`

---

## 4. 验收标准汇总

| ID | Given | When | Then |
|----|-------|------|------|
| AC1.1 | 代码检查 | lint | 无 `as any` |
| AC1.2 | OnboardingProgressBar.tsx | 类型检查 | 使用 `as OnboardingStep` |
| AC2.1 | useMemo 调用 | ESLint | exhaustive-deps 通过 |
| AC3.1 | 运行 jest --coverage | 测试完成 | 语句覆盖 ≥ 80% |
| AC3.2 | 运行 jest --coverage | 测试完成 | 分支覆盖 ≥ 70% |
| AC3.3 | 运行 jest --coverage | 测试完成 | 函数覆盖 ≥ 80% |
| AC4.1 | `npm run lint` | CI 检查 | 退出码 0 |

---

## 5. 非功能需求

- **可靠性**: E2E TC-001/002/003 全部 PASS
- **可维护性**: 测试覆盖率 80%+
- **类型安全**: 无 `as any`

---

## 6. DoD

- [ ] `as any` 已移除
- [ ] useMemo 依赖完整
- [ ] 语句/分支/函数覆盖率 ≥ 80%/70%/80%
- [ ] ESLint react-hooks 通过
- [ ] TC-001/002/003 PASS
