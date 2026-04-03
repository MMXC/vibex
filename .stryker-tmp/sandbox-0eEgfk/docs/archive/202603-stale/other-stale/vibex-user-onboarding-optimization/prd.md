# PRD: 用户引导流程优化

> **项目**: vibex-user-onboarding-optimization  
> **版本**: 1.0  
> **状态**: Ready for Review  
> **创建日期**: 2026-03-15  
> **PM**: PM Agent

---

## 1. 概述

### 1.1 背景

当前新用户流失率约 70%，现有引导系统存在以下问题：
- 无首次访问自动引导
- 进度不清晰（无顶部进度条）
- 缺乏上下文帮助
- 引导步骤与实际 DDD 流程不一致

### 1.2 目标

| 指标 | 当前 | 目标 |
|------|------|------|
| 新用户流失率 | ~70% | <50% |
| 引导完成率 | - | ≥50% |
| 首次触发 | 无 | 首次访问自动触发 |
| 进度指示 | 弹窗内小点 | 顶部进度条 + 预计时间 |

### 1.3 验收标准

| ID | 验收条件 | 验证方法 |
|----|---------|---------|
| AC1 | 首次访问用户自动弹出引导 | 手动测试 (无痕模式) |
| AC2 | 顶部显示进度条 (Step X/5) | 视觉检查 |
| AC3 | 每步显示预计剩余时间 | 手动测试 |
| AC4 | 点击进度可跳转已完成的步骤 | 手动测试 |
| AC5 | 跳过后可在设置页重新开始 | 手动测试 |
| AC6 | 跳过不影响正常流程使用 | E2E 测试 |
| AC7 | 引导完成后用户留存率提升 | 数据分析 |
| AC8 | 首步完成率提升 20% | A/B 测试 |

---

## 2. 功能需求

### 2.1 首次触发（F1）

| 功能点 | 描述 | 验收标准 |
|--------|------|----------|
| F1.1 | 首次访问自动触发 | `expect(autoTriggered).toBe(true)` |
| F1.2 | localStorage 记录访问状态 | `expect(localStorage.getItem('has-visited')).toBeDefined()` |
| F1.3 | 过期后可重新触发 | 设置过期时间后重新触发 |

**DoD**: 新用户首次访问自动弹出引导

### 2.2 步骤对齐（F2）

| 功能点 | 描述 | 验收标准 |
|--------|------|----------|
| F2.1 | 引导步骤与 DDD 流程对齐 | 5 步与首页流程一致 |
| F2.2 | 每步显示标题和描述 | 步骤内容完整 |
| F2.3 | 每步显示预计时间 | `expect(estimatedTime).toBeDefined()` |

**DoD**: 引导步骤与 DDD 流程完全对齐

### 2.3 进度指示器（F3）

| 功能点 | 描述 | 验收标准 |
|--------|------|----------|
| F3.1 | 顶部进度条显示 | `expect(progressBar.visible).toBe(true)` |
| F3.2 | 当前步骤高亮 | `expect(currentStep.highlighted).toBe(true)` |
| F3.3 | 预计剩余时间显示 | `expect(remainingTime).toBeDefined()` |
| F3.4 | 可点击跳转已完步骤 | `expect(clickableCompleted).toBe(true)` |

**DoD**: 顶部进度条实时显示当前位置

### 2.4 上下文帮助（F4）

| 功能点 | 描述 | 验收标准 |
|--------|------|----------|
| F4.1 | 右侧帮助面板入口 | `expect(helpButton.visible).toBe(true)` |
| F4.2 | 每步骤显示对应 Tips | `expect(tipsForStep).toBeDefined()` |
| F4.3 | AI 问答入口 | `expect(aiChatEntry).toBeDefined()` |

**DoD**: 用户可随时获取上下文帮助

### 2.5 跳过与重置（F5）

| 功能点 | 描述 | 验收标准 |
|--------|------|----------|
| F5.1 | 跳过按钮 | `expect(skipButton.visible).toBe(true)` |
| F5.2 | 跳过不阻塞流程 | 跳过后可正常使用功能 |
| F5.3 | 设置页重新开始 | `expect(restartInSettings).toBe(true)` |

**DoD**: 跳过功能不干扰正常用户体验

---

## 3. 引导流程

```
用户首次访问
      ↓
┌─────────────────┐
│  欢迎弹窗       │  ← F1: 首次触发
│  (3步简介)      │
└────────┬────────┘
         ↓
┌─────────────────┐
│  步骤1: 输入需求 │  ← F2: 步骤对齐
│  预计 1-2min    │  ← F3: 进度指示
│  [需要帮助?]    │  ← F4: 上下文帮助
└────────┬────────┘
         ↓
┌─────────────────┐
│  步骤2: AI 澄清  │
│  预计 2min      │
└────────┬────────┘
         ↓
┌─────────────────┐
│  步骤3: 领域建模 │
│  预计 3min      │
└────────┬────────┘
         ↓
┌─────────────────┐
│  步骤4: 原型生成 │
│  预计 2min      │
└────────┬────────┘
         ↓
┌─────────────────┐
│  完成: 显示奖励  │
│  [跳过] [继续]   │  ← F5: 跳过与重置
└─────────────────┘
```

