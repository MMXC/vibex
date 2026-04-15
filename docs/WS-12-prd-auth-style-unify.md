# PRD: Auth 页面风格统一

**Issue**: WS-12 | WS-PM [vibex-test]  
**Parent Epic**: WS-10 — [vibex-test] 修复 Auth 页面风格不统一  
**Version**: 1.0  
**Date**: 2026-04-16  
**角色**: PM Agent  
**Phase**: Phase1 — analyst → pm → architect → coord

---

## 1. 项目目标

将 `/auth` 页面（登录/注册）全面迁移至 VibeX 设计系统（`DESIGN.md` + `design-tokens.css`），消除与 Dashboard、Chat 等页面之间的视觉不一致，确保用户体验连贯性。

---

## 2. 问题分析

### 2.1 Auth 页面现状

| 属性 | Auth 页面当前值 | 设计系统规范 | 状态 |
|------|--------------|------------|------|
| 背景色 | `--color-bg-primary` | `--color-bg-primary` (#0d0d16) | ⚠️ 待确认 |
| 按钮背景 | cyan (#00ffff) 实底 | 应为 muted 背景 + 主色文字 | ❌ |
| 按钮文字 | `#fff` | 应为 `--color-primary` | ❌ |
| 按钮 hover | `var(--color-primary-hover, #0055cc)` | `--color-primary-hover` | ⚠️ |
| 圆角 | `8px` / `16px` 硬编码 | `var(--radius-md)` / `var(--radius-xl)` | ❌ |
| 卡片阴影 | `rgba(0,0,0,0.4)` 硬编码 | `var(--shadow-glass)` | ❌ |
| 发光效果 | `rgba(0, 255, 255, 0.3)` 硬编码 | `var(--shadow-glow-cyan)` | ❌ |
| 边框 | `var(--color-border)` ✅ | `var(--color-border)` | ✅ |
| 字体 | 继承系统 ✅ | `--font-sans` (Geist/Inter) | ✅ |

### 2.2 核心不一致点

**问题 1: `.submitBtn` 可访问性 & 风格错误**

当前（`auth.module.css` 第 124-146 行）:
```css
.submitBtn {
  background: linear-gradient(135deg, var(--color-primary) 0%, rgba(0, 255, 255, 0.8) 100%);
  color: var(--color-bg-primary);   /* 深色文字 + 青色背景 → 低对比度 */
  border: none;
  border-radius: 8px;                 /* 硬编码 */
  box-shadow: 0 0 20px rgba(0, 255, 255, 0.3);  /* 硬编码 */
}
```

参照 Dashboard 按钮风格（`dashboard.module.css`）：
```css
/* Dashboard 使用 muted 背景 + 主色文字/边框 */
background: var(--color-primary-muted);
color: var(--color-primary);
border: 1px solid var(--color-primary);
border-radius: var(--radius-md);     /* 使用 token */
box-shadow: var(--shadow-glow-cyan); /* 使用 token */
```

**问题 2: `.switchBtn` 颜色策略错误**

当前：`background: var(--color-primary)`（青色实底）+ `color: #fff`（白色文字）  
参照 Dashboard：使用 muted 背景 + 主色文字/边框

**问题 3: `.switchBtn` hover 颜色不对**

当前：`var(--color-primary-hover, #0055cc)` — fallback 是蓝色 `#0055cc`，与设计系统不符  
应为：`var(--color-primary-hover)` 或 `--color-accent`

**问题 4: 硬编码阴影 & 圆角**

- `border-radius: 8px` → 应为 `var(--radius-md)`
- `border-radius: 16px` → 应为 `var(--radius-xl)`
- `box-shadow: 0 0 20px rgba(0, 255, 255, 0.3)` → 应为 `var(--shadow-glow-cyan)`
- `box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4)` → 应为 `var(--shadow-glass)`

**问题 5: CSS 冗余属性**

`.switchBtn` 有两个 `border` 声明（`border: 1px solid var(--color-primary)` 和 `border: none`），后者覆盖前者，产生冗余。

### 2.3 设计系统关键 Token 参考

| Token | 值 | 用途 |
|-------|-----|------|
| `--color-primary` | `#00ffff` | 主色调（青色） |
| `--color-primary-hover` | `#00e5e5` | 主色 hover |
| `--color-primary-muted` | `rgba(0, 255, 255, 0.15)` | 主色 muted（按钮背景） |
| `--color-primary-glow` | `rgba(0, 255, 255, 0.5)` | 发光色 |
| `--color-bg-primary` | `#0d0d16` | 页面背景 |
| `--color-bg-glass` | `rgba(18, 18, 26, 0.88)` | 玻璃态卡片 |
| `--color-text-primary` | `#f0f0f5` | 主文字 |
| `--color-border` | `rgba(255, 255, 255, 0.08)` | 边框 |
| `--radius-md` | `0.5rem` / `8px` | 中等圆角 |
| `--radius-xl` | `1rem` / `16px` | 大圆角（卡片） |
| `--shadow-glow-cyan` | multi-layer glow | 青色发光阴影 |
| `--shadow-glass` | `0 8px 32px rgba(0,0,0,0.4)` | 玻璃态卡片阴影 |

---

## 3. Epic 拆分

### Epic 1: Auth 页面样式 Token 化

将 `auth.module.css` 中所有硬编码值替换为设计系统 Token。

---

### Story 1.1: 统一 `.submitBtn` 按钮样式

**文件**: `src/app/auth/auth.module.css`  
**优先级**: P0

**验收标准**:
- [ ] `.submitBtn` 背景改为 `var(--color-primary-muted)`
- [ ] `.submitBtn` 文字改为 `var(--color-primary)`
- [ ] `.submitBtn` 边框改为 `1px solid var(--color-primary)`
- [ ] `.submitBtn` border-radius 改为 `var(--radius-md)`
- [ ] `.submitBtn` box-shadow 改为 `var(--shadow-glow-cyan)`
- [ ] `.submitBtn:hover:not(:disabled)` 保留 hover 上浮效果
- [ ] `.submitBtn:disabled` 使用 `var(--color-primary-muted)` 背景 + 禁用态
- [ ] 可访问性：按钮文字与背景对比度 ≥ 4.5:1（WCAG AA）
- [ ] 与 Dashboard 登录按钮视觉风格一致

---

### Story 1.2: 统一 `.switchBtn` / `.switchBtnText` 按钮样式

**文件**: `src/app/auth/auth.module.css`  
**优先级**: P0

**验收标准**:
- [ ] `.switchBtn` 背景改为 `var(--color-primary-muted)`，文字改为 `var(--color-primary)`
- [ ] `.switchBtn:hover` 去掉错误的 fallback `#0055cc`，仅用 `var(--color-primary-hover)`
- [ ] `.switchBtn` 移除冗余的 `border` 声明
- [ ] `.switchBtn` border-radius 改为 `var(--radius-md)`
- [ ] `.switchBtnText` 保持文字链接风格，但 border-radius 改为 `var(--radius-sm)`
- [ ] `.switchBtnText:hover` 使用 `--color-primary-muted` 背景
- [ ] 登录↔注册切换按钮与 Dashboard 按钮风格一致

---

### Story 1.3: 统一 `.card` 组件阴影

**文件**: `src/app/auth/auth.module.css`  
**优先级**: P1

**验收标准**:
- [ ] `.card` 的 box-shadow 改为 `var(--shadow-glass)`
- [ ] `.card` 的 border-radius 改为 `var(--radius-xl)`
- [ ] `.card` 背景确认使用 `var(--color-bg-glass)`（已正确 ✅）

---

### Story 1.4: 确认并统一全局背景 Token

**文件**: `src/app/auth/auth.module.css`  
**优先级**: P1

**验收标准**:
- [ ] 确认 `--color-bg-primary` 在 `design-tokens.css` 和 `DESIGN.md` 中定义一致（当前存在文档不一致：`DESIGN.md` 写 `#0a0a0f`，tokens 写 `#0d0d16`）
- [ ] Auth 页面背景使用 `var(--color-bg-primary)`（无需改动，已正确引用）
- [ ] 如需协调色值差异，优先以 `design-tokens.css`（运行时实际值）为准

---

### Story 1.5: 移除 CSS 冗余声明

**文件**: `src/app/auth/auth.module.css`  
**优先级**: P2

**验收标准**:
- [ ] `.switchBtn` 移除重复的 `border` 声明
- [ ] 无其他 CSS 冗余或覆盖问题
- [ ] 通过 CSS 验证（无未使用的选择器）

---

## 4. 验收测试用例

### TC-001: 登录按钮样式验证
```
步骤: 访问 /auth/
预期:
  - 登录按钮背景为 muted 青色 (rgba(0,255,255,0.15))
  - 按钮文字为青色 #00ffff
  - 边框为 1px solid #00ffff
  - border-radius 为 8px
  - 有 cyan glow 阴影
```

### TC-002: 注册按钮样式验证
```
步骤: 点击"立即注册"切换到注册模式
预期:
  - 注册按钮（.submitBtn）样式与登录按钮一致
  - "立即登录"链接按钮样式正确
```

### TC-003: 切换按钮 hover 效果
```
步骤: 悬停在"立即注册"按钮上
预期:
  - hover 背景色变化（非蓝色）
  - 不出现 #0055cc 蓝色
```

### TC-004: 卡片样式验证
```
步骤: 访问 /auth/
预期:
  - 卡片有 glass 阴影 (var(--shadow-glass))
  - border-radius 为 16px (var(--radius-xl))
  - 背景为 glass 态 (var(--color-bg-glass))
```

### TC-005: 跨页面一致性
```
步骤: 分别访问 /auth/ 和 /dashboard/
预期:
  - 按钮风格一致（muted 背景 + 主色边框/文字）
  - 阴影效果风格一致
  - 圆角风格一致
```

---

## 5. 不在本次范围内的内容

以下内容属于其他 Epic/Story，不在本 PRD 范围内：

- `/confirm` 页面的风格统一（属于 Epic 2）
- `/domain` 页面的配色调整（属于 Epic 3）
- Auth 页面功能逻辑变更（如第三方登录、验证码等）
- 后端 Auth API 修改
- Auth 页面的 E2E 测试用例扩展

---

## 6. 参考文档

- 设计系统规范: `/root/.openclaw/vibex/DESIGN.md`
- 设计 Token: `/root/.openclaw/vibex/vibex-fronted/src/styles/design-tokens.css`
- Auth 页面: `/root/.openclaw/vibex/vibex-fronted/src/app/auth/page.tsx`
- Auth CSS: `/root/.openclaw/vibex/vibex-fronted/src/app/auth/auth.module.css`
- 风格分析报告: `/root/.openclaw/vibex/docs/style-gap-analysis.md`
- Dashboard CSS（参照）: `/root/.openclaw/vibex/vibex-fronted/src/app/dashboard/dashboard.module.css`
- Chat CSS（参照）: `/root/.openclaw/vibex/vibex-fronted/src/app/chat/chat.module.css`

---

*文档版本: 1.0*  
*创建时间: 2026-04-16*  
*角色: PM Agent (WS-12)*  
*Parent: WS-10 [vibex-test] 修复 Auth 页面风格不统一*
