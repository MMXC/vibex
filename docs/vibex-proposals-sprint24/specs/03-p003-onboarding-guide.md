# P003: Onboarding 引导规格文档

## UI 组件

- **组件名称**: Canvas 内 onboarding overlay
- **主要文件路径**: `src/components/OnboardingOverlay.tsx`、`src/hooks/useOnboarding.ts`

## 四态定义

### 1. 理想态

首次登录用户看到 5 步引导浮层：
1. 创建项目
2. 添加节点
3. 生成内容
4. 导出结果
5. 完成设置

引导可跳过，跳过后 localStorage 标记 `onboarding_completed = true`。

```
expect(onboardingVisible).toBe(true)
expect(stepsCount).toBe(5)
expect(currentStep).toBeGreaterThanOrEqual(0)
expect(currentStep).toBeLessThanOrEqual(4)
expect(skipButtonVisible).toBe(true)
```

### 2. 空状态

用户已跳过或已完成引导，overlay 不再展示。localStorage 存储完成标记。

```
expect(onboardingVisible).toBe(false)
expect(localStorage.get('onboarding_completed')).toBe('true')
expect(document.querySelector('[data-testid="onboarding-overlay"]')).toBeNull()
```

### 3. 加载态

Onboarding 状态从 localStorage 加载中，显示时间极短（通常不可见）。

```
expect(onboardingState).toBe('loading')
expect(overlayVisible).toBe(false)
```

### 4. 错误态

引导内容加载失败，overlay 不展示，不阻断用户正常操作，引导内容静默跳过。

```
expect(onboardingVisible).toBe(false)
expect(userCanInteract).toBe(true)
expect(mainAppContent).toBeVisible()
expect(errorLogged).toBe(true)
```