# Spec: Epic 1 — Hooks 安全重构（Bug-1 修复）

**Epic**: Epic 1: Hooks 安全重构
**Bug**: Bug-1: React Hooks Violation in CanvasOnboardingOverlay
**File**: `vibex-fronted/src/components/guidance/CanvasOnboardingOverlay.tsx`
**Baseline**: `79ebe010`

---

## 1. 背景与目标

### 问题描述

`CanvasOnboardingOverlay` 组件存在两个架构临界状态：

1. **useCallback 定义在 early return 之后**：`handleDismiss/Complete/Next/Prev` 在 `if (completed || dismissed) return null` 之后定义，未来 refactor 极易演化为真正的 hooks violation
2. **Keyboard effect 的 callback 依赖链**：通过中间 callback 调用 store action，依赖链过长

### 目标

重构组件代码结构，达到 React Hooks Rules 的绝对安全状态，同时消除 hooks violation 风险。

---

## 2. 架构规范

### 2.1 Hook 调用顺序规范（绝对安全模式）

```
export const CanvasOnboardingOverlay = memo(function CanvasOnboardingOverlay() {
  // === 所有 hooks 必须无条件定义在此处 ===
  // === 此处之上不允许有任何 conditional return ===

  // Hooks (useRef, useXxx, useCallback 等)
  const overlayRef = useRef<HTMLDivElement>(null);
  const completed = useGuidanceStore((s) => s.canvasOnboardingCompleted);
  const dismissed = useGuidanceStore((s) => s.canvasOnboardingDismissed);
  const currentStep = useGuidanceStore((s) => s.canvasOnboardingStep);
  const nextOnboardingStep = useGuidanceStore((s) => s.nextOnboardingStep);
  const prevOnboardingStep = useGuidanceStore((s) => s.prevOnboardingStep);
  const completeCanvasOnboarding = useGuidanceStore((s) => s.completeCanvasOnboarding);
  const dismissCanvasOnboarding = useGuidanceStore((s) => s.dismissCanvasOnboarding);
  const startCanvasOnboarding = useGuidanceStore((s) => s.startCanvasOnboarding);

  // useCallback 定义也在此处（在所有 hooks 之后，但在 early return 之前）
  const handleDismiss = useCallback(() => { ... }, [dismissCanvasOnboarding]);
  const handleComplete = useCallback(() => { ... }, [completeCanvasOnboarding]);

  // === 所有 hooks 和 useCallback 必须在 early return 之前完成 ===
  // === 以下是 early return 区 ===

  if (completed || dismissed) return null;
  if (currentStep === 0) return null;

  // === JSX render 在 early return 之后 ===
  return <div>...</div>;
});
```

### 2.2 绝对禁止的模式

```tsx
// ❌ 禁止：early return 在 hooks 之前
if (completed) return null;
const { foo } = useStore(); // violation risk

// ❌ 禁止：部分 hooks 在 early return 之后
const { a } = useStore();
if (a) return null;
const { b } = useStore(); // violation risk

// ❌ 禁止：中间 callback 定义在 early return 之后
const { action } = useStore();
if (done) return null;
const handleClick = useCallback(() => action(), [action]); // violation risk
```

---

## 3. 重构方案

### 3.1 Story 1.1: Hook 调用顺序重构

#### 变更 1: 重排 Hook 顺序

将当前 L74-L136 的代码重排：

**Before（当前代码顺序）:**
```
L74   useRef
L76-82 useGuidanceStore (9 calls)
L87   if (completed || dismissed) return null;   ← early return #1
L90   useCallback handleDismiss
L95   useCallback handleComplete
L100  useCallback handleNext
L104  useCallback handlePrev
L109  useEffect (auto-start)
L121  useEffect (keyboard)
L136  if (currentStep === 0) return null;         ← early return #2
```

**After（目标代码顺序）:**
```
// === ALL HOOKS + useCallback ===
const overlayRef = useRef(null);
const completed = useGuidanceStore((s) => s.canvasOnboardingCompleted);
const dismissed = useGuidanceStore((s) => s.canvasOnboardingDismissed);
const currentStep = useGuidanceStore((s) => s.canvasOnboardingStep);
const nextOnboardingStep = useGuidanceStore((s) => s.nextOnboardingStep);
const prevOnboardingStep = useGuidanceStore((s) => s.prevOnboardingStep);
const completeCanvasOnboarding = useGuidanceStore((s) => s.completeCanvasOnboarding);
const dismissCanvasOnboarding = useGuidanceStore((s) => s.dismissCanvasOnboarding);
const startCanvasOnboarding = useGuidanceStore((s) => s.startCanvasOnboarding);
const handleDismiss = useCallback(() => { ... }, [dismissCanvasOnboarding]);
const handleComplete = useCallback(() => { ... }, [completeCanvasOnboarding]);
const handleNext = useCallback(() => { ... }, [nextOnboardingStep]);
const handlePrev = useCallback(() => { ... }, [prevOnboardingStep]);
useEffect (auto-start, currentStep === 0 guard)
useEffect (keyboard)

// === ALL EARLY RETURNS ===
if (completed || dismissed) return null;
if (currentStep === 0) return null;

// === JSX ===
```

