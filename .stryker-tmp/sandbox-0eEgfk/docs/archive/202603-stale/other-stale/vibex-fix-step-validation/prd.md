# PRD: vibex-fix-step-validation

## 1. 执行摘要

| 属性 | 值 |
|------|-----|
| **项目** | vibex-fix-step-validation |
| **类型** | Bug 修复 |
| **目标** | 修复 Step 验证逻辑测试回归，确保测试套件 100% 通过 |
| **完成标准** | `npm test` 所有测试通过，手动验证流程正常 |
| **工作量** | 1 天 |
| **页面集成** | 【需页面集成】Step 导航组件 (StepNavigation, StepIndicator) |

---

## 2. 问题陈述

Step 验证逻辑存在测试回归，导致 Step 1→2、Step 2→3 验证失败，空输入无响应。

---

## 3. Epic 拆分

### Epic 1: 缺陷定位

**Story F1.1**: 运行测试套件定位失败用例
- **验收标准**:
  - `expect(failedTests).toEqual([])`
  - `expect(testResults).toContain('StepValidation')`

**Story F1.2**: 分析验证逻辑代码
- **验收标准**:
  - `expect(validationRules).toBeDefined()`
  - `expect(validationRules.length).toBeGreaterThan(0)`

### Epic 2: 缺陷修复

**Story F2.1**: 修复 StepValidation.ts 验证逻辑
- 修复边界条件处理
- **验收标准**:
  - `expect(validateStep(1, 2)).toBe(true)`  // 正向流转
  - `expect(validateStep(2, 1)).toBe(false)` // 跳过步骤
  - `expect(validateStep(1, 3)).toBe(false)` // 跳过步骤
  - `expect(validateStep(1, '')).toBe(false)` // 空输入
  - `expect(validateStep(1, null)).toBe(false)` // null
  - `expect(validateStep(1, undefined)).toBe(false)` // undefined

**Story F2.2**: 修复 useStepNavigation.ts 状态转换
- **验收标准**:
  - `expect(canNavigate(1, 2)).toBe(true)`
  - `expect(canNavigate(2, 3)).toBe(true)`
  - `expect(currentStep).toBe(1)` // 初始状态

### Epic 3: 测试完善

**Story F3.1**: 补充边界条件测试
- **验收标准**:
  - `expect(testCoverage).toBeGreaterThan(80%)`
  - `expect(boundaryTests).toBeDefined()`

**Story F3.2**: 完整回归测试
- **验收标准**:
  - `expect(exec('npm test').exitCode).toBe(0)`

---

## 4. 验收标准汇总

| ID | Given | When | Then |
|----|-------|------|------|
| AC1.1 | 运行 `npm test` | 测试完成 | 100% 通过 |
| AC1.2 | Step 1→2 导航 | 验证逻辑 | 允许前进 |
| AC1.3 | Step 2→1 导航 | 验证逻辑 | 允许后退 |
| AC1.4 | 空输入验证 | 触发验证 | 显示错误 |
| AC2.1 | 手动测试流程 | 用户操作 | 流程正常 |
| AC2.2 | 边界条件 | 各种输入 | 正确处理 |

---

## 5. 非功能需求

- **可靠性**: 测试通过率 100%
- **可维护性**: 测试用例清晰
- **可回归性**: 自动化测试覆盖核心路径

---

## 6. DoD

- [ ] `npm test` 全通过
- [ ] 手动验证流程正常
- [ ] 边界条件正确处理
- [ ] 测试覆盖率 > 80%
- [ ] Code Review 通过
