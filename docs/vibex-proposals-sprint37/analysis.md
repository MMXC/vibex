# 提案模板

**Agent**: analyst
**日期**: 2026-05-16
**项目**: vibex-proposals-sprint37
**仓库**: /root/.openclaw/vibex
**分析视角**: 从 VibeX Sprint 36 交付完成后的产品视角，识别下一批高优先级功能增强

---

## 1. 提案列表

| ID | 类别 | 标题 | 影响范围 | 优先级 |
|----|------|------|----------|--------|
| P001 | improvement | 全局键盘快捷键系统 | 所有 DDS 画布用户 | P0 |
| P002 | improvement | Canvas 导出增强（PDF + 图片格式） | 所有导出用户 | P0 |
| P003 | bug | Error Boundary 错误恢复机制 | 所有用户 | P1 |
| P004 | improvement | User Preferences 持久化系统 | 所有用户 | P1 |
| P005 | improvement | Design Token 主题系统 | 品牌定制用户 | P2 |

---

## 2. 提案详情

### P001: 全局键盘快捷键系统

**问题描述**:

当前 VibeX 缺少统一的键盘快捷键系统。用户每次操作都需要使用鼠标，效率低。特别是高频操作（撤销/重做、新建节点、切换 Tab、生成代码）在 DDSCanvasPage 中完全依赖点击，缺乏快捷键。

**影响范围**:

- 所有使用 DDSCanvasPage 的用户
- 严重影响高频用户的产品体验
- S36-E4 已实现撤销重做 Toolbar 按钮，但快捷键缺失

**验收标准**:

- [ ] `Ctrl+Z` 触发 undo（与 S4.1 DDSToolbar Undo 按钮行为一致）
- [ ] `Ctrl+Shift+Z` / `Ctrl+Y` 触发 redo
- [ ] `Ctrl+N` 新建节点（当前画布的默认节点类型）
- [ ] `Ctrl+G` 触发代码生成（与 Generate 按钮行为一致）
- [ ] `Tab` / `Shift+Tab` 切换 Tab
- [ ] `Escape` 取消选择
- [ ] 快捷键在 DDSCanvasPage 全局生效（focus trap 正确处理）
- [ ] Help overlay（`?` 键）显示所有快捷键列表

---

### P002: Canvas 导出增强（PDF + 图片格式）

**问题描述**:

S14-E2 实现了 .vibex（JSON）和 JSON 导出，S14-E15-P003 实现了 BPMN 导出。缺失：PDF 文档导出（便于分享给非技术人员）和图片格式（PNG/SVG）导出（便于粘贴到文档/演示文稿）。

**影响范围**:

- 所有需要将设计分享给外部用户的场景
- 产品演示和销售材料准备

**验收标准**:

- [ ] `/api/export/pdf` 端点生成 PDF（含 Canvas 元数据 + 各 Chapter 内容）
- [ ] PNG 导出（使用 html2canvas 或 svg-to-png 方案）
- [ ] SVG 导出（直接序列化 Canvas DOM）
- [ ] 导出按钮在 DDSToolbar 中（E4 已添加按钮位置，可复用）
- [ ] 导出 Loading 状态和错误提示

---

### P003: Error Boundary 错误恢复机制

**问题描述**:

当前 VibeX 缺少 React Error Boundary。Canvas 中的任意组件抛错都会导致整个页面崩溃（白屏）。S36-E1 的 Firebase mock 模式已覆盖部分降级场景，但通用 JS 错误没有处理。

**影响范围**:

- 所有用户，遇到 JS 错误时从白屏恢复
- S36-E5 的 Design Review 降级路径已证明降级 UI 的价值

**验收标准**:

- [ ] `DDSCanvasPage` 外层包裹 Error Boundary
- [ ] 错误时显示友好 UI（不是白屏），含错误信息 + 重试按钮 + 报告按钮
- [ ] 错误不影响其他正常 Tab（如 Dashboard）
- [ ] 错误日志上报（console.error + 可选的上报端点）

---

### P004: User Preferences 持久化系统

**问题描述**:

当前用户偏好（主题、默认模板、语言偏好、快捷键自定义）没有持久化。每次打开都是默认状态。S14-E4 Analytics Dashboard 的 range 偏好也没有持久化，用户每次需要重新选择。

**影响范围**:

- 所有希望个性化设置的用户
- 长期使用 VibeX 的高频用户

**验收标准**:

- [ ] `userPreferencesStore` (Zustand + localStorage persistence)
- [ ] 偏好项：theme (light/dark/system)、defaultTemplate、shortcutCustomization
- [ ] Settings Page（`/settings`）UI，支持偏好管理
- [ ] 偏好随 Canvas 一起保存到 localStorage

---

### P005: Design Token 主题系统

**问题描述**:

当前 VibeX 使用硬编码颜色值（`design-tokens.css` 中的变量）。用户无法自定义品牌颜色。S36 前的设计系统（DESIGN.md）定义了 tokens，但缺乏主题切换能力。

**影响范围**:

- 品牌定制需求的用户（企业场景）
- 多品牌场景（用同一工具服务多个客户）

**验收标准**:

- [ ] CSS Variable 动态注入机制
- [ ] 预设主题：VibeX Default、Dark Mode、企业品牌 A/B
- [ ] ThemeProvider 在 Next.js App Router 正确嵌套
- [ ] 主题切换无白屏（CSS 变量覆盖，非页面刷新）

