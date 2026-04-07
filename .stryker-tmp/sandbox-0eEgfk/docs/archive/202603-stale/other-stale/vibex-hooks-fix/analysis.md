# 分析报告：OnboardingProgressBar Hooks 违规修复

**项目**: vibex-hooks-fix
**分析时间**: 2026-03-20 00:47 (GMT+8)
**分析师**: analyst
**状态**: done

---

## 1. 问题陈述

OnboardingProgressBar 组件存在 Hooks 相关违规：

| 问题 | 严重度 | 说明 |
|------|--------|------|
| `as any` 类型断言 | P1 | `currentStep as any` 绕过类型检查 |
| 缺少 useMemo 依赖 | P2 | 潜在无限循环风险 |
| 覆盖率为 16% | P2 | 缺少单元测试 |

## 2. 代码分析

### 问题 1：类型安全违规
```tsx
// Line 25 - 问题代码
const currentIndex = getStepIndex(currentStep as any);
```

**问题**: 使用 `as any` 绕过 TypeScript 类型检查  
**风险**: 可能传入非法类型导致运行时错误  
**修复**: 使用正确的类型断言 `as OnboardingStep`

### 问题 2：useMemo 依赖不完整
```tsx
// Line 40 - useMemo 依赖
}, [currentIndex, totalSteps]);  // 缺少 ONBOARDING_STEPS

// Line 32 - useMemo 依赖
}, [completedSteps.length, totalSteps]);  // 缺少 completedSteps
```

**问题**: 依赖数组不完整，可能导致 stale 值  
**修复**: 添加完整依赖项

### 问题 3：测试覆盖不足
| 指标 | 当前值 | 目标值 |
|------|--------|--------|
| 语句覆盖 | 16% | 80% |
| 分支覆盖 | 10% | 70% |
| 函数覆盖 | 33% | 80% |

## 3. 技术方案

### 推荐修复

#### 3.1 类型修复
```tsx
import type { OnboardingStep } from '@/stores/onboarding';

const currentIndex = getStepIndex(currentStep as OnboardingStep);
```

#### 3.2 useMemo 依赖修复
```tsx
// progressPercent
}, [completedSteps, completedSteps.length, totalSteps]);

// remainingTime
}, [currentIndex, totalSteps, ONBOARDING_STEPS]);
```

#### 3.3 添加测试
```tsx
// OnboardingProgressBar.test.tsx
describe('OnboardingProgressBar', () => {
  it('renders progress bar when status is in-progress', () => {
    // 测试渲染
  });
  
  it('calculates progress percentage correctly', () => {
    // 测试进度计算
  });
  
  it('returns null when status is not in-progress', () => {
    // 测试条件渲染
  });
});
```

## 4. 验收标准

- [ ] 移除所有 `as any` 类型断言
- [ ] useMemo 依赖数组包含所有使用的变量
- [ ] 测试覆盖率 ≥ 80%
- [ ] ESLint react-hooks 检查通过

## 5. 风险分析

| 风险 | 影响 | 缓解 |
|------|------|------|
| 类型修改引入兼容性问题 | 中 | 单元测试验证 |
| 测试覆盖率要求过高 | 低 | 渐进式提升 |

## 6. 工作量估算

| 任务 | 估算 |
|------|------|
| 类型修复 | 0.5h |
| useMemo 优化 | 0.5h |
| 单元测试 | 2h |
| CI 配置 | 0.5h |

**总计**: 3.5 小时

## 7. 下一步

1. Dev 修复类型断言
2. 添加单元测试
3. 验证覆盖率达标
4. 启用 react-hooks eslint 规则
