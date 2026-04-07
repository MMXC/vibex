# PRD: Vibex 首页 UI/UX 优化

## 1. 概述

### 1.1 项目背景

Vibex 首页当前存在以下核心问题：
- **视觉噪音过度**：赛博朋克配色过饱和、多层背景特效喧宾夺主
- **内容可读性差**：侧边栏信息过载、三栏布局主次不分
- **可访问性不达标**：颜色对比度不足、缺少键盘导航
- **基础体验缺失**：无空状态、无骨架屏、加载态简陋

### 1.2 项目目标

1. 建立统一的设计系统（配色、图标、间距）
2. 提升 WCAG AA 可访问性（Lighthouse Accessibility ≥ 90）
3. 完善空状态、加载态、错误态
4. 优化布局层级和信息架构

### 1.3 成功指标

| 指标 | 当前值 | 目标值 |
|------|--------|--------|
| Lighthouse Accessibility | ~60 | ≥ 90 |
| 颜色对比度（文字/背景） | 部分 <3:1 | 全部 ≥4.5:1 |
| 视觉噪音层级 | 3层叠加 | ≤1层 |
| 空状态覆盖率 | 0% | 100%（核心场景） |
| npm test | — | 100% 通过 |
| npm run build | — | 成功 |

---

## 2. Epic 拆分

---

### Epic 1: 设计系统重构

**目标**：建立统一、可复用、符合 WCAG AA 的设计系统基础

#### Story 1.1: 建立 design-tokens.css
**页面集成**：全局（需在 `layout.tsx` 或 `globals.css` 中 import）

| 验收标准 | 断言写法 |
|----------|----------|
| 主色为 `#3b82f6` 或 `#00d4ff`（饱和度降低） | `expect(getComputedStyle(el).getPropertyValue('--color-primary')).toMatch(/#[0-9a-f]{6}/i)` |
| 辅助色 ≤ 3 个（非霓虹粉/绿） | `expect(辅助色列表.length).toBeLessThanOrEqual(3)` |
| 圆角统一为 6px / 12px 两档 | `expect(getComputedStyle(el).getPropertyValue('--radius-sm')).toBe('6px')` |
| 字体层级定义 Display/H1-H3/Body/Caption | `expect(CSS变量包含--font-display).toBe(true)` |
| 间距基准为 4px 网格 | `expect(间距变量全部 % 4 === 0).toBe(true)` |

**DoD**：
- [ ] `design-tokens.css` 文件存在且包含完整 token
- [ ] 主色变量 `--color-primary` 可被全局访问
- [ ] 所有 token 可通过 CSS 变量覆盖（支持主题切换）
- [ ] 验证命令：`test -f /root/.openclaw/vibex/vibex-fronted/src/styles/design-tokens.css`

---

#### Story 1.2: 替换 emoji 图标为 Lucide Icons
**页面集成**：`Sidebar.tsx`、【需页面集成】`Navbar.tsx`、`StatCard`、`BottomPanel`

| 验收标准 | 断言写法 |
|----------|----------|
| Sidebar 导航图标替换为 Lucide（线性风格） | `expect(screen.queryByRole('img', { name: /home/i })).toBeInTheDocument()` |
| Navbar 中 emoji 替换完成 | `expect(container.querySelectorAll('[class*="sidebar"] [role="img"]').length).toBeGreaterThan(0)` |
| 图标 stroke-width 统一（默认 1.5 或 2） | `expect(所有Lucide图标strokeWidth一致).toBe(true)` |
| 功能按钮有 aria-label | `expect(所有图标按钮有aria-label).toBe(true)` |

**DoD**：
- [ ] `lucide-react` 已安装
- [ ] Sidebar 中所有 emoji 替换为 Lucide 组件
- [ ] 每个图标按钮有 `aria-label` 属性
- [ ] 验证命令：`grep -r 'lucide' /root/.openclaw/vibex/vibex-fronted/src/components/`

---

#### Story 1.3: 建立空状态组件（EmptyState）
**页面集成**：`Dashboard.tsx`、【需页面集成】`ProjectList`、`FileList`