---

## 3. 相关文件

- 设计文档: `docs/vibex-proposals-sprint37/architecture.md`
- 实施计划: `docs/vibex-proposals-sprint37/IMPLEMENTATION_PLAN.md`

---

## 根因分析

### P001: 全局键盘快捷键系统

**根因**: VibeX 的交互设计以鼠标操作为主，未考虑键盘交互场景。S36-E4 的撤销重做 Toolbar 按钮实现了 UI，但没有同步实现键盘快捷键，导致高频操作仍需鼠标。

**证据**:
- `DDSToolbar.tsx` 的 Undo/Redo 按钮无对应键盘快捷键
- `vibex-fronted/src/hooks/` 下无 `useKeyboardShortcuts` 或类似 hook
- 用户反馈（LEARNINGS.md）多次提到"效率低"

### P002: Canvas 导出增强

**根因**: S14 的导出实现覆盖了机器可读格式（JSON/BPMN），但未覆盖人类可读格式（PDF/图片）。Share 场景需要人类可读格式。

**证据**:
- `useCanvasExport` 只有 `exportAsJSON` 和 `exportAsVibex`
- 无 PDF 端点（`/api/export/pdf` 不存在）
- 无 PNG/SVG 导出相关代码

### P003: Error Boundary

**根因**: Next.js 15 的 App Router 错误处理需要显式配置 Error Boundary。VibeX 未配置，导致组件错误直接暴露给用户。

**证据**:
- `vibex-fronted/src/app/` 下无 `error.tsx` 文件
- S36-E5 的 `design-review-degradation.spec.ts` 证明降级 UI 有效

---

## 建议方案

### P001: 全局键盘快捷键系统

**方案 A（推荐）**:
- 描述：在 `DDSCanvasPage` 中实现 `useKeyboardShortcuts` 自定义 Hook，监听 `keydown` 事件，对常用操作映射快捷键。Help overlay 使用 `useState` 控制显示/隐藏。
- 实施成本：中（~2d）
- 风险：低（不修改任何现有功能）
- 回滚计划：删除 Hook，所有操作回退到鼠标

### P002: Canvas 导出增强

**方案 A（推荐）**:
- 描述：使用 `@react-pdf/renderer` 生成 PDF（SSR 安全）；`html2canvas` + `canvas.toBlob` 生成 PNG；SVG 直接序列化 React DOM。Backend `/api/export/pdf` 用 Cloudflare Workers 实现。
- 实施成本：中（~3d）
- 风险：中（html2canvas SSR 问题需注意）
- 回滚计划：回退导出按钮到仅支持 JSON/Vibex

### P003: Error Boundary

**方案 A（推荐）**:
- 描述：在 `DDSCanvasPage` 和 `DashboardPage` 外层包裹 React Error Boundary 组件。使用 `componentDidCatch` 生命周期或 `getDerivedStateFromError` 状态机模式。
- 实施成本：低（~1d）
- 风险：低
- 回滚计划：删除 Error Boundary 组件

---

## 执行依赖

### P001: 全局键盘快捷键系统
- [ ] 需要修改的文件: `vibex-fronted/src/pages/DDSCanvasPage.tsx`, `vibex-fronted/src/hooks/useKeyboardShortcuts.ts`
- [ ] 前置依赖: 无（S36-E4 的 Undo/Redo 按钮已实现）
- [ ] 需要权限: 无
- [ ] 预计工时: 2-3d
- [ ] 测试验证命令: `pnpm exec vitest run src/hooks/__tests__/useKeyboardShortcuts.test.ts`

### P002: Canvas 导出增强
- [ ] 需要修改的文件: `vibex-fronted/src/hooks/useCanvasExport.ts`, `vibex-backend/src/api/export/pdf.ts`, `vibex-fronted/src/components/dds/toolbar/DDSToolbar.tsx`
- [ ] 前置依赖: 无（S14-E2 的导出基础设施已存在）
- [ ] 需要权限: 无
- [ ] 预计工时: 3-4d
- [ ] 测试验证命令: `pnpm exec vitest run src/hooks/__tests__/useCanvasExport.test.ts`

### P003: Error Boundary
- [ ] 需要修改的文件: `vibex-fronted/src/app/dds/[projectId]/page.tsx`, `vibex-fronted/src/components/shared/ErrorBoundary.tsx`
- [ ] 前置依赖: 无
- [ ] 需要权限: 无
- [ ] 预计工时: 1d
- [ ] 测试验证命令: E2E 测试覆盖错误场景

### P004: User Preferences 持久化系统
- [ ] 需要修改的文件: `vibex-fronted/src/stores/userPreferencesStore.ts`, `vibex-fronted/src/app/settings/page.tsx`
- [ ] 前置依赖: 无
- [ ] 需要权限: 无
- [ ] 预计工时: 2d
- [ ] 测试验证命令: `pnpm exec vitest run src/stores/__tests__/userPreferencesStore.test.ts`

### P005: Design Token 主题系统
- [ ] 需要修改的文件: `vibex-fronted/src/styles/design-tokens.css`, `vibex-fronted/src/components/providers/ThemeProvider.tsx`
- [ ] 前置依赖: 无
- [ ] 需要权限: 无
- [ ] 预计工时: 2-3d
- [ ] 测试验证命令: 视觉回归测试（主题切换截图对比）
