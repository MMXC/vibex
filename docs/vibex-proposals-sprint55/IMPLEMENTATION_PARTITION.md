# VibeX Sprint 55 — Implementation Partition

**Sprint**: Sprint 55
**日期**: 2026-06-02

---

## E1: 画布导出菜单 (ExportMenu)

### 新增文件
| 文件路径 | 描述 | 类型 |
|---------|------|------|
| `src/components/dds/export/ExportMenu.tsx` | Export 下拉菜单组件 | 新增 |
| `src/components/dds/export/ExportMenu.module.css` | ExportMenu cyberpunk 样式 | 新增 |
| `src/hooks/canvas/__tests__/useCanvasExport.test.ts` | useCanvasExport 单元测试 | 新增 |

### 修改文件
| 文件路径 | 修改内容 |
|---------|---------|
| `src/components/dds/toolbar/DDSToolbar.tsx` | 添加 Export 图标按钮 + ExportMenu 挂载 |
| `src/hooks/canvas/useCanvasExport.ts` | 添加 `exportAsPDF()` 方法 |

### DoD Checklist
- [ ] DDSToolbar 有 Export 图标按钮，点击展开导出菜单
- [ ] PNG 导出：调用 `html-to-image toPng()` → `<a download>` 触发下载
- [ ] SVG 导出：调用 `html-to-image toSvg()` → `<a download>` 触发下载
- [ ] JSON 导出：序列化 nodes/edges → JSON.stringify → `<a download>`
- [ ] YAML 导出：序列化 nodes/edges → js-yaml dump → `<a download>`
- [ ] PDF 导出：`toPng()` → jsPDF A4 page → `<a download>`
- [ ] `vitest run useCanvasExport.test.ts` 12/12 通过
- [ ] DDSToolbar Export 按钮 cyberpunk 样式符合 DESIGN.md

---

## E2: 批量导出进度 UI (BatchExportDialog)

### 新增文件
| 文件路径 | 描述 | 类型 |
|---------|------|------|
| `src/components/dds/export/BatchExportDialog.tsx` | 批量导出 dialog | 新增 |
| `src/components/dds/export/BatchExportDialog.module.css` | BatchExportDialog 样式 | 新增 |
| `src/components/dds/export/__tests__/BatchExportDialog.test.tsx` | BatchExportDialog 测试 | 新增 |

### 修改文件
| 文件路径 | 修改内容 |
|---------|---------|
| `src/hooks/canvas/useBatchExport.ts` | 添加 selectAll/toggle/exportZip actions |
| `src/components/dds/export/ExportProgress.tsx` | 完善取消按钮和进度归零逻辑 |
| `src/components/dds/export/ExportMenu.tsx` (E1 产出) | 添加 Batch Export 子菜单 |

### DoD Checklist
- [ ] BatchExportDialog 显示所有画布列表（从 canvasDB.listCanvases()）
- [ ] 多选框支持：selectAll / selectNone / toggle(id)
- [ ] Start → 调用 `useBatchExport.exportZip()` → 启动进度
- [ ] ExportProgress 进度条 0→100% 实时更新
- [ ] 完成 → 自动下载 ZIP 文件（`ZipExporter.exportZip`）
- [ ] 取消按钮 → 中断导出，进度归零
- [ ] `vitest run BatchExportDialog.test.tsx` 8/8 通过

---

## E3: 多画布管理 Dashboard (CanvasDashboard)

### 新增文件
| 文件路径 | 描述 | 类型 |
|---------|------|------|
| `src/pages/canvas/index.tsx` | Dashboard 路由页面 | 新增 |
| `src/components/dds/canvas/CanvasDashboard.tsx` | 画布卡片列表组件 | 新增 |
| `src/components/dds/canvas/CanvasDashboard.module.css` | Dashboard 样式 | 新增 |
| `src/components/dds/canvas/CreateCanvasDialog.tsx` | 创建画布 dialog | 新增 |
| `src/components/dds/canvas/__tests__/CanvasDashboard.test.tsx` | Dashboard 测试 | 新增 |