| 验收标准 | 断言写法 |
|----------|----------|
| 项目列表为空时显示空状态插画/文字 | `expect(screen.getByText(/暂无项目/i)).toBeInTheDocument()` |
| 空状态组件支持 title/description/action prop | `expect(typeof EmptyState).toBe('function')` |
| 空状态有友好的操作引导（创建项目入口） | `expect(screen.getByRole('button', { name: /创建/i })).toBeInTheDocument()` |
| 空状态样式与新设计系统一致 | `expect(getComputedStyle(emptyStateEl).backgroundColor).toBe(expected)` |

**DoD**：
- [ ] `EmptyState` 组件存在且可复用
- [ ] `Dashboard.tsx` 在项目列表为空时渲染 `EmptyState`
- [ ] 组件 props 类型定义完整
- [ ] 验证命令：`test -f /root/.openclaw/vibex/vibex-fronted/src/components/ui/EmptyState.tsx`

---

#### Story 1.4: 建立骨架屏组件（SkeletonLoader）
**页面集成**：`Dashboard.tsx`、【需页面集成】`ProjectList`、`HomePage`

| 验收标准 | 断言写法 |
|----------|----------|
| 数据加载时显示骨架屏而非 `加载中...` 文字 | `expect(screen.queryByText('加载中...')).not.toBeInTheDocument()` |
| 骨架屏动画使用渐变闪烁（无连续旋转动画） | `expect(hasShimmerAnimation).toBe(true)` |
| 骨架屏支持多种形状（rect/circle/text） | `expect(SkeletonLoader支持多种形状).toBe(true)` |
| 支持 `prefers-reduced-motion` 降级为静态色块 | `@media (prefers-reduced-motion: reduce) { 静态色块 }` |

**DoD**：
- [ ] `SkeletonLoader` 组件存在且可复用
- [ ] Dashboard 加载态替换为骨架屏
- [ ] 满足 `prefers-reduced-motion` 无障碍要求
- [ ] 验证命令：`test -f /root/.openclaw/vibex/vibex-fronted/src/components/ui/SkeletonLoader.tsx`

---

### Epic 2: 首页视觉优化

**目标**：去除视觉噪音，优化布局层级，提升内容可读性

#### Story 2.1: 移除背景特效噪音
**页面集成**：`globals.css`、`dashboard.module.css`

| 验收标准 | 断言写法 |
|----------|----------|
| 移除 `glowOrb` 光晕装饰层 | `expect(document.querySelector('.glowOrb')).toBeNull()` |
| 移除 `gridOverlay` 网格叠加层 | `expect(document.querySelector('.gridOverlay')).toBeNull()` |
| 背景层叠减少到 ≤ 2 层（底色 + 1层装饰） | `expect(背景层叠数量).toBeLessThanOrEqual(2)` |
| 卡片不再使用光晕背景（cardGlow 移除） | `expect(card.querySelector('.cardGlow')).toBeNull()` |

**DoD**：
- [ ] `globals.css` 中移除 `glowOrb` 和 `gridOverlay` 相关样式
- [ ] `dashboard.module.css` 中移除 `cardGlow`
- [ ] 背景视觉效果显著简化（无霓虹光晕）
- [ ] 验证命令：`grep -r 'glowOrb\|gridOverlay\|cardGlow' /root/.openclaw/vibex/vibex-fronted/src/` 应无结果

---

#### Story 2.2: 优化配色系统
**页面集成**：全局

| 验收标准 | 断言写法 |
|----------|----------|
| 标题不再统一使用彩虹渐变（`page-title` 类重定义） | `expect(getComputedStyle(titleEl).background).not.toContain('linear-gradient')` |
| 主色调饱和度降低（更沉稳的蓝 `#3b82f6` 或低饱和 `#00d4ff`） | `expect(主色饱和度).toBeLessThan(80)` |
| 去掉霓虹粉 `#ff00ff` 和霓虹绿 `#00ff88` | `expect(不再包含霓虹色).toBe(true)` |
| 暗色背景纯度提升（`#0f0f14` 或 `#0a0a0f`） | `expect(getComputedStyle(body).backgroundColor).toMatch(/rgb\(1[0-5],\s*1[0-5],\s*2[0-4]\)/)` |

**DoD**：
- [ ] 彩虹渐变标题样式移除或替换为纯色
- [ ] 配色系统精简（主色 + ≤2 辅助色 + 中性色）
- [ ] 新配色通过 Lighthouse Accessibility ≥ 90
- [ ] 验证命令：`grep -r 'linear-gradient.*rainbow\|#ff00ff\|#00ff88' /root/.openclaw/vibex/vibex-fronted/src/` 应无结果

