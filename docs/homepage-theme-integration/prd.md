# PRD: 首页主题集成

**项目**: homepage-theme-integration  
**版本**: 1.0  
**日期**: 2026-03-22  
**状态**: Draft  

---

## 一、项目背景

### 1.1 目标

将已实现的 `ThemeWrapper` 组件集成到 `HomePage`，并提供主题切换 UI，让用户可以手动切换亮/暗主题。

### 1.2 问题陈述

`ThemeWrapper` 组件（Epic3 产出）已完整实现，包含 `ThemeContext`、`useTheme` hook 和 `homepageAPI` 数据获取能力。但 `HomePage` 未导入和使用 `ThemeWrapper`，导致：
- 用户打开首页时主题始终为 `system`（默认值）
- 页面无主题切换按钮，用户无法手动切换

### 1.3 预期收益

- 用户首次访问可自动应用主题（localStorage > API > system）
- 用户可手动切换亮/暗主题并立即看到效果
- 主题偏好跨页面刷新保持

---

## 二、Epic 拆分

### Epic 1: ThemeWrapper 集成

**目标**: 在 `HomePage` 外层包裹 `ThemeWrapper`，使首页获得主题能力

| Story ID | 描述 | 优先级 |
|----------|------|--------|
| S1.1 | 在 `HomePage.tsx` 中导入 `ThemeWrapper` | P0 |
| S1.2 | 将 `ThemeWrapper` 包裹在 `HomePage` 布局外层 | P0 |
| S1.3 | 确保 ThemeWrapper 的 `className` 透传给 DOM，不破坏现有布局 | P1 |

### Epic 2: 主题切换 UI

**目标**: 在 Navbar/Header 提供主题切换按钮，用户可手动切换主题

| Story ID | 描述 | 优先级 |
|----------|------|--------|
| S2.1 | 创建 `ThemeToggle` 组件（使用 `useTheme` hook） | P0 |
| S2.2 | 将 `ThemeToggle` 按钮集成到 Navbar/Header | P0 |
| S2.3 | 按钮图标根据当前主题显示 🌙（暗色）或 ☀️（亮色） | P1 |
| S2.4 | 按钮 hover/active 状态样式优化 | P2 |

### Epic 3: 主题持久化与初始化

**目标**: 主题偏好保存到 localStorage，刷新页面后保持

| Story ID | 描述 | 优先级 |
|----------|------|--------|
| S3.1 | 主题切换后同步写入 `localStorage.setItem('theme', mode)` | P0 |
| S3.2 | 页面加载时从 `localStorage` 恢复主题（优先于 system 默认值） | P0 |
| S3.3 | 修复 `theme-binding.test.tsx` 中 12 个失败的测试 | P0 |

---

## 三、功能需求表

### 功能点总表

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | ThemeWrapper 导入 | `HomePage.tsx` 导入 `ThemeWrapper` 组件 | `expect(HomePageContent).toContain('ThemeWrapper')` 或 `grep "ThemeWrapper" HomePage.tsx` 返回非空 | 【需页面集成】 |
| F1.2 | ThemeWrapper 包裹 | `HomePage` 内容被 `<ThemeWrapper>` 包裹 | `expect(screen.getByTestId('homepage-layout')).toBeInDOM()` 且父元素为 ThemeWrapper | 【需页面集成】 |
| F1.3 | className 透传 | ThemeWrapper 透传 `className`，不改变现有布局 | 现有 `homepage-layout` class 仍作用于同一 DOM 元素，视觉回归测试通过 | 【需页面集成】 |
| F2.1 | ThemeToggle 组件 | 创建 `ThemeToggle` 组件，导出并可在其他文件导入 | `expect(ThemeToggle).toBeDefined()` 且渲染一个 `<button>` | ❌ |
| F2.2 | useTheme hook 集成 | `ThemeToggle` 使用 `useTheme()` 获取 `resolvedMode` 和 `setMode` | `expect(useTheme).toHaveBeenCalled()` 或组件能正确渲染 | ❌ |
| F2.3 | 主题切换逻辑 | 点击按钮切换 `resolvedMode`（dark → light → dark） | `expect(setMode).toHaveBeenCalledWith('light')` 当 resolvedMode 为 dark 时触发 | ❌ |
| F2.4 | 按钮图标显示 | 按钮图标根据 `resolvedMode` 显示：暗色=☀️，亮色=🌙 | `expect(container).toHaveTextContent('☀️')` 当 resolvedMode 为 dark | ❌ |
| F2.5 | 按钮集成到 Navbar | `ThemeToggle` 按钮渲染在 Navbar 工具按钮区域 | `expect(navbar).toContainElement(screen.getByTitle(/主题/))` | 【需页面集成】 |
| F2.6 | 按钮 title 属性 | 按钮包含描述性 title，如"当前: dark" / "当前: light" | `expect(btn).toHaveAttribute('title', /当前: (dark\|light)/)` | ❌ |
| F3.1 | localStorage 写入 | 主题切换时同步写入 `localStorage.setItem('vibex-theme', mode)` | `expect(localStorage.setItem).toHaveBeenCalledWith('vibex-theme', expect.any(String))` | ❌ |
| F3.2 | localStorage 读取初始化 | 页面加载时从 `localStorage.getItem('vibex-theme')` 恢复主题 | `expect(mode).toBe(localStorage.getItem('vibex-theme'))` | ❌ |
| F3.3 | 测试 mock 泄漏修复 | jest.setup.ts 添加默认 fetch mock，修复 12 个失败的 theme-binding 测试 | `npx jest src/components/__tests__/theme-binding.test.tsx --no-coverage` 全部通过（23/23） | ❌ |

