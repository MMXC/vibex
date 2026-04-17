# Spec: Sprint 3 — 用户体验

**Epic**: E7（新手引导与模板）
**Sprint**: Sprint 3
**工时**: 6h
**目标**: 新用户首次体验提升，降低使用门槛

---

## Spec E7-S1: 需求模板库

### 1. 概述

新用户不知道如何描述需求，提供场景化模板库，≥5 个模板，覆盖 VibeX 核心场景。

### 2. 页面设计

**路由**: `/templates`

**布局**:
```
┌──────────────────────────────────────────────┐
│  需求模板库                              [关闭] │
├──────────────────────────────────────────────┤
│  ┌─────────┐ ┌─────────┐ ┌─────────┐        │
│  │ 🎨 UI   │ │ 🐛 Bug  │ │ ⚡ Feat │        │
│  │ 改进    │ │ 修复    │ │ 开发    │        │
│  └─────────┘ └─────────┘ └─────────┘        │
│  ┌─────────┐ ┌─────────┐                   │
│  │ 🔄 重构  │ │ 🔍 调研  │                   │
│  │         │ │         │                   │
│  └─────────┘ └─────────┘                   │
└──────────────────────────────────────────────┘
```

### 3. 模板内容

#### 模板 1: UI 改进
```markdown
## 类型
UI 改进

## 当前问题
[描述当前界面存在的问题，如：布局错位、样式不一致、响应式问题]

## 期望结果
[描述改进后的预期效果]

## 参考
- 截图/设计稿链接:
- 设计规范:
```

#### 模板 2: Bug 修复
```markdown
## 类型
Bug 修复

## 问题描述
[清晰描述 bug 现象]

## 复现步骤
1.
2.
3.

## 环境
- 浏览器:
- 操作系统:
- 版本:

## 期望 vs 实际
- 期望:
- 实际:
```

#### 模板 3: Feature 开发
```markdown
## 类型
Feature 开发

## 用户故事
作为 [用户角色]，我希望 [功能描述]，以便 [收益]

## 验收标准
- [ ] 场景 1
- [ ] 场景 2

## 优先级
[P0/P1/P2/P3]
```

#### 模板 4: 重构
```markdown
## 类型
重构

## 目标文件/模块
[文件路径或模块名]

## 重构原因
[性能/可维护性/技术债]

## 影响范围
[哪些功能可能受影响]

## 期望改进
[重构后的预期效果]
```

#### 模板 5: 调研
```markdown
## 类型
调研

## 问题/目标
[需要调研的问题]

## 调研方法
- [ ] 竞品分析
- [ ] 用户访谈
- [ ] 技术调研
- [ ] 数据分析

## 输出物
[调研报告/建议方案/技术选型]
```

### 4. 交互流程

1. 用户点击「使用模板」→ 模板内容填充到编辑器
2. 用户编辑模板内容
3. 点击「提交需求」→ 正常提交流程
4. 模板选择历史本地存储（下次优先显示）

### 5. 技术实现

```typescript
// app/templates/page.tsx
'use client';
import { templates } from '@/data/templates';
import { useState } from 'react';

export default function TemplatesPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  return (
    <div className="templates-page">
      <h1>需求模板库</h1>
      <div className="template-grid">
        {templates.map(template => (
          <TemplateCard
            key={template.id}
            template={template}
            onSelect={(content) => fillEditor(content)}
          />
        ))}
      </div>
    </div>
  );
}

// data/templates.ts
export const templates = [
  {
    id: 'ui-improvement',
    title: '🎨 UI 改进',
    category: 'ui',
    content: uiImprovementTemplate,
  },
  // ...
];
```

### 6. 验收标准

```typescript
// e2e/templates.spec.ts
test('template library has at least 5 templates', async ({ page }) => {
  await page.goto('/templates');
  const cards = await page.locator('[data-testid="template-card"]').count();
  expect(cards).toBeGreaterThanOrEqual(5);
});

test('clicking template fills editor', async ({ page }) => {
  await page.goto('/templates');
  await page.click('[data-testid="template-card"]:first-child');
  const editorContent = await page.locator('[data-testid="editor"]').inputValue();
  expect(editorContent.length).toBeGreaterThan(0);
});

test('each template category is present', async ({ page }) => {
  await page.goto('/templates');
  const categories = ['ui', 'bug', 'feature', 'refactor', 'research'];
  for (const cat of categories) {
    const card = page.locator(`[data-category="${cat}"]`);
    await expect(card).toBeVisible();
  }
});
```

### 7. 页面集成

| 页面 | 集成方式 |
|------|----------|
| 首页（`/`） | 首次访问时显示引导条「不知道如何描述？使用模板」 |
| 需求提交页（`/submit`） | 侧边栏模板选择器 |
| 新建页（`/new`） | Tab 切换（空白/模板） |

---

## Spec E7-S2: 新手引导流程

### 1. 概述

首次使用用户无引导，流失率高。提供可交互引导流程（3-5 步骤），引导可跳过，完成率 ≥ 70%。

### 2. 引导步骤设计

### 引导流程（5 步骤）

**Step 1: 欢迎**
```
🎉 欢迎使用 VibeX！
这是你的 AI 生成画布，让我们快速上手。
[开始引导] [跳过]
```