---

#### Story 2.3: 优化侧边栏布局
**页面集成**：`Sidebar.tsx`、【需页面集成】`Sidebar.module.css`

| 验收标准 | 断言写法 |
|----------|----------|
| 11 个导航项分组显示（≥ 2 组） | `expect(sidebarGroups.length).toBeGreaterThanOrEqual(2)` |
| 组与组之间有视觉分隔（分割线或间距） | `expect(有组间分隔).toBe(true)` |
| 导航项 hover/focus 状态清晰 | `expect(getComputedStyle(navItem, ':hover').background).toBeDefined()` |
| 图标与文字对齐（垂直居中） | `expect(图标与文字垂直对齐).toBe(true)` |

**DoD**：
- [ ] Sidebar 导航项分组（建议：主导航 / 工具 / 设置）
- [ ] 每组有视觉层级区分
- [ ] 焦点状态样式正确（`:focus-visible`）
- [ ] 验证命令：`test -f /root/.openclaw/vibex/vibex-fronted/src/components/layout/Sidebar.tsx`

---

#### Story 2.4: 优化首页三栏布局
**页面集成**：`HomePage.tsx`、`HomePage.module.css`

| 验收标准 | 断言写法 |
|----------|----------|
| 左侧栏（StepNavigator）≤ 220px | `expect(getComputedStyle(leftPane).width).toMatch(/^(220px|≤220px)$/)` |
| 右侧面板（AIPanel）≤ 260px | `expect(getComputedStyle(rightPane).width).toMatch(/^(260px|≤260px)$/)` |
| 底部面板高度合理（≤ 380px 或可折叠） | `expect(getComputedStyle(bottomPanel).height).toMatch(/^(≤380px|auto|折叠中)$/)` |
| 中心预览区域有明确视觉焦点（最亮/最大） | `expect(中心区域视觉权重最高).toBe(true)` |

**DoD**：
- [ ] 三个区域的宽度/高度有明确约束
- [ ] 底部面板支持折叠（减少干扰）
- [ ] 布局响应式（移动端隐藏次要面板）
- [ ] 验证命令：`grep -c 'width.*220px\|width.*260px' /root/.openclaw/vibex/vibex-fronted/src/components/home/HomePage.module.css` ≥ 2

---

### Epic 3: 可访问性修复

**目标**：达到 WCAG AA 标准，支持键盘导航和屏幕阅读器

#### Story 3.1: 修复颜色对比度
**页面集成**：全局

| 验收标准 | 断言写法 |
|----------|----------|
| 所有正文文字对比度 ≥ 4.5:1 | `expect(getContrastRatio(textColor, bgColor)).toBeGreaterThanOrEqual(4.5)` |
| 所有大文字（≥18px bold 或 ≥24px）对比度 ≥ 3:1 | `expect(getContrastRatio(largeTextColor, bgColor)).toBeGreaterThanOrEqual(3)` |
| `#00ffff` on `#0a0a0f` 对比度提升（改色或改背景） | `expect(不安全的对比度组合已修复).toBe(true)` |
| Lighthouse Accessibility ≥ 90 | `expect(lighthouseAccessibilityScore).toBeGreaterThanOrEqual(90)` |

**DoD**：
- [ ] 所有文字/背景颜色对比度通过 WCAG AA
- [ ] Lighthouse Accessibility ≥ 90
- [ ] 颜色使用工具验证（如 Chrome DevTools Contrast Checker）
- [ ] 验证命令：`npm run lighthouse -- --only-categories=accessibility` ≥ 90

---

#### Story 3.2: 统一焦点状态样式
**页面集成**：全局

| 验收标准 | 断言写法 |
|----------|----------|
| 所有交互元素（button/input/link）有 `:focus-visible` 样式 | `expect(getComputedStyle(btn, ':focus-visible').outline).toBeDefined()` |
| 焦点环颜色与背景对比度 ≥ 3:1 | `expect(焦点环对比度).toBeGreaterThanOrEqual(3)` |
| 焦点环不占用布局空间（outline-offset 合理） | `expect(不遮挡内容).toBe(true)` |

**DoD**：
- [ ] `globals.css` 中 `:focus-visible` 规则完整覆盖
- [ ] 所有交互元素可见焦点状态
- [ ] 无需手动 Tab 调试，自动化测试可验证
- [ ] 验证命令：`grep -r 'focus-visible' /root/.openclaw/vibex/vibex-fronted/src/` 结果非空

