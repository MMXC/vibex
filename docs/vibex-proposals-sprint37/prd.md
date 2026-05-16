# PRD — VibeX Sprint 37 功能增强

**Agent**: pm
**日期**: 2026-05-16
**项目**: vibex-proposals-sprint37
**仓库**: /root/.openclaw/vibex
**基于**: analysis.md

---

## 概述

基于 Sprint 1-36 交付成果，识别并规划下一批高优先级功能增强。本 PRD 覆盖 5 个功能点，按优先级分为 P0 (2)、P1 (2)、P2 (1)。

---

## 功能列表

| ID | 标题 | 类别 | 优先级 | 页面集成 |
|----|------|------|--------|----------|
| F001 | 全局键盘快捷键系统 | improvement | P0 | DDSCanvasPage |
| F002 | Canvas 导出增强（PDF + 图片） | improvement | P0 | DDSToolbar |
| F003 | Error Boundary 错误恢复 | bug | P1 | DDSCanvasPage / DashboardPage |
| F004 | User Preferences 持久化 | improvement | P1 | Settings Page |
| F005 | Design Token 主题系统 | improvement | P2 | 全局 ThemeProvider |

---

## 功能详设

### F001: 全局键盘快捷键系统

**关联提案**: P001

**DoD (Definition of Done)**:
- [ ] `useKeyboardShortcuts` Hook 单元测试覆盖率 > 80%
- [ ] Playwright E2E 测试验证每个快捷键行为
- [ ] Help overlay 显示所有可用快捷键
- [ ] 快捷键在画布 focus 时全局生效（非文本输入框时）
- [ ] `Ctrl+Z` undo 行为与 DDSToolbar Undo 按钮完全一致
- [ ] `Ctrl+Shift+Z` / `Ctrl+Y` redo 行为一致
- [ ] `Ctrl+N` 在当前画布新建默认类型节点
- [ ] `Ctrl+G` 触发代码生成（与 Generate 按钮行为一致）
- [ ] `Tab`/`Shift+Tab` 切换章节 Tab
- [ ] `Escape` 取消当前选择

**页面集成**:
- DDSCanvasPage: 全局快捷键容器
- DDSToolbar: Undo/Redo 快捷键绑定
- 需新建: `src/hooks/useKeyboardShortcuts.ts`
- 需新建: `src/components/shared/KeyboardHelpOverlay.tsx`

**Epic 拆分建议**:
- **Epic1**: 核心 Hook + Undo/Redo/Cancel 快捷键
- **Epic2**: Tab 切换 + Node 创建快捷键
- **Epic3**: Generate 快捷键 + Help overlay
- **Epic4**: E2E 测试覆盖 + 文档

**实现文件**:
- `vibex-fronted/src/hooks/useKeyboardShortcuts.ts` (新建)
- `vibex-fronted/src/components/shared/KeyboardHelpOverlay.tsx` (新建)
- `vibex-fronted/src/pages/DDSCanvasPage.tsx` (修改)

---

### F002: Canvas 导出增强（PDF + 图片）

**关联提案**: P002

**DoD (Definition of Done)**:
- [ ] `/api/export/pdf` 端点返回有效 PDF（含 Canvas 元数据 + 各 Chapter 内容）
- [ ] PNG 导出：Canvas 截图 → Blob → 下载，文件名 `canvas-{projectId}-{timestamp}.png`
- [ ] SVG 导出：Canvas DOM 序列化 → 下载，文件名 `canvas-{projectId}-{timestamp}.svg`
- [ ] DDSToolbar 导出菜单包含: JSON / Vibex / PDF / PNG / SVG 五项
- [ ] 导出 Loading 状态（按钮 loading spinner + 禁用状态）
- [ ] 导出错误提示（toast notification）
- [ ] 导出测试用例覆盖各格式

**页面集成**:
- DDSToolbar: 导出按钮下拉菜单
- 需修改: `src/hooks/useCanvasExport.ts`
- 需新建: `src/app/api/export/pdf/route.ts` (Cloudflare Workers)

**Epic 拆分建议**:
- **Epic1**: PNG/SVG 前端导出实现
- **Epic2**: PDF 后端 API 实现 + 集成
- **Epic3**: UI 集成 + Loading/Error 处理 + 测试

**实现文件**:
- `vibex-fronted/src/hooks/useCanvasExport.ts` (修改)
- `vibex-fronted/src/components/dds/toolbar/DDSToolbar.tsx` (修改)
- `vibex-backend/src/api/export/pdf.ts` (新建)

---

### F003: Error Boundary 错误恢复

**关联提案**: P003

**DoD (Definition of Done)**:
- [ ] `DDSCanvasPage` 外层包裹 Error Boundary，崩溃时显示友好 UI（非白屏）
- [ ] 错误 UI 包含：错误信息摘要 + 重试按钮 + 报告/反馈按钮
- [ ] 错误不影响其他正常 Tab（如 Dashboard）
- [ ] 错误日志 `console.error` 输出（含 stack trace + timestamp）
- [ ] 可选：错误上报到 `/api/telemetry/errors` 端点
- [ ] Playwright E2E 测试：模拟组件抛错，验证降级 UI 显示