---

## 四、验收标准汇总

### P0（阻塞发布，必须完成）

| ID | 验收标准 | 验证方式 |
|----|----------|----------|
| P0-1 | `HomePage.tsx` 中导入并使用 `ThemeWrapper` 包裹内容 | `grep "ThemeWrapper" HomePage.tsx` 返回非空 |
| P0-2 | Navbar/Header 区域可见主题切换按钮 | 手动测试或 `screen.getByTitle(/主题/)` |
| P0-3 | 点击切换按钮后主题立即变化（切换 dark ↔ light） | E2E 测试或手动验证 |
| P0-4 | 刷新页面后主题保持（localStorage 持久化生效） | `localStorage.getItem('vibex-theme')` 返回非 null |
| P0-5 | `theme-binding.test.tsx` 全部 23 个测试通过 | `npx jest theme-binding.test.tsx --no-coverage` |

### P1（本迭代必做）

| ID | 验收标准 | 验证方式 |
|----|----------|----------|
| P1-1 | 按钮图标正确显示（暗色显示 ☀️，亮色显示 🌙） | 手动测试两种主题状态 |
| P1-2 | 按钮 title 属性显示当前主题模式 | `expect(btn).toHaveAttribute('title', /当前:/)` |
| P1-3 | ThemeWrapper className 透传，现有布局不受影响 | 视觉回归测试或手动遍历各模块 |
| P1-4 | 主题切换动画流畅，无闪烁（FOUC） | 手动体验，切换时间 < 200ms |

### P2（可延后）

| ID | 验收标准 |
|----|----------|
| P2-1 | 按钮 hover/active 状态有视觉反馈 |
| P2-2 | 支持键盘操作（Tab 导航 + Enter 触发） |

---

## 五、非功能需求

### 5.1 性能

| 指标 | 要求 | 说明 |
|------|------|------|
| 主题切换响应时间 | ≤ 100ms | 从点击到视觉变化 |
| 初始主题加载 | ≤ 500ms | ThemeWrapper 初始化时间 |
| Lighthouse 性能评分 | 不下降 | 相比集成前保持或改善 |

### 5.2 兼容性

| 项目 | 要求 |
|------|------|
| 浏览器支持 | Chrome/Firefox/Safari/Edge 最新两个版本 |
| SSR 兼容 | Next.js `use client` directive 标记 ThemeWrapper |
| 无障碍 (a11y) | 按钮可键盘访问，aria-label 正确 |

### 5.3 代码质量

| 项目 | 要求 |
|------|------|
| 测试覆盖率 | ThemeToggle 组件单元测试覆盖 ≥ 80% |
| ESLint | 无新增 error 级别警告 |
| TypeScript | 无新增类型错误 |

---

## 六、技术方案

### 6.1 实施步骤

**Step 1: 集成 ThemeWrapper（0.5h）**
- 修改 `HomePage.tsx`，导入并包裹 `ThemeWrapper`
- 透传 `className` 给内部容器

**Step 2: 创建 ThemeToggle 组件（0.5h）**
- 新建 `src/components/ThemeToggle/ThemeToggle.tsx`
- 使用 `useTheme()` hook 实现切换逻辑

**Step 3: 集成到 Navbar（0.5h）**
- 在 Navbar 工具按钮区域添加 `<ThemeToggle />`
- 确认按钮可见且可交互

**Step 4: 实现 localStorage 持久化（0.5h）**
- 扩展 `ThemeContext` 或 `ThemeWrapper`，在切换时写入 localStorage
- 初始化时优先读取 localStorage

**Step 5: 修复测试（0.5h）**
- 在 `jest.setup.ts` 添加默认 fetch mock
- 运行 `theme-binding.test.tsx` 验证全部通过

### 6.2 文件变更清单

| 文件 | 变更类型 | 说明 |
|------|---------|------|
| `src/app/page.tsx` (HomePage) | 修改 | 导入并包裹 ThemeWrapper |
| `src/components/ThemeToggle/` | 新增 | ThemeToggle 组件 |
| `src/components/Navbar/` | 修改 | 集成 ThemeToggle |
| `src/contexts/ThemeContext.tsx` | 修改 | 添加 localStorage 持久化 |
| `jest.setup.ts` | 修改 | 添加默认 fetch mock |
| `src/components/__tests__/theme-binding.test.tsx` | 修复 | 验证 23/23 测试通过 |

---

## 七、约束与边界

### 7.1 包含

- `ThemeWrapper` 到 `HomePage` 的集成
- 主题切换 UI 按钮
- 主题偏好 localStorage 持久化
- theme-binding 测试修复

### 7.2 不包含

- 全局根布局级别的 ThemeWrapper（方案 B，后续迭代）
- 主题偏好 API 同步（已有 homepageAPI，后续迭代）
- 深色/浅色主题视觉样式定义（已有，仅集成行为）

### 7.3 红线约束

- **不破坏现有 HomePage 布局**：`ThemeWrapper` 必须透传 `className`，不引入额外 DOM 层级影响布局
- **不引入新的依赖**：仅使用已有组件和 React Hooks
- **不改变 API 接口**：`homepageAPI` 和 `ThemeContext` 对外接口不变

---

## 八、成功指标

- [ ] P0 验收标准 100% 通过
- [ ] 主题切换按钮在 Navbar 可见且功能正常
- [ ] 刷新页面主题保持不变
- [ ] `theme-binding.test.tsx` 23/23 全部通过
- [ ] 现有布局无视觉回归

---

*编写人: PM Agent | 2026-03-22*