---

#### Story 3.3: 无障碍增强
**页面集成**：全局（重点：`Sidebar.tsx`、`DropdownMenu`、`BottomPanel`）

| 验收标准 | 断言写法 |
|----------|----------|
| 所有图标按钮有 `aria-label` | `expect(所有图标按钮aria-label存在).toBe(true)` |
| 下拉菜单支持键盘操作（↑↓ Enter Escape） | `expect(keyboardNavigable).toBe(true)` |
| 模态框有 `role="dialog"` 和 `aria-labelledby` | `expect(dialog有role和aria-labelledby).toBe(true)` |
| `prefers-reduced-motion` 媒体查询存在 | `@media (prefers-reduced-motion: reduce)` |

**DoD**：
- [ ] 所有 emoji 图标替换为带 `aria-label` 的 Lucide 组件
- [ ] DropdownMenu 支持键盘导航
- [ ] BottomPanel 模态框属性完整
- [ ] 动画通过 `prefers-reduced-motion` 降级测试
- [ ] 验证命令：`grep -r 'aria-label\|role="dialog"' /root/.openclaw/vibex/vibex-fronted/src/` 结果非空

---

### Epic 4: 性能优化

**目标**：降低渲染成本，提升低端设备体验

#### Story 4.1: 粒子背景降级
**页面集成**：`ParticleBackground.tsx`

| 验收标准 | 断言写法 |
|----------|----------|
| `prefers-reduced-motion` 时禁用粒子动画 | `expect(hasReducedMotionFallback).toBe(true)` |
| 粒子数量可配置（支持关闭） | `expect(particleCount可配置).toBe(true)` |
| 移动端默认禁用粒子效果 | `expect(mobileDefaultDisabled).toBe(true)` |
| `requestAnimationFrame` 在页面不可见时暂停 | `expect(页面不可见时暂停).toBe(true)` |

**DoD**：
- [ ] `ParticleBackground` 支持 `prefers-reduced-motion` 降级
- [ ] 使用 `visibilitychange` 或 `document.hidden` 暂停动画
- [ ] 降级方案：静态背景或纯色
- [ ] 验证命令：`grep -r 'prefers-reduced-motion' /root/.openclaw/vibex/vibex-fronted/src/components/` 结果非空

---

### Epic 5: 体验完善

**目标**：修复体验断点和细节问题

#### Story 5.1: 修复 Step 标题重复
**页面集成**：`StepNavigator.tsx`、`PreviewHeader.tsx`

| 验收标准 | 断言写法 |
|----------|----------|
| StepNavigator 和 PreviewHeader 不同时显示相同步骤标题 | `expect(标题重复数).toBe(0)` |
| 步骤切换时标题正确更新 | `expect(切换后标题同步).toBe(true)` |

**DoD**：
- [ ] 确认标题显示逻辑（仅在一处显示）
- [ ] 集成测试验证标题唯一性
- [ ] 验证命令：`grep -r 'StepNavigator\|PreviewHeader' /root/.openclaw/vibex/vibex-fronted/src/` 无冲突

---

#### Story 5.2: 优化登录抽屉
**页面集成**：`LoginDrawer.tsx`

| 验收标准 | 断言写法 |
|----------|----------|
| LoginDrawer 样式与整体设计系统统一 | `expect(loginDrawer样式一致).toBe(true)` |
| 抽屉动画流畅（与全局动画系统一致） | `expect(动画时长与design-tokens一致).toBe(true)` |
| 关闭按钮可键盘聚焦 | `expect(closeBtn可Tab聚焦).toBe(true)` |

**DoD**：
- [ ] LoginDrawer 接入 design-tokens.css
- [ ] 动画时长使用 CSS 变量
- [ ] 可访问性检查通过
- [ ] 验证命令：`test -f /root/.openclaw/vibex/vibex-fronted/src/components/auth/LoginDrawer.tsx`

---

#### Story 5.3: 优化拖拽交互
**页面集成**：`Dashboard.tsx`（拖拽排序）、【需页面集成】回收站

