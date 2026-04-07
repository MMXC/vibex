# SPEC: E2-P002 - 新手引导流程

**Epic**: E2-P002
**版本**: v1.0
**日期**: 2026-04-10
**负责人**: PM Agent

---

## 1. 概述

**目标**: 设计并实现 4 步新手引导流程，帮助首次使用用户快速了解产品价值，降低首次使用流失率，目标引导完成率 > 70%。

**用户故事**:
> "作为一个刚注册的新用户，我需要快速知道这个产品能做什么。4步引导让我在 2 分钟内就能上手，而不是面对空白页面不知所措。"

**背景**: 2026-04-06 移除了 `<NewUserGuide />`，当前 onboarding overlay 覆盖不足，需要重新设计引导流程。

---

## 2. 引导流程设计（4步）

### 引导步骤配置

**文件**: `src/data/onboarding-steps.ts`

```typescript
export interface OnboardingStep {
  id: string;           // 步骤唯一标识，如 "step-1"
  target: string;       // CSS selector，指向需要高亮的元素
  title: string;        // 引导标题
  description: string;  // 引导说明文字
  position: 'top' | 'bottom' | 'left' | 'right'; // Tooltip 相对于 target 的位置
  action?: {            // 期望用户执行的操作（可选）
    label: string;      // 操作按钮文字，如 "试试输入"
    selector: string;   // 操作目标
  };
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "step-1-welcome",
    target: "[data-testid='hero-section']",
    title: "欢迎来到 VibeX",
    description: "VibeX 可以帮助你将业务需求转化为清晰的领域模型和 API 设计。开始之前，让我们快速了解一下产品。",
    position: "bottom",
  },
  {
    id: "step-2-requirement-input",
    target: "[data-testid='requirement-textarea']",
    title: "输入你的业务需求",
    description: "在下方输入框中描述你的业务场景。你可以使用自然语言，也可以使用模板快速开始。",
    position: "top",
    action: {
      label: "查看模板",
      selector: "[data-testid='template-link']",
    },
  },
  {
    id: "step-3-analyze",
    target: "[data-testid='analyze-button']",
    title: "一键 AI 分析",
    description: "输入需求后，点击「开始分析」，AI 将自动识别实体、限界上下文，并生成领域模型图。",
    position: "top",
  },
  {
    id: "step-4-result",
    target: "[data-testid='result-panel']",
    title: "查看分析结果",
    description: "分析完成后，你将看到实体关系图、限界上下文图和 API 设计文档。支持一键导出。",
    position: "left",
  },
];
```

### 步骤说明

| 步骤 | 标题 | 高亮目标 | 位置 | 关键操作 |
|------|------|----------|------|----------|
| 1 | 欢迎来到 VibeX | Hero 区域 | bottom | 无 |
| 2 | 输入你的业务需求 | 需求输入框 | top | 点击「查看模板」跳转 /templates |
| 3 | 一键 AI 分析 | 分析按钮 | top | 无 |
| 4 | 查看分析结果 | 结果面板 | left | 无 |

---

## 3. 组件规格

### 3.1 OnboardingOverlay（扩展现有组件）

**文件**: `src/components/onboarding/OnboardingOverlay.tsx`

在现有 `CanvasOnboardingOverlay` 基础上扩展:

```typescript
interface OnboardingOverlayProps {
  step: OnboardingStep;
  onNext: () => void;
  onSkip: () => void;
  currentStepIndex: number;
  totalSteps: number;
}
```

