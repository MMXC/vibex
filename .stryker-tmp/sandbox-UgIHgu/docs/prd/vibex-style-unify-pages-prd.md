# PRD: 页面风格统一

**项目名称**: vibex-style-unify-pages  
**版本**: 1.0  
**创建日期**: 2026-03-04  
**负责人**: PM Agent  
**上游文档**: [Style Gap Analysis](../style-gap-analysis.md)

---

## 1. 项目目标

统一三个关键页面的视觉风格：注册登录页、需求输入页、领域模型确认界面，确保与 Dashboard/Project 页面保持一致的设计语言。

---

## 2. 功能需求

### 2.1 注册登录页 (`/auth`) 风格统一

**当前问题**: 完全不同的设计风格（浅色背景、白色卡片、内联样式）

**需要调整项**:

| ID | 调整项 | 验收标准 | 优先级 |
|----|--------|----------|--------|
| F2.1.1 | 背景系统 | 使用网格叠加层 + 发光球体背景 | P0 |
| F2.1.2 | 样式方式 | 从内联样式改为 CSS Module | P0 |
| F2.1.3 | 卡片样式 | 使用玻璃态效果 (backdrop-filter: blur) | P0 |
| F2.1.4 | 按钮样式 | 渐变 + 霓虹发光效果 | P0 |
| F2.1.5 | 输入框样式 | 深色背景 + 发光边框 | P0 |
| F2.1.6 | 动画效果 | 使用设计系统动画变量 | P1 |

### 2.2 需求输入页 (`/confirm`) 风格统一

**当前问题**: 部分风格不一致（渐变背景、绿色主色调、未完全使用设计变量）

**需要调整项**:

| ID | 调整项 | 验收标准 | 优先级 |
|----|--------|----------|--------|
| F2.2.1 | 背景系统 | 替换为网格叠加层 + 青色发光球 | P1 |
| F2.2.2 | 主色调 | 从绿色 #4ade80 改为 var(--color-primary) 青色 | P1 |
| F2.2.3 | 设计变量 | 所有颜色使用 CSS 变量 | P1 |
| F2.2.4 | 卡片样式 | 与 Dashboard 玻璃态统一 | P2 |

### 2.3 领域模型确认界面 (`/domain`) 风格微调

**当前问题**: 发光球颜色为紫色，与整体不一致

**需要调整项**:

| ID | 调整项 | 验收标准 | 优先级 |
|----|--------|----------|--------|
| F2.3.1 | 发光球颜色 | 从紫色改为青色 (rgba(0, 255, 255, 0.08)) | P2 |

---

## 3. 组件规范

### 3.1 背景系统组件

```css
/* 背景容器 */
.bgEffect {
  position: fixed;
  z-index: -1;
  inset: 0;
  overflow: hidden;
}

/* 网格叠加层 */
.gridOverlay {
  position: absolute;
  inset: 0;
  background-image: 
    linear-gradient(rgba(0, 255, 255, 0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 255, 255, 0.02) 1px, transparent 1px);
  background-size: 50px 50px;
}

/* 发光球体 */
.glowOrb {
  position: absolute;
  width: 600px;
  height: 600px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(0, 255, 255, 0.08) 0%, transparent 70%);
  filter: blur(60px);
}
```

### 3.2 卡片组件

```css
/* 玻璃态卡片 */
.card {
  background: var(--color-bg-glass);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

/* 卡片悬停效果 */
.card:hover {
  border-color: var(--color-primary);
  box-shadow: 0 8px 32px rgba(0, 255, 255, 0.15);
}
```

### 3.3 按钮组件

```css
/* 主按钮 */
.btnPrimary {
  background: linear-gradient(135deg, var(--color-primary) 0%, #00d4ff 100%);
  color: #000;
  font-weight: 600;
  border: none;
  border-radius: 12px;
  padding: 12px 24px;
  cursor: pointer;
  transition: all var(--duration-normal) var(--ease-out-expo);
  box-shadow: 0 0 20px rgba(0, 255, 255, 0.3);
}

.btnPrimary:hover {
  transform: translateY(-2px);
  box-shadow: 0 0 30px rgba(0, 255, 255, 0.5);
}

.btnPrimary:active {
  transform: translateY(0);
}
```

### 3.4 输入框组件

```css
.input {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 12px 16px;
  color: var(--color-text-primary);
  transition: all var(--duration-fast) var(--ease-out-expo);
}

.input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(0, 255, 255, 0.1), 0 0 20px rgba(0, 255, 255, 0.1);
}

.input::placeholder {
  color: var(--color-text-secondary);
}
```

---

## 4. 配色方案 (CSS 变量)

### 4.1 颜色变量定义

```css
:root {
  /* 主色调 - 青色 */
  --color-primary: #00ffff;
  --color-primary-hover: #00e6e6;
  --color-primary-muted: rgba(0, 255, 255, 0.1);
  
  /* 背景色 */
  --color-bg-primary: #0a0a0f;
  --color-bg-secondary: #12121a;
  --color-bg-tertiary: #1a1a24;
  --color-bg-glass: rgba(18, 18, 26, 0.7);
  
  /* 边框色 */
  --color-border: rgba(255, 255, 255, 0.1);
  --color-border-hover: rgba(0, 255, 255, 0.3);
  
  /* 文字色 */
  --color-text-primary: #ffffff;
  --color-text-secondary: rgba(255, 255, 255, 0.7);
  --color-text-tertiary: rgba(255, 255, 255, 0.5);
  
  /* 状态色 */
  --color-success: #4ade80;
  --color-error: #f87171;
  --color-warning: #fbbf24;
  
  /* 发光效果 */
  --glow-primary: rgba(0, 255, 255, 0.3);
  --glow-strong: rgba(0, 255, 255, 0.5);
}
```

