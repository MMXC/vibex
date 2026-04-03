# IMPLEMENTATION_PLAN: vibex-homepage-module-fix

## 项目目标
修复 `vibex-homepage-redesign-v2` implement 阶段后，4 个 Playwright E2E 测试因 CSS Module 选择器问题导致的失败。

---

## Phase 1: 快速止血（不修改源码）

### 任务 1: 修复 step-switch.spec.ts 选择器
**执行者**: dev  
**文件**: `vibex-fronted/tests/e2e/step-switch.spec.ts`

#### 修改内容

| 行号 | 当前代码 | 修改后 |
|-----|---------|-------|
| 21 | `.Steps-module__gfgF6G__stepList` | `[data-testid="step-list"]` (需 Phase 2) |
| 21 | `[class*="stepList"]` | 保留（回退） |
| 24 | `[class*="stepItem"]` | `[class*="step"]:not([class*="stepList"])` |
| 35 | `[class*="preview"]` | `[class*="preview"]` (保留) |
| 94 | `[class*="stepItem"]` | `[data-testid^="step-"]` (需 Phase 2) |

#### 临时修复代码
```typescript
// 修复前
const stepNavigation = page.locator('.Steps-module__gfgF6G__stepList, [class*="stepList"]');
const steps = page.locator('[class*="stepItem"], [class*="step"]');

// 修复后（Phase 1 - 暂不添加 data-testid）
const stepNavigation = page.locator('[class*="container"], [class*="stepList"]');
const steps = page.locator('[class*="step"]:not([class*="connector"])');
```

#### 验证
```bash
cd vibex-fronted
npx playwright test tests/e2e/step-switch.spec.ts --project=chromium
```

---

## Phase 2: 长期方案（修改源码）

### 任务 2: 添加 data-testid 到 Steps 组件
**执行者**: dev  
**文件**: `vibex-fronted/src/components/ui/Steps.tsx`

```typescript
// Steps.tsx - 添加 data-testid
<div
  data-testid="step-list"
  className={`${styles.container} ${styles[direction]} ${className}`}
>
  {steps.map((step, index) => (
    <div
      key={index}
      data-testid={`step-${index}`}
      className={`${styles.step} ${styles[getStepStatus(index, step.status)]} ${isClickable && status !== 'pending' ? styles.clickable : ''}`}
    >
      {/* ... */}
    </div>
  ))}
</div>
```

### 任务 3: 添加 data-testid 到 PreviewArea
**执行者**: dev  
**文件**: `vibex-fronted/src/components/homepage/PreviewArea/PreviewArea.tsx`

```typescript
<section data-testid="preview-area" className={styles.previewSection}>
```

### 任务 4: 添加 data-testid 到 ActionButtons
**执行者**: dev  
**文件**: `vibex-fronted/src/components/homepage/InputArea/ActionButtons.tsx`

```typescript
<button data-testid="undo-button" ...>撤销</button>
<button data-testid="generate-button" ...>生成</button>
```

### 任务 5: 更新 step-switch.spec.ts 使用 data-testid
**执行者**: dev  
**文件**: `vibex-fronted/tests/e2e/step-switch.spec.ts`

```typescript
// 替换所有选择器为 data-testid
const stepNavigation = page.locator('[data-testid="step-list"]');
const steps = page.locator('[data-testid^="step-"]');
const previewArea = page.locator('[data-testid="preview-area"]');
const undoButton = page.locator('[data-testid="undo-button"]');
const generateBtn = page.locator('[data-testid="generate-button"]');
```

### 任务 6: 创建 PageObject 提取公共选择器
**执行者**: dev  
**文件**: `vibex-fronted/tests/e2e/pages/StepSwitchPage.ts`

```typescript
import { Page } from '@playwright/test';

export class StepSwitchPage {
  constructor(private page: Page) {}

  readonly stepList = this.page.locator('[data-testid="step-list"]');
  readonly steps = this.page.locator('[data-testid^="step-"]');
  readonly previewArea = this.page.locator('[data-testid="preview-area"]');
  readonly undoButton = this.page.locator('[data-testid="undo-button"]');
  readonly generateButton = this.page.locator('[data-testid="generate-button"]');

  async goto(url: string) {
    await this.page.goto(url);
    await this.page.waitForLoadState('networkidle');
  }
}
```

---

## 风险缓解

| 风险 | 缓解措施 |
|-----|---------|
| 添加 data-testid 影响样式 | data-testid 仅用于测试，不影响渲染 |
| 修改 Steps.tsx 引入回归 | 单元测试 `Steps.test.tsx` 需同步通过 |
| 其他测试受选择器变更影响 | 修改后运行完整测试套件验证 |

---

## 验收标准

- [ ] `step-switch.spec.ts` 4 个测试用例全部通过
- [ ] `Steps.test.tsx` 单元测试通过
- [ ] 连续 3 次 `npm run build` 后测试仍然稳定（无哈希变化问题）
- [ ] PR 包含测试稳定性验证日志
