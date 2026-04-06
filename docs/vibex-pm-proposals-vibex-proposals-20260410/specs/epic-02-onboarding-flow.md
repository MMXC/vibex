# Epic E02 Spec: 新手引导流程

> **Epic ID**: E02
> **Epic 名称**: 新手引导流程
> **优先级**: P0
> **预计工时**: 3h
> **关联 Feature**: F02
> **关联提案**: P002

---

## 1. 概述

新用户首次访问时，通过分步骤 Overlay 引导用户了解产品核心功能，降低首次使用流失率。引导步骤数控制在 4 步以内，高级用户可一键跳过。

---

## 2. 现有资产复用

- **已有**: `<CanvasOnboardingOverlay />` 组件已存在于代码库
- **已移除**: `<NewUserGuide />`（2026-04-06 已移除）
- **策略**: 扩展 `<CanvasOnboardingOverlay />`，新增引导步骤配置

---

## 3. 引导步骤配置

### 3.1 步骤定义

```typescript
// src/types/onboarding.ts
interface OnboardingStep {
  id: string
  title: string
  description: string
  targetSelector: string  // 高亮元素选择器
  position: 'top' | 'bottom' | 'left' | 'right'  // tooltip 位置
  action?: {
    type: 'click' | 'fill' | 'navigate'
    selector: string
    value?: string
  }
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: '欢迎使用 VibeX',
    description: 'VibeX 是 AI 驱动的 DDD 领域建模平台，通过对话式需求分析生成领域模型和原型页面。',
    targetSelector: '.app-header',
    position: 'bottom'
  },
  {
    id: 'input-requirement',
    title: '输入您的需求',
    description: '在下方输入框中描述您的业务需求，可以使用自然语言。也可以点击右上角「使用模板」快速开始。',
    targetSelector: '#requirement-input',
    position: 'top'
  },
  {
    id: 'analyze',
    title: 'AI 智能分析',
    description: '点击「开始分析」按钮，AI 将理解您的需求并生成领域模型。',
    targetSelector: '#analyze-btn',
    position: 'top'
  },
  {
    id: 'view-result',
    title: '查看分析结果',
    description: '分析完成后，您将看到领域模型、限界上下文划分和原型页面。',
    targetSelector: '.result-panel',
    position: 'left'
  }
]
```

### 3.2 引导触发条件

```typescript
const shouldShowOnboarding = () => {
  // 条件 1: localStorage 中无 onboarding_completed 标记
  // 条件 2: 不是返回用户（有 GA/混淆参数标识）
  const completed = localStorage.getItem('onboarding_completed')
  const isReturning = new URLSearchParams(window.location.search).has('returning')
  return !completed && !isReturning
}
```

---

## 4. 组件设计

### 4.1 OnboardingOverlay

| 属性 | 类型 | 默认值 |
|------|------|--------|
| steps | OnboardingStep[] | onboardingSteps |
| isOpen | boolean | shouldShowOnboarding() |
| onComplete | () => void | 标记完成 |
| onSkip | () => void | 标记跳过 |

**交互行为**:
- 背景暗化（opacity: 0.6），非高亮区域不可点击
- 高亮元素周围显示虚线边框
- Tooltip 气泡跟随高亮元素
- 支持 Next / Prev / Skip / Skip All 按钮

### 4.2 OnboardingTooltip

| 属性 | 类型 | 说明 |
|------|------|------|
| step | OnboardingStep | 当前步骤数据 |
| currentIndex | number | 当前步骤索引 |
| totalSteps | number | 总步骤数 |
| onNext | () => void | 下一 |
| onPrev | () => void | 上一 |
| onSkip | () => void | 跳过 |
| onComplete | () => void | 完成 |

---

## 5. 状态管理

