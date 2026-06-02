# VibeX Sprint 55 — 架构决策文档

**Sprint**: Sprint 55
**日期**: 2026-06-02
**状态**: Architect Review

---

## E1: 画布导出菜单 (ExportMenu)

### 现有状态
- `useCanvasExport.ts` 存在，支持 PNG/SVG/JSON/YAML 导出方法
- `html-to-image` 已安装
- DDSToolbar 存在，可扩展

### 需新增
- `ExportMenu.tsx` — 下拉菜单组件
- `ExportMenu.module.css` — cyberpunk 风格样式
- DDSToolbar 添加 Export 按钮
- PDF 导出方法（需新增 `exportAsPDF()`）

### 涉及组件
- `DDSToolbar.tsx` (修改)
- `ExportMenu.tsx` (新增)
- `useCanvasExport.ts` (修改)
- `ExportMenu.module.css` (新增)

### 架构决策
- ExportMenu 作为 DDSToolbar 子组件挂载，`isOpen` state 放在 ExportMenu 内部
- PDF 导出：先用 `html-to-image` 生成 PNG，再用 `jsPDF` 转为 A4 PDF
- 所有导出操作同步执行，不走 async queue（单画布导出体量小）

### 测试策略
- `useCanvasExport.test.ts` — 单元测试：5 种 format export 覆盖
- E2 集成测试覆盖 ExportMenu 组件行为

---

## E2: 批量导出进度 UI (BatchExportDialog)

### 现有状态
- `ZipExporter.ts` (S52) 存在，支持并发=3 的批量 PNG/SVG 导出
- `BatchExportService.ts` 存在
- `ExportProgress.tsx` 存在（部分实现）

### 需新增
- `BatchExportDialog.tsx` — 多选画布列表 dialog
- `BatchExportDialog.module.css` — dialog 样式
- `useBatchExport.ts` — 扩展 selectAll/selectNone/toggle/exportZip
- ExportMenu 或 DDSToolbar 添加 Batch Export 入口

### 涉及组件
- `BatchExportDialog.tsx` (新增)
- `BatchExportDialog.module.css` (新增)
- `useBatchExport.ts` (修改)
- `ExportProgress.tsx` (修改/完善)
- `ZipExporter.ts` (复用)
- `ExportMenu.tsx` (E1 产出，集成入口)

### 架构决策
- BatchExportDialog 使用 `Dialog` 原子组件（已在 design-tokens 中定义）
- ZipExporter 并发度保持 3，避免 IndexedDB 锁竞争
- Progress 通过 `useBatchExport` store 驱动，ExportProgress 订阅 store

### 测试策略
- `BatchExportDialog.test.tsx` — 多选、进度、取消场景覆盖

---

## E3: 多画布管理 Dashboard (CanvasDashboard)

### 现有状态
- IndexedDB `canvasDB` 存在（S54）
- `/canvas/:canvasId` 路由存在
- 单画布编辑功能完整

### 需新增
- `/canvas` 路由页面 → `src/pages/canvas/index.tsx`
- `CanvasDashboard.tsx` — 画布卡片列表
- `CanvasDashboard.module.css` — dashboard 样式
- `CreateCanvasDialog.tsx` — 创建画布 dialog
- DDSToolbar 添加 Dashboard 入口按钮

### 涉及组件
- `src/pages/canvas/index.tsx` (新增)
- `CanvasDashboard.tsx` (新增)
- `CanvasDashboard.module.css` (新增)
- `CreateCanvasDialog.tsx` (新增)
- `DDSToolbar.tsx` (修改 — Dashboard 按钮)

### 架构决策
- Dashboard 作为 Next.js 独立页面（`/canvas`），与 CanvasEditor (`/canvas/:canvasId`) 分离
- 画布缩略图：首屏渲染完成后截图，存入 IndexedDB `thumbnail` 字段
- 删除画布前需二次确认（避免误删）

### 测试策略
- `CanvasDashboard.test.tsx` — 列表渲染、创建、删除、重命名

---

## E4: 画布背景自定义 (BackgroundSettings)

### 现有状态
- ReactFlow `Background` 组件可用（`@xyflow/react`）
- `react-colorful` 颜色选择器已安装

### 需新增
- `BackgroundSettingsPanel.tsx` — 设置面板
- `BackgroundSettingsPanel.module.css` — 面板样式
- DDSToolbar 添加 Background 按钮

### 涉及组件
- `BackgroundSettingsPanel.tsx` (新增)
- `BackgroundSettingsPanel.module.css` (新增)
- `DDSToolbar.tsx` (修改)
- ReactFlow `Background` (复用)

### 架构决策
- BackgroundSettingsPanel 使用 `Panel` 原子组件，挂载于 DDSToolbar 右侧
- 预设背景通过 `variant` prop 控制 (dots/lines/cross/solid)
- 自定义颜色通过 `color` prop 传给 ReactFlow Background
- 设置存储于 `localStorage`（不需持久化到 IndexedDB）

### 测试策略
- `BackgroundSettingsPanel.test.tsx` — 预设切换、颜色拾取、应用

---

## E5: 键盘快捷键激活 (Undo/Redo 绑定)

### 现有状态
- `shortcutStore.ts` (S52) 存在，有 `undo()` / `redo()` actions
- `useKeyboardShortcuts.ts` 存在，监听键盘事件

### 需新增
- 修改 `useKeyboardShortcuts.ts` — 添加 Ctrl+Z/Y 监听 → store 调用
- `useUndoRedo.ts` — undo/redo 封装 hook
- `useKeyboardShortcuts.test.ts` — 新增 undo/redo 测试用例

### 涉及组件
- `useKeyboardShortcuts.ts` (修改)
- `useUndoRedo.ts` (新增)
- `shortcutStore.ts` (复用已有 undo/redo)
- `shortcutStore.test.ts` (复用已有测试)

### 架构决策
- `useKeyboardShortcuts` 添加 `ctrl+z` → `shortcutStore.undo()`，`ctrl+y` → `shortcutStore.redo()` 映射
- `useUndoRedo` 作为独立 hook，可被其他 consumer 复用
- 冲突检测：自定义快捷键覆盖默认时，`shortcutStore.conflicts.has('undo')` → 显示警告

### 测试策略
- `useKeyboardShortcuts.test.ts` — 新增 4 个 undo/redo 绑定测试用例