**Step 2: 创建画布**
```
第一步：创建你的第一个画布
点击中央「+ 新建」按钮，创建一个空白的生成画布。
[上一步] [下一步]
```

**Step 3: 生成组件**
```
第二步：生成第一个组件
输入自然语言描述（如「一个红色按钮」），按回车生成。
[上一步] [下一步]
```

**Step 4: 编辑和调整**
```
第三步：编辑组件
点击生成的组件进入编辑模式，调整属性或样式。
[上一步] [下一步]
```

**Step 5: 完成**
```
✅ 你已掌握基础操作！
探索更多功能，或查看 [模板库](/templates) 获取灵感。
[完成引导] [查看模板]
```

### 3. 技术实现

```typescript
// components/onboarding/OnboardingFlow.tsx
'use client';
import { useState, useEffect } from 'react';
import { onboardingSteps } from '@/data/onboarding-steps';
import styles from './OnboardingFlow.module.css';

const STORAGE_KEY = 'vibex_onboarding_completed';

export function OnboardingFlow() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // 仅首次访问显示
    if (!localStorage.getItem(STORAGE_KEY)) {
      setIsVisible(true);
    }
  }, []);

  const completeOnboarding = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setIsVisible(false);
    // 记录完成事件（analytics）
    analytics.track('onboarding_completed', { step: currentStep });
  };

  if (!isVisible) return null;

  const step = onboardingSteps[currentStep];
  const isLastStep = currentStep === onboardingSteps.length - 1;

  return (
    <div className={styles.overlay} data-testid="onboarding-overlay">
      <div className={styles.dialog} data-testid="onboarding-dialog">
        <div className={styles.stepIndicator}>
          {onboardingSteps.map((_, i) => (
            <span
              key={i}
              className={`${styles.dot} ${i === currentStep ? styles.active : ''}`}
            />
          ))}
        </div>
        <div className={styles.content}>
          <h2>{step.title}</h2>
          <p>{step.description}</p>
        </div>
        <div className={styles.actions}>
          {currentStep > 0 && (
            <button onClick={() => setCurrentStep(s => s - 1)}>
              上一步
            </button>
          )}
          <button onClick={() => setCurrentStep(s => s + 1)}>
            {isLastStep ? '完成引导' : '下一步'}
          </button>
          <button
            className={styles.skipBtn}
            onClick={completeOnboarding}
            data-testid="onboarding-skip"
          >
            跳过
          </button>
        </div>
      </div>
    </div>
  );
}
```

### 4. 引导状态管理

```typescript
// hooks/useOnboarding.ts
export function useOnboarding() {
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    setCompleted(localStorage.getItem('vibex_onboarding_completed') === 'true');
  }, []);

  const complete = () => {
    localStorage.setItem('vibex_onboarding_completed', 'true');
    setCompleted(true);
  };

  const reset = () => { // 仅供测试用
    localStorage.removeItem('vibex_onboarding_completed');
    setCompleted(false);
  };

  return { completed, complete, reset };
}
```

### 5. 页面集成

```typescript
// app/layout.tsx
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <OnboardingFlow />
      </body>
    </html>
  );
}
```

### 6. 验收标准

```typescript
// e2e/onboarding.spec.ts
test('first-time user sees onboarding', async ({ page }) => {
  // 清除引导状态
  await page.evaluate(() => localStorage.removeItem('vibex_onboarding_completed'));
  await page.goto('/');
  await page.reload();
  await expect(page.locator('[data-testid="onboarding-overlay"]')).toBeVisible();
});

test('onboarding is skippable', async ({ page }) => {
  await page.goto('/');
  await page.click('[data-testid="onboarding-skip"]');
  await expect(page.locator('[data-testid="onboarding-overlay"]')).not.toBeVisible();
  // localStorage 应被标记为已完成
  const completed = await page.evaluate(
    () => localStorage.getItem('vibex_onboarding_completed') === 'true'
  );
  expect(completed).toBe(true);
});

test('onboarding completes all 5 steps', async ({ page }) => {
  await page.goto('/');
  for (let i = 0; i < 5; i++) {
    await page.click('button:has-text("下一步"), button:has-text("完成引导")');
  }
  await expect(page.locator('[data-testid="onboarding-overlay"]')).not.toBeVisible();
});

test('onboarding state persists across reloads', async ({ page }) => {
  await page.click('[data-testid="onboarding-skip"]');
  await page.reload();
  await expect(page.locator('[data-testid="onboarding-overlay"]')).not.toBeVisible();
});
```

### 7. 性能优化

- 引导组件使用 React.lazy + Suspense 懒加载（不影响首屏 FCP）
- 引导内容 SVG 使用 CSS 动画（非 JS 动画）
- localStorage 检查在 hydrate 后异步执行，不阻塞渲染

### 8. 分析埋点

| 事件 | 属性 | 目的 |
|------|------|------|
| `onboarding_started` | `source: 'first_visit'` | 引导启动率 |
| `onboarding_step_viewed` | `step: 0-4` | 步骤漏斗 |
| `onboarding_skipped` | `at_step: 0-4` | 跳过率 |
| `onboarding_completed` | `duration_s` | 完成率 |
