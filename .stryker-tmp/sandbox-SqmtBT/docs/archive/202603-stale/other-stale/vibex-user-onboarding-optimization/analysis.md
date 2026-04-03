# 需求分析报告: 用户引导流程优化 (vibex-user-onboarding-optimization)

**分析日期**: 2026-03-15  
**分析人**: Analyst Agent  
**状态**: 待评审  
**优先级**: P0

---

## 一、执行摘要

**目标**: 降低新用户流失，提升首日转化率

**当前状态**:
- ✅ 已有基础引导系统 (5 步引导)
- ⚠️ 缺乏进度指示和上下文帮助
- ❌ 用户可能在第一步流失

**优化方向**:
- 增强首次使用引导
- 添加进度指示器
- 引入上下文帮助

**工作量估算**: 3 人日

---

## 二、现状分析

### 2.1 当前引导系统架构

```
引导系统组件:
├── stores/onboarding/onboardingStore.ts   # 状态管理 (Zustand)
├── components/onboarding/OnboardingModal.tsx  # 引导弹窗
├── components/onboarding/OnboardingProvider.tsx # Provider
├── components/onboarding/steps/             # 分步骤组件
│   ├── InputStep.tsx
│   ├── ClarifyStep.tsx
│   ├── ModelStep.tsx
│   └── PreviewStep.tsx
└── hooks/useOnboarding.ts                  # Hook
```

### 2.2 当前引导流程

```
步骤顺序:
1. welcome → 欢迎介绍 (1min)
2. input   → 需求录入 (2min)
3. clarify → AI 澄清   (2min)
4. model   → 领域建模 (3min)
5. prototype → 原型生成 (2min)

总计: 约 10 分钟
```

### 2.3 现有功能

| 功能 | 状态 | 说明 |
|------|------|------|
| 引导弹窗 | ✅ | 使用 Framer Motion 动画 |
| 步骤指示器 | ✅ | StepIndicator 组件 |
| 进度持久化 | ✅ | Zustand persist → localStorage |
| 跳过/完成 | ✅ | 支持跳过和完成 |
| 重新开始 | ✅ | OnboardingSettings 可重置 |

---

## 三、问题与流失点分析

### 3.1 用户流失节点

```
用户旅程漏斗:
┌──────────────────────────────────────────────────────────────┐
│  首页访问                                                      │
│    ↓  流失点 1: 不知道能做什么 (无引导)                        │
│  输入需求                                                      │
│    ↓  流失点 2: 不知道如何描述需求                             │
│  AI 澄清                                                      │
│    ↓  流失点 3: 等待时间过长                                  │
│  领域建模                                                      │
│    ↓  流失点 4: 不理解输出内容                                │
│  原型生成                                                      │
│    ↓  流失点 5: 注册门槛                                      │
│  完成注册                                                      │
└──────────────────────────────────────────────────────────────┘
```

### 3.2 具体问题

| 问题 | 描述 | 流失影响 |
|------|------|----------|
| **无首次引导** | 首页直接显示，无欢迎/介绍 | 高 |
| **进度不清晰** | 顶部无进度条，不确定还要多久 | 中 |
| **帮助缺失** | 右侧无帮助面板，问题无处问 | 中 |
| **无时间预期** | 不知道每步需要多长时间 | 中 |
| **引导与实际不符** | 引导步骤 vs 实际 DDD 流程不一致 | 高 |

### 3.3 对比分析

| 维度 | VibeX 当前 | Lovable.dev | Cursor |
|------|-----------|-------------|--------|
| 首次引导 | ❌ 无 | ✅ 3步弹窗 | ✅ 首次 |
| 进度指示 | ⚠️ 弹窗内 | ✅ 顶部进度 | ✅ 底部状态 |
| 上下文帮助 | ❌ 无 | ✅ 右侧面板 | ✅ AI 助手 |
| 时间预期 | ❌ 无 | ✅ 预估时间 | ✅ ETA |

---

## 四、竞品引导策略分析

### 4.1 Lovable.dev

```
首次引导流程:
┌─────────────────────────────────────────────────────────────┐
│  🎉 欢迎使用 Lovable                                         │
│                                                             │
│  1. 描述你想要的应用                                        │
│     "Build a task management app..."                       │
│                                                             │
│  2. AI 生成初版                                            │
│     ⏳ 约 2-3 分钟                                          │
│                                                             │
│  3. 迭代优化                                                │
│     📝 直接编辑 / 🤖 AI 辅助                                │
│                                                             │
│  [开始构建] [跳过]                                          │
└─────────────────────────────────────────────────────────────┘
```

**关键点**:
- 3 步简洁明了
- 突出核心价值
- 跳过不影响体验

### 4.2 Cursor / Windsurf

```
IDE 内引导:
- 首次启动显示功能介绍
- 底部状态栏显示当前操作 ETA
- AI 助手随时可用
- Cmd+K 快捷调用 AI
```

**关键点**:
- 渐进式揭示
- 上下文感知
- 快捷键支持

---

## 五、优化方案

### 5.1 方案 A: 增强现有引导弹窗 (推荐)

**改进点**:

| 功能 | 当前 | 优化后 |
|------|------|--------|
| 首次触发 | 无 | 用户首次访问自动触发 |
| 步骤对齐 | 5步独立 | 与 DDD 5步流程对齐 |
| 进度显示 | 弹窗内小点 | 顶部进度条 + 时间 |
| 帮助入口 | 无 | 右侧帮助面板 |

**实现工作量**: 3 人日

```typescript
// 优化后的引导步骤
const ENHANCED_ONBOARDING_STEPS = [
  {
    id: 'welcome',
    title: '欢迎使用 VibeX',
    description: 'AI 驱动的协作式 DDD 建模平台',
    duration: '< 1min',
    valueProp: '5分钟生成完整产品原型',  // 新增
  },
  {
    id: 'input',
    title: '描述你的需求',
    description: '用自然语言描述你想要的产品',
    duration: '1-2min',
    tips: ['尽量详细', '可以举例'],  // 新增
    helpLink: '/help/requirements', // 新增
  },
  // ...
];
```

### 5.2 方案 B: 嵌入式引导

**特点**:
- 不使用弹窗
- 页面内逐步高亮引导
- 适合复杂产品

**实现工作量**: 5 人日

### 5.3 方案 C: 分层引导

```
┌─────────────────────────────────────────────────────────────┐
│                    新用户引导分层                            │
├─────────────────────────────────────────────────────────────┤
│  Layer 1: 首次访问 (全局)                                  │
│  ├── 欢迎弹窗 (3步)                                        │
│  └── 价值主张                                             │
│                                                             │
│  Layer 2: 步骤级引导 (每个 DDD 步骤)                       │
│  ├── 顶部进度条                                            │
│  ├── 预计剩余时间                                          │
│  └── 右侧帮助面板                                          │
│                                                             │
│  Layer 3: 上下文帮助                                       │
│  ├── AI 问答入口                                           │
│  └── 常见问题                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 六、技术实现建议

### 6.1 顶部进度指示器

```typescript
// components/progress/OnboardingProgressBar.tsx
interface ProgressBarProps {
  currentStep: number;    // 1-5
  totalSteps: number;      // 5
  estimatedTime: string;  // "约 3 分钟"
  onStepClick?: (step: number) => void;
}
```

### 6.2 上下文帮助面板

```typescript
// components/help/ContextHelpPanel.tsx
interface ContextHelpProps {
  step: 'input' | 'clarify' | 'model' | 'flow';
  tips: string[];
  faqs: FAQ[];
  onAIChat?: () => void;  // AI 问答入口
}
```

### 6.3 引导触发逻辑

```typescript
// hooks/useOnboardingTrigger.ts
const useOnboardingTrigger = () => {
  const { status } = useOnboardingStore();
  const hasVisited = useLocalStorage('has-visited-homepage');
  
  useEffect(() => {
    // 用户首次访问且未完成过引导
    if (!hasVisited && status === 'not-started') {
      // 显示引导
      useOnboardingStore.getState().start();
    }
    setHasVisited(true);
  }, []);
};
```

---

## 七、验收标准

| # | 验收条件 | 验证方法 |
|---|---------|---------|
| 1 | 首次访问用户自动弹出引导 | 手动测试 (无痕模式) |
| 2 | 顶部显示进度条 (Step X/5) | 视觉检查 |
| 3 | 每步显示预计剩余时间 | 手动测试 |
| 4 | 点击进度可跳转已完成的步骤 | 手动测试 |
| 5 | 跳过后可在设置页重新开始 | 手动测试 |
| 6 | 跳过不影响正常流程使用 | E2E 测试 |
| 7 | 引导完成后用户留存率提升 | 数据分析 |
| 8 | 首步完成率提升 20% | A/B 测试 |

---

## 八、风险评估

| 风险 | 等级 | 缓解措施 |
|------|------|----------|
| 引导弹窗过于打扰 | 🟡 中 | 提供明确的"跳过"入口 |
| 引导与实际流程不一致 | 🔴 高 | 确保引导步骤与 DDD 流程完全对齐 |
| 增加首屏加载时间 | 🟢 低 | 使用动态导入 |
| 用户跳过后不再触发 | 🟡 中 | 设置过期时间后可重新触发 |

---

## 九、与现有代码的关系

```
改动文件:
├── src/stores/onboarding/types.ts        # 新增字段
├── src/stores/onboarding/onboardingStore.ts  # 触发逻辑
├── src/components/onboarding/OnboardingModal.tsx # 增强 UI
├── src/components/onboarding/StepIndicator.tsx  # 进度条
└── src/components/homepage/HomePage.tsx        # 触发入口
```

---

## 十、下一步

### 立即行动 (P0)

1. **对齐引导步骤与 DDD 流程**
   - 当前: welcome → input → clarify → model → prototype
   - 建议: 与首页的 5 步流程完全对齐

2. **添加顶部进度指示器**
   - 使用现有 StepIndicator 组件
   - 添加预计时间显示

3. **添加上下文帮助入口**
   - 右侧帮助面板
   - AI 问答入口

---

**产出物**: `/root/.openclaw/vibex/docs/vibex-user-onboarding-optimization/analysis.md`  
**分析人**: Analyst Agent  
**日期**: 2026-03-15