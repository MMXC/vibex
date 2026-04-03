# AGENTS.md — proposals-20260401-4 开发约束

**项目**: proposals-20260401-4 (Sprint 4 扫尾 + 稳定性加固)
**状态**: 规范约束
**适用角色**: dev, reviewer
**生效范围**: E1 (Canvas 崩溃修复)、E2 (颜色对比度)、E3 (E2E 稳定性)
**依据文档**: prd.md, specs/e1-canvas-crash-fix.md, specs/e2-color-contrast.md, specs/e3-e2e-stability.md

---

## 1. 全局代码标准

### 1.1 TypeScript 严格模式

- 全部 `.ts` / `.tsx` 文件必须启用 `strict: true`
- `tsconfig.json` 必须包含:
  ```json
  {
    "compilerOptions": {
      "strict": true,
      "noUncheckedIndexedAccess": true
    }
  }
  ```
- 禁止 `// @ts-ignore` / `// @ts-expect-error` 除非附上 Reviewer 批准的 issue 链接

### 1.2 Git Commit 规范

格式: `<type>(<scope>): <subject>`

| type | 用途 |
|------|------|
| `fix` | Bug 修复（E1 相关必填） |
| `feat` | 新功能或 Feature |
| `refactor` | 重构（不含行为变更） |
| `test` | 测试文件增改 |
| `chore` | CI/CD、依赖更新 |
| `docs` | 文档更新 |

**Examples:**
```
fix(canvas): add optional chain to .length access (ERR-MNFL1ABY)
feat(a11y): use CSS variables for button text color (WCAG 2.1 AA)
fix(e2e): remove waitForTimeout in canvas spec
```

### 1.3 文件路径约定

```
src/
  components/
    canvas/          ← Canvas 相关组件
    homepage/        ← Homepage 相关组件
  stores/
    canvas/          ← Canvas store (E1 重点)
  styles/
    variables.css    ← CSS 变量定义 (E2 必改)
e2e/
  canvas*.spec.ts   ← Canvas E2E 测试（E3 重点）
  homepage*.spec.ts ← Homepage E2E 测试
  a11y/             ← Accessibility 测试
```

---

## 2. Epic 专属约束

### 2.1 E1 — Canvas 运行时崩溃修复

**错误码前缀**: `ERR-MNFL1ABY`

#### 约束规则

| 规则 | 说明 | 强制级别 |
|------|------|----------|
| E1-R1 | 所有 `.length` 访问 **必须** 使用可选链 `value?.length` | **强制** |
| E1-R2 | canvas stores 中所有数组/对象属性访问前 **必须** 做 null/undefined 检查 | **强制** |
| E1-R3 | 每个 canvas 错误 **必须** 附带错误码，格式: `ERR-<MNEMONIC><NUMBER>` | **强制** |
| E1-R4 | ErrorBoundary 捕获的错误率 **必须** < 0.1% | **强制** |

#### 可选链必改清单

所有以下场景 **必须** 使用 `?.length`（而非 `.length`）：

```typescript
// ❌ 禁止
if (nodes.length > 0) { ... }
const count = edges.length;
array.filter(e => e.items.length > 0);

// ✅ 强制
if (nodes?.length > 0) { ... }
const count = nodes?.length ?? 0;
array.filter(e => (e.items?.length ?? 0) > 0);
```

#### 错误码命名规则

```
ERR-<MNEMONIC><NUMBER>
  MNEMONIC: 4-6字母缩写描述错误类型（如 MNFL=manifest/manifest not found）
  NUMBER: 5位数字（00000-99999），按发现顺序递增

Examples:
  ERR-MNFL10000   首个 .length undefined 错误
  ERR-MNFL10001   第二个
```

#### Dev 完成 E1 后自检清单

- [ ] `grep -rn '\.length' src/components/canvas/ src/stores/canvas/` 无遗漏（无 `value.length`，只有 `value?.length`）
- [ ] `grep -rn 'ERR-' src/` 确认所有 canvas 错误均有错误码
- [ ] `npm run lint` 无 error
- [ ] `npx tsc --noEmit` 0 error
- [ ] `npx playwright test e2e/canvas*.spec.ts` 通过

---

### 2.2 E2 — 颜色对比度 WCAG 2.1 AA 修复

#### 约束规则

| 规则 | 说明 | 强制级别 |
|------|------|----------|
| E2-R1 | 所有 CSS 颜色值 **必须** 使用 CSS 变量，禁止硬编码 hex/rgb/rgba | **强制** |
| E2-R2 | CSS 变量命名: `--color-<context>-<role>` | **强制** |
| E2-R3 | 普通文本对比度 **必须** ≥ 4.5:1（WCAG 2.1 AA） | **强制** |
| E2-R4 | 大文本（≥ 18pt 或 ≥ 14pt bold）对比度 **必须** ≥ 3:1 | **强制** |
| E2-R5 | 同时支持 light/dark theme 时，**两主题** 均需满足对比度要求 | **强制** |
| E2-R6 | 禁止使用 `style=` 内联属性设置颜色 | **强制** |

