# VibeX Design System

> **文档位置**: `/root/.openclaw/vibex/DESIGN.md`
> **最后更新**: 2026-03-28
> **维护责任人**: Coord Agent
> **同步更新**: 每次重大 UI 变更后 24h 内更新本文档

---

## 1. Product Context

| 字段 | 内容 |
|------|------|
| **产品名称** | VibeX |
| **产品类型** | Web App（AI 驱动 DDD 产品建模平台） |
| **目标用户** | 产品经理、开发者、架构师 |
| **核心价值** | 通过对话式需求分析，AI 生成领域模型 + 可视化流程 + 原型页面 |
| **产品哲学** | 画布是主操作区，一切围绕画布展开。对话 + 可视化展示编辑是**手段**，能顺利走完流程才是**重点** |
| **在线地址** | <https://vibex-app.pages.dev> |
| **API 地址** | <https://api.vibex.top> |

---

## 2. Design Aesthetic

### 2.1 方向定位

| 属性 | 值 | 说明 |
|------|----|------|
| **主风格** | Cyberpunk / 未来感 | 玻璃态 + 霓虹发光 + 深色背景 |
| **装饰级别** | Intentional | 纹理和光效是风格载体，但不是杂乱装饰 |
| **情感调性** | 专业冷静、略带科技感 | 不是游戏化卡通，而是工具型产品的精准感 |
| **参考产品** | Linear、Vercel Dashboard、Raycast |

### 2.2 设计三原则

