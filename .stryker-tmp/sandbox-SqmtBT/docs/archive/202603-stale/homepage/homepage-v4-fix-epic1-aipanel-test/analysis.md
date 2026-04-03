# homepage-v4-fix-epic1-aipanel-test 需求分析报告

> 项目: homepage-v4-fix-epic1-aipanel-test  
> 分析时间: 2026-03-22  
> 分析师: Analyst Agent  
> 状态: ✅ 分析完成

---

## 执行摘要

**一句话结论**: Epic1 AI 面板测试失败，根因是 Jest 配置错误（Playwright e2e 测试被 Jest 执行）。

**关键指标**:
- 问题类型: 配置错误
- 影响: 241 个测试套件失败
- 修复工时: 1h

---

## 1. 问题分析

### 1.1 测试失败根因

| 问题 | 描述 | 影响 |
|------|------|------|
| Jest 配置错误 | Jest 尝试执行 Playwright e2e 测试 | 241 测试套件失败 |
| 模块类型不匹配 | e2e 文件使用 ES Module 但 Jest 配置为 CommonJS | 语法错误 |

### 1.2 错误信息

```
SyntaxError: Cannot use import statement outside a module
/root/.openclaw/vibex/vibex-fronted/e2e/feat-021-entity-list.spec.ts:6
import { test, expect } from '@playwright/test';
```

---

## 2. 修复方案

### 方案A: 排除 e2e 目录 (推荐)

**修改**: `jest.config.ts`

```typescript
module.exports = {
  // ... 其他配置
  testPathIgnorePatterns: [
    '/node_modules/',
    '/e2e/'  // 排除 e2e 目录
  ]
};
```

**优点**:
- 简单直接
- 不影响 e2e 测试
- 修复时间 < 1h

### 方案B: 分离 Jest 和 Playwright 配置

**修改**: 使用 `projects` 配置分离

```typescript
module.exports = {
  projects: [
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/src/**/*.test.ts'],
    },
    {
      displayName: 'e2e',
      testRunner: 'playwright',
      testMatch: ['<rootDir>/e2e/**/*.spec.ts'],
    }
  ]
};
```

**优点**:
- 配置规范
- 职责分离

**缺点**:
- 配置复杂
- 修复时间 > 2h

---

## 3. 验收标准

| ID | 验收标准 | 测试方法 |
|----|----------|----------|
| AC-01 | Jest 测试可正常运行 | `npx jest` 无配置错误 |
| AC-02 | e2e 测试不受影响 | Playwright 测试独立运行 |
| AC-03 | 单元测试 100% 通过 | `npx jest --passWithNoTests` |

---

## 4. 风险评估

| 风险 | 等级 | 缓解 |
|------|------|------|
| 修复引入新问题 | 低 | 回归测试 |
| 配置冲突 | 低 | 检查其他配置 |

---

**分析完成**: ✅  
**下一步**: Dev 修复 Jest 配置
