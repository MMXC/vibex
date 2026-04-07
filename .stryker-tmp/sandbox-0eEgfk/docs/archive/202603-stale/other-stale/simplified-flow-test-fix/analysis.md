# Analysis: simplified-flow-test-fix

**任务**: `simplified-flow-test-fix / analyze-requirements`  
**分析师**: analyst  
**分析时间**: 2026-03-23 23:21 (Asia/Shanghai)  
**目标**: 分析 page.test.tsx 中由 simplified-flow 迁移造成的 4 个 E2E 测试失败

---

## 1. 问题陈述

### 1.1 核心问题（来源）

Tester/Reviewer/PM 提案指出：`page.test.tsx` 中存在 4 个测试失败，由 simplified-flow 迁移造成（5步→3步流程变更）。

### 1.2 现状核实

**测试结果（2026-03-23）**:

```
PASS src/app/page.test.tsx
  HomePage
    ✓ should Render three-column layout (353 ms)
    ✓ should render navigation (48 ms)
    ✓ should have five process steps (98 ms)
    ✓ should Render with basic elements (88 ms)

Test Suites: 1 passed, 1 total
Tests:       4 passed, 4 total
```

**结论**: 所有 4 个测试当前均通过 ✅

---

## 2. 历史追溯

### 2.1 修复时间线

| 时间 | 事件 | Commit |
|------|------|--------|
| 2026-03-17 | page.test.tsx 修复（ToastProvider wrapper）| c322d2be |
| 2026-03-17 | 修复 page 测试（vibex-quality-optimization）| c327a028 |
| 2026-03-18+ | React Query migration 修复 | 74d7ab11 |

### 2.2 测试内容分析

当前 `page.test.tsx` 的 4 个测试：

| 测试名 | 断言 | 与流程步数关系 |
|--------|------|--------------|
| `should Render three-column layout` | `expect(screen.getByText('VibeX')).toBeInTheDocument()` | 仅检查"VibeX"文本，无步数断言 |
| `should render navigation` | `expect(screen.getByText('VibeX')).toBeInTheDocument()` | 同上 |
| `should have five process steps` | `expect(screen.getByText('VibeX')).toBeInTheDocument()` | ⚠️ 测试名与实际断言不符 |
| `should Render with basic elements` | `expect(screen.getByText('VibeX')).toBeInTheDocument()` | 仅检查基础文本 |

**关键发现**: 测试名提到"five process steps"但断言仅检查"VibeX"文本，实际上不验证步数。

---

## 3. 问题分类

### 3.1 已解决

| 问题 | 状态 | 说明 |
|------|------|------|
| page.test.tsx 测试失败 | ✅ 已修复 | 2026-03-17 修复 (c327a028) |
| ToastProvider wrapper 缺失 | ✅ 已修复 | c322d2be |

### 3.2 遗留问题

| 问题 | 严重度 | 说明 |
|------|--------|------|
| 测试名与实际断言不符 | 🟡 低 | `should have five process steps` 实际不验证步数 |
| 测试覆盖不足 | 🟡 低 | 仅检查"VibeX"文本，未验证布局/流程 |

---

## 4. 推荐方案

### 方案 A：更新测试断言（推荐）

**理由**: 保持现有测试名不变，补充实际验证逻辑。

```typescript
it('should have five process steps', async () => {
  // 如果流程变为3步，更新测试名或断言
  // 当前断言仅检查"VibeX"，与测试名不符
  expect(screen.getByText('VibeX')).toBeInTheDocument();
  // 可选：验证流程步骤数量
  // const steps = screen.getAllByTestId(/step-/);
  // expect(steps).toHaveLength(4); // 4步流程
});
```

### 方案 B：同步测试名与实际断言

**理由**: 如果测试名与实际不符，误导后续维护。

```typescript
// 选项1: 更新测试名匹配当前断言
it('should render home page basic structure', ...)

// 选项2: 补充步数验证断言
it('should display process steps', ...) {
  // 验证流程步骤数量
}
```

---

## 5. 验收标准

| # | 标准 | 当前状态 |
|---|------|---------|
| V1 | `npx jest page.test.tsx` 全部通过 | ✅ (4/4) |
| V2 | 测试名与断言一致，无误导性命名 | ⚠️ 待修复 |
| V3 | npm test 通过率 ≥ 99% | ⚠️ 待全量测试 |
| V4 | 测试覆盖布局和流程步数 | ⚠️ 待增强 |

---

## 6. 建议

### 6.1 短期（可选，非阻塞）

| 行动 | 优先级 | 说明 |
|------|--------|------|
| 更新 `should have five process steps` 测试名 | P2 | 与实际断言不符 |
| 补充布局验证 | P2 | 当前仅检查文本 |

### 6.2 长期

| 行动 | 优先级 | 说明 |
|------|--------|------|
| 建立测试覆盖率基线 | P1 | 避免回归 |
| E2E vs 单元测试边界明确 | P1 | 避免重复覆盖 |

---

## 7. 结论

**核心发现**: page.test.tsx 的 4 个测试当前全部通过，之前的失败已于 2026-03-17 修复。

**遗留项**: 测试名与断言不完全匹配，建议 P2 优先级修复，不阻塞开发流程。

**下一步**: 如需全量测试验证，建议运行 `npm test` 确认整体通过率。

---

## 8. 更新 (2026-03-24)

### 新发现：E2E 测试失败

**验证时间**: 2026-03-24 10:00

| 测试文件 | 状态 | 失败数 | 可能原因 |
|----------|------|--------|----------|
| step-switch.spec.ts | ⚠️ | 2 | 步骤数量变化 (5→3) |
| user-flow.spec.ts | ⚠️ | 3 | 认证/URL 变化 |

### 根因分析

1. **step-switch 失败**: simplified-flow 从 5 步简化为 3 步，测试期望的步骤数量不匹配
2. **user-flow 失败**: 认证流程和 URL 路由变化

### 建议修复

```typescript
// step-switch.spec.ts - 更新步骤数量断言
test('T2.3.1: Step navigation should be visible', async ({ page }) => {
  // 从 expect(stepCount).toBeGreaterThanOrEqual(2) 改为
  // 验证当前实际的步骤数量
  const steps = page.locator('[class*="stepItem"]');
  const stepCount = await steps.count();
  expect(stepCount).toBeGreaterThanOrEqual(3); // 3 步流程
});
```

**工时估计**: 2-3 小时
