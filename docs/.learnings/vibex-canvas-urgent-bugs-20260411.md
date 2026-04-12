# Learnings: vibex-canvas-urgent-bugs — P0 紧急修复

**项目**: vibex-canvas-urgent-bugs
**完成时间**: 2026-04-11
**基线**: `79ebe010`
**结果**: ✅ Epic1 + Epic2 全部完成

---

## 项目结果

- **Epic1 (Bug-1 Hooks安全重构)**: ✅ `54dab01b` — 22 tests passed
- **Epic2 (Bug-2 404资源修复)**: ✅ `7bb5ae5b` — 0 404, build succeeds

---

## 核心教训

### 1. 404问题必须先用gstack验证，再分析根因

**问题**: 原始PRD声称"4个404资源"，但没有任何gstack验证步骤产出这个数字。后续分析指向了错误的源头（`/templates/ecommerce/` vs `e-commerce/` 路径），实际上这个文件根本不在 `/canvas` 的导入链中。

**教训**: Bug-2 Story 2.1 gstack验证是强制前置条件。静态分析（grep代码）不能替代浏览器环境下的真实请求监控。

**正确流程**: gstack console/network监控 → 记录具体404 URL → 分析代码位置 → 针对性修复。

**适用场景**: 所有涉及"资源加载"、"网络请求"、"404/500错误"的bug。

---

### 2. Bug描述 ≠ 根因

**问题**: Bug-1描述为"React Hooks Violation导致崩溃"，OQ-1（blocker）从未用gstack抓过崩溃时的实际console error。所有后续分析基于"架构临界状态"的推断。

**实际代码**: `CanvasOnboardingOverlay.tsx` L87 early return后有 `useCallback` 和 `useEffect` — 这在技术上没有违反React Hooks Rules（因为useCallback/useEffect本身是hooks，它们在L87之后调用，L87之后没有新的useXxx hook），但确实处于"未来极容易触发violation"的架构反模式。

**教训**: Bug-1的真实价值不是"修复崩溃"，而是"消除架构债务"。hook顺序重构是正确的，但应该明确标注为"主动式架构改善"，而不是"被动bug修复"。

---

### 3. Zustand action参数断言的常见错误

**问题**: 测试方案T9写了 `expect(mockStore.dismissCanvasOnboarding).toHaveBeenCalledWith(expect.objectContaining({ type: 'dismiss' }))` — Zustand action签名是 `() => void`，不接受任何参数。这个断言会永远失败。

**正确写法**:
```typescript
expect(mockStore.dismissCanvasOnboarding).toHaveBeenCalledTimes(1)
// 或
expect(mockStore.dismissCanvasOnboarding).toHaveBeenCalledWith() // 无参数
```

**教训**: 测试断言必须与实际API签名匹配。Zustand action不同于Redux thunk，不携带action type字段。

---

### 4. ErrorBoundary测试的逻辑方向

**问题**: T10设计为 `expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument()` — 期望ErrorBoundary的Try Again按钮出现。Bug-1修复后，hooks violation不再发生，这个测试会永远失败。

**教训**: ErrorBoundary的测试逻辑应该是：
- 修复前：ErrorBoundary捕获到错误 → Try Again出现（bug存在）
- 修复后：ErrorBoundary不触发 → Try Again不出现（bug已修复）
- 正确断言: `expect(screen.queryByRole('button', { name: 'Try Again' })).not.toBeInTheDocument()`

---

### 5. localStorage冗余写入

**问题**: `handleDismiss` 和 `handleComplete` 各写一次 `localStorage.setItem('vibex-canvas-onboarded', 'true')`，但 `guidanceStore.ts` 的 persist middleware 已经将 `canvasOnboardingCompleted` 和 `canvasOnboardingDismissed` 持久化到 localStorage（key: `vibance-guidance`）。

**教训**: 在Zustand已配置persist的情况下，不要手动写localStorage。手动写入的key（`vibex-canvas-onboarded`）和store persist的key（`vibance-guidance`）不一致，会导致数据不一致风险。

---

### 6. CSS Module的bare selector违规会"静默"破坏构建

**问题**: `preview.module.css` 含bare `*` selector，导致Next.js Turbopack build失败。这个错误"静默"传播到所有页面（包括 `/canvas`），在开发环境中表现为页面加载失败，但错误信息不直接指向根因。

**教训**: CSS Module build error可能伪装成"资源404"或"页面加载失败"。遇到无法解释的加载问题时，检查构建输出是否有CSS Module相关的编译警告/错误。

---

## 伪命题识别

### "4个404资源"

这是PRD中设定的数字，不是分析产出的结论。gstack验证后实际数字为0（根因是CSS Module违规）。Epic 2虽然完成，但"修复了4个404"这个描述是不准确的——实际是"修复了CSS Module build错误，导致页面加载恢复"。

---

## PRD质量评分

| 维度 | 评分 | 说明 |
|------|------|------|
| 问题定义 | 7/10 | Bug-1清晰；Bug-2数字未验证 |
| 根因分析 | 6/10 | Bug-1正确；Bug-2方向错误 |
| 验收标准 | 7/10 | 具体可测试；T9/T10断言有bug |
| 测试方案 | 6/10 | 框架完整；T2/T3/T9/T10有缺陷 |
| 风险识别 | 7/10 | Epic1充分；Epic2识别不足 |

---

## 文档引用

- analysis.md: `/root/.openclaw/vibex/docs/vibex-canvas-urgent-bugs/analysis.md`
- prd.md: `/root/.openclaw/vibex/docs/vibex-canvas-urgent-bugs/prd.md`
- architecture.md: `/root/.openclaw/vibex/docs/vibex-canvas-urgent-bugs/architecture.md`
- 404验证报告: `/root/.openclaw/vibex/docs/vibex-canvas-urgent-bugs/404-verification-report.md`
- 验收标准验证: `/root/.openclaw/vibex/docs/vibex-canvas-urgent-bugs/acceptance-criteria-*.md`
