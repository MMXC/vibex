# 架构设计: 统一风格组件

**项目**: vibex-style-unify-pages  
**版本**: 1.0  
**日期**: 2026-03-04  
**架构师**: Architect Agent  
**上游文档**: [PRD](./prd/vibex-style-unify-pages-prd.md), [Style Gap Analysis](../style-gap-analysis.md)

---

## 1. 设计系统概述

### 1.1 设计原则

| 原则 | 描述 |
|------|------|
| **玻璃态 (Glassmorphism)** | 使用 `backdrop-filter: blur()` 实现毛玻璃效果 |
| **霓虹发光 (Neon Glow)** | 青色 (#00ffff) 主色调，配合发光阴影 |
| **深色背景 (Dark Theme)** | 深色背景 (#0a0a0f) 配合网格叠加层 |
| **响应式 (Responsive)** | 移动端优先，支持多种屏幕尺寸 |

### 1.2 设计 Tokens

```css
/* 核心颜色变量 - 已在 design-tokens.css 定义 */
:root {
  --color-primary: #00ffff;        /* 赛博青 */
  --color-bg-primary: #0a0a0f;   /* 主背景 */
  --color-bg-glass: rgba(18, 18, 26, 0.7);  /* 玻璃态 */
  --color-border: rgba(255, 255, 255, 0.08);  /* 边框 */
}
```

---

## 2. 核心组件设计

### 2.1 背景系统组件

#### 2.1.1 背景容器 (BackgroundEffect)

```tsx
// components/ui/BackgroundEffect.tsx
interface BackgroundEffectProps {
  variant?: 'cyan' | 'purple' | 'pink';
  showGrid?: boolean;
  className?: string;
}

export function BackgroundEffect({ 
  variant = 'cyan', 
  showGrid = true,
  className 
}: BackgroundEffectProps) {
  const glowColors = {
    cyan: 'rgba(0, 255, 255, 0.08)',
    purple: 'rgba(139, 92, 246, 0.08)',
    pink: 'rgba(255, 0, 255, 0.08)',
  };
  
  return (
    <div className={cn('fixed inset-0 -z-10 overflow-hidden', className)}>
      {showGrid && (
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(${glowColors.cyan} 1px, transparent 1px),
              linear-gradient(90deg, ${glowColors.cyan} 1px, transparent 1px)
            `,
            backgroundSize: '30px 30px',
          }}
        />
      )}
      <div 
        className="absolute top-1/2 right-0 w-[500px] h-[500px] rounded-full"
        style={{
          background: `radial-gradient(circle, ${glowColors[variant]} 0%, transparent 70%)`,
          filter: 'blur(60px)',
        }}
      />
    </div>
  );
}
```

#### 2.1.2 CSS Module 实现

```css
/* styles/components/background.module.css */

.bgEffect {
  position: fixed;
  inset: 0;
  z-index: -1;
  overflow: hidden;
}

.gridOverlay {
  position: absolute;
  inset: 0;
  background-image: 
    linear-gradient(rgba(0, 255, 255, 0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 255, 255, 0.02) 1px, transparent 1px);
  background-size: 30px 30px;
}

.glowOrb {
  position: absolute;
  width: 500px;
  height: 500px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(0, 255, 255, 0.08) 0%, transparent 70%);
  filter: blur(60px);
}

.glowOrbPurple {
  composes: glowOrb;
  background: radial-gradient(circle, rgba(139, 92, 246, 0.08) 0%, transparent 70%);
}

.glowOrbPink {
  composes: glowOrb;
  background: radial-gradient(circle, rgba(255, 0, 255, 0.08) 0%, transparent 70%);
}
```

---

### 2.2 按钮组件

#### 2.2.1 按钮变体

| 变体 | 用途 | 样式 |
|------|------|------|
| `primary` | 主要操作 | 渐变 + 霓虹发光 |
| `secondary` | 次要操作 | 透明 + 边框 |
| `ghost` | 辅助操作 | 无边框 + 悬停效果 |
| `danger` | 危险操作 | 红色渐变 |

#### 2.2.2 组件实现

```tsx
// components/ui/Button.tsx
import styles from './Button.module.css';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const variantClass = styles[variant];
  const sizeClass = styles[size];
  
  return (
    <button
      className={cn(styles.button, variantClass, sizeClass, className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className={styles.spinner} />
      ) : icon ? (
        <span className={styles.icon}>{icon}</span>
      ) : null}
      {children}
    </button>
  );
}
```

#### 2.2.3 按钮样式

```css
/* styles/components/Button.module.css */