| 验收标准 | 断言写法 |
|----------|----------|
| 拖拽时视觉反馈明确（拖拽手柄高亮） | `expect(dragHandleHighlighted).toBe(true)` |
| 拖拽到回收站时视觉反馈（颜色/图标变化） | `expect(trashDropZoneVisuallyActivated).toBe(true)` |
| 拖拽有适当的视觉引导线 | `expect(hasDropIndicator).toBe(true)` |

**DoD**：
- [ ] 拖拽状态有明确的视觉反馈
- [ ] 回收站激活时有颜色/图标变化
- [ ] 验证命令：`grep -r 'dragging\|dragover' /root/.openclaw/vibex/vibex-fronted/src/` 结果非空

---

## 3. 功能优先级矩阵

| 优先级 | 功能 | 所属 Epic | 原因 |
|--------|------|-----------|------|
| P0 | 颜色对比度修复（WCAG AA） | Epic 3 | 合规要求 |
| P0 | 设计系统 tokens | Epic 1 | 所有功能依赖 |
| P0 | 空状态组件 | Epic 1 | 用户体验基础 |
| P0 | 移除视觉噪音（glowOrb/gridOverlay） | Epic 2 | 立即可见，破坏性最低 |
| P1 | 替换 emoji → Lucide + aria-label | Epic 1/3 | 可访问性 + 视觉统一 |
| P1 | 侧边栏分组 | Epic 2 | P0 用户体验问题 |
| P1 | 焦点状态统一 | Epic 3 | 可访问性 |
| P1 | 骨架屏组件 | Epic 1 | 加载体验基础 |
| P1 | 粒子背景降级 | Epic 4 | 性能优化 |
| P2 | 标题重复修复 | Epic 5 | 细节优化 |
| P2 | 登录抽屉优化 | Epic 5 | 体验完善 |
| P2 | 拖拽交互优化 | Epic 5 | 细节优化 |
| P2 | 首页三栏布局优化 | Epic 2 | 布局调整 |

---

## 4. 验收标准总览

| ID | 验收标准 | 所属 Story | 优先级 |
|----|----------|------------|--------|
| AC1.1 | 主色使用 `#3b82f6` 或低饱和 `#00d4ff` | 1.1 | P0 |
| AC1.2 | 所有 emoji 图标替换为 Lucide | 1.2 | P1 |
| AC1.3 | 项目列表为空时显示 EmptyState | 1.3 | P0 |
| AC1.4 | 加载时显示骨架屏而非"加载中..." | 1.4 | P1 |
| AC2.1 | `glowOrb` / `gridOverlay` / `cardGlow` 完全移除 | 2.1 | P0 |
| AC2.2 | 彩虹渐变标题移除或替换 | 2.2 | P0 |
| AC2.3 | 侧边栏导航分组（≥ 2 组） | 2.3 | P1 |
| AC3.1 | Lighthouse Accessibility ≥ 90 | 3.1 | P0 |
| AC3.2 | 所有文字对比度 ≥ 4.5:1 | 3.1 | P0 |
| AC3.3 | `:focus-visible` 全局覆盖 | 3.2 | P1 |
| AC3.4 | 所有图标按钮有 aria-label | 3.3 | P1 |
| AC3.5 | `prefers-reduced-motion` 支持 | 3.3/4.1 | P1 |
| AC4.1 | 粒子背景支持降级 | 4.1 | P1 |
| AC5.1 | Step 标题不重复 | 5.1 | P2 |
| AC5.2 | LoginDrawer 样式统一 | 5.2 | P2 |
| AC5.3 | 拖拽有视觉引导 | 5.3 | P2 |
| AC-BUILD | `npm run build` 成功 | 全局 | P0 |
| AC-TEST | `npm test` 全部通过 | 全局 | P0 |

---

## 5. 出 scope

- 首页功能逻辑修改（仅改 UI/UX，不改业务逻辑）
- 后端 API 修改
- 主题切换功能（ThemeWrapper 相关）
- 首页外的其他页面优化
- 深色模式/浅色模式切换（仅优化现有暗色主题）

---

## 6. 实施约束

1. **渐进式迁移**：优先修改 `design-tokens.css`，其他组件逐步接入
2. **不破坏现有功能**：所有修改必须 `npm test` 通过
3. **向后兼容**：CSS 变量支持主题覆盖，不硬编码颜色
4. **移动端优先考虑**：响应式布局基础支持

---

*PRD 版本：1.0*
*创建时间：2026-03-22*
*负责人：PM*
