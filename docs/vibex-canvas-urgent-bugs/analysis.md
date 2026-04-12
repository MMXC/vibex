# Analysis: VibeX Canvas Urgent Bugs — Phase 1 Requirements Analysis

**Agent**: Analyst
**Date**: 2026-04-11
**Project**: vibex-canvas-urgent-bugs / analyze-requirements
**Code baseline**: `79ebe010` (vibex-repo)
**Research done**: learnings 搜索 + Git history 分析 + 代码审查

---

## 1. Business Scenario Analysis

### 1.1 Context

两个阻断级 P0 bug 影响 VibeX Canvas 核心流程：

1. **Bug-1**: 访问 `/canvas` 后点击跳过引导，React Hooks Violation 导致页面崩溃，显示 ErrorBoundary 的 "Try Again" 界面
2. **Bug-2**: 页面加载后 1.5s 内有 4 个资源返回 404（缺路径或构建产物不完整）

### 1.2 Target Users

- **所有新用户**：首次访问 Canvas 都会遇到 Bug-1（跳过引导触发崩溃）
- **所有用户**：Bug-2 影响首次加载体验（404 资源导致样式/功能不完整）

### 1.3 Business Impact

- Bug-1: 阻断性，新用户无法正常跳过引导，只能强制刷新页面
- Bug-2: 影响加载完整性，部分 UI 元素可能缺失或样式异常

---

## 2. Core Jobs-To-Be-Done (JTBD)

| # | JTBD | Bug | Priority |
|---|------|-----|----------|
| JTBD-1 | 作为新用户，我期望能跳过引导而不崩溃 | Bug-1 | P0 |
| JTBD-2 | 作为所有用户，我期望页面加载后无 404 资源请求 | Bug-2 | P0 |
| JTBD-3 | 作为开发者，我期望组件代码符合 React Hooks Rules，无隐藏风险 | Bug-1 fix | P1 |

---

## 3. Technical Feasibility Assessment

### 3.1 Bug-1: React Hooks Violation in CanvasOnboardingOverlay

#### 代码审查结果

当前 `CanvasOnboardingOverlay.tsx` 的 hook 调用顺序：

```
L74   const overlayRef = useRef(null);          // ✅ Hook 1
L76-82 const completed/dismissed/... = useGuidanceStore(...);  // ✅ Hooks 2-9
L87   if (completed || dismissed) return null;   // ⚠️ Early return #1
L90   const handleDismiss = useCallback(...);  // ✅ useCallback (not a hook)
L95   const handleComplete = useCallback(...);  // ✅ useCallback
L100  const handleNext = useCallback(...);     // ✅ useCallback
L104  const handlePrev = useCallback(...);     // ✅ useCallback
L109  useEffect(...)                            // ✅ Hook 10
L121  useEffect(...)                            // ✅ Hook 11
L136  if (currentStep === 0) return null;       // ⚠️ Early return #2
```

**问题诊断：**

虽然当前代码从语法上满足 React Hooks Rules（所有 hooks 在 early return 之前），但存在两个架构问题：

**问题 A：useCallback 定义在 early return 之后（架构反模式）**

`handleDismiss/Complete/Next/Prev` 定义在 `if (completed || dismissed) return null` 之后。如果未来有 refactor 将这些 callback 的定义移到 early return 之前，或增加新的 hook（如 `useState`）在 early return 之后，就会触发 hooks violation。当前代码处于临界状态，极易在迭代中演化为真正的 violation。

**问题 B：useEffect cleanup 中的闭包陷阱**

```tsx
// L109-119
useEffect(() => {
  if (currentStep !== 0) return; // already started
  const canvasOnboarded = localStorage.getItem('vibex-canvas-onboarded');
  if (!canvasOnboarded) {
    const timer = setTimeout(() => {
      startCanvasOnboarding(); // 可能在组件已 unmount 后执行
    }, 800);
    return () => clearTimeout(timer);
  }
}, [currentStep, startCanvasOnboarding]);
```

如果 `startCanvasOnboarding` 的引用不稳定（虽然 Zustand action 应该是稳定的），effect 会频繁重新执行，timer 被清除重建。如果在 timer 执行前组件 unmount（用户快速点击跳过），`startCanvasOnboarding` 仍会在 unmount 后执行，但由于它只是 `set({ canvasOnboardingStep: 1 })`，不会造成破坏。

**问题 C：Keyboard effect 的 callback 依赖链**