**UI 结构**:
```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  ① ② ③ ④          Step 2/4                             │
│                                                         │
│         ┌──────────────────────────┐                   │
│         │ Step 2                   │                   │
│         │ 输入你的业务需求          │                   │
│         │                          │                   │
│         │ 在下方输入框中描述你的     │                   │
│         │ 业务场景...              │                   │
│         │                          │                   │
│         │ [查看模板]               │                   │
│         │                          │                   │
│         │     [跳过]     [下一步 →] │                   │
│         └──────────────────────────┘                   │
│                                                         │
│              ↓ 底部有省略的步骤指示器                   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**视觉规范**:
- 遮罩层: `rgba(0, 0, 0, 0.6)`，非高亮区域全覆盖
- 高亮区域: 白色边框 `2px solid #6366F1`，`border-radius: 8px`
- Tooltip 容器: `bg-white`, `rounded-xl`, `shadow-xl`, `p-5`
- Tooltip 宽度: `max-w-md`（384px）
- 箭头: CSS `::before` 伪元素，三角形指向 target 元素
- 跳过按钮: 文字按钮，`text-gray-500 hover:text-gray-700`
- 下一步按钮: 实心 indigo 按钮

### 3.2 OnboardingHighlight

**文件**: `src/components/onboarding/OnboardingHighlight.tsx`

独立于遮罩层的高亮框组件:

```typescript
interface OnboardingHighlightProps {
  targetRect: DOMRect;  // target 元素的 getBoundingClientRect()
  borderRadius?: number;
}
```

**职责**:
- 根据 target 的 `getBoundingClientRect()` 计算高亮框位置和尺寸
- 在遮罩层上"挖出"一个透明矩形洞
- 实现: 使用 `box-shadow: 0 0 0 9999px rgba(0,0,0,0.6)`

### 3.3 OnboardingProgress

**文件**: `src/components/onboarding/OnboardingProgress.tsx`

步骤进度指示器，显示在页面顶部:

```
[① ② ③ ④]   Step 2/4: 输入你的业务需求
```

**样式**:
- 圆点尺寸: `w-2.5 h-2.5`（已完成: indigo，已完成+脉冲动画）
- 连接线: `h-0.5 w-8`，已完成为 indigo，未完成为 gray-300
- 当前步骤圆点: indigo + ring 效果
- 步骤标签: `text-xs text-gray-500`

### 3.4 useOnboarding Hook

**文件**: `src/hooks/useOnboarding.ts`

```typescript
function useOnboarding() {
  const STORAGE_KEY = 'onboarding_v2_completed';
  
  // 检测是否已完成引导
  const isCompleted = useMemo(() => {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  }, []);
  
  // 完成引导
  const complete = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
  };
  
  // 重置引导（用于测试/调试）
  const reset = () => {
    localStorage.removeItem(STORAGE_KEY);
  };
  
  // 当前步骤索引
  const [currentStep, setCurrentStep] = useState(0);
  
  // 跳过引导
  const skip = () => {
    complete();
    setCurrentStep(-1); // 隐藏引导
  };
  
  // 下一步
  const next = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      complete(); // 最后一步完成
      setCurrentStep(-1);
    }
  };
  
  return { isCompleted, currentStep, skip, next, reset, ... };
}
```

---

## 4. 交互规格

### 4.1 触发条件

引导流程在以下条件**同时满足**时触发:
1. 用户首次访问（`onboarding_v2_completed` 不存在或为 false）
2. 页面加载完成（`useEffect` 中 `setTimeout 100ms` 延迟，避免布局抖动）

### 4.2 跳过机制

- 任意时刻可点击「跳过」按钮，直接完成引导
- 状态持久化到 `localStorage.onboarding_v2_completed = 'true'`
- 刷新页面不重复弹出

### 4.3 高亮跟随

- 监听 `window.resize` 和 `window.scroll`，实时更新 target 元素的 `getBoundingClientRect()`
- 目标元素消失时（如路由切换），自动隐藏引导层

### 4.4 键盘支持

| 快捷键 | 行为 |
|--------|------|
| `Escape` | 跳过引导 |
| `→` / `Enter` | 下一步 |
| `←` | 上一步（如果有） |

### 4.5 Step 2 特殊行为