#### CSS 变量命名规范

```
命名格式: --color-<context>-<role>

Examples:
  --color-btn-primary-text     按钮主文本
  --color-btn-primary-bg       按钮主背景
  --color-nav-link-text        导航链接文本
  --color-panel-bg             面板背景
  --color-export-btn-text      导出按钮文本
  --color-canvas-sidebar-text  Canvas 侧边栏文本
```

#### 对比度修复目标页面

| 页面 | 目标 | 验收 |
|------|------|------|
| Homepage 导航/按钮 | ≥ 4.5:1 | axe-core `color-contrast` 违规 = 0 |
| Canvas 三栏面板 | ≥ 4.5:1 | axe-core `color-contrast` 违规 = 0 |
| Export 按钮 | ≥ 4.5:1 | axe-core `color-contrast` 违规 = 0 |

#### 禁止的写法

```css
/* ❌ 禁止 */
.btn { color: #888; background: rgb(200, 200, 200); }
.panel { color: #999999; }

/* ✅ 强制 */
.btn { color: var(--color-btn-primary-text); background: var(--color-btn-primary-bg); }
.panel { color: var(--color-panel-text); }
```

```tsx
/* ❌ 禁止 */
<div style={{ color: '#888' }}>Text</div>

/* ✅ 强制 */
<div className="btn">Text</div>
/* CSS: .btn { color: var(--color-btn-primary-text); } */
```

#### Dev 完成 E2 后自检清单

- [ ] `grep -rn '#' src/**/*.css | grep -v 'var(--' | grep -v '/*'` 无遗漏（无硬编码 hex）
- [ ] `grep -rn 'rgb(' src/**/*.css | grep -v 'var(--'` 无遗漏（无硬编码 rgb）
- [ ] `grep -rn 'style=' src/**/*.tsx | grep -i 'color'` 无 color 相关内联样式
- [ ] CSS 变量已定义在 `src/styles/variables.css` 中
- [ ] `npx playwright test tests/a11y --project=chromium` Critical/Serious 违规 = 0

---

### 2.3 E3 — E2E 测试稳定性加固

#### 约束规则

| 规则 | 说明 | 强制级别 |
|------|------|----------|
| E3-R1 | 每个 canvas E2E 测试文件 **必须** 有 `afterEach` cleanup hook | **强制** |
| E3-R2 | cleanup **必须** 重置: localStorage、store state、mock handlers | **强制** |
| E3-R3 | canvas E2E 中 **禁止** 使用 `waitForTimeout`，改用 `waitForResponse` 或 `waitForSelector` | **强制** |
| E3-R4 | E2E CI step **禁止** 设置 `continue-on-error: true` | **强制** |
| E3-R5 | E2E 测试连续 3 次运行结果必须一致（flaky = 0） | **强制** |

#### afterEach cleanup 模板

```typescript
// ✅ 正确模板
afterEach(() => {
  // 1. 清理 localStorage
  localStorage.clear();

  // 2. 重置 store state（如使用 Zustand/Redux）
  useCanvasStore.reset?.();
  useAppStore.reset?.();

  // 3. 清理 mock handlers（MSW）
  if (server.resetHandlers) server.resetHandlers();

  // 4. 重置网络拦截
  page.routeMock?.reset?.();
});
```

#### waitForTimeout 替换指南

```typescript
// ❌ 禁止
await page.waitForTimeout(3000);

// ✅ 替代方案 A：waitForResponse
await page.waitForResponse(
  response => response.url().includes('/api/canvas') && response.status() === 200
);

// ✅ 替代方案 B：waitForSelector
await page.waitForSelector('[data-testid="canvas-ready"]', { state: 'visible' });

// ✅ 替代方案 C：waitForFunction（轮询自定义条件）
await page.waitForFunction(() => document.querySelector('.canvas-loaded') !== null);
```

#### Flaky 测试定义

> **Flaky Test**: 同一测试、相同代码，在不同运行中产生不同结果的测试。
> - 测试通过 → 测试失败 = Flaky
> - 测试失败 → 测试通过 = Flaky
> - 允许因代码变更导致的通过/失败变更

#### Dev 完成 E3 后自检清单

- [ ] `grep -rn 'waitForTimeout' e2e/canvas*.spec.ts` 无结果
- [ ] `grep -rn 'afterEach' e2e/canvas*.spec.ts` 所有 canvas 测试文件均有
- [ ] `grep -rn 'localStorage' e2e/canvas*.spec.ts` 所有 canvas 测试文件均有 cleanup
- [ ] `.github/workflows/e2e-ci.yml` 中无 `continue-on-error: true`
- [ ] E2E 测试连续 3 次运行结果一致（passed/failed 数一致）

---

## 3. 测试要求总览

