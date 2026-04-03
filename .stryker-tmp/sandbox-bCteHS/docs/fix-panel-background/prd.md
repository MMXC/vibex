# PRD: Fix Panel Background Contrast — 2026-03-31

> **任务**: fix-panel-background/create-prd
> **创建日期**: 2026-03-31
> **PM**: PM Agent
> **产出物**: /root/.openclaw/vibex/docs/fix-panel-background/prd.md
> **分析文档**: /root/.openclaw/vibex/docs/fix-panel-background/analysis.md

---

## 1. 执行摘要

| 项目 | 内容 |
|------|------|
| **背景** | 未登录用户访问 landing/auth 页面时，面板背景色 `#12121a` 与 body `#0a0a0f` 对比度仅 ~1.5:1（肉眼无法区分），玻璃面板半透明效果导致内容与背景融为一体 |
| **根因** | `--color-bg-secondary` (#12121a) 与 `--color-bg-primary` (#0a0a0f) 仅差 ~8 RGB 值 |
| **目标** | 面板与背景肉眼可区分，表单输入框可读，输入区域有清晰边界 |
| **成功指标** | `/auth` 表单对比度 ≥ 2:1；gstack screenshot 验证面板可见；输入框背景与 body 可区分 |

---

## 2. Epic 拆分

### Epic 1: design-tokens.css 全局变量调整（P0）

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| S1.1 | 提亮 `--color-bg-primary`: `#0a0a0f` → `#0d0d16` | 0.5h | `expect(getComputedStyle(document.body).backgroundColor).toMatch(/0d0d/);` |
| S1.2 | 提亮 `--color-bg-secondary`: `#12121a` → `#17172a` | 0.25h | `expect(secondaryPanel).not.toHaveBackgroundColor('#12121a');` |
| S1.3 | 降低玻璃透明度 `--color-bg-glass`: `0.7` → `0.88` | 0.25h | `expect(glassPanel.opacity).toBeGreaterThan(0.8);` |

**DoD**: 全局 CSS 变量已更新，landing/auth/canvas 三页均可见面板背景

---

### Epic 2: auth 页面内联样式修复（P0）

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| S2.1 | 修复 `/auth` 表单 input 背景：`rgba(255,255,255,0.03)` → `rgba(255,255,255,0.08)` | 0.5h | `expect(authInputBg).toMatch(/0\.0[89]/);` |
| S2.2 | 修复 `/auth` 玻璃卡片背景（检查内联 style） | 0.5h | `expect(authGlassCard).toBeVisible(); expect(contrastRatio).toBeGreaterThan(2);` |

**DoD**: `/auth` 页面表单输入框可见，与 body 背景可区分

---

### Epic 3: landing 页面验证与修复（P0）

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| S3.1 | 验证 Hero 玻璃卡片可见（非透明一团） | 0.25h | `expect(heroCard).toBeVisible(); expect(heroCardBg).not.toBe('transparent');` |
| S3.2 | 验证 Feature Card 背景与 body 可区分 | 0.25h | `expect(featureCard).toBeDistinctFromBackground();` |
| S3.3 | 验证 Code Preview textarea 背景可读 | 0.25h | `expect(codePreviewTextarea).toBeReadable();` |

**DoD**: `/landing` 所有面板/卡片/guest 用户输入区域可见可读

---

### Epic 4: canvas 页面回归验证（P0）

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| S4.1 | 验证 TreePanel 背景可见（非黑成一团） | 0.25h | `expect(treePanel).toBeVisible(); expect(treePanelBg).not.toBe('#000');` |
| S4.2 | 验证面板调整不影响已登录 dashboard 外观 | 0.25h | `expect(dashboard).toMatchBaselineScreenshot();` |

**DoD**: canvas 页面面板可见，dashboard 外观无回归

---

### Epic 5: 回归测试（P1）

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| S5.1 | gstack screenshot 对比修复前后（landing/auth/canvas） | 0.5h | `expect(screenshotAfter).toBeMoreVisibleThan(screenshotBefore);` |
| S5.2 | 验证亮色模式（homepage）不受影响 | 0.25h | `expect(homepageLightMode).not.toBeAffectedByTokensChange();` |

**DoD**: 修复后截图验证通过，亮色模式无回归

---

## 3. 验收标准总表（expect() 断言）

| ID | 条件 | 断言 |
|----|------|------|
| AC-1 | `/auth` 表单对比度 ≥ 2:1 | `expect(getContrastRatio(authForm, bodyBg)).toBeGreaterThanOrEqual(2);` |
| AC-2 | `/auth` input 背景提亮 | `expect(inputBgAlpha).toBeGreaterThanOrEqual(0.08);` |
| AC-3 | `/landing` Hero 玻璃卡片可见 | `expect(heroCardOpacity).toBeGreaterThan(0.5);` |
| AC-4 | `/landing` Feature Card 与 body 对比 | `expect(featureCard).toBeDistinctFromBackground();` |
| AC-5 | `/landing` Code Preview textarea 可读 | `expect(codePreviewText).toBeReadable();` |
| AC-6 | `/canvas` TreePanel 背景可见 | `expect(treePanelBgLuminance).toBeGreaterThan(0.005);` |
| AC-7 | gstack screenshot 验证面板可见 | `expect(screenshot).toShowVisiblePanel();` |
| AC-8 | dashboard 外观无回归 | `expect(dashboardScreenshot).toMatchBaseline();` |

---

## 4. 非功能需求

| 类型 | 要求 |
|------|------|
| **性能** | CSS 变量调整，无 JS 重算性能损耗 |
| **兼容性** | 亮色模式（homepage）变量独立，不受影响 |
| **可访问性** | 对比度目标 ≥ 2:1（次优于 WCAG AA 4.5:1，作为增强目标） |
| **回归** | auth/dashboard/landing/canvas 四页均截图验证 |

---

## 5. 实施计划

| Epic | Story | 工时 | Sprint |
|-------|-------|------|--------|
| Epic 1 | S1.1-S1.3 design-tokens | 1h | Sprint 0 |
| Epic 2 | S2.1-S2.2 auth 页面 | 1h | Sprint 0 |
| Epic 3 | S3.1-S3.3 landing 页面 | 0.75h | Sprint 0 |
| Epic 4 | S4.1-S4.2 canvas 回归 | 0.5h | Sprint 0 |
| Epic 5 | S5.1-S5.2 截图验证 | 0.75h | Sprint 0 |

**总工时**: 4h

---

## 6. DoD（完成定义）

### 每个 Story 的 DoD
1. 代码修改完成
2. gstack screenshot 验证修复前后对比
3. 受影响页面截图保存到 `.gstack/qa-reports/`

### Epic DoD
- Epic 1：`/landing`/`/auth`/`/canvas` 三页面板均可见
- Epic 2：`/auth` 表单输入框清晰可见
- Epic 3：`/landing` 所有卡片/面板可见可读
- Epic 4：canvas 面板可见，dashboard 无回归
- Epic 5：截图对比通过，无新增问题
