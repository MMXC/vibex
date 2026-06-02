# VibeX Sprint 55 — 提案分析报告

**Sprint**: Sprint 55
**日期**: 2026-06-02
**分析依据**: Sprint 53-54 (E1-E5) 交付物 CHANGELOG 回顾 + 遗留 gap 识别

---

## 提案总览

| ID | 优先级 | 功能名称 | 根因 | 影响 |
|----|--------|---------|------|------|
| P001 | P0 | 画布导出增强（PNG/SVG/JSON/YAML/PDF） | S54-E2 导入完成但无导出单个画布的 UI | 用户无法导出当前画布内容 |
| P002 | P1 | 批量导出进度 UI | S52-E2 有 ZipExporter 但无端到端进度反馈 | 批量导出体验缺失 |
| P003 | P1 | 多画布管理 Dashboard | S54 仅支持单画布，无多画布管理 UI | 无法管理多个画布 |
| P004 | P2 | 画布背景自定义 | 无背景颜色/图案/网格定制 | 画布视觉体验单调 |
| P005 | P2 | 键盘快捷键绑定激活 | S52-E5 配置系统完成但 Ctrl+Z/Y 未真正绑定 | Undo/Redo 快捷键不工作 |

---

## 提案详情

### P001 — 画布导出增强 [P0]

**问题**: S54-E2 实现了文件导入，但用户无法将当前画布导出为常用格式（PNG/SVG/JSON/YAML）。`useCanvasExport.ts` 和 `ZipExporter.ts` 存在但无 UI 集成。

**根因**: 导出基础设施存在（`html-to-image`、`jsPDF`、`jszip` 均已安装），缺少统一的 Export 菜单和 UI。

**影响**: 用户无法保存/分享画布内容，核心工作流断点。

**技术方案**:
- 新增 `ExportMenu.tsx` — DDSToolbar 下拉菜单，支持 PNG/SVG/JSON/YAML/PDF 导出
- `useCanvasExport.ts` 扩展：支持 `exportAsPNG()` / `exportAsSVG()` / `exportAsJSON()` / `exportAsYAML()` / `exportAsPDF()`
- PNG: `html-to-image` 的 `toPng()` → 直接下载
- SVG: `html-to-image` 的 `toSvg()` → 直接下载
- JSON/YAML: 序列化 `nodes`/`edges` → 格式化输出
- PDF: `html-to-image` → `jsPDF` A4 页面
- `ExportMenu.module.css` — cyberpunk 风格下拉菜单
- `DDSToolbar.tsx` — 新增 Export 图标按钮 + ExportMenu 挂载
- vitest: `useCanvasExport.test.ts` (5 format export, error handling)

**Acceptance Criteria**:
- DDSToolbar 有 Export 按钮，点击展开导出菜单
- 导出 PNG → 浏览器下载 PNG 文件
- 导出 SVG → 浏览器下载 SVG 文件
- 导出 JSON → 浏览器下载 canvas.json 文件
- 导出 YAML → 浏览器下载 canvas.yaml 文件
- 导出 PDF → 浏览器下载 canvas.pdf 文件（A4 格式）
- vitest useCanvasExport 12/12 通过

---

### P002 — 批量导出进度 UI [P1]

**问题**: S52-E2 的 `useBatchExport.ts` + `ExportProgress.tsx` 有部分实现，但批量导出端到端流程（选择画布 → 启动 → 进度 → 下载 ZIP）未打通。

**根因**: `BatchExportService` 存在但无画布选择 UI；ZIP 下载入口缺失。

**影响**: 用户无法批量导出多个画布并获得进度反馈。

**技术方案**:
- 新增 `BatchExportDialog.tsx` — 多选画布列表 + format 选择 + Start 按钮
- 扩展 `useBatchExport.ts`：`selectAllCanvases()` / `toggleCanvas(id)` / `exportZip()` → 下载 ZIP
- `ExportProgress.tsx` — 进度条 + 百分比 + 取消按钮（已有部分，需完善）
- `DDSToolbar` 集成 BatchExport 入口（ExportMenu 内 sub-menu 或单独按钮）
- vitest: `BatchExportDialog.test.tsx` (multi-select, progress, cancel)

