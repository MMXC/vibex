# Implementation Plan: vibex-onboarding-redesign

## Overview
- **Project**: vibex-onboarding-redesign
- **Objective**: Redesign user onboarding flow to solve three 断裂 problems
- **Estimated Duration**: 18 hours
- **Status**: In Progress (~60% 已完成)
- **Last Updated**: 2026-03-20 by Dev Agent

## Tech Stack
- Next.js
- Zustand (state management)
- CSS Modules
- Framer Motion (animations)

---

## Component Inventory (2026-03-20 现状)

```
src/components/onboarding/
├── OnboardingModal.tsx           ✅ 5 步引导弹窗，ESC 关闭
├── OnboardingProgressBar.tsx     ✅ 进度条 + 剩余时间计算
├── OnboardingProvider.tsx        ✅ Context provider
├── StepIndicator.tsx             ✅ 步骤指示器（可点击跳转）
├── steps/
│   ├── WelcomeStep.tsx          ✅
│   ├── InputStep.tsx            ✅
│   ├── ClarifyStep.tsx          ✅
│   ├── ModelStep.tsx            ✅
│   └── PreviewStep.tsx          ✅
└── *.module.css                 ✅
```

**store**: `src/stores/onboarding/onboardingStore.ts` — Zustand with localStorage persist

---

## Epic & Story Breakdown

### Epic 1: 引导流程优化 (P0) ✅ 大部分完成

#### Story F1.1: 简化引导步骤 ✅
- **Task F1.1.1**: 合并重复/冗余步骤，目标步骤数 ≤ 5
  - 当前实现: 5 步 (welcome → input → clarify → model → prototype)
- **验收标准**: `stepCount ≤ 5` ✅ **已满足**

#### Story F1.2: 进度指示器 ✅
- **Task F1.2.1**: 实现 ProgressIndicator 组件 ✅ (StepIndicator.tsx)
- **Task F1.2.2**: 将进度与 Zustand store 同步 ✅
- **Task F1.2.3**: 支持步骤点击跳转（已完成步骤）✅ (OnboardingModal.tsx handleStepClick)
- **验收标准**: `hasProgressIndicator === true` ✅ **已满足**

#### Story F1.3: 跳过功能 ✅
- **Task F1.3.1**: 实现跳过按钮 UI ✅ (OnboardingModal.tsx 跳过按钮)
- **Task F1.3.2**: 添加跳过逻辑 ✅ (ESC 键 + 跳过按钮调用 store.skip())
- **验收标准**: `canSkipOnboarding === true` ✅ **已满足**

---

### Epic 2: 个性化引导 (P1)

#### Story F2.1: 基于角色的引导 ❌ 未实现
- **Task F2.1.1**: 定义角色类型（Individual / Team / Enterprise）⏳ pending
- **Task F2.1.2**: 实现角色选择 Step ⏳ pending
- **Task F2.1.3**: 根据角色渲染不同步骤流 ⏳ pending
- **验收标准**: `roleBasedContent === true`
- **实现建议**:
  - 在 `ONBOARDING_STEPS` 中增加 `roles` 字段标记适用角色
  - WelcomeStep 中添加角色选择
  - `getFilteredSteps(role: UserRole): OnboardingStep[]` 过滤步骤

#### Story F2.2: 进度保存 ✅
- **Task F2.2.1**: 配置 Zustand persist（localStorage）✅
- **Task F2.2.2**: 页面刷新后恢复进度 ✅
- **Task F2.2.3**: 引导完成后清除存储数据 ✅
- **验收标准**: `progress === 刷新前值` ✅ **已满足**

---

## Acceptance Criteria Status

| ID | Given | When | Then | Status |
|----|-------|------|------|--------|
| AC1.1 | 新用户 | 进入引导 | 步骤数 ≤ 5 | ✅ 5 步 |
| AC1.2 | 用户 | 任何步骤 | 进度条可见 | ✅ OnboardingProgressBar |
| AC1.3 | 用户 | 刷新页面 | 进度保留 | ✅ Zustand persist |
| AC1.4 | 用户 | 非必填步骤 | 可跳过 | ✅ skip 按钮 + ESC |
| AC2.1 | Individual 用户 | 开始引导 | 看到个人引导内容 | ❌ pending |
| AC2.2 | Team 用户 | 开始引导 | 看到团队引导内容 | ❌ pending |
| AC2.3 | 用户 | 完成引导 | 进入主应用 | ✅ complete() 跳转 |

---

## Remaining Work

### P1: 基于角色的引导内容 (F2.1) — ~8h

1. **角色类型定义** (1h)
   - 在 `stores/onboarding/types.ts` 中添加 `UserRole` 类型
   - 定义角色: `individual`, `team`, `enterprise`

2. **角色选择 Step** (3h)
   - 在 WelcomeStep 中添加角色选择按钮
   - 更新 onboardingStore 添加 `userRole` 字段

3. **步骤流过滤** (2h)
   - 根据角色过滤 ONBOARDING_STEPS
   - Team/Enterprise 用户跳过/添加特定步骤

4. **角色化内容** (2h)
   - 各个 Step 根据角色显示不同描述和图标
   - 添加 analytics 事件埋点

### P2: 非功能需求 (可选) — ~4h

1. **性能优化**: 引导首次加载 < 2s (代码分割)
2. **无障碍**: 键盘导航支持
3. **移动端适配**: 响应式布局

---

## Definition of Done

- [x] 引导步骤 ≤ 5
- [x] 进度指示器可见且同步
- [x] 进度通过 localStorage 持久化
- [x] 可跳过非必填步骤
- [ ] 基于角色渲染不同内容 ← **主工作项**
- [ ] `npm run build` 通过
- [ ] E2E 测试覆盖核心路径

---

## 已完成工作 (2026-03-20 Dev)

1. ✅ 审查现有 onboarding 实现 (OnboardingModal, OnboardingProgressBar, stores)
2. ✅ 确认 F1.1, F1.2, F1.3, F2.2 已通过现有代码满足
3. ⚠️ F2.1 (基于角色引导) 需要新增功能实现，估算 8h

*Last Updated: 2026-03-20 by Dev Agent*