---

## 4. Epic 拆分

### Epic 1: 首次触发机制

| Story | 描述 | 预估 | 验收 |
|-------|------|------|------|
| E1-S1 | 首次访问检测 Hook | 0.5d | `expect(useFirstVisitDetect).toBeDefined()` |
| E1-S2 | localStorage 状态管理 | 0.25d | `expect(storageKey).toBe('vibex-first-visit')` |
| E1-S3 | 自动触发逻辑集成 | 0.25d | `expect(autoTrigger).toWork()` |

**DoD**: 新用户首次访问自动弹出引导

---

### Epic 2: 进度指示系统

| Story | 描述 | 预估 | 验收 |
|-------|------|------|------|
| E2-S1 | 顶部进度条组件 | 0.5d | `expect(ProgressBar).toRender()` |
| E2-S2 | 预计时间显示 | 0.25d | `expect(timeEstimate).toShow()` |
| E2-S3 | 步骤点击跳转 | 0.25d | `expect(stepClickNavigation).toWork()` |
| E2-S4 | 当前步骤高亮 | 0.25d | `expect(currentHighlight).toBe(true)` |

**DoD**: 顶部进度条实时显示当前位置和预计时间

---

### Epic 3: 上下文帮助系统

| Story | 描述 | 预估 | 验收 |
|-------|------|------|------|
| E3-S1 | 帮助按钮组件 | 0.25d | `expect(helpButton).toBeVisible()` |
| E3-S2 | 右侧帮助面板 | 0.5d | `expect(helpPanel).toRender()` |
| E3-S3 | 步骤 Tips 配置 | 0.25d | `expect(tipsConfig).toBeDefined()` |
| E3-S4 | AI 问答入口 | 0.25d | `expect(aiChatEntry).toExist()` |

**DoD**: 用户可在引导过程中随时获取上下文帮助

---

### Epic 4: 引导流程增强

| Story | 描述 | 预估 | 验收 |
|-------|------|------|------|
| E4-S1 | 欢迎弹窗 3 步介绍 | 0.5d | `expect(welcomeModal).toRender()` |
| E4-S2 | 引导步骤与 DDD 对齐 | 0.5d | `expect(stepsAligned).toBe(true)` |
| E4-S3 | 完成奖励展示 | 0.25d | `expect(completionReward).toShow()` |
| E4-S4 | 跳过与重置逻辑 | 0.25d | `expect(skipReset).toWork()` |

**DoD**: 引导流程清晰、价值主张明确、可跳过可重置

---

### Epic 5: 测试与验证

| Story | 描述 | 预估 | 验收 |
|-------|------|------|------|
| E5-S1 | 首次触发 E2E 测试 | 0.25d | `test('first visit triggers onboarding')` |
| E5-S2 | 进度指示 E2E 测试 | 0.25d | `test('progress bar updates')` |
| E5-S3 | 跳过重置 E2E 测试 | 0.25d | `test('skip and reset flow')` |
| E5-S4 | 帮助面板 E2E 测试 | 0.25d | `test('help panel interactions')` |

**DoD**: 核心流程 E2E 测试覆盖

---

## 5. 实施计划

| Epic | 任务 | 预估 |
|------|------|------|
| Epic 1 | 首次触发机制 | 1d |
| Epic 2 | 进度指示系统 | 1.25d |
| Epic 3 | 上下文帮助系统 | 1.25d |
| Epic 4 | 引导流程增强 | 1.5d |
| Epic 5 | 测试与验证 | 1d |

**总工作量**: 6 人日 ≈ 2 周 (团队并行)

---

## 6. 依赖

| 依赖 | 说明 |
|------|------|
| `vibex-homepage` | 触发入口页面 |
| `onboardingStore` | 现有 Zustand store |
| `StepIndicator` | 现有步骤组件 |

---

## 7. 风险与缓解

| 风险 | 等级 | 缓解措施 |
|------|------|----------|
| 引导弹窗过于打扰 | 🟡 中 | 提供明确的"跳过"入口 |
| 引导与实际流程不一致 | 🔴 高 | 确保引导步骤与 DDD 流程完全对齐 |
| 增加首屏加载时间 | 🟢 低 | 使用动态导入 |
| 用户跳过后不再触发 | 🟡 中 | 设置过期时间后可重新触发 |

---

## 8. 成功指标

- **P0**: 引导首次触发率 ≥90%
- **P0**: 引导完成率 ≥50%
- **P1**: 首步完成率提升 20%
- **P1**: 用户留存率提升 10%

---

**验证**: `test -f /root/.openclaw/vibex/docs/vibex-user-onboarding-optimization/prd.md`