#### 变更 2: 简化 Keyboard Effect

当前 keyboard effect：
```tsx
// ❌ 当前：通过中间 callback 链
useEffect(() => {
  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') { handleDismiss(); }
    // ...
  }
  document.addEventListener('keydown', handleKeyDown);
  return () => document.removeEventListener('keydown', handleKeyDown);
}, [handleDismiss, handleNext, handlePrev]);
```

简化后：
```tsx
// ✅ 直接调用 store action，依赖链更短
useEffect(() => {
  const handler = (e: KeyboardEvent) => {
    if (e.key === 'Escape') dismissCanvasOnboarding();
    else if (e.key === 'ArrowRight' || e.key === 'Enter') nextOnboardingStep();
    else if (e.key === 'ArrowLeft') prevOnboardingStep();
  };
  document.addEventListener('keydown', handler);
  return () => document.removeEventListener('keydown', handler);
}, [dismissCanvasOnboarding, nextOnboardingStep, prevOnboardingStep]);
```

#### 变更 3: 移除多余的 localStorage 写入

`handleDismiss` 和 `handleComplete` 中的 `localStorage.setItem('vibex-canvas-onboarded', 'true')` 移除（已有 guidanceStore persist 覆盖）。

#### 变更 4: auto-start effect 清理

保持 setTimeout + cleanup 逻辑，但移除 mounted guard（Zustand action 本身是幂等的）。

### 3.2 Story 1.2: 单元测试覆盖

#### 测试文件位置
`vibex-fronted/src/components/guidance/__tests__/CanvasOnboardingOverlay.test.tsx`

#### Mock 策略

使用 `mockReturnValue` 模拟真实行为（参考 `docs/learnings/canvas-testing-strategy.md` 的教训）：

```tsx
const createMockStore = () => ({
  canvasOnboardingCompleted: false,
  canvasOnboardingDismissed: false,
  canvasOnboardingStep: 1,
  nextOnboardingStep: jest.fn(),
  prevOnboardingStep: jest.fn(),
  completeCanvasOnboarding: jest.fn(),
  dismissCanvasOnboarding: jest.fn(),
  startCanvasOnboarding: jest.fn(),
});
```

#### 测试用例

| # | 测试用例 | expect() 断言 |
|---|----------|---------------|
| T1 | 跳过引导流程 | `expect(screen.queryByRole('button', { name: 'Try Again' })).not.toBeInTheDocument()` |
| T2 | 连续快速点击 Skip 5 次 | `expect(screen.queryByRole('button', { name: 'Try Again' })).not.toBeInTheDocument()` |
| T3 | store action 调用正确 | `expect(mockStore.dismissCanvasOnboarding).toHaveBeenCalledTimes(1)` |
| T4 | Step 0 时不渲染 overlay | `expect(screen.queryByText('Welcome to VibeX Canvas')).not.toBeInTheDocument()` |
| T5 | ESC 键关闭引导 | `expect(mockStore.dismissCanvasOnboarding).toHaveBeenCalled()` |

---

## 4. 验收标准汇总

| ID | 验收标准 | 测试方法 |
|----|----------|----------|
| AC-1.1.1 | `expect(screen.getByRole('button', { name: 'Skip' })).toBeEnabled()` | gstack |
| AC-1.1.2 | `expect(screen.queryByRole('button', { name: 'Try Again' })).not.toBeInTheDocument()` | gstack |
| AC-1.1.3 | `expect(mockStore.dismissCanvasOnboarding).toHaveBeenCalled()` | Jest |
| AC-1.1.4 | `expect(mockStore.dismissCanvasOnboarding).toHaveBeenCalledWith()` 无参数 | Jest |
| AC-1.1.5 | ESLint `react-hooks/rules-of-hooks` 0 errors | CI |
| AC-1.2.1 | 快速点击 Skip 5 次无崩溃 | Jest |
| AC-1.2.2 | `expect(screen.queryByRole('button', { name: 'Try Again' })).not.toBeInTheDocument()` | Jest |
| AC-1.2.3 | 所有测试用例 100% 通过 | Jest |

---

## 5. 关键文件变更清单

| 文件 | 变更类型 | 描述 |
|------|----------|------|
| `src/components/guidance/CanvasOnboardingOverlay.tsx` | 重构 | Hook 顺序重排 + keyboard effect 简化 |
| `src/components/guidance/__tests__/CanvasOnboardingOverlay.test.tsx` | 新增 | 单元测试文件 |

---

## 6. DoD Checklist

- [ ] Hooks 调用顺序符合绝对安全模式（所有 hooks 在 early return 之前）
- [ ] ESLint `react-hooks/rules-of-hooks` 0 errors
- [ ] Keyboard effect 直接调用 store action，无中间 callback
- [ ] localStorage.setItem 多余调用已移除
- [ ] Jest 测试 100% 通过
- [ ] gstack 验证：跳过引导不崩溃
- [ ] Code review 通过