| Epic | 测试类型 | 覆盖率目标 | 关键指标 |
|------|----------|-----------|---------|
| E1 | 单元测试 + E2E | 崩溃路径 100% | 崩溃率 < 0.1% |
| E2 | axe-core a11y 测试 | Critical/Serious = 0 | 对比度 ≥ 4.5:1 |
| E3 | E2E 稳定性测试 | 全部 canvas E2E | flaky = 0 |

### CI 测试命令

```bash
# E1: TypeScript 严格检查
npx tsc --noEmit

# E1: Canvas E2E 崩溃检查
npx playwright test e2e/canvas*.spec.ts --project=chromium

# E2: Accessibility 完整检查
npx playwright test tests/a11y --project=chromium

# E3: E2E 稳定性（3 次连续运行）
npx playwright test --project=chromium
npx playwright test --project=chromium
npx playwright test --project=chromium
```

---

## 4. 禁止模式（Prohibited Patterns）

> 以下模式一旦发现，PR **立即驳回**，需修复后重新 Review。

| # | 禁止模式 | 触发条件 | 示例 | 例外条件 |
|---|----------|---------|------|---------|
| P1 | 非可选链 `.length` | `value.length` 且 `value` 可能为 undefined/null | `nodes.length` | 仅当 `value` 经过非空断言（如 `const nodes!: Node[]`）且 TypeScript 严格校验通过时可豁免 |
| P2 | CSS 硬编码颜色 | `.css`/`.tsx` 中出现 `#` 或 `rgb(` 且非 `var(--` | `color: #888;` | SVG 内用于 data viz 的固定配色（需注释标注）可豁免 |
| P3 | Canvas E2E 中 `waitForTimeout` | `e2e/canvas*.spec.ts` 含 `waitForTimeout` | `await page.waitForTimeout(3000)` | 测试框架自身 setup（如 `globalSetup`）中的 `waitForTimeout` 可豁免 |
| P4 | E2E CI `continue-on-error: true` | `.github/workflows/*.yml` 中 E2E step 含 `continue-on-error: true` | `continue-on-error: true` | **无任何例外** |
| P5 | Canvas E2E 缺失 `afterEach` cleanup | `e2e/canvas*.spec.ts` 不含 `afterEach` | 无 `afterEach` | 仅包含 `test.skip`/`test.fixme` 的测试文件可豁免 |

### 例外申请流程

1. 在代码中标注 `// Exception: <reason> (issue: #XXX)` 并附 issue 链接
2. PR 中单独列出例外项，说明原因
3. Reviewer 批准后生效

---

## 5. 验收清单（Per-Epic）

### E1 — Canvas 运行时崩溃修复

- [ ] 所有 `.length` 调用使用 `?.length` 或 `?? 0`
- [ ] canvas stores 中数组/对象访问前有 null 检查
- [ ] 每个 canvas 错误有 `ERR-MNFL1ABY*` 错误码
- [ ] ErrorBoundary 错误率 < 0.1%
- [ ] `ERR-*` 错误码在 staging/logs 中出现次数 = 0
- [ ] `npm run lint` 无 error
- [ ] `npx tsc --noEmit` 0 error
- [ ] `npx playwright test e2e/canvas*.spec.ts` 通过
- [ ] **Dev 自检**: 所有 `.length` 访问已加可选链，无遗漏

### E2 — 颜色对比度 WCAG 2.1 AA 修复

- [ ] Homepage 按钮/导航文本对比度 ≥ 4.5:1
- [ ] Canvas 面板/按钮对比度 ≥ 4.5:1
- [ ] Export 按钮对比度 ≥ 4.5:1
- [ ] 所有 CSS 颜色使用 `var(--color-*-*)` 变量
- [ ] 无 `style=` 内联 color 属性
- [ ] Light/dark theme 均满足对比度要求
- [ ] `npx playwright test tests/a11y --project=chromium` Critical/Serious = 0
- [ ] **Dev 自检**: grep 无硬编码 hex/rgb，CSS 变量已定义并使用

### E3 — E2E 测试稳定性加固

- [ ] 每个 canvas E2E 文件有 `afterEach` cleanup hook
- [ ] cleanup 重置: localStorage + store state + mock handlers
- [ ] canvas E2E 中 `waitForTimeout` 使用次数 = 0
- [ ] `.github/workflows/e2e-ci.yml` 无 `continue-on-error: true`
- [ ] E2E 测试连续 3 次运行结果一致（flaky = 0）
- [ ] `npx playwright test --project=chromium` 稳定通过
- [ ] **Dev 自检**: grep 无 waitForTimeout，cleanup 覆盖完整，CI 配置正确

---

## 6. 执行摘要

| 角色 | 核心职责 |
|------|---------|
| **Dev** | 按约束实现，Dev 完成每 Epic 后自检 |
| **Reviewer** | 逐项核对验收清单，拒绝所有 P1-P5 禁止模式 |
| **PM** | 验收指标达成确认 |

**约束版本**: v1.0
**生成时间**: 2026-04-01
**关联 PRD**: docs/proposals-20260401-4/prd.md