```tsx
useEffect(() => {
  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') { handleDismiss(); }
    // ...
  }
  document.addEventListener('keydown', handleKeyDown);
  return () => document.removeEventListener('keydown', handleKeyDown);
}, [handleDismiss, handleNext, handlePrev]);
```

`handleDismiss` 依赖 `dismissCanvasOnboarding`，`handleNext` 依赖 `nextOnboardingStep`，`handlePrev` 依赖 `prevOnboardingStep`。Zustand selector 返回的 action 应该是稳定引用，但若 store 被重建，引用可能变化 → effect 频繁重新绑定 → keyboard handler 泄漏或重复绑定。

**推荐修复方案：**

采用绝对安全的模式——所有 hooks + callbacks 必须在文件顶部无条件定义：

```tsx
export const CanvasOnboardingOverlay = memo(function CanvasOnboardingOverlay() {
  // === ALL HOOKS FIRST (no early returns above this line) ===
  const overlayRef = useRef<HTMLDivElement>(null);
  const completed = useGuidanceStore((s) => s.canvasOnboardingCompleted);
  const dismissed = useGuidanceStore((s) => s.canvasOnboardingDismissed);
  const currentStep = useGuidanceStore((s) => s.canvasOnboardingStep);
  const nextOnboardingStep = useGuidanceStore((s) => s.nextOnboardingStep);
  const prevOnboardingStep = useGuidanceStore((s) => s.prevOnboardingStep);
  const completeCanvasOnboarding = useGuidanceStore((s) => s.completeCanvasOnboarding);
  const dismissCanvasOnboarding = useGuidanceStore((s) => s.dismissCanvasOnboarding);
  const startCanvasOnboarding = useGuidanceStore((s) => s.startCanvasOnboarding);

  // ALL callbacks after hooks
  const handleDismiss = useCallback(() => {
    localStorage.setItem('vibex-canvas-onboarded', 'true');
    dismissCanvasOnboarding();
  }, [dismissCanvasOnboarding]);

  const handleComplete = useCallback(() => {
    localStorage.setItem('vibex-canvas-onboarded', 'true');
    completeCanvasOnboarding();
  }, [completeCanvasOnboarding]);

  const handleNext = useCallback(() => {
    nextOnboardingStep();
  }, [nextOnboardingStep]);

  const handlePrev = useCallback(() => {
    prevOnboardingStep();
  }, [prevOnboardingStep]);

  // Auto-start effect
  useEffect(() => {
    if (currentStep !== 0) return;
    const canvasOnboarded = localStorage.getItem('vibex-canvas-onboarded');
    if (!canvasOnboarded) {
      const timer = setTimeout(() => {
        startCanvasOnboarding();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [currentStep, startCanvasOnboarding]);

  // Keyboard navigation — stable callback refs
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismissCanvasOnboarding();
      else if (e.key === 'ArrowRight' || e.key === 'Enter') nextOnboardingStep();
      else if (e.key === 'ArrowLeft') prevOnboardingStep();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [dismissCanvasOnboarding, nextOnboardingStep, prevOnboardingStep]);

  // === EARLY RETURNS AFTER ALL HOOKS ===
  if (completed || dismissed) return null;
  if (currentStep === 0) return null;

  // ... render JSX
});
```

**关键变更：**
1. 移除 `handleDismiss/Complete/Next/Prev` 中的 `localStorage.setItem` — 已有 store persist 覆盖
2. Keyboard effect 直接调用 store action，不通过中间 callback
3. 所有 hooks 在文件顶部，early returns 在所有 hooks 之后

#### Git History 分析

`CanvasOnboardingOverlay` 在 commit `32e44532` (2026-04-08) 创建，commit `cf578266` (2026-04-07) 仅更新了 flaky-tests.json。该组件是全新创建的，不是从旧代码演化来的，因此历史上下文有限。

#### Learnings 教训

`docs/learnings/review-hooks-fix.md`（来自历史经验搜索）明确记录了同样的问题模式：

> **Early return 必须在所有 hooks 之后**：条件 return 放所有 `useXxx()` 调用之后，callback 定义的 `useCallback` 也要在 hooks 之后，确保 hooks 调用顺序绝对稳定。

本项目的教训：`docs/learnings/canvas-testing-strategy.md` 提供了 Mock store 真实性的教训——测试中的 mockStore 过于简化会掩盖 bug，建议使用 `mockReturnValue` 模拟真实行为。

**技术可行性**：✅ 完全可行。修复是代码重构，无功能变更风险。

---

### 3.2 Bug-2: 4 个 404 资源请求

#### 诊断方法