.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-weight: 600;
  border-radius: 12px;
  cursor: pointer;
  transition: all var(--duration-normal) var(--ease-out-expo);
  border: none;
  outline: none;
}

/* 尺寸 */
.sm {
  padding: 8px 16px;
  font-size: 14px;
}

.md {
  padding: 12px 24px;
  font-size: 16px;
}

.lg {
  padding: 16px 32px;
  font-size: 18px;
}

/* Primary - 渐变 + 发光 */
.primary {
  background: linear-gradient(135deg, var(--color-primary) 0%, #00d4ff 100%);
  color: #000;
  box-shadow: 0 0 20px rgba(0, 255, 255, 0.3);
}

.primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 0 30px rgba(0, 255, 255, 0.5);
}

.primary:active:not(:disabled) {
  transform: translateY(0);
}

/* Secondary - 透明 + 边框 */
.secondary {
  background: transparent;
  color: var(--color-primary);
  border: 1px solid var(--color-border);
}

.secondary:hover:not(:disabled) {
  background: var(--color-primary-muted);
  border-color: var(--color-primary);
}

/* Ghost - 无边框 */
.ghost {
  background: transparent;
  color: var(--color-text-secondary);
}

.ghost:hover:not(:disabled) {
  color: var(--color-primary);
  background: var(--color-primary-muted);
}

