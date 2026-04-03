# Epic E1 Spec: 新手引导流程

**Epic**: E1 - 新手引导流程
**优先级**: P1
**工时**: 5-7h
**依赖**: Sprint 3 E1 Checkbox 修复完成
**状态**: 规划中

---

## 1. Overview

### 1.1 目标
降低新用户首次使用门槛，通过渐进式引导帮助用户完成第一个 DDD 建模任务。

### 1.2 用户价值
- 新用户首次进入不再迷茫，知道"从哪里开始"
- 通过里程碑徽章获得成就感，提升留存
- 引导状态持久化，不重复打扰已上手用户

---

## 2. Component Design

### 2.1 核心组件

| 组件名 | 文件 | 职责 |
|--------|------|------|
| NewUserGuide | `components/guide/NewUserGuide.tsx` | 引导流程控制器 |
| GuideOverlay | `components/guide/GuideOverlay.tsx` | 高亮遮罩层 |
| GuideTooltip | `components/guide/GuideTooltip.tsx` | 单步提示气泡 |
| MilestoneBadge | `components/guide/MilestoneBadge.tsx` | 成就徽章 |
| GuideProgress | `components/guide/GuideProgress.tsx` | 引导进度指示器 |

### 2.2 Store Design

```typescript
// stores/guideStore.ts
interface GuideState {
  isActive: boolean;
  currentStep: number;
  completedSteps: number[];
  earnedBadges: BadgeType[];
  isSkipped: boolean;
  
  // Actions
  startGuide: () => void;
  nextStep: () => void;
  prevStep: () => void;
  completeGuide: () => void;
  skipGuide: () => void;
  earnBadge: (badge: BadgeType) => void;
}
```

---

## 3. Guide Steps

### Step 1: 欢迎引导
```
Title: 欢迎使用 VibeX！
Description: 让我们一起完成你的第一个 DDD 建模项目
Actions:
  - "开始引导" → Step 2
  - "跳过" → Skip (记录 localStorage)
Target: Canvas 空白区域
```

### Step 2: 添加第一个限界上下文
```
Title: 添加你的第一个限界上下文
Description: 限界上下文是 DDD 的核心概念，代表领域的边界
Actions:
  - 点击"添加上下文"按钮
  - 输入上下文名称
Target: 顶部工具栏的"添加"按钮
Highlight: 高亮添加按钮
```

### Step 3: 命名上下文
```
Title: 给你的上下文起个名字
Description: 例如"用户域"、"订单域"、"商品域"
Actions:
  - 输入上下文名称
  - 点击确认
Target: 上下文名称输入框
```

### Step 4: 里程碑徽章 - 上下文探索者
```
Title: 🎉 恭喜！获得"上下文探索者"徽章
Description: 你已掌握 DDD 的核心概念
Animation: confetti 动画
Badge: context-explorer
Next: "继续引导" → Step 5
```

### Step 5: 添加业务流程
```
Title: 现在添加业务流程
Description: 业务流程描述了领域内的业务活动
Actions:
  - 点击"流程"标签
  - 点击"添加流程"
Target: 流程标签页
```

### Step 6: 完成业务流程
```
Title: 设计你的第一个流程
Description: 添加流程步骤和决策节点
Actions:
  - 添加流程步骤
  - 连接步骤
Target: 流程编辑区域
```

### Step 7: 里程碑徽章 - 流程设计师
```
Title: 🎉 恭喜！获得"流程设计师"徽章
Description: 你已掌握业务流程建模
Animation: confetti 动画
Badge: flow-designer
Next: "继续引导" → Step 8
```

### Step 8: 完成组件树（可选，略过）
```
Title: 可选：完成组件树
Description: 组件树展示系统的技术架构
Actions:
  - 点击"组件"标签查看
  - 点击"跳过"继续
Target: 组件标签页
```

### Step 9: DDD 入门完成
```
Title: 🎉 恭喜！你已完成 DDD 入门
Description: 现在你可以开始真正的建模工作了
Actions:
  - "开始建模" → 关闭引导
Badge: ddd-beginner
```

---

## 4. localStorage Schema

```typescript
interface GuideStorage {
  version: 1;
  isCompleted: boolean;
  isSkipped: boolean;
  completedAt: string | null;
  completedSteps: number[];
  earnedBadges: BadgeType[];
  lastStep: number;
}

type BadgeType = 'context-explorer' | 'flow-designer' | 'component-architect' | 'ddd-beginner';
```

Key: `vibex-guide-state`

---

## 5. Technical Implementation

### 5.1 高亮遮罩实现