### 4.2 页面特定发光球颜色

```css
/* Dashboard / Project */
.pageGlowCyan {
  background: radial-gradient(circle, rgba(0, 255, 255, 0.08) 0%, transparent 70%);
}

/* Domain (当前为紫色，需改为青色) */
.pageGlowPurple {  /* 需删除 */
  background: radial-gradient(circle, rgba(139, 92, 246, 0.08) 0%, transparent 70%);
}
```

---

## 5. 动画标准

### 5.1 动画变量

```css
:root {
  /* 时长 */
  --duration-fast: 150ms;
  --duration-normal: 300ms;
  --duration-slow: 500ms;
  
  /* 缓动函数 */
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  
  /* 常用动画 */
  --transition-fast: var(--duration-fast) var(--ease-out-expo);
  --transition-normal: var(--duration-normal) var(--ease-out-expo);
  --transition-slow: var(--duration-slow) var(--ease-out-expo);
}
```

### 5.2 常用动画效果

```css
/* 淡入 */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* 上浮 */
@keyframes slideUp {
  from { 
    opacity: 0;
    transform: translateY(20px);
  }
  to { 
    opacity: 1;
    transform: translateY(0);
  }
}

/* 发光脉冲 */
@keyframes glowPulse {
  0%, 100% { box-shadow: 0 0 20px var(--glow-primary); }
  50% { box-shadow: 0 0 40px var(--glow-strong); }
}

/* 使用方式 */
.animateFadeIn {
  animation: fadeIn var(--duration-normal) var(--ease-out-expo) forwards;
}

.animateSlideUp {
  animation: slideUp var(--duration-normal) var(--ease-out-expo) forwards;
}

.animateGlow {
  animation: glowPulse 2s ease-in-out infinite;
}
```

---

## 6. 页面验收标准

### 6.1 注册登录页 (`/auth`)

| 验收项 | 验收条件 | 测试方法 |
|--------|----------|----------|
| AC1 | 页面使用深色背景 (#0a0a0f) | 视觉检查 |
| AC2 | 背景包含网格叠加层 | 视觉检查 |
| AC3 | 背景包含青色发光球 | 视觉检查 |
| AC4 | 卡片使用玻璃态效果 (blur 20px) | 开发者工具检查 |
| AC5 | 按钮有霓虹发光效果 | 视觉检查 |
| AC6 | 输入框聚焦时有发光边框 | 交互测试 |
| AC7 | 所有颜色使用 CSS 变量 | 代码审查 |
| AC8 | 无内联样式 | 代码审查 |
| AC9 | 动画使用设计系统变量 | 代码审查 |

### 6.2 需求输入页 (`/confirm`)

| 验收项 | 验收条件 | 测试方法 |
|--------|----------|----------|
| AC1 | 背景为网格叠加层 + 青色发光球 | 视觉检查 |
| AC2 | 主色调为青色 (#00ffff) | 开发者工具检查 |
| AC3 | 卡片样式与 Dashboard 一致 | 视觉对比 |
| AC4 | 所有颜色使用 CSS 变量 | 代码审查 |
| AC5 | 动画效果统一 | 视觉检查 |

### 6.3 领域模型确认界面 (`/domain`)

| 验收项 | 验收条件 | 测试方法 |
|--------|----------|----------|
| AC1 | 发光球颜色为青色 | 视觉检查 |
| AC2 | 与 Dashboard 风格一致 | 视觉对比 |

---

## 7. Epic 拆解

### Epic 1: Auth 页面风格统一 (P0)

| Story | 验收标准 | 预估工时 |
|-------|----------|----------|
| 创建 auth.module.css | CSS Module 文件创建 | 0.5h |
| 实现背景系统 | 网格 + 发光球 | 0.5h |
| 实现玻璃态卡片 | blur 效果 | 0.5h |
| 实现按钮样式 | 渐变 + 发光 | 0.5h |
| 实现输入框样式 | 深色 + 发光边框 | 0.5h |
| 迁移 page.tsx | 移除内联样式 | 1h |

**小计**: 3.5h

### Epic 2: Confirm 页面风格统一 (P1)

| Story | 验收标准 | 预估工时 |
|-------|----------|----------|
| 修改背景系统 | 网格 + 发光球 | 0.5h |
| 修改主色调 | 绿色 → 青色 | 0.5h |
| 引入设计变量 | CSS 变量覆盖 | 0.5h |
| 统一卡片样式 | 玻璃态 | 0.5h |

**小计**: 2h

### Epic 3: Domain 页面微调 (P2)

| Story | 验收标准 | 预估工时 |
|-------|----------|----------|
| 修改发光球颜色 | 紫色 → 青色 | 0.25h |

**小计**: 0.25h

---

## 8. 非功能需求

| 需求 | 描述 |
|------|------|
| 兼容性 | Chrome, Firefox, Safari 最新两版本 |
| 性能 | 动画不引起卡顿 (60fps) |
| 可访问性 | 对比度符合 WCAG 2.1 AA |

---

## 9. 文件修改清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/app/auth/auth.module.css` | 新建 | 样式文件 |
| `src/app/auth/page.tsx` | 修改 | 使用 CSS Module |
| `src/app/confirm/confirm.module.css` | 修改 | 统一风格 |
| `src/app/domain/domain.module.css` | 修改 | 发光球颜色 |

---

*文档版本: 1.0*  
*创建时间: 2026-03-04*  
*作者: PM Agent*