**页面集成**:
- DDSCanvasPage: `app/dds/[projectId]/page.tsx`
- DashboardPage: `app/page.tsx`
- 需新建: `src/components/shared/ErrorBoundary.tsx`
- 需新建: `src/app/dds/[projectId]/error.tsx` (Next.js Error Boundary)

**Epic 拆分建议**:
- **Epic1**: ErrorBoundary 组件 + DDSCanvasPage 集成
- **Epic2**: DashboardPage 集成 + 重试逻辑
- **Epic3**: 错误上报 + E2E 测试

**实现文件**:
- `vibex-fronted/src/components/shared/ErrorBoundary.tsx` (新建)
- `vibex-fronted/src/app/dds/[projectId]/error.tsx` (新建)
- `vibex-fronted/src/app/error.tsx` (新建/修改)

---

### F004: User Preferences 持久化系统

**关联提案**: P004

**DoD (Definition of Done)**:
- [ ] `userPreferencesStore` (Zustand + localStorage)，初始化时从 localStorage 读取
- [ ] 偏好项：`theme` (light/dark/system)、`defaultTemplate`、`shortcutCustomization` (record<string, string>)
- [ ] Settings Page (`/settings`) UI，完整偏好管理界面
- [ ] 偏好随 Canvas 一起保存（Canvas 数据中包含 preferences 版本号）
- [ ] 首次访问时默认展示系统主题偏好
- [ ] Zustand store 单元测试 + Settings Page E2E 测试

**页面集成**:
- Settings Page: `app/settings/page.tsx` (新建)
- ThemeProvider 初始化逻辑
- 需新建: `src/stores/userPreferencesStore.ts`

**Epic 拆分建议**:
- **Epic1**: Zustand Store + localStorage persistence
- **Epic2**: Settings Page UI + theme 应用
- **Epic3**: defaultTemplate + shortcutCustomization + 测试

**实现文件**:
- `vibex-fronted/src/stores/userPreferencesStore.ts` (新建)
- `vibex-fronted/src/app/settings/page.tsx` (新建)
- `vibex-fronted/src/components/providers/ThemeProvider.tsx` (修改)

---

### F005: Design Token 主题系统

**关联提案**: P005

**DoD (Definition of Done)**:
- [ ] CSS Variable 动态注入机制（`document.documentElement.style.setProperty`）
- [ ] 预设主题：VibeX Default、Dark Mode、企业品牌 A、企业品牌 B
- [ ] ThemeProvider 在 Next.js App Router 正确嵌套（layout.tsx → ThemeProvider）
- [ ] 主题切换无白屏（CSS 变量覆盖，非页面刷新）
- [ ] 每个主题完整覆盖所有 design token 变量
- [ ] 视觉回归测试：5 个主题各截图对比

**页面集成**:
- 全局 ThemeProvider (layout.tsx)
- Settings Page 主题选择器
- 需修改: `src/styles/design-tokens.css`
- 需新建: `src/components/providers/ThemeProvider.tsx`

**Epic 拆分建议**:
- **Epic1**: ThemeProvider 架构 + 默认/Dark 两个主题
- **Epic2**: 企业品牌 A/B 主题 + 切换逻辑
- **Epic3**: Settings 集成 + 视觉回归测试

**实现文件**:
- `vibex-fronted/src/styles/design-tokens.css` (修改)
- `vibex-fronted/src/components/providers/ThemeProvider.tsx` (新建)
- `vibex-fronted/src/app/layout.tsx` (修改)

---

## Sprint 规划建议

**Sprint 37 建议范围**（基于工时评估）:

| 优先级 | 功能 | 建议 Epic 数 | 预估工时 |
|--------|------|-------------|----------|
| P0 | F001 全局快捷键 | 4 Epic | 2-3d |
| P0 | F002 导出增强 | 3 Epic | 3-4d |
| P1 | F003 Error Boundary | 3 Epic | 1d |
| P1 | F004 User Preferences | 3 Epic | 2d |
| P2 | F005 Design Token | 3 Epic | 2-3d |

**建议分两期交付**:
- **Sprint 37**: F001 (P0) + F002 (P0) — 核心效率提升
- **Sprint 38**: F003 + F004 + F005 — 体验完善

---

## 验收测试策略

- **单元测试**: Vitest，覆盖所有新 Hooks、Stores、工具函数
- **集成测试**: Vitest，覆盖组件逻辑
- **E2E 测试**: Playwright，覆盖 F001 快捷键、F002 导出、F003 降级
- **视觉回归**: 截图对比（F005 主题系统）

---

## 风险与依赖

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| html2canvas SSR 问题 | 中 | 使用 dynamic import 延迟加载 |
| PDF 后端部署 | 中 | Cloudflare Workers 快速上线 |
| 主题系统影响现有 UI | 低 | 先在分支验证，再合入 main |