**Acceptance Criteria**:
- BatchExportDialog 显示所有可导出画布列表
- 选择画布 + format → Start → 显示 ExportProgress
- 进度条正确反映导出进度（0-100%）
- 导出完成 → 自动下载 ZIP 文件
- 取消按钮中断导出
- vitest BatchExportDialog 8/8 通过

---

### P003 — 多画布管理 Dashboard [P1]

**问题**: S54 仅支持单画布编辑，用户无法在一个项目下管理多个画布（创建/切换/删除/重命名）。

**根因**: 画布数据存在 IndexedDB，但无多画布管理界面和路由。

**影响**: 用户无法组织多个相关画布，项目结构混乱。

**技术方案**:
- 新增 `CanvasDashboard.tsx` — 多画布管理页面，显示画布卡片列表（缩略图 + 名称 + 创建时间）
- `useCanvasList.ts` — 从 IndexedDB 查询画布列表 `canvasDB.listCanvases()`
- 新增 `CreateCanvasDialog.tsx` — 创建新画布（输入名称）
- `DDSCanvasPage.tsx` 工具栏 → 新增 "Dashboard" 按钮返回管理页面
- 路由：`/canvas/:canvasId` (已有) + `/canvas` (Dashboard)
- 重命名/删除画布：`canvasDB.updateCanvas()` / `canvasDB.deleteCanvas()`
- vitest: `CanvasDashboard.test.tsx` (列表渲染, create, delete)

**Acceptance Criteria**:
- Dashboard 显示所有画布卡片（缩略图 + 名称 + 创建时间）
- CreateCanvasDialog 创建新画布 → 自动跳转至新画布页面
- 删除画布 → 确认对话框 → 从 IndexedDB 删除
- 重命名画布 → 内联编辑 → 保存
- vitest CanvasDashboard 6/6 通过

---

### P004 — 画布背景自定义 [P2]

**问题**: 当前画布背景为纯色，无法自定义背景颜色、图案或网格样式。

**根因**: ReactFlow 的 `background` prop 仅支持默认 dot/solid，无法自定义。

**影响**: 画布视觉体验单调，缺乏个性化选项。

**技术方案**:
- 新增 `BackgroundSettingsPanel.tsx` — 背景设置面板（颜色选择 + 预设图案 + 透明度）
- `BackgroundSettingsPanel.module.css` — cyberpunk 风格设置面板
- `DDSToolbar` → 新增 "Background" 按钮打开设置面板
- 背景预设：`solid` (默认), `dots`, `lines`, `cross`, `custom-color`
- 自定义颜色：`react-colorful` 颜色选择器（已安装）
- vitest: `BackgroundSettingsPanel.test.tsx` (color picker, presets, apply)

**Acceptance Criteria**:
- BackgroundSettingsPanel 包含至少 5 种预设背景
- 自定义颜色可从颜色选择器拾取
- 预设切换 → 画布背景实时更新
- vitest BackgroundSettingsPanel 5/5 通过

---

### P005 — 键盘快捷键绑定激活 [P2]

**问题**: S52-E5 完成了 `shortcutStore.ts` 配置系统，但 `useKeyboardShortcuts.ts` 的 Ctrl+Z/Y 未真正绑定到对应 action（undo/redo）。

**根因**: `shortcutStore` 有 `undo()`/`redo()` actions，但 `useKeyboardShortcuts` 监听器未将 `ctrl+z`/`ctrl+y` 映射到 store actions。

**影响**: Undo/Redo 快捷键不工作，用户无法用快捷键撤销/重做。

**技术方案**:
- 修改 `useKeyboardShortcuts.ts` — 扩展 shortcut 监听，将 `ctrl+z` → `useShortcutStore.getState().undo()`，`ctrl+y` → `useShortcutStore.getState().redo()`
- `shortcutStore.ts` 已实现 `undo()`/`redo()` 方法（基于 `flowStore` 的 history stack）
- 新增 `useUndoRedo.ts` — 封装 undo/redo 逻辑（可在 Ctrl+Z/Y handler 中复用）
- vitest: `useKeyboardShortcuts.test.ts` — 添加 Ctrl+Z/Y 绑定测试

**Acceptance Criteria**:
- Ctrl+Z → 撤销最近一次画布操作
- Ctrl+Y → 重做最近一次撤销
- 快捷键冲突检测（当自定义快捷键与 Ctrl+Z/Y 冲突时显示警告）
- vitest useKeyboardShortcuts 50/82 通过（新增 4 个 undo/redo 测试）
