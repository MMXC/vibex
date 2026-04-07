# PRD: vibex-type-safety-cleanup

## 1. 执行摘要

| 属性 | 值 |
|------|-----|
| **项目** | vibex-type-safety-cleanup |
| **类型** | 代码质量提升 |
| **目标** | 清理代码中的 `as any` 类型断言，提升 TypeScript 类型安全 |
| **完成标准** | `as any` 使用 < 10 次，`npm run type-check` 通过 |
| **工作量** | 2 天 |
| **页面集成** | 【需页面集成】components/ (UI 组件), hooks/ (状态逻辑) |

---

## 2. 问题陈述

代码中存在大量 `as any` 类型断言，导致类型丢失、运行时风险增加、重构困难。

---

## 3. Epic 拆分

### Epic 1: 现状分析 (0.5天)

**Story F1.1**: 统计 as any 使用情况
- **验收标准**:
  - `expect(asAnyCount).toBeLessThan(10)`
  - `expect(asAnyList).toBeDefined()`
  - `expect(asAnyList.length).toBeGreaterThan(0)`

**Story F1.2**: 分类优先级
- **验收标准**:
  - `expect(highPriority.length).toBeGreaterThan(0)`

### Epic 2: 修复 components/ (0.5天)

**Story F2.1**: 定义组件类型
- **验收标准**:
  - `expect(componentTypes).toBeDefined()`

**Story F2.2**: 移除 as any
- **验收标准**:
  - `expect(grep('src/components/**', 'as any').length).toBe(0)`

### Epic 3: 修复 hooks/ (0.5天)

**Story F3.1**: 定义 Hook 类型
- **验收标准**:
  - `expect(hookTypes).toBeDefined()`

**Story F3.2**: 移除 as any
- **验收标准**:
  - `expect(grep('src/hooks/**', 'as any').length).toBe(0)`

### Epic 4: 修复 api/ 和 utils/ (0.5天)

**Story F4.1**: 定义 API 类型
- **验收标准**:
  - `expect(apiTypes).toBeDefined()`

**Story F4.2**: 移除 as any
- **验收标准**:
  - `expect(grep('src/api/**', 'as any').length).toBe(0)`
  - `expect(grep('src/utils/**', 'as any').length).toBe(0)`

### Epic 5: 质量保障

**Story F5.1**: 配置 ESLint 规则
- **验收标准**:
  - `expect(eslintConfig).toContain('@typescript-eslint/no-explicit-any')`
  - `expect(eslintConfig).toContain('@typescript-eslint/no-unsafe-assignment')`

**Story F5.2**: 完整测试验证
- **验收标准**:
  - `expect(exec('npm run type-check').exitCode).toBe(0)`
  - `expect(exec('npm test').exitCode).toBe(0)`

---

## 4. 验收标准汇总

| ID | Given | When | Then |
|----|-------|------|------|
| AC1.1 | 执行 `grep -rn "as any" src/` | 扫描完成 | 使用次数 < 10 |
| AC1.2 | 执行 `npm run type-check` | 类型检查 | 退出码为 0 |
| AC2.1 | 执行 `npm test` | 运行测试 | 全部通过 |
| AC2.2 | components/ 目录 | 检查 | 无 as any |
| AC2.3 | hooks/ 目录 | 检查 | 无 as any |
| AC2.4 | api/ 目录 | 检查 | 无 as any |

---

## 5. 优先级清单

| 模块 | as any 数量 | 优先级 | 工作量 |
|------|-------------|--------|--------|
| components/ | 高 | P0 | 0.5天 |
| hooks/ | 中 | P1 | 0.5天 |
| api/ | 中 | P1 | 0.5天 |
| utils/ | 低 | P2 | 0.5天 |

---

## 6. 非功能需求

- **可靠性**: 测试覆盖率保持 100%
- **性能**: 类型检查时间 < 60s
- **可维护性**: 所有类型定义清晰

---

## 7. DoD

- [ ] `as any` 使用 < 10
- [ ] `npm run type-check` 通过
- [ ] `npm test` 全部通过
- [ ] ESLint 规则配置完成
- [ ] Code Review 通过