需要在真实环境（gstack browser）验证具体是哪 4 个资源返回 404。

#### 已识别的潜在 404 资源

**资源 A：`/templates/e-commerce.json` vs `ecommerce.json`**

`templateLoader.ts` 中 `TEMPLATES` 引用 `/templates/e-commerce.json`：
```tsx
file: '/templates/e-commerce.json',  // 实际文件名：e-commerce.json ✅ 存在
```

`ls public/templates/` 显示 `e-commerce.json` ✅ 和 `ecommerce.json` ✅ 均存在。无 404。

**资源 B：`/templates/ecommerce/thumbnail.jpg` 系列**

`lib/template-data.ts`（不直接在 canvas 页面加载）引用：
```tsx
thumbnail: '/templates/ecommerce/thumbnail.jpg',       // ❌ ecommerce/ 目录不存在
previewImages: ['/templates/ecommerce/preview-1.jpg'],  // ❌
```

这些路径在 `/templates/` 下只有 `e-commerce/`（有连字符），但代码引用的是 `ecommerce/`（无连字符）。**这是潜在的 404 来源**，但 `template-data.ts` 不在 CanvasPage 的 import 链中。

**资源 C：Google Fonts**

`app/layout.tsx` 引入 `Geist` 和 `Geist_Mono` Google Fonts。字体文件在某些地区或网络环境下可能 404。

**资源 D：Sentry / Firebase SDK**

`SentryInitializer` 和 `usePresence` (Firebase) 加载外部 SDK，这些在某些环境下可能超时或 404。

**资源 E：TemplateSelector 动态 import**

`TemplateSelector.tsx` 使用 `await import('@/lib/canvas/templateLoader')` 动态加载。如果路径解析错误可能导致问题。

#### 推荐调查步骤

使用 gstack browser 的 `console` 命令查看 Network 面板的失败请求：

```
gstack goto /canvas
snapshot console  # 查看 JS errors
screenshot       # 截图看实际 UI
```

#### 修复方案

| 方案 | 思路 | 工时 | 风险 |
|------|------|------|------|
| **方案 A**：gstack 定位 + 针对性修复 | 用 browser console 找出 4 个具体 404 URL，对症下药 | 1-2h | 低 |
| **方案 B**：系统性检查所有静态引用 | `grep -r "/templates/" src/` + `grep -r "\.jpg\|\.png\|\.svg" src/` 找所有资源路径，对比 `public/` 目录 | 2-3h | 低 |

**技术可行性**：⚠️ 需先验证。在 gstack 确认具体 404 资源前，无法保证修复准确。

---

## 4. Technical Options Comparison

### Bug-1 方案

| 方案 | 思路 | 工时 | 风险 |
|------|------|------|------|
| **A（推荐）**：重构 hook 顺序 + 移除中间 callback | 所有 hooks 在顶部，keyboard effect 直接调用 store action，移除 early return 后的 callback 定义 | 1h | 低 |
| **B**：保守修复 — 仅添加 mounted guard | 在 `handleDismiss` 等函数中添加 `if (!mountedRef.current) return`，避免 unmount 后调用 | 30min | 低（但治标不治本）|

### Bug-2 方案

| 方案 | 思路 | 工时 | 风险 |
|------|------|------|------|
| **A（推荐）**：gstack browser 定位具体 404 | 访问 /canvas，打开 console/network 面板，定位 4 个具体失败 URL | 1h | 低 |
| **B**：预防性全局检查 | grep 所有资源引用，对比 public/ 目录，不存在的文件创建 placeholder | 2h | 中（可能创建空文件掩盖真正的问题）|

---

## 5. Risk Matrix

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Bug-1 修复后引入新 bug | Low | High | 添加 CanvasOnboardingOverlay 单元测试 |
| Bug-1 根因判断错误（实际在父组件） | Medium | Medium | gstack 重现崩溃，确认崩溃点 |
| Bug-2 修复后 404 转移（资源被懒加载） | Medium | Low | gstack 验证修复后网络面板干净 |
| TemplateSelector e-commerce vs ecommerce 命名不一致 | Low | Medium | 统一为 `e-commerce.json`（含连字符） |

---

## 6. Verification Standards

### Bug-1: React Hooks Violation

- [ ] 访问 `/canvas`，在引导出现后点击"跳过"，页面不崩溃，无 "Try Again" 按钮
- [ ] AppErrorBoundary 无新增错误日志
- [ ] Console 无 `Error: Invalid hook call` 错误
- [ ] ESLint `react-hooks/rules-of-hooks` 检查通过
- [ ] 快速点击"跳过" 5 次，页面稳定不崩溃

