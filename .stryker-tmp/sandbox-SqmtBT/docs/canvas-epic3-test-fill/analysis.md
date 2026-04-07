# Analysis: Canvas Epic3 测试补充

**任务**: canvas-epic3-test-fill/analyze-requirements
**日期**: 2026-03-30
**分析师**: analyst
**数据来源**: prd.md

---

## 1. 业务场景分析

### 背景
Canvas Epic3 代码已完成但缺少 E2E 测试用例，需要补充测试确保质量。

### 目标
- 测试用例 ≥ 10 个
- 覆盖率 ≥ 80%
- npm test 通过

---

## 2. Jobs-To-Be-Done (JTBD)

### JTBD 1: 补充 canvas-expand 测试用例
**用户**: dev, tester
**目标**: 覆盖 expand-both 和 maximize 全屏模式
**信号**: Epic3 功能已实现但无测试保护

### JTBD 2: 验证快捷键功能
**用户**: 所有用户
**目标**: F11/ESC 快捷键正常工作
**信号**: 用户依赖快捷键操作

### JTBD 3: 确保状态持久化
**用户**: 所有用户
**目标**: 全屏状态保存到 localStorage
**信号**: 用户期望状态跨会话保持

---

## 3. 技术方案

### 方案 A: Playwright E2E 测试（推荐）

```typescript
// canvas-expand.spec.ts
test('F11 进入全屏', async ({ page }) => {
  await page.goto('/canvas');
  await page.keyboard.press('F11');
  await expect(page.locator('.toolbar')).toBeHidden();
});
```

**优点**: 接近用户真实操作
**缺点**: 测试不稳定

### 方案 B: Vitest 单元测试

```typescript
// canvas-expand.test.ts
test('maximize 模式工具栏隐藏', () => {
  const { toolbar } = renderMaximizeMode();
  expect(toolbar).toBeHidden();
});
```

**优点**: 速度快，稳定
**缺点**: 不覆盖真实交互

---

## 4. 推荐方案

**方案 A** — Playwright E2E 测试

理由：
1. 测试真实用户场景
2. 覆盖快捷键等集成场景
3. 已有 Playwright 测试基础设施

---

## 5. 验收标准

| # | 标准 | 测试方法 |
|---|------|----------|
| 1 | 测试用例 ≥ 10 | `grep -c 'test(' canvas-expand.spec.ts` |
| 2 | 覆盖率 ≥ 80% | `npm run coverage` |
| 3 | npm test 通过 | `npm test` exit code 0 |
| 4 | F11 快捷键测试 | Playwright keyboard.press('F11') |
| 5 | ESC 退出测试 | Playwright keyboard.press('Escape') |
| 6 | 状态持久化测试 | localStorage 验证 |

---

## 6. 风险识别

| 风险 | 影响 | 缓解 |
|------|------|------|
| Playwright 测试不稳定 | 中 | 添加 `retry` 和稳定等待 |
| 覆盖率工具缺失 | 高 | 使用已有覆盖率工具 |
| 快捷键测试冲突 | 中 | 隔离测试环境 |

---

## 7. 时间估算

| Epic | 任务 | 估算 |
|------|------|------|
| Epic 1 | canvas-expand.spec.ts 补充 | 4h |
| Epic 2 | 增量测试覆盖 | 2h |
| Epic 3 | 测试验证 | 1h |
| **总计** | | **7h** |

---

## 8. 依赖项

- Playwright 测试框架
- 覆盖率工具（codecov 或 istanbul）
- Canvas 页面 (http://localhost:3000/canvas)
