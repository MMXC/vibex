# Vibex 首页 UI/UX 分析 & 优化提案 Phase 1

## 一、当前设计问题分析

### 1.1 视觉设计问题（UI Issues）

| # | 问题 | 位置 | 严重度 |
|---|------|------|--------|
| U1 | **配色过度赛博朋克** - `00ffff`、`ff00ff`、`8b5cf6`、`00ff88` 四色混用，颜色饱和度过高，缺乏视觉焦点 | 全站 | P0 |
| U2 | **视觉噪音过多** - 网格背景叠加光晕球、霓虹发光叠加玻璃态，背景元素喧宾夺主 | `globals.css`, `dashboard.module.css` | P1 |
| U3 | **emoji 图标体系** - 使用 `◈ ⊞ 🤖 📊 🎨 ◫ ↗ 📝 🔀 📄 📋 👤 ⚙` 等 emoji，风格不统一 | `Sidebar.tsx`, `Navbar.tsx`, `StatCard` | P1 |
| U4 | **卡片过度装饰** - `cardGlow`、`glowOrb` 等光晕装饰层，让内容可读性下降 | `dashboard.module.css` | P1 |
| U5 | **渐变文字滥用** - 标题统一使用彩虹渐变，缺乏品牌记忆点 | `page-title` 类 | P1 |
| U6 | **滚动条不统一** - 全局滚动条样式与暗色主题融合差 | `globals.css` | P2 |

### 1.2 用户体验问题（UX Issues）

| # | 问题 | 位置 | 严重度 |
|---|------|------|--------|
| X1 | **侧边栏信息过载** - 11 个导航项混杂在一起，缺少分组和视觉层级 | `Sidebar.tsx` | P0 |
| X2 | **首页布局复杂** - 三栏布局（左侧 StepNavigator 220px + 中央预览 + 右侧 AIPanel 260px）+ 底部面板 380px，用户难以理解主次 | `HomePage.tsx` | P0 |
| X3 | **缺少空状态设计** - 项目列表为空时无友好提示 | `Dashboard.tsx` | P1 |
| X4 | **登录抽屉体验断崖** - 未登录时弹 LoginDrawer，但设计风格与整体不统一 | `LoginDrawer.tsx` | P1 |
| X5 | **Step 标题重复** - `StepNavigator` 显示步骤编号和文字，`PreviewHeader` 又显示一次相同内容 | `StepNavigator.tsx`, `PreviewHeader.tsx` | P1 |
| X6 | **缺少加载状态细化** - 全局 `加载中...` 文字简陋，无骨架屏 | Dashboard loading | P1 |
| X7 | **拖拽交互无视觉引导** - 拖拽到回收站时视觉反馈不清晰 | Dashboard trash | P2 |

### 1.3 可访问性问题（Accessibility Issues）

| # | 问题 | 严重度 |
|---|------|--------|
| A1 | **颜色对比度不足** - `#00ffff` on `#0a0a0f` 对比度约 4.5:1（接近 AA 临界），`#a0a0b0` on `#0a0a0f` 仅 3:1 | P0 |
| A2 | **焦点状态不明确** - `focus-visible` 仅定义了 outline，但很多组件未正确实现 | 全站 | P0 |
| A3 | **图标无替代文本** - emoji 图标作为功能按钮时无 aria-label | `Sidebar.tsx`, `StatCard` | P1 |
| A4 | **无键盘导航支持** - 下拉菜单、模态框等缺少 Tab 顺序和键盘操作 | `DropdownMenu`, `BottomPanel` | P1 |
| A5 | **动画无减少动效选项** - `prefers-reduced-motion` 未处理，影响前庭功能障碍用户 | 全站 | P2 |

### 1.4 性能问题（Performance Issues）

| # | 问题 | 严重度 |
|---|------|--------|
| P1 | **粒子背景动态渲染** - `ParticleBackground` 持续运行 requestAnimationFrame，对低端设备造成性能负担 | `ParticleBackground.tsx` | P1 |
| P2 | **背景特效层叠** - grid overlay + glow orb + radial-gradient body background 三层叠加，渲染成本高 | `dashboard.module.css` | P1 |

---

## 二、Phase 1 优化目标

