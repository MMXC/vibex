# AGENTS.md: VibeX Canvas Urgent Bugs — P0 紧急修复

**Agent**: Architect
**Date**: 2026-04-11
**Project**: vibex-canvas-urgent-bugs
**Baseline**: `79ebe010`

---

## 开发约束

### 强制规则

1. **禁止修改 Zustand Store API** — guidanceStore 接口不变
2. **禁止在所有 hooks 之前定义 conditional return** — React Hooks Rules 强制遵守
3. **禁止增加新的 npm 依赖** — 纯重构，无新库需求
4. **禁止在 handleDismiss/handleComplete 中写 localStorage** — store persist 已覆盖
5. **Epic 2 必须先完成 Story 2.1 再动手修复** — gstack 验证是强制前置条件

### ESLint 规则

```json
{
  "react-hooks/rules-of-hooks": "error",
  "react-hooks/exhaustive-deps": "warn"
}
```

Story 1.1 完成后必须通过：
```bash
npx eslint src/components/guidance/CanvasOnboardingOverlay.tsx --rule 'react-hooks/rules-of-hooks: error'
```

### 代码风格

- 遵循现有 `CanvasOnboardingOverlay.tsx` 的命名和格式
- useCallback 的 deps 数组必须完整（禁止空数组除非绝对确定）
- Keyboard effect 直接调用 store action，不通过中间 callback

### 验证标准

Epic 1 完成前必须满足：
- [ ] ESLint hooks 检查通过（0 errors）
- [ ] Jest 测试 100% 通过
- [ ] gstack 验证：Skip 按钮点击不崩溃
- [ ] Console 无 `Invalid hook call` 错误

Epic 2 完成前必须满足：
- [ ] Story 2.1 验证报告已产出
- [ ] Story 2.2 修复后 gstack Network 面板 404 数量 = 0
- [ ] gstack screenshot 对比：UI 完整

### 注意事项

- `CanvasOnboardingOverlay.tsx` 中 progress dots 的 step 点击逻辑使用 `useGuidanceStore.getState()` — 这是合理的用法，不违反 hooks 规则（因为在 JSX 中，非 hook 调用）
- Test file 的 mockStore 必须模拟真实行为，避免过度简化（参考 `docs/learnings/canvas-testing-strategy.md`）