```tsx
// GuideOverlay.tsx
const GuideOverlay: React.FC<{ targetRect: DOMRect }> = ({ targetRect }) => {
  return (
    <div className="fixed inset-0 pointer-events-none z-[9999]">
      {/* 遮罩层 */}
      <div className="absolute inset-0 bg-black/50" />
      
      {/* 裁剪出目标区域 */}
      <div 
        className="absolute bg-transparent"
        style={{
          top: targetRect.top - 8,
          left: targetRect.left - 8,
          width: targetRect.width + 16,
          height: targetRect.height + 16,
          boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)',
        }}
      />
      
      {/* 脉冲动画边框 */}
      <div 
        className="absolute border-2 border-blue-500 rounded-lg animate-pulse"
        style={{
          top: targetRect.top - 8,
          left: targetRect.left - 8,
          width: targetRect.width + 16,
          height: targetRect.height + 16,
        }}
      />
    </div>
  );
};
```

### 5.2 引导状态检查

```typescript
// hooks/useGuideCheck.ts
const useGuideCheck = () => {
  const checkShouldShowGuide = () => {
    if (typeof window === 'undefined') return false;
    
    const stored = localStorage.getItem('vibex-guide-state');
    if (!stored) return true; // 从未访问过
    
    const state: GuideStorage = JSON.parse(stored);
    return !state.isCompleted && !state.isSkipped;
  };
  
  return { shouldShowGuide: checkShouldShowGuide() };
};
```

---

## 6. Acceptance Criteria

### E1-S1: 引导欢迎卡片
- [ ] `expect(welcomeCard.isVisible()).toBe(true)` 首次访问时显示欢迎卡片
- [ ] `expect(skipBtn.isVisible()).toBe(true)` 跳过按钮可见
- [ ] `expect(startBtn.isVisible()).toBe(true)` 开始按钮可见
- [ ] `expect(welcomeCard.find('#skip').onClick()).toBeDefined()` 跳过按钮可点击

### E1-S2: 分步引导流程
- [ ] `expect(guideTooltip.isVisible()).toBe(true)` 引导提示可见
- [ ] `expect(highlightArea.isVisible()).toBe(true)` 高亮区域可见
- [ ] `expect(highlightArea.find('button').isClickable()).toBe(true)` 高亮区域可点击
- [ ] `expect(guideStore.currentStep()).toBe(1)` 当前步骤正确
- [ ] `expect(guideStore.nextStep()).toEmitEvent('step-changed')` 步骤切换触发事件

### E1-S3: 里程碑徽章系统
- [ ] `expect(badge.isVisible()).toBe(true)` 徽章显示
- [ ] `expect(badge.getType()).toBe('context-explorer')` 徽章类型正确
- [ ] `expect(badge.getAnimation()).toBe('confetti')` 动画效果正常
- [ ] `expect(localStorage.get('vibex-guide-badges')).toContain('context-explorer')` 徽章持久化

### E1-S4: 引导状态持久化
- [ ] `expect(localStorage.get('vibex-guide-completed')).toBe(true)` 完成后标记已存储
- [ ] `expect(localStorage.get('vibex-guide-step')).toBe(6)` 最终步骤已记录
- [ ] `expect(welcomeCard.isVisible()).toBe(false)` 再次访问不显示引导

---

## 7. Test Cases

### TC-E1-001: 首次访问显示引导
```typescript
test('TC-E1-001: 首次访问 Canvas 应显示引导欢迎卡片', async ({ page }) => {
  // Clear localStorage
  await page.evaluate(() => localStorage.clear());
  
  // Navigate to Canvas
  await page.goto('/canvas');
  
  // Welcome card should be visible
  await expect(page.locator('#guide-welcome')).toBeVisible();
  await expect(page.locator('#guide-start-btn')).toBeVisible();
  await expect(page.locator('#guide-skip-btn')).toBeVisible();
});
```

### TC-E1-002: 跳过引导
```typescript
test('TC-E1-002: 点击跳过后不再显示引导', async ({ page }) => {
  await page.goto('/canvas');
  await page.click('#guide-skip-btn');
  
  // Welcome card should disappear
  await expect(page.locator('#guide-welcome')).not.toBeVisible();
  
  // localStorage should record skip
  const state = await page.evaluate(() => 
    JSON.parse(localStorage.getItem('vibex-guide-state') || '{}')
  );
  expect(state.isSkipped).toBe(true);
  
  // Reload and verify no guide shown
  await page.reload();
  await expect(page.locator('#guide-welcome')).not.toBeVisible();
});
```

### TC-E1-003: 完整引导流程
```typescript
test('TC-E1-003: 完成完整引导流程', async ({ page }) => {
  await page.goto('/canvas');
  
  // Start guide
  await page.click('#guide-start-btn');
  await expect(page.locator('#guide-tooltip')).toBeVisible();
  
  // Complete all steps
  for (let i = 0; i < 6; i++) {
    await page.click('#guide-next-btn');
    await page.waitForTimeout(300);
  }
  
  // Should see completion badge
  await expect(page.locator('#guide-complete-badge')).toBeVisible();
  await expect(page.locator('#ddd-beginner-badge')).toBeVisible();
});
```

---

## 8. Milestone

| 日期 | 里程碑 |
|------|--------|
| Week 1 | 完成欢迎卡片和基本引导流程 |
| Week 2 | 完成里程碑徽章系统 |
| Week 3 | 完成持久化和测试 |
