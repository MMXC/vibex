# VibeX Canvas Epic1 实现方案

## 背景

`CanvasOnboardingOverlay.tsx` 存在 React Hooks 规则违规：

1. **Hooks 条件调用**：在 `if (completed || dismissed) return null;` 之后才调用 `useCallback/useEffect`，违反 "Hooks 必须在每次渲染时以相同顺序调用" 规则
2. **多余 localStorage 写入**：`handleDismiss/handleComplete` 中手动写 `localStorage`，但 store 已有 persist 机制
3. **键盘事件中间层**：`useEffect` 通过 `handleDismiss/Next/Prev` 中间 callback 调用，而非直接调用 store action

## 方案

按照 IMPLEMENTATION_PLAN.md 中的 Technical Design 重构：

1. 所有 hooks（useRef, useGuidanceStore, useCallback, useEffect）移至组件顶部
2. 移除 `handleDismiss/Complete` 中的 `localStorage.setItem`
3. 键盘 effect 直接调用 store action：`dismissCanvasOnboarding()` 等
4. 两个 early return `if (completed || dismissed)` 和 `if (currentStep === 0)` 放在所有 hooks 之后

## 实施步骤

1. 重写 `CanvasOnboardingOverlay.tsx` — Story 1.1
2. 运行 ESLint 验证 0 errors
3. 创建 `CanvasOnboardingOverlay.test.tsx` — Story 1.2
4. 运行 Jest 测试 100% 通过
5. gstack 验证 UI 正常
6. 更新 IMPLEMENTATION_PLAN.md 完成状态

## 验收标准

- [ ] ESLint `react-hooks/rules-of-hooks` 0 errors
- [ ] `npm test CanvasOnboardingOverlay` 全通过
- [ ] gstack: /canvas 页面 Skip 按钮可点击，不崩溃
- [ ] Console 无 `Invalid hook call` 错误