/* Danger - 红色 */
.danger {
  background: linear-gradient(135deg, #ff4466 0%, #ff6644 100%);
  color: #fff;
  box-shadow: 0 0 20px rgba(255, 68, 102, 0.3);
}

.danger:hover:not(:disabled) {
  box-shadow: 0 0 30px rgba(255, 68, 102, 0.5);
}

/* 禁用状态 */
.button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 加载动画 */
.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

---

### 2.3 卡片组件

#### 2.3.1 卡片变体

| 变体 | 用途 | 样式 |
|------|------|------|
| `default` | 一般内容 | 玻璃态 |
| `interactive` | 可交互 | 悬停发光边框 |
| `elevated` | 强调内容 | 更强阴影 |

#### 2.3.2 组件实现

```tsx
// components/ui/Card.tsx
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'interactive' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({
  variant = 'default',
  padding = 'md',
  children,
  className,
  ...props
}: CardProps) {
  return (
    <div 
      className={cn(
        styles.card, 
        styles[variant],
        styles[`padding-${padding}`],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
```

#### 2.3.3 卡片样式

```css
/* styles/components/Card.module.css */

.card {
  background: var(--color-bg-glass);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  transition: all var(--duration-normal) var(--ease-out-expo);
}

/* 可交互卡片 */
.interactive:hover {
  border-color: var(--color-primary);
  box-shadow: 0 8px 32px rgba(0, 255, 255, 0.15);
  transform: translateY(-2px);
}

/* 强调卡片 */
.elevated {
  background: var(--color-bg-secondary);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
}

/* 内边距 */
.padding-none { padding: 0; }
.padding-sm { padding: 12px; }
.padding-md { padding: 24px; }
.padding-lg { padding: 32px; }
```

---

### 2.4 输入框组件

#### 2.4.1 组件实现

```tsx
// components/ui/Input.tsx
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export function Input({
  label,
  error,
  icon,
  className,
  ...props
}: InputProps) {
  return (
    <div className={styles.inputWrapper}>
      {label && <label className={styles.label}>{label}</label>}
      <div className={cn(styles.inputContainer, error && styles.hasError)}>
        {icon && <span className={styles.icon}>{icon}</span>}
        <input 
          className={cn(styles.input, className)}
          {...props}
        />
      </div>
      {error && <span className={styles.error}>{error}</span>}
    </div>
  );
}
```

#### 2.4.2 输入框样式

```css
/* styles/components/Input.module.css */

.inputWrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.label {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-secondary);
}

.inputContainer {
  position: relative;
  display: flex;
  align-items: center;
}

.input {
  width: 100%;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 12px 16px;
  color: var(--color-text-primary);
  font-size: 16px;
  transition: all var(--duration-fast) var(--ease-out-expo);
}

.input::placeholder {
  color: var(--color-text-muted);
}

.input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 
    0 0 0 3px rgba(0, 255, 255, 0.1),
    0 0 20px rgba(0, 255, 255, 0.1);
}

.hasError .input {
  border-color: var(--color-error);
}

.hasError .input:focus {
  box-shadow: 
    0 0 0 3px rgba(255, 68, 102, 0.1),
    0 0 20px rgba(255, 68, 102, 0.1);
}

.error {
  font-size: 12px;
  color: var(--color-error);
}

.icon {
  position: absolute;
  left: 12px;
  color: var(--color-text-muted);
}

.icon + .input {
  padding-left: 40px;
}
```

---

### 2.5 导航组件

#### 2.5.1 顶部导航

```tsx
// components/ui/Navbar.tsx
interface NavbarProps {
  logo?: React.ReactNode;
  links?: Array<{ label: string; href: string; active?: boolean }>;
  actions?: React.ReactNode;
}

export function Navbar({ logo, links, actions }: NavbarProps) {
  return (
    <nav className={styles.navbar}>
      <div className={styles.navbarContent}>
        {logo}
        <div className={styles.links}>
          {links?.map(link => (
            <a 
              key={link.href}
              href={link.href}
              className={cn(styles.link, link.active && styles.active)}
            >
              {link.label}
            </a>
          ))}
        </div>
        <div className={styles.actions}>{actions}</div>
      </div>
    </nav>
  );
}
```

```css
/* styles/components/Navbar.module.css */

.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 64px;
  background: var(--color-bg-glass);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--color-border);
  z-index: var(--z-sticky);
}

.navbarContent {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  max-width: var(--container-xl);
  margin: 0 auto;
  padding: 0 var(--space-6);
}

.links {
  display: flex;
  gap: var(--space-6);
}

.link {
  color: var(--color-text-secondary);
  font-weight: 500;
  position: relative;
  padding: 8px 0;
  transition: color var(--duration-normal) var(--ease-out-expo);
}

.link:hover,
.link.active {
  color: var(--color-primary);
}

.link.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--color-primary);
  box-shadow: 0 0 10px var(--color-primary-glow);
}

.actions {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}
```

---

### 2.6 侧边栏组件

```tsx
// components/ui/Sidebar.tsx
interface SidebarProps {
  items: Array<{
    icon: React.ReactNode;
    label: string;
    href: string;
    active?: boolean;
  }>;
  footer?: React.ReactNode;
}

export function Sidebar({ items, footer }: SidebarProps) {
  return (
    <aside className={styles.sidebar}>
      <nav className={styles.nav}>
        {items.map(item => (
          <a
            key={item.href}
            href={item.href}
            className={cn(styles.item, item.active && styles.active)}
          >
            <span className={styles.icon}>{item.icon}</span>
            <span className={styles.label}>{item.label}</span>
          </a>
        ))}
      </nav>
      {footer && <div className={styles.footer}>{footer}</div>}
    </aside>
  );
}
```

```css
/* styles/components/Sidebar.module.css */

.sidebar {
  position: fixed;
  top: 64px;
  left: 0;
  bottom: 0;
  width: 240px;
  background: var(--color-bg-secondary);
  border-right: 1px solid var(--color-border);
  padding: var(--space-4);
  overflow-y: auto;
}

.nav {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  color: var(--color-text-secondary);
  border-radius: var(--radius-md);
  transition: all var(--duration-normal) var(--ease-out-expo);
}

.item:hover {
  background: var(--color-primary-muted);
  color: var(--color-primary);
}

.item.active {
  background: var(--color-primary-muted);
  color: var(--color-primary);
  border: 1px solid var(--color-primary);
}

.icon {
  font-size: 18px;
}

.label {
  font-weight: 500;
}

.footer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: var(--space-4);
  border-top: 1px solid var(--color-border);
}
```

---

## 3. 组件导出

### 3.1 统一导出入口

```typescript
// components/ui/index.ts
export { BackgroundEffect } from './BackgroundEffect';
export { Button } from './Button';
export { Card } from './Card';
export { Input } from './Input';
export { Navbar } from './Navbar';
export { Sidebar } from './Sidebar';
```

---

## 4. 主题切换支持

### 4.1 CSS 变量主题

```css
/* 亮色主题 */
[data-theme="light"] {
  --color-bg-primary: #f8f9fa;
  --color-bg-secondary: #ffffff;
  --color-text-primary: #1a1a2e;
  --color-text-secondary: #4a4a5e;
}

/* 深色主题 (默认) */
[data-theme="dark"] {
  --color-bg-primary: #0a0a0f;
  --color-bg-secondary: #12121a;
  --color-text-primary: #f0f0f5;
  --color-text-secondary: #a0a0b0;
}
```

### 4.2 主题切换 Hook

```typescript
// hooks/useTheme.ts
import { useState, useEffect } from 'react';

type Theme = 'light' | 'dark';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>('dark');
  
  useEffect(() => {
    const stored = localStorage.getItem('theme') as Theme;
    if (stored) setTheme(stored);
  }, []);
  
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);
  
  return { theme, setTheme };
}
```

---

## 5. 响应式断点

### 5.1 断点定义

```css
/* 响应式断点 - 与 Tailwind 一致 */
@media (max-width: 640px) {
  /* sm: 手机 */
}

@media (max-width: 768px) {
  /* md: 平板 */
}

@media (max-width: 1024px) {
  /* lg: 小笔记本 */
}

@media (max-width: 1280px) {
  /* xl: 桌面 */
}
```

### 5.2 响应式工具类

```css
/* 响应式显示/隐藏 */
.mobileOnly { display: block; }
.tabletAndUp { display: none; }

@media (min-width: 768px) {
  .mobileOnly { display: none; }
  .tabletAndUp { display: block; }
}
```

---

## 6. 动画系统

### 6.1 预设动画

```css
/* 淡入 */
.animateFadeIn {
  animation: fadeIn var(--duration-normal) var(--ease-out-expo) forwards;
}

/* 上浮 */
.animateSlideUp {
  animation: slideUp var(--duration-normal) var(--ease-out-expo) forwards;
}

/* 发光脉冲 */
.animateGlow {
  animation: glowPulse 2s ease-in-out infinite;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

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

@keyframes glowPulse {
  0%, 100% { box-shadow: 0 0 20px var(--glow-primary); }
  50% { box-shadow: 0 0 40px var(--glow-strong); }
}
```

---

## 7. 文件结构

```
vibex-fronted/src/
├── styles/
│   ├── design-tokens.css      # 设计变量
│   ├── animations.css         # 动画定义
│   └── components/            # 组件样式
│       ├── background.module.css
│       ├── Button.module.css
│       ├── Card.module.css
│       ├── Input.module.css
│       ├── Navbar.module.css
│       └── Sidebar.module.css
├── components/
│   └── ui/
│       ├── index.ts          # 统一导出
│       ├── BackgroundEffect.tsx
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── Input.tsx
│       ├── Navbar.tsx
│       └── Sidebar.tsx
├── hooks/
│   └── useTheme.ts           # 主题切换
└── app/
    └── (页面使用组件)
```

---

## 8. 实施建议

### Phase 1: 基础组件 (P0)

- [ ] BackgroundEffect 背景组件
- [ ] Button 按钮组件
- [ ] Card 卡片组件

### Phase 2: 表单组件 (P0)

- [ ] Input 输入框组件
- [ ] Textarea (扩展)
- [ ] Select (扩展)

### Phase 3: 布局组件 (P1)

- [ ] Navbar 导航栏
- [ ] Sidebar 侧边栏

### Phase 4: 高级功能 (P2)

- [ ] 主题切换
- [ ] 响应式适配
- [ ] 动画增强

---

## 9. 验收检查清单

| 组件 | 验收项 | 状态 |
|------|--------|------|
| BackgroundEffect | 网格叠加层 + 发光球 | ⬜ |
| Button | 4种变体 + 3种尺寸 + 加载状态 | ⬜ |
| Card | 3种变体 + 悬停效果 | ⬜ |
| Input | 标签 + 图标 + 错误提示 | ⬜ |
| Navbar | 固定顶部 + 玻璃态 | ⬜ |
| Sidebar | 固定左侧 + 激活状态 | ⬜ |
| 主题切换 | 亮/暗主题支持 | ⬜ |
| 响应式 | 移动端适配 | ⬜ |

---

*文档版本: 1.0*  
*创建时间: 2026-03-04*  
*作者: Architect Agent*