# ADR: 修复 vibex-homepage-module-fix 测试失败的模块解析问题

## Status
Proposed — 等待 `analyze-requirements` 和 `create-prd` 完成后正式接受

---

## Context

### 问题描述

`vibex-homepage-redesign-v2` implement 阶段后，test 阶段有 4 个 Playwright E2E 测试失败。根因定位如下：

**受影响文件**：
- `tests/e2e/step-switch.spec.ts`

**核心问题**：测试使用了硬编码的 CSS Module 哈希类名。

```typescript
// ❌ 硬编码哈希会随构建变化而失效
const stepNavigation = page.locator('.Steps-module__gfgF6G__stepList, [class*="stepList"]');
```

1. **`.Steps-module__gfgF6G__stepList` 不存在**：该类名在任何 CSS 文件中都没有定义。`Steps.module.css` 使用的是 `.container`、`.step`、`.in-progress` 等类名。

2. **CSS Module 哈希脆弱性**：Next.js 对 CSS Module 类名进行哈希编译（如 `Steps.module.css` → `Steps.module__<hash>__<className>`）。每次构建哈希都可能变化，导致硬编码选择器失效。

3. **部分匹配选择器不精确**：
   - 测试用 `[class*="stepItem"]`，但组件 CSS 使用的是 `[class*="step"]`
   - 回退机制部分有效，但无法精确定位元素

---

## Decision

### 技术方案：三层修复策略

#### 第一层：稳定化选择器（立即可执行）

**原则**：测试应依赖不随构建变化的稳定标识符。

| 当前脆弱选择器 | 替换为稳定选择器 |
|--------------|---------------|
| `.Steps-module__gfgF6G__stepList` | `[class*="stepList"], [class*="container"]` |
| `[class*="stepItem"]` | `[class*="step"]` |
| 无对应元素 | 添加 `data-testid` 作为权威锚点 |

```typescript
// ✅ 修复后的选择器策略
const stepNavigation = page.locator('[class*="stepList"], [class*="container"]');
const steps = page.locator('[class*="step"]');
```

#### 第二层：添加 data-testid（推荐长期方案）

在 `Steps.tsx` 和相关组件中添加稳定的 `data-testid`：

```tsx
// ui/Steps.tsx
<div
  data-testid="step-list"
  className={`${styles.container} ${styles[direction]} ${className}`}
>
  {steps.map((step, index) => (
    <div
      key={index}
      data-testid={`step-${index}`}
      className={`${styles.step} ${styles[getStepStatus(index)]}`}
    >
      {/* ... */}
    </div>
  ))}
</div>
```

测试使用：

```typescript
// ✅ 最稳定：data-testid 完全独立于 CSS
const steps = page.locator('[data-testid^="step-"]');
const stepNavigation = page.locator('[data-testid="step-list"]');
```

#### 第三层：提取公共 PageObject（减少重复）

创建 `StepSwitchPage.ts` 统一所有 step-switch 相关测试的选择器：

```typescript
// tests/e2e/pages/StepSwitchPage.ts
export class StepSwitchPage {
  readonly stepList = this.page.locator('[data-testid="step-list"]');
  readonly steps = this.page.locator('[data-testid^="step-"]');
  readonly previewArea = this.page.locator('[data-testid="preview-area"]');
  readonly undoButton = this.page.getByRole('button', { name: /撤销|undo/i });
  
  async navigateTo(step: string) {
    await this.page.goto(`${BASE_URL}/confirm/${step}`);
    await this.page.waitForLoadState('networkidle');
  }
}
```

### 测试文件修复清单

| 测试用例 | 当前选择器 | 修复后选择器 |
|---------|-----------|------------|
| T2.3.1 | `.Steps-module__gfgF6G__stepList` | `[data-testid="step-list"]` |
| T2.3.1 | `[class*="stepItem"]` | `[data-testid^="step-"]` |
| T2.3.2 | `[class*="preview"]` | `[data-testid="preview-area"]` |
| T2.3.3 | `button:has-text("撤销")` | `[data-testid="undo-button"]` |
| T2.3.4 | `[class*="stepItem"]` | `[data-testid^="step-"]` |

---

## Consequences

### 正面
- 测试不再因 CSS 模块哈希变化而失败
- 选择器更语义化，维护成本降低
- `data-testid` 提供明确的测试锚点

### 负面
- 需要修改 `Steps.tsx` 等组件源码（添加 `data-testid`）
- 需要更新所有相关 E2E 测试文件
- 如果组件结构变化，需要同步更新 `data-testid`

### 风险
- 修改 `Steps.tsx` 可能引入新的 UI 回归
- 需确保添加 `data-testid` 不影响生产代码行为

---

## 实现计划

### Phase 1: 快速止血（不修改源码）
- 仅修改 `step-switch.spec.ts` 的选择器
- 使用 `[class*="..."]` 部分匹配替代硬编码哈希
- 预计耗时：30 分钟

### Phase 2: 长期方案（修改源码）
- 在 `Steps.tsx`、`HomePage.tsx` 等组件添加 `data-testid`
- 提取 PageObject 类
- 更新所有受影响测试文件
- 预计耗时：2 小时

---

## 依赖关系

```
analyze-requirements (analyst)  ──→  create-prd (pm)  ──→  design-architecture (architect)  ──→  coord-decision
        ↓                                        ↓
   analysis.md                              prd.md
                                                   
注：架构文档本阶段完成，实际代码修复由 dev agent 执行
```

---

## 验证标准

- [ ] `npx playwright test tests/e2e/step-switch.spec.ts` 全部通过（4 个测试用例）
- [ ] 其他使用类似选择器的测试不受影响
- [ ] CSS Module 类名变更后测试仍然稳定