```typescript
// localStorage keys
const ONBOARDING_KEY = 'vibeX_onboarding_status'

interface OnboardingStatus {
  completed: boolean
  completedAt?: string  // ISO timestamp
  skipped: boolean
  currentStep: number
}

// 完成后存储
localStorage.setItem(ONBOARDING_KEY, JSON.stringify({
  completed: true,
  completedAt: new Date().toISOString(),
  skipped: false,
  currentStep: steps.length
}))

// 跳过时存储
localStorage.setItem(ONBOARDING_KEY, JSON.stringify({
  completed: false,
  skipped: true,
  currentStep: currentIndex
}))
```

---

## 6. Stories 实现细节

### E02-S1: 引导步骤配置（0.5h）

- [ ] 创建 `src/types/onboarding.ts` 定义步骤类型
- [ ] 创建 `src/config/onboarding-steps.ts` 配置文件
- [ ] 配置 4 个引导步骤（Welmcome → 输入 → 分析 → 结果）
- [ ] 支持步骤顺序调整（不影响其他逻辑）

### E02-S2: Overlay 引导组件（1h）

- [ ] 扩展现有 `<CanvasOnboardingOverlay />`
- [ ] 实现高亮元素计算（使用 `getBoundingClientRect`）
- [ ] 实现 tooltip 跟随定位
- [ ] 实现 Next/Prev/Skip/Skip All 按钮逻辑
- [ ] 键盘支持（Escape 跳过，Enter 下一页）

### E02-S3: 引导状态持久化（0.5h）

- [ ] 首次访问检测逻辑（`shouldShowOnboarding`）
- [ ] 完成/跳过时写入 `localStorage`
- [ ] 刷新页面不重复弹出
- [ ] 清除 localStorage 后重新显示引导

### E02-S4: 引导完成流程（1h）

- [ ] 完成引导后隐藏 overlay
- [ ] 触发 `onComplete` 回调埋点
- [ ] 跳转 Dashboard 确保所有功能可用
- [ ] 无引导残留（overlay DOM 移除）

---

## 7. 验收测试用例

```typescript
// spec/e2e/onboarding.spec.ts

describe('E02 新手引导流程', () => {
  beforeEach(async ({ page }) => {
    await page.evaluate(() => localStorage.clear())
  })

  it('E02-S2: 新用户首次访问触发引导', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.locator('.onboarding-overlay')).toBeVisible()
  })

  it('E02-S2: 引导步骤数 ≤4', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.locator('.onboarding-step')).toHaveCount(4)
  })

  it('E02-S2: 可正常翻页', async ({ page }) => {
    await page.goto('/dashboard')
    await page.click('.onboarding-next')
    await expect(page.locator('.onboarding-step[data-step="1"]')).toBeVisible()
  })

  it('E02-S3: 跳过引导后不再弹出', async ({ page }) => {
    await page.goto('/dashboard')
    await page.click('.onboarding-skip')
    await expect(page.locator('.onboarding-overlay')).not.toBeVisible()
    await page.reload()
    await expect(page.locator('.onboarding-overlay')).not.toBeVisible()
  })

  it('E02-S4: 完成引导后功能正常', async ({ page }) => {
    await page.goto('/dashboard')
    for (let i = 0; i < 4; i++) {
      await page.click('.onboarding-next')
    }
    await page.click('.onboarding-complete')
    await expect(page.locator('.onboarding-overlay')).not.toBeVisible()
    await expect(page.locator('#requirement-input')).toBeEnabled()
  })

  it('E02-S2: 键盘 Escape 跳过', async ({ page }) => {
    await page.goto('/dashboard')
    await page.keyboard.press('Escape')
    await expect(page.locator('.onboarding-overlay')).not.toBeVisible()
  })
})
```

---

## 8. 风险与依赖

| 风险 | 缓解措施 |
|-----|---------|
| 引导影响高级用户体验 | 提供 Skip All 按钮，尊重用户习惯 |
| 高亮元素不存在导致报错 | 使用 try/catch 包裹定位逻辑，元素不存在时跳过该步骤 |
| 引导与动态内容冲突 | 使用 `waitForSelector` 等待目标元素渲染 |