### 修改文件
| 文件路径 | 修改内容 |
|---------|---------|
| `src/components/dds/toolbar/DDSCanvasPage.tsx` | DDSToolbar 添加 Dashboard 按钮 |
| `src/lib/canvas/canvasDB.ts` | 添加 `createCanvas()` / `updateCanvas()` / `deleteCanvas()` public API |

### DoD Checklist
- [ ] `/canvas` 路由显示所有画布卡片（缩略图 + 名称 + 创建时间）
- [ ] 点击 "New Canvas" → CreateCanvasDialog → 创建后跳转 `/canvas/:newId`
- [ ] 点击画布卡片 → 跳转 `/canvas/:canvasId`（已有行为复用）
- [ ] 删除画布 → `<dialog>` 确认框 → `canvasDB.deleteCanvas(id)` → 列表更新
- [ ] 重命名 → 双击名称 → `<input>` 内联编辑 → Enter 保存
- [ ] `vitest run CanvasDashboard.test.tsx` 6/6 通过

---

## E4: 画布背景自定义 (BackgroundSettings)

### 新增文件
| 文件路径 | 描述 | 类型 |
|---------|------|------|
| `src/components/dds/background/BackgroundSettingsPanel.tsx` | 背景设置面板 | 新增 |
| `src/components/dds/background/BackgroundSettingsPanel.module.css` | 面板样式 | 新增 |
| `src/components/dds/background/__tests__/BackgroundSettingsPanel.test.tsx` | 面板测试 | 新增 |

### 修改文件
| 文件路径 | 修改内容 |
|---------|---------|
| `src/components/dds/toolbar/DDSToolbar.tsx` | 添加 Background 设置按钮 |

### DoD Checklist
- [ ] BackgroundSettingsPanel 包含 5 种预设：solid / dots / lines / cross / custom-color
- [ ] 预设切换 → `variant` prop 更新 → ReactFlow Background 立即响应
- [ ] 自定义颜色：`react-colorful` HexColorPicker → `color` prop
- [ ] 面板关闭 → 背景设置通过 `localStorage` 持久化
- [ ] `vitest run BackgroundSettingsPanel.test.tsx` 5/5 通过

---

## E5: 键盘快捷键激活 (Undo/Redo 绑定)

### 新增文件
| 文件路径 | 描述 | 类型 |
|---------|------|------|
| `src/hooks/canvas/useUndoRedo.ts` | undo/redo 封装 hook | 新增 |

### 修改文件
| 文件路径 | 修改内容 |
|---------|---------|
| `src/hooks/canvas/useKeyboardShortcuts.ts` | 添加 Ctrl+Z/Y 监听 → store 调用 |
| `src/hooks/canvas/__tests__/useKeyboardShortcuts.test.ts` | 新增 undo/redo 测试用例 |

### DoD Checklist
- [ ] `useKeyboardShortcuts` 监听 `keydown`，`ctrl+z` → `shortcutStore.undo()`
- [ ] `ctrl+y` → `shortcutStore.redo()`
- [ ] 冲突检测：`shortcutStore.conflicts.has('undo')` → `role="alert"` 显示警告
- [ ] `vitest run useKeyboardShortcuts.test.ts` 新增 4 个 undo/redo 测试
- [ ] `shortcutStore.test.ts` 7/7 保持通过

---

## 验收标准 (Acceptance Criteria)

| Epic | 验收标准 | 测试命令 |
|------|---------|---------|
| E1 | ExportMenu 5 种格式全部可下载 | `vitest run useCanvasExport.test.ts` 12/12 |
| E2 | 批量导出进度 0→100%，完成后下载 ZIP | `vitest run BatchExportDialog.test.tsx` 8/8 |
| E3 | Dashboard 列表/创建/删除/重命名全部工作 | `vitest run CanvasDashboard.test.tsx` 6/6 |
| E4 | 5 种预设 + 自定义颜色，实时切换 | `vitest run BackgroundSettingsPanel.test.tsx` 5/5 |
| E5 | Ctrl+Z/Y 撤销/重做 + 冲突警告 | `vitest run useKeyboardShortcuts.test.ts` |