### Bug-2: 404 资源

- [ ] 访问 `/canvas`，Network 面板在 1.5s 内无 404 响应
- [ ] 页面截图显示完整 UI（无缺失图标/图片/字体）
- [ ] Console 无 `Failed to load resource: net::ERR_NAME_NOT_RESOLVED` 错误

---

## 7. Acceptance Criteria (Summary)

| ID | Criterion | Bug | Test Method |
|----|-----------|-----|-------------|
| AC-1 | 点击"跳过引导"不崩溃 | Bug-1 | gstack goto /canvas → click skip → no crash |
| AC-2 | 连续快速操作不崩溃 | Bug-1 | 快速点击 skip 5x → 稳定 |
| AC-3 | React Hooks Rules 检查通过 | Bug-1 | ESLint react-hooks |
| AC-4 | 页面加载后无 404 网络请求 | Bug-2 | gstack Network panel check |
| AC-5 | UI 完整显示（无缺失资源） | Bug-2 | gstack screenshot diff |

---

## 8. Open Questions

| # | Question | Owner | Blocker? |
|---|----------|-------|----------|
| OQ-1 | Bug-1 崩溃的具体错误信息是什么？`Invalid hook call` 还是其他？ | Dev | Yes — 需要 gstack console log 确认根因 |
| OQ-2 | Bug-2 的 4 个 404 资源具体是什么？ | Dev | Yes — 需要 gstack Network 面板定位 |
| OQ-3 | `template-data.ts` 中的 `/templates/ecommerce/` 路径是否影响 canvas 页面？ | Dev | No — 需确认 import 链 |

---

## 9. Rejection Red Line Check

- [x] 需求可实现 → ✅ Bug-1 修复方案明确；Bug-2 需 gstack 验证
- [x] 验收标准完整 → ✅ 5 条具体可测试 AC
- [x] Research 已执行 → ✅ learnings 搜索（review-hooks-fix）+ Git history 分析

⚠️ **驳回风险**：Bug-2 的具体 404 资源未确认，修复方案存在不确定性。建议先派 Dev 用 gstack 定位，Analyst 再补充具体修复方案。

---

## 10. Recommendation

**结论**: ⚠️ **Conditional — Bug-1 推荐，Bug-2 需补充验证**

**Bug-1**: ✅ 推荐立即执行。Hook 重构方案明确，工时约 1h，风险极低。当前代码处于临界状态（架构反模式），迟早会在迭代中演化为真正的 violation。

**Bug-2**: ⚠️ 条件采纳。需先完成以下验证步骤：
1. Dev 用 gstack 访问 `/canvas`，记录 Console + Network 面板
2. Analyst 基于实际 404 URL 补充具体修复方案
3. Coord 决策是否立即修复

---

## 执行决策

- **决策**: 有条件采纳（Bug-1 立即执行，Bug-2 待 gstack 验证后补充方案）
- **执行项目**: 待分配
- **执行日期**: 2026-04-11

---

## Appendix: Key Code Locations

| Item | File | Line |
|------|------|------|
| CanvasOnboardingOverlay | `vibex-fronted/src/components/guidance/CanvasOnboardingOverlay.tsx` | 全文件 |
| guidanceStore | `vibex-fronted/src/stores/guidanceStore.ts` | 全文件 |
| AppErrorBoundary | `vibex-fronted/src/components/common/AppErrorBoundary.tsx` | 全文件 |
| TemplateSelector | `vibex-fronted/src/components/canvas/features/TemplateSelector.tsx` | L41-57 |
| templateLoader | `vibex-fronted/src/lib/canvas/templateLoader.ts` | L32-46 |
| CanvasPage 集成 | `vibex-fronted/src/components/canvas/CanvasPage.tsx` | L84, L772-773 |

## Appendix: Historical Learnings

来自 `docs/learnings/review-hooks-fix.md`（历史经验）：
> **Early return 必须在所有 hooks 之后**：条件 return 放所有 `useXxx()` 调用之后，callback 定义的 `useCallback` 也要在 hooks 之后。
> 
> **违规示例**：
> ```tsx
> const { status } = useOnboardingStore();
> if (status !== 'in-progress') return null; // ❌ early return before memo
> const progressPercent = useMemo(...); // ❌ hooks after early return
> ```
>
> **正确示例**：
> ```tsx
> const { status } = useOnboardingStore();
> const progressPercent = useMemo(...);
> if (status !== 'in-progress') return null;
> ```
