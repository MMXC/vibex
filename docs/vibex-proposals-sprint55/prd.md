# VibeX Sprint 55 — 产品需求文档 (PRD)

**Sprint**: Sprint 55
**日期**: 2026-06-02
**状态**: PM Review Complete

---

## 执行摘要

Sprint 55 围绕 VibeX 画布的**导出与多画布管理**展开，填补 Sprint 53-54 留下的核心功能缺口：

- **P001 (P0)**: 画布导出 UI — ExportMenu 支持 PNG/SVG/JSON/YAML/PDF 单画布导出
- **P002 (P1)**: 批量导出进度 UI — BatchExportDialog + ExportProgress 端到端流程
- **P003 (P1)**: 多画布管理 Dashboard — 画布列表/创建/删除/重命名
- **P004 (P2)**: 画布背景自定义 — 预设 + 自定义颜色
- **P005 (P2)**: 键盘快捷键激活 — Ctrl+Z/Y 绑定 undo/redo

---

## Epic-Story 映射

| Epic | 功能 | 类型 | 优先级 | 对应 Proposal |
|------|------|------|--------|--------------|
| E1 | 画布导出菜单 (ExportMenu) | Feature | P0 | P001 |
| E2 | 批量导出进度 UI (BatchExportDialog) | Feature | P1 | P002 |
| E3 | 多画布管理 Dashboard (CanvasDashboard) | Feature | P1 | P003 |
| E4 | 画布背景自定义 (BackgroundSettings) | Feature | P2 | P004 |
| E5 | 键盘快捷键激活 (Undo/Redo 绑定) | Bug Fix + Feature | P2 | P005 |

---

## Epic 详情

### E1: 画布导出菜单 (ExportMenu)

**文件变更**:
- 新增: `src/components/dds/export/ExportMenu.tsx`
- 新增: `src/components/dds/export/ExportMenu.module.css`
- 修改: `src/components/dds/toolbar/DDSToolbar.tsx` — 添加 Export 按钮
- 修改: `src/hooks/canvas/useCanvasExport.ts` — 扩展 exportAs* 方法
- 新增: `src/hooks/canvas/__tests__/useCanvasExport.test.ts`

**验收标准**:
- DDSToolbar 有 Export 图标按钮，点击展开下拉菜单
- PNG 导出 → 浏览器自动下载 `.png` 文件
- SVG 导出 → 浏览器自动下载 `.svg` 文件
- JSON 导出 → 浏览器自动下载 `canvas.json` 文件
- YAML 导出 → 浏览器自动下载 `canvas.yaml` 文件
- PDF 导出 → 浏览器自动下载 `canvas.pdf` 文件 (A4)
- `npx vitest run useCanvasExport.test.ts --reporter=verbose` 12/12 通过

---

### E2: 批量导出进度 UI (BatchExportDialog)

**文件变更**:
- 新增: `src/components/dds/export/BatchExportDialog.tsx`
- 新增: `src/components/dds/export/BatchExportDialog.module.css`
- 修改: `src/hooks/canvas/useBatchExport.ts` — 添加 selectAll/toggle/exportZip
- 新增: `src/components/dds/export/__tests__/BatchExportDialog.test.tsx`

**验收标准**:
- BatchExportDialog 展示所有可导出画布列表（多选框）
- 选择画布 + format → Start → ExportProgress 显示
- 进度条从 0% → 100% 实时更新
- 完成 → 浏览器自动下载 `.zip` 文件
- 取消 → 中断导出，进度归零
- `npx vitest run BatchExportDialog.test.tsx --reporter=verbose` 8/8 通过

---

### E3: 多画布管理 Dashboard (CanvasDashboard)

**文件变更**:
- 新增: `src/pages/canvas/index.tsx` (Dashboard 页面)
- 新增: `src/components/dds/canvas/CanvasDashboard.tsx`
- 新增: `src/components/dds/canvas/CanvasDashboard.module.css`
- 新增: `src/components/dds/canvas/CreateCanvasDialog.tsx`
- 新增: `src/components/dds/canvas/__tests__/CanvasDashboard.test.tsx`
- 修改: `DDSCanvasPage.tsx` — 添加 Dashboard 入口按钮

**验收标准**:
- `/canvas` 路由显示所有画布卡片（缩略图 + 名称 + 创建时间）
- 点击 "New Canvas" → CreateCanvasDialog → 创建后跳转至新画布
- 点击画布卡片 → 跳转至 `/canvas/:canvasId`
- 删除画布 → 二次确认 → IndexedDB 删除 → 列表更新
- 重命名 → 点击名称 → 内联编辑 → Enter 保存
- `npx vitest run CanvasDashboard.test.tsx --reporter=verbose` 6/6 通过

---

### E4: 画布背景自定义 (BackgroundSettings)

**文件变更**:
- 新增: `src/components/dds/background/BackgroundSettingsPanel.tsx`
- 新增: `src/components/dds/background/BackgroundSettingsPanel.module.css`
- 修改: `DDSToolbar.tsx` — 添加 Background 按钮
- 新增: `src/components/dds/background/__tests__/BackgroundSettingsPanel.test.tsx`

**验收标准**:
- BackgroundSettingsPanel 包含 5 种预设背景 (solid/dots/lines/cross/custom)
- 自定义颜色通过颜色选择器拾取
- 预设切换 → 画布背景立即更新
- 关闭面板 → 背景设置保持
- `npx vitest run BackgroundSettingsPanel.test.tsx --reporter=verbose` 5/5 通过

---

### E5: 键盘快捷键激活 (Undo/Redo 绑定)

**文件变更**:
- 修改: `src/hooks/canvas/useKeyboardShortcuts.ts` — 添加 Ctrl+Z/Y 映射
- 新增: `src/hooks/canvas/useUndoRedo.ts`
- 新增: `src/hooks/canvas/__tests__/useKeyboardShortcuts.test.ts` (undo/redo 绑定测试)

**验收标准**:
- Ctrl+Z → 画布撤销最近一次操作
- Ctrl+Y → 画布重做最近一次撤销
- 冲突快捷键显示 `role="alert"` 警告
- `npx vitest run useKeyboardShortcuts.test.ts --reporter=verbose` 新增 4 个 undo/redo 测试

---

## DoD (Definition of Done)

- [ ] 所有 5 个 Epic 代码已提交至 `origin/main`
- [ ] 每个 Epic 有对应的 vitest 测试文件且全部通过
- [ ] dual-CHANGELOG (根目录 + vibex-fronted) 均已更新 Sprint 55 条目
- [ ] 所有新 UI 组件符合 `DESIGN.md` cyberpunk 设计规范
- [ ] `pnpm build` 构建成功，无 TypeScript 错误
- [ ] E1-E3 导出相关功能在 Chromium + Firefox 手动测试通过

---

## 页面集成表

| 页面 | 路由 | 新增组件 |
|------|------|---------|
| Dashboard | `/canvas` | CanvasDashboard, CreateCanvasDialog |
| 画布编辑 | `/canvas/:canvasId` | ExportMenu, BatchExportDialog, BackgroundSettingsPanel |
| DDSToolbar | 全局 | Export 按钮, Background 按钮, Dashboard 按钮 |
