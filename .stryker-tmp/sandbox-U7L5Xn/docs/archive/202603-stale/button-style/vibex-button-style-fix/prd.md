# 按钮样式修复 - PRD

**项目**: vibex-button-style-fix
**版本**: 1.0
**状态**: PM 细化
**工作目录**: /root/.openclaw/vibex

---

## 1. 执行摘要

### 1.1 背景

`generateButton` 样式未生效，根因是 CSS 变量名不匹配和全局按钮重置冲突。

### 1.2 目标

修复 CSS 变量名、统一按钮样式，确保按钮显示正确。

### 1.3 核心指标

| 指标 | 目标 |
|------|------|
| 按钮渐变背景显示 | 100% |
| CSS 变量名规范 | 100% 使用 `--color-` 前缀 |
| 悬停动画效果 | 正常工作 |

---

## 2. 功能需求

### F1: CSS 变量名修复

**描述**: 修复 `RequirementInput.module.css` 中的 CSS 变量名

**验收标准**:
- `expect(cssContent).not.toMatch(/var\(--bg-primary/)`
- `expect(cssContent).toMatch(/var\(--color-bg-primary/)`
- `expect(cssContent).toMatch(/var\(--color-accent/)`

### F2: 全局按钮重置修复

**描述**: 移除 `design-tokens.css` 中全局按钮的 background: none

**验收标准**:
- `expect(designTokens).not.toMatch(/button\s*\{[^}]*background:\s*none/)`

### F3: 样式验证

**描述**: 验证按钮样式正确应用

**验收标准**:
- `expect(getComputedStyle(button)).toMatch(/linear-gradient/)`
- `expect(button.hover).toHaveCssRule("transform: translateY(-2px)")`

---

## 3. Epic 拆分

### Epic 1: CSS 变量修复

**目标**: 统一 CSS 变量命名规范

| Story | 描述 | 验收标准 |
|-------|------|----------|
| S1.1 | 修复 RequirementInput.module.css | `expect(file).toMatch(/--color-bg-primary/)` |
| S1.2 | 修复其他 CSS 文件变量名 | `expect(allCss).not.toMatch(/--bg-/)` |

### Epic 2: 全局样式修复

**目标**: 移除全局按钮样式冲突

| Story | 描述 | 验收标准 |
|-------|------|----------|
| S2.1 | 移除 background: none | `expect(button).not.toHaveBackground("none")` |

### Epic 3: 验证与测试

**目标**: 确保样式正确应用

| Story | 描述 | 验收标准 |
|-------|------|----------|
| S3.1 | 按钮渐变背景显示 | `expect(button).toHaveGradientBackground()` |
| S3.2 | 悬停动画效果 | `expect(hover).toTrigger("translateY(-2px)")` |
| S3.3 | 禁用状态样式 | `expect(disabled).toHaveGreyBackground()` |

---

## 4. 验收标准汇总

| 优先级 | 验收项 | 标准 |
|--------|--------|------|
| P0 | 按钮渐变背景 | 显示 linear-gradient |
| P0 | 悬停动画 | translateY(-2px) |
| P0 | CSS 变量规范 | 使用 --color- 前缀 |
| P1 | 禁用状态 | 灰色背景 |
| P1 | 无全局冲突 | 按钮背景正常显示 |

---

## 5. DoD

- [ ] 所有 Story 验收通过
- [ ] 浏览器验证按钮样式正确
- [ ] 代码审查通过

---

**产出物**: `docs/vibex-button-style-fix/prd.md`
**验证**: `test -f /root/.openclaw/vibex/docs/vibex-button-style-fix/prd.md`