基于 `ui-ux-pro-max` 技能指导，Phase 1 聚焦于 **立即可见、风险低、影响大** 的核心问题：

### 目标 1：建立视觉秩序
- 简化配色系统，建立品牌色彩规范（保留主色，减少辅助色）
- 去掉视觉噪音装饰（glow orbs、光晕层）
- 统一图标系统（替换 emoji 为 Lucide/Feather Icons）

### 目标 2：提升内容可读性
- 优化文字对比度，确保 WCAG AA（≥4.5:1）
- 改善排版层级（标题、正文、说明文字层级清晰）
- 优化间距系统，减少视觉拥挤

### 目标 3：完善基础体验
- 设计空状态、加载状态、错误状态
- 修复 Step 标题重复问题
- 改进侧边栏导航分组

---

## 三、实施计划

### Phase 1A：设计系统重构（Analysis → Design）📋

**任务**: `vibex-homepage-ux-redesign/phase1-design-system`

- [ ] **D1**: 建立新的 design-tokens.css
  - 配色系统：主色保留 `#00d4ff`（青蓝），辅助色精简为 2 个，去掉霓虹粉/绿
  - 间距系统：整理 4px 基准网格
  - 圆角系统：统一为 6px / 12px 两档
  - 字体层级：定义 Display / H1-H3 / Body / Caption 四级
- [ ] **D2**: 设计空状态组件（EmptyState）
- [ ] **D3**: 设计骨架屏组件（SkeletonLoader）
- [ ] **D4**: 制定图标替换方案（Lucide Icons）
- [ ] **D5**: 编写 UI 组件规范文档

### Phase 1B：首页视觉优化（Implementation）

**任务**: `vibex-homepage-ux-redesign/phase1-implementation`

- [ ] **I1**: 重构 `design-tokens.css` 并迁移
- [ ] **I2**: 移除背景特效噪音（glowOrb、gridOverlay）
- [ ] **I3**: 替换所有 emoji 图标为 Lucide
- [ ] **I4**: 优化 Dashboard 布局和组件样式
- [ ] **I5**: 优化 Homepage 布局（侧边栏 + 中心区域 + 右侧面板）
- [ ] **I6**: 修复 Step 标题重复问题
- [ ] **I7**: 添加空状态和骨架屏
- [ ] **I8**: 添加 `prefers-reduced-motion` 支持

### Phase 1C：可访问性修复

**任务**: `vibex-homepage-ux-redesign/phase1-a11y`

- [ ] **A1**: 修复颜色对比度（文字色/背景色）
- [ ] **A2**: 统一焦点状态样式（focus-visible）
- [ ] **A3**: 为所有图标按钮添加 aria-label
- [ ] **A4**: 添加键盘导航支持（侧边栏、模态框）
- [ ] **A5**: 性能优化：粒子背景增加 `prefers-reduced-motion` 降级

---

## 四、验收标准

- [ ] Lighthouse Accessibility ≥ 90
- [ ] 所有文本对比度 ≥ 4.5:1（WCAG AA）
- [ ] 键盘可完整操作核心流程
- [ ] 空状态、加载态、错误态全覆盖
- [ ] `npm test` 全部通过
- [ ] `npm run build` 成功

---

## 五、预计工作量

| 阶段 | 任务 | 预计工时 |
|------|------|---------|
| Phase 1A | 设计系统重构 | 3h |
| Phase 1B | 视觉优化实现 | 6h |
| Phase 1C | 可访问性修复 | 3h |
| 测试 + Review | 测试 + 验收 | 2h |
| **合计** | | **14h** |

---

## 六、设计方向参考

基于 `ui-ux-pro-max` 技能指导，建议采用 **"Clean Dark Professional"** 风格：

- **主色调**：从 `#00ffff` → `#3b82f6`（更沉稳的蓝），或保留青蓝但降低饱和度
- **背景**：纯深色 `#0f0f14`，去掉渐变和光晕装饰
- **卡片**：薄边框 + 轻微阴影，不使用背景渐变
- **图标**：统一使用 Lucide Icons（线性风格，stroke-width 统一）
- **排版**：增加字间距，提升可读性

> 避免陷入"越多越好看"的误区：**功能 > 美观 > 装饰**，每个视觉元素都要有存在的理由。
