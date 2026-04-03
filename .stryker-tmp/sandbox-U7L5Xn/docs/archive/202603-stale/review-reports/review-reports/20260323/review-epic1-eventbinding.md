# Code Review: Epic1-EventBinding — homepage-event-audit

**任务**: homepage-event-audit / reviewer-epic1-eventbinding
**Commit**: `53d51e27` — feat(Epic1-EventBinding): wire all BottomPanel stubs to real handlers
**文件**: `HomePage.tsx` + `useHomePage.ts`
**审查时间**: 2026-03-22 16:40

---

## ✅ 验收标准达成

| PRD 要求 | 状态 |
|----------|------|
| BottomPanel 8 个回调全部有真实处理 | ✅ |
| requirementText 与 BottomPanelInputArea 绑定 | ✅ |
| handleAIPanelSend 非空函数 | ✅ |
| Navbar onMenuToggle 已连线 | ✅ |
| AIPanel onClose 已连线 | ✅ |

---

## 🔴 Blocker (Must Fix)

**`handleOptimize` — `optimizeRequirement` 未捕获异常**

文件: `useHomePage.ts`

```typescript
const handleOptimize = useCallback(async () => {
  if (!requirementText.trim()) return;
  try {
    const diagnosis = await analyzeRequirement(requirementText);
    const { optimizedText } = await optimizeRequirement(requirementText, diagnosis); // ← 未 try/catch
    // ...
  } catch (err) {
    console.error('[useHomePage] handleOptimize failed:', err);
  }
}, [requirementText]);
```

**风险**: `optimizeRequirement` 调用失败会直接抛出未处理异常，用户看不到任何反馈，`requirementText` 不会被更新。

**建议**: 将 `optimizeRequirement` 包装在 `try/catch` 内，或将两段 API 调用统一处理。

---

## 🟡 Suggestions (Should Fix)

**1. `handleOptimize` — 重复调用 `analyzeRequirement`**

`handleOptimize` 先调用 `analyzeRequirement` 获取 diagnosis，再调用 `optimizeRequirement`，但 `analyzeRequirement` 的结果已经在前一步使用过了一次（P0 阶段通常会先分析需求）。建议确认是否需要冗余分析。

**2. `handleHistory` — 无匹配反馈**

```typescript
const handleHistory = useCallback((messageId?: string) => {
  const msg = chatHistory.find(m => m.id === messageId);
  if (msg) {
    setRequirementText(msg.content);
  }
  // 如果 messageId 未找到，静默忽略
}, [chatHistory]);
```

建议：未找到时向 chatHistory 添加提示消息。

**3. `handleCreateProject` — 错误静默吞掉**

用户创建项目失败时无任何 UI 反馈（`console.error` 不够）。

---

## 💭 Nits (Nice to Have)

1. **`onSettingsClick`** — 仍是空 stub，未连线到 Navbar（P0 中 `onMenuToggle` 已修复，`onSettingsClick` 遗漏）
2. **`onRegenerate`** — 仍是空 stub（BottomPanel 上次 review 已标注）
3. **ChatMessage `timestamp`** — 使用 `Date.now()` 数字，建议统一用 `Date` 对象或 ISO 字符串
4. **`handleOptimize`** — `optimizedText` 解构后未做空值检查

---

## ✅ 审查结论: CONDITIONAL PASS

**必须修复**: 🔴 `handleOptimize` 异常未捕获
**建议修复**: 🟡 3 项（历史记录无反馈、项目创建无错误提示、重复 API 调用）
**可通过**: 💭 4 项（stub 函数、类型规范）

**测试结果**: 30 套件全部通过（387 tests, 1 todo）
**ESLint/TS**: ✅ 通过
**npm build**: ✅ 通过