1. **玻璃态（Glassmorphism）** — `backdrop-filter: blur()` 实现毛玻璃效果，层叠感强
2. **霓虹发光（Neon Glow）** — 青色 (#00ffff) 主色调，配合发光阴影，营造科技氛围
3. **深色沉浸（Dark Immersion）** — 深色背景 (#0a0a0f) 配合网格叠加层，减少干扰

---

## 3. Color System

### 3.1 调色板

```css
:root {
  /* ========== 主色调 ========== */
  --color-primary: #00ffff;          /* 赛博青 */
  --color-primary-hover: #00e5e5;
  --color-primary-muted: rgba(0, 255, 255, 0.15);
  --color-primary-glow: rgba(0, 255, 255, 0.5);

  /* ========== 辅助色 ========== */
  --color-accent: #8b5cf6;           /* 蓝紫 */
  --color-accent-hover: #7c3aed;
  --color-accent-muted: rgba(139, 92, 246, 0.15);
  --color-accent-glow: rgba(139, 92, 246, 0.5);

  /* ========== 强调色 ========== */
  --color-pink: #ff00ff;
  --color-pink-glow: rgba(255, 0, 255, 0.5);
  --color-green: #00ff88;
  --color-green-glow: rgba(0, 255, 136, 0.5);

  /* ========== 背景色 ========== */
  --color-bg-primary: #0a0a0f;       /* 最深背景 */
  --color-bg-secondary: #12121a;     /* 卡片/面板背景 */
  --color-bg-tertiary: #1a1a24;      /* 悬停/高亮背景 */
  --color-bg-elevated: #22222e;     /* 弹出层背景 */
  --color-bg-glass: rgba(18, 18, 26, 0.7);  /* 玻璃态 */

  /* ========== 文字色 ========== */
  --color-text-primary: #f0f0f5;      /* 主文字 */
  --color-text-secondary: #a0a0b0;   /* 次要文字 */
  --color-text-muted: #606070;      /* 禁用/提示文字 */
  --color-text-inverse: #0a0a0f;

  /* ========== 边框色 ========== */
  --color-border: rgba(255, 255, 255, 0.08);
  --color-border-hover: rgba(255, 255, 255, 0.15);
  --color-border-focus: var(--color-primary);

  /* ========== 状态色 ========== */
  --color-success: #00ff88;
  --color-warning: #ffaa00;
  --color-error: #ff4466;
  --color-info: #00aaff;

  /* ========== 渐变 ========== */
  --gradient-primary: linear-gradient(135deg, #00ffff 0%, #8b5cf6 50%, #ff00ff 100%);
  --gradient-bg: linear-gradient(180deg, #0a0a0f 0%, #12121a 50%, #1a1a24 100%);
  --gradient-card: linear-gradient(145deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0) 100%);
  --gradient-glow: radial-gradient(ellipse at center, rgba(0, 255, 255, 0.15) 0%, transparent 70%);
}
```

### 3.2 语义颜色

| 用途 | 色值 | 使用场景 |
|------|------|---------|
| **成功** | `--color-success: #00ff88` | 成功提示、确认操作、完成状态 |
| **警告** | `--color-warning: #ffaa00` | 警告提示、待处理状态 |
| **错误** | `--color-error: #ff4466` | 错误提示、删除操作、失败状态 |
| **信息** | `--color-info: #00aaff` | 信息提示、链接、引导操作 |

### 3.3 深色模式策略

VibeX **仅支持深色模式**（`data-theme='dark'`），不做浅色主题重设计。深色模式优点：
- 与赛博朋克美学天然契合
- 减少眼睛疲劳，适合长时间使用工具
- 降低屏幕功耗

---

## 4. Typography

### 4.1 字体栈

| 用途 | 字体 | 回退 |
|------|------|------|
| **正文/UI** | Geist Sans（Next.js 内置） | `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto` |
| **代码/数据** | Geist Mono（Next.js 内置） | `'SF Mono', SFMono-Regular, Consolas` |

> ⚠️ **注意**: `design-tokens.css` 中原始定义使用 Inter，但我们已迁移到 Geist（Next.js App Router 内置）。以 package.json 和 layout.tsx 中的实际配置为准。

### 4.2 字号系统

```css
:root {
  --text-xs:   0.75rem;   /* 12px — 辅助文字、标签 */
  --text-sm:   0.875rem;  /* 14px — 次要内容、按钮 */
  --text-base: 1rem;      /* 16px — 正文 */
  --text-lg:   1.125rem;  /* 18px — 副标题 */
  --text-xl:   1.25rem;   /* 20px — 页面标题 */
  --text-2xl:  1.5rem;    /* 24px — 大标题 */
  --text-3xl:  1.875rem;  /* 30px — Hero 标题 */
  --text-4xl:  2.25rem;   /* 36px */
  --text-5xl:  3rem;      /* 48px */
}
```

### 4.3 字重与行高

```css
:root {
  --font-light:    300;
  --font-normal:   400;
  --font-medium:    500;
  --font-semibold:  600;
  --font-bold:      700;

  --leading-tight:   1.25;    /* 标题 */
  --leading-normal:  1.5;     /* 正文 */
  --leading-relaxed: 1.75;    /* 长文本 */
}
```

---

## 5. Spacing System

```css
:root {
  --space-0:  0;
  --space-1:  0.25rem;   /* 4px  */
  --space-2:  0.5rem;    /* 8px  */
  --space-3:  0.75rem;   /* 12px */
  --space-4:  1rem;      /* 16px */
  --space-5:  1.25rem;   /* 20px */
  --space-6:  1.5rem;    /* 24px */
  --space-8:  2rem;      /* 32px */
  --space-10: 2.5rem;    /* 40px */
  --space-12: 3rem;      /* 48px */
  --space-16: 4rem;      /* 64px */
  --space-20: 5rem;      /* 80px */
}

/* 语义别名（Story 1.2 spec 对齐）*/
:root {
  --spacing-xs:  4px;
  --spacing-sm:  8px;
  --spacing-md:  16px;
  --spacing-lg:  24px;
  --spacing-xl:  32px;
  --spacing-2xl: 48px;
}
```

---

## 6. Layout & Structure

### 6.1 容器宽度

```css
:root {
  --container-sm:  640px;
  --container-md:  768px;
  --container-lg:  1024px;
  --container-xl:  1280px;
  --container-2xl: 1536px;
}
```

### 6.2 网格系统

- **侧边栏**: 固定宽度 `240px`，玻璃态背景
- **主内容区**: `flex-1`，最大宽度 `1280px`
- **卡片网格**: CSS Grid，`gap: var(--space-6)`

### 6.3 页面结构

| 页面 | 布局特点 |
|------|---------|
| **Dashboard** (`/dashboard`) | 侧边栏 + 主内容区，背景有网格叠加 + 发光球 |
| **Canvas** (`/project`) | 全屏画布，侧边工具栏，背景同 Dashboard |
| **Auth** (`/auth`) | 居中卡片，玻璃态登录框 |
| **Homepage** (`/`) | Hero 区 + 流程引导，首屏即产品核心价值 |

---

## 7. Border Radius

```css
:root {
  --radius-none: 0;
  --radius-sm:   0.25rem;  /* 4px  */
  --radius-md:   0.5rem;   /* 8px  */
  --radius-lg:   0.75rem;  /* 12px */
  --radius-xl:   1rem;     /* 16px */
  --radius-2xl:  1.5rem;  /* 24px */
  --radius-full: 9999px;   /* 全圆角（胶囊按钮） */
}
```

---

## 8. Shadow & Glow System

### 8.1 霓虹发光效果

```css
:root {
  --shadow-glow-cyan:   0 0 20px rgba(0, 255, 255, 0.3), 0 0 40px rgba(0, 255, 255, 0.1);
  --shadow-glow-purple: 0 0 20px rgba(139, 92, 246, 0.3), 0 0 40px rgba(139, 92, 246, 0.1);
  --shadow-glow-pink:   0 0 20px rgba(255, 0, 255, 0.3), 0 0 40px rgba(255, 0, 255, 0.1);
  --shadow-glow-green:  0 0 20px rgba(0, 255, 136, 0.3), 0 0 40px rgba(0, 255, 136, 0.1);
}
```

### 8.2 卡片阴影

```css
:root {
  --shadow-sm:   0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow-md:   0 4px 6px rgba(0, 0, 0, 0.4);
  --shadow-lg:   0 10px 15px rgba(0, 0, 0, 0.5);
  --shadow-xl:   0 20px 25px rgba(0, 0, 0, 0.6);
  --shadow-glass: 0 8px 32px rgba(0, 0, 0, 0.4);
}
```

---

## 9. Motion & Animation

### 9.1 缓动曲线

```css
:root {
  --ease-out-expo:  cubic-bezier(0.16, 1, 0.3, 1);   /* 主进入动画 */
  --ease-out-quart: cubic-bezier(0.25, 1, 0.5, 1);   /* 悬停效果 */
  --ease-in-out:    cubic-bezier(0.4, 0, 0.2, 1);    /* 状态切换 */
  --ease-spring:    cubic-bezier(0.34, 1.56, 0.64, 1); /* 弹性动效 */
}
```

### 9.2 动画时长

```css
:root {
  --duration-instant: 0ms;
  --duration-fast:   100ms;   /* 微交互 */
  --duration-normal: 200ms;   /* 常规过渡 */
  --duration-slow:   300ms;   /* 页面切换 */
  --duration-slower: 500ms;
  --duration-slowest: 800ms;  /* 入场动画 */
}
```

### 9.3 动画策略

- **Intentional** — 有意义的入场动画，不为动画而动画
- **Entrance**: `opacity 0→1` + `translateY 8px→0`，`200ms ease-out`
- **Hover**: `scale(1.02)` + 边框发光增强，`150ms ease-out-quart`
- **Page transition**: 淡出旧页面 + 淡入新页面，`300ms`

---

## 10. Z-Index Scale

```css
:root {
  --z-base:       0;
  --z-dropdown:   100;
  --z-sticky:    200;
  --z-modal:      300;
  --z-popover:    400;
  --z-tooltip:    500;
  --z-toast:      600;
}
```

---

## 11. Component Patterns

### 11.1 玻璃态卡片

```css
.glass {
  background: var(--color-bg-glass);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--color-border);
}

.glass-hover:hover {
  background: rgba(18, 18, 26, 0.85);
  border-color: var(--color-border-hover);
}
```

### 11.2 按钮样式

| 类型 | 样式 |
|------|------|
| **Primary** | 渐变背景 (`--gradient-primary`) + 霓虹发光 |
| **Secondary** | 透明背景 + 边框 (`--color-border`) |
| **Ghost** | 无背景 + 无边框，hover 时显示背景 |
| **Danger** | `--color-error` 背景或边框 |

### 11.3 输入框样式

```css
input, textarea, select {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-primary);
  padding: var(--space-2) var(--space-3);
  transition: border-color var(--duration-normal) var(--ease-out-expo);
}

input:focus, textarea:focus, select:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-primary-muted);
}
```

---

## 12. CSS Architecture

```
src/styles/
├── design-tokens.css       # 设计变量（颜色/字体/间距/阴影/动效）
├── theme-variables.css     # ThemeContext 动态变量
├── animations.css         # 动画定义
├── utilities.css          # 工具类（渐变/发光/玻璃态）
├── tokens.ts             # TypeScript 常量导出
├── icons.ts              # SVG 图标
├── responsive.tsx         # 响应式断点 Hook
└── ThemeProvider.tsx      # 主题 Provider
```

> 📁 **详细架构**: 参考 `docs/css-architecture.md`

---

## 13. Known Issues & Technical Debt

| 优先级 | 问题 | 状态 | 备注 |
|--------|------|------|------|
| 🔴 高 | Auth 页面风格未统一（仍用内联样式和浅色背景） | 待修复 | 见 `style-gap-analysis.md` |
| 🟡 中 | Homepage 部分页面主色调从绿色改青色未完成 | 待修复 | 见 `style-gap-analysis.md` |
| 🟡 中 | 首页新手指引弹窗已移除 (2026-03-27) | 已完成 | 代码已推送，待部署 |

---

## 14. Decisions Log

| 日期 | 决策 | 理由 | 影响 |
|------|------|------|------|
| 2026-03-04 | 统一风格：玻璃态 + 霓虹发光 | 建立 Vibex 品牌识别度 | 全站 UI 重构 |
| 2026-03-04 | 深色模式为主，不做浅色主题 | 与赛博朋克美学契合 + 降低眼睛疲劳 | 排除浅色模式 |
| 2026-03-05 | CSS Variables + CSS Modules 架构 | 主题切换支持 + 组件样式隔离 | 迁移内联样式到 CSS Modules |
| 2026-03-05 | 字体从 Inter 迁移到 Geist | Next.js App Router 内置，性能更优 | 移除 Inter 依赖 |
| 2026-03-27 | 移除新手指引弹窗 | 减少首次使用摩擦 | onboarding 代码清理 |

---

## 15. Maintenance Guide

### 15.1 更新触发条件

以下情况需更新 DESIGN.md：
- 新增/修改设计变量（颜色/间距/字体）
- 新增组件类型或交互模式
- 重大页面重构
- 设计方向调整

### 15.2 更新责任人

| 角色 | 职责 |
|------|------|
| **Dev** | 实现新 UI 时同步更新 DESIGN.md |
| **Reviewer** | 代码审查时检查是否符合 DESIGN.md |
| **Coord** | 定期巡检 DESIGN.md 与实际代码的一致性 |

### 15.3 验证方式

```bash
# 检查是否有内联样式未迁移
grep -rn "style={{" /root/.openclaw/vibex/vibex-fronted/src/app/ --include="*.tsx" | grep -v "node_modules" | head -20

# 检查设计变量使用率
grep -rn "var(--color" /root/.openclaw/vibex/vibex-fronted/src/ --include="*.tsx" --include="*.css" | wc -l
```