当引导到 Step 2（需求输入框）时:
- 如果用户点击「查看模板」→ 跳转到 `/templates` → 选择模板后返回 → 引导继续到 Step 3
- 实现: 使用 `sessionStorage` 记录"引导中断状态"，返回后恢复

---

## 5. 验收标准

| ID | 测试场景 | 断言 |
|----|----------|------|
| OG-01 | 新用户首次访问 / | 引导弹出，显示 Step 1 |
| OG-02 | 显示 4 个引导步骤 | 进度指示器显示 ① ② ③ ④ |
| OG-03 | 点击「跳过」 | 引导消失，刷新页面不重复弹出 |
| OG-04 | 完成所有步骤 | 刷新页面不重复弹出 |
| OG-05 | 键盘 `Escape` | 等同于点击「跳过」 |
| OG-06 | 键盘 `→` | 进入下一步 |
| OG-07 | 引导 Step 2 出现 | 需求输入框高亮，Tooltip 位于上方 |
| OG-08 | 窗口 resize | 高亮框跟随 target 元素重新定位 |
| OG-09 | 目标元素被隐藏 | 引导层自动隐藏 |
| OG-10 | 7日后留存用户 | 引导不弹出（已完成标记存在） |

---

## 6. 非功能需求

- **性能**: 引导层不影响页面交互响应，60fps 动画
- **无障碍**: 
  - 遮罩层 `aria-hidden="true"`
  - Tooltip 内容可通过屏幕阅读器访问
  - 焦点管理：引导打开时 trap focus，关闭时还原焦点
- **可访问性**: 配色对比度符合 WCAG AA
- **容错**: 如果 target selector 不存在，静默跳过该步骤，不报错

---

## 7. 与现有组件的集成

**策略**: 扩展 `src/components/onboarding/CanvasOnboardingOverlay.tsx`（如果存在），而非新建独立组件。

```typescript
// 如果已有组件，直接扩展其 props
// 如果不存在，创建新的 OnboardingFlow

// 入口点
export { OnboardingFlow } from './OnboardingFlow';
```

### 集成点

| 集成位置 | 方式 |
|----------|------|
| `App.tsx` | 条件渲染 `<OnboardingFlow />` |
| `HomePage` | 提供 `data-testid` 属性供 selector 定位 |
| `Navbar` | 引导 Step 4 定位结果面板入口 |

---

## 8. 文件清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/data/onboarding-steps.ts` | 新增 | 引导步骤配置数据 |
| `src/components/onboarding/OnboardingFlow.tsx` | 新增 | 引导流程根组件 |
| `src/components/onboarding/OnboardingHighlight.tsx` | 新增 | 高亮框组件 |
| `src/components/onboarding/OnboardingTooltip.tsx` | 新增 | Tooltip 组件 |
| `src/components/onboarding/OnboardingProgress.tsx` | 新增 | 进度指示器 |
| `src/hooks/useOnboarding.ts` | 新增 | 引导状态管理 hook |
| `src/hooks/useElementRect.ts` | 新增 | 获取元素位置的 hook |
| `src/utils/onboarding-storage.ts` | 新增 | localStorage 工具函数 |
| `src/components/onboarding/index.ts` | 新增 | 导出 barrel |
| `src/App.tsx` | 修改 | 集成引导流程根组件 |
| `src/pages/index.tsx` | 修改 | 添加 `data-testid` 属性 |

---

## 9. 数据流

```
用户首次访问 /
    ↓
App.tsx 渲染 <OnboardingFlow />
    ↓
useOnboarding() 检查 localStorage
    ↓
isCompleted === false → 显示引导
    ↓
根据 currentStep 从 ONBOARDING_STEPS 获取目标信息
    ↓
useElementRect(target) 监听 resize/scroll → 实时获取 target rect
    ↓
OnboardingHighlight 根据 rect 渲染高亮框
    ↓
OnboardingTooltip 渲染引导内容
    ↓
用户操作 (next / skip) → 更新状态 / 持久化
```
